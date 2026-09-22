// ============================================================================
// CYBER CORE ENGINE: LÓGICA PEDAGÓGICA, ESPAÇAMENTO E EVIDÊNCIA DE DOMÍNIO
// ============================================================================

import type {
  ReviewReason,
  UserConfidence,
  RetentionState,
  UserConceptMastery,
  ReviewQueueItem,
  UserConceptAttempt
} from './cyberCoreTypes';

// Limiares determinísticos para transição de estados de domínio
export const CORE_THRESHOLDS = {
  MIN_ATTEMPTS_DEVELOPING: 2,
  MIN_ATTEMPTS_CONSOLIDATED: 5,
  MIN_ATTEMPTS_MASTERY: 8,
  MIN_CHALLENGE_DIVERSITY_MASTERY: 3, // Pelo menos 3 tipos diferentes de desafios dominados
  MIN_ACCURACY_CONSOLIDATED: 75,
  MIN_ACCURACY_MASTERY: 85,
  MIN_CONSECUTIVE_CORRECT_MASTERY: 3,
  SPACED_INTERVALS_DAYS: [1, 3, 7, 14, 30] as const,
  HESITANT_INTERVALS_DAYS: [1, 2, 4, 7] as const,
} as const;

// ============================================================================
// 1. CÁLCULO CENTRALIZADO DE REPETIÇÃO ESPAÇADA
// ============================================================================
export interface NextReviewCalculationInput {
  currentIntervalDays: number;
  isCorrect: boolean;
  confidence: UserConfidence;
  consecutiveCorrect: number;
}

export interface NextReviewCalculationResult {
  nextIntervalDays: number;
  reason: ReviewReason;
  priority: number; // 1 (mais urgente) a 5 (manutenção regular)
  dueDate: Date;
}

