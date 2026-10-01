import { CampaignDefinition } from "@/types/campaign";

export const bastionBreachCampaign: CampaignDefinition = {
  id: "bastion-breach",
  codename: "OPERAÇÃO BASTION BREACH",
  title: "Bastion Breach: Da Identidade On-Premises à Exfiltração Cloud",
  summary: "Cadeia de ataque complexa iniciada em Active Directory Kerberos, escalando para identidades Cloud IAM e culminando em vazamento de dados em buckets S3.",
  description: "Um adversário avançado conseguiu infiltrar o perímetro através de abuso de protocolo de autenticação Kerberos, pivotou para a infraestrutura AWS via federação de identidades e tentou exfiltrar dados financeiros não criptografados. Seu objetivo como operador é conter cada vetor sequencialmente.",
  targetVector: "Identity → Cloud IAM → Cloud Storage",
  steps: [
    {
      id: "step-1-kerberos",
      labId: "kerberos-auth-flow",
      family: "cybercore",
      title: "Passo 1: Autenticação On-Premises (Kerberos Flow)",
      briefing: "Alertas no Domain Controller indicam atividade anômala na fase de emissão de bilhetes. Investigue o fluxo de autenticação Kerberos (AS-REQ/REP e TGS-REQ/REP) e identifique a técnica utilizada para forjar credenciais de acesso persistente no domínio.",
      objective: "Analisar as etapas do protocolo Kerberos e identificar o vetor de forja de TGT vinculado à conta KRBTGT.",
      successCondition: "Identificar corretamente a técnica de Golden Ticket no desafio de comprovação do fluxo.",
      evidenceReward: "IOC-KRB: TGT Forge Detection (KRBTGT Hash Abuse Vector)"
    },
    {
      id: "step-2-cloud-iam",
      labId: "cloud-iam-permissions",
      family: "cybercore",
      title: "Passo 2: Avaliação de Privilégios Cloud IAM",
      briefing: "O adversário pivotou para o ambiente AWS utilizando credenciais de federação. O SOC precisa que você avalie as políticas de IAM da conta para determinar se as tentativas de acesso a serviços produtivos devem ser autorizadas ou negadas segundo as regras de menor privilégio e MFA.",
      objective: "Avaliar o motor de decisão de políticas do IAM diante de cenários de acesso a recursos e condições de segurança.",
      successCondition: "Submeter avaliações corretas de política IAM no simulador de identidade.",
      evidenceReward: "IOC-IAM: Policy Boundary Analysis (MFA Condition Evaluation)"
    },
    {
      id: "step-3-cloud-s3",
      labId: "cloud-s3",
      family: "pbq",
      title: "Passo 3: Contenção e Hardening de Bucket S3",
      briefing: "O atacante atingiu o bucket de relatórios fiscais exposto publicamente na internet. Como última linha de contenção operacional, reconfigure a política do bucket para restringir à role autorizada, ative o bloqueio público de acesso e habilite criptografia em repouso SSE-KMS.",
      objective: "Remover a exposição pública (Principal: *) do bucket e aplicar todos os controles de hardening operacional.",
      successCondition: "Associar o bucket à role interna autorizada, ativar Block Public Access e habilitar SSE-KMS.",
      evidenceReward: "IOC-S3: Data Store Secured (SSE-KMS + BlockPublicAccess Enforced)"
    }
  ]
};
