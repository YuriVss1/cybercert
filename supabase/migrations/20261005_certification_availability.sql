-- ============================================================================
-- MIGRAÇÃO SUPABASE: CONTROLE DE DISPONIBILIDADE DE CERTIFICAÇÕES
-- Data: 2026-10-05
-- Fase: FLIGHT DECK ADMIN & CERTIFICATION LIFECYCLE
-- Descrição:
--   1. Adiciona coluna 'is_available' na tabela 'public.certifications' (DEFAULT true).
--   2. Inicializa CompTIA Security+ (SY0-701) como 'true' (ativa).
--   3. Inicializa Cisco CCNA (200-301) e Fortinet NSE 4 (NSE4) como 'false' (em preparação).
--   4. RLS: Leitura pública universal; mutação restrita a administradores via public.is_admin().
-- ============================================================================

-- 1. Adição da coluna de disponibilidade se não existir
ALTER TABLE public.certifications 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- 2. Estado canônico inicial de disponibilidade
UPDATE public.certifications 
SET is_available = true 
WHERE code = 'SY0-701';

UPDATE public.certifications 
SET is_available = false 
WHERE code IN ('200-301', 'NSE4');

-- 3. RLS para certifications
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Leitura pública para que usuários e visitantes visualizem o catálogo
DROP POLICY IF EXISTS "Public read certifications" ON public.certifications;
DROP POLICY IF EXISTS "Certifications are viewable by all" ON public.certifications;
CREATE POLICY "Certifications are viewable by all"
ON public.certifications FOR SELECT
TO anon, authenticated
USING (true);

-- Atualização restrita a administradores autorizados
DROP POLICY IF EXISTS "Admins can update certifications" ON public.certifications;
CREATE POLICY "Admins can update certifications"
ON public.certifications FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
