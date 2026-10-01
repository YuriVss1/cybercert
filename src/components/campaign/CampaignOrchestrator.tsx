"use client";

import React, { useEffect, useState } from "react";
import { CampaignDefinition, CampaignStepResult } from "@/types/campaign";
import { useCampaignStore } from "@/stores/campaignStore";
import CyberCoreCampaignAdapter from "./CyberCoreCampaignAdapter";
import PbqCampaignAdapter from "./PbqCampaignAdapter";
import { 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  Activity, 
  Layers, 
  Crosshair, 
  ShieldCheck, 
  FileText, 
  Database,
  ArrowRight,
  AlertTriangle,
  Flame,
  Radio
} from "lucide-react";

interface CampaignOrchestratorProps {
  campaign: CampaignDefinition;
}

export default function CampaignOrchestrator({ campaign }: CampaignOrchestratorProps) {
  const {
    activeCampaignId,
    currentStepIndex,
    stepResults,
    collectedIocs,
    campaignStatus,
    startCampaign,
    recordStepResult,
    advanceToNextStep,
    completeCampaign,
    resetCampaign
  } = useCampaignStore();

  const [hasMounted, setHasMounted] = useState(false);

  // Rehydration synchronization
  useEffect(() => {
    setHasMounted(true);
    if (!activeCampaignId || activeCampaignId !== campaign.id || campaignStatus === 'not_started') {
      // If another campaign is active in progress, let user confirm explicitly
      if (activeCampaignId && activeCampaignId !== campaign.id && campaignStatus === 'in_progress') {
        return;
      }
      startCampaign(campaign);
    }
  }, [campaign, activeCampaignId, campaignStatus, startCampaign]);

  if (!hasMounted) {
    return (
      <div className="min-h-[500px] flex items-center justify-center font-mono text-zinc-500 text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2 text-cyan-500" />
        INICIALIZANDO CONSOLE TÁTICO DE CAMPANHA...
      </div>
    );
  }

  // Conflict Guard: If a different campaign is currently in progress
  if (activeCampaignId && activeCampaignId !== campaign.id && campaignStatus === 'in_progress') {
    return (
      <div className="cockpit-card p-8 rounded-2xl max-w-xl mx-auto text-center space-y-4 border border-amber-500/40 bg-zinc-950/90 my-12">
        <div className="p-3 w-fit mx-auto rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Sessão Ativa em Outra Operação</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Você possui uma operação em andamento com ID: <span className="font-mono text-amber-400 font-bold">{activeCampaignId}</span>.
            Para alternar para <strong className="text-white">{campaign.title}</strong>, confirme a reinicialização da sessão.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => {
              resetCampaign();
              startCampaign(campaign);
            }}
            className="avionics-primary px-5 py-2.5 text-xs font-mono font-bold text-white rounded-lg flex items-center gap-2"
          >
            <span>Iniciar {campaign.codename}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentStep = campaign.steps[currentStepIndex] || campaign.steps[0];
  const currentResult: CampaignStepResult | undefined = stepResults[currentStep?.id];
  const isCurrentStepAccomplished = Boolean(currentResult?.completed && currentResult?.correct);
  const isLastStep = currentStepIndex >= campaign.steps.length - 1;
  const isOperationCompleted = campaignStatus === 'completed';

  const handleStepResultCommit = (result: CampaignStepResult, evidenceReward?: string) => {
    recordStepResult(result.stepId, result, evidenceReward);
  };

  const handleAdvance = () => {
    advanceToNextStep(campaign);
  };

  const handleReset = () => {
    if (window.confirm("Reiniciar a operação tática de campanha? O progresso dos vetores será reiniciado.")) {
      resetCampaign();
      startCampaign(campaign);
    }
  };

  const timelineColsClass = campaign.steps.length === 5 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' 
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-zinc-200">
      {/* -------------------------------------------------------------------- */}
      {/* 1. MISSION COCKPIT HEADER                                            */}
      {/* -------------------------------------------------------------------- */}
      <header className="cockpit-card rounded-2xl p-6 border border-zinc-800 bg-zinc-950/90 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="telemetry-chip bg-cyan-950/50 text-cyan-400 border-cyan-800/60 font-mono text-[10px] font-bold tracking-widest uppercase">
                INCIDENT CAMPAIGN
              </span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="font-mono text-xs text-zinc-400 tracking-wider">
                {campaign.codename}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {campaign.title}
            </h1>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              {campaign.summary}
            </p>
          </div>

          {/* Operational Status Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                ESTADO DA OPERAÇÃO
              </div>
              <div className="font-mono text-sm font-bold flex items-center gap-1.5 justify-end">
                {isOperationCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> CONCLUÍDA
                  </span>
                ) : (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Activity className="w-4 h-4 animate-pulse" /> EM PROGRESSO
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleReset}
              title="Reiniciar campanha"
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tactical Vectors Chain Meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-zinc-500 uppercase">Cadeia de Ataque:</span>
            <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
              {campaign.targetVector}
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-zinc-500 uppercase">Progresso:</span>
            <span className="text-zinc-200 font-bold">
              ETAPA {String(currentStepIndex + 1).padStart(2, '0')} / {String(campaign.steps.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. ATTACK CHAIN TIMELINE                                             */}
      {/* -------------------------------------------------------------------- */}
      <section className={`grid ${timelineColsClass} gap-3`}>
        {campaign.steps.map((step, idx) => {
          const res = stepResults[step.id];
          const isDone = Boolean(res?.completed && res?.correct);
          const isActive = idx === currentStepIndex && !isOperationCompleted;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/15'
                  : isActive
                  ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                  : 'border-zinc-800/70 bg-zinc-900/30 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className={`font-bold ${isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    VETOR 0{idx + 1}
                  </span>
                  {isDone ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> RESOLVIDO
                    </span>
                  ) : isActive ? (
                    <span className="text-cyan-400 flex items-center gap-1 font-bold">
                      <Crosshair className="w-3 h-3 animate-spin" /> ATIVO
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono">PENDENTE</span>
                  )}
                </div>

                {step.tacticalPhase && (
                  <div className="mb-1.5">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      isActive 
                        ? 'border-cyan-700/60 bg-cyan-950/50 text-cyan-300' 
                        : isDone 
                        ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-300' 
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                    }`}>
                      {step.tacticalPhase}
                    </span>
                  </div>
                )}

                <h3 className="text-xs font-semibold text-zinc-100 line-clamp-1">
                  {step.title}
                </h3>
              </div>

              <div className="mt-2 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                <span>{step.family.toUpperCase()}</span>
                <span className="truncate max-w-[80px]">{step.labId}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 3. INCIDENT CONTEXT ENVELOPE + CONTINUITY + IOC TRACKER              */}
      {/* -------------------------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Context Briefing Envelope (2 cols) */}
        <div className="lg:col-span-2 cockpit-card p-5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Envelope Operacional — {currentStep.title}
              </h2>
            </div>
            {currentStep.tacticalPhase && (
              <span className="telemetry-chip text-[10px] font-mono text-cyan-300 border-cyan-800/60 bg-cyan-950/40 uppercase">
                FASE: {currentStep.tacticalPhase}
              </span>
            )}
          </div>

          {/* Continuous Narrative Link (Previous Context) */}
          {currentStep.previousContext && (
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-cyan-800/30 text-xs">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Contexto Herdado da Investigação Anterior:</span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans">{currentStep.previousContext}</p>
            </div>
          )}

          <div className="space-y-2 text-xs leading-relaxed text-zinc-300">
            <p className="text-zinc-300 font-normal">
              {currentStep.briefing}
            </p>
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block uppercase mb-0.5">Objetivo Tático:</span>
                <span className="text-cyan-300 font-medium">{currentStep.objective}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block uppercase mb-0.5">Condição de Sucesso:</span>
                <span className="text-emerald-300 font-medium">{currentStep.successCondition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Collected IOCs / Evidence Box (1 col) */}
        <div className="cockpit-card p-5 rounded-xl border border-zinc-800 bg-zinc-950/70 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  Evidências / IoCs Coletados
                </h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                {collectedIocs.length} / {campaign.steps.length}
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
              {collectedIocs.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-xs font-mono">
                  Nenhum indicador técnico consolidado nesta sessão.
                </div>
              ) : (
                collectedIocs.map((ioc, idx) => (
                  <div 
                    key={idx} 
                    className="p-2.5 rounded bg-amber-950/20 border border-amber-800/40 text-[11px] font-mono text-amber-300/90 leading-tight"
                  >
                    <div className="text-[9px] text-amber-500 font-bold uppercase mb-0.5">
                      VETOR 0{idx + 1} CONFIRMADO
                    </div>
                    {ioc}
                  </div>
                ))
              )}
            </div>
          </div>

          {currentStep.technicalIoc && (
            <div className="pt-2 text-[10px] font-mono text-zinc-400 border-t border-white/[0.04]">
              <span className="text-zinc-500 block uppercase mb-0.5">Indicador Alvo Atual:</span>
              <span className="text-cyan-300/90">{currentStep.technicalIoc}</span>
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 4. ACTIVE LAB WORKBENCH (ADAPTER HOST)                               */}
      {/* -------------------------------------------------------------------- */}
      <main className="cockpit-panel p-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/90 shadow-2xl relative">
        {!isOperationCompleted ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs font-mono">
              <span className="text-zinc-400">
                CONSOLE OPERACIONAL: <span className="text-zinc-200 font-bold">{currentStep.labId}</span>
              </span>
              <span className="text-zinc-500 uppercase">
                FAMÍLIA: {currentStep.family}
              </span>
            </div>

            {currentStep.family === 'cybercore' ? (
              <CyberCoreCampaignAdapter
                key={currentStep.id}
                step={currentStep}
                savedResult={currentResult}
                onStepResult={handleStepResultCommit}
              />
            ) : (
              <PbqCampaignAdapter
                key={currentStep.id}
                step={currentStep}
                savedResult={currentResult}
                onStepResult={handleStepResultCommit}
              />
            )}
          </div>
        ) : (
          /* DEBRIEF DE CAMPANHA CONCLUÍDA */
          <div className="py-10 px-6 text-center space-y-6 max-w-3xl mx-auto animate-in fade-in">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-950/40">
              <ShieldCheck className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="telemetry-chip bg-emerald-950/60 text-emerald-300 border-emerald-700 font-mono text-xs font-bold uppercase tracking-wider">
                OPERAÇÃO TÁTICA NEUTRALIZADA COM SUCESSO
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Cadeia de Ataque {campaign.codename} Interrompida
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                Todos os {campaign.steps.length} vetores de intrusão foram identificados, isolados e remediados com sucesso operacional, progredindo do vetor de acesso inicial até a governança de resposta ao incidente.
              </p>
            </div>

            {/* Cadeia de Resolução Completa */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-left space-y-3 font-mono text-xs">
              <div className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider pb-2 border-b border-white/[0.06]">
                Cadeia de Incidentes Resolvida:
              </div>
              <div className="space-y-2">
                {campaign.steps.map((st, i) => (
                  <div key={st.id} className="p-3 rounded-lg bg-zinc-950/70 border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-zinc-200 font-bold block">{st.title}</span>
                        {st.technicalIoc && (
                          <span className="text-[10px] text-zinc-500">{st.technicalIoc}</span>
                        )}
                      </div>
                    </div>
                    {st.tacticalPhase && (
                      <span className="telemetry-chip bg-emerald-950/60 text-emerald-400 border-emerald-800/60 text-[9px] font-bold shrink-0 self-start sm:self-center">
                        {st.tacticalPhase}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="avionics-button px-5 py-2.5 text-xs text-zinc-300 hover:text-white flex items-center gap-2 font-mono"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Simulação da Campanha
              </button>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 5. ACTION / TRANSITION DOCK                                          */}
      {/* -------------------------------------------------------------------- */}
      {!isOperationCompleted && (
        <footer className="cockpit-card p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Status da Etapa Atual:</span>
            {isCurrentStepAccomplished ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> VETOR RESOLVIDO
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Activity className="w-4 h-4" /> AGUARDANDO RESOLUÇÃO OPERACIONAL
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isCurrentStepAccomplished && (
              <button
                onClick={handleAdvance}
                className="avionics-primary px-6 py-2.5 text-xs font-mono font-bold text-white rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02]"
              >
                {isLastStep ? (
                  <>
                    <span>FINALIZAR OPERAÇÃO DE INCIDENTE</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>AVANÇAR PARA O PRÓXIMO VETOR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