export function calculateNextReview(
  input: NextReviewCalculationInput,
  baseDate: Date = new Date()
): NextReviewCalculationResult {
  const { currentIntervalDays, isCorrect, confidence, consecutiveCorrect } = input;

  // 1. Caso crítico: O usuário explicitamente declarou "Não sei"
  if (confidence === 'DID_NOT_KNOW') {
    const nextIntervalDays = 0; // Revisão imediata / no mesmo dia
    const dueDate = new Date(baseDate.getTime());
    return {
      nextIntervalDays,
      reason: 'DID_NOT_KNOW',
      priority: 1, // Prioridade máxima
      dueDate
    };
  }

  // 2. Caso de Erro de resposta
  if (!isCorrect) {
    const nextIntervalDays = 1; // Retorna para revisão no dia seguinte
    const dueDate = new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    return {
      nextIntervalDays,
      reason: 'ERROR',
      priority: 2,
      dueDate
    };
  }

  // 3. Caso de Acerto com Dúvida / Hesitação
  if (confidence === 'HESITANT') {
    const intervals = CORE_THRESHOLDS.HESITANT_INTERVALS_DAYS;
    const currentIndex = intervals.findIndex(d => d >= currentIntervalDays);
    const nextIntervalDays = currentIndex === -1 
      ? intervals[intervals.length - 1] 
      : intervals[Math.min(currentIndex + 1, intervals.length - 1)];

    const dueDate = new Date(baseDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
    return {
      nextIntervalDays,
      reason: 'DOUBT',
      priority: 3,
      dueDate
    };
  }

  // 4. Caso de Acerto Confiante (Progresso normal na escala de retenção espaçada)
  const standardIntervals = CORE_THRESHOLDS.SPACED_INTERVALS_DAYS;
  const currentIdx = standardIntervals.findIndex(d => d >= currentIntervalDays);
  const nextIntervalDays = currentIdx === -1
    ? standardIntervals[standardIntervals.length - 1]
    : standardIntervals[Math.min(currentIdx + 1, standardIntervals.length - 1)];

  const dueDate = new Date(baseDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
  return {
    nextIntervalDays,
    reason: consecutiveCorrect >= CORE_THRESHOLDS.MIN_CONSECUTIVE_CORRECT_MASTERY ? 'SCHEDULED' : 'SCHEDULED',
    priority: 4,
    dueDate
  };
}

// ============================================================================
// 2. AVALIAÇÃO DE EVIDÊNCIA DE DOMÍNIO (MASTERY EVALUATION)
// ============================================================================
export interface MasteryEvaluationInput {
  totalAttempts: number;
  successfulRetrievals: number;
  accuracy: number;
  challengeDiversityCount: number;
  consecutiveCorrect: number;
  currentRetentionState: RetentionState;
}

export function evaluateConceptMastery(input: MasteryEvaluationInput): RetentionState {
  const {
    totalAttempts,
    successfulRetrievals,
    accuracy,
    challengeDiversityCount,
    consecutiveCorrect
  } = input;

  if (totalAttempts === 0) {
    return 'NOT_STARTED';
  }

  // Condições rigorosas para MASTERED:
  // - Pelo menos 8 tentativas totais
  // - Pelo menos 3 tipos de desafios diferentes concluídos com sucesso (diversidade)
  // - Pelo menos 85% de acurácia global
  // - Sequência de pelo menos 3 acertos consecutivos recentes
  if (
    totalAttempts >= CORE_THRESHOLDS.MIN_ATTEMPTS_MASTERY &&
    challengeDiversityCount >= CORE_THRESHOLDS.MIN_CHALLENGE_DIVERSITY_MASTERY &&
    accuracy >= CORE_THRESHOLDS.MIN_ACCURACY_MASTERY &&
    consecutiveCorrect >= CORE_THRESHOLDS.MIN_CONSECUTIVE_CORRECT_MASTERY
  ) {
    return 'MASTERED';
  }

  // Condições para CONSOLIDATED:
  // - Pelo menos 5 tentativas
  // - Pelo menos 2 tipos de desafios diferentes
  // - Acurácia >= 75%
  // - Pelo menos 2 acertos consecutivos
  if (
    totalAttempts >= CORE_THRESHOLDS.MIN_ATTEMPTS_CONSOLIDATED &&
    challengeDiversityCount >= 2 &&
    accuracy >= CORE_THRESHOLDS.MIN_ACCURACY_CONSOLIDATED &&
    consecutiveCorrect >= 2
  ) {
    return 'CONSOLIDATED';
  }

  // Se já realizou tentativas válidas, está em desenvolvimento
  if (totalAttempts >= CORE_THRESHOLDS.MIN_ATTEMPTS_DEVELOPING || successfulRetrievals > 0) {
    return 'IN_DEVELOPMENT';
  }

  return 'IN_DEVELOPMENT';
}

// ============================================================================
// 3. FORMATAÇÃO HUMANIZADA DE RAZÕES DE REVISÃO
// ============================================================================
export function getReviewReasonLabel(reason: ReviewReason): string {
  switch (reason) {
    case 'DID_NOT_KNOW':
      return 'Marcado como "Não sei"';
    case 'ERROR':
      return 'Você errou recentemente';
    case 'DOUBT':
      return 'Você marcou que teve dúvida';
    case 'GUESSED':
      return 'Resposta por tentativa/chute';
    case 'SCHEDULED':
      return 'Revisão programada';
    case 'LOW_RETENTION':
      return 'Conceito ainda não consolidado';
    case 'INCONSISTENT':
      return 'Respostas oscilantes';
    default:
      return 'Revisão recomendada';
  }
}

// ============================================================================
// 4. MOTOR MATEMÁTICO DE SUBNETTING (IPV4 / CIDR)
// ============================================================================
export interface SubnetBlockDetails {
  index: number;
  networkAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  broadcastAddress: string;
  subnetMask: string;
  prefix: number;
  totalAddresses: number;
  usableHosts: number;
}

export function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export function prefixToMask(prefix: number): string {
  if (prefix < 0 || prefix > 32) return '255.255.255.0';
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return numberToIp(mask);
}

/**
 * Calcula detalhadamente todas as sub-redes resultantes ao dividir uma rede base
 */
export function calculateSubnetPartition(
  baseNetworkIp: string,
  basePrefix: number,
  targetPrefix: number
): SubnetBlockDetails[] {
  if (targetPrefix < basePrefix || targetPrefix > 30) {
    return [];
  }

  const baseNum = ipToNumber(baseNetworkIp);
  const subnetBits = targetPrefix - basePrefix;
  const numSubnets = Math.pow(2, subnetBits);
  const addressesPerSubnet = Math.pow(2, 32 - targetPrefix);
  const mask = prefixToMask(targetPrefix);

  const results: SubnetBlockDetails[] = [];

  for (let i = 0; i < numSubnets; i++) {
    const netNum = (baseNum + i * addressesPerSubnet) >>> 0;
    const bcastNum = (netNum + addressesPerSubnet - 1) >>> 0;
    const firstHostNum = (netNum + 1) >>> 0;
    const lastHostNum = (bcastNum - 1) >>> 0;

    results.push({
      index: i + 1,
      networkAddress: numberToIp(netNum),
      firstUsableHost: addressesPerSubnet > 2 ? numberToIp(firstHostNum) : 'N/A',
      lastUsableHost: addressesPerSubnet > 2 ? numberToIp(lastHostNum) : 'N/A',
      broadcastAddress: numberToIp(bcastNum),
      subnetMask: mask,
      prefix: targetPrefix,
      totalAddresses: addressesPerSubnet,
      usableHosts: Math.max(0, addressesPerSubnet - 2),
    });
  }

  return results;
}

// ============================================================================
// 5. GERADOR DE FEEDBACK PEDAGÓGICO ESPECÍFICO (NÃO APENAS "ERRADO")
// ============================================================================
export interface PedagogicalFeedbackResult {
  isCorrect: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export function evaluateSubnetSubmission(
  expectedSubnets: SubnetBlockDetails[],
  submittedSubnets: Partial<SubnetBlockDetails>[]
): PedagogicalFeedbackResult {
  if (!submittedSubnets || submittedSubnets.length !== expectedSubnets.length) {
    return {
      isCorrect: false,
      message: `A divisão esperava exatamente ${expectedSubnets.length} sub-redes, mas recebeu ${submittedSubnets?.length || 0}. Lembre-se de preencher todos os blocos gerados pela máscara.`
    };
  }

  const fieldErrors: Record<string, string> = {};

  for (let i = 0; i < expectedSubnets.length; i++) {
    const exp = expectedSubnets[i];
    const sub = submittedSubnets[i] || {};

    if (sub.networkAddress !== exp.networkAddress) {
      fieldErrors[`sub_${i}_net`] = `A Sub-rede #${exp.index} deve começar em ${exp.networkAddress}. Cada bloco de /${exp.prefix} avança de ${exp.totalAddresses} em ${exp.totalAddresses} endereços.`;
    }
    if (sub.broadcastAddress !== exp.broadcastAddress) {
      fieldErrors[`sub_${i}_bcast`] = `O broadcast da Sub-rede #${exp.index} é ${exp.broadcastAddress} (o último endereço antes do próximo bloco).`;
    }
    if (sub.firstUsableHost && sub.firstUsableHost !== exp.firstUsableHost) {
      fieldErrors[`sub_${i}_first`] = `O primeiro host útil é sempre Network + 1 (${exp.firstUsableHost}).`;
    }
    if (sub.lastUsableHost && sub.lastUsableHost !== exp.lastUsableHost) {
      fieldErrors[`sub_${i}_last`] = `O último host útil é sempre Broadcast - 1 (${exp.lastUsableHost}).`;
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;
  if (hasErrors) {
    const firstErrorMessage = Object.values(fieldErrors)[0];
    return {
      isCorrect: false,
      message: `Ajuste necessário: ${firstErrorMessage}`,
      fieldErrors
    };
  }

  return {
    isCorrect: true,
    message: `Excelente! Todos os ${expectedSubnets.length} blocos foram calculados com perfeição, respeitando os limites de rede, hosts úteis e broadcast.`
  };
}

// ============================================================================
// 5. RESOLUÇÃO DINÂMICA DE "CONTINUE APRENDENDO" (5 NÍVEIS DE PRIORIDADE)
// ============================================================================
export function resolveContinueLearningSlug(params: {
  attemptsHistory?: UserConceptAttempt[];
  reviewQueue?: ReviewQueueItem[];
  userMastery?: Record<string, UserConceptMastery>;
  catalog?: { slug: string }[];
}): string {
  const { attemptsHistory = [], reviewQueue = [], userMastery = {}, catalog = [] } = params;
  const catalogSlugs = new Set(catalog.map(c => c.slug));

  // Prioridade 1: Conceito que o usuário estava praticando mais recentemente
  if (attemptsHistory.length > 0) {
    for (let i = attemptsHistory.length - 1; i >= 0; i--) {
      const recentSlug = attemptsHistory[i]?.conceptId;
      if (recentSlug && catalogSlugs.has(recentSlug)) {
        return recentSlug;
      }
    }
  }

  // Prioridade 2: Conceito pendente na fila de revisão (mais prioritário primeiro)
  if (reviewQueue.length > 0) {
    for (const item of reviewQueue) {
      if (item.conceptSlug && catalogSlugs.has(item.conceptSlug)) {
        return item.conceptSlug;
      }
    }
  }

  // Prioridade 3: Conceito em desenvolvimento (em andamento)
  const inDevSlugs = Object.keys(userMastery).filter(
    slug => userMastery[slug]?.retentionState === 'IN_DEVELOPMENT'
  );
  if (inDevSlugs.length > 0) {
    const sorted = [...inDevSlugs].sort((a, b) => {
      const timeA = userMastery[a]?.lastAttemptAt ? new Date(userMastery[a].lastAttemptAt!).getTime() : 0;
      const timeB = userMastery[b]?.lastAttemptAt ? new Date(userMastery[b].lastAttemptAt!).getTime() : 0;
      return timeB - timeA;
    });
    const found = sorted.find(s => catalogSlugs.has(s));
    if (found) return found;
  }

  // Prioridade 4: Conceito recomendado (primeiro que ainda não foi dominado)
  const recommended = catalog.find(c => {
    const m = userMastery[c.slug];
    return !m || m.retentionState !== 'MASTERED';
  });
  if (recommended) {
    return recommended.slug;
  }

  // Prioridade 5: Conceito inicial caso seja usuário novo ou todos dominados
  return catalog[0]?.slug || 'subnetting-cidr';
}

