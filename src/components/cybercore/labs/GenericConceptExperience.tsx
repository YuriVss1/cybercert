"use client";

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight, Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

// ============================================================================
// NORMALIZAÇÃO E VALIDAÇÃO DE RESPOSTAS
// ============================================================================

/**
 * Normaliza uma string para comparação tolerante.
 * Remove acentuação, normaliza espaços, converte para lowercase,
 * remove pontuação irrelevante.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacríticos (acentos)
    .replace(/[.,;:!?()[\]{}'"]/g, '')  // Remove pontuação
    .replace(/\s+/g, ' ')              // Normaliza espaços múltiplos
    .trim();
}

/**
 * Remove artigos e preposições comuns (PT-BR / EN) que não alteram o significado técnico.
 */
export function stripFillers(normalized: string): string {
  const fillers = /\b(o|a|os|as|um|uma|uns|umas|do|da|dos|das|de|no|na|nos|nas|em|por|para|the|an?|of|in|for|to)\b/g;
  return normalized.replace(fillers, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Valida resposta textual com tolerância controlada.
 * 
 * Ordem de verificação:
 * 1. acceptedAnswers — lista explícita de respostas válidas
 * 2. requiredTerms — todos os termos essenciais devem estar presentes
 * 3. Match normalizado direto contra expectedAnswer
 * 4. Match sem fillers (artigos/preposições)
 * 5. Tokens essenciais
 * 
 * NÃO aceita substrings arbitrárias.
 */
export function validateTextAnswer(
  userInput: string,
  expected: string,
  config?: Record<string, unknown>
): boolean {
  const normalUser = normalizeAnswer(userInput);
  if (!normalUser) return false;

  // 1. Lista explícita de respostas aceitas
  const acceptedAnswers = config?.acceptedAnswers;
  if (Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0) {
    return acceptedAnswers.some(
      (acc: unknown) => normalizeAnswer(String(acc)) === normalUser
    );
  }

  // 2. Termos obrigatórios
  const requiredTerms = config?.requiredTerms;
  if (Array.isArray(requiredTerms) && requiredTerms.length > 0) {
    const userWords = new Set(normalUser.split(' '));
    return requiredTerms.every(
      (term: unknown) => {
        const normalTerm = normalizeAnswer(String(term));
        // Cada termo pode ser multi-word; verifica se está contido
        return normalUser.includes(normalTerm) || userWords.has(normalTerm);
      }
    );
  }

  // 3. Match direto normalizado
  const normalExpected = normalizeAnswer(expected);
  if (normalUser === normalExpected) return true;

  // 4. Match sem fillers (artigos/preposições removidos de ambos os lados)
  const strippedUser = stripFillers(normalUser);
  const strippedExpected = stripFillers(normalExpected);
  if (strippedUser === strippedExpected) return true;

  // 5. Resposta do usuário contém todos os tokens essenciais da expected (sem fillers)
  const expectedTokens = strippedExpected.split(' ').filter(w => w.length > 1);
  if (expectedTokens.length > 0 && expectedTokens.length <= 4) {
    const userTokens = new Set(strippedUser.split(' '));
    if (expectedTokens.every(t => userTokens.has(t))) return true;
  }

  return false;
}

// ============================================================================
// GERAÇÃO DE MÚLTIPLA ESCOLHA
// ============================================================================

export function buildMultipleChoiceOptions(
  challenge: { config?: Record<string, unknown>; solution?: Record<string, unknown> }
): string[] {
  // Opções explícitas no config
  const configOptions = challenge.config?.options;
  if (Array.isArray(configOptions) && configOptions.length >= 2) {
    return configOptions.map(String);
  }

  // Distratores explícitos + resposta correta
  const expected = String(challenge.solution?.expectedAnswer || '').trim();
  const distractors = challenge.config?.distractors;
  if (expected && Array.isArray(distractors) && distractors.length >= 1) {
    return shuffleArray([expected, ...distractors.map(String)]);
  }

  return []; // Sem dados para múltipla escolha → usa input de texto
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const STAGE_MODE_CONFIG = {
  guided: {
    icon: Eye,
    label: 'Exploração Guiada',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60 border-emerald-800',
    desc: 'Observe o conceito e explore com apoio total. Dicas e explicações estão disponíveis.',
    showHintInitially: true,
    allowRevealHint: true,
    showExplanationBeforeAttempt: true,
    showFeedbackDuringAttempt: true,
    showCorrectAnswerOnError: true,
  },
  practice: {
    icon: Target,
    label: 'Prática com Apoio',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/60 border-cyan-800',
    desc: 'Aplique o conceito. Dicas ficarão disponíveis após erro.',
    showHintInitially: false,
    allowRevealHint: true,      // Após erro
    showExplanationBeforeAttempt: false,
    showFeedbackDuringAttempt: true,
    showCorrectAnswerOnError: false, // Permite nova tentativa
  },
  exam: {
    icon: ShieldAlert,
    label: 'Avaliação Sem Auxílio',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60 border-amber-800',
    desc: 'Comprove seu domínio. Sem dicas, sem explicações durante a resolução.',
    showHintInitially: false,
    allowRevealHint: false,
    showExplanationBeforeAttempt: false,
    showFeedbackDuringAttempt: false, // Feedback mínimo
    showCorrectAnswerOnError: false,
  },
} as const;

export default function GenericConceptExperience({
  concept,
  activeStage,
  stageMode = 'practice',
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const challenges = concept.challenges || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false); // Debrief do modo exam
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'did_not_know' | 'registered' | null;
    message: string;
  }>({ type: null, message: '' });

  const currentChallenge = challenges[currentIdx];
  const modeConfig = STAGE_MODE_CONFIG[stageMode];
  const ModeIcon = modeConfig.icon;

  const multipleChoiceOptions = useMemo(() => {
    if (!currentChallenge) return [];
    return buildMultipleChoiceOptions(currentChallenge);
  }, [currentChallenge]);

  const isMultipleChoice = multipleChoiceOptions.length >= 2;
  const expectedAnswer = String(currentChallenge?.solution?.expectedAnswer || '').trim();

  // Controle de dicas
  const hintText = currentChallenge?.hint || '';
  const showHint = hintText && (
    modeConfig.showHintInitially ||
    (modeConfig.allowRevealHint && showHintRevealed)
  );
  const canRevealHint = hintText && !modeConfig.showHintInitially && modeConfig.allowRevealHint && hasAttempted && !showHintRevealed;

  // Controle de explicação pré-tentativa (apenas guided)
  const showPreExplanation = modeConfig.showExplanationBeforeAttempt && currentChallenge?.pedagogicalExplanation;

  const handleEvaluate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentChallenge) return;

    const userChoice = isMultipleChoice ? selectedOption || '' : userAnswer;
    const isCorrect = isMultipleChoice
      ? userChoice === expectedAnswer
      : validateTextAnswer(userChoice, expectedAnswer, currentChallenge.config);

    setHasAttempted(true);

    onRecordAttempt({
      challengeId: currentChallenge.id,
      challengeType: currentChallenge.type,
      isCorrect,
      confidence,
      durationMs: 4000,
      submittedAnswer: userChoice,
      feedbackGiven: isCorrect
        ? currentChallenge.pedagogicalExplanation
        : 'Resposta requer ajuste conceitual.'
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: currentChallenge.pedagogicalExplanation || 'Resposta correta! Conceito aplicado com precisão.'
      });
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (stageMode === 'exam') {
      // Modo exam: feedback mínimo durante tentativa
      setFeedback({
        type: 'registered',
        message: 'Resposta registrada.'
      });
      setIsFinalized(true);
    } else {
      // Guided e practice: feedback pedagógico
      const hintMsg = stageMode === 'guided' && currentChallenge.hint
        ? `Pista: ${currentChallenge.hint}`
        : 'Reveja a fundamentação teórica e tente novamente.';

      setFeedback({
        type: 'error',
        message: hintMsg
      });
    }
  };

  const handleDontKnow = () => {
    if (!currentChallenge) return;
    onDidNotKnow(currentChallenge.id, currentChallenge.type);
    setFeedback({
      type: 'did_not_know',
      message: `Marcado como "Não sei". O conceito foi incluído com prioridade máxima na sua Fila de Revisão.${
        stageMode !== 'exam' && currentChallenge.pedagogicalExplanation
          ? ` Explicação: ${currentChallenge.pedagogicalExplanation}`
          : ''
      }`
    });
    setIsFinalized(true);
  };

  const handleNextChallenge = () => {
    setUserAnswer('');
    setSelectedOption(null);
    setFeedback({ type: null, message: '' });
    setHasAttempted(false);
    setShowHintRevealed(false);
    setIsFinalized(false);
    setCurrentIdx((prev) => Math.min(prev + 1, challenges.length - 1));
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setUserAnswer('');
    setFeedback({ type: null, message: '' });
  };

  return (
    <div className="space-y-6 font-mono text-zinc-200">
      {/* Banner de Modo Pedagógico */}
      <div className="cockpit-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded border ${modeConfig.bg} ${modeConfig.color}`}>
              <ModeIcon className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold block ${modeConfig.color}`}>
                {modeConfig.label}
              </span>
              <p className="text-xs text-zinc-400 font-sans">{modeConfig.desc}</p>
            </div>
          </div>

          {challenges.length > 0 && (
            <span className="telemetry-chip text-zinc-400 shrink-0">
              DESAFIO {currentIdx + 1} DE {challenges.length}
            </span>
          )}
        </div>

        {/* Dica visível (guided) ou revelada (practice após erro) */}
        {showHint && (
          <div className="cockpit-subcard p-3 border-emerald-800/40 bg-emerald-950/20">
            <p className="text-xs text-emerald-300 flex items-start gap-2 font-sans">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
              <span><strong className="font-mono uppercase text-[10px] tracking-wider text-emerald-200">Dica:</strong> {hintText}</span>
            </p>
          </div>
        )}

        {/* Explicação prévia (apenas guided) */}
        {showPreExplanation && !isFinalized && (
          <div className="cockpit-subcard p-3 border-cyan-800/40 bg-cyan-950/20">
            <p className="text-xs text-cyan-300 leading-relaxed font-sans">
              <strong className="font-mono uppercase text-[10px] tracking-wider block mb-1 text-cyan-200">Orientação:</strong>
              {currentChallenge?.pedagogicalExplanation}
            </p>
          </div>
        )}
      </div>

      {currentChallenge ? (
        <section className="cockpit-card p-6 md:p-7 space-y-5">
          {/* Prompt do desafio */}
          <div className="space-y-2 border-b border-zinc-800/80 pb-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              <span className="telemetry-chip text-zinc-400">TIPO: {currentChallenge.type}</span>
              <span className="telemetry-chip text-zinc-400">NÍVEL: {currentChallenge.level}</span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white leading-relaxed font-sans">
              {currentChallenge.prompt}
            </h3>
          </div>

          {/* ÁREA DE RESPOSTA */}
          {isMultipleChoice ? (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                Selecione a resposta correta:
              </label>
              {multipleChoiceOptions.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === option;
                const isRevealed = isFinalized;
                const isCorrectOption = option === expectedAnswer;

                let optionStyle = isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-sm shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'cockpit-subcard hover:border-zinc-700/80 border-transparent';

                let letterStyle = isSelected
                  ? 'bg-cyan-500 text-zinc-950 font-black border-cyan-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800';

                // Revelar respostas apenas quando finalizado (e quando o modo permite)
                if (isRevealed && (stageMode !== 'exam' || feedback.type === 'success')) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50';
                    letterStyle = 'bg-emerald-500 text-zinc-950 font-black border-emerald-400';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = 'bg-red-950/40 border-red-500/60 opacity-70';
                    letterStyle = 'bg-red-500 text-white font-black border-red-400';
                  } else {
                    optionStyle = 'bg-zinc-950/60 border-zinc-900 opacity-40';
                    letterStyle = 'bg-zinc-900 text-zinc-600 border-zinc-900';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => !isFinalized && setSelectedOption(option)}
                    className={`p-3.5 rounded border ${!isFinalized ? 'cursor-pointer' : ''} transition-all ${optionStyle}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-7 h-7 rounded border flex items-center justify-center font-mono text-xs shrink-0 transition-colors ${letterStyle}`}>
                        {letter}
                      </div>
                      <span className={`text-xs md:text-sm leading-relaxed pt-1 font-sans ${isSelected || (isRevealed && isCorrectOption) ? 'text-white font-medium' : 'text-zinc-300'}`}>
                        {option}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
                  {(currentChallenge.config?.inputLabel as string) || 'Informe sua resposta:'}
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isFinalized}
                  placeholder={(currentChallenge.config?.placeholder as string) || 'Digite a resposta...'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                  Variações de acentuação, capitalização e artigos são toleradas.
                </p>
              </div>
            </form>
          )}

          {/* Ações: Confiança + Botões */}
          {!isFinalized && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Confiança:</span>
                <button type="button" onClick={() => setConfidence('CONFIDENT')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    confidence === 'CONFIDENT'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 font-bold'
                      : 'avionics-button text-zinc-400'}`}>
                  Certeza
                </button>
                <button type="button" onClick={() => setConfidence('HESITANT')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    confidence === 'HESITANT'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                      : 'avionics-button text-zinc-400'}`}>
                  Dúvida
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botão revelar dica (practice, após erro) */}
                {canRevealHint && (
                  <button type="button" onClick={() => setShowHintRevealed(true)}
                    className="avionics-button text-amber-300 border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 text-xs uppercase">
                    <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
                  </button>
                )}

                <button type="button" onClick={handleDontKnow}
                  className="avionics-button text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 text-xs uppercase">
                  <HelpCircle className="w-3.5 h-3.5" /> Não sei
                </button>

                <button type="button" onClick={() => handleEvaluate()}
                  disabled={isMultipleChoice ? !selectedOption : !userAnswer.trim()}
                  className="avionics-primary text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  Validar Resposta <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="cockpit-card p-6 text-center space-y-3 font-mono text-xs text-zinc-400">
          <p>Este conceito possui fundamentação teórica consolidada na etapa &quot;Aprender&quot;.</p>
          <button type="button" onClick={() => onCompleteStage('practice')}
            className="avionics-button text-zinc-200 text-xs uppercase">
            Concluir Fixação do Módulo
          </button>
        </div>
      )}

      {/* FEEDBACK */}
      {feedback.type && (
        <div className={`cockpit-card p-4 space-y-2 transition-all ${
          feedback.type === 'success' ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
          : feedback.type === 'did_not_know' ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200'
          : feedback.type === 'registered' ? 'border-zinc-700 bg-zinc-950/80 text-zinc-300'
          : 'border-amber-500/50 bg-amber-950/20 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              : <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            }
            <span className="text-xs font-mono uppercase font-bold tracking-wider block">
              {feedback.type === 'success' ? 'Correto!'
               : feedback.type === 'did_not_know' ? 'Reforço Agendado'
               : feedback.type === 'registered' ? 'Resposta Registrada'
               : 'Orientação Pedagógica'}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs md:text-sm font-sans leading-relaxed">{feedback.message}</p>

            {/* Debrief do modo exam: mostra explicação somente após finalização */}
            {stageMode === 'exam' && isFinalized && feedback.type !== 'success' && currentChallenge?.pedagogicalExplanation && (
              <div className="cockpit-subcard p-3 border-zinc-800 bg-zinc-950/80">
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1">Debrief:</p>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">{currentChallenge.pedagogicalExplanation}</p>
                {expectedAnswer && (
                  <p className="text-xs text-cyan-400 font-mono mt-1.5">
                    Resposta esperada: <strong>{expectedAnswer}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Ações pós-feedback */}
            <div className="flex items-center gap-3 pt-1">
              {/* Nova tentativa (guided/practice, após erro) */}
              {feedback.type === 'error' && !isFinalized && (
                <button type="button" onClick={handleRetry}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  Tentar novamente →
                </button>
              )}
              {/* Avançar para próximo desafio */}
              {isFinalized && currentIdx < challenges.length - 1 && (
                <button type="button" onClick={handleNextChallenge}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  Avançar para o próximo desafio →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
