import type { ExamHistoryItem, Question } from '@/stores/examStore';

// ============================================================================
// CONSTANTES E LIMITES (THRESHOLDS CENTRALIZADOS - SEM NÚMEROS MÁGICOS)
// ============================================================================
export const LEARNING_THRESHOLDS = {
  MIN_QUESTIONS_READINESS_INITIAL: 10,
  MIN_QUESTIONS_READINESS_DEVELOPING: 30,
  MIN_QUESTIONS_READINESS_ADVANCED: 60,
  MIN_QUESTIONS_WEAK_AREA: 5,
  PASSING_SCORE: 750,
  MAX_SCORE: 900,
  BENCHMARK_MASTERY_PERCENT: 85,
  BENCHMARK_WEAK_PERCENT: 70,
  MIN_CONSECUTIVE_CORRECT_FOR_MASTERY: 2,
} as const;

export type ReadinessState = 
  | 'insufficient_data'   // < 10 questões
  | 'provisional'         // >= 10 questões, mas faltam dimensões (Retenção, Consistência ou Aplicação)
  | 'initial'             // 10–29 questões com dimensões completas
  | 'developing'          // 30–59 questões
  | 'advanced'            // 60+ questões com bom desempenho
  | 'high_consistency';   // 60+ questões com alta consistência e acurácia

export interface ReadinessScoreResult {
  overallPercentage: number | null; // null se dados insuficientes OU se o índice for provisório
  provisionalScore: number | null;  // valor consolidado interno para análises e recomendações
  state: ReadinessState;
  stateLabel: string;
  isProvisional: boolean;
  pendingDimensionsCount: number;
  totalEvaluatedQuestions: number;
  dimensions: {
    performance: { score: number | null; label: string; description: string; hasEnoughData: boolean };
    retention: { score: number | null; label: string; description: string; hasEnoughData: boolean };
    consistency: { score: number | null; label: string; description: string; hasEnoughData: boolean };
    application: { score: number | null; label: string; description: string; hasEnoughData: boolean };
  };
}

// ============================================================================
// NORMALIZAÇÃO DE SKILLS (SLUG CANÔNICO PARA EVITAR FRAGMENTAÇÃO)
// ============================================================================
export function normalizeSkillSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface DomainAnalysis {
  domain: string;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  recentPercentage: number | null;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  isStrongest: boolean;
  isWeakest: boolean;
  needsAttention: boolean;
}

export interface WeakAreaItem {
  name: string;
  type: 'domain' | 'skill';
  percentage: number | null;
  totalQuestions: number;
  errorCount: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  hasEnoughData: boolean;
  recommendation: string;
}

export interface StudyRecommendation {
  targetDomain: string;
  targetSkill?: string;
  reason: string;
  recommendedQuestionCount: number;
  priority: 'high' | 'medium' | 'maintenance';
}

export interface RecurringErrorAnalysis {
  recurringErrorCount: number;
  recurringQuestionIds: string[];
  mostAffectedDomains: { domain: string; count: number }[];
  summaryMessage: string;
}

export type SpacedRepetitionStatus = 'new' | 'hard' | 'mastered' | 'review_needed';

export interface SpacedRepetitionItem {
  questionId: string;
  status: SpacedRepetitionStatus;
  statusLabel: string;
  consecutiveCorrect: number;
  lastAttemptDate: string | null;
  nextReviewDays: number;
}

