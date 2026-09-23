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
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-bold border flex items-center gap-1.5 ${modeBadge.bg} ${modeBadge.color}`}>
            <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Correlação Multi-Fonte no SIEM (Attack Chain Correlation)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Logs isolados geram fadiga de alertas e pontos cegos. Relacione e encadeie os 4 eventos dispersos em Firewall, Windows Auth, EDR e Servidor DNS para reconstruir a narrativa de ataque.
        </p>

        {mode === 'guided' && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* Interface de Seleção e Encadeamento */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Trilha Cronológica de Ataque (Selecione 4 eventos na ordem correta)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Linha do Tempo
          </button>
        </div>

        {/* Linha do Tempo Montada */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((slotIdx) => {
            const logId = selectedOrder[slotIdx];
            const evidence = LOG_EVIDENCES.find(e => e.id === logId);

            return (
              <div 
                key={slotIdx}
                className={`p-4 rounded-xl border border-dashed flex flex-col justify-between min-h-[110px] ${
                  evidence 
                    ? 'bg-zinc-900 border-blue-500 text-white' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase">
                  <span>Etapa #{slotIdx + 1}</span>
                  {evidence && <span className="text-cyan-400 font-bold">{evidence.timestamp}</span>}
                </div>

                {evidence ? (
                  <div className="my-1.5 space-y-1">
                    <span className="text-xs font-bold text-blue-300 block font-mono">{evidence.source}</span>
                    <span className="text-[11px] text-zinc-300 line-clamp-2">{evidence.stageName}</span>
                  </div>
                ) : (
                  <span className="my-auto text-center text-xs font-mono">
                    {mode === 'guided' ? `Aguardando Etapa ${slotIdx + 1}` : 'Vazio'}
                  </span>
                )}

                {evidence && !isFinalized && (
                  <button
                    type="button"
                    onClick={() => handleToggleLog(evidence.id)}
                    className="text-[10px] font-mono text-red-400 hover:underline self-start"
                  >
                    Remover
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Repositório de Logs Isolados para Selecionar */}
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
            Logs Brutos Recebidos pelo SIEM:
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {LOG_EVIDENCES.map((ev) => {
              const isSelected = selectedOrder.includes(ev.id);
              const orderIndex = selectedOrder.indexOf(ev.id) + 1;

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleToggleLog(ev.id)}
                  disabled={isFinalized}
                  className={`p-3.5 rounded-xl border text-left font-mono text-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-zinc-900 border-blue-500 text-white' 
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-cyan-400">
                        FONTE: {ev.source}
                      </span>
                      <span className="text-zinc-500 text-[10px]">{ev.timestamp}</span>
                    </div>
                    <code className="text-[11px] text-amber-300 block font-mono">
                      {ev.rawLog}
                    </code>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-xs">
                        #{orderIndex} Selecionado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
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
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'CONFIDENT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' : 'text-zinc-500'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'HESITANT' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'text-zinc-500'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex items-center gap-3">
            {canRevealHint && (
              <button
                type="button"
                onClick={() => setShowHintRevealed(true)}
                className="px-3 py-2 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
              </button>
            )}

            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={selectedOrder.length !== 4 || isFinalized}
              onClick={handleValidateCorrelation}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              Validar Correlação SIEM <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {feedback && (
        <section className={`p-6 rounded-xl border space-y-3 font-mono text-xs ${
          feedback.isCorrect 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {feedback.isCorrect ? 'Cadeia de Ataque Descoberta com Sucesso' : (mode === 'exam' ? 'Avaliação Registrada' : 'Falha na Correlação Multi-Fonte')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                Em operações de SOC e SIEM, a correlação temporal e causal reconstitui a Cyber Kill Chain: o ataque iniciou com varredura externa de portas (Firewall), logons repetidos (EventID 4625/4624), execução do processo malicioso via EDR e finalmente tráfego de comando e controle (DNS C2).
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
