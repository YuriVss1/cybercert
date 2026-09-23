"use client";

import React, { useState } from 'react';
import { 
  Key, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight, ShieldAlert, ChevronRight,
  Eye, Target, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface KerberosStep {
  stepNumber: number;
  name: string;
  sender: string;
  receiver: string;
  payloadDescription: string;
  encryptionKeyUsed: string;
  securityAttackContext?: string;
}

const KERBEROS_STEPS: KerberosStep[] = [
  {
    stepNumber: 1,
    name: 'AS-REQ (Authentication Service Request)',
    sender: 'Cliente (Alice)',
    receiver: 'KDC: Authentication Service (AS)',
    payloadDescription: 'Solicitação inicial de autenticação de Alice enviando pré-autenticação (timestamp encriptado).',
    encryptionKeyUsed: 'Hash do Usuário Alice (derivado da senha)',
    securityAttackContext: 'AS-REP Roasting: Se a conta tiver a flag "Do not require Kerberos preauthentication" ativa, o KDC responde com o TGT sem validar a senha prévia.'
  },
  {
    stepNumber: 2,
    name: 'AS-REP (Authentication Service Response)',
    sender: 'KDC: Authentication Service (AS)',
    receiver: 'Cliente (Alice)',
    payloadDescription: 'KDC entrega o TGT (Ticket Granting Ticket) e a Logon Session Key.',
    encryptionKeyUsed: 'TGT é encriptado com a chave secreta da conta KRBTGT; Session Key é encriptada com o hash de Alice',
    securityAttackContext: 'Golden Ticket: Se o atacante extrair a chave secreta da conta krbtgt (via DCSync), ele pode forjar TGTs válidos para qualquer usuário do domínio com validade de até 10 anos.'
  },
  {
    stepNumber: 3,
    name: 'TGS-REQ (Ticket Granting Service Request)',
    sender: 'Cliente (Alice)',
    receiver: 'KDC: Ticket Granting Service (TGS)',
    payloadDescription: 'Alice apresenta seu TGT e um Authenticator solicitando um bilhete de serviço para acessar o servidor de arquivos (cifs/filesrv.corp).',
    encryptionKeyUsed: 'TGT (chave krbtgt) + Authenticator encriptado com a Logon Session Key',
    securityAttackContext: 'Kerberoasting: Qualquer usuário de domínio autenticado pode requisitar bilhetes TGS para qualquer conta com Service Principal Name (SPN) registrado e quebrar o hash offline.'
  },
  {
    stepNumber: 4,
    name: 'TGS-REP (Ticket Granting Service Response)',
    sender: 'KDC: Ticket Granting Service (TGS)',
    receiver: 'Cliente (Alice)',
    payloadDescription: 'KDC valida o TGT e devolve o Service Ticket para o serviço solicitado mais a Service Session Key.',
    encryptionKeyUsed: 'Service Ticket encriptado com a chave da conta de serviço do File Server (SPN)',
    securityAttackContext: 'Silver Ticket: Se o atacante comprometer a chave da conta de serviço do File Server, ele pode forjar Service Tickets diretamente sem falar com o KDC.'
  },
  {
    stepNumber: 5,
    name: 'AP-REQ (Application Request)',
    sender: 'Cliente (Alice)',
    receiver: 'Application Server (File Server)',
    payloadDescription: 'Alice apresenta o Service Ticket e o Authenticator ao File Server.',
    encryptionKeyUsed: 'Service Ticket (descriptografado pelo servidor com sua própria chave) + Authenticator',
    securityAttackContext: 'Pass-the-Ticket: Atacante injeta um Service Ticket válido extraído da memória LSASS em sua sessão para acessar recursos sem credenciais.'
  },
  {
    stepNumber: 6,
    name: 'AP-REP (Mutual Authentication - Opcional)',
    sender: 'Application Server (File Server)',
    receiver: 'Cliente (Alice)',
    payloadDescription: 'Servidor confirma sua identidade a Alice enviando o timestamp incrementado.',
    encryptionKeyUsed: 'Service Session Key',
    securityAttackContext: 'Garante autenticação mútua para impedir servidores falsos (Rogue Servers) na rede.'
  }
];

export default function KerberosFlowLab({
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

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedAttackTest, setSelectedAttackTest] = useState<string>('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  const activeStep = KERBEROS_STEPS[currentStepIdx];

  const handleNextStep = () => {
    if (currentStepIdx < KERBEROS_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleValidateAttackTest = (e: React.FormEvent) => {
    e.preventDefault();
    const isCorrect = selectedAttackTest === 'GOLDEN_TICKET';

    onRecordAttempt({
      challengeId: 'kerberos-flow-trace-1',
      challengeType: 'TRACE',
      isCorrect,
      confidence,
      durationMs: 6000,
      submittedAnswer: { selectedAttack: selectedAttackTest },
      feedbackGiven: isCorrect 
        ? 'Golden Ticket identificado corretamente como forja do TGT na etapa do KDC AS/KRBTGT.' 
        : 'Ataque incorreto para o escopo do TGT e conta krbtgt.'
    });

    if (isCorrect) {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setIsFinalized(true);
    }

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Correto! O ataque Golden Ticket forja o TGT (Ticket Granting Ticket) com a chave da conta KRBTGT, garantindo controle total sobre qualquer serviço do domínio. Em contraste, o Silver Ticket forja apenas o Service Ticket de um serviço específico.'
        : (mode === 'exam'
          ? 'Avaliação registrada para análise.'
          : 'Incorreto. Lembre-se: O TGT é assinado e encriptado com a chave da conta KRBTGT no Passo 2 (AS-REP). Quem detém essa chave consegue forjar um "Golden Ticket".')
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('kerberos-flow-trace-1', 'TRACE');
    }
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". O fluxo Kerberos baseia-se em bilhetes: 1) AS-REQ/REP troca credenciais por TGT; 2) TGS-REQ/REP troca TGT por Service Ticket; 3) AP-REQ consome o serviço. A conta KRBTGT protege o TGT (alvo do Golden Ticket).'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: O fluxo Kerberos utiliza duas fases de bilhete: primeiro o TGT (gerado pelo AS com a conta KRBTGT) e depois o Service Ticket (gerado pelo TGS com o SPN).'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Diferencie Golden Ticket (compromete KRBTGT e forja TGT) de Silver Ticket (compromete o hash de serviço e forja TGS).'
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
          <Key className="w-5 h-5 text-purple-400" />
          Fluxo de Autenticação Kerberos & Vetores de Ataque
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Navegue pelas trocas de mensagens do Kerberos (KDC, TGT, TGS, AP) e entenda onde ocorrem os ataques mais críticos em ambientes Active Directory.
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

      {/* Stepper Visual */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {KERBEROS_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`p-2.5 rounded-lg border text-left font-mono transition-all ${
                currentStepIdx === idx 
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="text-[10px] block text-zinc-500">Passo {s.stepNumber}</span>
              <span className="text-xs font-bold truncate block">{s.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Detalhe do Passo */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                Passo {activeStep.stepNumber} de {KERBEROS_STEPS.length}
              </span>
              <h3 className="text-base font-bold text-white font-mono">
                {activeStep.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">{activeStep.sender}</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-purple-300 font-bold">{activeStep.receiver}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1">
              <span className="text-zinc-500 uppercase text-[10px] block">Carga Útil / Mensagem</span>
              <p className="text-zinc-200 font-sans leading-relaxed">{activeStep.payloadDescription}</p>
            </div>
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1">
              <span className="text-zinc-500 uppercase text-[10px] block">Chave de Encriptação Empregada</span>
              <p className="text-purple-300 font-bold">{activeStep.encryptionKeyUsed}</p>
            </div>
          </div>

          {activeStep.securityAttackContext && (mode === 'guided' || currentStepIdx < 2) && (
            <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-800/40 text-red-200 text-xs font-sans space-y-1">
              <strong className="font-mono text-[11px] text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Vetor de Ataque no Active Directory:
              </strong>
              <p className="leading-relaxed">{activeStep.securityAttackContext}</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={handlePrevStep}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentStepIdx === KERBEROS_STEPS.length - 1}
              onClick={handleNextStep}
              className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono disabled:opacity-30 flex items-center gap-1"
            >
              Próximo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Teste de Fixação de Vetores de Ataque */}
        <form onSubmit={handleValidateAttackTest} className="border-t border-zinc-800 pt-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
              {mode === 'exam' ? 'Avaliação Autônoma' : 'Desafio de Retenção de Conceito'}
            </span>
            <h4 className="text-sm font-bold text-white font-mono">
              Qual técnica abusa da chave da conta KRBTGT no Passo 2 para forjar TGTs com privilégios de Domain Admin?
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {[
              { id: 'PASS_THE_HASH', label: 'Pass-the-Hash (NTLM)' },
              { id: 'GOLDEN_TICKET', label: 'Golden Ticket (Forja de TGT via krbtgt)' },
              { id: 'SILVER_TICKET', label: 'Silver Ticket (Forja direta de Service Ticket)' },
              { id: 'KERBEROASTING', label: 'Kerberoasting (Requisitar TGS de SPNs)' }
            ].map(opt => (
              <label 
                key={opt.id}
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                  selectedAttackTest === opt.id 
                    ? 'bg-purple-950/70 border-purple-500 text-purple-200' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="attackOpt"
                  value={opt.id}
                  disabled={isFinalized}
                  checked={selectedAttackTest === opt.id}
                  onChange={(e) => setSelectedAttackTest(e.target.value)}
                  className="accent-purple-500"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {!isFinalized && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
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
                  type="submit"
                  disabled={!selectedAttackTest}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  Validar Resposta <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {feedback.isCorrect ? 'Domínio do Fluxo Kerberos Confirmado' : (mode === 'exam' ? 'Avaliação Registrada' : 'Conceito Requer Atenção')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                O bilhete TGT (Ticket Granting Ticket) gerado no KDC é assinado pela conta secreta KRBTGT. A posse dessa chave permite a forja de Golden Tickets. Já Service Tickets utilizam o hash da respectiva conta de serviço (alvo de Silver Tickets e Kerberoasting).
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