// ============================================================================
// 1. CÁLCULO DE READINESS SCORE (PRONTIDÃO PARA A CERTIFICAÇÃO)
// ============================================================================
export function calculateReadiness(
  history: ExamHistoryItem[],
  certCode?: string
): ReadinessScoreResult {
  const filteredHistory = certCode 
    ? history.filter(h => !h.cert_id || h.cert_id === certCode || (h as unknown as { code?: string }).code === certCode) 
    : history;

  const totalQuestions = filteredHistory.reduce((acc, h) => acc + (h.total_questions || 0), 0);
  const totalCorrect = filteredHistory.reduce((acc, h) => acc + (h.correct_count || 0), 0);

  // Verificação de limiares mínimos (< 10 questões)
  if (totalQuestions < LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_INITIAL) {
    return {
      overallPercentage: null,
      provisionalScore: null,
      state: 'insufficient_data',
      stateLabel: 'Dados insuficientes',
      isProvisional: true,
      pendingDimensionsCount: 4,
      totalEvaluatedQuestions: totalQuestions,
      dimensions: {
        performance: { score: null, label: 'Performance', description: `Requer ao menos ${LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_INITIAL} questões respondidas`, hasEnoughData: false },
        retention: { score: null, label: 'Retenção', description: 'Requer ao menos 2 sessões em datas ou momentos distintos', hasEnoughData: false },
        consistency: { score: null, label: 'Consistência', description: 'Requer ao menos 3 sessões para medição de regularidade', hasEnoughData: false },
        application: { score: null, label: 'Performance Under Exam Conditions', description: 'Requer ao menos 1 Simulado Oficial de 90 questões cronometrado sob condições de exame', hasEnoughData: false },
      }
    };
  }

  // 1. Dimensão: Performance (Taxa de acertos ponderada com peso 40%)
  const performanceRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const performanceScore = Math.min(100, Math.max(0, Math.round(performanceRate)));

  // 2. Dimensão: Retenção (Acertos em sessões consecutivas / treinos posteriores com peso 20%)
  let retentionScore: number | null = null;
  let retentionDescription = 'Requer ao menos 2 sessões de estudo para avaliar curva de retenção temporal';
  if (filteredHistory.length >= 2) {
    const half = Math.floor(filteredHistory.length / 2);
    const older = filteredHistory.slice(0, half);
    const newer = filteredHistory.slice(half);

    const olderCorrect = older.reduce((a, b) => a + b.correct_count, 0);
    const olderTotal = older.reduce((a, b) => a + b.total_questions, 0);
    const newerCorrect = newer.reduce((a, b) => a + b.correct_count, 0);
    const newerTotal = newer.reduce((a, b) => a + b.total_questions, 0);

    const olderRate = olderTotal > 0 ? (olderCorrect / olderTotal) * 100 : performanceRate;
    const newerRate = newerTotal > 0 ? (newerCorrect / newerTotal) * 100 : performanceRate;
    
    const retentionDelta = newerRate - olderRate;
    retentionScore = Math.min(100, Math.max(0, Math.round(newerRate + (retentionDelta > 0 ? 5 : 0))));
    retentionDescription = 'Capacidade de reter e consolidar conceitos ao longo do tempo';
  }

  // 3. Dimensão: Consistência (Desvio padrão e regularidade das notas com peso 20%)
  let consistencyScore: number | null = null;
  let consistencyDescription = 'Requer ao menos 3 sessões para medição estatística de regularidade (desvio padrão)';
  if (filteredHistory.length >= 3) {
    const scores = filteredHistory.map(h => (h.total_questions > 0 ? (h.correct_count / h.total_questions) * 100 : 0));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    // Se todas as notas forem idênticas (stdDev = 0), a consistência é máxima (100)
    consistencyScore = Math.min(100, Math.max(0, Math.round(100 - (stdDev * 1.5))));
    consistencyDescription = 'Estabilidade e regularidade de notas entre sessões';
  }

  // 4. Dimensão: Performance Under Exam Conditions (Condições Reais de Exame Oficial)
  // Mede estritamente o rendimento sob pressão de tempo e formato oficial (90 questões/90 minutos cronometrados)
  // Utiliza unicamente dados reais de simulados oficiais cronometrados sem inferir capacidade prática
  const officialExams = filteredHistory.filter(h => h.exam_type !== 'training');
  let applicationScore: number | null = null;
  let applicationDescription = 'Requer ao menos 1 Simulado Oficial de 90 questões cronometrado para aferir rendimento sob pressão de prova';
  if (officialExams.length > 0) {
    const officialPassed = officialExams.filter(h => h.passed).length;
    const passRatio = (officialPassed / officialExams.length) * 100;
    const avgScore = officialExams.reduce((a, b) => a + b.score, 0) / officialExams.length;
    applicationScore = Math.min(100, Math.max(0, Math.round((passRatio * 0.4) + ((avgScore / LEARNING_THRESHOLDS.MAX_SCORE) * 100 * 0.6))));
    applicationDescription = 'Rendimento sob pressão cronometrada e condições formais de exame oficial';
  }

  // Composição Ponderada proporcional sem números fictícios:
  const dimWeights = [
    { score: performanceScore, weight: 0.40 },
    { score: retentionScore, weight: 0.20 },
    { score: consistencyScore, weight: 0.20 },
    { score: applicationScore, weight: 0.20 },
  ];

  const activeDims = dimWeights.filter((d): d is { score: number; weight: number } => d.score !== null);
  const totalActiveWeight = activeDims.reduce((acc, d) => acc + d.weight, 0);
  const weightedOverall = totalActiveWeight > 0
    ? Math.min(100, Math.max(0, Math.round(activeDims.reduce((acc, d) => acc + (d.score * d.weight), 0) / totalActiveWeight)))
    : performanceScore;

  const pendingDimensionsCount = dimWeights.filter(d => d.score === null).length;
  const isProvisional = pendingDimensionsCount > 0;

  // Determinação do Estado Pedagógico
  let state: ReadinessState = 'initial';
  let stateLabel = 'Inicial';

  if (isProvisional) {
    state = 'provisional';
    stateLabel = `Índice Provisório (${pendingDimensionsCount} pendência${pendingDimensionsCount > 1 ? 's' : ''})`;
  } else if (totalQuestions >= LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_ADVANCED) {
    if (weightedOverall >= LEARNING_THRESHOLDS.BENCHMARK_MASTERY_PERCENT && (consistencyScore ?? 0) >= 80) {
      state = 'high_consistency';
      stateLabel = 'Alta consistência';
    } else {
      state = 'advanced';
      stateLabel = 'Preparação avançada';
    }
  } else if (totalQuestions >= LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_DEVELOPING) {
    state = 'developing';
    stateLabel = 'Em desenvolvimento';
  } else {
    state = 'initial';
    stateLabel = 'Inicial';
  }

  return {
    // Se for provisório, overallPercentage é null para não exibir "100% Readiness" com dimensões incompletas
    overallPercentage: isProvisional ? null : weightedOverall,
    provisionalScore: weightedOverall,
    state,
    stateLabel,
    isProvisional,
    pendingDimensionsCount,
    totalEvaluatedQuestions: totalQuestions,
    dimensions: {
      performance: { 
        score: performanceScore, 
        label: 'Performance', 
        description: 'Taxa ponderada de acertos no histórico',
        hasEnoughData: true 
      },
      retention: { 
        score: retentionScore, 
        label: 'Retenção', 
        description: retentionDescription,
        hasEnoughData: retentionScore !== null 
      },
      consistency: { 
        score: consistencyScore, 
        label: 'Consistência', 
        description: consistencyDescription,
        hasEnoughData: consistencyScore !== null 
      },
      application: { 
        score: applicationScore, 
        label: 'Performance Under Exam Conditions', 
        description: applicationDescription,
        hasEnoughData: applicationScore !== null 
      },
    }
  };
}

