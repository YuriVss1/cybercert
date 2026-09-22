"use client";

import React, { useState } from 'react';
import { 
  Cloud, HelpCircle, 
  ArrowRight, ShieldCheck, ShieldAlert
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [userDecisions, setUserDecisions] = useState<Record<string, 'ALLOW' | 'DENY' | null>>({});
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const currentCase = IAM_CASES[activeCaseIdx];
  const userChoice = userDecisions[currentCase.id];

  const handleSelectDecision = (decision: 'ALLOW' | 'DENY') => {
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

    setFeedback({
      isCorrect,
      message: isCorrect
        ? `Correto! Decisão: ${currentCase.expectedDecision}. Motivo: ${currentCase.reason}`
        : `Decisão Incorreta. A resposta correta era ${currentCase.expectedDecision}. Motivo: ${currentCase.reason}`
    });

    // Se completou todos
    const allCorrect = IAM_CASES.every(c => {
      if (c.id === currentCase.id) return isCorrect;
      return userDecisions[c.id] === c.expectedDecision;
    });

    if (allCorrect) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow(`cloud-iam-${currentCase.id}`, 'CLASSIFY');
    setFeedback({
      isCorrect: false,
      message: `Marcado como "Não sei". Explicação: ${currentCase.reason}`
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-cyan-800/60">
            Laboratório Interativo • CLASSIFY
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Cloud className="w-5 h-5 text-cyan-400" />
          Avaliação de Políticas Cloud IAM & Menor Privilégio
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Classifique o resultado de requisições de API na nuvem analisando declarações de políticas JSON (Principal, Action, Resource, Effect e Condition). Compreenda o impacto do Explicit Deny e Default Deny.
        </p>
      </section>

      {/* Seletor de Casos */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          {IAM_CASES.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setActiveCaseIdx(idx); setFeedback(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeCaseIdx === idx 
                  ? 'bg-cyan-500 text-black shadow' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Caso {idx + 1}
            </button>
          ))}
        </div>

        {/* Snippet da Política */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
              Documento de Política IAM (JSON):
            </span>
            <span className="text-[11px] font-mono text-zinc-500">{currentCase.title}</span>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {currentCase.policyJson}
          </pre>
        </div>

        {/* Requisição a ser Julgada */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold block">
            Cenário de Acesso de API:
          </span>
          <p className="text-xs md:text-sm text-white font-sans leading-relaxed">
            {currentCase.requestPrompt}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelectDecision('ALLOW')}
              className={`px-5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all ${
                userChoice === 'ALLOW'
                  ? 'bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ALLOW (Permitir Acesso)
            </button>
            <button
              type="button"
              onClick={() => handleSelectDecision('DENY')}
              className={`px-5 py-2.5 rounded-lg font-mono text-xs font-bold transition-all ${
                userChoice === 'DENY'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              DENY (Bloquear Acesso)
            </button>
          </div>
        </div>

        {/* Rodapé */}
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
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={!userChoice}
              onClick={handleValidateDecision}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Julgar Política <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
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
              {feedback.isCorrect ? 'Decisão de IAM Classificada com Sucesso' : 'Decisão de IAM Incorreta'}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>
        </section>
      )}
    </div>
  );
}
