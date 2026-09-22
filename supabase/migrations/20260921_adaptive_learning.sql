-- ============================================================================
-- MIGRAÇÃO SUPABASE: APRENDIZAGEM ADAPTATIVA & LEARNING ENGINE (CYBERCERT)
-- Data: 2026-09-21
-- Descrição: Tabelas para Skills, Tentativas Granulares e Governança de Questões
-- ============================================================================

-- 1. Extensão de colunas na tabela 'questions' (compatibilidade e governança)
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'approved';

-- 2. Tabela de Conceitos Técnicos (Skills)
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cert_id, slug)
);

-- 3. Tabela associativa entre Questões e Skills
CREATE TABLE IF NOT EXISTS question_skills (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (question_id, skill_id)
);

-- 4. Tabela de Tentativas Granulares de Questões (alimenta o Learning Engine)
CREATE TABLE IF NOT EXISTS user_question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    cert_id UUID REFERENCES certifications(id) ON DELETE SET NULL,
    exam_history_id UUID REFERENCES exam_history(id) ON DELETE SET NULL,
    domain TEXT,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence_level TEXT CHECK (confidence_level IN ('knew_concept', 'had_doubt', 'guessed', 'confused', 'interpretation_error', 'did_not_know')),
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_uqa_user_cert ON user_question_attempts(user_id, cert_id);
CREATE INDEX IF NOT EXISTS idx_uqa_question ON user_question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_uqa_exam_history ON user_question_attempts(exam_history_id);
CREATE INDEX IF NOT EXISTS idx_uqa_domain ON user_question_attempts(domain);
CREATE INDEX IF NOT EXISTS idx_uqa_created_at ON user_question_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_cert ON skills(cert_id);

-- 6. Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_skills ENABLE ROW LEVEL SECURITY;

-- Usuários só podem ler suas próprias tentativas
CREATE POLICY "Users can read own attempts" 
ON user_question_attempts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Usuários só podem inserir suas próprias tentativas (ledger append-only: sem UPDATE/DELETE por usuários)
CREATE POLICY "Users can insert own attempts" 
ON user_question_attempts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Todos os usuários autenticados podem consultar a biblioteca de skills
CREATE POLICY "Authenticated users can read skills" 
ON skills FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can read question_skills" 
ON question_skills FOR SELECT 
TO authenticated 
USING (true);

-- Apenas administradores podem gerenciar skills
CREATE POLICY "Only admins can modify skills" 
ON skills FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'email') = 'admin@rootsec.io'
);

-- 7. Seed de Skills Técnicas Essenciais para CompTIA Security+ (SY0-701)
DO $$
DECLARE
    sec_cert_id UUID;
BEGIN
    SELECT id INTO sec_cert_id FROM certifications WHERE code = 'SY0-701' LIMIT 1;
    IF sec_cert_id IS NOT NULL THEN
        INSERT INTO skills (cert_id, name, slug, description)
        VALUES 
            (sec_cert_id, 'IAM & Acesso Privilegiado', 'iam-privileged-access', 'Gestão de identidades, MFA, JIT e menor privilégio'),
            (sec_cert_id, 'Firewall & ACLs', 'firewall-acls', 'Regras de filtragem, inspeção e segmentação de pacotes'),
            (sec_cert_id, 'Criptografia & TLS', 'cryptography-tls', 'Algoritmos assimétricos, simétricos, PKI e proteção em trânsito'),
            (sec_cert_id, 'Resposta a Incidentes', 'incident-response', 'Fases de contenção, erradicação, recuperação e forense'),
            (sec_cert_id, 'Ameaças & Vulnerabilidades', 'threats-vulnerabilities', 'Análise CVSS, exploração de falhas e inteligência de ameaças')
        ON CONFLICT (cert_id, slug) DO NOTHING;
    END IF;
END $$;

-- 8. Função RPC atômica para upvotes em comentários (prevenção de concorrência)
CREATE OR REPLACE FUNCTION increment_comment_upvote(target_comment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE question_comments
    SET upvotes = COALESCE(upvotes, 0) + 1
    WHERE id = target_comment_id;
END;
$$;

-- 9. Políticas de Segurança para Comentários (Fórum)
ALTER TABLE IF EXISTS question_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'question_comments' AND policyname = 'Anyone authenticated can read comments'
    ) THEN
        CREATE POLICY "Anyone authenticated can read comments" 
        ON question_comments FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'question_comments' AND policyname = 'Users can insert own comments'
    ) THEN
        CREATE POLICY "Users can insert own comments" 
        ON question_comments FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

