import { CampaignDefinition } from "@/types/campaign";

export const auroraNegraCampaign: CampaignDefinition = {
  id: "aurora-negra",
  codename: "OPERAÇÃO AURORA NEGRA",
  title: "Aurora Negra: Da Intrusão Inicial à Resposta Estruturada",
  summary: "Cadeia de ataque persistente simulando intrusão via spear phishing com anexo macro, escalada para comprometimento de endpoint, exfiltração em massa, tentativa de propagação de ransomware e consolidação da resposta técnica a incidentes.",
  description: "Um grupo adversário avançado orquestrou uma campanha direcionada contra a organização corporativa. O incidente iniciou-se com uma mensagem fraudulenta que burlou verificações básicas, evoluiu para execução de código com persistência no endpoint, estabeleceu túnel de exfiltração de dados confidenciais e ativou um ransomware para destruir vestígios forenses. Seu papel como operador de segurança é conter cada vetor tático progressivamente e estruturar a governança de resposta ao incidente.",
  targetVector: "Phishing → Endpoint EDR → Exfiltration → Ransomware → Incident Response",
  steps: [
    {
      id: "aurora-step-1-phishing",
      labId: "phishing-header",
      family: "pbq",
      title: "Passo 1: Detecção e Contenção de Spear Phishing",
      tacticalPhase: "INITIAL ACCESS",
      previousContext: "Início da Operação. Alerta no gateway de e-mail corporativo reportado pelo setor financeiro.",
      briefing: "O gateway corporativo reteve um e-mail urgente com assunto 'URGENTE: Autorização de Pagamento Imediato'. Inspecione os cabeçalhos RFC 822 brutos, analise as falhas de autenticação SPF e DKIM, identifique o domínio homógrafo em punycode e coloque a mensagem em quarentena documentando os indicadores forenses.",
      objective: "Analisar os cabeçalhos forenses, assinalar os indicadores de comprometimento (IoCs) e aplicar Quarentena e Bloqueio.",
      successCondition: "Assinalar no mínimo 2 indicadores técnicos legítimos no cabeçalho e acionar a ação Quarentena e Bloqueio.",
      evidenceReward: "EVIDÊNCIA-01: Mensagem de Phishing Quarentenada (Remetente xn--pypal-4ve.com / IP 195.12.50.4)",
      technicalIoc: "IP 195.12.50.4 (Tor Exit Node) · Punycode xn--pypal-4ve.com · Anexo comprovante_solicitacao.docm",
      campaignEvidence: "Vetor de Spear Phishing Neutralizado no Gateway de Mensageria"
    },
    {
      id: "aurora-step-2-edr",
      labId: "edr-process",
      family: "pbq",
      title: "Passo 2: Investigação e Remediação em Endpoint (EDR)",
      tacticalPhase: "ENDPOINT COMPROMISE",
      previousContext: "O anexo malicioso do e-mail de phishing foi aberto na estação de trabalho da diretoria financeira antes da quarentena global.",
      briefing: "O sensor EDR detectou uma árvore anômala gerada pelo WINWORD.EXE executando Invoice_9918.docm, gerando um powershell.exe codificado e carregando uma DLL em C:\\Users\\Public\\updater.dll com chave Run no Registro. Encerre os processos maliciosos ativos e purgue a chave de persistência antes de autorizar qualquer reboot.",
      objective: "Localizar e encerrar os processos maliciosos ativos na memória e purgar a persistência no Registro do Windows.",
      successCondition: "Finalizar powershell.exe (PID 6120) e rundll32.exe (PID 8812), remover a chave Run e finalizar a remediação.",
      evidenceReward: "EVIDÊNCIA-02: Cadeia de Processos EDR Neutralizada (PIDs 6120 e 8812 + Chave Run Purgada)",
      technicalIoc: "PID 6120 (powershell.exe -Enc) · PID 8812 (rundll32.exe updater.dll) · HKCU\\...\\Run\\SecurityUpdate",
      campaignEvidence: "Processos de Comando & Controle Encerrados e Persistência Removida"
    },
    {
      id: "aurora-step-3-exfil",
      labId: "data-exfil",
      family: "pbq",
      title: "Passo 3: Bloqueio de Exfiltração de Dados em Rede",
      tacticalPhase: "DATA EXFILTRATION",
      previousContext: "Os processos locais foram finalizados, porém sensores de perímetro alertaram sobre tráfego anômalo com alto volume de dados transferidos para o exterior.",
      briefing: "O sensor de fluxo Zeek / NetFlow acusou um túnel de exfiltração contínuo de 9.84 GB partindo do banco de dados DB-PROD-01 (10.10.40.10) para o IP externo 198.51.100.77 pela porta 443/TCP. Localize o registro anômalo e aplique o bloqueio imediato de egress no firewall antes do término da exfiltração.",
      objective: "Correlacionar os fluxos de rede, identificar o destino do atacante e aplicar bloqueio no firewall de borda.",
      successCondition: "Identificar o fluxo com destino 198.51.100.77 e aplicar bloqueio na porta 443/TCP com o IP do adversário.",
      evidenceReward: "EVIDÊNCIA-03: Túnel de Exfiltração Bloqueado (9.84 GB contidos no destino 198.51.100.77:443)",
      technicalIoc: "IP 198.51.100.77:443 (AS48123 HostCloud Bucareste) · Origem DB-PROD-01 (10.10.40.10)",
      campaignEvidence: "Canal Criptografado de Egress Bloqueado no Firewall de Borda"
    },
    {
      id: "aurora-step-4-ransomware",
      labId: "ransomware-containment",
      family: "pbq",
      title: "Passo 4: Contenção de Ransomware e Paciente Zero",
      tacticalPhase: "IMPACT & CONTAINMENT",
      previousContext: "Com o canal de exfiltração interrompido, o adversário iniciou criptografia em massa para causar indisponibilidade e apagar vestígios.",
      briefing: "Múltiplos arquivos corporativos no Servidor de Arquivos central e estações da VLAN 10 (Financeiro) estão sendo renomeados com extensões '.locked' com alto consumo de CPU e tráfego SMB. Inspecione a telemetria das estações, identifique o paciente zero que está liderando a propagação e isole-o sem desconectar o servidor de arquivos.",
      objective: "Identificar o paciente zero transmissor da infecção ransomware e isolar a estação de trabalho da rede.",
      successCondition: "Identificar a estação WS-FIN-02 (192.168.10.18) e executar o isolamento de rede.",
      evidenceReward: "EVIDÊNCIA-04: Paciente Zero Isolado (WS-FIN-02 / 192.168.10.18 - Propagação SMB Contida)",
      technicalIoc: "Host WS-FIN-02 (192.168.10.18) · Processo invoice_update.exe · Criptografia SMB 445/TCP",
      campaignEvidence: "Vetor de Criptografia Lateral Isolado na Camada de Acesso"
    },
    {
      id: "aurora-step-5-response",
      labId: "incident-response-lifecycle",
      family: "cybercore",
      title: "Passo 5: Estruturação do Ciclo de Resposta a Incidentes",
      tacticalPhase: "INCIDENT RESPONSE",
      previousContext: "A propagação destrutiva foi contida e todos os vetores ativos foram neutralizados. A equipe deve formalizar a resposta técnica segundo o NIST.",
      briefing: "Com a crise imediata estabilizada, o CSIRT deve consolidar as fases oficiais de Resposta a Incidentes segundo o NIST SP 800-61. Ordene as 6 fases do ciclo para assegurar que a erradicação dos artefatos, a recuperação dos sistemas através de backups íntegros e as lições aprendidas ocorram no momento adequado.",
      objective: "Organizar as 6 fases canônicas do Ciclo de Resposta a Incidentes na ordem oficial do NIST SP 800-61.",
      successCondition: "Ordenar corretamente: 1. Preparação → 2. Identificação → 3. Contenção → 4. Erradicação → 5. Recuperação → 6. Lições Aprendidas.",
      evidenceReward: "EVIDÊNCIA-05: Ciclo de Resposta Formalizado (Metodologia NIST SP 800-61 Aplicada)",
      technicalIoc: "NIST SP 800-61 Rev. 2 · Relatório de Lições Aprendidas e Post-Mortem de Intrusão",
      campaignEvidence: "Governança e Procedimentos de Resposta a Incidente Consolidados"
    }
  ]
};
