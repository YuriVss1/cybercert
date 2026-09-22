-- ============================================================================
-- MIGRAÇÃO SUPABASE: CYBER CORE (MÓDULO DE APRENDIZAGEM CONCEITUAL & INTERATIVA)
-- Data: 2026-09-22
-- Descrição: Estrutura para Conceitos, Desafios, Evidência de Domínio e Fila de Revisão
-- ============================================================================

-- 1. Tabela de Conceitos Fundamentais
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('NETWORKING', 'CYBERSECURITY', 'CRYPTOGRAPHY', 'IDENTITY', 'CLOUD', 'SOC', 'LINUX', 'WINDOWS')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('FOUNDATION', 'PRACTICE', 'APPLICATION', 'MASTERY')),
    short_description TEXT NOT NULL,
    explanation TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Pré-requisitos entre Conceitos (Grafo Pedagógico)
CREATE TABLE IF NOT EXISTS concept_prerequisites (
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    prerequisite_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    PRIMARY KEY (concept_id, prerequisite_concept_id)
);

-- 3. Tabela de Desafios Específicos por Conceito
CREATE TABLE IF NOT EXISTS concept_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('calculate', 'build', 'identify', 'match', 'recall', 'simulate')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('FOUNDATION', 'PRACTICE', 'APPLICATION', 'MASTERY')),
    prompt TEXT NOT NULL,
    hint TEXT,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    solution JSONB DEFAULT '{}'::jsonb NOT NULL,
    explanation TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Evidência de Domínio do Usuário (Mastery & Spaced Repetition)
CREATE TABLE IF NOT EXISTS user_concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE NOT NULL,
    accuracy INTEGER DEFAULT 0 NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    confidence_rate INTEGER DEFAULT 0 NOT NULL,
    total_attempts INTEGER DEFAULT 0 NOT NULL,
    successful_retrievals INTEGER DEFAULT 0 NOT NULL,
    challenge_diversity INTEGER DEFAULT 0 NOT NULL,
    last_review_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    review_interval_days INTEGER DEFAULT 1 NOT NULL,
    retention_state TEXT DEFAULT 'NOT_STARTED' CHECK (retention_state IN ('NOT_STARTED', 'IN_DEVELOPMENT', 'CONSOLIDATED', 'MASTERED')),
    consecutive_correct INTEGER DEFAULT 0 NOT NULL,
    stage_progress JSONB DEFAULT '{"learnCompleted": false, "interactCompleted": false, "practiceCompleted": false, "testCompleted": false}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, concept_id)
);

-- 5. Tabela de Tentativas Granulares de Desafios do Core (Auditoria e Ledger de Eventos)
CREATE TABLE IF NOT EXISTS user_concept_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES concept_challenges(id) ON DELETE SET NULL,
    challenge_type TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('CONFIDENT', 'HESITANT', 'DID_NOT_KNOW')),
    duration_ms INTEGER DEFAULT 0 NOT NULL,
    submitted_answer JSONB NOT NULL,
    feedback_given TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela da Fila de Revisão Inteligente
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('ERROR', 'DOUBT', 'GUESSED', 'SCHEDULED', 'LOW_RETENTION', 'INCONSISTENT', 'DID_NOT_KNOW')),
    priority INTEGER DEFAULT 3 NOT NULL, -- 1 (urgente/did_not_know) a 5 (regular)
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, concept_id)
);

-- 7. Índices de Otimização e Performance
CREATE INDEX IF NOT EXISTS idx_concept_slug ON concepts(slug);
CREATE INDEX IF NOT EXISTS idx_concept_category ON concepts(category);
CREATE INDEX IF NOT EXISTS idx_challenges_concept ON concept_challenges(concept_id);
CREATE INDEX IF NOT EXISTS idx_mastery_user ON user_concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_state ON user_concept_mastery(retention_state);
CREATE INDEX IF NOT EXISTS idx_attempts_user_concept ON user_concept_attempts(user_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON review_queue(user_id, due_at, status);

-- 8. Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

-- Leitura pública de conceitos e desafios para usuários autenticados
CREATE POLICY "Authenticated users can read concepts" ON concepts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read prerequisites" ON concept_prerequisites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read challenges" ON concept_challenges FOR SELECT TO authenticated USING (true);

-- Usuários gerenciam apenas seus próprios dados de domínio e tentativas
CREATE POLICY "Users can manage own concept mastery" ON user_concept_mastery FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read and insert own concept attempts" ON user_concept_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own review queue" ON review_queue FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Seed Inicial: Conceito de Referência (Subnetting / CIDR)
INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES (
    'subnetting-cidr',
    'Divisão de Redes (Subnetting & CIDR)',
    'NETWORKING',
    'FOUNDATION',
    'Compreenda a partição de blocos IPv4, cálculo de máscaras, hosts úteis e fronteiras de broadcast através de manipulação direta.',
    'Uma rede IPv4 /24 possui 256 endereços totais. Ao aumentar o comprimento do prefixo para /26, emprestamos 2 bits da porção de hosts para a porção de rede, particionando o bloco original em 4 sub-redes independentes de 64 endereços cada.'
) ON CONFLICT (slug) DO NOTHING;
