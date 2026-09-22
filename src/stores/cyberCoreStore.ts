// ============================================================================
// CYBER CORE STORE: ESTADO PERSISTENTE, EVIDÊNCIA DE DOMÍNIO E FILA DE REVISÃO
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CyberConcept,
  UserConceptMastery,
  UserConceptAttempt,
  ReviewQueueItem,
  UserConfidence,
  ChallengeType,
  RetentionState,
  CyberCoreGlobalMetrics,
  ConceptCategory,
  ConceptViewStage
} from '@/lib/cyberCore/cyberCoreTypes';
import {
  CYBER_CONCEPTS_CATALOG,
  getConceptBySlug
} from '@/lib/cyberCore/conceptsData';
import {
  calculateNextReview,
  evaluateConceptMastery,
  getReviewReasonLabel
} from '@/lib/cyberCore/cyberCoreEngine';

interface CyberCoreState {
  concepts: CyberConcept[];
  selectedConceptSlug: string | null;
  activeStage: ConceptViewStage;
  
  // Dados do usuário (Local-first com persistência)
  userMastery: Record<string, UserConceptMastery>; // Chave: conceptSlug
  attemptsHistory: UserConceptAttempt[];
  reviewQueue: ReviewQueueItem[];
  recordedEventIds: string[]; // Ledger de idempotência

  // Ações de Navegação
  setSelectedConcept: (slug: string | null) => void;
  setActiveStage: (stage: ConceptViewStage) => void;

  // Ações de Aprendizagem & Exercícios
  recordAttempt: (params: {
    userId: string;
    conceptSlug: string;
    challengeId: string;
    challengeType: ChallengeType;
    isCorrect: boolean;
    confidence: UserConfidence;
    durationMs: number;
    submittedAnswer: Record<string, unknown> | string | number;
    feedbackGiven: string;
  }) => { masteryUpdated: boolean; newState: RetentionState };

  recordDidNotKnow: (params: {
    userId: string;
    conceptSlug: string;
    challengeId: string;
    challengeType: ChallengeType;
    durationMs: number;
  }) => void;

  completeStageProgress: (conceptSlug: string, stage: 'learn' | 'interact' | 'practice' | 'test' | 'review') => void;

  resolveReviewItem: (conceptSlug: string) => void;

  // Métricas Derivadas em Tempo Real (Zero Mock Data)
  getGlobalMetrics: () => CyberCoreGlobalMetrics;
  getConceptMastery: (conceptSlug: string) => UserConceptMastery | null;
}

