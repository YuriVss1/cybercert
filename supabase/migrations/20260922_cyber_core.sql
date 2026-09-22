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
    difficulty TEXT NOT NULL CHECK (difficulty IN ('FOUNDATION', 'PRACTICE', 'APPLICATION', 'MASTERY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
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
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('calculate', 'build', 'identify', 'match', 'recall', 'simulate', 'sort', 'connect', 'trace', 'classify')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('FOUNDATION', 'PRACTICE', 'APPLICATION', 'MASTERY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
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

-- Leitura pública de conceitos e desafios para visitantes e autenticados
CREATE POLICY "Public read concepts" ON concepts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read prerequisites" ON concept_prerequisites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read challenges" ON concept_challenges FOR SELECT TO anon, authenticated USING (true);

-- Usuários gerenciam apenas seus próprios dados de domínio e tentativas
CREATE POLICY "Users can manage own concept mastery" ON user_concept_mastery FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read and insert own concept attempts" ON user_concept_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own review queue" ON review_queue FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Seed Inicial: Cat�logo Multidisciplinar (33 Conceitos em 8 Categorias)
INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('osi-model', 'Modelo OSI (Open Systems Interconnection)', 'NETWORKING', 'BEGINNER', 'As 7 camadas conceituais de comunicação de rede, desde o meio físico até a interface com o usuário final.', 'O Modelo OSI padronizou a comunicação de redes em 7 camadas modulares independentes: Física (1), Enlace (2), Rede (3), Transporte (4), Sessão (5), Apresentação (6) e Aplicação (7). Cada camada encapsula os dados da camada superior com cabeçalhos específicos (PDU: Bit, Quadro/Frame, Pacote, Segmento, Dados).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('tcp-ip-model', 'Pilha de Protocolos TCP/IP', 'NETWORKING', 'BEGINNER', 'O modelo prático de 4 camadas utilizado operacionalmente em toda a arquitetura da Internet moderna.', 'Diferente das 7 camadas teóricas do OSI, a arquitetura da Internet adota a pilha TCP/IP (RFC 1122) com 4 camadas práticas: Acesso à Rede (Link), Internet (IP/ICMP/ARP), Transporte (TCP/UDP) e Aplicação (HTTP, DNS, SSH, TLS).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('ipv4-fundamentals', 'IPv4 & Estrutura de Endereçamento', 'NETWORKING', 'BEGINNER', 'Estrutura dos 32 bits, divisão em 4 octetos, blocos privados RFC 1918 e conversão binária para decimal.', 'O protocolo IPv4 utiliza endereços de 32 bits expressos em quatro octetos separados por pontos (ex: 192.168.1.1). Cada octeto varia de 0 a 255.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('ipv6-fundamentals', 'IPv6: Endereçamento de 128 Bits', 'NETWORKING', 'BEGINNER', 'Estrutura hexadecimal de 128 bits, regras de compressão de zeros, Link-Local e eliminação do broadcast nativo.', 'Criado para resolver o esgotamento do IPv4, o IPv6 oferece 128 bits de endereçamento representados em 8 grupos de 4 dígitos hexadecimais (hextetos) separados por dois pontos (ex: 2001:0db8:85a3::8a2e:0370:7334).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('mac-address', 'Endereço Físico MAC (Media Access Control)', 'NETWORKING', 'BEGINNER', 'Identificador único de 48 bits gravado na placa de rede, divisão em OUI do fabricante e número de série da interface.', 'O MAC Address é o identificador físico de 48 bits (6 bytes) gravado na NIC (Network Interface Card). Opera na Camada 2 e é composto por 24 bits de OUI (identificador do fabricante) e 24 bits atribuídos pelo fabricante.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('network-ports', 'Portas Lógicas de Transporte & Serviços Well-Known', 'NETWORKING', 'BEGINNER', 'Identificação de processos de aplicação via portas de 0 a 65535: Well-Known (0-1023), Registradas e Dinâmicas/Efêmeras.', 'As portas lógicas (Layer 4) permitem que um único endereço IP execute dezenas de serviços concorrentes sem colisão. O número da porta varia de 0 a 65535 (campo de 16 bits no cabeçalho TCP e UDP).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('tcp-vs-udp', 'Camada de Transporte: TCP vs UDP', 'NETWORKING', 'BEGINNER', 'Confiabilidade, handshake e controle de fluxo vs baixa latência e transmissão em tempo real.', 'TCP e UDP operam na Camada 4. O TCP prioriza integridade, retransmissão e ordenação via handshake. O UDP prioriza baixa latência e overhead mínimo (apenas 8 bytes de cabeçalho).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('arp-resolution', 'Protocolo ARP (Address Resolution Protocol)', 'NETWORKING', 'BEGINNER', 'Mapeamento dinâmico entre endereços lógicos IPv4 (Camada 3) e endereços físicos MAC (Camada 2) na rede local.', 'Para que dois nós da mesma rede IP conversem via Ethernet, o remetente precisa do MAC do destinatário. O protocolo ARP resolve essa correspondência disparando um broadcast "Quem tem o IP X? Responda para Y".')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('dhcp-dora', 'DHCP & Ciclo DORA de Configuração Automática', 'NETWORKING', 'BEGINNER', 'Distribuição dinâmica de parâmetros de rede (IP, Máscara, Gateway, DNS) através dos 4 passos DORA.', 'O DHCP (Dynamic Host Configuration Protocol) automatiza a atribuição de rede em clientes através do processo de 4 vias DORA: Discover, Offer, Request e Acknowledge, operando sobre UDP 67 (Servidor) e UDP 68 (Cliente).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('subnetting-cidr', 'Divisão de Redes (Subnetting & CIDR)', 'NETWORKING', 'INTERMEDIATE', 'Compreenda a partição de blocos IPv4, cálculo de máscaras, hosts úteis e fronteiras de broadcast através de manipulação direta.', 'Uma rede IPv4 /24 possui 256 endereços totais. Ao aumentar o comprimento do prefixo para /26, "emprestamos" 2 bits da porção de hosts para a porção de rede, particionando o bloco original em 4 sub-redes independentes de 64 endereços cada.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('tcp-3way-handshake', 'TCP 3-Way Handshake: Estabelecimento de Sessão', 'NETWORKING', 'INTERMEDIATE', 'Sequência de flags SYN, SYN-ACK e ACK, sincronização de números de sequência (ISN) e estados de socket.', 'Antes de transmitir dados, o TCP estabelece uma conexão bidirecional confiável através de uma troca de três mensagens entre cliente e servidor.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('dns-resolution', 'Sistema de Nomes de Domínio (DNS)', 'NETWORKING', 'INTERMEDIATE', 'Resolução hierárquica recursiva e iterativa: Root servers, TLD servers e Servidores Autoritativos.', 'O DNS atua como o catálogo telefônico da internet, traduzindo nomes de domínio legíveis por humanos (ex: api.rootsec.io) para endereços IP operacionais.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('vlan-segmentation', 'Segmentação L2 com VLANs (802.1Q)', 'NETWORKING', 'INTERMEDIATE', 'Isolamento de domínios de broadcast em switches, portas Access vs Trunk e marcação de tags IEEE 802.1Q.', 'Uma VLAN (Virtual Local Area Network) divide um switch físico em múltiplos domínios de broadcast isolados. O tráfego entre diferentes VLANs exige obrigatoriamente um roteador ou Switch L3 (Inter-VLAN Routing).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('cia-triad', 'Tríade CIA: Confidencialidade, Integridade & Disponibilidade', 'CYBERSECURITY', 'BEGINNER', 'O modelo nuclear que orienta toda política de segurança da informação, avaliação de riscos e controles técnicos.', 'A Tríade CIA é a pedra angular da segurança. Confidencialidade garante que apenas partes autorizadas leiam os dados; Integridade garante que os dados não foram alterados indevidamente; Disponibilidade garante que sistemas e dados estejam acessíveis quando necessários.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('least-privilege', 'Princípio do Menor Privilégio (PoLP)', 'CYBERSECURITY', 'BEGINNER', 'Concessão exclusiva dos privilégios mínimos necessários para a execução de uma tarefa legítima, reduzindo a superfície de dano.', 'O Princípio do Menor Privilégio dita que usuários, processos e serviços devem receber apenas os acessos estritamente necessários para desempenhar sua função durante o menor tempo possível (Just-In-Time access).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('defense-in-depth', 'Defesa em Profundidade (Camadas de Proteção)', 'CYBERSECURITY', 'BEGINNER', 'Implementação de múltiplos controles defensivos em série (Perímetro, Rede, Host, Aplicação e Dados) para evitar ponto único de falha.', 'Defesa em Profundidade assume que nenhum controle de segurança individual é infalível. Uma arquitetura robusta combina camadas complementares: Firewall de Perímetro, Segmentação L2/L3, EDR no endpoint, MFA na identidade e criptografia em repouso.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('firewall-acl', 'Controle de Acesso em Firewall (ACL & First Match Wins)', 'CYBERSECURITY', 'INTERMEDIATE', 'Construção de listas de regras de tráfego, ordem de precedência, avaliação top-down e o deny implícito.', 'Firewalls filtram pacotes com base em regras direcionais que associam Origem, Destino, Porta, Protocolo e Ação (ALLOW ou DENY). A regra mais importante de firewalls é o "First Match Wins": a primeira regra coincidente define a decisão.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('incident-response-lifecycle', 'Ciclo de Vida de Resposta a Incidentes (NIST SP 800-61)', 'CYBERSECURITY', 'INTERMEDIATE', 'As 6 fases estruturadas para lidar com violações: Preparação, Identificação, Contenção, Erradicação, Recuperação e Lições Aprendidas.', 'O NIST SP 800-61 define o padrão internacional para resposta a incidentes. A execução ordenada impede que atacantes destruam evidências ou reinfectem sistemas recém-restaurados.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('mitre-attack-framework', 'MITRE ATT&CK: Matriz de Táticas, Técnicas e Procedimentos (TTPs)', 'CYBERSECURITY', 'INTERMEDIATE', 'Base de conhecimento taxonômica global que cataloga comportamentos reais de adversários em fases cronológicas de ataque.', 'O MITRE ATT&CK divide as invasões em Táticas (o objetivo do atacante, ex: Movimentação Lateral) e Técnicas (como o atacante realiza o objetivo, ex: Pass the Hash).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('encoding-encryption-hash', 'Encoding vs Hashing vs Criptografia', 'CRYPTOGRAPHY', 'BEGINNER', 'Diferenciação conceitual estrita: transformação de formato (Base64) vs via de mão única (SHA-256) vs confidencialidade reversível por chave (AES/RSA).', 'Confundir estes três conceitos é uma das maiores fontes de vulnerabilidade. Encoding altera apenas a representação dos dados (sem segurança); Hashing gera um resumo unidirecional de tamanho fixo; Criptografia transforma texto claro em texto cifrado usando uma chave secreta.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('symmetric-vs-asymmetric', 'Criptografia Simétrica vs Assimétrica', 'CRYPTOGRAPHY', 'BEGINNER', 'Chave única compartilhada (AES) vs par de chaves pública e privada (RSA, ECC), e o modelo híbrido utilizado no TLS.', 'A criptografia simétrica utiliza a mesma chave para cifrar e decifrar (extremamente rápida, ideal para grandes volumes de dados). A assimétrica utiliza um par de chaves matematicamente vinculadas: chave pública (aberta) e chave privada (secreta).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('pki-certificate-chain', 'PKI & Cadeia de Confiança de Certificados (X.509)', 'CRYPTOGRAPHY', 'INTERMEDIATE', 'Estruturação hierárquica de certificados digitais: Root CA auto-assinada, Intermediate CA emissora e Certificado de Servidor.', 'Uma PKI (Public Key Infrastructure) resolve o problema de validar se uma chave pública pertence realmente a quem alega pertencer. Uma Autoridade Certificadora (CA) assina digitalmente o certificado digital X.509 atestando essa identidade.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('authentication-vs-authorization', 'Autenticação (AuthN) vs Autorização (AuthZ)', 'IDENTITY', 'BEGINNER', 'Verificação inequívoca da identidade de um sujeito versus concessão explícita de permissões para agir sobre recursos.', 'Autenticação (AuthN) responde à pergunta "Quem é você?" validando credenciais (senhas, certificados, biometria). Autorização (AuthZ) responde à pergunta "O que você tem permissão para fazer?" validando políticas e papéis atribuídos.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('rbac-role-based-access', 'Controle de Acesso Baseado em Papéis (RBAC)', 'IDENTITY', 'BEGINNER', 'Atribuição de permissões a funções de trabalho (Roles) em vez de diretamente a usuários individuais, simplificando governança.', 'RBAC (Role-Based Access Control) agrupa permissões em "Papéis" (Roles) que representam atribuições funcionais na organização. Os usuários são vinculados a papéis, herdando suas políticas.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('kerberos-auth-flow', 'Autenticação Kerberos: O Mecanismo Central do Active Directory', 'IDENTITY', 'INTERMEDIATE', 'Troca de bilhetes seguros baseados em criptografia simétrica: AS-REQ/REP (TGT), TGS-REQ/REP e AP-REQ para serviços.', 'O Kerberos é o protocolo de autenticação padrão do Microsoft Windows Active Directory. Ele elimina o envio de senhas na rede utilizando tickets criptografados emitidos pelo KDC (Key Distribution Center).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('cloud-shared-responsibility', 'Modelo de Responsabilidade Compartilhada na Nuvem', 'CLOUD', 'BEGINNER', 'Demarcação das fronteiras de segurança entre Provedor de Nuvem (Segurança DA Nuvem) e Cliente (Segurança NA Nuvem) em IaaS, PaaS e SaaS.', 'Na computação em nuvem, a segurança é uma responsabilidade dividida. O provedor protege a infraestrutura física, data centers e hipervisores (Segurança DA Nuvem). O cliente protege seus dados, identidades, configurações de firewall e sistemas operacionais (Segurança NA Nuvem).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('cloud-iam-permissions', 'Políticas Cloud IAM & Mecanismo de Avaliação', 'CLOUD', 'INTERMEDIATE', 'Declarações JSON de controle de acesso (Principal, Action, Resource, Effect, Condition) e a precedência absoluta de Explicit Deny.', 'No Cloud IAM, todas as requisições de API iniciam com um "Default Deny". O mecanismo de avaliação examina políticas atreladas à identidade e ao recurso, onde qualquer "Explicit Deny" sobrepõe imediatamente qualquer declaração de "Allow".')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('event-vs-log-vs-alert-vs-incident', 'Taxonomia de SOC: Evento vs Log vs Alerta vs Incidente', 'SOC', 'BEGINNER', 'Diferenciação operacional do pipeline de monitoramento: registros brutos até a confirmação de impacto de segurança real.', 'No SOC, entender a pirâmide de telemetria evita fadiga de alertas: um Log é o registro bruto de um evento; um Alerta é a sinalização de um evento incomum por uma regra de detecção; um Incidente é a confirmação de que um alerta causou ou pode causar impacto real à segurança.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('siem-log-correlation', 'Correlação de Logs no SIEM (Security Information & Event Management)', 'SOC', 'INTERMEDIATE', 'Agregação centralizada de telemetria e relacionamento cronológico de logs heterogêneos para revelar cadeias completas de ataque.', 'O SIEM ingere logs de dezenas de fontes (Firewall, Active Directory, EDR, DNS, Proxy) e correlaciona eventos através de regras analíticas temporais e causais para expor ataques multi-estágio que passariam desapercebidos de forma isolada.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('linux-file-permissions', 'Permissões POSIX do Linux (Modo Octal & Simbólico)', 'LINUX', 'BEGINNER', 'Cálculo dos bits r (4), w (2), x (1) para Owner, Group e Others, comando chmod e implicações de segurança como permissões 777.', 'No Linux, cada arquivo e diretório possui um conjunto de permissões atribuídas a três entidades: Usuário Dono (u), Grupo (g) e Outros (o). A representação octal soma valores binários: Leitura r=4, Escrita w=2 e Execução x=1.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('linux-privilege-escalation-suid', 'Bit SUID (SetUID) & Escalonamento de Privilégios no Linux', 'LINUX', 'ADVANCED', 'Mecanismo que executa binários com privilégios do proprietário (root) e técnicas de abuso para ganho de shell administrativa.', 'O bit SUID (SetUID, representado pela letra "s" nas permissões do dono, ex: -rwsr-xr-x) faz com que um programa seja executado com as permissões do dono do arquivo (geralmente root) em vez das permissões do usuário que o invocou (ex: /usr/bin/passwd).')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('windows-event-analysis', 'Análise de Logs de Eventos do Windows (Security Event IDs)', 'WINDOWS', 'INTERMEDIATE', 'Identificação forense de atividade maliciosa através dos principais Event IDs: 4624 (Logon), 4625 (Falha), 4688 (Processos) e 7045 (Serviços).', 'O Windows registra eventos de auditoria no Security Log. Cada Event ID possui parâmetros cruciais como Logon Type (2=Console, 3=Rede SMB, 10=RDP) e linha de comando de novos processos.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;

INSERT INTO concepts (slug, title, category, difficulty, short_description, explanation)
VALUES ('active-directory-domain-controller', 'Active Directory & Domain Controllers (AD DS)', 'WINDOWS', 'INTERMEDIATE', 'O serviço de diretório corporativo do Windows: florestas, domínios, replicação de banco NTDS.dit e protocolo LDAP/Kerberos.', 'O Active Directory Domain Services (AD DS) gerencia identidades, políticas (GPO) e permissões de forma centralizada em redes corporativas Windows.')
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  short_description = EXCLUDED.short_description,
  explanation = EXCLUDED.explanation;
