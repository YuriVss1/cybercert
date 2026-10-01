"use client";

import React, { useState } from 'react';
import { 
  Database, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface LogEvidence {
  id: string;
  source: 'FIREWALL' | 'WINDOWS_AUTH' | 'EDR_PROCESS' | 'DNS_SERVER';
  timestamp: string;
  rawLog: string;
  stageName: string;
  correctStep: number;
}

const LOG_EVIDENCES: LogEvidence[] = [
  {
    id: 'log-fw',
    source: 'FIREWALL',
    timestamp: '14:02:11 UTC',
    rawLog: 'SRC=198.51.100.25 DST=10.0.1.50 PROTO=TCP DPT=445 ACTION=ALLOW (54 tentativas em 15s)',
    stageName: '1. Reconhecimento / Tentativa de Acesso Inicial (Brute Force SMB)',
    correctStep: 1
  },
  {
    id: 'log-win',
    source: 'WINDOWS_AUTH',
    timestamp: '14:02:28 UTC',
    rawLog: 'EventID=4625 (Falha) x20 seguido por EventID=4624 (Logon com sucesso, Tipo 3 - Network, User=svc_backup)',
    stageName: '2. Comprometimento de Credenciais (Credential Access)',
    correctStep: 2
  },
  {
    id: 'log-edr',
    source: 'EDR_PROCESS',
    timestamp: '14:02:40 UTC',
    rawLog: 'Parent=spoolsv.exe (PID 1024) -> Child=powershell.exe -enc JABjAGwAaQBlAG4AdAA... (Download Cradle)',
    stageName: '3. Execução Anômala de Processo (Execution)',
    correctStep: 3
  },
  {
    id: 'log-dns',
    source: 'DNS_SERVER',
    timestamp: '14:02:55 UTC',
    rawLog: 'Client=10.0.1.50 Query="telemetry-update-sys.xyz" Type=A Response=203.0.113.88 (Beaconing)',
    stageName: '4. Comunicação com Comando e Controle (C2 Beaconing)',
    correctStep: 4
  }
];

export default function SiemCorrelationLab({
  concept,
  activeStage,
  stageMode,
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const mode: StageMode = stageMode || (
    activeStage === 'interact' ? 'guided' :
    activeStage === 'test' ? 'exam' : 'practice'
  );

  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const handleToggleLog = (logId: string) => {
    if (isFinalized) return;
    if (selectedOrder.includes(logId)) {
      setSelectedOrder(selectedOrder.filter(id => id !== logId));
    } else if (selectedOrder.length < 4) {
      setSelectedOrder([...selectedOrder, logId]);
    }
  };

  const handleReset = () => {
    setSelectedOrder([]);
    setFeedback(null);
    setShowHintRevealed(false);
    setIsFinalized(false);
  };

  const handleValidateCorrelation = () => {
    const isCorrect = 
      selectedOrder.length === 4 &&
      selectedOrder[0] === 'log-fw' &&
      selectedOrder[1] === 'log-win' &&
      selectedOrder[2] === 'log-edr' &&
      selectedOrder[3] === 'log-dns';

    onRecordAttempt({
      challengeId: 'siem-correlation-connect-1',
      challengeType: 'CONNECT',
      isCorrect,
      confidence,
      durationMs: 7500,
      submittedAnswer: { correlationOrder: selectedOrder },
      feedbackGiven: isCorrect 
        ? 'Cadeia de ataque (Kill Chain) correlacionada com sucesso no SIEM.' 
        : 'Ordem de correlação temporal ou causal divergente.'
    });

    if (isCorrect) {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setIsFinalized(true);
    }

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Excelente! Isoladamente, cada evento parecia um ruído ou falso positivo (um scan de firewall, um erro de login, uma consulta DNS). A correlação multi-fonte comprovou a cadeia completa: Brute Force -> Acesso de Credencial -> Execução de Script EDR -> Comunicação C2.'
        : (mode === 'exam'
          ? 'Avaliação de correlação registrada para análise.'
          : 'Cadeia causal inconsistente. Analise os carimbos de data/hora (timestamps) e a relação de causa e efeito (o atacante primeiro obtém acesso antes de executar o payload e conectar ao C2).')
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('siem-correlation-connect-1', 'CONNECT');
    }
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No SIEM, correlação multi-fonte une eventos isolados: 1) Firewall (inbound scan) -> 2) Auth Log (brute force bem sucedido) -> 3) EDR (execução de payload) -> 4) DNS (canal C2 de saída).'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Siga a linha do tempo (timestamps): 14:02:11 (Firewall) → 14:02:28 (Auth 4625/4624) → 14:02:40 (EDR PowerShell) → 14:02:55 (DNS C2).'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: A causalidade do ataque precede a exfiltração: Entrada na rede → Obtenção de Credencial → Execução local → Beaconing externo.'
    },
    exam: {
      label: 'Comprovação Autônoma (Testar)',
      color: 'text-amber-400',
      bg: 'bg-amber-950/60 border-amber-800',
      icon: ShieldAlert,
      hint: ''
    }
  }[mode];

  const ModeIcon = modeBadge.icon;
  const canRevealHint = mode === 'practice' && feedback && !feedback.isCorrect && !showHintRevealed;

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="cockpit-card rounded-xl p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className={`telemetry-chip font-bold ${modeBadge.color} border-current/30 bg-white/[0.02]`}>
              <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {concept.title}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-wide font-heading flex items-center gap-2.5">
          <Database className="w-5 h-5 text-cyan-400" />
          Correlação Multi-Fonte no SIEM (Attack Chain Correlation)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Logs isolados geram fadiga de alertas e pontos cegos. Relacione e encadeie os 4 eventos dispersos em Firewall, Windows Auth, EDR e Servidor DNS para reconstruir a narrativa de ataque.
        </p>

        {mode === 'guided' && (
          <div className="p-3 cockpit-subcard border-emerald-500/30 rounded-xl bg-emerald-950/15">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="p-3 cockpit-subcard border-cyan-500/30 rounded-xl bg-cyan-950/15 animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* Interface de Seleção e Encadeamento */}
      <section className="cockpit-card hud-bracket rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Trilha Cronológica de Ataque (Selecione 4 eventos na ordem correta)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="avionics-button px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Linha do Tempo
          </button>
        </div>

        {/* Linha do Tempo Montada */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          {[0, 1, 2, 3].map((slotIdx) => {
            const logId = selectedOrder[slotIdx];
            const evidence = LOG_EVIDENCES.find(e => e.id === logId);

            return (
              <div 
                key={slotIdx}
                className={`p-4 rounded-xl flex flex-col justify-between min-h-[120px] transition-all ${
                  evidence 
                    ? 'cockpit-subcard border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-950/10 text-white' 
                    : 'cockpit-subcard border-dashed border-white/[0.12] bg-white/[0.01] text-zinc-500'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest border-b border-white/[0.05] pb-1.5">
                  <span className="telemetry-chip text-[9px] border-white/10 text-zinc-300">Etapa #{slotIdx + 1}</span>
                  {evidence && (
                    <span className="telemetry-chip text-[9px] border-cyan-500/30 text-cyan-300 bg-cyan-950/20 font-bold">
                      {evidence.timestamp}
                    </span>
                  )}
                </div>

                {evidence ? (
                  <div className="my-2 space-y-1">
                    <span className="text-xs font-bold text-cyan-300 block font-mono tracking-wider">{evidence.source}</span>
                    <span className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed font-sans">{evidence.stageName}</span>
                  </div>
                ) : (
                  <span className="my-auto text-center text-xs font-mono text-zinc-500">
                    {mode === 'guided' ? `Aguardando Etapa ${slotIdx + 1}` : 'Vazio'}
                  </span>
                )}

                {evidence && !isFinalized && (
                  <button
                    type="button"
                    onClick={() => handleToggleLog(evidence.id)}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 underline self-start mt-1 font-bold"
                  >
                    Remover
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Repositório de Logs Isolados para Selecionar */}
        <div className="space-y-3 pt-3 border-t border-white/[0.08]">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
            Logs Brutos Recebidos pelo SIEM:
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {LOG_EVIDENCES.map((ev) => {
              const isSelected = selectedOrder.includes(ev.id);
              const orderIndex = selectedOrder.indexOf(ev.id) + 1;

              const sourceColorChip = 
                ev.source === 'FIREWALL' ? 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20' :
                ev.source === 'WINDOWS_AUTH' ? 'border-purple-500/30 text-purple-300 bg-purple-950/20' :
                ev.source === 'EDR_PROCESS' ? 'border-amber-500/30 text-amber-300 bg-amber-950/20' :
                'border-emerald-500/30 text-emerald-300 bg-emerald-950/20';

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleToggleLog(ev.id)}
                  disabled={isFinalized}
                  className={`p-3.5 rounded-xl border text-left font-mono text-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected 
                      ? 'cockpit-subcard border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.12)] bg-cyan-950/15 text-white' 
                      : 'avionics-button hover:border-white/[0.15] text-zinc-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`telemetry-chip font-bold text-[9px] ${sourceColorChip}`}>
                        FONTE: {ev.source}
                      </span>
                      <span className="telemetry-chip text-[9px] border-white/10 text-zinc-400 bg-white/[0.02]">
                        {ev.timestamp}
                      </span>
                    </div>
                    <code className="text-[11px] text-zinc-200 block font-mono bg-black/40 p-2 rounded border border-white/[0.05] leading-relaxed">
                      {ev.rawLog}
                    </code>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono font-bold text-xs tracking-wider">
                        #{orderIndex} Correlacionado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded cockpit-subcard border border-white/10 text-zinc-400 text-xs font-mono hover:text-white">
                        + Correlacionar
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                confidence === 'CONFIDENT' ? 'avionics-primary text-white font-bold' : 'avionics-button text-zinc-400'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                confidence === 'HESITANT' ? 'avionics-button border-amber-500/50 text-amber-300 bg-amber-950/30' : 'avionics-button text-zinc-400'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {canRevealHint && (
              <button
                type="button"
                onClick={() => setShowHintRevealed(true)}
                className="avionics-button px-3 py-2 border-amber-500/40 text-amber-300 bg-amber-950/20 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
              </button>
            )}

            <button
              type="button"
              onClick={handleDontKnow}
              className="avionics-button px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={selectedOrder.length !== 4 || isFinalized}
              onClick={handleValidateCorrelation}
              className="avionics-primary px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              Validar Correlação SIEM <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {feedback && (
        <section className={`cockpit-card rounded-xl p-5 border space-y-3 font-mono text-xs ${
          feedback.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white font-heading">
              {feedback.isCorrect ? 'Cadeia de Ataque Descoberta com Sucesso' : (mode === 'exam' ? 'Avaliação Registrada' : 'Falha na Correlação Multi-Fonte')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed text-xs md:text-sm">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="p-3 cockpit-subcard border-white/10 rounded-lg text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans leading-relaxed">
                Em operações de SOC e SIEM, a correlação temporal e causal reconstitui a Cyber Kill Chain: o ataque iniciou com varredura externa de portas (Firewall), logons repetidos (EventID 4625/4624), execução do processo malicioso via EDR e finalmente tráfego de comando e controle (DNS C2).
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
