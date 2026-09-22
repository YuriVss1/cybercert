"use client";

import React, { useState } from 'react';
import { 
  Key, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight, ShieldAlert, ChevronRight
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedAttackTest, setSelectedAttackTest] = useState<string>('');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
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
    // Pergunta de domínio: Qual ataque ao Kerberos envolve a criação de um TGT forjado usando o hash da conta krbtgt?
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

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Correto! O ataque Golden Ticket forja o TGT (Ticket Granting Ticket) com a chave da conta KRBTGT, garantindo controle total sobre qualquer serviço do domínio. Em contraste, o Silver Ticket forja apenas o Service Ticket de um serviço específico.'
        : 'Incorreto. Lembre-se: O TGT é assinado e encriptado com a chave da conta KRBTGT no Passo 2 (AS-REP). Quem detém essa chave consegue forjar um "Golden Ticket".'
    });

    if (isCorrect) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow('kerberos-flow-trace-1', 'TRACE');
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". O fluxo Kerberos baseia-se em bilhetes: 1) AS-REQ/REP troca credenciais por TGT; 2) TGS-REQ/REP troca TGT por Service Ticket; 3) AP-REQ consome o serviço. A conta KRBTGT protege o TGT (alvo do Golden Ticket).'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-purple-950/80 text-purple-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-purple-800/60">
            Laboratório Interativo • TRACE
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-400" />
          Fluxo de Autenticação Kerberos (AS → TGS → AP)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Rastreie a troca de bilhetes e chaves entre Cliente, KDC (Domain Controller) e Servidor de Aplicação. Compreenda onde os vetores de ataque Active Directory operam.
        </p>
      </section>

      {/* Visualizador de Passos */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        {/* Barra de Progresso dos Passos */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono text-xs">
          {KERBEROS_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`p-2 rounded-lg border text-center transition-all ${
                currentStepIdx === idx 
                  ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Passo {s.stepNumber}
            </button>
          ))}
        </div>

        {/* Detalhe do Passo Atual */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-xs font-mono text-purple-400 font-bold">
                MENSAGEM {activeStep.stepNumber} DE 6
              </span>
              <h3 className="text-base font-bold text-white font-mono">
                {activeStep.name}
              </h3>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
              {activeStep.sender} ➔ {activeStep.receiver}
            </div>
          </div>

          <div className="space-y-3 text-xs md:text-sm">
            <div>
              <span className="text-zinc-500 font-mono text-xs block uppercase">O que é transmitido:</span>
              <p className="text-zinc-200 mt-0.5 leading-relaxed font-sans">{activeStep.payloadDescription}</p>
            </div>

            <div>
              <span className="text-zinc-500 font-mono text-xs block uppercase">Criptografia / Chave de Proteção:</span>
              <p className="text-cyan-300 font-mono text-xs mt-0.5">{activeStep.encryptionKeyUsed}</p>
            </div>

            {activeStep.securityAttackContext && (
              <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-200 space-y-1 font-sans">
                <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-red-400">
                  <ShieldAlert className="w-4 h-4" /> Ponto Crítico de Segurança:
                </div>
                <p className="text-xs leading-relaxed">{activeStep.securityAttackContext}</p>
              </div>
            )}
          </div>

          {/* Navegação Entre Passos */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={handlePrevStep}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="text-xs font-mono text-zinc-500">
              Passo {activeStep.stepNumber} de {KERBEROS_STEPS.length}
            </span>
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
              Desafio de Retenção de Conceito
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
                  checked={selectedAttackTest === opt.id}
                  onChange={(e) => setSelectedAttackTest(e.target.value)}
                  className="accent-purple-500"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

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
              {feedback.isCorrect ? 'Domínio do Fluxo Kerberos Confirmado' : 'Conceito Requer Atenção'}
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
