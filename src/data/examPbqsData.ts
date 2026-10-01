export interface PbqExamItem {
  id: string;
  type: 'pbq';
  labId: 'firewall-acl' | 'siem-log' | 'edr-process';
  title: string;
  domain: string;
  scenarioText: string;
  points: number;
}

export const EXAM_PBQS: PbqExamItem[] = [
  {
    id: 'exam-pbq-firewall-acl',
    type: 'pbq',
    labId: 'firewall-acl',
    title: 'PBQ 1: Firewall ACL & Inbound Policy Hardening',
    domain: 'Operações de segurança',
    scenarioText: 'Um incidente de segurança recente revelou portas críticas expostas para a Internet pública e regras de descarte aplicadas incorretamente. Analise a tabela de regras de firewall, reorganize a política para seguir a avaliação sequencial top-down, bloqueie o tráfego RDP vulnerável e posicione o descarte implícito (Default Drop) na última linha.',
    points: 3
  },
  {
    id: 'exam-pbq-siem-log',
    type: 'pbq',
    labId: 'siem-log',
    title: 'PBQ 2: SIEM Log Correlation & Incident Mitigation',
    domain: 'Operações de segurança',
    scenarioText: 'Múltiplos alertas de autenticação suspeita foram disparados no SIEM institucional contra controladores de domínio corporativos. Analise os eventos de logon, filtre a origem das falhas sequenciais (Event ID 4625), identifique o endereço IP do atacante externo e execute a ação de mitigação perimetral e proteção de credenciais sem interromper serviços legítimos.',
    points: 3
  },
  {
    id: 'exam-pbq-edr-process',
    type: 'pbq',
    labId: 'edr-process',
    title: 'PBQ 3: Endpoint Threat Containment & EDR Triage',
    domain: 'Ameaças, vulnerabilidades e mitigações',
    scenarioText: 'A telemetria do EDR detectou uma cadeia anômala de execução iniciada a partir de uma macro do Word (Invoice_9918.docm). O processo gerou um shell PowerShell ofuscado e injetou uma DLL em processo de sistema. Identifique os processos maliciosos ativos na memória, encerre a execução da ameaça e purgue a chave de registro de persistência antes de reiniciar o endpoint.',
    points: 3
  }
];
