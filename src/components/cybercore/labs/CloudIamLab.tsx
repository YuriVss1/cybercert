"use client";

import React, { useState } from 'react';
import { 
  Cloud, HelpCircle, 
  ArrowRight, ShieldCheck, ShieldAlert,
  Eye, Target, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface IamEvaluationCase {
  id: string;
  title: string;
  policyJson: string;
  requestPrompt: string;
  expectedDecision: 'ALLOW' | 'DENY';
  reason: string;
}

const IAM_CASES: IamEvaluationCase[] = [
  {
    id: 'case-least-privilege',
    title: 'Caso 1: Princípio do Menor Privilégio & Escopo de Recursos',
    policyJson: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDevS3Read",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": "arn:aws:s3:::dev-public-assets/*"
    }
  ]
}`,
    requestPrompt: 'A identidade (Principal) tenta executar "s3:GetObject" no bucket confidencial: "arn:aws:s3:::corporate-finance-salaries/payroll.csv". Qual será a decisão do mecanismo de autorização Cloud IAM?',
    expectedDecision: 'DENY',
    reason: 'Como o recurso solicitado (corporate-finance-salaries) não está contemplado no bloco Resource da política (que só libera dev-public-assets), o mecanismo de avaliação aplica o DENY IMPLÍCITO (Default Deny).'
  },
  {
    id: 'case-explicit-deny',
    title: 'Caso 2: Precedência de Explicit Deny (Negação Explícita)',
    policyJson: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllCompute",
      "Effect": "Allow",
      "Action": "ec2:*",
      "Resource": "*"
    },
    {
      "Sid": "DenyProductionTermination",
      "Effect": "Deny",
      "Action": "ec2:TerminateInstances",
      "Resource": "arn:aws:ec2:*:*:instance/i-prod-007"
    }
  ]
}`,
    requestPrompt: 'A identidade tenta executar "ec2:TerminateInstances" especificamente contra a instância "i-prod-007". Embora a primeira declaração dê "ec2:*", qual é a decisão final do IAM?',
    expectedDecision: 'DENY',
    reason: 'Regra de ouro em Cloud IAM: Um "Explicit Deny" SEMPRE sobrepõe e invalida qualquer "Allow", independentemente da ordem das declarações ou de outras políticas associadas.'
  },
  {
    id: 'case-mfa-condition',
    title: 'Caso 3: Avaliação de Condição de Segurança (MFA Context)',
    policyJson: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RequireMfaForProdWrite",
      "Effect": "Allow",
      "Action": "dynamodb:PutItem",
      "Resource": "arn:aws:dynamodb:*:*:table/Customers",
      "Condition": {
        "Bool": { "aws:MultiFactorAuthPresent": "true" }
      }
    }
  ]
}`,
    requestPrompt: 'A identidade autenticou-se usando apenas usuário e senha (SEM MFA) e tenta executar "dynamodb:PutItem" na tabela Customers. Qual será a decisão do IAM?',
    expectedDecision: 'DENY',
    reason: 'A cláusula Condition exige "aws:MultiFactorAuthPresent: true". Como a requisição não possui contexto de MFA ativo, a condição avalia como Falsa, caindo no Deny Implícito.'
  }
];

export default function CloudIamLab({
  concept,
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

  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [userDecisions, setUserDecisions] = useState<Record<string, 'ALLOW' | 'DENY' | null>>({});
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const currentCase = IAM_CASES[activeCaseIdx];
  const userChoice = userDecisions[currentCase.id];

  const handleSelectDecision = (decision: 'ALLOW' | 'DENY') => {
    if (isFinalized) return;
    setUserDecisions(prev => ({ ...prev, [currentCase.id]: decision }));
    setFeedback(null);
  };

  const handleValidateDecision = () => {
    if (!userChoice) return;

    const isCorrect = userChoice === currentCase.expectedDecision;

    onRecordAttempt({
      challengeId: `cloud-iam-${currentCase.id}`,
      challengeType: 'CLASSIFY',
      isCorrect,
      confidence,
      durationMs: 5500,
      submittedAnswer: { caseId: currentCase.id, decision: userChoice },
      feedbackGiven: isCorrect ? 'Avaliação da política IAM correta.' : 'Decisão de política IAM divergente.'
    });

    if (mode === 'exam') {
      setIsFinalized(true);
      setFeedback({
        isCorrect,
        message: isCorrect
          ? `Correto! Decisão: ${currentCase.expectedDecision}.`
          : 'Avaliação registrada para análise.'
      });
    } else {
      setFeedback({
        isCorrect,
        message: isCorrect
          ? `Correto! Decisão: ${currentCase.expectedDecision}. Motivo: ${currentCase.reason}`
          : `Decisão Incorreta. A resposta correta era ${currentCase.expectedDecision}. Motivo: ${currentCase.reason}`
      });

      const allCorrect = IAM_CASES.every(c => {
        if (c.id === currentCase.id) return isCorrect;
        return userDecisions[c.id] === c.expectedDecision;
      });

      if (allCorrect) {
        setIsFinalized(true);
        onCompleteStage(activeStage);
      }
    }
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow(`cloud-iam-${currentCase.id}`, 'CLASSIFY');
    }
    setFeedback({
      isCorrect: false,
      message: `Marcado como "Não sei". Explicação: ${currentCase.reason}`
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica de ouro em IAM: 1. Qualquer Explicit Deny anula tudo; 2. Se houver Explicit Allow, permite; 3. Caso contrário, cai em Default Deny.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Verifique atentamente se a ação e o recurso solicitado batem exatamente com as cláusulas Action e Resource da política.'
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
  const canRevealHint = mode === 'practice' && feedback && !feedback.isCorrect && !showHintRevealed;

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-bold border flex items-center gap-1.5 ${modeBadge.bg} ${modeBadge.color}`}>
            <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Cloud className="w-5 h-5 text-cyan-400" />
          Avaliador de Políticas de Cloud IAM (JSON Policies)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Simule o motor de autorização da nuvem. Aplique a lógica de precedência: <strong>Explicit Deny &gt; Explicit Allow &gt; Default Deny</strong> em cenários reais de permissão.
        </p>

        {mode === 'guided' && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* Navegador de Casos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {IAM_CASES.map((c, idx) => {
          const isSelected = activeCaseIdx === idx;
          const userStatus = userDecisions[c.id];

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setActiveCaseIdx(idx); setFeedback(null); setShowHintRevealed(false); }}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isSelected 
                  ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span>Caso {idx + 1}</span>
              {userStatus && (
                <span className={`text-[10px] px-1.5 rounded font-bold ${
                  userStatus === 'ALLOW' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'
                }`}>
                  {userStatus}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detalhe do Caso: Política JSON & Requisição */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            {currentCase.title}
          </span>
          <pre className="mt-3 p-4 rounded-xl bg-black border border-zinc-800 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            {currentCase.policyJson}
          </pre>
        </div>

        {/* Requisição do Usuário */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
            Requisição em Avaliação:
          </span>
          <p className="text-xs text-white font-mono leading-relaxed">
            {currentCase.requestPrompt}
          </p>
        </div>

        {/* Seletor de Decisão (ALLOW vs DENY) */}
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
            Qual será a decisão do mecanismo de autorização Cloud IAM?
          </span>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isFinalized}
              onClick={() => handleSelectDecision('ALLOW')}
              className={`p-4 rounded-xl border font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                userChoice === 'ALLOW'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900 border-zinc-800 hover:border-emerald-800 text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ALLOW (Permitir Acesso)
            </button>

            <button
              type="button"
              disabled={isFinalized}
              onClick={() => handleSelectDecision('DENY')}
              className={`p-4 rounded-xl border font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                userChoice === 'DENY'
                  ? 'bg-red-950 border-red-500 text-red-300 ring-2 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-zinc-900 border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-red-400" />
              DENY (Bloquear Acesso)
            </button>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'CONFIDENT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' : 'text-zinc-500'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'HESITANT' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'text-zinc-500'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex items-center gap-3">
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
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={!userChoice || isFinalized}
              onClick={handleValidateDecision}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Avaliar Decisão <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback da Decisão */}
      {feedback && (
        <section className={`p-6 rounded-xl border space-y-3 font-mono text-xs ${
          feedback.isCorrect 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {feedback.isCorrect ? 'Decisão de Governança Correta' : (mode === 'exam' ? 'Avaliação Registrada' : 'Decisão de IAM Incorreta')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                Em arquiteturas AWS/Cloud IAM, o mecanismo de avaliação segue uma ordem estrita: se houver qualquer negação explícita (Explicit Deny), ela tem precedência absoluta sobre todos os allows. Qualquer requisição sem um allow explícito sofre Default Deny implícito.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
