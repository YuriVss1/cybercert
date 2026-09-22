// ============================================================================
// CYBER CORE: DEFINIÇÕES DE TIPOS CANÔNICOS (CYBERCERT / ROOT SEC ACADEMY)
// ============================================================================

export type ConceptCategory = 
  | 'NETWORKING'
  | 'CYBERSECURITY'
  | 'CRYPTOGRAPHY'
  | 'IDENTITY'
  | 'CLOUD'
  | 'SOC'
  | 'LINUX'
  | 'WINDOWS';

// Tipos de interação canônicos e extensíveis para qualquer conceito
export type InteractionType = 
  | 'BUILD'
  | 'DRAG_DROP'
  | 'SORT'
  | 'CONNECT'
  | 'CLASSIFY'
  | 'SIMULATE'
  | 'CALCULATE'
  | 'IDENTIFY'
  | 'TRACE'
  | 'TROUBLESHOOT'
  // Compatibilidade com definições prévias
  | 'calculate'
  | 'build'
  | 'identify'
  | 'match'
  | 'recall'
  | 'simulate';

export type ChallengeType = InteractionType;

export type DifficultyLevel = 
  | 'BEGINNER' 
  | 'INTERMEDIATE' 
  | 'ADVANCED'
  // Compatibilidade com níveis prévios
  | 'FOUNDATION' 
  | 'PRACTICE' 
  | 'APPLICATION' 
  | 'MASTERY';

export type RetentionState = 
  | 'NOT_STARTED'       // Ainda não iniciado
  | 'IN_DEVELOPMENT'    // Iniciado, em prática
  | 'CONSOLIDATED'      // Consolidado com múltiplas evidências
  | 'MASTERED';         // Totalmente dominado com retenção espaçada confirmada

export type ReviewReason = 
  | 'ERROR'             // Errou recentemente
  | 'DOUBT'             // Usuário marcou dúvida
  | 'GUESSED'           // Resposta por tentativa/chute
  | 'SCHEDULED'         // Revisão programada pelo intervalo de espaçamento
  | 'LOW_RETENTION'     // Retenção abaixo do limiar
  | 'INCONSISTENT'      // Respostas oscilando entre acertos e erros
  | 'DID_NOT_KNOW';     // Usuário selecionou ação explícita "Não sei"

export type UserConfidence = 
  | 'CONFIDENT'         // Tinha certeza do conceito
  | 'HESITANT'          // Teve dúvida
  | 'DID_NOT_KNOW';     // Não sabia o conceito ("Não sei")

export type ConceptViewStage = 
  | 'learn'       // APRENDER: Explicação curta, direta e visual
  | 'interact'    // INTERAGIR: Manipulação direta do conceito
  | 'practice'    // PRATICAR: Exercícios progressivos
  | 'test'        // TESTAR: Avaliação sem pistas imediatas
  | 'mastery'     // DOMINAR: Síntese de retenção e evidências
  | 'review';     // REVISAR: Reforço espaçado no ciclo de vida

export interface ConceptStageProgress {
  learnCompleted: boolean;
  interactCompleted: boolean;
  practiceCompleted: boolean;
  testCompleted: boolean;
  reviewCompleted?: boolean;
}

export interface ConceptChallenge {
  id: string;
  conceptId: string;
  type: ChallengeType;
  level: DifficultyLevel;
  prompt: string;
  hint?: string;
  config: Record<string, unknown>;
  solution: Record<string, unknown>;
  pedagogicalExplanation: string;
  orderIndex: number;
}

export interface CyberConcept {
  id: string;
  slug: string;
  title: string;
  category: ConceptCategory;
  level: DifficultyLevel;
  shortDescription: string;
  interactionType?: InteractionType;
  learningContent: {
    overview: string;
    keyPoints: string[];
    visualComparison?: {
      beforeLabel: string;
      beforeValue: string;
      afterLabel: string;
      afterValue: string;
    };
  };
  challenges: ConceptChallenge[];
  prerequisiteSlugs: string[];
}

export interface UserConceptMastery {
  userId: string;
  conceptId: string;
  conceptSlug: string;
  accuracy: number;                // 0 a 100
  confidenceRate: number;          // 0 a 100
  totalAttempts: number;
  successfulRetrievals: number;
  challengeDiversityCount: number; // Quantidade de tipos de desafios completados com sucesso
  lastAttemptAt: string | null;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalDays: number;
  retentionState: RetentionState;
  consecutiveCorrect: number;
  stageProgress: ConceptStageProgress;
}

export interface UserConceptAttempt {
  id: string;
  userId: string;
  conceptId: string;
  challengeId: string;
  challengeType: ChallengeType;
  isCorrect: boolean;
  confidence: UserConfidence;
  durationMs: number;
  submittedAnswer: Record<string, unknown> | string | number | unknown[];
  feedbackGiven: string;
  createdAt: string;
}

export interface ReviewQueueItem {
  id: string;
  userId: string;
  conceptId: string;
  conceptSlug: string;
  conceptTitle: string;
  category: ConceptCategory;
  reason: ReviewReason;
  reasonHumanLabel: string;
  priority: number; // 1 (crítico: did_not_know/error) a 5 (manutenção: scheduled)
  dueAt: string;
  isOverdue: boolean;
}

// Contrato Padronizado de Experiência Conceitual (Pluggable Experience Contract)
export interface ConceptAttemptPayload {
  challengeId: string;
  challengeType: ChallengeType;
  isCorrect: boolean;
  confidence: UserConfidence;
  durationMs: number;
  submittedAnswer: Record<string, unknown> | string | number | unknown[];
  feedbackGiven: string;
}

export interface ConceptExperienceProps {
  concept: CyberConcept;
  activeStage: ConceptViewStage;
  userId?: string;
  onCompleteStage: (stage: ConceptViewStage) => void;
  onRecordAttempt: (payload: ConceptAttemptPayload) => { masteryUpdated: boolean; newState: RetentionState };
  onDidNotKnow: (challengeId: string, challengeType: ChallengeType) => void;
}

// Telemetria baseada em eventos (Event-Based Metrics - Unificados & Idempotentes)
export type LearningEventType = 
  | 'CONCEPT_STARTED'
  | 'CONCEPT_LEARNED'
  | 'CHALLENGE_STARTED'
  | 'CHALLENGE_COMPLETED'
  | 'CHALLENGE_CORRECT'
  | 'CHALLENGE_INCORRECT'
  | 'CONCEPT_REVIEWED'
  | 'CONCEPT_CONSOLIDATED'
  | 'CONCEPT_MASTERED'
  | 'REVIEW_QUEUE_COMPLETED'
  | 'CONCEPT_EXERCISE_COMPLETED'
  | 'CONCEPT_MASTERY_ACHIEVED'
  | 'CONCEPT_REVIEW_COMPLETED'
  | 'CONCEPT_STAGE_COMPLETED';

export interface LearningEvent {
  id: string;
  userId: string;
  eventType: LearningEventType;
  conceptSlug: string;
  challengeId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface CyberCoreGlobalMetrics {
  conceptsMasteredCount: number;
  conceptsDevelopingCount: number;
  conceptsToReviewCount: number;
  conceptsNotStartedCount: number;
  totalExercisesCompleted: number;
  totalReviewsCompleted: number;
  overallRetentionPercentage: number;
  categoryProgress: Record<ConceptCategory, {
    total: number;
    mastered: number;
    inProgress: number;
    accuracy: number;
  }>;
}
