"use client";

import { useState } from "react";
import { Shield, Terminal, Cpu, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { PbqExamItem } from "@/data/examPbqsData";
import { PbqActionResult } from "@/lib/pbqData";
import FirewallAclLab from "./labs/FirewallAclLab";
import SiemLogLab from "./labs/SiemLogLab";
import EdrProcessLab from "./labs/EdrProcessLab";

export interface PbqAssessmentResult {
  completed: boolean;
  correct: boolean;
  actionId: string;
  errorType?: string;
  submittedAt?: string;
}

interface PbqAssessmentAdapterProps {
  item: PbqExamItem;
  isLocked: boolean;
  isReviewing?: boolean;
  savedAnswer?: PbqAssessmentResult;
  onCommitAnswer: (result: PbqAssessmentResult) => void;
}

export default function PbqAssessmentAdapter({
  item,
  isLocked,
  isReviewing = false,
  savedAnswer,
  onCommitAnswer,
}: PbqAssessmentAdapterProps) {
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const handleActionSubmit = (result: PbqActionResult) => {
    // Intercepts the lab action silently without displaying consequence modals or audio
    const assessmentResult: PbqAssessmentResult = {
      completed: true,
      correct: result.correct,
      actionId: result.actionId,
      errorType: result.errorType,
      submittedAt: new Date().toISOString()
    };

    onCommitAnswer(assessmentResult);
    setSubmissionFeedback("Configuração registrada no sistema de avaliação da prova.");
  };

  const getLabIcon = () => {
    switch (item.labId) {
      case 'firewall-acl':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'siem-log':
        return <Terminal className="w-5 h-5 text-purple-400" />;
      case 'edr-process':
        return <Cpu className="w-5 h-5 text-rose-400" />;
    }
  };

  const isAnswered = Boolean(savedAnswer?.completed);
  const isCorrectInReview = Boolean(savedAnswer?.completed && savedAnswer?.correct);

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* MISSION BRIEFING & OPERATIONAL CONTEXT BANNER                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="cockpit-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950/90 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40">
              {getLabIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="telemetry-chip bg-cyan-950/40 text-cyan-300 border-cyan-800/50 text-[10px] font-bold uppercase">
                  SIMULAÇÃO PRÁTICA BASEADA EM DESEMPENHO (PBQ)
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  {item.domain}
                </span>
              </div>
              <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase mt-1">
                {item.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="telemetry-chip bg-zinc-900 border-zinc-800 text-zinc-400 text-xs font-mono">
              VALOR: {item.points} PONTOS
            </span>

            {/* In-Flight Status Telemetry */}
            {!isReviewing && (
              <span
                className={`telemetry-chip text-xs font-mono font-bold ${
                  isAnswered
                    ? "bg-emerald-950/50 border-emerald-600/70 text-emerald-300"
                    : "bg-amber-950/40 border-amber-600/50 text-amber-300"
                }`}
              >
                {isAnswered ? "✓ RESPOSTA REGISTRADA" : "○ PENDENTE DE SUBMISSÃO"}
              </span>
            )}
          </div>
        </div>

        {/* Cenário Operacional */}
        <div className="cockpit-subcard p-4 rounded-xl border border-white/[0.06] bg-black/40 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Info className="w-4 h-4 shrink-0" />
            <span>Instruções da Missão & Requisitos do Cenário</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {item.scenarioText}
          </p>
        </div>

        {/* Notificação sutil de registro de ação */}
        {submissionFeedback && !isReviewing && (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{submissionFeedback}</span>
          </div>
        )}

        {/* Visualização Pós-Exame / Post-Mortem */}
        {isReviewing && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
              isCorrectInReview
                ? "bg-emerald-950/40 border-emerald-600/60 text-emerald-300"
                : "bg-rose-950/40 border-rose-600/60 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
              {isCorrectInReview ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>CENÁRIO MITIGADO CORRETAMENTE (+{item.points} PONTOS)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>FALHA NA RESOLUÇÃO DO PBQ (0 PONTOS)</span>
                </>
              )}
            </div>
            <p className="text-[11px] opacity-90 font-sans">
              {isCorrectInReview
                ? "A parametrização de segurança atendeu a todos os critérios operacionais da missão sem introduzir vulnerabilidades ou indisponibilidade."
                : savedAnswer?.actionId
                ? `A ação submetida acionou uma condição de erro ou vulnerabilidade residual (${savedAnswer.actionId}${
                    savedAnswer.errorType ? ` - ${savedAnswer.errorType}` : ""
                  }).`
                : "Nenhuma configuração foi aplicada a este PBQ antes do encerramento da prova."}
            </p>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* LABORATÓRIO EMBUTIDO (ISOLADO E CONTROLADO)                          */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative">
        {item.labId === 'firewall-acl' && (
          <FirewallAclLab
            onActionSubmit={handleActionSubmit}
            isLocked={isLocked || isReviewing}
          />
        )}

        {item.labId === 'siem-log' && (
          <SiemLogLab
            onActionSubmit={handleActionSubmit}
            isLocked={isLocked || isReviewing}
          />
        )}

        {item.labId === 'edr-process' && (
          <EdrProcessLab
            onActionSubmit={handleActionSubmit}
            isLocked={isLocked || isReviewing}
          />
        )}
      </div>
    </div>
  );
}
