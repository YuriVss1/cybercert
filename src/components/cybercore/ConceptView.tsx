"use client";

import React from 'react';
import { 
  ArrowLeft, BookOpen, Eye, Target, CheckCircle2, ShieldCheck, 
  Calendar, RotateCcw, Award, Layers, ChevronRight, Clock, RefreshCw
} from 'lucide-react';
import type { CyberConcept, ConceptViewStage } from '@/lib/cyberCore/cyberCoreTypes';
import { useCyberCoreStore } from '@/stores/cyberCoreStore';
import { getConceptExperience } from '@/lib/cyberCore/experienceRegistry';

interface ConceptViewProps {
  concept: CyberConcept;
  onBack: () => void;
}

export default function ConceptView({ concept, onBack }: ConceptViewProps) {
  const { 
    activeStage, 
    setActiveStage, 
    completeStageProgress, 
    getConceptMastery, 
    recordAttempt, 
    recordDidNotKnow,
    resolveReviewItem 
  } = useCyberCoreStore();

  const mastery = getConceptMastery(concept.slug);

  // O ciclo de vida oficial do Cyber Core:
  // APRENDER → INTERAGIR → PRATICAR → TESTAR → DOMINAR → REVISAR
  const stages: { id: ConceptViewStage; label: string; icon: React.ReactNode }[] = [
    { id: 'learn', label: '1. Aprender', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'interact', label: '2. Interagir', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'practice', label: '3. Praticar', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'test', label: '4. Testar', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'mastery', label: '5. Dominar', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'review', label: '6. Revisar', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  ];

  // Resolve dinamicamente o componente de experiência registrado no Registry (sem hardcoded if-else)
  const ExperienceComponent = getConceptExperience(concept.slug);

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Barra de Topo com Navegação de Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
            title="Voltar para o Catálogo do Cyber Core"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                {concept.category}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] font-mono text-zinc-500 uppercase">
                {concept.level}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              {concept.title}
            </h1>
          </div>
        </div>

        {/* Status de Domínio Real */}
        <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Estado</span>
            <strong className="text-cyan-400">
              {mastery?.retentionState === 'MASTERED' ? 'Dominado' :
               mastery?.retentionState === 'CONSOLIDATED' ? 'Consolidado' :
               mastery?.retentionState === 'IN_DEVELOPMENT' ? 'Em desenvolvimento' : 'Não iniciado'}
            </strong>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Acurácia</span>
            <strong className="text-white">{mastery ? `${mastery.accuracy}%` : '—'}</strong>
          </div>
        </div>
      </div>

      {/* Stepper de Fases de Aprendizagem Oficial */}
      <nav className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {stages.map((stg) => {
          const isActive = activeStage === stg.id;
          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => setActiveStage(stg.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              {stg.icon}
              {stg.label}
            </button>
          );
        })}
      </nav>

      {/* Conteúdo Dinâmico por Fase */}
      <div className="space-y-6">
        
        {/* FASE 1: APRENDER */}
        {activeStage === 'learn' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                Fundamentação Teórica Direta
              </span>
              <h2 className="text-xl font-bold text-white">
                Como Funciona o Conceito Técnico
              </h2>
              <p className="text-sm leading-relaxed text-zinc-300">
                {concept.learningContent.overview}
              </p>
            </div>

            {/* Pontos-Chave */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-4">
              <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                Regras Essenciais:
              </h3>
              <ul className="space-y-2">
                {concept.learningContent.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparação Visual (se existir) */}
            {concept.learningContent.visualComparison && (
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase text-[10px] block">
                    {concept.learningContent.visualComparison.beforeLabel}
                  </span>
                  <div className="text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    {concept.learningContent.visualComparison.beforeValue}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-cyan-400 uppercase text-[10px] block font-bold">
                    {concept.learningContent.visualComparison.afterLabel}
                  </span>
                  <div className="text-cyan-200 bg-cyan-950/40 p-2.5 rounded border border-cyan-800/50">
                    {concept.learningContent.visualComparison.afterValue}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  completeStageProgress(concept.slug, 'learn');
                  setActiveStage('interact');
                }}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Prosseguir para Interação <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FASE 2: INTERAGIR / VER */}
        {activeStage === 'interact' && (
          <div className="space-y-6">
            <ExperienceComponent
              concept={concept}
              activeStage="interact"
              userId="local-operator"
              onCompleteStage={(stg) => completeStageProgress(concept.slug, stg as 'learn' | 'interact' | 'practice' | 'test')}
              onRecordAttempt={(payload) => recordAttempt({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId: payload.challengeId,
                challengeType: payload.challengeType,
                isCorrect: payload.isCorrect,
                confidence: payload.confidence,
                durationMs: payload.durationMs,
                submittedAnswer: payload.submittedAnswer as Record<string, unknown> | string | number,
                feedbackGiven: payload.feedbackGiven
              })}
              onDidNotKnow={(challengeId, challengeType) => recordDidNotKnow({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId,
                challengeType,
                durationMs: 4000
              })}
            />

            <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveStage('learn')}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono uppercase"
              >
                ← Voltar para Teoria
              </button>
              <button
                type="button"
                onClick={() => {
                  completeStageProgress(concept.slug, 'interact');
                  setActiveStage('practice');
                }}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all"
              >
                Iniciar Prática <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FASE 3: PRATICAR */}
        {activeStage === 'practice' && (
          <div className="space-y-6">
            <ExperienceComponent
              concept={concept}
              activeStage="practice"
              userId="local-operator"
              onCompleteStage={(stg) => completeStageProgress(concept.slug, stg as 'learn' | 'interact' | 'practice' | 'test')}
              onRecordAttempt={(payload) => recordAttempt({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId: payload.challengeId,
                challengeType: payload.challengeType,
                isCorrect: payload.isCorrect,
                confidence: payload.confidence,
                durationMs: payload.durationMs,
                submittedAnswer: payload.submittedAnswer as Record<string, unknown> | string | number,
                feedbackGiven: payload.feedbackGiven
              })}
              onDidNotKnow={(challengeId, challengeType) => recordDidNotKnow({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId,
                challengeType,
                durationMs: 4000
              })}
            />

            <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveStage('interact')}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono uppercase"
              >
                ← Voltar para Interação
              </button>
              <button
                type="button"
                onClick={() => {
                  completeStageProgress(concept.slug, 'practice');
                  setActiveStage('test');
                }}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all"
              >
                Iniciar Teste <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FASE 4: TESTAR */}
        {activeStage === 'test' && (
          <div className="space-y-6">
            <ExperienceComponent
              concept={concept}
              activeStage="test"
              userId="local-operator"
              onCompleteStage={(stg) => {
                completeStageProgress(concept.slug, stg as 'learn' | 'interact' | 'practice' | 'test');
                setActiveStage('mastery');
              }}
              onRecordAttempt={(payload) => recordAttempt({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId: payload.challengeId,
                challengeType: payload.challengeType,
                isCorrect: payload.isCorrect,
                confidence: payload.confidence,
                durationMs: payload.durationMs,
                submittedAnswer: payload.submittedAnswer as Record<string, unknown> | string | number,
                feedbackGiven: payload.feedbackGiven
              })}
              onDidNotKnow={(challengeId, challengeType) => recordDidNotKnow({
                userId: 'local-operator',
                conceptSlug: concept.slug,
                challengeId,
                challengeType,
                durationMs: 4000
              })}
            />
          </div>
        )}

        {/* FASE 5: DOMINAR */}
        {activeStage === 'mastery' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <div className="w-12 h-12 bg-cyan-950/80 border border-cyan-600 rounded-full flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Status de Domínio & Evidências
              </h2>
              <p className="text-xs text-zinc-400">
                O CyberCert calcula seu domínio com base em consistência e diversidade de desafios, programando revisões espaçadas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto font-mono text-xs">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
                <span className="text-zinc-500 uppercase text-[10px]">Acurácia Consolidada</span>
                <strong className="text-cyan-400 text-lg block">{mastery?.accuracy || 0}%</strong>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
                <span className="text-zinc-500 uppercase text-[10px]">Desafios Dominados</span>
                <strong className="text-white text-lg block">{mastery?.challengeDiversityCount || 0}/3</strong>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
                <span className="text-zinc-500 uppercase text-[10px]">Próxima Revisão</span>
                <strong className="text-emerald-400 text-lg block">
                  {mastery?.nextReviewAt ? new Date(mastery.nextReviewAt).toLocaleDateString('pt-BR') : 'Hoje'}
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveStage('review')}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Acessar Ciclo de Revisão →
              </button>
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Voltar para o Catálogo
              </button>
            </div>
          </div>
        )}

        {/* FASE 6: REVISAR (PARTE OFICIAL DO LIFECYCLE) */}
        {activeStage === 'review' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2.5 bg-cyan-950/80 border border-cyan-800 rounded-lg text-cyan-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  Ciclo de Repetição Espaçada
                </span>
                <h2 className="text-lg font-bold text-white">
                  Plano de Retenção Contínua
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                <span className="text-zinc-500 uppercase text-[10px] block">Intervalo Atual de Espaçamento</span>
                <div className="text-xl font-bold text-white">
                  {mastery?.reviewIntervalDays || 1} dia(s)
                </div>
                <p className="text-zinc-400 font-sans text-xs">
                  Cada acerto com confiança expande o intervalo (1d → 3d → 7d → 14d → 30d). Erros ou "Não sei" retornam para reforço diário.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                <span className="text-zinc-500 uppercase text-[10px] block">Data Programada</span>
                <div className="text-xl font-bold text-emerald-400">
                  {mastery?.nextReviewAt ? new Date(mastery.nextReviewAt).toLocaleDateString('pt-BR') : 'Revisão Imediata'}
                </div>
                <p className="text-zinc-400 font-sans text-xs">
                  Quando a data for atingida, o conceito ganha prioridade na sua Fila de Revisão central.
                </p>
              </div>
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-900/40 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Deseja reforçar este conceito agora?</h4>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  Realize uma sessão de prática para recalibrar seu intervalo e consolidar a memória.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resolveReviewItem(concept.slug);
                  setActiveStage('practice');
                }}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition-all shrink-0"
              >
                Praticar Agora
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
