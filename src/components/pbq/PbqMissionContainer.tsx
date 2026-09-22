"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  X,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  PbqOperation,
  PbqActionResult,
  PbqErrorType,
  PbqLabProps,
} from "@/lib/pbqData";

// Import all 10 labs
import RansomwareContainmentLab from "./labs/RansomwareContainmentLab";
import FirewallAclLab from "./labs/FirewallAclLab";
import IamPrivilegeLab from "./labs/IamPrivilegeLab";
import PhishingHeaderLab from "./labs/PhishingHeaderLab";
import SiemLogLab from "./labs/SiemLogLab";
import EdrProcessLab from "./labs/EdrProcessLab";
import CloudS3Lab from "./labs/CloudS3Lab";
import PkiTlsLab from "./labs/PkiTlsLab";
import NetworkCliLab from "./labs/NetworkCliLab";
import DataExfilLab from "./labs/DataExfilLab";

interface Props {
  operation: PbqOperation;
  onBackToMenu: () => void;
  onComplete?: (
    operationId: string,
    success: boolean,
    score: number,
    elapsedSeconds: number
  ) => void;
}

type MissionPhase = "BRIEFING" | "ACTIVE" | "DEBRIEF";

export default function PbqMissionContainer({
  operation,
  onBackToMenu,
  onComplete,
}: Props) {
  // Mission Lifecycle
  const [phase, setPhase] = useState<MissionPhase>("BRIEFING");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Resilient 90s timer based on Date.now()
  const [deadline, setDeadline] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    operation.timeLimit
  );
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Telemetry & Error Tracking
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [consequencesCount, setConsequencesCount] = useState<number>(0);
  const [errorTypeCounts, setErrorTypeCounts] = useState<
    Record<PbqErrorType, number>
  >({
    wrong_target: 0,
    wrong_action: 0,
    dangerous_action: 0,
    incomplete_action: 0,
    missed_indicator: 0,
    delayed_action: 0,
  });

  // Consequence popup modal state
  const [activeConsequence, setActiveConsequence] = useState<{
    title?: string;
    actionTaken: string;
    consequence: string;
    severity?: string;
  } | null>(null);

  // Start mission from Briefing
  const handleStartMission = () => {
    setDeadline(Date.now() + operation.timeLimit * 1000);
    setRemainingSeconds(operation.timeLimit);
    setPhase("ACTIVE");
    setIsSuccess(false);
    setErrorsCount(0);
    setConsequencesCount(0);
    setActiveConsequence(null);
    setElapsedTime(0);
    setErrorTypeCounts({
      wrong_target: 0,
      wrong_action: 0,
      dangerous_action: 0,
      incomplete_action: 0,
      missed_indicator: 0,
      delayed_action: 0,
    });
  };

  // Resilient Countdown loop
  useEffect(() => {
    if (phase !== "ACTIVE") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setIsSuccess(false);
        setElapsedTime(operation.timeLimit);
        setPhase("DEBRIEF");
        setErrorTypeCounts((prev) => ({
          ...prev,
          delayed_action: prev.delayed_action + 1,
        }));
        if (onComplete) {
          onComplete(operation.id, false, 0, operation.timeLimit);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [deadline, phase, operation.timeLimit, operation.id, onComplete]);

  // Common Contract Handler: called by Labs
  const handleActionSubmit = (result: PbqActionResult) => {
    if (phase !== "ACTIVE") return;

    if (result.correct) {
      const elapsed = Math.max(1, operation.timeLimit - remainingSeconds);
      setElapsedTime(elapsed);
      setIsSuccess(true);
      setPhase("DEBRIEF");

      const baseAccuracy = Math.max(40, 100 - errorsCount * 15);
      const timeBonus = Math.round(
        (remainingSeconds / operation.timeLimit) * 15
      );
      const finalScore = Math.min(100, baseAccuracy + timeBonus);

      if (onComplete) {
        onComplete(operation.id, true, finalScore, elapsed);
      }
    } else {
      setErrorsCount((prev) => prev + 1);

      if (result.errorType) {
        setErrorTypeCounts((prev) => ({
          ...prev,
          [result.errorType!]: (prev[result.errorType!] || 0) + 1,
        }));
      }

      if (result.consequence) {
        setConsequencesCount((prev) => prev + 1);
        setActiveConsequence(result.consequence);
      }
    }
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / operation.timeLimit) * 100)
  );
  const isUrgent = remainingSeconds <= 20;
  const isWarning = remainingSeconds <= 30 && !isUrgent;

  // Timer formatting
  const timerMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const timerSeconds = String(remainingSeconds % 60).padStart(2, "0");

  // Timer color
  const timerColor = isUrgent
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : "text-zinc-300";

  const barColor = isUrgent
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-cyan-600";

  // Render appropriate Lab component
  const renderLabComponent = () => {
    const labProps: PbqLabProps = {
      onActionSubmit: handleActionSubmit,
      isLocked: phase !== "ACTIVE",
    };

    switch (operation.id) {
      case "pbq-001": return <RansomwareContainmentLab {...labProps} />;
      case "pbq-002": return <FirewallAclLab {...labProps} />;
      case "pbq-003": return <IamPrivilegeLab {...labProps} />;
      case "pbq-004": return <PhishingHeaderLab {...labProps} />;
      case "pbq-005": return <SiemLogLab {...labProps} />;
      case "pbq-006": return <EdrProcessLab {...labProps} />;
      case "pbq-007": return <CloudS3Lab {...labProps} />;
      case "pbq-008": return <PkiTlsLab {...labProps} />;
      case "pbq-009": return <NetworkCliLab {...labProps} />;
      case "pbq-010": return <DataExfilLab {...labProps} />;
      default:
        return (
          <div className="p-8 text-center text-zinc-500 text-sm">
            Scenario not found.
          </div>
        );
    }
  };

  // ════════════════════════════════════════════
  // PHASE 1: BRIEFING
  // ════════════════════════════════════════════
  if (phase === "BRIEFING") {
    return (
      <div className="max-w-4xl mx-auto font-mono space-y-6">
        {/* Back */}
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Cenários</span>
        </button>

        {/* Dossier Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          {/* Header */}
          <div className="border-b border-zinc-800 pb-5">
            <div className="flex items-center flex-wrap gap-2 text-xs mb-3">
              <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-xs font-medium">
                {operation.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  operation.difficulty === "Beginner"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                    : operation.difficulty === "Intermediate"
                    ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                    : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                }`}
              >
                {operation.difficulty}
              </span>
              <span className="text-cyan-400 font-mono text-xs bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/60">
                {operation.incidentCode}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {operation.title}
            </h1>
          </div>

          {/* Briefing content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <h2 className="text-xs uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  Contexto Operacional
                </h2>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {operation.whatHappened}
                </p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <h2 className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  Objetivo Principal
                </h2>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {operation.objective}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <h2 className="text-xs uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                  Risco Técnico & Impacto
                </h2>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {operation.technicalRisk}
                </p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <h2 className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  Ambiente Afetado
                </h2>
                <p className="text-zinc-300 text-xs leading-relaxed font-mono">
                  {operation.environment}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-5 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Janela de Ação: <strong className="text-white font-mono">{operation.timeLimit} segundos</strong></span>
            </div>
            <button
              onClick={handleStartMission}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              Iniciar Missão
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // PHASE 2: ACTIVE MISSION
  // ════════════════════════════════════════════
  if (phase === "ACTIVE") {
    return (
      <div className="font-mono space-y-3">
        {/* HUD Topbar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-md">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToMenu}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors shrink-0"
              title="Abortar missão"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {operation.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="text-zinc-500">{operation.opCode}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-cyan-400 font-semibold">{operation.incidentCode}</span>
                {errorsCount > 0 && (
                  <span className="text-amber-400 font-bold ml-2 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    {errorsCount} {errorsCount === 1 ? "falha" : "falhas"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: timer */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Tempo Restante</span>
              <div className={`text-xl font-bold tabular-nums ${timerColor}`}>
                {timerMinutes}:{timerSeconds}
              </div>
            </div>
            <button
              onClick={handleStartMission}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Objective */}
        <div className="text-xs text-zinc-300 px-1 truncate flex items-center gap-2">
          <span className="font-bold text-cyan-400 uppercase text-[11px]">Objetivo:</span>
          <span>{operation.objective}</span>
        </div>

        {/* Lab Workspace */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 min-h-[420px] shadow-lg">
          {renderLabComponent()}
        </div>

        {/* Consequence Modal */}
        {activeConsequence && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    {activeConsequence.title || "Ação Não Recomendada"}
                  </span>
                </div>
                <button
                  onClick={() => setActiveConsequence(null)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action taken */}
              <div className="text-xs space-y-1">
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
                  Ação Executada
                </span>
                <p className="text-zinc-200 font-medium">{activeConsequence.actionTaken}</p>
              </div>

              {/* Consequence */}
              <div className="text-xs space-y-1 p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-amber-400 text-[10px] uppercase tracking-wider font-bold">
                  Consequência Operacional
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {activeConsequence.consequence}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setActiveConsequence(null)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Compreendido — Continuar Operação
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // PHASE 3: DEBRIEF
  // ════════════════════════════════════════════
  const accuracyScore = isSuccess
    ? Math.max(40, 100 - errorsCount * 15)
    : 0;

  return (
    <div className="max-w-4xl mx-auto font-mono space-y-6">
      {/* Debrief Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        {/* Status */}
        <div className="border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3 mb-2">
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <XCircle className="w-7 h-7 text-red-400" />
            )}
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isSuccess ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isSuccess ? "Missão Cumprida com Sucesso" : "Missão Comprometida"}
              </h1>
              <p className="text-sm text-zinc-300 font-semibold">
                {operation.title}
              </p>
            </div>
          </div>
        </div>

        {/* Outcome */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 leading-relaxed">
          {isSuccess ? (
            <p>{operation.debrief.summary}</p>
          ) : (
            <div className="space-y-2">
              <p className="font-bold text-red-400">
                {operation.consequenceOnTimeout.title}
              </p>
              <p>{operation.consequenceOnTimeout.consequence}</p>
              <p className="text-zinc-400 text-xs font-mono">
                {operation.consequenceOnTimeout.compromiseDetail}
              </p>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3 text-center py-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5 font-semibold">
              Tempo
            </div>
            <div className="text-lg font-bold text-white">{elapsedTime}s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5 font-semibold">
              Precisão
            </div>
            <div
              className={`text-lg font-bold ${
                accuracyScore >= 80
                  ? "text-emerald-400"
                  : accuracyScore > 0
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {accuracyScore}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5 font-semibold">
              Erros
            </div>
            <div
              className={`text-lg font-bold ${
                errorsCount === 0 ? "text-zinc-300" : "text-amber-400"
              }`}
            >
              {errorsCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5 font-semibold">
              Consequências
            </div>
            <div
              className={`text-lg font-bold ${
                consequencesCount === 0 ? "text-zinc-300" : "text-red-400"
              }`}
            >
              {consequencesCount}
            </div>
          </div>
        </div>

        {/* Error breakdown */}
        {errorsCount > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Tipos de Falha:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(errorTypeCounts)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-amber-300 font-semibold"
                  >
                    {type}: {count}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Technical Debrief */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Análise Técnica de Pós-Incidente (Debrief)
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1">
              <h3 className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">
                Causa Raiz (Root Cause)
              </h3>
              <p className="text-zinc-300 leading-relaxed">
                {operation.debrief.rootCause}
              </p>
            </div>

            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                Procedimento Correto de Resposta
              </h3>
              <ol className="space-y-1 text-zinc-300">
                {operation.debrief.correctSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1">
              <h3 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                Lição Fundamental (Key Takeaway)
              </h3>
              <p className="text-zinc-300 leading-relaxed">
                {operation.debrief.keyTakeaways}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={handleStartMission}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </button>
          <button
            onClick={onBackToMenu}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Retornar aos Cenários
          </button>
        </div>
      </div>
    </div>
  );
}
