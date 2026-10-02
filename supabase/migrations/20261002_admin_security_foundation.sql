-- ============================================================================
-- MIGRAÇÃO SUPABASE: ADMIN SECURITY FOUNDATION & DATABASE HARDENING (CYBERCERT)
-- Data: 2026-10-02
-- Fase: ADMIN PHASE 2.1 — SECURITY FOUNDATION
-- Descrição:
--   1. Criação da tabela autoritativa relacional 'admin_users' (RBAC formal).
--   2. Redefinição segura de 'public.is_admin()' vinculada exclusivamente a 'admin_users'.
--   3. Hardening CRÍTICO de 'exam_history' com RLS estrito (bloqueio anônimo e isolamento por user_id).
--   4. Eliminação de 'user_metadata.role' e 'admin@rootsec.io' em 'skills' e 'question_skills'.
--   5. Fechamento de mutação não-autorizada em 'questions' (somente administradores).
--   6. Preservação integral do isolamento de 'user_question_attempts' (auth.uid() = user_id).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ESTRUTURA RELACIONAL ADMINISTRATIVA (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'auditor')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- RLS para admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and self can read admin_users" ON public.admin_users;
CREATE POLICY "Admins and self can read admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.admin_users au 
        WHERE au.user_id = auth.uid() AND au.role IN ('superadmin', 'admin')
    )
);

-- Apenas superadmin pode alterar a tabela admin_users
DROP POLICY IF EXISTS "Only superadmins can manage admin_users" ON public.admin_users;
CREATE POLICY "Only superadmins can manage admin_users"
ON public.admin_users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users au 
        WHERE au.user_id = auth.uid() AND au.role = 'superadmin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users au 
        WHERE au.user_id = auth.uid() AND au.role = 'superadmin'
    )
);

-- ----------------------------------------------------------------------------
-- 2. FUNÇÃO CANÔNICA DE AUTORIZAÇÃO ADMINISTRATIVA: public.is_admin()
-- ----------------------------------------------------------------------------
-- Substitui qualquer implementação pré-existente (sem versionamento ou com claims vulneráveis).
-- Utiliza busca relacional indexada em 'admin_users'. Retorna FALSE para anônimos e não-admins.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND role IN ('superadmin', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. HARDENING CRÍTICO: exam_history
-- ----------------------------------------------------------------------------
ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON public.exam_history(user_id);

-- Limpeza de políticas prévias / permissivas
DROP POLICY IF EXISTS "Public read exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Public insert exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Public update exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Public delete exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Public all exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Users can read own exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Users can insert own exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Only admins can update exam_history" ON public.exam_history;
DROP POLICY IF EXISTS "Only admins can delete exam_history" ON public.exam_history;

-- SELECT: Aluno lê apenas suas próprias provas; Administrador possui visão de auditoria
CREATE POLICY "Users can read own exam_history"
ON public.exam_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- INSERT: Aluno insere estritamente para o seu próprio user_id (preserva o finishExam do examStore)
CREATE POLICY "Users can insert own exam_history"
ON public.exam_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Proibido para usuários convencionais (imutabilidade do histórico). Permitido apenas a admins.
CREATE POLICY "Only admins can update exam_history"
ON public.exam_history FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Proibido para usuários convencionais. Permitido apenas a admins.
CREATE POLICY "Only admins can delete exam_history"
ON public.exam_history FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. HARDENING DE CONCEITOS E SKILLS: skills & question_skills
-- ----------------------------------------------------------------------------
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can modify skills" ON public.skills;
DROP POLICY IF EXISTS "Authenticated users can read skills" ON public.skills;

-- Leitura de skills para alunos autenticados
CREATE POLICY "Authenticated users can read skills"
ON public.skills FOR SELECT
TO authenticated
USING (true);

-- Modificação restrita estritamente ao RBAC (elimina user_metadata e email hardcoded)
CREATE POLICY "Only admins can modify skills"
ON public.skills FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- question_skills
DROP POLICY IF EXISTS "Authenticated users can read question_skills" ON public.question_skills;
DROP POLICY IF EXISTS "Only admins can modify question_skills" ON public.question_skills;

CREATE POLICY "Authenticated users can read question_skills"
ON public.question_skills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify question_skills"
ON public.question_skills FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. HARDENING DO REPOSITÓRIO DE QUESTÕES: questions
-- ----------------------------------------------------------------------------
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
DROP POLICY IF EXISTS "Only admins can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Only admins can update questions" ON public.questions;
DROP POLICY IF EXISTS "Only admins can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Only admins can modify questions" ON public.questions;

-- Leitura pública de questões para realização de simulados e treinos
CREATE POLICY "Anyone can read questions"
ON public.questions FOR SELECT
TO anon, authenticated
USING (true);

-- Inserção de novas questões restrita a administradores verificados pelo RBAC
CREATE POLICY "Only admins can insert questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Atualização de questões restrita a administradores
CREATE POLICY "Only admins can update questions"
ON public.questions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Exclusão de questões restrita a administradores
CREATE POLICY "Only admins can delete questions"
ON public.questions FOR DELETE
TO authenticated
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. AUDITORIA E PRESERVAÇÃO DE TENTATIVAS: user_question_attempts
-- ----------------------------------------------------------------------------
-- user_question_attempts já opera com RLS estrito (auth.uid() = user_id) definido na
-- migração 20260921_adaptive_learning.sql. Nenhuma alteração é aplicada aqui para
-- assegurar a não-regressão do Learning Engine e integridade do ledger append-only.
