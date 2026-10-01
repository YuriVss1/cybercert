"use client";

import React, { useState, useMemo } from "react";
import { CampaignStep, CampaignStepResult } from "@/types/campaign";
import { CYBER_CONCEPTS_CATALOG } from "@/lib/cyberCore/conceptsData";
import { getConceptExperience } from "@/lib/cyberCore/experienceRegistry";
import { 
  CyberConcept, 
  ConceptAttemptPayload, 
  ConceptViewStage, 
  StageMode, 
  RetentionState 
} from "@/lib/cyberCore/cyberCoreTypes";
import { CheckCircle2, ShieldAlert, RotateCcw } from "lucide-react";

interface CyberCoreCampaignAdapterProps {
  step: CampaignStep;
  savedResult?: CampaignStepResult;
  onStepResult: (result: CampaignStepResult, evidenceReward?: string) => void;
}

export default function CyberCoreCampaignAdapter({
  step,
  savedResult,
  onStepResult
}: CyberCoreCampaignAdapterProps) {
  const [retryKey, setRetryKey] = useState<number>(0);
  const [lastAttempt, setLastAttempt] = useState<ConceptAttemptPayload | null>(null);

  // 1. Resolve Concept data from catalog or generate safe synthetic fallback
  const concept: CyberConcept = useMemo(() => {
    const found = CYBER_CONCEPTS_CATALOG.find(c => c.slug === step.labId || c.id === step.labId);
    if (found) return found;

    return {
      id: `synthetic-${step.labId}`,
      slug: step.labId,
      title: step.title,
      category: 'CYBERSECURITY',
      level: 'INTERMEDIATE',
      shortDescription: step.briefing,
      learningContent: {
        overview: step.briefing,
        keyPoints: [step.objective, step.successCondition]
      },
      challenges: [],
      prerequisiteSlugs: []
    };
  }, [step]);

  // 2. Resolve Lab component
  const LabComponent = useMemo(() => {
    return getConceptExperience(step.labId);
  }, [step.labId]);

  // 3. Callback handlers strictly adhering to ConceptExperienceProps
  const handleRecordAttempt = (payload: ConceptAttemptPayload): { masteryUpdated: boolean; newState: RetentionState } => {
    setLastAttempt(payload);

    const stepResult: CampaignStepResult = {
      stepId: step.id,
      completed: payload.isCorrect,
      correct: payload.isCorrect,
      actionId: payload.challengeId,
      evidence: payload.feedbackGiven,
      completedAt: new Date().toISOString()
    };

    onStepResult(stepResult, payload.isCorrect ? step.evidenceReward : undefined);

    return {
      masteryUpdated: true,
      newState: payload.isCorrect ? 'MASTERED' : 'IN_DEVELOPMENT'
    };
  };

  const handleCompleteStage = (stage: ConceptViewStage) => {
    const stepResult: CampaignStepResult = {
      stepId: step.id,
      completed: true,
      correct: true,
      actionId: `stage-${stage}-completed`,
      evidence: `Estágio ${stage} concluído com sucesso.`,
      completedAt: new Date().toISOString()
    };

    onStepResult(stepResult, step.evidenceReward);
  };

  const handleDidNotKnow = (challengeId: string) => {
    const stepResult: CampaignStepResult = {
      stepId: step.id,
      completed: true,
      correct: false,
      actionId: challengeId,
      errorType: 'did_not_know',
      evidence: 'Operador indicou desconhecimento do indicador.',
      completedAt: new Date().toISOString()
    };

    onStepResult(stepResult);
  };

  const handleRetry = () => {
    setLastAttempt(null);
    setRetryKey(prev => prev + 1);
  };

  const isStepAccomplished = savedResult?.correct;

  return (
    <div className="space-y-4">
      {/* Dynamic CyberCore Lab mount */}
      <div className="relative">
        <LabComponent
          key={retryKey}
          concept={concept}
          activeStage="practice"
          stageMode="practice"
          userId="campaign-operator"
          onRecordAttempt={handleRecordAttempt}
          onCompleteStage={handleCompleteStage}
          onDidNotKnow={handleDidNotKnow}
        />
      </div>

      {/* Operational Attempt Feedback */}
      {lastAttempt && !lastAttempt.isCorrect && (
        <div className="cockpit-card border-rose-500/40 bg-rose-950/20 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                Hipótese de Investigação Não Confirmada
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                {lastAttempt.feedbackGiven || "A análise submetida diverge dos indicadores de ataque observados."}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="avionics-button px-3 py-1.5 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Análise
          </button>
        </div>
      )}

      {isStepAccomplished && (
        <div className="cockpit-card border-emerald-500/40 bg-emerald-950/20 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="telemetry-chip bg-emerald-950/60 text-emerald-300 border-emerald-800/80 text-[10px] font-bold uppercase">
                  ETAPA VALIDADA
                </span>
                <span className="text-xs font-mono text-zinc-300 font-bold">Investigação Concluída</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evidência correlacionada com sucesso. Pronto para avançar para a próxima fase do incidente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
