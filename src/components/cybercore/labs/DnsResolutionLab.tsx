"use client";

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, 
  Server, ChevronRight, Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface DnsHop {
  id: string;
  stepNumber: number;
  name: string;
  role: string;
  queryReceived: string;
  answerReturned: string;
  isAuthoritative: boolean;
  explanation: string;
}

const DNS_HIERARCHY_HOPS: DnsHop[] = [
  {
    id: 'hop-client',
    stepNumber: 1,
    name: 'Cliente (Navegador / OS)',
    role: 'Origem da Requisição',
    queryReceived: 'Consulta: "api.rootsec.io" (Cache local consultado: MISS)',
    answerReturned: 'Encaminha para o Recursive Resolver configurado (ex: 1.1.1.1 ou 8.8.8.8)',
    isAuthoritative: false,
    explanation: 'O cliente primeiro verifica seu cache local (hosts, cache DNS do OS). Em caso de cache miss, envia consulta recursiva ao resolver.'
  },
  {
    id: 'hop-resolver',
    stepNumber: 2,
    name: 'Recursive Resolver (ISP / 8.8.8.8)',
    role: 'Intermediário Recursivo',
    queryReceived: 'Recebe "api.rootsec.io" do cliente',
    answerReturned: 'Inicia consultas iterativas na hierarquia raiz',
    isAuthoritative: false,
    explanation: 'O resolver realiza o trabalho pesado de percorrer a árvore DNS do topo até a base.'
  },
  {
    id: 'hop-root',
    stepNumber: 3,
    name: 'Root Name Server (".")',
    role: 'Servidor Raiz',
    queryReceived: '"Onde encontro api.rootsec.io?"',
    answerReturned: 'Referência aos TLD Servers de ".io"',
    isAuthoritative: false,
    explanation: 'Os 13 endereços de servidores raiz globais não conhecem os domínios individuais, mas sabem exatamente onde encontrar os servidores de cada TLD (.com, .io, .br).'
  },
  {
    id: 'hop-tld',
    stepNumber: 4,
    name: 'TLD Name Server (".io")',
    role: 'Servidor de Domínio de Topo',
    queryReceived: '"Onde encontro rootsec.io?"',
    answerReturned: 'Referência aos Nameservers Autoritativos (ns1.rootsec.io)',
    isAuthoritative: false,
    explanation: 'O servidor TLD gerencia o registro do sufixo .io e aponta para os servidores autoritativos delegados pelo registrador.'
  },
  {
    id: 'hop-auth',
    stepNumber: 5,
    name: 'Authoritative Name Server',
    role: 'Detentor Oficial da Zona DNS',
    queryReceived: '"Qual o IP de api.rootsec.io?"',
    answerReturned: 'Resposta Autoritativa (AA): Registro A = 198.51.100.42',
    isAuthoritative: true,
    explanation: 'Este é o único servidor que possui o arquivo de zona oficial com a resposta definitiva (Authoritative Answer). O resolver armazena no cache e entrega ao cliente.'
  }
];

