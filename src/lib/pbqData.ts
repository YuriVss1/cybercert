export type PbqDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type PbqCategory = 
  | 'Incident Response' 
  | 'Network Security' 
  | 'IAM & Cloud' 
  | 'Threat Intel & SecOps' 
  | 'SOC & Log Analysis' 
  | 'Endpoint Security' 
  | 'Cloud Security' 
  | 'Criptografia & PKI' 
  | 'Troubleshooting CLI' 
  | 'SOC & Network Traffic';

export type PbqErrorType = 
  | 'wrong_target' 
  | 'wrong_action' 
  | 'dangerous_action' 
  | 'incomplete_action' 
  | 'missed_indicator' 
  | 'delayed_action';

export type PbqConsequenceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PbqActionResult {
  correct: boolean;
  actionId: string;
  errorType?: PbqErrorType;
  consequence?: {
    title?: string;
    actionTaken: string;
    consequence: string;
    severity?: PbqConsequenceSeverity;
  };
}

export interface PbqLabProps {
  onActionSubmit: (result: PbqActionResult) => void;
  isLocked: boolean;
}

export function deterministicShuffle<T>(array: T[], seed = 1337): T[] {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}


export interface PbqDebriefInfo {
  summary: string;
  rootCause: string;
  correctSteps: string[];
  keyTakeaways: string;
}

export interface PbqOperation {
  id: string;
  opCode: string;
  title: string;
  category: PbqCategory;
  difficulty: PbqDifficulty;
  timeLimit: number; // 90 segundos
  objective: string;
  incidentCode: string;
  environment: string;
  whatHappened: string;
  technicalRisk: string;
  actionPrompt: string;
  consequenceOnTimeout: {
    title: string;
    consequence: string;
    compromiseDetail: string;
  };
  consequences: Record<string, { title?: string; actionTaken: string; consequence: string; severity?: PbqConsequenceSeverity }>;
  debrief: PbqDebriefInfo;
}

export interface PbqIncidentEvent {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  source: string;
  description: string;
  targetHost: string;
}

// Eventos em tempo real para o Incident Ticker
export const LIVE_INCIDENT_FEED: PbqIncidentEvent[] = [
  { id: 'evt-1', timestamp: '19:14:02', severity: 'CRITICAL', source: 'EDR-Falcon', description: 'Atividade de criptografia em massa detectada em /shares/finance', targetHost: 'FILE-SRV-01' },
  { id: 'evt-2', timestamp: '19:14:18', severity: 'HIGH', source: 'Suricata-IDS', description: 'Inbound RDP brute force (Port 3389) a partir de 185.220.101.5', targetHost: 'DC-PRIMARY' },
  { id: 'evt-3', timestamp: '19:14:32', severity: 'CRITICAL', source: 'AWS-GuardDuty', description: 'Bucket S3 público gerando tráfego de leitura anômalo', targetHost: 's3://backup-corp-internal' },
  { id: 'evt-4', timestamp: '19:14:45', severity: 'HIGH', source: 'Sysmon-WEC', description: 'winword.exe gerou powershell.exe com flag -EncodedCommand', targetHost: 'WS-EXEC-04' },
  { id: 'evt-5', timestamp: '19:15:01', severity: 'MEDIUM', source: 'Exchange-Sec', description: 'E-mail com SPF fail e punycode pаypal.com entregue na caixa de entrada', targetHost: 'MX-GATEWAY-02' },
  { id: 'evt-6', timestamp: '19:15:20', severity: 'CRITICAL', source: 'Zeek-Bro', description: 'Pico de tráfego de saída 850 MB/s via porta 443 para ASN russo não mapeado', targetHost: 'DB-CLIENTS-01' },
  { id: 'evt-7', timestamp: '19:15:38', severity: 'HIGH', source: 'Splunk-SIEM', description: '124 falhas consecutivas de autenticação SSH seguidas de login bem-sucedido', targetHost: 'LINUX-JUMP-01' },
  { id: 'evt-8', timestamp: '19:15:52', severity: 'HIGH', source: 'ArpWatch', description: 'Conflito de endereço MAC para o Default Gateway 192.168.10.1', targetHost: 'VLAN-USERS' },
  { id: 'evt-9', timestamp: '19:16:10', severity: 'CRITICAL', source: 'PaloAlto-FW', description: 'Comunicação DNS tunneling detectada na sub-rede de servidores de aplicação', targetHost: 'APP-SRV-03' },
  { id: 'evt-10', timestamp: '19:16:29', severity: 'HIGH', source: 'Nginx-WAF', description: 'Cadeia de certificados TLS expirou no endpoint de pagamentos', targetHost: 'api.rootsec.academy' }
];

