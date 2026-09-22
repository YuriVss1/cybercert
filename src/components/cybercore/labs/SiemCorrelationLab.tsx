"use client";

import React, { useState } from 'react';
import { 
  Database, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, Link2
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  // Slots de correlação cronológica
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const handleToggleLog = (logId: string) => {
    if (selectedOrder.includes(logId)) {
      setSelectedOrder(selectedOrder.filter(id => id !== logId));
    } else if (selectedOrder.length < 4) {
      setSelectedOrder([...selectedOrder, logId]);
    }
  };

  const handleReset = () => {
    setSelectedOrder([]);
    setFeedback(null);
  };

  const handleValidateCorrelation = () => {
    // Ordem esperada: log-fw -> log-win -> log-edr -> log-dns
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

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Excelente! Isoladamente, cada evento parecia um ruído ou falso positivo (um scan de firewall, um erro de login, uma consulta DNS). A correlação multi-fonte comprovou a cadeia completa: Brute Force -> Acesso de Credencial -> Execução de Script EDR -> Comunicação C2.'
        : 'Cadeia causal inconsistente. Analise os carimbos de data/hora (timestamps) e a relação de causa e efeito (o atacante primeiro obtém acesso antes de executar o payload e conectar ao C2).'
    });

    if (isCorrect) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow('siem-correlation-connect-1', 'CONNECT');
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No SIEM, correlação multi-fonte une eventos isolados: 1) Firewall (inbound scan) -> 2) Auth Log (brute force bem sucedido) -> 3) EDR (execução de payload) -> 4) DNS (canal C2 de saída).'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-blue-950/80 text-blue-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-blue-800/60">
            Laboratório Interativo • CONNECT
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
      </section>

      {/* Interface de Seleção e Encadeamento */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Clique nos logs abaixo na ordem da cadeia de ataque (1º ao 4º)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Seleção
          </button>
        </div>

        {/* Linha da Cadeia Selecionada */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((step) => {
            const logId = selectedOrder[step - 1];
            const log = LOG_EVIDENCES.find(l => l.id === logId);

            return (
              <div 
                key={step}
                className={`p-4 rounded-xl border font-mono text-xs space-y-2 transition-all min-h-[110px] flex flex-col justify-between ${
                  log 
                    ? 'bg-blue-950/40 border-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'bg-zinc-900/40 border-dashed border-zinc-800 text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">
                    Etapa #{step} da Kill Chain
                  </span>
                  {log && <Link2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                {log ? (
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold block w-fit mb-1">
                      {log.source}
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans line-clamp-2">
                      {log.stageName}
                    </p>
                  </div>
                ) : (
                  <span className="text-zinc-600 text-[11px] my-auto">
                    Aguardando seleção...
                  </span>
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
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={selectedOrder.length !== 4}
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
              {feedback.isCorrect ? 'Cadeia de Ataque Descoberta com Sucesso' : 'Falha na Correlação Multi-Fonte'}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>
        </section>
      )}
    </div>
  );
}