// ============================================================================
// 2. DESEMPENHO POR DOMÍNIO
// ============================================================================
export function calculateDomainPerformance(
  history: ExamHistoryItem[],
  certDomains: string[]
): DomainAnalysis[] {
  if (certDomains.length === 0) return [];

  // Mapeia totais e acertos por domínio
  const totalsByDomain: Record<string, { total: number; correct: number; recentTotal: number; recentCorrect: number }> = {};
  certDomains.forEach(domain => {
    totalsByDomain[domain] = { total: 0, correct: 0, recentTotal: 0, recentCorrect: 0 };
  });

  const sortedHistory = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const recentThresholdIndex = Math.max(0, Math.floor(sortedHistory.length * 0.6));

  sortedHistory.forEach((item, index) => {
    const isRecent = index >= recentThresholdIndex;
    if (item.domain_stats) {
      Object.entries(item.domain_stats).forEach(([dom, stats]) => {
        if (totalsByDomain[dom]) {
          totalsByDomain[dom].total += stats.total;
          totalsByDomain[dom].correct += stats.correct;
          if (isRecent) {
            totalsByDomain[dom].recentTotal += stats.total;
            totalsByDomain[dom].recentCorrect += stats.correct;
          }
        }
      });
    }
  });

  const analyses: DomainAnalysis[] = certDomains.map(domain => {
    const data = totalsByDomain[domain];
    const total = data.total;
    const correct = data.correct;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    let recentPercentage: number | null = null;
    let trend: DomainAnalysis['trend'] = 'insufficient_data';

    if (data.recentTotal >= 3) {
      recentPercentage = Math.round((data.recentCorrect / data.recentTotal) * 100);
      const diff = recentPercentage - percentage;
      if (diff >= 5) trend = 'improving';
      else if (diff <= -5) trend = 'declining';
      else trend = 'stable';
    } else if (total > 0) {
      trend = 'stable';
    }

    return {
      domain,
      totalQuestions: total,
      correctCount: correct,
      percentage,
      recentPercentage,
      trend,
      isStrongest: false,
      isWeakest: false,
      needsAttention: percentage < LEARNING_THRESHOLDS.BENCHMARK_WEAK_PERCENT && total >= LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA,
    };
  });

  // Determina domínio mais forte e mais fraco com dados suficientes
  const activeDomains = analyses.filter(a => a.totalQuestions >= LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA);
  if (activeDomains.length > 0) {
    const sorted = [...activeDomains].sort((a, b) => b.percentage - a.percentage);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    analyses.forEach(a => {
      if (a.domain === strongest.domain) a.isStrongest = true;
      if (a.domain === weakest.domain && strongest.domain !== weakest.domain) a.isWeakest = true;
    });
  }

  return analyses;
}

