"use client";

import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, Activity
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

export interface HandshakeStep {
  stepIndex: number;
  sender: 'CLIENT' | 'SERVER';
  receiver: 'SERVER' | 'CLIENT';
  flag: string;
  seqNumberExplanation: string;
  clientStateAfter: string;
  serverStateAfter: string;
}

export const CORRECT_HANDSHAKE_STEPS: HandshakeStep[] = [
  {
    stepIndex: 1,
    sender: 'CLIENT',
    receiver: 'SERVER',
    flag: 'SYN',
    seqNumberExplanation: 'Seq = ISN_c (ex: 1000). Solicita sincronização de números de sequência.',
    clientStateAfter: 'SYN-SENT',
    serverStateAfter: 'SYN-RECEIVED'
  },
  {
    stepIndex: 2,
    sender: 'SERVER',
    receiver: 'CLIENT',
    flag: 'SYN-ACK',
    seqNumberExplanation: 'Seq = ISN_s (ex: 5000), Ack = 1001 (ISN_c + 1). Servidor aceita e sincroniza.',
    clientStateAfter: 'ESTABLISHED',
    serverStateAfter: 'SYN-RECEIVED'
  },
  {
    stepIndex: 3,
    sender: 'CLIENT',
    receiver: 'SERVER',
    flag: 'ACK',
    seqNumberExplanation: 'Seq = 1001, Ack = 5001 (ISN_s + 1). Cliente confirma. Sessão ativa.',
    clientStateAfter: 'ESTABLISHED',
    serverStateAfter: 'ESTABLISHED'
  }
];

const AVAILABLE_PACKET_OPTIONS = [
  { id: 'pkt-syn', flag: 'SYN', desc: 'Sincronizar (Início de conexão)', sender: 'CLIENT', receiver: 'SERVER' },
  { id: 'pkt-synack', flag: 'SYN-ACK', desc: 'Sincronizar + Confirmar', sender: 'SERVER', receiver: 'CLIENT' },
  { id: 'pkt-ack', flag: 'ACK', desc: 'Confirmar recebimento', sender: 'CLIENT', receiver: 'SERVER' },
  { id: 'pkt-fin', flag: 'FIN', desc: 'Finalizar conexão (Distrator)', sender: 'CLIENT', receiver: 'SERVER' },
  { id: 'pkt-rst', flag: 'RST', desc: 'Resetar conexão (Distrator)', sender: 'SERVER', receiver: 'CLIENT' },
];

