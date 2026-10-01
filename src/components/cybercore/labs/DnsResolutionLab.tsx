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
      <section className="cockpit-card rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-1">
              <span className={`telemetry-chip font-bold ${modeBadge.color} border-current/30 bg-white/[0.02]`}>
                <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-2 font-heading">
              Rastreador de Caminho: Resolução Iterativa & Hierárquica
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
              {mode === 'guided' && 'Acompanhe passo a passo cada salto de rede de uma consulta DNS com explicações conceituais completas.'}
              {mode === 'practice' && 'Pratique a identificação do papel de cada servidor no fluxo de resolução. Dica disponível após erro.'}
              {mode === 'exam' && 'Avaliação autônoma sobre a hierarquia DNS e flags autoritativas, sem dicas durante a resolução.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 cockpit-subcard border border-white/[0.08] p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTabMode('trace'); setFeedback({ type: null, message: '' }); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTabMode === 'trace' ? 'avionics-primary text-white shadow' : 'avionics-button text-zinc-400 hover:text-white'
              }`}
            >
              1. Rastrear Fluxo (TRACE)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTabMode('test'); setFeedback({ type: null, message: '' }); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTabMode === 'test' ? 'avionics-primary text-white shadow' : 'avionics-button text-zinc-400 hover:text-white'
              }`}
            >
              2. Teste de Retenção
            </button>
          </div>
        </div>

        {/* Dica visível no modo guided */}
        {mode === 'guided' && (
          <div className="p-3 cockpit-subcard border-emerald-500/30 rounded-xl bg-emerald-950/15">
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
          <div className="p-3 cockpit-subcard border-cyan-500/30 rounded-xl bg-cyan-950/15 animate-in fade-in">
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
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
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
                        ? 'cockpit-subcard border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-950/20 text-white ring-1 ring-cyan-500/40'
                        : isPassed
                        ? 'cockpit-subcard border-emerald-500/40 bg-emerald-950/10 text-zinc-300'
                        : 'cockpit-subcard border-white/[0.06] text-zinc-500 hover:border-white/[0.14] hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 text-[10px]">
                      <span className="telemetry-chip text-[9px] border-white/10 text-zinc-400">Salto #{hop.stepNumber}</span>
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="font-bold text-xs truncate text-cyan-300 font-mono">{hop.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5 font-sans">{hop.role}</div>
                  </button>
                );
              })}
            </div>

            {/* CARD DETALHADO DO SALTO ATUAL */}
            <div className="cockpit-card hud-bracket rounded-xl p-6 space-y-5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-sm text-white tracking-wide">{activeHop.name}</span>
                  <span className="telemetry-chip border-white/10 text-zinc-400 bg-white/[0.02] hidden sm:inline-flex">{activeHop.role}</span>
                </div>
                <span className={`telemetry-chip font-bold uppercase ${
                  activeHop.isAuthoritative 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
                    : 'bg-white/[0.02] text-zinc-400 border-white/10'
                }`}>
                  {activeHop.isAuthoritative ? 'Resposta Autoritativa (AA)' : 'Não-Autoritativo (Referral)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cockpit-subcard p-4 rounded-xl border border-white/[0.08] space-y-1.5">
                  <span className="text-zinc-500 uppercase text-[10px] tracking-wider block font-bold font-mono">Mensagem Recebida</span>
                  <p className="text-zinc-200 font-mono leading-relaxed">{activeHop.queryReceived}</p>
                </div>
                <div className="cockpit-subcard p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10 space-y-1.5">
                  <span className="text-cyan-400 uppercase text-[10px] tracking-wider block font-bold font-mono">Ação / Resposta</span>
                  <p className="text-cyan-200 font-mono leading-relaxed">{activeHop.answerReturned}</p>
                </div>
              </div>

              {(mode === 'guided' || currentStep <= 2) && (
                <div className="p-3.5 cockpit-subcard border-white/[0.08] rounded-xl text-zinc-300 leading-relaxed font-sans text-xs">
                  💡 <strong className="text-white">Explicação Técnica:</strong> {activeHop.explanation}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="avionics-primary px-5 py-2.5 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-lg flex items-center gap-2"
                >
                  {currentStep < 5 ? 'Avançar para Próximo Salto' : 'Concluir Rastreamento'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO TESTE DE RETENÇÃO */
          <div className="cockpit-card hud-bracket rounded-xl p-6 space-y-6">
            <div className="space-y-2">
              <span className="telemetry-chip border-cyan-500/30 text-cyan-300 bg-cyan-950/20 font-bold block w-fit">
                {mode === 'exam' ? 'Avaliação Autônoma: Resolução DNS' : 'Desafio de Identificação Autoritativa'}
              </span>
              <h3 className="text-base font-bold text-white leading-relaxed font-heading">
                Durante a consulta por &quot;api.rootsec.io&quot;, qual dos servidores da hierarquia DNS é o <strong className="text-emerald-400">único</strong> detentor oficial do arquivo de zona capaz de emitir uma resposta com a flag <strong className="text-cyan-400 font-mono">Authoritative Answer (AA)</strong>?
              </h3>
            </div>

            <form onSubmit={handleValidateTest} className="space-y-4">
              <div className="max-w-md">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1 font-bold">
                  Nome ou papel do servidor:
                </label>
                <input
                  type="text"
                  value={testAnswer}
                  onChange={(e) => setTestAnswer(e.target.value)}
                  disabled={isFinalized}
                  placeholder="Ex: Servidor Autoritativo"
                  className="w-full bg-[#05070a]/90 border border-white/[0.12] rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                />
              </div>

              {!isFinalized && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
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
                      className="avionics-button px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider"
                    >
                      Não sei
                    </button>

                    <button
                      type="submit"
                      disabled={!testAnswer.trim()}
                      className="avionics-primary px-5 py-2 disabled:opacity-40 text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider"
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
        <div className={`cockpit-card rounded-xl p-5 border flex items-start gap-3.5 ${
          feedback.type === 'success' 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : feedback.type === 'registered'
            ? 'border-white/10 bg-white/[0.02] text-zinc-300' 
            : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === 'registered' ? (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-2 flex-1 font-mono text-xs">
            <span className="text-xs font-mono uppercase font-bold tracking-wider block">
              {feedback.type === 'success' ? 'Correto!' : feedback.type === 'registered' ? 'Avaliação Registrada' : 'Análise Técnica'}
            </span>
            <p className="text-xs md:text-sm leading-relaxed font-sans">{feedback.message}</p>

            {/* Debrief do modo exam */}
            {mode === 'exam' && isFinalized && (
              <div className="p-3 cockpit-subcard border-white/10 rounded-lg text-xs space-y-1 mt-2">
                <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
                <p className="text-zinc-300 font-sans leading-relaxed">
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
