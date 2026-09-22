"use client";

import React, { useState } from 'react';
import { 
  Lock, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, ShieldCheck, Link2
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  // Slots de encadeamento
  const [slot1, setSlot1] = useState<string | null>(null); // Topo: Root
  const [slot2, setSlot2] = useState<string | null>(null); // Meio: Intermediate
  const [slot3, setSlot3] = useState<string | null>(null); // Base: Leaf
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
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
  };

  const handleValidateChain = () => {
    // Ordem correta da cadeia criptográfica de cima para baixo:
    // Root CA -> Intermediate CA -> Server Certificate (Leaf)
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

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Excelente! O cliente confia no certificado do servidor (api.rootsec.io) porque ele é assinado pela Intermediate CA, que por sua vez é assinada pela Root CA, cuja chave pública já reside no Trust Store local do sistema operacional.'
        : 'Erro na cadeia de confiança (Untrusted Certificate Chain). O navegador rejeitará a conexão TLS com aviso SEC_ERROR_UNKNOWN_ISSUER.',
      trustValidationStep: isCorrect
        ? 'Fluxo criptográfico: Assinatura do Leaf validada via chave pública da Intermediate -> Assinatura da Intermediate validada via Root -> Root verificada no Trust Store local.'
        : 'Lembre-se: O Server Certificate (folha) nunca pode emitir ou assinar certificados intermediários.'
    });

    if (isCorrect) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow('pki-chain-connect-1', 'CONNECT');
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No modelo de PKI: 1) A Root CA é a âncora de confiança auto-assinada; 2) A Intermediate CA protege a chave da Root e emite certificados; 3) O Server Certificate é emitido para o domínio final (ex: api.rootsec.io).'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-emerald-800/60">
            Laboratório Interativo • CONNECT
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Cadeia de Confiança PKI & Hierarquia X.509
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Conecte os elos da cadeia de certificados para permitir que o navegador do cliente valide a identidade de <strong>api.rootsec.io</strong> através de assinaturas digitais assimétricas.
        </p>
      </section>

      {/* Interface de Conexão da Cadeia */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Monte a Cadeia de Confiança (Do Nível Superior até o Destino ↓)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Slots
          </button>
        </div>

        {/* 3 Slots Verticais Conectados */}
        <div className="max-w-xl mx-auto space-y-3">
          {/* Slot 1: Âncora de Confiança */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
              Nível 1: Âncora de Confiança (Trust Anchor no OS/Browser)
            </span>
            <select
              value={slot1 || ''}
              onChange={(e) => setSlot1(e.target.value || null)}
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

          {/* Slot 2: Emissora Intermediária */}
          <div className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
              Nível 2: Autoridade Certificadora Emissora (Intermediate CA)
            </span>
            <select
              value={slot2 || ''}
              onChange={(e) => setSlot2(e.target.value || null)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 font-mono text-xs text-white"
            >
              <option value="">-- Selecione a Autoridade Intermediária --</option>
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
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={!slot1 || !slot2 || !slot3}
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
              {feedback.isCorrect ? 'Cadeia de Confiança Estabelecida com Sucesso' : 'Cadeia de Certificados Inválida'}
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
        </section>
      )}
    </div>
  );
}