export default function TcpHandshakeLab({
  concept,
  activeStage,
  userId = 'local-user',
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [selectedPackets, setSelectedPackets] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pedagogical_error' | 'did_not_know' | null;
    message: string;
    consequenceText?: string;
  }>({ type: null, message: '' });

  // Nível 3: Quiz de números de sequência
  const [seqAnswer, setSeqAnswer] = useState('');

  // Manipulação de inserção de pacotes
  const handleSelectPacket = (flag: string) => {
    if (selectedPackets.length < 3 && !selectedPackets.includes(flag)) {
      setSelectedPackets([...selectedPackets, flag]);
    }
  };

  const handleRemovePacket = (index: number) => {
    const updated = [...selectedPackets];
    updated.splice(index, 1);
    setSelectedPackets(updated);
  };

  const handleReset = () => {
    setSelectedPackets([]);
    setFeedback({ type: null, message: '' });
  };

  const handleValidateSequence = () => {
    if (selectedPackets.length !== 3) {
      setFeedback({
        type: 'pedagogical_error',
        message: 'O Handshake TCP completo exige exatamente 3 etapas de mensagens entre Cliente e Servidor.'
      });
      return;
    }

    const isCorrect = 
      selectedPackets[0] === 'SYN' &&
      selectedPackets[1] === 'SYN-ACK' &&
      selectedPackets[2] === 'ACK';

    onRecordAttempt({
      challengeId: `tcp-handshake-lvl-${currentLevel}`,
      challengeType: 'SORT',
      isCorrect,
      confidence,
      durationMs: 6000,
      submittedAnswer: { sequence: selectedPackets },
      feedbackGiven: isCorrect ? 'Sequência de 3 vias montada com sucesso.' : 'Ordem de pacotes incorreta.'
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: 'Perfeito! 1º: Cliente envia SYN. 2º: Servidor responde SYN-ACK. 3º: Cliente envia ACK. A conexão atinge o estado ESTABLISHED em ambos os lados.'
      });
      onCompleteStage(activeStage);
    } else {
      let consequence = 'Consequência conceitual: Sem o pacote SYN inicial, o servidor não abre socket de escuta. Se o cliente enviar ACK primeiro, o servidor rejeita com pacote RST (Reset).';
      if (selectedPackets[0] !== 'SYN') {
        consequence = 'Consequência: A sessão não pode iniciar sem a flag SYN (Synchronize). Nenhum número de sequência foi compartilhado.';
      } else if (selectedPackets[1] !== 'SYN-ACK') {
        consequence = 'Consequência: O servidor precisa reconhecer o SYN do cliente e sincronizar o seu próprio número de sequência com SYN-ACK.';
      }

      setFeedback({
        type: 'pedagogical_error',
        message: 'Sequência inválida de flags TCP. Observe a direção e a finalidade de cada troca:',
        consequenceText: consequence
      });
    }
  };

  const handleValidateLevel3 = (e: React.FormEvent) => {
    e.preventDefault();
    // Pergunta: Se o cliente envia SYN com Seq=1000, qual é o valor do campo ACK enviado pelo servidor no SYN-ACK? -> 1001
    const isCorrect = seqAnswer.trim() === '1001';

    onRecordAttempt({
      challengeId: 'tcp-handshake-lvl-3',
      challengeType: 'CALCULATE',
      isCorrect,
      confidence,
      durationMs: 5000,
      submittedAnswer: { seqAnswer },
      feedbackGiven: isCorrect ? 'Cálculo de Acknowledgment correto (ISN + 1).' : 'Número de Ack incorreto.'
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: 'Exato! O campo Acknowledgment (ACK) do servidor indica o próximo byte esperado: ISN_c + 1 = 1000 + 1 = 1001.'
      });
      onCompleteStage('test');
    } else {
      setFeedback({
        type: 'pedagogical_error',
        message: 'Pista pedagógica: O campo Acknowledgment do receptor sempre informa "recebi seu byte X, agora aguardo o byte X + 1".',
        consequenceText: 'Se o cliente enviou Seq=1000, quanto é 1000 + 1?'
      });
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow(`tcp-handshake-lvl-${currentLevel}`, 'SORT');
    setFeedback({
      type: 'did_not_know',
      message: 'Marcado como "Não sei". O conceito de Handshake de 3 vias foi adicionado com prioridade máxima à sua Fila de Revisão. Regra de ouro: SYN (Cliente) -> SYN-ACK (Servidor) -> ACK (Cliente).'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      
      {/* -------------------------------------------------------------------- */}
      {/* CABEÇALHO DO LABORATÓRIO                                             */}
      {/* -------------------------------------------------------------------- */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
              <Activity className="w-4 h-4" /> Laboratório Interativo de Protocolo TCP
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Montador de Sessão: TCP 3-Way Handshake
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Construa a sequência correta de pacotes, observe os estados dos sockets e entenda o sincronismo de números de sequência.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setCurrentLevel(1); handleReset(); }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                currentLevel === 1 ? 'bg-cyan-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              1. Sequência
            </button>
            <button
              type="button"
              onClick={() => { setCurrentLevel(2); handleReset(); }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                currentLevel === 2 ? 'bg-cyan-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              2. Estados Socket
            </button>
            <button
              type="button"
              onClick={() => { setCurrentLevel(3); handleReset(); }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                currentLevel === 3 ? 'bg-cyan-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              3. Números Seq/Ack
            </button>
          </div>
        </div>

        {/* Visualização de Comunicação Cliente <-> Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-zinc-800 pb-2">
              <span>ENDPOINT: CLIENTE (Browser / Host)</span>
              <span className="text-[10px] text-zinc-500">IP: 192.168.1.50</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Estado atual do Socket: <strong className="text-white">
                {selectedPackets.length === 0 && 'CLOSED'}
                {selectedPackets.length === 1 && 'SYN-SENT'}
                {selectedPackets.length >= 2 && 'ESTABLISHED'}
              </strong>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-purple-400 font-bold border-b border-zinc-800 pb-2">
              <span>ENDPOINT: SERVIDOR (Web / API)</span>
              <span className="text-[10px] text-zinc-500">Porta: 443 (HTTPS)</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Estado atual do Socket: <strong className="text-white">
                {selectedPackets.length === 0 && 'LISTEN'}
                {selectedPackets.length === 1 && 'SYN-RECEIVED'}
                {selectedPackets.length === 2 && 'SYN-RECEIVED'}
                {selectedPackets.length >= 3 && 'ESTABLISHED'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO INTERATIVA: MONTADOR DA SEQUÊNCIA (NÍVEIS 1 E 2)              */}
      {/* -------------------------------------------------------------------- */}
      {currentLevel !== 3 ? (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Área de Montagem da Troca de 3 Vias
            </span>
            <p className="text-xs text-zinc-400">
              Clique nos pacotes disponíveis abaixo para posicioná-los na ordem correta de transmissão:
            </p>
          </div>

          {/* Slots de Sequência (3 Slots) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((slotNumber) => {
              const selectedFlag = selectedPackets[slotNumber - 1];
              return (
                <div
                  key={slotNumber}
                  className={`p-4 rounded-xl border text-center transition-all min-h-[120px] flex flex-col justify-between ${
                    selectedFlag
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-zinc-900/40 border-zinc-800 border-dashed'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase">
                    <span>Etapa #{slotNumber}</span>
                    {slotNumber === 1 && <span>Cliente → Servidor</span>}
                    {slotNumber === 2 && <span>Servidor → Cliente</span>}
                    {slotNumber === 3 && <span>Cliente → Servidor</span>}
                  </div>

                  {selectedFlag ? (
                    <div className="py-2 space-y-1">
                      <span className="font-mono text-lg font-black text-white px-3 py-1 rounded bg-zinc-900 border border-cyan-500/60 inline-block">
                        [{selectedFlag}]
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePacket(slotNumber - 1)}
                        className="text-[10px] font-mono text-zinc-500 hover:text-red-400 block mx-auto underline mt-1"
                      >
                        remover
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-zinc-600 my-auto">
                      Vazio (Selecione o pacote abaixo)
                    </span>
                  )}

                  <div className="text-[10px] font-mono text-zinc-500">
                    {slotNumber === 1 && 'Sincronizar'}
                    {slotNumber === 2 && 'Sincronizar + Reconhecer'}
                    {slotNumber === 3 && 'Confirmar e Estabelecer'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banco de Pacotes Disponíveis para Selecionar */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block">
              Pacotes e Flags Disponíveis:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {AVAILABLE_PACKET_OPTIONS.map((pkt) => {
                const isUsed = selectedPackets.includes(pkt.flag);
                return (
                  <button
                    key={pkt.id}
                    type="button"
                    disabled={isUsed || selectedPackets.length >= 3}
                    onClick={() => handleSelectPacket(pkt.flag)}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isUsed 
                        ? 'opacity-30 border-zinc-800 bg-zinc-950 cursor-not-allowed' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-cyan-500 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-cyan-400">[{pkt.flag}]</div>
                    <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{pkt.desc}</div>
                    <div className="text-[9px] text-zinc-500 mt-1">{pkt.sender} → {pkt.receiver}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações e Confiança */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">Confiança:</span>
              <button
                type="button"
                onClick={() => setConfidence('CONFIDENT')}
                className={`px-2.5 py-1 rounded text-xs font-mono ${
                  confidence === 'CONFIDENT'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Certeza
              </button>
              <button
                type="button"
                onClick={() => setConfidence('HESITANT')}
                className={`px-2.5 py-1 rounded text-xs font-mono ${
                  confidence === 'HESITANT'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Dúvida
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-zinc-500 hover:text-white"
                title="Limpar seleção"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDontKnow}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Não sei
              </button>

              <button
                type="button"
                onClick={handleValidateSequence}
                disabled={selectedPackets.length !== 3}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
              >
                Validar Handshake <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* NÍVEL 3: TESTE DE NÚMEROS DE SEQUÊNCIA E ACKNOWLEDGMENT */
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Desafio Técnico: Cálculo de ISN e Acknowledgment
            </span>
            <h3 className="text-base font-bold text-white">
              Sincronização Numérica do TCP
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              O cliente inicia a conexão enviando o pacote <strong>[SYN]</strong> com Initial Sequence Number (ISN) igual a <strong>1000</strong>.
              Qual deverá ser o valor exato preenchido no campo <strong>Acknowledgment (ACK)</strong> da resposta <strong>[SYN-ACK]</strong> do servidor?
            </p>
          </div>

          <form onSubmit={handleValidateLevel3} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Valor do campo ACK do Servidor:
              </label>
              <input
                type="text"
                value={seqAnswer}
                onChange={(e) => setSeqAnswer(e.target.value)}
                placeholder="ex: 1001"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDontKnow}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase"
              >
                Não sei
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs font-mono uppercase"
              >
                Validar Número
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FEEDBACK PEDAGÓGICO E CONSEQUÊNCIAS CONCEITUAIS */}
      {feedback.type && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
              : feedback.type === 'did_not_know'
              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
              : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase font-bold tracking-wider block">
              {feedback.type === 'success' ? 'Handshake Estabelecido' : feedback.type === 'did_not_know' ? 'Reforço Agendado' : 'Falha na Negociação'}
            </span>
            <p className="text-sm leading-relaxed">{feedback.message}</p>
            {feedback.consequenceText && (
              <p className="text-xs font-mono text-amber-300/90 bg-black/40 p-2.5 rounded border border-amber-900/40 mt-2">
                💡 {feedback.consequenceText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
