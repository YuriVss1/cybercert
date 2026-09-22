"use client";

import React, { useState } from 'react';
import { 
  Brain, CheckCircle2, Clock, RotateCcw, ArrowRight, Play, 
  Layers, ShieldAlert, Sparkles, Filter, AlertTriangle, BookOpen,
  Calendar, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { useCyberCoreStore } from '@/stores/cyberCoreStore';
import { CYBER_CONCEPTS_CATALOG, getConceptBySlug } from '@/lib/cyberCore/conceptsData';
import type { ConceptCategory } from '@/lib/cyberCore/cyberCoreTypes';
import ConceptView from './ConceptView';

const CATEGORIES: { id: ConceptCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'NETWORKING', label: 'Networking' },
  { id: 'CYBERSECURITY', label: 'Cybersecurity' },
  { id: 'CRYPTOGRAPHY', label: 'Cryptography' },
  { id: 'IDENTITY', label: 'Identity' },
  { id: 'CLOUD', label: 'Cloud' },
  { id: 'SOC', label: 'SOC' },
  { id: 'LINUX', label: 'Linux' },
  { id: 'WINDOWS', label: 'Windows' },
];

export default function CyberCoreHome() {
  const { 
    selectedConceptSlug, 
    setSelectedConcept, 
    getGlobalMetrics, 
    reviewQueue, 
    userMastery,
    resolveReviewItem 
  } = useCyberCoreStore();

  const [selectedCategory, setSelectedCategory] = useState<ConceptCategory | 'ALL'>('ALL');

  // Métricas Derivadas Reais (Sem dados fictícios/mockados)
  const metrics = getGlobalMetrics();

  // Se um conceito estiver selecionado, exibe a página do conceito
  if (selectedConceptSlug) {
    const concept = getConceptBySlug(selectedConceptSlug);
    if (concept) {
      return (
        <ConceptView
          concept={concept}
          onBack={() => setSelectedConcept(null)}
        />
      );
    }
  }

  // Filtragem de conceitos da Seção 4
  const filteredConcepts = selectedCategory === 'ALL'
    ? CYBER_CONCEPTS_CATALOG
    : CYBER_CONCEPTS_CATALOG.filter(c => c.category === selectedCategory);

  // Conceito em destaque para "Continue Aprendendo" (Padrão: Subnetting / CIDR)
  const highlightedSlug = 'subnetting-cidr';
  const highlightedConcept = getConceptBySlug(highlightedSlug) || CYBER_CONCEPTS_CATALOG[0];
  const highlightedMastery = userMastery[highlightedSlug];

  return (
    <div className="space-y-12 max-w-6xl mx-auto font-sans text-zinc-200">

      {/* -------------------------------------------------------------------- */}
      {/* HERO SECTION                                                         */}
      {/* -------------------------------------------------------------------- */}
      <header className="space-y-4 border-b border-zinc-800/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 font-mono text-xs uppercase tracking-widest">
          <Brain className="w-3.5 h-3.5" /> Treine seus conhecimentos • Cyber Core
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          O que você domina de verdade?
        </h1>
        <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Aprenda conceitos fundamentais de Cybersecurity e Networking através de prática interativa, manipulação direta de cenários e revisão inteligente espaçada.
        </p>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 1: ESTADO DO APRENDIZADO (DADOS REAIS / ZERO MOCK)              */}
      {/* -------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Estado do Aprendizado
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card: Dominados */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-bold">
              Dominados
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {metrics.conceptsMasteredCount}
            </div>
            <p className="text-xs text-zinc-500">
              {metrics.conceptsMasteredCount === 0 ? 'Nenhum conceito consolidado ainda' : 'Retenção comprovada'}
            </p>
          </div>

          {/* Card: Em Desenvolvimento */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-bold">
              Em Desenvolvimento
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {metrics.conceptsDevelopingCount}
            </div>
            <p className="text-xs text-zinc-500">
              {metrics.conceptsDevelopingCount === 0 ? 'Nenhum módulo iniciado' : 'Em prática ativa'}
            </p>
          </div>

          {/* Card: Para Revisar */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block font-bold">
              Para Revisar
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {metrics.conceptsToReviewCount}
            </div>
            <p className="text-xs text-zinc-500">
              {metrics.conceptsToReviewCount === 0 ? 'Fila de revisão zerada' : 'Prioridade pedagógica'}
            </p>
          </div>

          {/* Card: Não Iniciados */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">
              Não Iniciados
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {metrics.conceptsNotStartedCount}
            </div>
            <p className="text-xs text-zinc-500">
              Disponíveis para estudo
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 2: CONTINUE APRENDENDO (CONCEITO EM DESTAQUE)                  */}
      {/* -------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Continue Aprendendo
        </h2>

        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-900/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-mono uppercase tracking-wider font-bold border border-cyan-800/60">
                {highlightedConcept.category}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Subnetting / CIDR
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              {highlightedConcept.title}
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              {highlightedConcept.shortDescription}
            </p>

            {/* Barra de Progresso Real */}
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Acurácia de Prática:</span>
                <strong className="text-cyan-400">{highlightedMastery?.accuracy || 0}%</strong>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all" 
                  style={{ width: `${highlightedMastery?.accuracy || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedConcept(highlightedSlug)}
              className="w-full md:w-auto px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              Continuar Prática <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 3: FILA DE REVISÃO (CONCEITOS PRIORITÁRIOS)                    */}
      {/* -------------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Fila de Revisão
            </h2>
            <p className="text-xs text-zinc-400">
              Conceitos que precisam voltar à sua memória antes que ocorra a curva de esquecimento.
            </p>
          </div>
        </div>

        {reviewQueue.length === 0 ? (
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-200">Sua fila de revisão está limpa</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Nenhum conceito pendente no momento. Continue praticando novos conceitos para calibrar sua retenção.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewQueue.map((item) => (
              <div 
                key={item.id}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                      {item.category}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      item.priority === 1 ? 'bg-red-950 text-red-300 border border-red-800' :
                      item.priority === 2 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-zinc-900 text-zinc-400'
                    }`}>
                      {item.reasonHumanLabel}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {item.conceptTitle}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedConcept(item.conceptSlug)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-cyan-900/60 text-cyan-300 hover:text-cyan-200 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors shrink-0"
                >
                  Revisar agora
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SEÇÃO 4: EXPLORAR CONCEITOS                                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Explorar Conceitos
            </h2>
            <p className="text-xs text-zinc-400">
              Navegue pelos fundamentos essenciais de cada domínio técnico.
            </p>
          </div>

          {/* Filtro de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-800 text-cyan-400 border border-cyan-800'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Conceitos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConcepts.map((concept) => {
            const mastery = userMastery[concept.slug];
            const state = mastery?.retentionState || 'NOT_STARTED';

            return (
              <div
                key={concept.id}
                className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-6 flex flex-col justify-between space-y-4 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
                      {concept.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                      state === 'MASTERED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      state === 'CONSOLIDATED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      state === 'IN_DEVELOPMENT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}>
                      {state === 'MASTERED' ? 'Dominado' :
                       state === 'CONSOLIDATED' ? 'Consolidado' :
                       state === 'IN_DEVELOPMENT' ? 'Em prática' : 'Não iniciado'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {concept.title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {concept.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Acurácia: <strong className="text-zinc-300">{mastery ? `${mastery.accuracy}%` : '—'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedConcept(concept.slug)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    Praticar <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