export default function DnsResolutionLab({
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

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTabMode, setActiveTabMode] = useState<'trace' | 'test'>(mode === 'exam' ? 'test' : 'trace');
  const [testAnswer, setTestAnswer] = useState<string>('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pedagogical_error' | 'did_not_know' | 'registered' | null;
    message: string;
  }>({ type: null, message: '' });

  const activeHop = DNS_HIERARCHY_HOPS.find(h => h.stepNumber === currentStep) || DNS_HIERARCHY_HOPS[0];

  const handleAdvanceStep = () => {
    if (currentStep < DNS_HIERARCHY_HOPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    }
  };

  const handleValidateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testAnswer.toLowerCase().trim();
    const isCorrect = clean.includes('autoritativo') || clean.includes('authoritative') || clean === '5' || clean.includes('servidor autoritativo');

    onRecordAttempt({
      challengeId: 'dns-trace-test-1',
      challengeType: 'TRACE',
      isCorrect,
      confidence,
      durationMs: 5000,
      submittedAnswer: { answer: testAnswer },
      feedbackGiven: isCorrect ? 'Identificação do Servidor Autoritativo correta.' : 'Servidor incorreto.'
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: 'Excelente! Apenas o Servidor Autoritativo do domínio (Authoritative NS) possui a resposta oficial definitiva (flag AA). Root e TLD apenas fornecem referências (delegation).'
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
        message: 'Pista: Nem o Root Server nem o TLD guardam os registros A do domínio. Eles apenas apontam para o servidor que gerencia a zona. Qual é esse servidor?'
      });
    }
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('dns-trace-test-1', 'TRACE');
    }
    setFeedback({
      type: 'did_not_know',
      message: 'Marcado como "Não sei". O conceito de resolução hierárquica DNS foi adicionado com prioridade máxima à sua Fila de Revisão. Ordem: Cliente -> Resolver -> Root -> TLD -> Autoritativo.'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Trace Guiado (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Acompanhe a descida pela árvore DNS. Observe que Root e TLD apenas delegam; somente o servidor autoritativo retorna a flag AA.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Lembre-se da diferença crucial entre consulta recursiva (feita pelo cliente) e consultas iterativas (feitas pelo resolver).'
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
      
      {/* CABEÇALHO */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-1">
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-bold ${modeBadge.bg} ${modeBadge.color}`}>
                <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-2">
              Rastreador de Caminho: Resolução Iterativa & Hierárquica
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              {mode === 'guided' && 'Acompanhe passo a passo cada salto de rede de uma consulta DNS com explicações conceituais completas.'}
              {mode === 'practice' && 'Pratique a identificação do papel de cada servidor no fluxo de resolução. Dica disponível após erro.'}
              {mode === 'exam' && 'Avaliação autônoma sobre a hierarquia DNS e flags autoritativas, sem dicas durante a resolução.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setActiveTabMode('trace'); setFeedback({ type: null, message: '' }); }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                activeTabMode === 'trace' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              1. Rastrear Fluxo (TRACE)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTabMode('test'); setFeedback({ type: null, message: '' }); }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                activeTabMode === 'test' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              2. Teste de Retenção
            </button>
          </div>
        </div>

        {/* Dica visível no modo guided */}
        {mode === 'guided' && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Orientação Pedagógica:</strong> {modeBadge.hint}
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

        {/* NAVEGADOR DE HOPS INTERATIVO */}
        {activeTabMode === 'trace' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              {DNS_HIERARCHY_HOPS.map((hop) => {
                const isActive = hop.stepNumber === currentStep;
                const isPassed = hop.stepNumber < currentStep;
                return (
                  <button
                    key={hop.id}
                    type="button"
                    onClick={() => setCurrentStep(hop.stepNumber)}
                    className={`p-3 rounded-xl border text-left font-mono transition-all relative ${
                      isActive
                        ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500'
                        : isPassed
                        ? 'bg-zinc-900/90 border-emerald-800/60 text-zinc-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span>Salto #{hop.stepNumber}</span>
                      {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="font-bold text-xs truncate text-cyan-300">{hop.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{hop.role}</div>
                  </button>
                );
              })}
            </div>

            {/* CARD DETALHADO DO SALTO ATUAL */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm text-white">{activeHop.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  activeHop.isAuthoritative 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}>
                  {activeHop.isAuthoritative ? 'Resposta Autoritativa (AA)' : 'Não-Autoritativo (Referral)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 uppercase text-[10px] block">Mensagem Recebida</span>
                  <p className="text-zinc-200">{activeHop.queryReceived}</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-cyan-400 uppercase text-[10px] block font-bold">Ação / Resposta</span>
                  <p className="text-cyan-200">{activeHop.answerReturned}</p>
                </div>
              </div>

              {(mode === 'guided' || currentStep <= 2) && (
                <div className="p-3.5 bg-black/40 border border-zinc-800/60 rounded-lg text-zinc-400 leading-relaxed font-sans text-xs">
                  💡 <strong className="text-zinc-200">Explicação Técnica:</strong> {activeHop.explanation}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {currentStep < 5 ? 'Avançar para Próximo Salto' : 'Concluir Rastreamento'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO TESTE DE RETENÇÃO */
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                {mode === 'exam' ? 'Avaliação Autônoma: Resolução DNS' : 'Desafio de Identificação Autoritativa'}
              </span>
              <h3 className="text-base font-bold text-white leading-relaxed">
                Durante a consulta por &quot;api.rootsec.io&quot;, qual dos servidores da hierarquia DNS é o <strong className="text-emerald-400">único</strong> detentor oficial do arquivo de zona capaz de emitir uma resposta com a flag <strong className="text-cyan-400">Authoritative Answer (AA)</strong>?
              </h3>
            </div>

            <form onSubmit={handleValidateTest} className="space-y-4">
              <div className="max-w-md">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  Nome ou papel do servidor:
                </label>
                <input
                  type="text"
                  value={testAnswer}
                  onChange={(e) => setTestAnswer(e.target.value)}
                  disabled={isFinalized}
                  placeholder="Ex: Servidor Autoritativo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {!isFinalized && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
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
                      type="submit"
                      disabled={!testAnswer.trim()}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider"
                    >
                      Validar Resposta
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </section>

      {/* FEEDBACK */}
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
              {feedback.type === 'success' ? 'Correto!' : feedback.type === 'registered' ? 'Avaliação Registrada' : 'Análise Técnica'}
            </span>
            <p className="text-xs md:text-sm leading-relaxed">{feedback.message}</p>

            {/* Debrief do modo exam */}
            {mode === 'exam' && isFinalized && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1">
                <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
                <p className="text-zinc-300">
                  Na arquitetura DNS, Root (. ) e TLD (.io) apenas realizam delegações iterativas (referrals). Somente o Servidor Autoritativo (Authoritative Name Server) tem a autoridade legal sobre a zona e emite respostas autoritativas definitivas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