export const PBQ_OPERATIONS: PbqOperation[] = [
  // 1. Ransomware Lateral Movement Containment
  {
    id: 'pbq-001',
    opCode: 'OP-001',
    title: 'Ransomware Lateral Movement Containment',
    category: 'Incident Response',
    difficulty: 'Intermediate',
    timeLimit: 90,
    objective: 'Analisar a topologia e telemetria de rede, identificar o paciente zero ativo e isolar o host correto da rede antes que o compartilhamento de arquivos seja criptografado.',
    incidentCode: 'INC-4091',
    environment: 'VLAN Corporativa / Sub-rede Financeiro (192.168.10.0/24)',
    whatHappened: 'Um colaborador da contabilidade abriu um anexo suspeito em sua estação. O processo malicioso iniciou conexões SMB massivas na porta 445 e leitura sequencial de volumes de rede.',
    technicalRisk: 'Se o paciente zero não for isolado em menos de 90 segundos, o ransomware propagará chaves públicas para os servidores de arquivos e tornará os bancos de dados inoperantes.',
    actionPrompt: 'Inspecione a telemetria das 4 estações e do servidor de arquivos. Localize o host com pico anômalo de SMB e CPU e ordene o ISOLAMENTO DE REDE IMEDIATO.',
    consequenceOnTimeout: {
      title: 'CRIPTOGRAFIA TOTAL DO SERVIDOR DE ARQUIVOS',
      consequence: 'O ransomware criptografou com AES-256 todos os diretórios do servidor FILE-SRV-01. As cópias de sombra (VSS) foram deletadas.',
      compromiseDetail: 'Perda de 4,2 TB de dados fiscais e contábeis da organização.'
    },
    consequences: {
      'isolate-server': {
        title: 'ALVO INCORRETO: SERVIDOR ISOLADO',
        actionTaken: 'Você isolou o servidor de arquivos FILE-SRV-01 em vez do endpoint infectado.',
        consequence: 'O processo malicioso no endpoint permaneceu ativo e redirecionou as conexões SMB para as outras estações de trabalho vizinhas.',
        severity: 'critical'
      },
      'isolate-clean-host': {
        title: 'ALVO INCORRETO: ESTAÇÃO ÍNTEGRA',
        actionTaken: 'Você isolou uma estação de trabalho íntegra sem infecção.',
        consequence: 'O paciente zero continuou operando sem restrições, mantendo as transmissões criptográficas em segundo plano.',
        severity: 'high'
      }
    },
    debrief: {
      summary: 'Contenção tática de movimento lateral de ransomware via protocolo SMB (Porta 445).',
      rootCause: 'Execução de macro em documento recebido por spear phishing no endpoint WS-FIN-03 (192.168.10.22), gerando varredura e conexões ativas na porta SMB 445.',
      correctSteps: [
        'Analisar a matriz de telemetria dos hosts (consumo de CPU, arquivos renomeados com extensões anômalas e conexões SMB ativas).',
        'Identificar que WS-FIN-03 apresentava 94% de CPU e sessões ativas com FILE-SRV-01 e WS-FIN-02.',
        'Emitir ordem de isolamento de rede do endpoint WS-FIN-03 no nível do EDR/Switch.',
        'Preservar os servidores de arquivos sem derrubar serviços da LAN inteira.'
      ],
      keyTakeaways: 'Em contenção de ransomware, o objetivo primário é isolar o paciente zero na camada de enlace/EDR, impedindo a progressão do ataque sem causar indisponibilidade em ativos sadios.'
    }
  },

  // 2. Stateful Firewall ACL Configuration
  {
    id: 'pbq-002',
    opCode: 'OP-002',
    title: 'Stateful Firewall ACL Hardening',
    category: 'Network Security',
    difficulty: 'Intermediate',
    timeLimit: 90,
    objective: 'Reordenar e corrigir a lista de controle de acesso (ACL) de borda para aplicar a política de Least Privilege sem interromper o portal web legítimo.',
    incidentCode: 'INC-3188',
    environment: 'Firewall de Borda Corporativo (Edge ASA-5585)',
    whatHappened: 'A auditoria identificou regras de firewall com política excessivamente permissiva ("PERMIT ANY") antes de regras de bloqueio, além de porta RDP (3389) exposta para a internet pública.',
    technicalRisk: 'Invasores externos estão explorando a regra aberta para conduzir força bruta RDP e varreduras de portas nos servidores internos.',
    actionPrompt: 'Ajuste a ordem das regras top-down, bloqueie o tráfego RDP externo não autorizado e assegure a regra implícita DENY ALL ao final.',
    consequenceOnTimeout: {
      title: 'INVASÃO VIA RDP EXPOSTO',
      consequence: 'O atacante autenticou na porta 3389 exposta utilizando credenciais vazadas e instalou um backdoor na DMZ.',
      compromiseDetail: 'Comprometimento do servidor WEB-SRV-01 com shell reversa ativa.'
    },
    consequences: {
      'allow-rdp-any': {
        title: 'EXPOSIÇÃO CRÍTICA DE PORTA DE GERÊNCIA',
        actionTaken: 'Você manteve a permissão de RDP (3389) aberta a partir de qualquer origem da internet.',
        consequence: 'A porta de gerenciamento remoto do servidor continuou respondendo a varreduras automatizadas externas.',
        severity: 'critical'
      },
      'deny-before-https': {
        title: 'INDISPONIBILIDADE DE SERVIÇO (OUTAGE)',
        actionTaken: 'Você inseriu uma regra DENY ALL antes da liberação do tráfego HTTPS legítimo.',
        consequence: 'O portal corporativo tornou-se inacessível para todos os clientes legítimos da internet.',
        severity: 'high'
      }
    },
    debrief: {
      summary: 'Endurecimento de ACL em firewall stateful utilizando princípio de Top-Down Evaluation.',
      rootCause: 'Configuração incorreta de regras onde regras genéricas ou portas administrativas (3389) foram liberadas antes da filtragem restritiva.',
      correctSteps: [
        'Permitir tráfego HTTPS (TCP 443) da internet para o servidor Web.',
        'Bloquear explicitamente porta RDP (TCP 3389) vinda de endereços públicos.',
        'Permitir tráfego DNS estabelecido (UDP 53) e ICMP necessário.',
        'Posicionar a regra DENY ANY ANY estritamente na última linha da ACL (Drop implícito).'
      ],
      keyTakeaways: 'Firewalls avaliam regras sequencialmente de cima para baixo. Uma regra "DENY ALL" no topo derruba toda a rede, enquanto portas administrativas no topo expõem a infraestrutura a ataques diretos.'
    }
  },

  // 3. IAM Privilege Escalation Remediation
  {
    id: 'pbq-003',
    opCode: 'OP-003',
    title: 'IAM Privilege Escalation Remediation',
    category: 'IAM & Cloud',
    difficulty: 'Intermediate',
    timeLimit: 90,
    objective: 'Identificar a política IAM com permissões excessivas (*), revogar o acesso não autorizado e impor Least Privilege.',
    incidentCode: 'INC-7210',
    environment: 'AWS IAM / Conta de Produção (ID: 9481-2201-9012)',
    whatHappened: 'Uma credencial de automação de backup (svc-backup) recebeu inesperadamente a política AdministratorAccess com wildcard "*:*". Chaves de acesso foram geradas fora do horário comercial.',
    technicalRisk: 'Chaves vazadas com privilégios de Admin podem destruir ou alterar toda a infraestrutura em nuvem.',
    actionPrompt: 'Inspecione as políticas da conta svc-backup, remova AdministratorAccess e anexe estritamente a política mínima de backup com MFA exigido.',
    consequenceOnTimeout: {
      title: 'TAKEOVER COMPLETO DA CONTA CLOUD',
      consequence: 'O invasor utilizou as chaves de Admin para criar instâncias de mineração e desabilitar o CloudTrail.',
      compromiseDetail: 'Prejuízo de $45.000 em instâncias GPU não autorizadas.'
    },
    consequences: {
      'delete-account': {
        title: 'DELEÇÃO DESTRUTIVA DE CONTA',
        actionTaken: 'Você deletou a conta de serviço inteira em vez de apenas revogar os privilégios indevidos.',
        consequence: 'Todas as rotinas diárias automatizadas de backup do banco de dados de clientes falharam imediatamente.',
        severity: 'high'
      },
      'keep-wildcard': {
        title: 'MANUTENÇÃO DE WILDCARD DE ALTO RISCO',
        actionTaken: 'Você manteve a permissão s3:* com wildcard completo sem restrição de recursos.',
        consequence: 'O atacante teve permissão para apagar versões históricas e backups em buckets sensíveis.',
        severity: 'critical'
      }
    },
    debrief: {
      summary: 'Remediação de escalação de privilégios IAM e imposição do princípio de menor privilégio (Least Privilege).',
      rootCause: 'Atribuição inadequada da managed policy AdministratorAccess (*:*) para conta de serviço de rotina de backup.',
      correctSteps: [
        'Desanexar a política AdministratorAccess da identidade svc-backup.',
        'Anexar a política granular AWSBackupServicePolicy com escopo restrito a volumes específicos.',
        'Exigir condição aws:MultiFactorAuthPresent para chamadas administrativas sensíveis.',
        'Manter a conta operacional sem destruição inadvertida de dependências de produção.'
      ],
      keyTakeaways: 'Contas de serviço automatizadas nunca devem possuir permissões administrativas globais (*:*). A revogação deve ser cirúrgica, evitando a indisponibilidade de rotinas essenciais.'
    }
  },

  // 4. Phishing Header & Spoofing Analysis
  {
    id: 'pbq-004',
    opCode: 'OP-004',
    title: 'Phishing Header & Spoofing Analysis',
    category: 'Threat Intel & SecOps',
    difficulty: 'Beginner',
    timeLimit: 90,
    objective: 'Analisar cabeçalhos RFC 822 de um e-mail suspeito, identificar falhas de autenticação (SPF/DKIM/Punycode) e neutralizar o remetente.',
    incidentCode: 'INC-1940',
    environment: 'Gateway de E-mail Corporativo (Mail Transfer Agent)',
    whatHappened: 'A diretoria financeira recebeu um e-mail urgente solicitando transferência Pix, supostamente vindo de "ceo@empresa.com", com anexo contendo macro maliciosa.',
    technicalRisk: 'Se o operador liberar a mensagem ou não bloquear o IP de origem, usuários podem transferir fundos para a conta do fraudador.',
    actionPrompt: 'Examine os campos SPF, DKIM, Return-Path e o domínio de origem. Aplique a ação de Quarentena e Bloqueio no MX.',
    consequenceOnTimeout: {
      title: 'FRAUDE FINANCEIRA CONCLUÍDA',
      consequence: 'A mensagem foi entregue à caixa postal e um analista financeiro executou o anexo malicioso.',
      compromiseDetail: 'Transferência fraudulenta de R$ 180.000 efetuada sem validação adicional.'
    },
    consequences: {
      'whitelist-sender': {
        title: 'LIBERAÇÃO INDEVIDA DE REMETENTE MALICIOSO',
        actionTaken: 'Você colocou o domínio remetente na whitelist de confiança.',
        consequence: 'O invasor passou a enviar centenas de e-mails de phishing diretamente para a caixa de todos os colaboradores sem inspeção.',
        severity: 'critical'
      },
      'ignore-spf-fail': {
        title: 'FALHA DE VALIDAÇÃO DE AUTENTICIDADE',
        actionTaken: 'Você marcou como legítimo um e-mail com resultado "SPF: Fail" e "DKIM: None".',
        consequence: 'Credenciais corporativas de funcionários foram capturadas na página falsa de login.',
        severity: 'high'
      }
    },
    debrief: {
      summary: 'Análise forense de cabeçalhos RFC 822 e contenção de spoofing de identidade no MTA.',
      rootCause: 'Uso de servidor SMTP externo não autorizado tentando se passar pelo domínio corporativo, falhando nos testes SPF e DKIM com domínio punycode enganoso.',
      correctSteps: [
        'Inspecionar o cabeçalho Authentication-Results (SPF: Fail, IP 185.220.101.5 não autorizado no registro TXT).',
        'Detectar a ausência ou assinatura DKIM inválida (DKIM: none).',
        'Notar a discrepância entre o campo From e o Return-Path real do fraudador.',
        'Mover o e-mail para Quarentena e bloquear o IP do MTA emissor no gateway de e-mail.'
      ],
      keyTakeaways: 'Nomes de exibição amigáveis (Display Name) são facilmente falsificados. A validação técnica real depende da verificação estrita de SPF, DKIM e DMARC.'
    }
  },

  // 5. SIEM Log Correlation & Brute Force
  {
    id: 'pbq-005',
    opCode: 'OP-005',
    title: 'SIEM Log Correlation & Brute Force',
    category: 'SOC & Log Analysis',
    difficulty: 'Beginner',
    timeLimit: 90,
    objective: 'Correlacionar eventos de falha de login no SIEM, identificar o IP atacante e a conta visada, bloqueando o perímetro.',
    incidentCode: 'INC-5519',
    environment: 'Splunk SIEM / Servidores Active Directory Domain Controller',
    whatHappened: 'Centenas de eventos Windows Event ID 4625 (Falha de Logon) foram registrados em intervalo de 3 minutos para a conta "svc_database".',
    technicalRisk: 'O invasor pode descobrir a senha por dicionário e obter acesso de leitura direto às bases SQL.',
    actionPrompt: 'Filtre os logs pelo Event ID 4625, encontre o IP externo agressor e execute o bloqueio no firewall de borda + bloqueio preventivo da conta.',
    consequenceOnTimeout: {
      title: 'FORÇA BRUTA BEM-SUCEDIDA',
      consequence: 'O atacante acertou a credencial por força bruta e autenticou com sucesso (Event ID 4624).',
      compromiseDetail: 'Acesso irrestrito concedido à base de clientes contendo 50.000 CPFs.'
    },
    consequences: {
      'block-internal-ip': {
        title: 'BLOQUEIO DO CONTROLADOR DE DOMÍNIO',
        actionTaken: 'Você bloqueou o IP do Domain Controller interno (10.0.0.1) em vez do IP externo atacante.',
        consequence: 'Nenhum usuário da rede corporativa conseguiu autenticar em suas estações de trabalho.',
        severity: 'critical'
      },
      'disable-logging': {
        title: 'DESTRUIÇÃO DE TELEMETRIA FORENSE',
        actionTaken: 'Você limpou a fila de logs do SIEM na tentativa de mitigar o incidente.',
        consequence: 'A equipe de perícia forense perdeu todas as evidências temporais e IPs de origem do ataque.',
        severity: 'high'
      }
    },
    debrief: {
      summary: 'Identificação e contenção de ataque de força bruta contra Active Directory via correlação no SIEM.',
      rootCause: 'Tentativas repetidas de autenticação com senhas incorretas gerando volume maciço de Event ID 4625 (Sub-Status 0xC000006A) a partir do IP externo 185.220.101.44.',
      correctSteps: [
        'Filtrar eventos com EventCode=4625 e analisar a frequência por endereço IP de origem.',
        'Distinguir o IP externo atacante (185.220.101.44) dos IPs dos servidores internos da LAN.',
        'Adicionar o IP agressor à lista de bloqueio de entrada do firewall perimetral.',
        'Bloquear preventivamente a conta de serviço alvo no AD e rotacionar as credenciais.'
      ],
      keyTakeaways: 'A correlação de logs no SIEM deve diferenciar com precisão o Target Host (servidor alvo) do Caller Network Address (origem do ataque) para evitar bloqueios acidentais de sistemas internos.'
    }
  },

  // 6. EDR Process Tree & Persistence
  {
    id: 'pbq-006',
    opCode: 'OP-006',
    title: 'EDR Process Tree & Persistence',
    category: 'Endpoint Security',
    difficulty: 'Advanced',
    timeLimit: 90,
    objective: 'Investigar a árvore de processos do endpoint, localizar a injeção maliciosa em memória, encerrar o processo e limpar a chave de persistência.',
    incidentCode: 'INC-6184',
    environment: 'Estação Windows 11 Enterprise (Host: WS-DIR-01)',
    whatHappened: 'O usuário abriu um documento Word com macros. O Word gerou um processo oculto do PowerShell com payload ofuscado que executou rundll32.exe para persistência.',
    technicalRisk: 'O processo mantém conexão reversa persistente com a infraestrutura C2 do grupo criminoso.',
    actionPrompt: 'Inspecione o PID malicioso na árvore de processos, finalize o processo espúrio e remova a chave Run do Registro.',
    consequenceOnTimeout: {
      title: 'PERSISTÊNCIA CONSOLIDADA NO ENDPOINT',
      consequence: 'O payload instalou um driver de kernel malicioso (rootkit) e desabilitou o antivírus.',
      compromiseDetail: 'Credenciais LSASS despejadas na memória e enviadas para o C2.'
    },
    consequences: {
      'kill-explorer': {
        title: 'ENCERRAMENTO DE PROCESSO LEGÍTIMO',
        actionTaken: 'Você finalizou o processo pai legítimo do Windows Explorer sem desinfectar o binário injetado.',
        consequence: 'A interface gráfica do usuário travou, mas o processo filho malicioso permaneceu rodando em segundo plano.',
        severity: 'high'
      },
      'reboot-endpoint': {
        title: 'REINICIALIZAÇÃO COM PERSISTÊNCIA ATIVA',
        actionTaken: 'Você reiniciou o computador sem remover a chave de persistência do Registro.',
        consequence: 'O malware foi executado automaticamente na inicialização com privilégios elevados.',
        severity: 'critical'
      }
    },
    debrief: {
      summary: 'Investigação forense em EDR de cadeia de processos (Process Spawning) e remoção de persistência.',
      rootCause: 'Cadeia de execução maliciosa originada em WINWORD.EXE (PID 2450) -> powershell.exe ofuscado (PID 6120) -> rundll32.exe (PID 8812), com persistência gravada em HKCU Run.',
      correctSteps: [
        'Analisar a linhagem de processos pai/filho para identificar anomalias comportamentais.',
        'Encerrar os processos maliciosos ativos (rundll32 e powershell oculto).',
        'Excluir a entrada anômala no Registro do Windows (HKCU Run "SecurityUpdate").',
        'Concluir o procedimento mantendo a integridade dos processos essenciais do sistema operacional.'
      ],
      keyTakeaways: 'Reiniciar um endpoint infectado sem antes purgar as chaves de persistência do Registro apenas reativa o malware com novos PIDs.'
    }
  },

  // 7. Cloud S3 Bucket Exposure
  {
    id: 'pbq-007',
    opCode: 'OP-007',
    title: 'Cloud S3 Bucket Exposure',
    category: 'Cloud Security',
    difficulty: 'Beginner',
    timeLimit: 90,
    objective: 'Identificar a política de bucket S3 com leitura pública aberta, remover o Principal wildcard e habilitar criptografia padrão.',
    incidentCode: 'INC-4029',
    environment: 'AWS S3 Storage (Bucket: s3://financial-records-internal)',
    whatHappened: 'Um alerta do AWS Security Hub identificou que a política de bucket continha "Effect: Allow", "Principal: *" e "Action: s3:GetObject", permitindo downloads anônimos pela internet.',
    technicalRisk: 'Arquivos contendo declarações de imposto de renda e extratos de clientes estão indexados e disponíveis publicamente.',
    actionPrompt: 'Edite a política JSON do bucket, ative a opção "Block All Public Access" e exija criptografia KMS.',
    consequenceOnTimeout: {
      title: 'VAZAMENTO PÚBLICO DE DADOS (DATA LEAK)',
      consequence: 'Um bot de scraping da internet detectou o bucket aberto e baixou 80.000 documentos financeiros.',
      compromiseDetail: 'Notificação compulsória emitida para a ANPD com multa de R$ 2.400.000.'
    },
    consequences: {
      'delete-bucket': {
        title: 'PERDA TOTAL DE DADOS HISTÓRICOS',
        actionTaken: 'Você apagou o bucket inteiro em vez de apenas restringir o acesso público.',
        consequence: 'Todos os registros fiscais históricos dos últimos 5 anos foram permanentemente perdidos.',
        severity: 'critical'
      },
      'make-writeable': {
        title: 'PERMISSÃO DE ESCRITA PÚBLICA CONCEDIDA',
        actionTaken: 'Você concedeu permissão s3:PutObject aberta para a internet.',
        consequence: 'Usuários anônimos da internet começaram a usar o bucket da empresa para hospedar arquivos arbitrários.',
        severity: 'critical'
      }
    },
    debrief: {
      summary: 'Remediação de bucket público em nuvem e ativação de salvaguardas de conformidade.',
      rootCause: 'Bucket policy configurada com "Principal": "*" permitindo que requisições não autenticadas baixassem objetos restritos.',
      correctSteps: [
        'Substituir o Principal wildcard "*" pelo ARN da role específica autorizada da aplicação.',
        'Ativar o controle "Block All Public Access" em nível de bucket para bloquear ACLs e políticas públicas.',
        'Habilitar a criptografia padrão do lado do servidor (SSE-KMS) para garantir cifragem em repouso.',
        'Manter os dados preservados sem destruição do repositório de armazenamento.'
      ],
      keyTakeaways: 'Segurança em nuvem adota defesa em profundidade: restrição de política IAM + Block Public Access nativo + Criptografia KMS.'
    }
  },

  // 8. PKI & TLS Handshake Troubleshooting
  {
    id: 'pbq-008',
    opCode: 'OP-008',
    title: 'PKI & TLS Handshake Troubleshooting',
    category: 'Criptografia & PKI',
    difficulty: 'Intermediate',
    timeLimit: 90,
    objective: 'Diagnosticar por que clientes recebem "SEC_ERROR_UNKNOWN_ISSUER", identificar a quebra na cadeia de certificados e instalar a CA intermediária correta.',
    incidentCode: 'INC-8812',
    environment: 'Servidor Web Nginx / API Gateway (api.rootsec.academy)',
    whatHappened: 'Após a renovação do certificado SSL/TLS, todos os clientes móveis e navegadores começaram a rejeitar as conexões seguras com erro de autoridade certificadora não confiável.',
    technicalRisk: 'Os clientes estão sendo expostos a ataques de Man-in-the-Middle ou ficando completamente sem acesso aos serviços.',
    actionPrompt: 'Inspecione o bundle de certificados, identifique o certificado intermediário ausente/expirado e reconstrua a cadeia válida.',
    consequenceOnTimeout: {
      title: 'INDISPONIBILIDADE DE SERVIÇOS CRÍTICOS',
      consequence: 'O tráfego de pagamento da API foi totalmente interrompido por expiração da cadeia TLS.',
      compromiseDetail: '4.200 transações canceladas e clientes migrando para concorrentes.'
    },
    consequences: {
      'disable-tls': {
        title: 'REVERSÃO PARA PROTOCOLO INSEGURO',
        actionTaken: 'Você desabilitou o HTTPS e reverteu o tráfego para HTTP puro na porta 80.',
        consequence: 'Senhas e dados de cartão de crédito de clientes trafegaram em texto claro na rede pública.',
        severity: 'critical'
      },
      'self-signed-root': {
        title: 'INSTALAÇÃO DE CERTIFICADO NÃO RECONHECIDO',
        actionTaken: 'Você gerou e instalou um certificado autoassinado na DMZ.',
        consequence: 'Os navegadores emitiram alertas vermelhos de phishing e conexões bloqueadas.',
        severity: 'high'
      }
    },
    debrief: {
      summary: 'Diagnóstico de quebra na cadeia X.509 de certificados digitais e recomposição de Intermediate CA Bundle.',
      rootCause: 'O servidor web entregava apenas o certificado folha (Leaf) acompanhado de uma autoridade intermediária antiga que já havia expirado, impedindo a verificação até a Root CA confiável.',
      correctSteps: [
        'Inspecionar a hierarquia da cadeia de certificação (Root CA -> Intermediate CA -> Leaf Certificate).',
        'Detectar que a Intermediate CA instalada estava expirada ou incompatível.',
        'Instalar o pacote completo atualizado (Intermediate CA G4) com assinatura válida.',
        'Assegurar versões modernas de protocolo (TLS 1.2 / TLS 1.3) mantendo o canal cifrado obrigatório.'
      ],
      keyTakeaways: 'Os navegadores modernos não confiam automaticamente em certificados folha se a cadeia até a Autoridade Raiz (Root CA) estiver truncada. A autoridade intermediária deve ser fornecida pelo servidor no handshake TLS.'
    }
  },

  // 9. Network Gateway Spoofing / ARP Poisoning
  {
    id: 'pbq-009',
    opCode: 'OP-009',
    title: 'Network Gateway Spoofing / ARP Poisoning',
    category: 'Troubleshooting CLI',
    difficulty: 'Advanced',
    timeLimit: 90,
    objective: 'Utilizar comandos de terminal de rede para detectar o ataque de Man-in-the-Middle (ARP spoofing) e isolar o MAC atacante.',
    incidentCode: 'INC-9031',
    environment: 'Terminal de Operação / Roteador e Switches da DMZ',
    whatHappened: 'Usuários reportaram lentidão extrema e alertas de certificado anômalos. A tabela ARP local apresenta dois endereços IP distintos compartilhando o mesmo endereço MAC.',
    technicalRisk: 'O invasor intercepta e grava todo o tráfego não criptografado da sub-rede corporativa.',
    actionPrompt: 'Execute comandos CLI (`arp -a`, `tracert`, `show mac-address-table`), descubra a porta do switch onde o atacante está conectado e acione o Port Security.',
    consequenceOnTimeout: {
      title: 'INTERCEPTAÇÃO TOTAL DO TRÁFEGO (MITM)',
      consequence: 'O invasor interceptou credenciais de administrador de rede enviadas via protocolos de gerência.',
      compromiseDetail: 'O atacante adquiriu controle do roteador de borda principal.'
    },
    consequences: {
      'flush-all-dns': {
        title: 'AÇÃO INEFICAZ NA CAMADA DE APLICAÇÃO',
        actionTaken: 'Você apenas limpou o cache DNS com ipconfig /flushdns.',
        consequence: 'O ataque ocorre na camada 2 (Enlace/ARP); a limpeza do DNS não teve nenhum efeito sobre as respostas ARP envenenadas.',
        severity: 'medium'
      },
      'shutdown-gateway': {
        title: 'INTERRUPÇÃO DO GATEWAY LEGÍTIMO',
        actionTaken: 'Você desativou a interface do Default Gateway oficial.',
        consequence: 'Toda a filial perdeu conectividade de rede com a matriz e os serviços em nuvem.',
        severity: 'critical'
      }
    },
    debrief: {
      summary: 'Detecção e contenção de ARP Cache Poisoning e interceptação Man-in-the-Middle em redes Ethernet.',
      rootCause: 'Host invasor (192.168.1.88 com MAC 00-0c-29-ab-12-99) enviando pacotes ARP Gratuitous forjando ser o Default Gateway (192.168.1.1).',
      correctSteps: [
        'Executar `arp -a` e notar que o IP do gateway 192.168.1.1 e o host 192.168.1.88 compartilhavam o mesmo endereço MAC físico.',
        'Executar `tracert` e constatar que o primeiro salto da rota passava pela máquina intermediária anômala.',
        'Correlacionar na tabela CAM do switch (`show mac-address-table`) que o MAC agressor residia na porta Fa0/8.',
        'Aplicar Port Security / Shutdown estritamente na porta Fa0/8 do switch, preservando a interface legítima Fa0/1 do gateway.'
      ],
      keyTakeaways: 'Envenenamento ARP é um ataque de Camada 2. Soluções de Camada 3/7 (como DNS ou firewall de host) não resolvem a falsificação de quadros na rede local.'
    }
  },

  // 10. Data Exfiltration Triage
  {
    id: 'pbq-010',
    opCode: 'OP-010',
    title: 'Data Exfiltration Triage',
    category: 'SOC & Network Traffic',
    difficulty: 'Advanced',
    timeLimit: 90,
    objective: 'Analisar telemetria de tráfego de saída (Egress), correlacionar porta e destino anômalos e aplicar bloqueio perimetral imediato.',
    incidentCode: 'INC-9944',
    environment: 'Sensor de Tráfego de Rede / Sensor Zeek & Firewall Core',
    whatHappened: 'O monitor de vazão apontou uma transferência de 10 GB de dados compactados saindo de um servidor de banco de dados diretamente para um IP fora da lista permitida.',
    technicalRisk: 'Vazamento massivo de propriedade intelectual e código-fonte confidencial de projetos estratégicos.',
    actionPrompt: 'Inspecione a tabela de fluxos de rede, identifique o IP de destino e a porta de evasão, aplicando o bloqueio de saída imediato.',
    consequenceOnTimeout: {
      title: 'EXFILTRAÇÃO CONCLUÍDA COM SUCESSO',
      consequence: 'O invasor finalizou o upload de 10 GB contendo o código-fonte proprietário da empresa.',
      compromiseDetail: 'Código-fonte publicado em fóruns cibercriminosos para venda.'
    },
    consequences: {
      'restart-server': {
        title: 'REINICIALIZAÇÃO INOPORTUNA DE SERVIÇO',
        actionTaken: 'Você reiniciou o servidor de banco de dados enquanto a exfiltração ocorria.',
        consequence: 'O processo já residia na memória e retomou o fluxo de dados automaticamente após o reboot, gerando indisponibilidade nas aplicações.',
        severity: 'high'
      },
      'block-wrong-port': {
        title: 'FILTRAGEM DE PORTA INCORRETA',
        actionTaken: 'Você bloqueou a porta 80/TCP enquanto a exfiltração ocorria via túnel criptografado 443/TCP.',
        consequence: 'A transferência maliciosa continuou inalterada pela porta 443 até a conclusão do upload.',
        severity: 'critical'
      }
    },
    debrief: {
      summary: 'Triagem e mitigação perimetral de exfiltração de dados em massa (Data Exfiltration Egress).',
      rootCause: 'Canal C2 estabelecendo túnel criptografado TLS na porta 443 a partir do servidor de banco de dados para host externo em ASN estrangeiro.',
      correctSteps: [
        'Analisar a telemetria NetFlow ordenada por bytes transferidos para identificar desvios da linha de base.',
        'Identificar a sessão anômala: 9.84 GB enviados de 10.10.40.10:52189 para 198.51.100.77 na porta 443.',
        'Injetar regra de bloqueio perimetral de saída (Egress Filter) para o IP e porta específicos.',
        'Conter o vazamento imediatamente sem reinicializações destrutivas do banco de dados.'
      ],
      keyTakeaways: 'Invasores comumente usam a porta 443 (HTTPS) para camuflar exfiltração de dados como tráfego web comum. A inspeção de volume (NetFlow) e reputação de ASN é crucial para detectar o desvio.'
    }
  }
];