// ============================================================================
// 3. IDENTIFICAÇÃO DE PONTOS FRACOS (COM PROTEÇÃO DE DADOS INSUFICIENTES)
// ============================================================================
export function identifyWeakAreas(
  domainAnalyses: DomainAnalysis[]
): WeakAreaItem[] {
  const weakAreas: WeakAreaItem[] = [];

  domainAnalyses.forEach(analysis => {
    const hasEnoughData = analysis.totalQuestions >= LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA;
    const errorCount = analysis.totalQuestions - analysis.correctCount;

    if (!hasEnoughData) {
      weakAreas.push({
        name: analysis.domain,
        type: 'domain',
        percentage: analysis.totalQuestions > 0 ? analysis.percentage : null,
        totalQuestions: analysis.totalQuestions,
        errorCount,
        trend: 'insufficient_data',
        hasEnoughData: false,
        recommendation: `Dados insuficientes (${analysis.totalQuestions}/${LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA} questões). Resolva mais questões para calibrar o diagnóstico.`
      });
      return;
    }

    if (analysis.percentage < LEARNING_THRESHOLDS.BENCHMARK_WEAK_PERCENT || analysis.isWeakest) {
      let rec = `Você apresenta maior dificuldade neste domínio (${analysis.percentage}%). Recomendamos realizar uma sessão de 15 questões focadas.`;
      if (analysis.trend === 'declining') {
        rec = `Alerta de queda recente de rendimento. Priorize uma revisão técnica deste domínio imediatamente.`;
      } else if (analysis.percentage >= 70) {
        rec = `Área próxima da nota de corte. Resolva uma bateria de 10 questões para consolidar a aprovação.`;
      }

      weakAreas.push({
        name: analysis.domain,
        type: 'domain',
        percentage: analysis.percentage,
        totalQuestions: analysis.totalQuestions,
        errorCount,
        trend: analysis.trend,
        hasEnoughData: true,
        recommendation: rec
      });
    }
  });

  // Ordena os pontos fracos com dados: menor percentual primeiro
  return weakAreas.sort((a, b) => {
    if (a.hasEnoughData && !b.hasEnoughData) return -1;
    if (!a.hasEnoughData && b.hasEnoughData) return 1;
    return (a.percentage ?? 0) - (b.percentage ?? 0);
  });
}

