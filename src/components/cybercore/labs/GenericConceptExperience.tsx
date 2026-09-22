"use client";

import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

export default function GenericConceptExperience({
  concept,
  activeStage,
  userId = 'local-user',
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const challenges = concept.challenges || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'did_not_know' | null;
    message: string;
  }>({ type: null, message: '' });

  const currentChallenge = challenges[currentIdx];

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChallenge) return;

    const expected = (currentChallenge.solution?.expectedAnswer as string || '').toLowerCase().trim();
    const cleanAnswer = userAnswer.toLowerCase().trim();
    const isCorrect = cleanAnswer === expected || (expected.length > 0 && cleanAnswer.includes(expected));

    onRecordAttempt({
      challengeId: currentChallenge.id,
      challengeType: currentChallenge.type,
      isCorrect,
      confidence,
      durationMs: 4000,
      submittedAnswer: userAnswer,
      feedbackGiven: isCorrect 
        ? currentChallenge.pedagogicalExplanation 
        : 'Resposta requer ajuste conceitual.'
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: currentChallenge.pedagogicalExplanation || 'Resposta correta! Conceito aplicado com precisão.'
      });
      onCompleteStage(activeStage);
    } else {
      setFeedback({
        type: 'error',
        message: currentChallenge.hint 
          ? `Pista pedagógica: ${currentChallenge.hint}` 
          : 'Reveja a fundamentação teórica deste conceito e tente novamente.'
      });
    }
  };

  const handleDontKnow = () => {
    if (!currentChallenge) return;
    onDidNotKnow(currentChallenge.id, currentChallenge.type);
    setFeedback({
      type: 'did_not_know',
      message: `Marcado como "Não sei". O conceito foi incluído com prioridade máxima na sua Fila de Revisão. Explicação: ${currentChallenge.pedagogicalExplanation || ''}`
    });
  };

  const handleNextChallenge = () => {
    setUserAnswer('');
    setFeedback({ type: null, message: '' });
    setCurrentIdx((prev) => Math.min(prev + 1, challenges.length - 1));
  };

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* Banner de Identificação Transparente */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-950/60 border border-cyan-800 rounded-lg text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              Fixação Conceitual (Active Retrieval)
            </span>
            <p className="text-xs text-zinc-400">
              Desafio de recuperação ativa e correlação de fundamentos técnicos.
            </p>
          </div>
        </div>

        {challenges.length > 0 && (
          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
            Desafio {currentIdx + 1} de {challenges.length}
          </span>
        )}
      </div>

      {currentChallenge ? (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              <span>Tipo: {currentChallenge.type}</span>
              <span>•</span>
              <span>Nível: {currentChallenge.level}</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
              {currentChallenge.prompt}
            </h3>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                {currentChallenge.config?.inputLabel as string || 'Informe sua resposta técnica:'}
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={currentChallenge.config?.placeholder as string || 'Digite a resposta...'}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Confiança */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Confiança:</span>
                <button
                  type="button"
                  onClick={() => setConfidence('CONFIDENT')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
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
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
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
                  onClick={handleDontKnow}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Não sei
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
                >
                  Validar Resposta <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Feedback */}
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
                <p className="text-xs md:text-sm leading-relaxed">{feedback.message}</p>
                {feedback.type === 'success' && currentIdx < challenges.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextChallenge}
                    className="mt-2 text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Avançar para o próximo desafio →
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center space-y-3 font-mono text-xs text-zinc-400">
          <p>Este conceito possui fundamentação teórica consolidada na etapa &quot;Aprender&quot;.</p>
          <button
            type="button"
            onClick={() => onCompleteStage('practice')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs"
          >
            Concluir Fixação do Módulo
          </button>
        </div>
      )}
    </div>
  );
}
