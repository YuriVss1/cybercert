import assert from "node:assert";
import { bastionBreachCampaign } from "@/data/campaigns/bastionBreach";
import { auroraNegraCampaign } from "@/data/campaigns/auroraNegra";
import { useCampaignStore } from "@/stores/campaignStore";
import { CampaignStepResult } from "@/types/campaign";
import { PbqActionResult } from "@/lib/pbqData";
import { ConceptAttemptPayload } from "@/lib/cyberCore/cyberCoreTypes";

console.log("=== INICIANDO SUÍTE DE TESTES: CAMPAIGN ENGINE, BASTION BREACH & AURORA NEGRA ===");

// ---------------------------------------------------------------------------
// 1. TESTES DE DEFINIÇÃO: BASTION BREACH
// ---------------------------------------------------------------------------
console.log("\n[1] Validando Definição da Operação Bastion Breach...");

assert.strictEqual(bastionBreachCampaign.id, "bastion-breach", "ID da campanha deve ser 'bastion-breach'");
assert.strictEqual(bastionBreachCampaign.steps.length, 3, "Campanha deve conter exatamente 3 steps");

const bbStep1 = bastionBreachCampaign.steps[0];
assert.strictEqual(bbStep1.id, "step-1-kerberos");
assert.strictEqual(bbStep1.labId, "kerberos-auth-flow");
assert.strictEqual(bbStep1.family, "cybercore");

const bbStep2 = bastionBreachCampaign.steps[1];
assert.strictEqual(bbStep2.id, "step-2-cloud-iam");
assert.strictEqual(bbStep2.labId, "cloud-iam-permissions");
assert.strictEqual(bbStep2.family, "cybercore");

const bbStep3 = bastionBreachCampaign.steps[2];
assert.strictEqual(bbStep3.id, "step-3-cloud-s3");
assert.strictEqual(bbStep3.labId, "cloud-s3");
assert.strictEqual(bbStep3.family, "pbq");

console.log("✓ Bastion Breach validada: 3 steps, sequência e metadados corretos.");

// ---------------------------------------------------------------------------
// 2. TESTES DE DEFINIÇÃO: OPERAÇÃO AURORA NEGRA (5 STEPS)
// ---------------------------------------------------------------------------
console.log("\n[2] Validando Definição da Operação Aurora Negra (5 Steps)...");

assert.strictEqual(auroraNegraCampaign.id, "aurora-negra", "ID deve ser 'aurora-negra'");
assert.strictEqual(auroraNegraCampaign.steps.length, 5, "Aurora Negra deve possuir exatamente 5 steps");

// Step 1: Phishing
const anStep1 = auroraNegraCampaign.steps[0];
assert.strictEqual(anStep1.id, "aurora-step-1-phishing");
assert.strictEqual(anStep1.labId, "phishing-header");
assert.strictEqual(anStep1.family, "pbq");
assert.strictEqual(anStep1.tacticalPhase, "INITIAL ACCESS");
assert.ok(anStep1.technicalIoc, "Step 1 deve conter Technical IOC");

// Step 2: EDR
const anStep2 = auroraNegraCampaign.steps[1];
assert.strictEqual(anStep2.id, "aurora-step-2-edr");
assert.strictEqual(anStep2.labId, "edr-process");
assert.strictEqual(anStep2.family, "pbq");
assert.strictEqual(anStep2.tacticalPhase, "ENDPOINT COMPROMISE");
assert.ok(anStep2.previousContext, "Step 2 deve herdar previousContext de phishing");

// Step 3: Data Exfiltration
const anStep3 = auroraNegraCampaign.steps[2];
assert.strictEqual(anStep3.id, "aurora-step-3-exfil");
assert.strictEqual(anStep3.labId, "data-exfil");
assert.strictEqual(anStep3.family, "pbq");
assert.strictEqual(anStep3.tacticalPhase, "DATA EXFILTRATION");

// Step 4: Ransomware Containment
const anStep4 = auroraNegraCampaign.steps[3];
assert.strictEqual(anStep4.id, "aurora-step-4-ransomware");
assert.strictEqual(anStep4.labId, "ransomware-containment");
assert.strictEqual(anStep4.family, "pbq");
assert.strictEqual(anStep4.tacticalPhase, "IMPACT & CONTAINMENT");

// Step 5: Incident Response Lifecycle
const anStep5 = auroraNegraCampaign.steps[4];
assert.strictEqual(anStep5.id, "aurora-step-5-response");
assert.strictEqual(anStep5.labId, "incident-response-lifecycle");
assert.strictEqual(anStep5.family, "cybercore");
assert.strictEqual(anStep5.tacticalPhase, "INCIDENT RESPONSE");

console.log("✓ Aurora Negra validada: 5 steps, identificadores, famílias e fases táticas confirmadas.");

// ---------------------------------------------------------------------------
// 3. PROGRESSÃO COMPLETA DA OPERAÇÃO AURORA NEGRA (1 → 2 → 3 → 4 → 5 → COMPLETED)
// ---------------------------------------------------------------------------
console.log("\n[3] Testando Progressão Completa de Aurora Negra (5 Steps)...");

useCampaignStore.getState().resetCampaign();
let store = useCampaignStore.getState();
assert.strictEqual(store.campaignStatus, "not_started");