// ============================================================================
// 4. RECOMENDAÇÃO AUTOMÁTICA DE ESTUDO (PRÓXIMO ALVO)
// ============================================================================
export function generateStudyRecommendations(
  domainAnalyses: DomainAnalysis[],
  weakAreas: WeakAreaItem[],
  recurringErrors: RecurringErrorAnalysis
): StudyRecommendation {
  // 1. Se houver muitos erros recorrentes concentrados em um domínio
  if (recurringErrors.recurringErrorCount >= 3 && recurringErrors.mostAffectedDomains.length > 0) {
    const topDomain = recurringErrors.mostAffectedDomains[0].domain;
    return {
      targetDomain: topDomain,
      reason: `Detectamos ${recurringErrors.recurringErrorCount} erros repetidos. Pratique este domínio no Modo Retaliação para eliminar vícios de resposta.`,
      recommendedQuestionCount: 15,
      priority: 'high'
    };
  }

  // 2. Se houver ponto fraco confirmado com dados suficientes
  const confirmedWeak = weakAreas.find(w => w.hasEnoughData && (w.percentage ?? 0) < LEARNING_THRESHOLDS.BENCHMARK_WEAK_PERCENT);
  if (confirmedWeak) {
    return {
      targetDomain: confirmedWeak.name,
      reason: `Seu rendimento recente em ${confirmedWeak.name} está em ${confirmedWeak.percentage}%, abaixo da meta de corte (75%).`,
      recommendedQuestionCount: 15,
      priority: 'high'
    };
  }

  // 3. Se houver domínio sem dados suficientes
  const untestedDomain = domainAnalyses.find(d => d.totalQuestions < LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA);
  if (untestedDomain) {
    return {
      targetDomain: untestedDomain.domain,
      reason: `Domínio com pouca amostragem (${untestedDomain.totalQuestions} questões). Realize uma bateria tática para calibrar seu índice de prontidão.`,
      recommendedQuestionCount: 10,
      priority: 'medium'
    };
  }

  // 4. Se o aluno estiver bem em tudo (modo manutenção)
  const lowestDomain = [...domainAnalyses].sort((a, b) => a.percentage - b.percentage)[0];
  return {
    targetDomain: lowestDomain ? lowestDomain.domain : (domainAnalyses[0]?.domain || 'Conceitos gerais de segurança'),
    reason: 'Excelente consistência em todos os domínios. Mantenha o ritmo de estudo para reter o conhecimento até a data do exame.',
    recommendedQuestionCount: 20,
    priority: 'maintenance'
  };
}

// ============================================================================
// 5. ANÁLISE DE ERROS RECORRENTES (MODO RETALIAÇÃO 2.0)
// ============================================================================
export function analyzeRecurringErrors(
  history: ExamHistoryItem[],
  questionsCatalog: Question[] = []
): RecurringErrorAnalysis {
  const errorFrequency: Record<string, number> = {};

  history.forEach(item => {
    if (item.incorrect_questions && Array.isArray(item.incorrect_questions)) {
      item.incorrect_questions.forEach(qId => {
        errorFrequency[qId] = (errorFrequency[qId] || 0) + 1;
      });
    }
  });

  // Questões erradas 2 ou mais vezes
  const recurringQuestionIds = Object.keys(errorFrequency).filter(qId => errorFrequency[qId] >= 2);

  // Mapeia domínios afetados pelos erros recorrentes
  const domainCountMap: Record<string, number> = {};
  const questionMap = new Map(questionsCatalog.map(q => [q.id, q]));

  recurringQuestionIds.forEach(qId => {
    const q = questionMap.get(qId);
    if (q) {
      domainCountMap[q.domain] = (domainCountMap[q.domain] || 0) + 1;
    }
  });

  const mostAffectedDomains = Object.entries(domainCountMap)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  let summaryMessage = 'Nenhum erro recorrente detectado. Seus erros anteriores foram isolados.';
  if (recurringQuestionIds.length > 0) {
    summaryMessage = `${recurringQuestionIds.length} questões foram erradas em mais de uma sessão. O Modo Retaliação prioriza esses pontos críticos.`;
  }

  return {
    recurringErrorCount: recurringQuestionIds.length,
    recurringQuestionIds,
    mostAffectedDomains,
    summaryMessage
  };
}

