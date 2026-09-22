"use client";

import React, { useState } from 'react';
import { 
  Compass, CheckCircle2, AlertCircle, 
  Server, ChevronRight
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  concept,
  activeStage,
  userId = 'local-user',
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTabMode, setActiveTabMode] = useState<'trace' | 'test'>('trace');
  const [testAnswer, setTestAnswer] = useState<string>('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pedagogical_error' | 'did_not_know' | null;
    message: string;
  }>({ type: null, message: '' });

  const activeHop = DNS_HIERARCHY_HOPS.find(h => h.stepNumber === currentStep) || DNS_HIERARCHY_HOPS[0];

  const handleAdvanceStep = () => {
    if (currentStep < DNS_HIERARCHY_HOPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      onCompleteStage('interact');
    }
  };

  const handleValidateTest = (e: React.FormEvent) => {
    e.preventDefault();
    // Pergunta: Qual servidor é o único que possui a resposta autoritativa final sobre o IP de api.rootsec.io? -> Authoritative
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
      onCompleteStage('test');
    } else {
      setFeedback({
        type: 'pedagogical_error',
        message: 'Pista: Nem o Root Server nem o TLD guardam os registros A do domínio. Eles apenas apontam para o servidor que gerencia a zona. Qual é esse servidor?'
      });
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow('dns-trace-test-1', 'TRACE');
    setFeedback({
      type: 'did_not_know',
      message: 'Marcado como "Não sei". O conceito de resolução hierárquica DNS foi adicionado com prioridade máxima à sua Fila de Revisão. Ordem: Cliente -> Resolver -> Root -> TLD -> Autoritativo.'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      
      {/* CABEÇALHO */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
              <Compass className="w-4 h-4" /> Laboratório Interativo de Resolução DNS
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Rastreador de Caminho: Resolução Iterativa & Hierárquica
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Acompanhe cada salto de rede de uma consulta DNS para entender quem responde, por que existem servidores raiz e quem é a autoridade final.
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

              <div className="p-3.5 bg-black/40 border border-zinc-800/60 rounded-lg text-zinc-400 leading-relaxed font-sans text-xs">
                💡 <strong className="text-zinc-200">Explicação Técnica:</strong> {activeHop.explanation}
              </div>

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
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                Desafio de Retenção de Conceito
              </span>
              <h3 className="text-base font-bold text-white">
                Autoridade de Zona DNS
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
                Durante a consulta para <strong>&quot;api.rootsec.io&quot;</strong>, o cliente e o resolver passam por Root Servers e TLD Servers.
                Qual tipo de servidor é o <strong>único</strong> detentor do arquivo oficial da zona, retornando o registro A com a flag de <em>Authoritative Answer</em>?
              </p>
            </div>

            <form onSubmit={handleValidateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                  Nome do tipo de servidor:
                </label>
                <input
                  type="text"
                  value={testAnswer}
                  onChange={(e) => setTestAnswer(e.target.value)}
                  placeholder="ex: Servidor Autoritativo"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
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
                  Validar Resposta
                </button>
              </div>
            </form>
          </section>
        )}

        {/* FEEDBACK */}
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
                {feedback.type === 'success' ? 'Correto!' : feedback.type === 'did_not_know' ? 'Reforço Agendado' : 'Orientação Pedagógica'}
              </span>
              <p className="text-sm leading-relaxed">{feedback.message}</p>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
