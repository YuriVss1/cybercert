// ============================================================================
// CYBER CORE: CATÁLOGO MULTIDISCIPLINAR DE CONCEITOS E LABORATÓRIOS DIDÁTICOS
// ============================================================================

import type { CyberConcept } from './cyberCoreTypes';

export const CYBER_CONCEPTS_CATALOG: CyberConcept[] = [
  // ==========================================================================
  // 1. DOMÍNIO: NETWORKING
  // ==========================================================================
  {
    id: 'net-osi-model',
    slug: 'osi-model',
    title: 'Modelo OSI (Open Systems Interconnection)',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'As 7 camadas conceituais de comunicação de rede, desde o meio físico até a interface com o usuário final.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: [],
    learningContent: {
      overview: 'O Modelo OSI padronizou a comunicação de redes em 7 camadas modulares independentes: Física (1), Enlace (2), Rede (3), Transporte (4), Sessão (5), Apresentação (6) e Aplicação (7). Cada camada encapsula os dados da camada superior com cabeçalhos específicos (PDU: Bit, Quadro/Frame, Pacote, Segmento, Dados).',
      keyPoints: [
        'Camada 1 (Física): Transmissão de bits brutos por cabos, fibra óptica ou ondas de rádio.',
        'Camada 2 (Enlace): Endereçamento físico (MAC Address) e controle de acesso ao meio (Ethernet, Switches L2).',
        'Camada 3 (Rede): Endereçamento lógico (IP) e roteamento de pacotes entre redes distintas (Routers).',
        'Camada 4 (Transporte): Comunicação ponta a ponta, controle de fluxo e portas (TCP/UDP).'
      ],
      visualComparison: {
        beforeLabel: 'PDU por Camada',
        beforeValue: 'L2: Quadro (Frame) ➔ L3: Pacote (Packet) ➔ L4: Segmento (TCP) / Datagrama (UDP)',
        afterLabel: 'Dispositivo Típico',
        afterValue: 'L2: Switch Ethernet ➔ L3: Roteador IP ➔ L4/L7: Firewall / Proxy de Aplicação'
      }
    },
    challenges: [
      {
        id: 'osi-lvl-1',
        conceptId: 'net-osi-model',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Em qual camada do modelo OSI operam os switches Ethernet tradicionais que realizam encaminhamento baseado em endereços MAC?',
        hint: 'Camada responsável pelo enlace de dados e controle de acesso ao meio físico.',
        config: { inputLabel: 'Camada OSI (Número ou Nome)' },
        solution: { expectedAnswer: 'Camada 2' },
        pedagogicalExplanation: 'Switches Ethernet padrão tomam decisões de comutação baseadas na tabela de endereços MAC, característica fundamental da Camada 2 (Enlace de Dados / Data Link).',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-tcp-ip-model',
    slug: 'tcp-ip-model',
    title: 'Pilha de Protocolos TCP/IP',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'O modelo prático de 4 camadas utilizado operacionalmente em toda a arquitetura da Internet moderna.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['osi-model'],
    learningContent: {
      overview: 'Diferente das 7 camadas teóricas do OSI, a arquitetura da Internet adota a pilha TCP/IP (RFC 1122) com 4 camadas práticas: Acesso à Rede (Link), Internet (IP/ICMP/ARP), Transporte (TCP/UDP) e Aplicação (HTTP, DNS, SSH, TLS).',
      keyPoints: [
        'Camada de Acesso: Integra as camadas 1 e 2 do modelo OSI (Hardware, Drivers, Ethernet).',
        'Camada de Internet: Protocolo IP roteia datagramas sem garantia de entrega (Best-effort).',
        'Camada de Transporte: TCP garante confiabilidade; UDP prioriza velocidade e baixa latência.',
        'Camada de Aplicação: Abrange as camadas 5, 6 e 7 do OSI diretamente nos processos de usuário.'
      ]
    },
    challenges: [
      {
        id: 'tcpip-lvl-1',
        conceptId: 'net-tcp-ip-model',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Qual camada da pilha TCP/IP é responsável pelo protocolo IP e pela decisão de rotas entre redes?',
        hint: 'Camada intermediária entre o Acesso à Rede e o Transporte.',
        config: { inputLabel: 'Nome da Camada' },
        solution: { expectedAnswer: 'Internet' },
        pedagogicalExplanation: 'A camada de Internet (ou Rede na representação de 5 camadas) abriga o protocolo IP, ICMP e ARP, sendo responsável pelo roteamento lógico dos pacotes.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'core-net-ipv4',
    slug: 'ipv4-fundamentals',
    title: 'IPv4 & Estrutura de Endereçamento',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Estrutura dos 32 bits, divisão em 4 octetos, blocos privados RFC 1918 e conversão binária para decimal.',
    interactionType: 'CALCULATE',
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
        type: 'CALCULATE',
        level: 'BEGINNER',
        prompt: 'Converta o octeto binário 11000000 para decimal.',
        hint: 'Os dois primeiros bits valem 128 e 64.',
        config: { binary: '11000000', inputLabel: 'Valor Decimal' },
        solution: { expectedAnswer: '192' },
        pedagogicalExplanation: '128 * 1 + 64 * 1 + 0 = 192. Este é o primeiro octeto típico de redes Classe C.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-ipv6-fundamentals',
    slug: 'ipv6-fundamentals',
    title: 'IPv6: Endereçamento de 128 Bits',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Estrutura hexadecimal de 128 bits, regras de compressão de zeros, Link-Local e eliminação do broadcast nativo.',
    interactionType: 'IDENTIFY',
    prerequisiteSlugs: ['ipv4-fundamentals'],
    learningContent: {
      overview: 'Criado para resolver o esgotamento do IPv4, o IPv6 oferece 128 bits de endereçamento representados em 8 grupos de 4 dígitos hexadecimais (hextetos) separados por dois pontos (ex: 2001:0db8:85a3::8a2e:0370:7334).',
      keyPoints: [
        'Total de bits: 128 bits (3.4 × 10^38 endereços únicos disponíveis).',
        'Regras de compressão: zeros à esquerda em cada hexteto podem ser omitidos; sequência contígua de hextetos nulos pode ser substituída por "::" uma única vez.',
        'Link-Local (fe80::/10): Obrigatório em toda interface ativa para comunicação no mesmo segmento local.',
        'Ausência de Broadcast: Substituído por Multicast eficiente e Anycast.'
      ]
    },
    challenges: [
      {
        id: 'ipv6-lvl-1',
        conceptId: 'net-ipv6-fundamentals',
        type: 'IDENTIFY',
        level: 'BEGINNER',
        prompt: 'Qual prefixo hexadecimal identifica obrigatoriamente um endereço IPv6 do tipo Link-Local não roteável na internet?',
        hint: 'Inicia com os caracteres fe80...',
        config: { inputLabel: 'Prefixo Link-Local' },
        solution: { expectedAnswer: 'fe80::/10' },
        pedagogicalExplanation: 'O bloco fe80::/10 é reservado para endereços Link-Local gerados automaticamente para comunicação na mesma rede local.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-mac-address',
    slug: 'mac-address',
    title: 'Endereço Físico MAC (Media Access Control)',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Identificador único de 48 bits gravado na placa de rede, divisão em OUI do fabricante e número de série da interface.',
    interactionType: 'IDENTIFY',
    prerequisiteSlugs: ['osi-model'],
    learningContent: {
      overview: 'O MAC Address é o identificador físico de 48 bits (6 bytes) gravado na NIC (Network Interface Card). Opera na Camada 2 e é composto por 24 bits de OUI (identificador do fabricante) e 24 bits atribuídos pelo fabricante.',
      keyPoints: [
        'Formato comum: 6 pares hexadecimais separados por dois pontos ou hífens (ex: 00:1A:2B:3C:4D:5E).',
        'OUI (Organizationally Unique Identifier): Primeiros 3 bytes identificam a empresa fabricante (Cisco, Intel, Apple).',
        'Broadcast L2: FF:FF:FF:FF:FF:FF (todos os bits ligados) recebido por todas as portas da VLAN.',
        'MAC Spoofing: Alteração lógica do endereço MAC na memória do sistema operacional para burlar filtros.'
      ]
    },
    challenges: [
      {
        id: 'mac-lvl-1',
        conceptId: 'net-mac-address',
        type: 'IDENTIFY',
        level: 'BEGINNER',
        prompt: 'Quantos bits compõem a totalidade de um endereço MAC Ethernet padrão?',
        hint: 'Equivale a 6 bytes de 8 bits.',
        config: { inputLabel: 'Quantidade de Bits' },
        solution: { expectedAnswer: '48' },
        pedagogicalExplanation: 'Um endereço MAC padrão possui 48 bits (6 octetos expressos em hexadecimal).',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-ports-protocols',
    slug: 'network-ports',
    title: 'Portas Lógicas de Transporte & Serviços Well-Known',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Identificação de processos de aplicação via portas de 0 a 65535: Well-Known (0-1023), Registradas e Dinâmicas/Efêmeras.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['osi-model'],
    learningContent: {
      overview: 'As portas lógicas (Layer 4) permitem que um único endereço IP execute dezenas de serviços concorrentes sem colisão. O número da porta varia de 0 a 65535 (campo de 16 bits no cabeçalho TCP e UDP).',
      keyPoints: [
        'Well-Known Ports (0 a 1023): Serviços de sistema privilegiados (SSH=22, DNS=53, HTTP=80, HTTPS=443, SMB=445).',
        'Registered Ports (1024 a 49151): Serviços corporativos e bancos de dados (MSSQL=1433, MySQL=3306, RDP=3389).',
        'Dynamic / Ephemeral Ports (49152 a 65535): Alocadas temporariamente pelo cliente para receber respostas do servidor.'
      ]
    },
    challenges: [
      {
        id: 'ports-lvl-1',
        conceptId: 'net-ports-protocols',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Qual é o número de porta padrão utilizado pelo protocolo seguro SSH (Secure Shell) para conexões criptografadas?',
        hint: 'Porta de 2 dígitos entre 20 e 25.',
        config: { inputLabel: 'Número da Porta' },
        solution: { expectedAnswer: '22' },
        pedagogicalExplanation: 'A porta TCP 22 é a porta padrão registrada na IANA para conexões SSH seguras.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'core-net-tcp-udp',
    slug: 'tcp-vs-udp',
    title: 'Camada de Transporte: TCP vs UDP',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Confiabilidade, handshake e controle de fluxo vs baixa latência e transmissão em tempo real.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['network-ports'],
    learningContent: {
      overview: 'TCP e UDP operam na Camada 4. O TCP prioriza integridade, retransmissão e ordenação via handshake. O UDP prioriza baixa latência e overhead mínimo (apenas 8 bytes de cabeçalho).',
      keyPoints: [
        'TCP: Conexão confiável, reordenação de pacotes, controle de fluxo e congestionamento.',
        'UDP: Best-effort sem confirmação de entrega; ideal para DNS consultas rápidas, VoIP e streaming.',
        'Header TCP: 20 bytes mínimos (com flags SYN, ACK, FIN, RST, PSH, URG).',
        'Header UDP: 8 bytes fixos (Source Port, Dest Port, Length, Checksum).'
      ]
    },
    challenges: [
      {
        id: 'tcpudp-lvl-1',
        conceptId: 'core-net-tcp-udp',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Qual protocolo de transporte da Camada 4 é sem conexão (connectionless) e não realiza retransmissão de pacotes perdidos?',
        hint: 'Sigla de 3 letras oposta ao TCP.',
        config: { inputLabel: 'Protocolo' },
        solution: { expectedAnswer: 'UDP' },
        pedagogicalExplanation: 'O UDP (User Datagram Protocol) não mantém estado de sessão nem retransmite dados, garantindo velocidade máxima para mídia ao vivo e jogos.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-arp-protocol',
    slug: 'arp-resolution',
    title: 'Protocolo ARP (Address Resolution Protocol)',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Mapeamento dinâmico entre endereços lógicos IPv4 (Camada 3) e endereços físicos MAC (Camada 2) na rede local.',
    interactionType: 'TRACE',
    prerequisiteSlugs: ['ipv4-fundamentals', 'mac-address'],
    learningContent: {
      overview: 'Para que dois nós da mesma rede IP conversem via Ethernet, o remetente precisa do MAC do destinatário. O protocolo ARP resolve essa correspondência disparando um broadcast "Quem tem o IP X? Responda para Y".',
      keyPoints: [
        'ARP Request: Pacote em broadcast (MAC destino FF:FF:FF:FF:FF:FF) perguntando pelo IP.',
        'ARP Reply: O nó detentor do IP responde diretamente via Unicast com seu MAC físico.',
        'ARP Cache: Tabela na memória do host que armazena pares IP-MAC temporariamente.',
        'Vulnerabilidade: ARP não possui autenticação nativa, permitindo ataques de ARP Spoofing / Poisoning.'
      ]
    },
    challenges: [
      {
        id: 'arp-lvl-1',
        conceptId: 'net-arp-protocol',
        type: 'TRACE',
        level: 'BEGINNER',
        prompt: 'O que o pacote ARP Request utiliza como endereço de destino da camada de enlace para que todos os nós recebam a pergunta?',
        hint: 'Endereço MAC de broadcast completo.',
        config: { inputLabel: 'Endereço MAC' },
        solution: { expectedAnswer: 'FF:FF:FF:FF:FF:FF' },
        pedagogicalExplanation: 'O ARP Request é enviado para o MAC de broadcast FF:FF:FF:FF:FF:FF para que todas as interfaces do mesmo domínio de colisão/broadcast examinem a consulta.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-dhcp-protocol',
    slug: 'dhcp-dora',
    title: 'DHCP & Ciclo DORA de Configuração Automática',
    category: 'NETWORKING',
    level: 'BEGINNER',
    shortDescription: 'Distribuição dinâmica de parâmetros de rede (IP, Máscara, Gateway, DNS) através dos 4 passos DORA.',
    interactionType: 'TRACE',
    prerequisiteSlugs: ['ipv4-fundamentals', 'network-ports'],
    learningContent: {
      overview: 'O DHCP (Dynamic Host Configuration Protocol) automatiza a atribuição de rede em clientes através do processo de 4 vias DORA: Discover, Offer, Request e Acknowledge, operando sobre UDP 67 (Servidor) e UDP 68 (Cliente).',
      keyPoints: [
        'Discover: Cliente sem IP envia broadcast (0.0.0.0 ➔ 255.255.255.255) procurando servidores DHCP.',
        'Offer: Servidores DHCP disponíveis oferecem um IP com lease time e máscara.',
        'Request: Cliente seleciona a melhor oferta e requisita formalmente o IP em broadcast.',
        'Acknowledge (ACK): Servidor confirma a concessão e aloca o IP no escopo.'
      ]
    },
    challenges: [
      {
        id: 'dhcp-lvl-1',
        conceptId: 'net-dhcp-protocol',
        type: 'TRACE',
        level: 'BEGINNER',
        prompt: 'Qual é a primeira mensagem enviada em broadcast por um cliente que conecta à rede sem IP configurado?',
        hint: 'Primeira letra da sigla DORA.',
        config: { inputLabel: 'Mensagem DHCP' },
        solution: { expectedAnswer: 'DHCP Discover' },
        pedagogicalExplanation: 'A primeira etapa do ciclo DORA é o DHCP Discover, enviado a partir de 0.0.0.0 para 255.255.255.255 solicitando parâmetros de configuração.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'core-net-subnetting',
    slug: 'subnetting-cidr',
    title: 'Divisão de Redes (Subnetting & CIDR)',
    category: 'NETWORKING',
    level: 'INTERMEDIATE',
    shortDescription: 'Compreenda a partição de blocos IPv4, cálculo de máscaras, hosts úteis e fronteiras de broadcast através de manipulação direta.',
    interactionType: 'CALCULATE',
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
        type: 'CALCULATE',
        level: 'INTERMEDIATE',
        prompt: 'Qual é a máscara decimal pontuada correspondente ao prefixo CIDR /26?',
        hint: 'Em /26, os três primeiros octetos têm todos os 8 bits ligados (255.255.255), e o quarto octeto tem os 2 bits mais significativos ligados (128 + 64).',
        config: { cidrPrefix: 26, inputLabel: 'Máscara de Sub-rede', placeholder: 'ex: 255.255.255.0' },
        solution: { expectedAnswer: '255.255.255.192' },
        pedagogicalExplanation: 'Em /26, temos 26 bits 1 seguidos de 6 bits 0. No último octeto: 11000000 em binário equivale a 128 + 64 = 192. Logo, a máscara é 255.255.255.192.',
        orderIndex: 1
      },
      {
        id: 'sub-lvl-2',
        conceptId: 'core-net-subnetting',
        type: 'IDENTIFY',
        level: 'INTERMEDIATE',
        prompt: 'Dado o endereço IP 192.168.10.77/26, a qual endereço de Rede (Network Address) este host pertence?',
        hint: 'Sub-redes /26 avançam em múltiplos de 64: 0, 64, 128, 192. Identifique em qual intervalo 77 se encaixa.',
        config: { ipWithCidr: '192.168.10.77/26', inputLabel: 'Endereço de Rede', placeholder: 'ex: 192.168.10.0' },
        solution: { expectedAnswer: '192.168.10.64' },
        pedagogicalExplanation: 'Os blocos /26 iniciam em 192.168.10.0, 192.168.10.64, 192.168.10.128 e 192.168.10.192. Como 77 está entre 64 e 127, o endereço de rede é 192.168.10.64.',
        orderIndex: 2
      },
      {
        id: 'sub-lvl-3',
        conceptId: 'core-net-subnetting',
        type: 'IDENTIFY',
        level: 'INTERMEDIATE',
        prompt: 'Qual é o endereço de Broadcast da sub-rede à qual pertence o IP 192.168.10.77/26?',
        hint: 'O broadcast é o último endereço do bloco, exatamente 1 antes do início da próxima sub-rede (192.168.10.128).',
        config: { ipWithCidr: '192.168.10.77/26', inputLabel: 'Endereço de Broadcast', placeholder: 'ex: 192.168.10.255' },
        solution: { expectedAnswer: '192.168.10.127' },
        pedagogicalExplanation: 'A sub-rede vai de 192.168.10.64 até 192.168.10.127. O último endereço do bloco (.127) é reservado para transmissão de broadcast a todos os hosts daquela sub-rede.',
        orderIndex: 3
      },
      {
        id: 'sub-lvl-4',
        conceptId: 'core-net-subnetting',
        type: 'BUILD',
        level: 'INTERMEDIATE',
        prompt: 'Divida a rede 192.168.20.0/24 em 4 sub-redes iguais. Preencha o início de cada sub-rede.',
        hint: 'Para gerar 4 sub-redes a partir de /24, aumente 2 bits de prefixo (2^2 = 4 sub-redes de 64 endereços cada).',
        config: { baseNetwork: '192.168.20.0/24', targetPrefix: 26, requiredSubnetsCount: 4 },
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
        type: 'CALCULATE',
        level: 'INTERMEDIATE',
        prompt: 'Você precisa planejar uma sub-rede para o departamento de SOC que terá exatamente 25 analistas (hosts). Qual é o menor prefixo CIDR que atende a esse requisito sem desperdício excessivo?',
        hint: 'Lembre-se da fórmula: 2^h - 2 >= 25 hosts. Verifique h=4 (16-2=14) e h=5 (32-2=30).',
        config: { hostsNeeded: 25, inputLabel: 'Prefixo CIDR (ex: /27)', placeholder: '/27' },
        solution: { expectedAnswer: '/27' },
        pedagogicalExplanation: 'Com 5 bits de host (32 - 27 = 5), temos 2^5 = 32 endereços totais, dos quais 30 são utilizáveis (32 - 2 = 30 >= 25). Um prefixo /28 forneceria apenas 14 hosts úteis, insuficiente para os 25 analistas.',
        orderIndex: 5
      }
    ]
  },
  {
    id: 'core-net-handshake',
    slug: 'tcp-3way-handshake',
    title: 'TCP 3-Way Handshake: Estabelecimento de Sessão',
    category: 'NETWORKING',
    level: 'INTERMEDIATE',
    shortDescription: 'Sequência de flags SYN, SYN-ACK e ACK, sincronização de números de sequência (ISN) e estados de socket.',
    interactionType: 'SORT',
    prerequisiteSlugs: ['tcp-vs-udp'],
    learningContent: {
      overview: 'Antes de transmitir dados, o TCP estabelece uma conexão bidirecional confiável através de uma troca de três mensagens entre cliente e servidor.',
      keyPoints: [
        'Passo 1: Cliente envia flag SYN (Synchronize) com seu Initial Sequence Number (ISN_c).',
        'Passo 2: Servidor responde com SYN-ACK (SYN do servidor + ACK com ISN_c + 1).',
        'Passo 3: Cliente finaliza com ACK (com ISN_s + 1). Sessão ESTABLISHED.',
        'Segurança: Ataques de SYN Flood tentam esgotar a tabela de conexões no Passo 2 mantendo sockets em SYN_RECEIVED.'
      ]
    },
    challenges: [
      {
        id: 'handshake-lvl-1',
        conceptId: 'core-net-handshake',
        type: 'SORT',
        level: 'INTERMEDIATE',
        prompt: 'Qual flag TCP é enviada pelo servidor na segunda etapa do Handshake de 3 vias?',
        hint: 'O servidor confirma o recebimento do cliente e ao mesmo tempo solicita sincronização de seus próprios números de sequência.',
        config: { inputLabel: 'Flags TCP' },
        solution: { expectedAnswer: 'SYN-ACK' },
        pedagogicalExplanation: 'O pacote SYN-ACK sincroniza a comunicação no sentido servidor -> cliente e confirma o SYN original do cliente.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'core-net-dns',
    slug: 'dns-resolution',
    title: 'Sistema de Nomes de Domínio (DNS)',
    category: 'NETWORKING',
    level: 'INTERMEDIATE',
    shortDescription: 'Resolução hierárquica recursiva e iterativa: Root servers, TLD servers e Servidores Autoritativos.',
    interactionType: 'TRACE',
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
        type: 'TRACE',
        level: 'INTERMEDIATE',
        prompt: 'Qual tipo de registro DNS é utilizado para apontar um nome de domínio para um endereço IPv4 de 32 bits?',
        hint: 'Registro simples de uma única letra.',
        config: { inputLabel: 'Tipo de Registro' },
        solution: { expectedAnswer: 'A' },
        pedagogicalExplanation: 'O registro "A" (Address) mapeia um hostname para um endereço IPv4. Para IPv6, utiliza-se "AAAA" (quad-A).',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'net-vlan-segmentation',
    slug: 'vlan-segmentation',
    title: 'Segmentação L2 com VLANs (802.1Q)',
    category: 'NETWORKING',
    level: 'INTERMEDIATE',
    shortDescription: 'Isolamento de domínios de broadcast em switches, portas Access vs Trunk e marcação de tags IEEE 802.1Q.',
    interactionType: 'BUILD',
    prerequisiteSlugs: ['osi-model', 'subnetting-cidr'],
    learningContent: {
      overview: 'Uma VLAN (Virtual Local Area Network) divide um switch físico em múltiplos domínios de broadcast isolados. O tráfego entre diferentes VLANs exige obrigatoriamente um roteador ou Switch L3 (Inter-VLAN Routing).',
      keyPoints: [
        'Porta Access: Pertence a uma única VLAN e encaminha quadros sem tag Ethernet (Untagged).',
        'Porta Trunk: Transporta múltiplas VLANs entre switches adicionando uma tag 802.1Q de 4 bytes (VLAN ID de 1 a 4094).',
        'Isolamento de Segurança: Impede que um nó comprometido na rede de convidados acesse pacotes de broadcast da rede corporativa ou de servidores.'
      ]
    },
    challenges: [
      {
        id: 'vlan-lvl-1',
        conceptId: 'net-vlan-segmentation',
        type: 'BUILD',
        level: 'INTERMEDIATE',
        prompt: 'Qual tipo de porta de switch deve ser configurada entre dois switches interligados para transportar o tráfego de múltiplas VLANs com tags 802.1Q?',
        hint: 'Termo oposto à porta Access.',
        config: { inputLabel: 'Tipo de Porta' },
        solution: { expectedAnswer: 'Trunk' },
        pedagogicalExplanation: 'Portas Trunk (Tronco) utilizam o cabeçalho 802.1Q para multiplexar o tráfego de várias VLANs através de um único enlace físico.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 2. DOMÍNIO: CYBERSECURITY
  // ==========================================================================
  {
    id: 'sec-cia-triad',
    slug: 'cia-triad',
    title: 'Tríade CIA: Confidencialidade, Integridade & Disponibilidade',
    category: 'CYBERSECURITY',
    level: 'BEGINNER',
    shortDescription: 'O modelo nuclear que orienta toda política de segurança da informação, avaliação de riscos e controles técnicos.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: [],
    learningContent: {
      overview: 'A Tríade CIA é a pedra angular da segurança. Confidencialidade garante que apenas partes autorizadas leiam os dados; Integridade garante que os dados não foram alterados indevidamente; Disponibilidade garante que sistemas e dados estejam acessíveis quando necessários.',
      keyPoints: [
        'Confidencialidade: Protegida por criptografia, controle de acesso e mascaramento de dados.',
        'Integridade: Garantida por hashes criptográficos, assinaturas digitais e checksums.',
        'Disponibilidade: Assegurada por redundância, balanceamento de carga, backups e proteção contra DoS/DDoS.',
        'Não-Repúdio (Non-repudiation): Extensão que impede que um autor negue a autoria de uma transação.'
      ]
    },
    challenges: [
      {
        id: 'cia-lvl-1',
        conceptId: 'sec-cia-triad',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Um ataque de Ransomware que criptografa os servidores corporativos e impede a equipe médica de acessar prontuários viola primariamente qual pilar da Tríade CIA?',
        hint: 'Os dados tornam-se inacessíveis para uso operacional.',
        config: { inputLabel: 'Pilar da Tríade' },
        solution: { expectedAnswer: 'Disponibilidade' },
        pedagogicalExplanation: 'Embora envolva criptografia, o impacto imediato do ransomware é a perda de Disponibilidade (Availability), paralisando as operações da instituição.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'sec-least-privilege',
    slug: 'least-privilege',
    title: 'Princípio do Menor Privilégio (PoLP)',
    category: 'CYBERSECURITY',
    level: 'BEGINNER',
    shortDescription: 'Concessão exclusiva dos privilégios mínimos necessários para a execução de uma tarefa legítima, reduzindo a superfície de dano.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['cia-triad'],
    learningContent: {
      overview: 'O Princípio do Menor Privilégio dita que usuários, processos e serviços devem receber apenas os acessos estritamente necessários para desempenhar sua função durante o menor tempo possível (Just-In-Time access).',
      keyPoints: [
        'Redução do Raio de Explosão (Blast Radius): Se um usuário padrão for comprometido por phishing, o invasor não obtém privilégios de administrador de domínio.',
        'Contas de Serviço sem privilégios interativos: Aplicações web não devem rodar como root ou SYSTEM.',
        'Separação de Funções (SoD): Tarefas críticas devem exigir autorização de múltiplas identidades.'
      ]
    },
    challenges: [
      {
        id: 'polp-lvl-1',
        conceptId: 'sec-least-privilege',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Qual é o principal benefício de segurança ao proibir que analistas utilizem contas de Administrador para navegar na web e ler e-mails rotineiros?',
        hint: 'Limitar o dano em caso de infecção por malware.',
        config: { inputLabel: 'Benefício Principal' },
        solution: { expectedAnswer: 'Redução do raio de explosão' },
        pedagogicalExplanation: 'Ao usar contas padrão, qualquer malware baixado é executado no contexto de usuário restrito, impedindo a modificação direta de arquivos protegidos do sistema operacional.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'sec-defense-in-depth',
    slug: 'defense-in-depth',
    title: 'Defesa em Profundidade (Camadas de Proteção)',
    category: 'CYBERSECURITY',
    level: 'BEGINNER',
    shortDescription: 'Implementação de múltiplos controles defensivos em série (Perímetro, Rede, Host, Aplicação e Dados) para evitar ponto único de falha.',
    interactionType: 'BUILD',
    prerequisiteSlugs: ['cia-triad', 'least-privilege'],
    learningContent: {
      overview: 'Defesa em Profundidade assume que nenhum controle de segurança individual é infalível. Uma arquitetura robusta combina camadas complementares: Firewall de Perímetro, Segmentação L2/L3, EDR no endpoint, MFA na identidade e criptografia em repouso.',
      keyPoints: [
        'Se o perímetro falhar (ex: phishing), o EDR e a ausência de privilégio local impedem a execução do payload.',
        'Se o endpoint for comprometido, a segmentação de rede e o MFA impedem o movimento lateral.',
        'Se o banco de dados for exfiltrado, a criptografia garante que os dados estejam ilegíveis sem as chaves.'
      ]
    },
    challenges: [
      {
        id: 'did-lvl-1',
        conceptId: 'sec-defense-in-depth',
        type: 'BUILD',
        level: 'BEGINNER',
        prompt: 'Qual conceito de arquitetura afirma que a segurança não deve depender de um único mecanismo defensivo?',
        hint: 'Defesa em...',
        config: { inputLabel: 'Conceito Arquitetural' },
        solution: { expectedAnswer: 'Defesa em Profundidade' },
        pedagogicalExplanation: 'A Defesa em Profundidade (Defense in Depth) estabelece controles em múltiplas camadas coordenadas para mitigar riscos de falha individual.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'sec-firewall-acl',
    slug: 'firewall-acl',
    title: 'Controle de Acesso em Firewall (ACL & First Match Wins)',
    category: 'CYBERSECURITY',
    level: 'INTERMEDIATE',
    shortDescription: 'Construção de listas de regras de tráfego, ordem de precedência, avaliação top-down e o deny implícito.',
    interactionType: 'BUILD',
    prerequisiteSlugs: ['defense-in-depth', 'subnetting-cidr'],
    learningContent: {
      overview: 'Firewalls filtram pacotes com base em regras direcionais que associam Origem, Destino, Porta, Protocolo e Ação (ALLOW ou DENY). A regra mais importante de firewalls é o "First Match Wins": a primeira regra coincidente define a decisão.',
      keyPoints: [
        'Avaliação Top-Down: A ordem física das regras importa criticamente. Uma regra permissiva colocada no topo anula restrições seguintes.',
        'Default Deny (Deny Implícito): Todo tráfego que não coincidir explicitamente com nenhuma regra anterior deve ser descartado no final.',
        'Stateful Inspection: Firewalls modernos lembram das conexões de saída ativas e liberam automaticamente os pacotes de retorno sem exigir regras inbound abertas.'
      ]
    },
    challenges: [
      {
        id: 'fw-lvl-1',
        conceptId: 'sec-firewall-acl',
        type: 'BUILD',
        level: 'INTERMEDIATE',
        prompt: 'Se uma regra número 1 estipula "ALLOW ANY ANY" e a regra número 2 estipula "DENY IP 10.0.1.5", o que acontecerá com o tráfego de 10.0.1.5?',
        hint: 'Lembre-se do princípio First Match Wins.',
        config: { inputLabel: 'Decisão do Firewall' },
        solution: { expectedAnswer: 'ALLOW' },
        pedagogicalExplanation: 'Devido à avaliação top-down (First Match Wins), a regra 1 dá match imediatamente e autoriza o tráfego, sem nunca chegar a avaliar a regra 2.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'sec-incident-response',
    slug: 'incident-response-lifecycle',
    title: 'Ciclo de Vida de Resposta a Incidentes (NIST SP 800-61)',
    category: 'CYBERSECURITY',
    level: 'INTERMEDIATE',
    shortDescription: 'As 6 fases estruturadas para lidar com violações: Preparação, Identificação, Contenção, Erradicação, Recuperação e Lições Aprendidas.',
    interactionType: 'SORT',
    prerequisiteSlugs: ['defense-in-depth'],
    learningContent: {
      overview: 'O NIST SP 800-61 define o padrão internacional para resposta a incidentes. A execução ordenada impede que atacantes destruam evidências ou reinfectem sistemas recém-restaurados.',
      keyPoints: [
        'Contenção antes de Erradicação: Isolar os nós infectados da rede antes de remover os artefatos impede que o invasor ative canais secundários de C2.',
        'Cadeia de Custódia (Chain of Custody): Preservação forense da memória RAM e imagens de disco para perícia legal.',
        'Lições Aprendidas: Etapa final onde a causa-raiz é documentada e os controles de prevenção e detecção são atualizados.'
      ]
    },
    challenges: [
      {
        id: 'ir-lvl-1',
        conceptId: 'sec-incident-response',
        type: 'SORT',
        level: 'INTERMEDIATE',
        prompt: 'Qual fase do ciclo de incidentes deve ser executada imediatamente antes da Erradicação para evitar que o invasor propague a infecção para outros servidores?',
        hint: 'Ação de isolamento.',
        config: { inputLabel: 'Nome da Fase' },
        solution: { expectedAnswer: 'Contenção' },
        pedagogicalExplanation: 'A Contenção isola o incidente (cortando o acesso de rede do atacante), garantindo que a subsequente erradicação seja definitiva.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'sec-mitre-attack',
    slug: 'mitre-attack-framework',
    title: 'MITRE ATT&CK: Matriz de Táticas, Técnicas e Procedimentos (TTPs)',
    category: 'CYBERSECURITY',
    level: 'INTERMEDIATE',
    shortDescription: 'Base de conhecimento taxonômica global que cataloga comportamentos reais de adversários em fases cronológicas de ataque.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['defense-in-depth'],
    learningContent: {
      overview: 'O MITRE ATT&CK divide as invasões em Táticas (o objetivo do atacante, ex: Movimentação Lateral) e Técnicas (como o atacante realiza o objetivo, ex: Pass the Hash).',
      keyPoints: [
        'Táticas principais: Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, C2, Exfiltration, Impact.',
        'Foco no Comportamento: Enquanto IOCs (hashes e IPs) mudam rapidamente, as TTPs exigem custo elevado para o atacante alterar (Pirâmide da Dor de David Bianco).'
      ]
    },
    challenges: [
      {
        id: 'mitre-lvl-1',
        conceptId: 'sec-mitre-attack',
        type: 'CLASSIFY',
        level: 'INTERMEDIATE',
        prompt: 'Em qual tática do MITRE ATT&CK se enquadra a criação de uma Tarefa Agendada (Scheduled Task) para manter acesso após a reinicialização do sistema?',
        hint: 'Objetivo de manter o acesso no alvo.',
        config: { inputLabel: 'Tática ATT&CK' },
        solution: { expectedAnswer: 'Persistence' },
        pedagogicalExplanation: 'Persistence (Persistência) engloba qualquer técnica utilizada pelo invasor para manter o acesso ao sistema mesmo após reboots, trocas de credenciais ou intervenções simples.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 3. DOMÍNIO: CRYPTOGRAPHY
  // ==========================================================================
  {
    id: 'crypto-encoding-hash-encryption',
    slug: 'encoding-encryption-hash',
    title: 'Encoding vs Hashing vs Criptografia',
    category: 'CRYPTOGRAPHY',
    level: 'BEGINNER',
    shortDescription: 'Diferenciação conceitual estrita: transformação de formato (Base64) vs via de mão única (SHA-256) vs confidencialidade reversível por chave (AES/RSA).',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['cia-triad'],
    learningContent: {
      overview: 'Confundir estes três conceitos é uma das maiores fontes de vulnerabilidade. Encoding altera apenas a representação dos dados (sem segurança); Hashing gera um resumo unidirecional de tamanho fixo; Criptografia transforma texto claro em texto cifrado usando uma chave secreta.',
      keyPoints: [
        'Encoding (ex: Base64, ASCII): Não requer segredo ou chave. Qualquer um pode decodificar instantaneamente.',
        'Hashing (ex: SHA-256, bcrypt): Função de mão única irreversível. Usado para verificação de integridade e armazenamento de senhas.',
        'Criptografia (ex: AES, RSA): Reversível com a chave correta. Garante estritamente Confidencialidade.'
      ],
      visualComparison: {
        beforeLabel: 'Operação',
        beforeValue: 'Base64 (Encoding) ➔ SHA-256 (Hashing) ➔ AES-GCM (Criptografia)',
        afterLabel: 'Reversibilidade',
        afterValue: 'Totalmente Aberto ➔ Matematicamente Irreversível ➔ Reversível apenas com Chave'
      }
    },
    challenges: [
      {
        id: 'enc-lvl-1',
        conceptId: 'crypto-encoding-hash-encryption',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Uma string no formato "c2VjcmV0" codificada em Base64 pode ser considerada criptografada?',
        hint: 'Base64 utiliza alguma chave secreta?',
        config: { inputLabel: 'Sim ou Não' },
        solution: { expectedAnswer: 'Não' },
        pedagogicalExplanation: 'Base64 é apenas um algoritmo de Encoding (codificação de representação binária para texto imprimível). Não utiliza chaves nem fornece nenhuma confidencialidade.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'crypto-symmetric-asymmetric',
    slug: 'symmetric-vs-asymmetric',
    title: 'Criptografia Simétrica vs Assimétrica',
    category: 'CRYPTOGRAPHY',
    level: 'BEGINNER',
    shortDescription: 'Chave única compartilhada (AES) vs par de chaves pública e privada (RSA, ECC), e o modelo híbrido utilizado no TLS.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['encoding-encryption-hash'],
    learningContent: {
      overview: 'A criptografia simétrica utiliza a mesma chave para cifrar e decifrar (extremamente rápida, ideal para grandes volumes de dados). A assimétrica utiliza um par de chaves matematicamente vinculadas: chave pública (aberta) e chave privada (secreta).',
      keyPoints: [
        'Simétrica (AES-256, ChaCha20): Rápida, mas apresenta o desafio de distribuição segura da chave.',
        'Assimétrica (RSA, ECDSA): Mais lenta, resolve a troca de chaves e possibilita assinaturas digitais.',
        'Criptografia Híbrida: Usa chaves assimétricas para negociar uma chave de sessão simétrica efêmera (como no HTTPS).'
      ]
    },
    challenges: [
      {
        id: 'sym-lvl-1',
        conceptId: 'crypto-symmetric-asymmetric',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Se Alice deseja enviar uma mensagem confidencial para Bob usando criptografia assimétrica, com qual chave Alice deve encriptar o texto?',
        hint: 'Apenas Bob deve conseguir abrir com sua chave privada correspondente.',
        config: { inputLabel: 'Chave utilizada por Alice' },
        solution: { expectedAnswer: 'Chave pública de Bob' },
        pedagogicalExplanation: 'Para garantir confidencialidade na criptografia assimétrica, o remetente encripta com a chave PÚBLICA do destinatário. Somente o destinatário (possuidor da chave PRIVADA) conseguirá decifrar.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'crypto-pki-chain',
    slug: 'pki-certificate-chain',
    title: 'PKI & Cadeia de Confiança de Certificados (X.509)',
    category: 'CRYPTOGRAPHY',
    level: 'INTERMEDIATE',
    shortDescription: 'Estruturação hierárquica de certificados digitais: Root CA auto-assinada, Intermediate CA emissora e Certificado de Servidor.',
    interactionType: 'CONNECT',
    prerequisiteSlugs: ['symmetric-vs-asymmetric'],
    learningContent: {
      overview: 'Uma PKI (Public Key Infrastructure) resolve o problema de validar se uma chave pública pertence realmente a quem alega pertencer. Uma Autoridade Certificadora (CA) assina digitalmente o certificado digital X.509 atestando essa identidade.',
      keyPoints: [
        'Root CA: Âncora de confiança máxima. Seu certificado é auto-assinado e embutido no Trust Store do sistema operacional ou navegador.',
        'Intermediate CA: Protege a chave da Root CA mantida offline e realiza a emissão contínua de certificados.',
        'Validação da Cadeia: O cliente valida a assinatura do certificado folha subindo nó a nó até encontrar uma Root CA confiável no repositório local.'
      ]
    },
    challenges: [
      {
        id: 'pki-lvl-1',
        conceptId: 'crypto-pki-chain',
        type: 'CONNECT',
        level: 'INTERMEDIATE',
        prompt: 'Qual entidade da hierarquia PKI possui certificado digital auto-assinado (Self-Signed) e precisa residir no Trust Store do cliente para que conexões TLS sejam aceitas?',
        hint: 'Nó do topo da árvore de confiança.',
        config: { inputLabel: 'Tipo de Autoridade' },
        solution: { expectedAnswer: 'Root CA' },
        pedagogicalExplanation: 'A Root CA (Autoridade Certificadora Raiz) assina a si mesma e atua como a âncora de confiança definitiva inserida no sistema operacional.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 4. DOMÍNIO: IDENTITY
  // ==========================================================================
  {
    id: 'id-authn-vs-authz',
    slug: 'authentication-vs-authorization',
    title: 'Autenticação (AuthN) vs Autorização (AuthZ)',
    category: 'IDENTITY',
    level: 'BEGINNER',
    shortDescription: 'Verificação inequívoca da identidade de um sujeito versus concessão explícita de permissões para agir sobre recursos.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['least-privilege'],
    learningContent: {
      overview: 'Autenticação (AuthN) responde à pergunta "Quem é você?" validando credenciais (senhas, certificados, biometria). Autorização (AuthZ) responde à pergunta "O que você tem permissão para fazer?" validando políticas e papéis atribuídos.',
      keyPoints: [
        'AuthN sempre precede AuthZ: Não é possível autorizar uma ação sem antes saber quem é o sujeito solicitante.',
        'Falhas de AuthN: Senhas fracas, ausência de MFA, credential stuffing.',
        'Falhas de AuthZ: IDOR (Insecure Direct Object References), escalonamento vertical de privilégios.'
      ]
    },
    challenges: [
      {
        id: 'auth-lvl-1',
        conceptId: 'id-authn-vs-authz',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Quando um sistema checa se o usuário autenticado "finance_analyst" possui permissão para excluir um registro contábil, ele está executando qual processo?',
        hint: 'AuthN ou AuthZ?',
        config: { inputLabel: 'Processo' },
        solution: { expectedAnswer: 'Autorização' },
        pedagogicalExplanation: 'Verificar se uma identidade confirmada possui permissão de leitura, escrita ou exclusão sobre um recurso específico é o papel da Autorização (AuthZ).',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'id-rbac',
    slug: 'rbac-role-based-access',
    title: 'Controle de Acesso Baseado em Papéis (RBAC)',
    category: 'IDENTITY',
    level: 'BEGINNER',
    shortDescription: 'Atribuição de permissões a funções de trabalho (Roles) em vez de diretamente a usuários individuais, simplificando governança.',
    interactionType: 'BUILD',
    prerequisiteSlugs: ['authentication-vs-authorization'],
    learningContent: {
      overview: 'RBAC (Role-Based Access Control) agrupa permissões em "Papéis" (Roles) que representam atribuições funcionais na organização. Os usuários são vinculados a papéis, herdando suas políticas.',
      keyPoints: [
        'Evita Privilege Creep: Permissões acumuladas indevidamente quando funcionários mudam de departamento.',
        'Mapeamento: Usuário ➔ Papel (Role) ➔ Permissões.',
        'Comparação com ABAC: ABAC (Attribute-Based) é mais granular, avaliando atributos dinâmicos como horário e IP do usuário.'
      ]
    },
    challenges: [
      {
        id: 'rbac-lvl-1',
        conceptId: 'id-rbac',
        type: 'BUILD',
        level: 'BEGINNER',
        prompt: 'No modelo RBAC, a quem as permissões técnicas são diretamente associadas antes que usuários sejam atribuídos?',
        hint: 'Termo que dá nome ao modelo.',
        config: { inputLabel: 'Entidade intermediária' },
        solution: { expectedAnswer: 'Papel' },
        pedagogicalExplanation: 'No RBAC, as permissões são associadas a Papéis (Roles), e os usuários são associados aos papéis pertinentes.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'id-kerberos-flow',
    slug: 'kerberos-auth-flow',
    title: 'Autenticação Kerberos: O Mecanismo Central do Active Directory',
    category: 'IDENTITY',
    level: 'INTERMEDIATE',
    shortDescription: 'Troca de bilhetes seguros baseados em criptografia simétrica: AS-REQ/REP (TGT), TGS-REQ/REP e AP-REQ para serviços.',
    interactionType: 'TRACE',
    prerequisiteSlugs: ['authentication-vs-authorization', 'symmetric-vs-asymmetric'],
    learningContent: {
      overview: 'O Kerberos é o protocolo de autenticação padrão do Microsoft Windows Active Directory. Ele elimina o envio de senhas na rede utilizando tickets criptografados emitidos pelo KDC (Key Distribution Center).',
      keyPoints: [
        'TGT (Ticket Granting Ticket): Emitido pelo Authentication Service (AS) usando a chave da conta KRBTGT.',
        'TGS (Ticket Granting Service): Recebe o TGT do cliente e emite um Service Ticket para o serviço de destino.',
        'Ataques clássicos: Golden Ticket (forja do TGT via krbtgt), Silver Ticket (forja do Service Ticket via conta de serviço) e Kerberoasting.'
      ]
    },
    challenges: [
      {
        id: 'kerb-lvl-1',
        conceptId: 'id-kerberos-flow',
        type: 'TRACE',
        level: 'INTERMEDIATE',
        prompt: 'Qual conta do Active Directory possui a chave criptográfica que assina e protege o TGT no Kerberos?',
        hint: 'Conta especial de sistema do KDC.',
        config: { inputLabel: 'Nome da Conta' },
        solution: { expectedAnswer: 'krbtgt' },
        pedagogicalExplanation: 'A conta KRBTGT é a conta de serviço do KDC responsável por emitir e assinar os TGTs em todo o domínio Active Directory.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 5. DOMÍNIO: CLOUD
  // ==========================================================================
  {
    id: 'cloud-shared-responsibility',
    slug: 'cloud-shared-responsibility',
    title: 'Modelo de Responsabilidade Compartilhada na Nuvem',
    category: 'CLOUD',
    level: 'BEGINNER',
    shortDescription: 'Demarcação das fronteiras de segurança entre Provedor de Nuvem (Segurança DA Nuvem) e Cliente (Segurança NA Nuvem) em IaaS, PaaS e SaaS.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['cia-triad'],
    learningContent: {
      overview: 'Na computação em nuvem, a segurança é uma responsabilidade dividida. O provedor protege a infraestrutura física, data centers e hipervisores (Segurança DA Nuvem). O cliente protege seus dados, identidades, configurações de firewall e sistemas operacionais (Segurança NA Nuvem).',
      keyPoints: [
        'IaaS (ex: VMs EC2/Compute Engine): Cliente gerencia SO, patches, firewall e dados.',
        'PaaS (ex: App Services, RDS): Provedor gerencia SO e infraestrutura; cliente gerencia código, credenciais e dados.',
        'SaaS (ex: Microsoft 365): Provedor gerencia toda a aplicação; cliente gerencia identidades, acessos e classificação da informação.'
      ]
    },
    challenges: [
      {
        id: 'cloud-resp-lvl-1',
        conceptId: 'cloud-shared-responsibility',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Em um modelo IaaS (Máquina Virtual em Nuvem), quem é o responsável pela aplicação regular de patches de segurança e updates do Sistema Operacional convidado?',
        hint: 'Cliente ou Provedor?',
        config: { inputLabel: 'Responsável' },
        solution: { expectedAnswer: 'Cliente' },
        pedagogicalExplanation: 'Em IaaS, o provedor garante apenas o hardware e o hipervisor físico. A configuração, hardening e atualização do Sistema Operacional convidado é responsabilidade exclusiva do Cliente.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'cloud-iam-policy',
    slug: 'cloud-iam-permissions',
    title: 'Políticas Cloud IAM & Mecanismo de Avaliação',
    category: 'CLOUD',
    level: 'INTERMEDIATE',
    shortDescription: 'Declarações JSON de controle de acesso (Principal, Action, Resource, Effect, Condition) e a precedência absoluta de Explicit Deny.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['cloud-shared-responsibility', 'least-privilege'],
    learningContent: {
      overview: 'No Cloud IAM, todas as requisições de API iniciam com um "Default Deny". O mecanismo de avaliação examina políticas atreladas à identidade e ao recurso, onde qualquer "Explicit Deny" sobrepõe imediatamente qualquer declaração de "Allow".',
      keyPoints: [
        'Estrutura: Principal (quem solicita), Action (qual API), Resource (qual recurso ARN/URI), Effect (Allow/Deny) e Condition (restrições contextuais como IP e MFA).',
        'Precedência: Deny Explícito > Allow Explícito > Deny Implícito (Padrão).',
        'Wildcard de Alto Risco: Atribuir Action: "*" em Resource: "*" concede controle irrestrito ao ambiente.'
      ]
    },
    challenges: [
      {
        id: 'iam-lvl-1',
        conceptId: 'cloud-iam-policy',
        type: 'CLASSIFY',
        level: 'INTERMEDIATE',
        prompt: 'Se uma política possui um bloco ALLOW para "s3:*" e outra política associada possui um bloco DENY para "s3:DeleteBucket", o que acontece quando o usuário tenta excluir um bucket?',
        hint: 'Qual declaração possui precedência absoluta no Cloud IAM?',
        config: { inputLabel: 'Resultado' },
        solution: { expectedAnswer: 'DENY' },
        pedagogicalExplanation: 'No Cloud IAM, uma negação explícita (Explicit Deny) sempre tem precedência sobre qualquer permissão permissiva concedida.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 6. DOMÍNIO: SOC
  // ==========================================================================
  {
    id: 'soc-event-alert-incident',
    slug: 'event-vs-log-vs-alert-vs-incident',
    title: 'Taxonomia de SOC: Evento vs Log vs Alerta vs Incidente',
    category: 'SOC',
    level: 'BEGINNER',
    shortDescription: 'Diferenciação operacional do pipeline de monitoramento: registros brutos até a confirmação de impacto de segurança real.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['cia-triad'],
    learningContent: {
      overview: 'No SOC, entender a pirâmide de telemetria evita fadiga de alertas: um Log é o registro bruto de um evento; um Alerta é a sinalização de um evento incomum por uma regra de detecção; um Incidente é a confirmação de que um alerta causou ou pode causar impacto real à segurança.',
      keyPoints: [
        'Evento: Qualquer ocorrência observável em um sistema (ex: usuário fez login, pacote passou no firewall).',
        'Log: Representação computacional persistida do evento.',
        'Alerta: Notificação gerada pelo SIEM/EDR quando regras de detecção são ativadas.',
        'Incidente: Evento adverso que ameaça ativamente a confidencialidade, integridade ou disponibilidade.'
      ]
    },
    challenges: [
      {
        id: 'soc-tax-lvl-1',
        conceptId: 'soc-event-alert-incident',
        type: 'CLASSIFY',
        level: 'BEGINNER',
        prompt: 'Qual termo técnico designa a confirmação de que uma violação de segurança ocorreu e exige a mobilização do time de resposta?',
        hint: 'Alerta ou Incidente?',
        config: { inputLabel: 'Termo' },
        solution: { expectedAnswer: 'Incidente' },
        pedagogicalExplanation: 'Um Incidente de Segurança é um alerta confirmado que resultou em impacto ou risco iminente às operações da organização.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'soc-siem-correlation',
    slug: 'siem-log-correlation',
    title: 'Correlação de Logs no SIEM (Security Information & Event Management)',
    category: 'SOC',
    level: 'INTERMEDIATE',
    shortDescription: 'Agregação centralizada de telemetria e relacionamento cronológico de logs heterogêneos para revelar cadeias completas de ataque.',
    interactionType: 'CONNECT',
    prerequisiteSlugs: ['event-vs-log-vs-alert-vs-incident', 'firewall-acl'],
    learningContent: {
      overview: 'O SIEM ingere logs de dezenas de fontes (Firewall, Active Directory, EDR, DNS, Proxy) e correlaciona eventos através de regras analíticas temporais e causais para expor ataques multi-estágio que passariam desapercebidos de forma isolada.',
      keyPoints: [
        'Normalização de Logs: Converte formatos heterogêneos (Syslog, Windows XML, JSON) em esquema comum (CIM, ECS, OCSF).',
        'Detecção Temporal: Identifica, por exemplo, 50 falhas de login (AD) seguidas de 1 sucesso e subsequente download suspeito (Proxy).',
        'Redução de Falsos Positivos: A correlação contextual valida se o IP de destino realmente existe e se a máquina é um servidor vulnerável.'
      ]
    },
    challenges: [
      {
        id: 'siem-lvl-1',
        conceptId: 'soc-siem-correlation',
        type: 'CONNECT',
        level: 'INTERMEDIATE',
        prompt: 'Qual é o nome do processo que transforma logs de múltiplos formatos diferentes em campos padronizados (ex: src_ip, user, dest_port)?',
        hint: 'Processo de padronização.',
        config: { inputLabel: 'Nome do Processo' },
        solution: { expectedAnswer: 'Normalização' },
        pedagogicalExplanation: 'A Normalização de logs mapeia eventos de fabricantes distintos para esquemas padronizados (como OCSF ou Elastic Common Schema), permitindo correlação universal.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 7. DOMÍNIO: LINUX
  // ==========================================================================
  {
    id: 'linux-permissions-posix',
    slug: 'linux-file-permissions',
    title: 'Permissões POSIX do Linux (Modo Octal & Simbólico)',
    category: 'LINUX',
    level: 'BEGINNER',
    shortDescription: 'Cálculo dos bits r (4), w (2), x (1) para Owner, Group e Others, comando chmod e implicações de segurança como permissões 777.',
    interactionType: 'BUILD',
    prerequisiteSlugs: ['least-privilege'],
    learningContent: {
      overview: 'No Linux, cada arquivo e diretório possui um conjunto de permissões atribuídas a três entidades: Usuário Dono (u), Grupo (g) e Outros (o). A representação octal soma valores binários: Leitura r=4, Escrita w=2 e Execução x=1.',
      keyPoints: [
        'rwx em diretórios: x é necessário para entrar (cd) no diretório; r para listar (ls); w para criar/excluir arquivos.',
        'Notação octal comum: 755 (rwxr-xr-x) para binários públicos; 644 (rw-r--r--) para arquivos de texto; 600 (rw-------) para chaves privadas SSH.',
        'Risco do chmod 777: Permite que qualquer usuário local ou serviço comprometido altere, injete código ou apague o arquivo.'
      ]
    },
    challenges: [
      {
        id: 'lnx-perm-lvl-1',
        conceptId: 'linux-permissions-posix',
        type: 'BUILD',
        level: 'BEGINNER',
        prompt: 'Qual é a representação octal que concede Leitura e Escrita para o Dono (4+2=6) e NENHUM acesso para Grupo e Outros (0 e 0)?',
        hint: 'Comando chmod comum para chaves SSH.',
        config: { inputLabel: 'Valor Octal' },
        solution: { expectedAnswer: '600' },
        pedagogicalExplanation: 'O valor 600 concede rw- para o proprietário e proíbe qualquer leitura ou escrita de terceiros, padrão exigido pelo OpenSSH.',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'linux-suid-privilege',
    slug: 'linux-privilege-escalation-suid',
    title: 'Bit SUID (SetUID) & Escalonamento de Privilégios no Linux',
    category: 'LINUX',
    level: 'ADVANCED',
    shortDescription: 'Mecanismo que executa binários com privilégios do proprietário (root) e técnicas de abuso para ganho de shell administrativa.',
    interactionType: 'IDENTIFY',
    prerequisiteSlugs: ['linux-file-permissions'],
    learningContent: {
      overview: 'O bit SUID (SetUID, representado pela letra "s" nas permissões do dono, ex: -rwsr-xr-x) faz com que um programa seja executado com as permissões do dono do arquivo (geralmente root) em vez das permissões do usuário que o invocou (ex: /usr/bin/passwd).',
      keyPoints: [
        'Finalidade legítima: Permitir que usuários comuns alterem suas próprias senhas modificando /etc/shadow.',
        'Vetor de Ataque (GTFOBins): Se um binário como find, nmap, vim ou python tiver o bit SUID ativo, um invasor pode invocar comandos arbitrários herdando privilégios de root.',
        'Detecção: Comando "find / -perm -4000 -type f 2>/dev/null" lista todos os arquivos SUID do sistema.'
      ]
    },
    challenges: [
      {
        id: 'suid-lvl-1',
        conceptId: 'linux-privilege-escalation-suid',
        type: 'IDENTIFY',
        level: 'ADVANCED',
        prompt: 'Qual valor numérico de permissão especial de 4 dígitos ativa o bit SUID em um binário executável?',
        hint: 'Dígito especial que antecede o trio padrão (ex: 4755 vs 2755 vs 1755).',
        config: { inputLabel: 'Dígito especial' },
        solution: { expectedAnswer: '4000' },
        pedagogicalExplanation: 'O bit SUID corresponde ao valor octal 4000 (ex: chmod 4755). O SGID corresponde a 2000 e o Sticky Bit corresponde a 1000.',
        orderIndex: 1
      }
    ]
  },

  // ==========================================================================
  // 8. DOMÍNIO: WINDOWS
  // ==========================================================================
  {
    id: 'win-event-logs-forensics',
    slug: 'windows-event-analysis',
    title: 'Análise de Logs de Eventos do Windows (Security Event IDs)',
    category: 'WINDOWS',
    level: 'INTERMEDIATE',
    shortDescription: 'Identificação forense de atividade maliciosa através dos principais Event IDs: 4624 (Logon), 4625 (Falha), 4688 (Processos) e 7045 (Serviços).',
    interactionType: 'IDENTIFY',
    prerequisiteSlugs: ['event-vs-log-vs-alert-vs-incident'],
    learningContent: {
      overview: 'O Windows registra eventos de auditoria no Security Log. Cada Event ID possui parâmetros cruciais como Logon Type (2=Console, 3=Rede SMB, 10=RDP) e linha de comando de novos processos.',
      keyPoints: [
        'Event ID 4624: Logon bem-sucedido. Logon Type 10 indica acesso via Remote Desktop (RDP).',
        'Event ID 4625: Tentativa de logon falha. Múltiplos eventos seguidos sugerem ataque de Brute Force ou Password Spraying.',
        'Event ID 4688: Novo processo criado. Permite auditar chamadas como powershell.exe -ExecutionPolicy Bypass.',
        'Event ID 7045: Novo serviço instalado no sistema operacional (frequentemente abusado para Persistência e Movimentação Lateral com PsExec).'
      ]
    },
    challenges: [
      {
        id: 'win-evt-lvl-1',
        conceptId: 'win-event-logs-forensics',
        type: 'IDENTIFY',
        level: 'INTERMEDIATE',
        prompt: 'No Event ID 4624 (Logon com sucesso), qual valor numérico do campo "Logon Type" indica uma sessão remota via RDP / Terminal Services?',
        hint: 'Número entre 1 e 12.',
        config: { inputLabel: 'Logon Type' },
        solution: { expectedAnswer: '10' },
        pedagogicalExplanation: 'Logon Type 10 (RemoteInteractive) indica que a conexão foi realizada remotamente através de RDP (Terminal Services).',
        orderIndex: 1
      }
    ]
  },
  {
    id: 'win-active-directory-dc',
    slug: 'active-directory-domain-controller',
    title: 'Active Directory & Domain Controllers (AD DS)',
    category: 'WINDOWS',
    level: 'INTERMEDIATE',
    shortDescription: 'O serviço de diretório corporativo do Windows: florestas, domínios, replicação de banco NTDS.dit e protocolo LDAP/Kerberos.',
    interactionType: 'CLASSIFY',
    prerequisiteSlugs: ['kerberos-auth-flow', 'windows-event-analysis'],
    learningContent: {
      overview: 'O Active Directory Domain Services (AD DS) gerencia identidades, políticas (GPO) e permissões de forma centralizada em redes corporativas Windows.',
      keyPoints: [
        'Domain Controller (DC): Servidor que autentica usuários e hospeda o banco de dados NTDS.dit.',
        'GPO (Group Policy Object): Permite configurar e forçar configurações de segurança em milhares de endpoints simultaneamente.',
        'Ataques Críticos: DCSync (replicação não autorizada de hashes de senha de todos os usuários do domínio).'
      ]
    },
    challenges: [
      {
        id: 'ad-lvl-1',
        conceptId: 'win-active-directory-dc',
        type: 'CLASSIFY',
        level: 'INTERMEDIATE',
        prompt: 'Qual é o nome do arquivo de banco de dados do Active Directory onde ficam armazenados os hashes de senhas e objetos de todo o domínio no Domain Controller?',
        hint: 'Arquivo com extensão .dit localizado em %SystemRoot%\\NTDS.',
        config: { inputLabel: 'Nome do Arquivo' },
        solution: { expectedAnswer: 'NTDS.dit' },
        pedagogicalExplanation: 'O arquivo NTDS.dit é o banco de dados central do Active Directory. Obter uma cópia desse arquivo permite extrair os hashes de todos os usuários do domínio.',
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