// ============================================================================
// 6. ESTRUTURA PARA REPETIÇÃO ESPAÇADA (SPACED REPETITION CLASSIFICATION)
// ============================================================================
export function classifyQuestionForSpacedRepetition(
  questionId: string,
  history: ExamHistoryItem[],
  confidenceFeedback?: string
): SpacedRepetitionItem {
  let attempts = 0;
  let errorCount = 0;
  let lastCorrect = false;
  let consecutiveCorrect = 0;
  let lastAttemptDate: string | null = null;

  // Analisa o histórico de mais recente para mais antigo
  const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  sorted.forEach(exam => {
    const wasIncorrect = exam.incorrect_questions?.includes(questionId);
    if (wasIncorrect !== undefined) {
      attempts++;
      if (wasIncorrect) {
        errorCount++;
        if (attempts === 1) {
          lastCorrect = false;
          lastAttemptDate = exam.created_at;
        }
      } else {
        if (attempts === 1) {
          lastCorrect = true;
          lastAttemptDate = exam.created_at;
        }
        if (errorCount === 0) {
          consecutiveCorrect++;
        }
      }
    }
  });

  let status: SpacedRepetitionStatus = 'new';
  let statusLabel = 'Nova';
  let nextReviewDays = 1;

  if (attempts === 0) {
    status = 'new';
    statusLabel = 'Nova';
    nextReviewDays = 1;
  } else if (!lastCorrect || confidenceFeedback === 'guessed' || confidenceFeedback === 'confused' || errorCount > 1) {
    status = 'hard';
    statusLabel = 'Difícil / Em reforço';
    nextReviewDays = 1; // Revisão em 24h
  } else if (consecutiveCorrect >= LEARNING_THRESHOLDS.MIN_CONSECUTIVE_CORRECT_FOR_MASTERY) {
    status = 'mastered';
    statusLabel = 'Dominada';
    nextReviewDays = 7; // Revisão em 7 dias
  } else {
    status = 'review_needed';
    statusLabel = 'Revisão programada';
    nextReviewDays = 3; // Revisão em 3 dias
  }

  return {
    questionId,
    status,
    statusLabel,
    consecutiveCorrect,
    lastAttemptDate,
    nextReviewDays
  };
}

// ============================================================================
// 7. DESEMPENHO E COBERTURA DE SKILLS (CONCEITOS CANÔNICOS)
// ============================================================================
export interface SkillPerformanceItem {
  skill: string;
  slug: string;
  totalAttempts: number;
  correctCount: number;
  percentage: number;
  hasEnoughData: boolean;
}

export function calculateSkillPerformance(
  questions: Question[],
  history: ExamHistoryItem[]
): SkillPerformanceItem[] {
  if (!questions || questions.length === 0 || !history || history.length === 0) {
    return [];
  }

  const questionMap = new Map<string, Question>();
  questions.forEach(q => questionMap.set(q.id, q));

  // Acumula total de exposições e erros por ID de questão no histórico
  const questionAttemptsCount: Record<string, { total: number; errors: number }> = {};

  history.forEach(exam => {
    // Se a sessão registrou questões erradas
    if (exam.incorrect_questions && Array.isArray(exam.incorrect_questions)) {
      exam.incorrect_questions.forEach(qId => {
        if (!questionAttemptsCount[qId]) questionAttemptsCount[qId] = { total: 0, errors: 0 };
        questionAttemptsCount[qId].total += 1;
        questionAttemptsCount[qId].errors += 1;
      });
    }
  });

  // Agrega por slug canônico de skill para evitar duplicidade (IAM vs iam vs I.A.M.)
  const skillAggregates: Record<string, { displayName: string; slug: string; total: number; errors: number }> = {};

  Object.entries(questionAttemptsCount).forEach(([qId, stats]) => {
    const q = questionMap.get(qId);
    if (q && q.skills && Array.isArray(q.skills) && q.skills.length > 0) {
      q.skills.forEach(rawSkill => {
        if (!rawSkill || typeof rawSkill !== 'string') return;
        const slug = normalizeSkillSlug(rawSkill);
        if (!slug) return;
        if (!skillAggregates[slug]) {
          skillAggregates[slug] = {
            displayName: rawSkill.trim(),
            slug,
            total: 0,
            errors: 0
          };
        }
        skillAggregates[slug].total += stats.total;
        skillAggregates[slug].errors += stats.errors;
      });
    }
  });

  return Object.values(skillAggregates).map(item => {
    const correct = Math.max(0, item.total - item.errors);
    const pct = item.total > 0 ? Math.round((correct / item.total) * 100) : 0;
    return {
      skill: item.displayName,
      slug: item.slug,
      totalAttempts: item.total,
      correctCount: correct,
      percentage: pct,
      hasEnoughData: item.total >= LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA
    };
  }).sort((a, b) => a.percentage - b.percentage);
}

