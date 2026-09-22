// ============================================================================
// CYBER CORE: CATÁLOGO DE CONCEITOS E LABORATÓRIOS DIDÁTICOS
// ============================================================================

import type { CyberConcept } from './cyberCoreTypes';

export const CYBER_CONCEPTS_CATALOG: CyberConcept[] = [
  // --------------------------------------------------------------------------
  // 1. CONCEITO DE REFERÊNCIA: NETWORKING → SUBNETTING / CIDR
  // --------------------------------------------------------------------------
  {
    id: 'core-net-subnetting',
    slug: 'subnetting-cidr',
    title: 'Divisão de Redes (Subnetting & CIDR)',
    category: 'NETWORKING',
    level: 'FOUNDATION',
    shortDescription: 'Compreenda a partição de blocos IPv4, cálculo de máscaras, hosts úteis e fronteiras de broadcast através de manipulação direta.',
    prerequisiteSlugs: ['ipv4-fundamentals'],
    learningContent: {
      overview: 'Uma rede IPv4 /24 possui 256 endereços totais. Ao aumentar o comprimento do prefixo para /26, "emprestamos" 2 bits da porção de hosts para a porção de rede, particionando o bloco original em 4 sub-redes independentes de 64 endereços cada.',
      keyPoints: [
        'A notação CIDR (/24, /26, /28) define quantos bits pertencem à rede e quantos sobram para hosts.',
        'Em qualquer sub-rede, o primeiro endereço é a Rede (Network) e o último é o Broadcast. Ambos não podem ser atribuídos a hosts.',
        'Capacidade de hosts úteis = 2^(32 - prefixo) - 2.',
        'Cada aumento de +1 no prefixo divide o bloco de endereços pela metade (2x mais sub-redes, metade dos hosts por sub-rede).'
      ],
      visualComparison: {
        beforeLabel: 'Rede Original (/24)',
        beforeValue: '192.168.10.0 ───────────────────────── 192.168.10.255 (254 hosts úteis)',
        afterLabel: 'Divisão em 4 Sub-redes (/26)',
        afterValue: 'Sub 1: .0 a .63 | Sub 2: .64 a .127 | Sub 3: .128 a .191 | Sub 4: .192 a .255'
      }
    },
    challenges: [
      {
        id: 'sub-lvl-1',
        conceptId: 'core-net-subnetting',
        type: 'calculate',
        level: 'FOUNDATION',
        prompt: 'Qual é a máscara decimal pontuada correspondente ao prefixo CIDR /26?',
        hint: 'Em /26, os três primeiros octetos têm todos os 8 bits ligados (255.255.255), e o quarto octeto tem os 2 bits mais significativos ligados (128 + 64).',
        config: {
          cidrPrefix: 26,
          inputLabel: 'Máscara de Sub-rede',
          placeholder: 'ex: 255.255.255.0'
        },
        solution: {
          expectedAnswer: '255.255.255.192'
        },
        pedagogicalExplanation: 'Em /26, temos 26 bits 1 seguidos de 6 bits 0. No último octeto: 11000000 em binário equivale a 128 + 64 = 192. Logo, a máscara é 255.255.255.192.',
        orderIndex: 1
      },
      {
        id: 'sub-lvl-2',
        conceptId: 'core-net-subnetting',
        type: 'identify',
        level: 'PRACTICE',
        prompt: 'Dado o endereço IP 192.168.10.77/26, a qual endereço de Rede (Network Address) este host pertence?',
        hint: 'Sub-redes /26 avançam em múltiplos de 64: 0, 64, 128, 192. Identifique em qual intervalo 77 se encaixa.',
        config: {
          ipWithCidr: '192.168.10.77/26',
          inputLabel: 'Endereço de Rede',
          placeholder: 'ex: 192.168.10.0'
        },
        solution: {
          expectedAnswer: '192.168.10.64'
        },
        pedagogicalExplanation: 'Os blocos /26 iniciam em 192.168.10.0, 192.168.10.64, 192.168.10.128 e 192.168.10.192. Como 77 está entre 64 e 127, o endereço de rede é 192.168.10.64.',
        orderIndex: 2
      },
      {
        id: 'sub-lvl-3',
        conceptId: 'core-net-subnetting',
        type: 'identify',
        level: 'PRACTICE',
        prompt: 'Qual é o endereço de Broadcast da sub-rede à qual pertence o IP 192.168.10.77/26?',
        hint: 'O broadcast é o último endereço do bloco, exatamente 1 antes do início da próxima sub-rede (192.168.10.128).',
        config: {
          ipWithCidr: '192.168.10.77/26',
          inputLabel: 'Endereço de Broadcast',
          placeholder: 'ex: 192.168.10.255'
        },
        solution: {
          expectedAnswer: '192.168.10.127'
        },
        pedagogicalExplanation: 'A sub-rede vai de 192.168.10.64 até 192.168.10.127. O último endereço do bloco (.127) é reservado para transmissão de broadcast a todos os hosts daquela sub-rede.',
        orderIndex: 3
      },
      {
        id: 'sub-lvl-4',
        conceptId: 'core-net-subnetting',
        type: 'build',
        level: 'APPLICATION',
        prompt: 'Divida a rede 192.168.20.0/24 em 4 sub-redes iguais. Preencha o início de cada sub-rede.',
        hint: 'Para gerar 4 sub-redes a partir de /24, aumente 2 bits de prefixo (2^2 = 4 sub-redes de 64 endereços cada).',
        config: {
          baseNetwork: '192.168.20.0/24',
          targetPrefix: 26,
          requiredSubnetsCount: 4
        },
        solution: {
          subnets: [
            { net: '192.168.20.0', bcast: '192.168.20.63' },
            { net: '192.168.20.64', bcast: '192.168.20.127' },
            { net: '192.168.20.128', bcast: '192.168.20.191' },
            { net: '192.168.20.192', bcast: '192.168.20.255' }
          ]
        },
        pedagogicalExplanation: 'Com prefixo /26, o tamanho de cada bloco é 64. As 4 redes iniciam consecutivamente em .0, .64, .128 e .192.',
        orderIndex: 4
      },
      {
        id: 'sub-lvl-5',
        conceptId: 'core-net-subnetting',
        type: 'calculate',
        level: 'MASTERY',
        prompt: 'Você precisa planejar uma sub-rede para o departamento de SOC que terá exatamente 25 analistas (hosts). Qual é o menor prefixo CIDR que atende a esse requisito sem desperdício excessivo?',
        hint: 'Lembre-se da fórmula: 2^h - 2 >= 25 hosts. Verifique h=4 (16-2=14) e h=5 (32-2=30).',
        config: {
          hostsNeeded: 25,
          inputLabel: 'Prefixo CIDR (ex: /27)',
          placeholder: '/27'
        },
        solution: {
          expectedAnswer: '/27'
        },
        pedagogicalExplanation: 'Com 5 bits de host (32 - 27 = 5), temos 2^5 = 32 endereços totais, dos quais 30 são utilizáveis (32 - 2 = 30 >= 25). Um prefixo /28 forneceria apenas 14 hosts úteis, insuficiente para os 25 analistas.',
        orderIndex: 5
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. CONCEITO: NETWORKING → IPV4 FUNDAMENTALS
  // --------------------------------------------------------------------------
  {
    id: 'core-net-ipv4',
    slug: 'ipv4-fundamentals',
    title: 'IPv4 & Estrutura de Endereçamento',
    category: 'NETWORKING',
    level: 'FOUNDATION',
    shortDescription: 'Estrutura dos 32 bits, divisão em 4 octetos, classes históricas e representação binária para decimal.',
    prerequisiteSlugs: [],
    learningContent: {
      overview: 'O protocolo IPv4 utiliza endereços de 32 bits expressos em quatro octetos separados por pontos (ex: 192.168.1.1). Cada octeto varia de 0 a 255.',
      keyPoints: [
        'Total de bits: 32 bits (4 octetos de 8 bits).',
        'Cada octeto é uma representação em base 10 de 8 dígitos binários (0 a 11111111).',
        'Endereços privados (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.',
        'Loopback: 127.0.0.0/8 (127.0.0.1 representa o próprio host local).'
      ]
    },
    challenges: [
      {
        id: 'ipv4-lvl-1',
        conceptId: 'core-net-ipv4',
        type: 'calculate',
        level: 'FOUNDATION',
        prompt: 'Converta o octeto binário 11000000 para decimal.',
        hint: 'Os dois primeiros bits valem 128 e 64.',
        config: { binary: '11000000', inputLabel: 'Valor Decimal' },
        solution: { expectedAnswer: '192' },
        pedagogicalExplanation: '128 * 1 + 64 * 1 + 0 = 192. Este é o primeiro octeto típico de redes Classe C.',
        orderIndex: 1
      },
      {
        id: 'ipv4-lvl-2',
        conceptId: 'core-net-ipv4',
        type: 'identify',
        level: 'PRACTICE',
        prompt: 'Dentre os IPs: 10.50.1.1, 172.20.10.5, 8.8.8.8 e 192.168.1.10, qual é um endereço IP PÚBLICO roteável na internet?',
        hint: '8.8.8.8 é o famoso DNS resolver global do Google, fora dos blocos RFC 1918.',
        config: { inputLabel: 'IP Público' },
        solution: { expectedAnswer: '8.8.8.8' },
        pedagogicalExplanation: '8.8.8.8 é um IP público global. Os blocos 10.x.x.x, 172.16-31.x.x e 192.168.x.x são privados (RFC 1918) e não roteáveis na internet pública sem NAT.',
        orderIndex: 2
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. CONCEITO: NETWORKING → TCP VS UDP
  // --------------------------------------------------------------------------
  {
    id: 'core-net-tcp-udp',
    slug: 'tcp-vs-udp',
    title: 'Camada de Transporte: TCP vs UDP',
    category: 'NETWORKING',
    level: 'FOUNDATION',
    shortDescription: 'Controle de fluxo, orientação a conexão, garantia de entrega vs baixa latência e broadcast.',
    prerequisiteSlugs: ['ipv4-fundamentals'],
    learningContent: {
      overview: 'TCP e UDP operam na Camada 4 do Modelo OSI. O TCP prioriza integridade, retransmissão e ordenação. O UDP prioriza baixa latência e transmissão em tempo real.',
      keyPoints: [
        'TCP: Confiável, orientado a conexão, realiza handshake de 3 vias e controle de congestionamento.',
        'UDP: Não confiável (best-effort), sem handshake, cabeçalho de apenas 8 bytes (contra 20+ bytes do TCP).',
        'Protocolos TCP típicos: HTTP (80), HTTPS (443), SSH (22), FTP (21).',
        'Protocolos UDP típicos: DNS consultas rápidas (53), DHCP (67/68), SNMP (161), Streaming VoIP.'
      ]
    },
    challenges: [
      {
        id: 'tcpudp-lvl-1',
        conceptId: 'core-net-tcp-udp',
        type: 'match',
        level: 'PRACTICE',
        prompt: 'Qual protocolo de transporte é ideal para chamadas de voz sobre IP (VoIP) e streaming de vídeo ao vivo, onde perda ocasional de pacotes é preferível a atrasos de retransmissão?',
        hint: 'Protocolo de transporte sem conexão e sem overhead de handshake.',
        config: { inputLabel: 'Protocolo (TCP ou UDP)' },
        solution: { expectedAnswer: 'UDP' },
        pedagogicalExplanation: 'O UDP não realiza retransmissão de pacotes perdidos, evitando buffer e latência, tornando-o ideal para mídia em tempo real e jogos online.',
        orderIndex: 1
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. CONCEITO: NETWORKING → TCP 3-WAY HANDSHAKE
  // --------------------------------------------------------------------------
  {
    id: 'core-net-handshake',
    slug: 'tcp-3way-handshake',
    title: 'TCP 3-Way Handshake: Estabelecimento de Sessão',
    category: 'NETWORKING',
    level: 'PRACTICE',
    shortDescription: 'Sequência de flags SYN, SYN-ACK e ACK, sincronização de números de sequência (ISN) e mitigação de SYN Flood.',
    prerequisiteSlugs: ['tcp-vs-udp'],
    learningContent: {
      overview: 'Antes de transmitir dados, o TCP estabelece uma conexão bidirecional confiável através de uma troca de três mensagens entre cliente e servidor.',
      keyPoints: [
        'Passo 1: Cliente envia flag SYN (Synchronize) com seu Initial Sequence Number (ISN_c).',
        'Passo 2: Servidor responde com SYN-ACK (SYN do servidor + ACK com ISN_c + 1).',
        'Passo 3: Cliente finaliza com ACK (com ISN_s + 1). Sessão ESTABLISHED.',
        'Segurança: Ataques de SYN Flood tentam esgotar a tabela de conexões no Passo 2.'
      ]
    },
    challenges: [
      {
        id: 'handshake-lvl-1',
        conceptId: 'core-net-handshake',
        type: 'identify',
        level: 'FOUNDATION',
        prompt: 'Qual flag TCP é enviada pelo servidor na segunda etapa do Handshake de 3 vias?',
        hint: 'O servidor confirma o recebimento do cliente e ao mesmo tempo solicita sincronização de seus próprios números de sequência.',
        config: { inputLabel: 'Flags TCP' },
        solution: { expectedAnswer: 'SYN-ACK' },
        pedagogicalExplanation: 'O pacote SYN-ACK sincroniza a comunicação no sentido servidor -> cliente e confirma o SYN original do cliente.',
        orderIndex: 1
      }
    ]
  },

  // --------------------------------------------------------------------------
  // 5. CONCEITO: NETWORKING → DNS RESOLUTION
  // --------------------------------------------------------------------------
  {
    id: 'core-net-dns',
    slug: 'dns-resolution',
    title: 'Sistema de Nomes de Domínio (DNS)',
    category: 'NETWORKING',
    level: 'FOUNDATION',
    shortDescription: 'Resolução hierárquica recursiva e iterativa: Root servers, TLD servers e Servidores Autoritativos.',
    prerequisiteSlugs: ['ipv4-fundamentals', 'tcp-vs-udp'],
    learningContent: {
      overview: 'O DNS atua como o catálogo telefônico da internet, traduzindo nomes de domínio legíveis por humanos (ex: api.rootsec.io) para endereços IP operacionais.',
      keyPoints: [
        'Hierarquia: Raiz (.) → TLD (.io, .com) → Domínio autoritativo (rootsec.io).',
        'Registros essenciais: A (IPv4), AAAA (IPv6), CNAME (alias), MX (e-mail), TXT (SPF/DKIM/DMARC).',
        'Porta padrão: UDP 53 para consultas normais; TCP 53 para transferências de zona (AXFR).'
      ]
    },
    challenges: [
      {
        id: 'dns-lvl-1',
        conceptId: 'core-net-dns',
        type: 'identify',
        level: 'FOUNDATION',
        prompt: 'Qual tipo de registro DNS é utilizado para apontar um nome de domínio para um endereço IPv4 de 32 bits?',
        hint: 'Registro simples de uma única letra.',
        config: { inputLabel: 'Tipo de Registro' },
        solution: { expectedAnswer: 'A' },
        pedagogicalExplanation: 'O registro "A" (Address) mapeia um hostname para um endereço IPv4. Para IPv6, utiliza-se "AAAA" (quad-A).',
        orderIndex: 1
      }
    ]
  }
];

export function getConceptBySlug(slug: string): CyberConcept | undefined {
  return CYBER_CONCEPTS_CATALOG.find(c => c.slug === slug);
}

export function getConceptsByCategory(category: string): CyberConcept[] {
  return CYBER_CONCEPTS_CATALOG.filter(c => c.category === category);
}
