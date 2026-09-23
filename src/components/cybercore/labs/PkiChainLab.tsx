"use client";

import React, { useState } from 'react';
import { 
  Lock, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, ShieldCheck, Link2,
  Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface PkiNode {
  id: string;
  name: string;
  type: 'ROOT_CA' | 'INTERMEDIATE_CA' | 'LEAF_CERT' | 'CLIENT';
  issuer: string | null;
  subject: string;
  keyUsage: string;
  trustAnchor: boolean;
}

const PKI_CHAIN_NODES: PkiNode[] = [
  {
    id: 'node-root',
    name: 'Root CA (Autoridade Raiz)',
    type: 'ROOT_CA',
    issuer: 'Auto-assinado (Self-Signed)',
    subject: 'CN=GlobalRoot CA G2',
    keyUsage: 'Certificate Signing, CRL Signing',
    trustAnchor: true
  },
  {
    id: 'node-intermediate',
    name: 'Intermediate CA (Emissora)',
    type: 'INTERMEDIATE_CA',
    issuer: 'CN=GlobalRoot CA G2',
    subject: 'CN=Global TLS Issuing CA',
    keyUsage: 'Certificate Signing, Digital Signature',
    trustAnchor: false
  },
  {
    id: 'node-leaf',
    name: 'Server Certificate (Folha)',
    type: 'LEAF_CERT',
    issuer: 'CN=Global TLS Issuing CA',
    subject: 'CN=api.rootsec.io',
    keyUsage: 'Server Authentication, Key Encipherment',
    trustAnchor: false
  },
  {
    id: 'node-client',
    name: 'Client Browser / OS Trust Store',
    type: 'CLIENT',
    issuer: null,
    subject: 'Repositório Local de Certificados Confiáveis',
    keyUsage: 'Validação de Assinaturas Criptográficas',
    trustAnchor: true
  }
];

export default function PkiChainLab({
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

  const [slot1, setSlot1] = useState<string | null>(null); // Topo: Root
  const [slot2, setSlot2] = useState<string | null>(null); // Meio: Intermediate
  const [slot3, setSlot3] = useState<string | null>(null); // Base: Leaf
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
    trustValidationStep?: string;
  } | null>(null);

  const handleReset = () => {
    setSlot1(null);
    setSlot2(null);
    setSlot3(null);
    setFeedback(null);
    setShowHintRevealed(false);
    setIsFinalized(false);
  };

  const handleValidateChain = () => {
    const isCorrect = slot1 === 'node-root' && slot2 === 'node-intermediate' && slot3 === 'node-leaf';

    onRecordAttempt({
      challengeId: 'pki-chain-connect-1',
      challengeType: 'CONNECT',
      isCorrect,
      confidence,
      durationMs: 7000,
      submittedAnswer: { chain: [slot1, slot2, slot3] },
      feedbackGiven: isCorrect 
        ? 'Cadeia de confiança PKI estruturada e validada com sucesso.' 
        : 'Cadeia de certificados inconsistente com o modelo de confiança hierárquico.'
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
        ? 'Excelente! O cliente confia no certificado do servidor (api.rootsec.io) porque ele é assinado pela Intermediate CA, que por sua vez é assinada pela Root CA, cuja chave pública já reside no Trust Store local do sistema operacional.'
        : (mode === 'exam'
          ? 'Avaliação de cadeia registrada para análise.'
          : 'Erro na cadeia de confiança (Untrusted Certificate Chain). O navegador rejeitará a conexão TLS com aviso SEC_ERROR_UNKNOWN_ISSUER.'),
      trustValidationStep: isCorrect
        ? 'Fluxo criptográfico: Assinatura do Leaf validada via chave pública da Intermediate -> Assinatura da Intermediate validada via Root -> Root verificada no Trust Store local.'
        : (mode === 'exam' ? undefined : 'Lembre-se: O Server Certificate (folha) nunca pode emitir ou assinar certificados intermediários.')
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('pki-chain-connect-1', 'CONNECT');
    }
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No modelo de PKI: 1) A Root CA é a âncora de confiança auto-assinada; 2) A Intermediate CA protege a chave da Root e emite certificados; 3) O Server Certificate é emitido para o domínio final (ex: api.rootsec.io).'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: A cadeia segue a ordem de delegação de confiança: 1º Root CA (Topo) → 2º Intermediate CA (Emissora) → 3º Server Certificate (Folha/api.rootsec.io).'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Verifique o campo "Issuer" de cada nó. Um certificado folha nunca pode figurar como emissor de outra autoridade.'
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
          <Lock className="w-5 h-5 text-emerald-400" />
          Construção da Cadeia de Certificados X.509 (PKI Chain)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          A autenticidade em HTTPS baseia-se na delegação de assinaturas digitais. Posicione cada certificado na hierarquia correta para que o cliente consiga validar a assinatura até a âncora de confiança.
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

      {/* Trust Store Indicator */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-white font-bold block">Ponto de Partida: Trust Store do Cliente</span>
            <span className="text-zinc-400 text-[11px]">O sistema operacional confia previamente apenas nos certificados raiz pré-instalados.</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold">
          ÂNCORA DE CONFIANÇA
        </span>
      </div>

      {/* Construtor da Cadeia de Certificados */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Estrutura Hierárquica de Validação (Topo = Raiz ↓)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Seleção
          </button>
        </div>

        <div className="space-y-4 max-w-xl mx-auto">
          {/* Slot 1: Root CA */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
              Nível 1: Autoridade Certificadora Raiz (Root CA)
            </span>
            <select
              value={slot1 || ''}
              onChange={(e) => setSlot1(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 font-mono text-xs text-white"
            >
              <option value="">-- Selecione o Certificado Raiz --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center text-zinc-600">
            <Link2 className="w-5 h-5 rotate-90" />
          </div>

          {/* Slot 2: Intermediate CA */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
              Nível 2: Autoridade Certificadora Intermediária (Intermediate CA)
            </span>
            <select
              value={slot2 || ''}
              onChange={(e) => setSlot2(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 font-mono text-xs text-white"
            >
              <option value="">-- Selecione a AC Intermediária --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center text-zinc-600">
            <Link2 className="w-5 h-5 rotate-90" />
          </div>

          {/* Slot 3: Certificado Final do Servidor */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
              Nível 3: Certificado Final de Servidor (Leaf / End-Entity)
            </span>
            <select
              value={slot3 || ''}
              onChange={(e) => setSlot3(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 font-mono text-xs text-white"
            >
              <option value="">-- Selecione o Certificado Folha --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
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
              disabled={!slot1 || !slot2 || !slot3 || isFinalized}
              onClick={handleValidateChain}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Validar Cadeia PKI <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback de Validação */}
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
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {feedback.isCorrect ? 'Cadeia de Confiança Estabelecida com Sucesso' : (mode === 'exam' ? 'Avaliação Registrada' : 'Cadeia de Certificados Inválida')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>
          {feedback.trustValidationStep && (
            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-cyan-300 font-mono text-[11px] mt-2">
              {feedback.trustValidationStep}
            </div>
          )}

          {mode === 'exam' && isFinalized && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                Em TLS/HTTPS, o cliente valida a cadeia de certificação reconstruindo a trilha criptográfica até a AC Raiz confiada no sistema operacional. A AC Raiz assina a Intermediária, e esta emite o certificado final com o Common Name (CN) do host.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
