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
      {/* -------------------------------------------------------------------- */}
      {/* MISSION HEADER + PEDAGOGICAL MODE INDICATOR                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-1">
              <span className={`telemetry-chip font-bold ${modeBadge.color} border-current/30 bg-white/[0.02]`}>
                <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
              </span>
              <span className="telemetry-chip text-zinc-400 border-white/10 bg-white/[0.02]">
                {concept.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-2 font-heading flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400 shrink-0" />
              Fluxo de Autenticação Kerberos & Vetores de Ataque
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed max-w-3xl">
              Navegue pelas trocas de mensagens do Kerberos (KDC, TGT, TGS, AP) e entenda onde ocorrem os ataques mais críticos em ambientes Active Directory.
            </p>
          </div>
        </div>

        {mode === 'guided' && (
          <div className="cockpit-subcard p-3 rounded-lg border-emerald-500/30 bg-emerald-950/20">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="cockpit-subcard p-3 rounded-lg border-cyan-500/30 bg-cyan-950/20 animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* STEPPER VISUAL + DETALHE DO PASSO KERBEROS                           */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="hud-bracket py-0.5 text-xs font-mono text-zinc-300 uppercase tracking-widest font-bold">
            Sequência de Troca de Bilhetes Kerberos
          </span>
          <span className="telemetry-chip text-[10px] text-cyan-400 border-cyan-500/30">
            PASSO {activeStep.stepNumber} DE {KERBEROS_STEPS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {KERBEROS_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`p-2.5 rounded-lg border text-left font-mono transition-all ${
                currentStepIdx === idx 
                  ? 'cockpit-subcard border-cyan-500/60 bg-cyan-950/30 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                  : 'cockpit-subcard border-white/10 text-zinc-400 hover:border-white/20'
              }`}
            >
              <span className="text-[10px] block text-zinc-500 font-mono">Passo {s.stepNumber}</span>
              <span className="text-xs font-bold truncate block mt-0.5">{s.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Detalhe do Passo */}
        <div className="cockpit-subcard p-6 rounded-xl space-y-4 border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                Passo {activeStep.stepNumber} de {KERBEROS_STEPS.length}
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-0.5">
                {activeStep.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="telemetry-chip bg-white/[0.03] text-zinc-200 border-white/10">{activeStep.sender}</span>
              <span className="text-cyan-400">→</span>
              <span className="telemetry-chip bg-cyan-950/40 text-cyan-300 border-cyan-500/30 font-bold">{activeStep.receiver}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-black/40 rounded-lg border border-white/[0.08] space-y-1">
              <span className="text-zinc-500 uppercase text-[10px] block">Carga Útil / Mensagem</span>
              <p className="text-zinc-200 font-sans leading-relaxed">{activeStep.payloadDescription}</p>
            </div>
            <div className="p-3.5 bg-black/40 rounded-lg border border-white/[0.08] space-y-1">
              <span className="text-zinc-500 uppercase text-[10px] block">Chave de Encriptação Empregada</span>
              <p className="text-cyan-300 font-bold">{activeStep.encryptionKeyUsed}</p>
            </div>
          </div>

          {activeStep.securityAttackContext && (mode === 'guided' || currentStepIdx < 2) && (
            <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-red-200 text-xs font-sans space-y-1">
              <strong className="font-mono text-[11px] text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Vetor de Ataque no Active Directory:
              </strong>
              <p className="leading-relaxed text-zinc-300">{activeStep.securityAttackContext}</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={handlePrevStep}
              className="avionics-button text-xs font-mono disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentStepIdx === KERBEROS_STEPS.length - 1}
              onClick={handleNextStep}
              className="avionics-primary text-xs font-mono disabled:opacity-30 flex items-center gap-1"
            >
              Próximo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Teste de Fixação de Vetores de Ataque */}
        <form onSubmit={handleValidateAttackTest} className="border-t border-white/[0.08] pt-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
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
                    ? 'cockpit-subcard border-cyan-500/60 bg-cyan-950/30 text-cyan-200' 
                    : 'cockpit-subcard border-white/10 text-zinc-300 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="attackOpt"
                  value={opt.id}
                  disabled={isFinalized}
                  checked={selectedAttackTest === opt.id}
                  onChange={(e) => setSelectedAttackTest(e.target.value)}
                  className="accent-cyan-500"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {!isFinalized && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Confiança:</span>
                <button
                  type="button"
                  onClick={() => setConfidence('CONFIDENT')}
                  className={`avionics-button text-xs font-mono py-1 px-3 ${
                    confidence === 'CONFIDENT' ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300' : 'text-zinc-400'
                  }`}
                >
                  Certeza
                </button>
                <button
                  type="button"
                  onClick={() => setConfidence('HESITANT')}
                  className={`avionics-button text-xs font-mono py-1 px-3 ${
                    confidence === 'HESITANT' ? 'border-amber-500/60 bg-amber-950/40 text-amber-300' : 'text-zinc-400'
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
                    className="avionics-button text-amber-400 border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDontKnow}
                  className="avionics-button text-xs font-mono uppercase flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Não sei
                </button>
                <button
                  type="submit"
                  disabled={!selectedAttackTest}
                  className="avionics-primary text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
                >
                  Validar Resposta <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FEEDBACK & DEBRIEF                                                   */}
      {/* -------------------------------------------------------------------- */}
      {feedback && (
        <section className={`cockpit-card rounded-xl p-6 space-y-4 font-mono text-xs border ${
          feedback.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white font-heading tracking-wide">
              {feedback.isCorrect ? 'Domínio do Fluxo Kerberos Confirmado' : (mode === 'exam' ? 'Avaliação Registrada' : 'Conceito Requer Atenção')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed text-sm">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-4 rounded-lg border-white/10 text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block text-[11px]">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans leading-relaxed text-sm">
                O bilhete TGT (Ticket Granting Ticket) gerado no KDC é assinado pela conta secreta KRBTGT. A posse dessa chave permite a forja de Golden Tickets. Já Service Tickets utilizam o hash da respectiva conta de serviço (alvo de Silver Tickets e Kerberoasting).
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
