"use client";

import React, { useState, useId } from 'react';
import { 
  Sliders, CheckCircle2, AlertCircle, HelpCircle, 
  ShieldCheck, Info, ChevronRight, Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import { 
  calculateSubnetPartition, 
  evaluateSubnetSubmission
} from '@/lib/cyberCore/cyberCoreEngine';
import { useCyberCoreStore } from '@/stores/cyberCoreStore';
import type { UserConfidence, ChallengeType, ConceptExperienceProps, ConceptAttemptPayload, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

export interface SubnettingLabProps extends Partial<ConceptExperienceProps> {
  userId?: string;
  initialMode?: 'interact' | 'practice' | 'test';
  stageMode?: StageMode;
  onCompleted?: () => void;
}

export default function SubnettingInteractiveLab({
  activeStage = 'interact',
  stageMode,
  userId = 'local-operator',
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow,
  onCompleted
}: SubnettingLabProps) {
  const store = useCyberCoreStore();
  const mastery = store.getConceptMastery('subnetting-cidr');

  const mode: StageMode = stageMode || (
    activeStage === 'interact' ? 'guided' :
    activeStage === 'test' ? 'exam' : 'practice'
  );

  // Helper para chamar props ou fallback para a store diretamente
  const recordAttemptAction = (payload: ConceptAttemptPayload) => {
    if (onRecordAttempt) {
      onRecordAttempt(payload);
    } else {
      store.recordAttempt({
        userId,
        conceptSlug: 'subnetting-cidr',
        challengeId: payload.challengeId,
        challengeType: payload.challengeType,
        isCorrect: payload.isCorrect,
        confidence: payload.confidence,
        durationMs: payload.durationMs,
        submittedAnswer: payload.submittedAnswer as Record<string, unknown> | string | number,
        feedbackGiven: payload.feedbackGiven
      });
    }
  };

  const recordDidNotKnowAction = (challengeId: string, challengeType: ChallengeType) => {
    if (onDidNotKnow) {
      onDidNotKnow(challengeId, challengeType);
    } else {
      store.recordDidNotKnow({
        userId,
        conceptSlug: 'subnetting-cidr',
        challengeId,
        challengeType,
        durationMs: 4000
      });
    }
  };

  const completeStageAction = (stage: 'interact' | 'practice' | 'test') => {
    if (onCompleteStage) {
      onCompleteStage(stage);
    } else {
      store.completeStageProgress('subnetting-cidr', stage);
    }
  };

  // Estados da Visualização Interativa
  const [baseIp] = useState('192.168.10.0');
  const [selectedPrefix, setSelectedPrefix] = useState<number>(26);
  const [inspectedBlockIndex, setInspectedBlockIndex] = useState<number>(0);

  // Estados dos Desafios de Prática / Teste
  // No modo exam, foca diretamente no desafio autônomo de cálculo/construção (nível 4)
  const [currentLevel, setCurrentLevel] = useState<number>(mode === 'exam' ? 4 : 1);
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [userConfidence, setUserConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pedagogical_error' | 'hint' | 'did_not_know' | 'registered' | null;
    message: string;
    hintLevel: number;
  }>({ type: null, message: '', hintLevel: 0 });

  // Estado para o desafio de construção (Level 4: montar as 4 sub-redes)
  const [builderSubnets, setBuilderSubnets] = useState([
    { net: '192.168.20.0', bcast: '' },
    { net: '', bcast: '' },
    { net: '', bcast: '' },
    { net: '', bcast: '' },
  ]);

  // Sub-redes geradas dinamicamente para o visualizador
  const generatedSubnets = calculateSubnetPartition(baseIp, 24, selectedPrefix);
  const inspectedBlock = generatedSubnets[inspectedBlockIndex] || generatedSubnets[0];

  const maskInputId = useId();

  const handlePrefixChange = (newPrefix: number) => {
    setSelectedPrefix(newPrefix);
    setInspectedBlockIndex(0);
    completeStageAction('interact');
  };

  const handleDidNotKnow = (challengeId: string, challengeType: ChallengeType) => {
    recordDidNotKnowAction(challengeId, challengeType);

    setFeedback({
      type: 'did_not_know',
      message: 'Compreendido perfeitamente. Registramos que este conceito necessita de reforço pedagógico prioritário e ele já foi adicionado à sua Fila de Revisão.',
      hintLevel: 3
    });
    setIsFinalized(true);
  };

  const handleEvaluateLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnswer = practiceAnswer.trim();

    if (currentLevel === 1) {
      const isCorrect = cleanAnswer === '255.255.255.192';
      const duration = 5000;

      recordAttemptAction({
        challengeId: 'sub-lvl-1',
        challengeType: 'calculate',
        isCorrect,
        confidence: userConfidence,
        durationMs: duration,
        submittedAnswer: cleanAnswer,
        feedbackGiven: isCorrect ? 'Cálculo de máscara correto!' : 'Máscara incorreta para /26.'
      });

      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Exato! O prefixo /26 empresta 2 bits do 4º octeto (128 + 64 = 192), resultando na máscara decimal 255.255.255.192.',
          hintLevel: 0
        });
        setIsFinalized(true);
        completeStageAction('practice');
      } else if (mode === 'exam') {
        setFeedback({
          type: 'registered',
          message: 'Resposta registrada para avaliação autônoma.',
          hintLevel: 0
        });
        setIsFinalized(true);
      } else {
        setFeedback({
          type: 'pedagogical_error',
          message: 'Lembre-se dos valores posicionais dos bits do último octeto: bit 7 (128) + bit 6 (64) = 192.',
          hintLevel: feedback.hintLevel + 1
        });
      }
    } else if (currentLevel === 2) {
      const isCorrect = cleanAnswer === '192.168.10.64';
      recordAttemptAction({
        challengeId: 'sub-lvl-2',
        challengeType: 'calculate',
        isCorrect,
        confidence: userConfidence,
        durationMs: 5000,
        submittedAnswer: cleanAnswer,
        feedbackGiven: isCorrect ? 'Endereço de rede correto!' : 'Endereço de rede incorreto.'
      });

      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Perfeito! Com tamanho de bloco 64 (256 - 192 = 64), o host .77 está localizado no intervalo entre .64 e .127.',
          hintLevel: 0
        });
        setIsFinalized(true);
        completeStageAction('practice');
      } else if (mode === 'exam') {
        setFeedback({
          type: 'registered',
          message: 'Resposta registrada para avaliação autônoma.',
          hintLevel: 0
        });
        setIsFinalized(true);
      } else {
        setFeedback({
          type: 'pedagogical_error',
          message: 'Pista: Os blocos de /26 avançam em múltiplos de 64: 0, 64, 128, 192. Em qual intervalo o IP .77 se encaixa?',
          hintLevel: feedback.hintLevel + 1
        });
      }
    } else if (currentLevel === 3) {
      const isCorrect = cleanAnswer === '192.168.10.127';
      recordAttemptAction({
        challengeId: 'sub-lvl-3',
        challengeType: 'calculate',
        isCorrect,
        confidence: userConfidence,
        durationMs: 5000,
        submittedAnswer: cleanAnswer,
        feedbackGiven: isCorrect ? 'Correto!' : 'Broadcast incorreto.'
      });

      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Excelente! A sub-rede vai de .64 a .127. O último endereço (.127) é estritamente reservado para Broadcast.',
          hintLevel: 0
        });
        setIsFinalized(true);
        completeStageAction('practice');
      } else if (mode === 'exam') {
        setFeedback({
          type: 'registered',
          message: 'Resposta registrada para avaliação autônoma.',
          hintLevel: 0
        });
        setIsFinalized(true);
      } else {
        setFeedback({
          type: 'pedagogical_error',
          message: 'Pista: A próxima sub-rede começa em 192.168.10.128. O broadcast da rede atual é exatamente o número anterior.',
          hintLevel: feedback.hintLevel + 1
        });
      }
    } else if (currentLevel === 4) {
      const expected = calculateSubnetPartition('192.168.20.0', 24, 26);
      const evalRes = evaluateSubnetSubmission(expected, builderSubnets.map((s, idx) => ({
        index: idx + 1,
        networkAddress: s.net.trim(),
        broadcastAddress: s.bcast.trim(),
        firstUsableHost: '',
        lastUsableHost: ''
      })));

      recordAttemptAction({
        challengeId: 'sub-lvl-4',
        challengeType: 'build',
        isCorrect: evalRes.isCorrect,
        confidence: userConfidence,
        durationMs: 8000,
        submittedAnswer: { subnets: builderSubnets },
        feedbackGiven: evalRes.message
      });

      if (evalRes.isCorrect) {
        setFeedback({
          type: 'success',
          message: evalRes.message,
          hintLevel: 0
        });
        setIsFinalized(true);
        completeStageAction('test');
        if (onCompleted) onCompleted();
      } else if (mode === 'exam') {
        setFeedback({
          type: 'registered',
          message: 'Partição registrada para avaliação.',
          hintLevel: 0
        });
        setIsFinalized(true);
      } else {
        setFeedback({
          type: 'pedagogical_error',
          message: evalRes.message,
          hintLevel: feedback.hintLevel + 1
        });
      }
    } else if (currentLevel === 5) {
      const isCorrect = cleanAnswer === '/27' || cleanAnswer === '27';
      recordAttemptAction({
        challengeId: 'sub-lvl-5',
        challengeType: 'calculate',
        isCorrect,
        confidence: userConfidence,
        durationMs: 5000,
        submittedAnswer: cleanAnswer,
        feedbackGiven: isCorrect ? 'Correto!' : 'Prefixo incorreto.'
      });

      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Brilhante! /27 reserva 5 bits para hosts: 2^5 = 32 endereços totais, resultando em 30 hosts úteis (32 - 2 = 30 >= 25).',
          hintLevel: 0
        });
        setIsFinalized(true);
        completeStageAction('test');
      } else if (mode === 'exam') {
        setFeedback({
          type: 'registered',
          message: 'Resposta registrada para avaliação.',
          hintLevel: 0
        });
        setIsFinalized(true);
      } else {
        setFeedback({
          type: 'pedagogical_error',
          message: 'Pista: Use a fórmula de capacidade útil: 2^(32 - prefixo) - 2. Teste /28 (14 hosts) e /27 (30 hosts).',
          hintLevel: feedback.hintLevel + 1
        });
      }
    }
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Modifique os prefixos CIDR (/24 a /28) para observar visualmente a divisão binária do espaço de endereçamento.'
    },
    practice: {
      label: 'Aplicação Progressiva (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica: Calcule mentalmente a máscara e o salto de bloco antes de submeter a resposta.'
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
      {/* CABEÇALHO DO LABORATÓRIO + BANNER DE MODO                            */}
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
              Laboratório Interativo de Partição IPv4 & CIDR
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              {mode === 'guided' && 'Explore o manipulador visual contínuo de sub-redes com assistência direta e cálculos de blocos expostos.'}
              {mode === 'practice' && 'Resolva os níveis progressivos de cálculo de máscara, rede e broadcast. Dicas liberadas após erro.'}
              {mode === 'exam' && 'Avaliação autônoma de particionamento de sub-redes: construa os blocos sem a calculadora visual.'}
            </p>
          </div>

          {/* Seletor de modo interativo */}
          {mode !== 'exam' && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg">
              <span className="text-xs text-zinc-400 font-mono px-2">Prefixo CIDR:</span>
              {[24, 25, 26, 27, 28].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => handlePrefixChange(prefix)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    selectedPrefix === prefix
                      ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  /{prefix}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dica visível no modo guided */}
        {mode === 'guided' && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Orientação Pedagógica:</strong> {modeBadge.hint} Cada bit emprestado da porção de host dobra o número de sub-redes e divide o tamanho do bloco pela metade.
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

        {/* Barra de Divisão Visual (visível em guided e practice; oculta/bloqueada em exam) */}
        {mode !== 'exam' ? (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
              <span>Rede Base: <strong className="text-zinc-200">{baseIp}/24</strong> (256 endereços)</span>
              <span>Total de Sub-redes: <strong className="text-cyan-400 font-bold">{generatedSubnets.length}</strong></span>
            </div>

            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${generatedSubnets.length}, 1fr)` }}>
              {generatedSubnets.map((sub, idx) => {
                const isSelected = idx === inspectedBlockIndex;
                return (
                  <button
                    key={sub.networkAddress}
                    type="button"
                    onClick={() => setInspectedBlockIndex(idx)}
                    className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                        Sub-rede #{sub.index}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        /{sub.prefix}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-white truncate">
                      {sub.networkAddress}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-1">
                      {sub.usableHosts} hosts úteis
                    </div>
                  </button>
                );
              })}
            </div>

            {inspectedBlock && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Inspeção Técnica: Sub-rede #{inspectedBlock.index} ({inspectedBlock.networkAddress}/{inspectedBlock.prefix})
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    Máscara: <strong className="text-zinc-200">{inspectedBlock.subnetMask}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Network (Rede)</span>
                    <span className="text-cyan-400 font-bold">{inspectedBlock.networkAddress}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Primeiro Host</span>
                    <span className="text-emerald-400 font-bold">{inspectedBlock.firstUsableHost}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Último Host</span>
                    <span className="text-emerald-400 font-bold">{inspectedBlock.lastUsableHost}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Broadcast</span>
                    <span className="text-amber-400 font-bold">{inspectedBlock.broadcastAddress}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 col-span-2 md:col-span-1">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Capacidade Útil</span>
                    <span className="text-white font-bold">{inspectedBlock.usableHosts} IPs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs font-mono text-amber-300/80">
            ⚠️ O manipulador visual interativo está bloqueado durante a avaliação autônoma (Modo Testar) para aferir a capacidade de cálculo independente.
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 2: DESAFIOS DE RECUPERAÇÃO CONCEITUAL                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">
              {mode === 'exam' ? 'Avaliação Autônoma' : 'Prática e Fixação Conceitual'}
            </span>
            <h2 className="text-lg font-bold text-white tracking-wide mt-1">
              Desafios de Particionamento
            </h2>
          </div>

          {/* Seletor de Níveis (visível apenas fora do modo exam) */}
          {mode !== 'exam' && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setCurrentLevel(lvl);
                    setPracticeAnswer('');
                    setFeedback({ type: null, message: '', hintLevel: 0 });
                    setShowHintRevealed(false);
                    setIsFinalized(false);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    currentLevel === lvl
                      ? 'bg-zinc-800 text-white border border-cyan-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Nível {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Descrição do Nível Atual */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">Nível {currentLevel} de 5:</span>
            {currentLevel === 1 && 'Cálculo de Máscara de Sub-rede'}
            {currentLevel === 2 && 'Identificação do Endereço de Rede (Network ID)'}
            {currentLevel === 3 && 'Identificação do Endereço de Broadcast'}
            {currentLevel === 4 && 'Construção da Partição Completa de 4 Sub-redes'}
            {currentLevel === 5 && 'Dimensionamento de Capacidade para Departamentos'}
          </div>

          <p className="text-sm font-medium text-zinc-200">
            {currentLevel === 1 && 'Qual é a máscara decimal pontuada correspondente ao prefixo CIDR /26?'}
            {currentLevel === 2 && 'Dado o endereço IP 192.168.10.77/26, informe o endereço de Rede (Network Address) correspondente:'}
            {currentLevel === 3 && 'Qual é o endereço de Broadcast da sub-rede à qual pertence o IP 192.168.10.77/26?'}
            {currentLevel === 4 && 'Divida a rede 192.168.20.0/24 em 4 sub-redes /26 iguais. Informe o Network e o Broadcast de cada bloco:'}
            {currentLevel === 5 && 'O departamento de SOC necessita de 25 hosts dedicados. Qual é o menor prefixo CIDR (ex: /27) que atende a essa demanda?'}
          </p>
        </div>

        {/* Formulário de Resposta */}
        <form onSubmit={handleEvaluateLevel} className="space-y-4">
          {currentLevel !== 4 ? (
            <div>
              <label htmlFor={maskInputId} className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Sua Resposta:
              </label>
              <input
                id={maskInputId}
                type="text"
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                disabled={isFinalized}
                placeholder={
                  currentLevel === 1 ? 'ex: 255.255.255.192' :
                  currentLevel === 2 ? 'ex: 192.168.10.64' :
                  currentLevel === 3 ? 'ex: 192.168.10.127' : '/27'
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          ) : (
            /* Builder Interativo para o Nível 4 */
            <div className="space-y-3">
              <span className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
                Tabela de Partição da Rede 192.168.20.0/24:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {builderSubnets.map((sub, idx) => (
                  <div key={idx} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold block">
                      Sub-rede #{idx + 1} (/26)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono block">Network</span>
                        <input
                          type="text"
                          value={sub.net}
                          disabled={isFinalized}
                          onChange={(e) => {
                            const updated = [...builderSubnets];
                            updated[idx].net = e.target.value;
                            setBuilderSubnets(updated);
                          }}
                          placeholder={`192.168.20.${idx * 64}`}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono block">Broadcast</span>
                        <input
                          type="text"
                          value={sub.bcast}
                          disabled={isFinalized}
                          onChange={(e) => {
                            const updated = [...builderSubnets];
                            updated[idx].bcast = e.target.value;
                            setBuilderSubnets(updated);
                          }}
                          placeholder={`192.168.20.${(idx + 1) * 64 - 1}`}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isFinalized && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Confiança:</span>
                <button
                  type="button"
                  onClick={() => setUserConfidence('CONFIDENT')}
                  className={`px-2.5 py-1 rounded text-xs font-mono ${
                    userConfidence === 'CONFIDENT'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Certeza
                </button>
                <button
                  type="button"
                  onClick={() => setUserConfidence('HESITANT')}
                  className={`px-2.5 py-1 rounded text-xs font-mono ${
                    userConfidence === 'HESITANT'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500'
                      : 'text-zinc-500 hover:text-zinc-300'
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
                  onClick={() => handleDidNotKnow(`sub-lvl-${currentLevel}`, currentLevel === 4 ? 'build' : 'calculate')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Não sei
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
                >
                  Validar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Feedback Pedagógico Específico */}
        {feedback.type && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : feedback.type === 'did_not_know'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                : feedback.type === 'registered'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : feedback.type === 'registered' ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : feedback.type === 'did_not_know' ? (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase font-bold tracking-wider block">
                {feedback.type === 'success' && 'Validação Confirmada'}
                {feedback.type === 'registered' && 'Avaliação Registrada'}
                {feedback.type === 'did_not_know' && 'Reforço Pedagógico Agendado'}
                {feedback.type === 'pedagogical_error' && `Orientação Pedagógica (Tentativa #${feedback.hintLevel})`}
              </span>
              <p className="text-sm leading-relaxed">{feedback.message}</p>

              {mode === 'exam' && isFinalized && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
                  <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
                  <p className="text-zinc-300">
                    Ao dividir uma rede /24 em /26, o tamanho do bloco é 64 (256 / 4 = 64). Os quatro blocos são: .0 (broadcast .63), .64 (broadcast .127), .128 (broadcast .191) e .192 (broadcast .255).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 3: STATUS REAL DE DOMÍNIO DO CONCEITO                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-800 rounded-lg text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
              Evidência de Domínio Atual
            </span>
            <span className="text-white font-bold text-sm">
              {mastery?.retentionState === 'MASTERED' && 'CONSOLIDADO & DOMINADO (85%+ Acurácia em 3+ Desafios)'}
              {mastery?.retentionState === 'CONSOLIDATED' && 'CONSOLIDADO (Retenção intermediária confirmada)'}
              {mastery?.retentionState === 'IN_DEVELOPMENT' && 'EM DESENVOLVIMENTO (Prática contínua)'}
              {(!mastery || mastery.retentionState === 'NOT_STARTED') && 'NÃO INICIADO'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-zinc-400">
          <div>
            <span className="text-zinc-500 block text-[10px]">Tentativas</span>
            <strong className="text-zinc-200">{mastery?.totalAttempts || 0}</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Acurácia</span>
            <strong className="text-cyan-400">{mastery?.accuracy || 0}%</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Tipos Praticados</span>
            <strong className="text-zinc-200">{mastery?.challengeDiversityCount || 0}/3</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Próxima Revisão</span>
            <strong className="text-zinc-200">
              {mastery?.nextReviewAt ? new Date(mastery.nextReviewAt).toLocaleDateString('pt-BR') : 'Hoje'}
            </strong>
          </div>
        </div>
      </section>

    </div>
  );
}
