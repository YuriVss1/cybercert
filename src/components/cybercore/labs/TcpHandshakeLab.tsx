"use client";

import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, AlertCircle, 
  RotateCcw, Lightbulb, Eye, Target, ShieldAlert
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

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
  { id: 'pkt-syn', flag: 'SYN', desc: 'Sincronizar (Início de conexão pelo Cliente)', sender: 'CLIENT', receiver: 'SERVER', isHandshake: true },
  { id: 'pkt-synack', flag: 'SYN-ACK', desc: 'Sincronizar + Confirmar (Resposta do Servidor)', sender: 'SERVER', receiver: 'CLIENT', isHandshake: true },
  { id: 'pkt-ack', flag: 'ACK', desc: 'Confirmar recebimento (Finalização da abertura pelo Cliente)', sender: 'CLIENT', receiver: 'SERVER', isHandshake: true },
  { id: 'pkt-fin', flag: 'FIN', desc: 'Finalizar conexão (Encerramento/Teardown)', sender: 'CLIENT', receiver: 'SERVER', isHandshake: false },
  { id: 'pkt-rst', flag: 'RST', desc: 'Resetar conexão (Interrupção/Abort)', sender: 'SERVER', receiver: 'CLIENT', isHandshake: false },
];

export default function TcpHandshakeLab({
  activeStage,
  stageMode,
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  // Resolve o modo pedagógico efetivo
  const mode: StageMode = stageMode || (
    activeStage === 'interact' ? 'guided' :
    activeStage === 'test' ? 'exam' : 'practice'
  );

  // No modo guided/practice iniciamos no nível 1 (sequência). No modo exam, apresentamos desafio autônomo (nível 3 / diagnóstico de estado)
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(mode === 'exam' ? 3 : 1);
  const [selectedPackets, setSelectedPackets] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pedagogical_error' | 'did_not_know' | 'registered' | null;
    message: string;
    consequenceText?: string;
  }>({ type: null, message: '' });

  // Nível 3: Quiz de números de sequência
  const [seqAnswer, setSeqAnswer] = useState('');

  // Manipulação de inserção de pacotes
  const handleSelectPacket = (flag: string) => {
    if (isFinalized) return;
    if (selectedPackets.length < 3 && !selectedPackets.includes(flag)) {
      setSelectedPackets([...selectedPackets, flag]);
    }
  };

  const handleRemovePacket = (index: number) => {
    if (isFinalized) return;
    const updated = [...selectedPackets];
    updated.splice(index, 1);
    setSelectedPackets(updated);
  };

  const handleReset = () => {
    setSelectedPackets([]);
    setFeedback({ type: null, message: '' });
    setShowHintRevealed(false);
    setIsFinalized(false);
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
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      // Modo exam: feedback mínimo sem revelar a resposta
      setFeedback({
        type: 'registered',
        message: 'Resposta registrada para avaliação.'
      });
      setIsFinalized(true);
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
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setFeedback({
        type: 'registered',
        message: 'Resposta registrada para avaliação.'
      });
      setIsFinalized(true);
    } else {
      setFeedback({
        type: 'pedagogical_error',
        message: 'Pista pedagógica: O campo Acknowledgment do receptor sempre informa "recebi seu byte X, agora aguardo o byte X + 1".',
        consequenceText: 'Se o cliente enviou Seq=1000, quanto é 1000 + 1?'
      });
    }
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow(`tcp-handshake-lvl-${currentLevel}`, 'SORT');
    }
    setFeedback({
      type: 'did_not_know',
      message: 'Marcado como "Não sei". O conceito de Handshake de 3 vias foi adicionado com prioridade máxima à sua Fila de Revisão. Regra de ouro: SYN (Cliente) -> SYN-ACK (Servidor) -> ACK (Cliente).'
    });
    setIsFinalized(true);
  };

  // Configuração visual do modo
  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: O cliente inicia enviando SYN. O servidor responde com SYN-ACK. O cliente confirma com ACK.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Atenção às flags FIN e RST — elas operam no encerramento ou reset da conexão, e não no handshake de abertura.'
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
  const canRevealHint = mode === 'practice' && feedback.type === 'pedagogical_error' && !showHintRevealed;

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      
      {/* -------------------------------------------------------------------- */}
      {/* CABEÇALHO DO LABORATÓRIO + BANNER DE MODO PEDAGÓGICO                  */}
      {/* -------------------------------------------------------------------- */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-1">
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-bold ${modeBadge.bg} ${modeBadge.color}`}>
                <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-2">
              Montador de Sessão: TCP 3-Way Handshake
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              {mode === 'guided' && 'Observe a ordem dos pacotes e entenda a transição de sockets de rede com orientação contínua.'}
              {mode === 'practice' && 'Construa o handshake correto filtrando pacotes de encerramento ou reset (FIN, RST). Dica disponível após erro.'}
              {mode === 'exam' && 'Avaliação autônoma de parâmetros TCP: sem dicas ou auxílios durante a resolução.'}
            </p>
          </div>

          {/* Seletor de Níveis (Permite alternar no guided/practice, bloqueado para desafio específico no exam) */}
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

        {/* Dica visível no modo guided */}
        {mode === 'guided' && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Orientação Pedagógica:</strong> {modeBadge.hint} O cliente inicia o contato; o servidor confirma e propõe seu ISN; o cliente sela o canal.
              </span>
            </p>
          </div>
        )}

        {/* Dica revelada no modo practice */}
        {mode === 'practice' && showHintRevealed && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Dica Revelada:</strong> {modeBadge.hint}
              </span>
            </p>
          </div>
        )}

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
                {selectedPackets.length >= 2 && 'ESTABLISHED'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* ÁREA DE DESAFIO ESPECÍFICO                                           */}
      {/* -------------------------------------------------------------------- */}
      {(currentLevel === 1 || currentLevel === 2) && (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Montagem dos 3 Passos da Conexão</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({selectedPackets.length}/3 pacotes selecionados)
              </span>
            </h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>

          {/* Slots de montagem */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => {
              const flag = selectedPackets[idx];
              const expectedStep = CORRECT_HANDSHAKE_STEPS[idx];
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border border-dashed flex flex-col justify-between min-h-[120px] transition-all ${
                    flag 
                      ? 'bg-zinc-900 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <span>Etapa #{idx + 1}</span>
                    <span>{idx === 0 ? 'CLIENT → SRV' : idx === 1 ? 'SRV → CLIENT' : 'CLIENT → SRV'}</span>
                  </div>

                  {flag ? (
                    <div className="my-2">
                      <span className="text-lg font-mono font-black text-cyan-400 block">{flag}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {AVAILABLE_PACKET_OPTIONS.find(p => p.flag === flag)?.desc}
                      </span>
                    </div>
                  ) : (
                    <div className="my-auto text-center text-xs font-mono text-zinc-600">
                      {mode === 'guided' ? `Aguardando ${expectedStep.flag}` : 'Selecione o pacote abaixo'}
                    </div>
                  )}

                  {flag && !isFinalized && (
                    <button
                      type="button"
                      onClick={() => handleRemovePacket(idx)}
                      className="text-[10px] font-mono text-red-400 hover:underline self-start mt-1"
                    >
                      Remover pacote
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pacotes disponíveis para clique */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block">
              Pacotes Disponíveis:
            </span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AVAILABLE_PACKET_OPTIONS.map((pkt) => {
                const isSelected = selectedPackets.includes(pkt.flag);
                const isDistractor = !pkt.isHandshake;
                return (
                  <button
                    key={pkt.id}
                    type="button"
                    onClick={() => handleSelectPacket(pkt.flag)}
                    disabled={isSelected || selectedPackets.length >= 3 || isFinalized}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'opacity-40 bg-zinc-900 border-zinc-800 cursor-not-allowed'
                        : 'bg-zinc-900 hover:border-cyan-500 hover:bg-zinc-850 border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm font-bold text-white">{pkt.flag}</span>
                      {mode === 'guided' && isDistractor && (
                        <span className="text-[9px] font-mono text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded bg-zinc-800/50">
                          não pertence à abertura
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{pkt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações e Confiança */}
          {!isFinalized && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Confiança:</span>
                <button
                  type="button"
                  onClick={() => setConfidence('CONFIDENT')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    confidence === 'CONFIDENT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' : 'text-zinc-500'
                  }`}
                >
                  Certeza
                </button>
                <button
                  type="button"
                  onClick={() => setConfidence('HESITANT')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    confidence === 'HESITANT' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'text-zinc-500'
                  }`}
                >
                  Dúvida
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider"
                >
                  Não sei
                </button>
                <button
                  type="button"
                  onClick={handleValidateSequence}
                  disabled={selectedPackets.length !== 3}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
                >
                  Validar Sequência <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Nível 3: Quiz de números de sequência */}
      {currentLevel === 3 && (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              {mode === 'exam' ? 'Avaliação Autônoma de Engenharia de Protocolo' : 'Desafio de Acknowledgment'}
            </span>
            <h3 className="text-base font-bold text-white leading-relaxed">
              Cenário: O Cliente envia um pacote inicial com flag <strong className="text-cyan-400">SYN</strong> e Número de Sequência Inicial <strong className="text-cyan-400">Seq = 1000</strong>.
              Ao gerar a resposta com a flag <strong className="text-purple-400">SYN-ACK</strong>, qual deve ser o valor exato preenchido pelo Servidor no campo <strong className="text-emerald-400">Acknowledgment Number (ACK)</strong>?
            </h3>
            {mode === 'guided' && (
              <p className="text-xs text-emerald-300 font-mono">
                Dica guiada: O receptor sempre confirma o ISN do emissor incrementado em 1 (+1 byte virtual de controle).
              </p>
            )}
          </div>

          <form onSubmit={handleValidateLevel3} className="space-y-4">
            <div className="max-w-md">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
                Valor do campo ACK:
              </label>
              <input
                type="text"
                value={seqAnswer}
                onChange={(e) => setSeqAnswer(e.target.value)}
                disabled={isFinalized}
                placeholder="Ex: 1001"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {!isFinalized && (
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!seqAnswer.trim()}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider"
                >
                  Avaliar Resposta
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* FEEDBACK PEDAGÓGICO */}
      {feedback.type && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
            : feedback.type === 'registered'
            ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
            : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === 'registered' ? (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase font-bold tracking-wider block">
              {feedback.type === 'success' ? 'Validação Concluída' : feedback.type === 'registered' ? 'Avaliação Registrada' : 'Análise Conceitual'}
            </span>
            <p className="text-xs md:text-sm leading-relaxed">{feedback.message}</p>
            {feedback.consequenceText && mode !== 'exam' && (
              <div className="p-3 bg-black/40 border border-amber-900/40 rounded-lg text-xs text-amber-300/90 font-mono">
                {feedback.consequenceText}
              </div>
            )}

            {/* Debrief do modo exam */}
            {mode === 'exam' && isFinalized && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1">
                <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
                <p className="text-zinc-300">
                  O handshake de 3 vias sincroniza conexões com SYN (ISN), SYN-ACK (ISN_s, Ack = ISN_c + 1) e ACK (Ack = ISN_s + 1). Sem o handshake completo, o socket não transiciona para ESTABLISHED.
                </p>
              </div>
            )}

            {/* Ações pós-feedback */}
            <div className="flex items-center gap-3 pt-1">
              {feedback.type === 'pedagogical_error' && !isFinalized && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-mono text-cyan-400 hover:underline"
                >
                  Tentar novamente →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
