"use client";

import React, { useState } from "react";
import { CampaignStep, CampaignStepResult } from "@/types/campaign";
import { PbqActionResult } from "@/lib/pbqData";
import CloudS3Lab from "@/components/pbq/labs/CloudS3Lab";
import FirewallAclLab from "@/components/pbq/labs/FirewallAclLab";
import SiemLogLab from "@/components/pbq/labs/SiemLogLab";
import EdrProcessLab from "@/components/pbq/labs/EdrProcessLab";
import PhishingHeaderLab from "@/components/pbq/labs/PhishingHeaderLab";
import DataExfilLab from "@/components/pbq/labs/DataExfilLab";
import RansomwareContainmentLab from "@/components/pbq/labs/RansomwareContainmentLab";
import { ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";

interface PbqCampaignAdapterProps {
  step: CampaignStep;
  isLocked?: boolean;
  savedResult?: CampaignStepResult;
  onStepResult: (result: CampaignStepResult, evidenceReward?: string) => void;
}

export default function PbqCampaignAdapter({
  step,
  isLocked = false,
  savedResult,
  onStepResult
}: PbqCampaignAdapterProps) {
  const [lastActionResult, setLastActionResult] = useState<PbqActionResult | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  const handleActionSubmit = (result: PbqActionResult) => {
    setLastActionResult(result);

    const stepResult: CampaignStepResult = {
      stepId: step.id,
      completed: true,
      correct: result.correct,
      actionId: result.actionId,
      errorType: result.errorType,
      evidence: result.consequence?.consequence,
      completedAt: new Date().toISOString()
    };

    onStepResult(stepResult, result.correct ? step.evidenceReward : undefined);
  };

  const handleRetry = () => {
    setLastActionResult(null);
    setRetryKey(prev => prev + 1);
  };

  const renderPbqLab = () => {
    const labProps = {
      onActionSubmit: handleActionSubmit,
      isLocked: isLocked || Boolean(savedResult?.correct)
    };

    switch (step.labId) {
      case 'cloud-s3':
        return <CloudS3Lab key={retryKey} {...labProps} />;
      case 'firewall-acl':
        return <FirewallAclLab key={retryKey} {...labProps} />;
      case 'siem-log':
        return <SiemLogLab key={retryKey} {...labProps} />;
      case 'edr-process':
        return <EdrProcessLab key={retryKey} {...labProps} />;
      case 'phishing-header':
        return <PhishingHeaderLab key={retryKey} {...labProps} />;
      case 'data-exfil':
        return <DataExfilLab key={retryKey} {...labProps} />;
      case 'ransomware-containment':
        return <RansomwareContainmentLab key={retryKey} {...labProps} />;
      default:
        return (
          <div className="cockpit-card p-6 text-center text-zinc-400">
            Laboratório PBQ não registrado para o identificador: {step.labId}
          </div>
        );
    }
  };

  const isStepAccomplished = savedResult?.correct;

  return (
    <div className="space-y-4">
      {/* PBQ Lab Mount Slot */}
      <div className="relative">
        {renderPbqLab()}
      </div>

      {/* Operational Feedback Banner (if result submitted) */}
      {lastActionResult && !lastActionResult.correct && (
        <div className="cockpit-card border-rose-500/40 bg-rose-950/20 p-4 rounded-xl flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                {lastActionResult.consequence?.title || "FALHA NA CONTENÇÃO TÁTICA"}
              </h4>
              <p className="text-xs text-zinc-300">
                {lastActionResult.consequence?.consequence || "A configuração aplicada não neutralizou a exposição da infraestrutura."}
              </p>
              {lastActionResult.consequence?.actionTaken && (
                <p className="text-[11px] font-mono text-zinc-400">
                  Ação registrada: {lastActionResult.consequence.actionTaken}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="avionics-button px-3 py-1.5 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reconfigurar
          </button>
        </div>
      )}

      {isStepAccomplished && (
        <div className="cockpit-card border-emerald-500/40 bg-emerald-950/20 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="telemetry-chip bg-emerald-950/60 text-emerald-300 border-emerald-800/80 text-[10px] font-bold uppercase">
                  VETOR CONTIDO
                </span>
                <span className="text-xs font-mono text-zinc-300 font-bold">Hardening Validado com Sucesso</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Controles de proteção ativos. O bucket foi restringido e a exfiltração prevenida.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>Objetivo Alcançado</span>
          </div>
        </div>
      )}
    </div>
  );
}