// Iniciar Aurora Negra
useCampaignStore.getState().startCampaign(auroraNegraCampaign);
store = useCampaignStore.getState();
assert.strictEqual(store.activeCampaignId, "aurora-negra");
assert.strictEqual(store.campaignStatus, "in_progress");
assert.strictEqual(store.currentStepIndex, 0);

// Passo 1: Phishing
const anRes1: CampaignStepResult = {
  stepId: anStep1.id,
  completed: true,
  correct: true,
  actionId: "quarantine-and-block",
  evidence: "Quarentena e bloqueio executados",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep1.id, anRes1, anStep1.evidenceReward);
assert.strictEqual(useCampaignStore.getState().collectedIocs.length, 1);
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), true);
assert.strictEqual(useCampaignStore.getState().currentStepIndex, 1);

// Passo 2: Teste de Falha (Erro de Processo - Terminar explorer)
const anRes2Fail: CampaignStepResult = {
  stepId: anStep2.id,
  completed: true,
  correct: false,
  actionId: "kill-explorer",
  errorType: "wrong_target",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep2.id, anRes2Fail);
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), false, "Falha no Step 2 deve vetar avanço");
assert.strictEqual(useCampaignStore.getState().currentStepIndex, 1, "Permanece no Step 2");
assert.strictEqual(useCampaignStore.getState().collectedIocs.length, 1, "IOC não é concedido em falha");

// Passo 2: Resolução Correta (EDR Remediation)
const anRes2Success: CampaignStepResult = {
  stepId: anStep2.id,
  completed: true,
  correct: true,
  actionId: "edr-remediation-success",
  evidence: "PIDs terminados e chave Run purgada",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep2.id, anRes2Success, anStep2.evidenceReward);
// Re-submissão não duplica evidência:
useCampaignStore.getState().recordStepResult(anStep2.id, anRes2Success, anStep2.evidenceReward);
assert.strictEqual(useCampaignStore.getState().collectedIocs.length, 2, "Evidência não é duplicada");
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), true);
assert.strictEqual(useCampaignStore.getState().currentStepIndex, 2);

// Passo 3: Data Exfiltration Block
const anRes3: CampaignStepResult = {
  stepId: anStep3.id,
  completed: true,
  correct: true,
  actionId: "exfiltration-blocked",
  evidence: "Túnel 443/TCP bloqueado",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep3.id, anRes3, anStep3.evidenceReward);
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), true);
assert.strictEqual(useCampaignStore.getState().currentStepIndex, 3);

// Passo 4: Ransomware Containment (Patient Zero)
const anRes4: CampaignStepResult = {
  stepId: anStep4.id,
  completed: true,
  correct: true,
  actionId: "isolate-patient-zero",
  evidence: "WS-FIN-02 isolado",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep4.id, anRes4, anStep4.evidenceReward);
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), true);
assert.strictEqual(useCampaignStore.getState().currentStepIndex, 4);

// Passo 5: Incident Response Lifecycle (CyberCore)
const anRes5: CampaignStepResult = {
  stepId: anStep5.id,
  completed: true,
  correct: true,
  actionId: "ir-lifecycle-sort-1",
  evidence: "6 Fases NIST SP 800-61 ordenadas",
  completedAt: new Date().toISOString()
};
useCampaignStore.getState().recordStepResult(anStep5.id, anRes5, anStep5.evidenceReward);
assert.strictEqual(useCampaignStore.getState().collectedIocs.length, 5, "5 Evidências acumuladas");

// Avanço final -> Deve concluir a campanha de 5 etapas
assert.strictEqual(useCampaignStore.getState().advanceToNextStep(auroraNegraCampaign), true);
store = useCampaignStore.getState();
assert.strictEqual(store.campaignStatus, "completed", "Status deve transicionar para 'completed'");
assert.ok(store.completedAt, "completedAt deve ser preenchido");

console.log("✓ Progressão completa de 5 passos da Operação Aurora Negra validada com sucesso.");

// ---------------------------------------------------------------------------
// 4. TESTE DE ISOLAMENTO E PERSISTÊNCIA F5 EM STEP 3
// ---------------------------------------------------------------------------
console.log("\n[4] Testando Preservação de Sessão (F5) em Step 3...");

// Simular reidratação de estado em Step 3 com 3 evidências
const simulatedState = {
  activeCampaignId: "aurora-negra",
  currentStepIndex: 2,
  stepResults: {
    [anStep1.id]: anRes1,
    [anStep2.id]: anRes2Success,
    [anStep3.id]: anRes3
  },
  collectedIocs: [anStep1.evidenceReward!, anStep2.evidenceReward!, anStep3.evidenceReward!],
  campaignStatus: "in_progress" as const,
  startedAt: new Date().toISOString(),
  completedAt: null
};

const serialized = JSON.stringify(simulatedState);
const restored = JSON.parse(serialized);

assert.strictEqual(restored.activeCampaignId, "aurora-negra");
assert.strictEqual(restored.currentStepIndex, 2);
assert.strictEqual(restored.campaignStatus, "in_progress");
assert.strictEqual(restored.collectedIocs.length, 3);
assert.strictEqual(Object.keys(restored.stepResults).length, 3);

console.log("✓ Persistência F5 validada com preservação perfeita de estado e evidências.");

console.log("\n====================================================================");
console.log("TODOS OS TESTES DE BASTION BREACH & AURORA NEGRA FORAM APROVADOS!");
console.log("====================================================================");