export const useCyberCoreStore = create<CyberCoreState>()(
  persist(
    (set, get) => ({
      concepts: CYBER_CONCEPTS_CATALOG,
      selectedConceptSlug: null,
      activeStage: 'learn',

      userMastery: {},
      attemptsHistory: [],
      reviewQueue: [],
      recordedEventIds: [],

      setSelectedConcept: (slug) => {
        set({
          selectedConceptSlug: slug,
          activeStage: 'learn'
        });
      },

      setActiveStage: (stage) => set({ activeStage: stage }),

      completeStageProgress: (conceptSlug, stage) => {
        const { userMastery } = get();
        const existing = userMastery[conceptSlug] || {
          userId: 'local-user',
          conceptId: conceptSlug,
          conceptSlug,
          accuracy: 0,
          confidenceRate: 0,
          totalAttempts: 0,
          successfulRetrievals: 0,
          challengeDiversityCount: 0,
          lastAttemptAt: new Date().toISOString(),
          lastReviewAt: null,
          nextReviewAt: null,
          reviewIntervalDays: 1,
          retentionState: 'IN_DEVELOPMENT' as RetentionState,
          consecutiveCorrect: 0,
          stageProgress: {
            learnCompleted: false,
            interactCompleted: false,
            practiceCompleted: false,
            testCompleted: false
          }
        };

        const updatedProgress = { ...existing.stageProgress };
        if (stage === 'learn') updatedProgress.learnCompleted = true;
        if (stage === 'interact') updatedProgress.interactCompleted = true;
        if (stage === 'practice') updatedProgress.practiceCompleted = true;
        if (stage === 'test') updatedProgress.testCompleted = true;
        if (stage === 'review') updatedProgress.reviewCompleted = true;

        set({
          userMastery: {
            ...userMastery,
            [conceptSlug]: {
              ...existing,
              stageProgress: updatedProgress,
              retentionState: existing.retentionState === 'NOT_STARTED' ? 'IN_DEVELOPMENT' : existing.retentionState
            }
          }
        });
      },

      recordAttempt: ({
        userId,
        conceptSlug,
        challengeId,
        challengeType,
        isCorrect,
        confidence,
        durationMs,
        submittedAnswer,
        feedbackGiven
      }) => {
        const attemptId = `${userId}-${conceptSlug}-${challengeId}-${Date.now()}`;
        const timestamp = new Date().toISOString();

        const newAttempt: UserConceptAttempt = {
          id: attemptId,
          userId,
          conceptId: conceptSlug,
          challengeId,
          challengeType,
          isCorrect,
          confidence,
          durationMs,
          submittedAnswer,
          feedbackGiven,
          createdAt: timestamp
        };

        const { userMastery, attemptsHistory, reviewQueue, recordedEventIds } = get();
        const concept = getConceptBySlug(conceptSlug);

        // Prevenção de duplicatas por idempotência
        const eventId = `event-${userId}-${conceptSlug}-${challengeId}-${isCorrect ? 'corr' : 'inc'}-${Math.floor(Date.now() / 1000)}`;
        if (recordedEventIds.includes(eventId)) {
          return { masteryUpdated: false, newState: userMastery[conceptSlug]?.retentionState || 'NOT_STARTED' };
        }

        const existingMastery = userMastery[conceptSlug] || {
          userId,
          conceptId: conceptSlug,
          conceptSlug,
          accuracy: 0,
          confidenceRate: 0,
          totalAttempts: 0,
          successfulRetrievals: 0,
          challengeDiversityCount: 0,
          lastAttemptAt: null,
          lastReviewAt: null,
          nextReviewAt: null,
          reviewIntervalDays: 1,
          retentionState: 'NOT_STARTED' as RetentionState,
          consecutiveCorrect: 0,
          stageProgress: {
            learnCompleted: false,
            interactCompleted: false,
            practiceCompleted: false,
            testCompleted: false
          }
        };

        const updatedTotalAttempts = existingMastery.totalAttempts + 1;
        const updatedSuccessfulRetrievals = existingMastery.successfulRetrievals + (isCorrect ? 1 : 0);
        const updatedAccuracy = Math.round((updatedSuccessfulRetrievals / updatedTotalAttempts) * 100);
        const updatedConsecutive = isCorrect ? existingMastery.consecutiveCorrect + 1 : 0;

        // Diversidade de desafios completados com sucesso
        const previousCorrectTypes = new Set(
          attemptsHistory
            .filter(a => a.conceptId === conceptSlug && a.isCorrect)
            .map(a => a.challengeType)
        );
        if (isCorrect) previousCorrectTypes.add(challengeType);
        const diversityCount = previousCorrectTypes.size;

        // Avaliação de evidência de domínio
        const newRetentionState = evaluateConceptMastery({
          totalAttempts: updatedTotalAttempts,
          successfulRetrievals: updatedSuccessfulRetrievals,
          accuracy: updatedAccuracy,
          challengeDiversityCount: diversityCount,
          consecutiveCorrect: updatedConsecutive,
          currentRetentionState: existingMastery.retentionState
        });

        // Cálculo de repetição espaçada
        const reviewCalc = calculateNextReview({
          currentIntervalDays: existingMastery.reviewIntervalDays,
          isCorrect,
          confidence,
          consecutiveCorrect: updatedConsecutive
        });

        const updatedMastery: UserConceptMastery = {
          ...existingMastery,
          accuracy: updatedAccuracy,
          totalAttempts: updatedTotalAttempts,
          successfulRetrievals: updatedSuccessfulRetrievals,
          challengeDiversityCount: diversityCount,
          lastAttemptAt: timestamp,
          nextReviewAt: reviewCalc.dueDate.toISOString(),
          reviewIntervalDays: reviewCalc.nextIntervalDays,
          retentionState: newRetentionState,
          consecutiveCorrect: updatedConsecutive
        };

        // Atualização da fila de revisão (Se errou, teve dúvida ou venceu o intervalo)
        const updatedQueue = [...reviewQueue];
        const queueIndex = updatedQueue.findIndex(q => q.conceptSlug === conceptSlug);

        if (!isCorrect || confidence === 'HESITANT' || confidence === 'DID_NOT_KNOW') {
          const queueItem: ReviewQueueItem = {
            id: `rev-${conceptSlug}`,
            userId,
            conceptId: conceptSlug,
            conceptSlug,
            conceptTitle: concept?.title || conceptSlug,
            category: concept?.category || 'NETWORKING',
            reason: reviewCalc.reason,
            reasonHumanLabel: getReviewReasonLabel(reviewCalc.reason),
            priority: reviewCalc.priority,
            dueAt: reviewCalc.dueDate.toISOString(),
            isOverdue: reviewCalc.dueDate.getTime() <= Date.now()
          };

          if (queueIndex >= 0) {
            updatedQueue[queueIndex] = queueItem;
          } else {
            updatedQueue.push(queueItem);
          }
        } else if (isCorrect && queueIndex >= 0) {
          // Remove da fila de pendentes imediatas ao acertar com convicção
          updatedQueue.splice(queueIndex, 1);
        }

        // Ordena fila de revisão por prioridade (1 mais urgente) e por data de vencimento
        updatedQueue.sort((a, b) => a.priority - b.priority || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

        set({
          userMastery: {
            ...userMastery,
            [conceptSlug]: updatedMastery
          },
          attemptsHistory: [newAttempt, ...attemptsHistory].slice(0, 200), // Mantém histórico recente
          reviewQueue: updatedQueue,
          recordedEventIds: [...recordedEventIds, eventId].slice(-500)
        });

        return {
          masteryUpdated: newRetentionState !== existingMastery.retentionState,
          newState: newRetentionState
        };
      },

      recordDidNotKnow: ({ userId, conceptSlug, challengeId, challengeType, durationMs }) => {
        get().recordAttempt({
          userId,
          conceptSlug,
          challengeId,
          challengeType,
          isCorrect: false,
          confidence: 'DID_NOT_KNOW',
          durationMs,
          submittedAnswer: 'did_not_know',
          feedbackGiven: 'Marcado como "Não sei". O conceito foi adicionado com prioridade máxima à sua Fila de Revisão para fixação pedagógica.'
        });
      },

      resolveReviewItem: (conceptSlug) => {
        const { reviewQueue } = get();
        set({
          reviewQueue: reviewQueue.filter(q => q.conceptSlug !== conceptSlug)
        });
      },

      getConceptMastery: (conceptSlug) => {
        return get().userMastery[conceptSlug] || null;
      },

      getGlobalMetrics: () => {
        const { userMastery, attemptsHistory, reviewQueue } = get();
        const masteryValues = Object.values(userMastery);

        // 1. Contagens Derivadas Reais (Zero Mock Data)
        const conceptsMasteredCount = masteryValues.filter(m => m.retentionState === 'MASTERED').length;
        const conceptsDevelopingCount = masteryValues.filter(m => m.retentionState === 'IN_DEVELOPMENT' || m.retentionState === 'CONSOLIDATED').length;
        const conceptsToReviewCount = reviewQueue.length;
        
        const catalogTotal = CYBER_CONCEPTS_CATALOG.length;
        const startedCount = Object.keys(userMastery).length;
        const conceptsNotStartedCount = Math.max(0, catalogTotal - startedCount);

        const totalExercisesCompleted = attemptsHistory.length;
        const totalReviewsCompleted = attemptsHistory.filter(a => a.isCorrect && a.confidence !== 'DID_NOT_KNOW').length;

        // Retenção média calculada com base na acurácia real
        const overallRetentionPercentage = masteryValues.length > 0
          ? Math.round(masteryValues.reduce((acc, m) => acc + m.accuracy, 0) / masteryValues.length)
          : 0;

        // Progresso por Categoria
        const categories: ConceptCategory[] = [
          'NETWORKING', 'CYBERSECURITY', 'CRYPTOGRAPHY', 'IDENTITY', 
          'CLOUD', 'SOC', 'LINUX', 'WINDOWS'
        ];

        const categoryProgress = {} as CyberCoreGlobalMetrics['categoryProgress'];
        categories.forEach(cat => {
          const catConcepts = CYBER_CONCEPTS_CATALOG.filter(c => c.category === cat);
          const catMasteries = catConcepts
            .map(c => userMastery[c.slug])
            .filter((m): m is UserConceptMastery => Boolean(m));

          const mastered = catMasteries.filter(m => m.retentionState === 'MASTERED').length;
          const inProgress = catMasteries.filter(m => m.retentionState === 'IN_DEVELOPMENT' || m.retentionState === 'CONSOLIDATED').length;
          const avgAcc = catMasteries.length > 0
            ? Math.round(catMasteries.reduce((a, b) => a + b.accuracy, 0) / catMasteries.length)
            : 0;

          categoryProgress[cat] = {
            total: catConcepts.length,
            mastered,
            inProgress,
            accuracy: avgAcc
          };
        });

        return {
          conceptsMasteredCount,
          conceptsDevelopingCount,
          conceptsToReviewCount,
          conceptsNotStartedCount,
          totalExercisesCompleted,
          totalReviewsCompleted,
          overallRetentionPercentage,
          categoryProgress
        };
      }
    }),
    {
      name: 'cybercert_core_session_v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      })),
      partialize: (state) => ({
        userMastery: state.userMastery,
        attemptsHistory: state.attemptsHistory,
        reviewQueue: state.reviewQueue,
        recordedEventIds: state.recordedEventIds,
      }),
    }
  )
);
