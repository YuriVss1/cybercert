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

  const selectedNode1 = PKI_CHAIN_NODES.find(n => n.id === slot1);
  const selectedNode2 = PKI_CHAIN_NODES.find(n => n.id === slot2);
  const selectedNode3 = PKI_CHAIN_NODES.find(n => n.id === slot3);

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
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              Construção da Cadeia de Certificados X.509 (PKI Chain)
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed max-w-3xl">
              A autenticidade em HTTPS baseia-se na delegação de assinaturas digitais. Posicione cada certificado na hierarquia correta para que o cliente consiga validar a assinatura até a âncora de confiança.
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
      {/* TRUST STORE INDICATOR (PONTO DE PARTIDA DA ANCORA)                    */}
      {/* -------------------------------------------------------------------- */}
      <div className="cockpit-subcard rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs border-cyan-500/20 bg-cyan-950/10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="text-white font-bold block">Ponto de Partida: Trust Store do Cliente</span>
            <span className="text-zinc-400 text-[11px]">O sistema operacional confia previamente apenas nos certificados raiz pré-instalados.</span>
          </div>
        </div>
        <span className="telemetry-chip font-bold text-cyan-300 border-cyan-500/40 bg-cyan-950/50 text-[10px] uppercase tracking-wider self-start sm:self-auto">
          ÂNCORA DE CONFIANÇA
        </span>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* CONSTRUTOR DA CADEIA DE CERTIFICADOS (INSTRUMENTO PRINCIPAL)         */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="hud-bracket py-0.5 text-xs font-mono text-zinc-300 uppercase tracking-widest font-bold">
              Estrutura Hierárquica de Validação (Topo = Raiz ↓)
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="avionics-button text-xs font-mono flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Seleção
          </button>
        </div>

        <div className="space-y-4 max-w-xl mx-auto">
          {/* Slot 1: Root CA */}
          <div className={`cockpit-subcard p-4 rounded-xl space-y-3 transition-colors ${
            slot1 ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                Nível 1: Autoridade Certificadora Raiz (Root CA)
              </span>
              <span className="telemetry-chip text-[9px] text-zinc-400 border-white/10">
                ÂNCORA / SELF-SIGNED
              </span>
            </div>
            <select
              value={slot1 || ''}
              onChange={(e) => setSlot1(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">-- Selecione o Certificado Raiz --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
            {selectedNode1 && (
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Subject:</span>
                  <span className="text-white truncate">{selectedNode1.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Issuer:</span>
                  <span className="text-white truncate">{selectedNode1.issuer ?? 'Nenhum'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 col-span-full">
                  <span className="text-zinc-500">Key Usage:</span>
                  <span className="text-cyan-300 truncate">{selectedNode1.keyUsage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Directional Connector 1 -> 2 */}
          <div className="flex items-center justify-center gap-3 my-1 font-mono text-[10px] text-zinc-500">
            <div className="h-px w-10 bg-white/10" />
            <div className="flex items-center gap-1.5 telemetry-chip border-white/10 bg-white/[0.02] text-zinc-400">
              <Link2 className="w-3 h-3 rotate-90 text-cyan-400" />
              <span>DELEGAÇÃO / ASSINATURA DIGITAL</span>
            </div>
            <div className="h-px w-10 bg-white/10" />
          </div>

          {/* Slot 2: Intermediate CA */}
          <div className={`cockpit-subcard p-4 rounded-xl space-y-3 transition-colors ${
            slot2 ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                Nível 2: Autoridade Certificadora Intermediária (Intermediate CA)
              </span>
              <span className="telemetry-chip text-[9px] text-zinc-400 border-white/10">
                EMISSORA SUBORDINADA
              </span>
            </div>
            <select
              value={slot2 || ''}
              onChange={(e) => setSlot2(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">-- Selecione a AC Intermediária --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
            {selectedNode2 && (
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Subject:</span>
                  <span className="text-white truncate">{selectedNode2.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Issuer:</span>
                  <span className="text-white truncate">{selectedNode2.issuer ?? 'Nenhum'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 col-span-full">
                  <span className="text-zinc-500">Key Usage:</span>
                  <span className="text-cyan-300 truncate">{selectedNode2.keyUsage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Directional Connector 2 -> 3 */}
          <div className="flex items-center justify-center gap-3 my-1 font-mono text-[10px] text-zinc-500">
            <div className="h-px w-10 bg-white/10" />
            <div className="flex items-center gap-1.5 telemetry-chip border-white/10 bg-white/[0.02] text-zinc-400">
              <Link2 className="w-3 h-3 rotate-90 text-cyan-400" />
              <span>EMISSÃO E VALIDAÇÃO TLS</span>
            </div>
            <div className="h-px w-10 bg-white/10" />
          </div>

          {/* Slot 3: Certificado Final do Servidor */}
          <div className={`cockpit-subcard p-4 rounded-xl space-y-3 transition-colors ${
            slot3 ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                Nível 3: Certificado Final de Servidor (Leaf / End-Entity)
              </span>
              <span className="telemetry-chip text-[9px] text-zinc-400 border-white/10">
                HOST FINAL / LEAF
              </span>
            </div>
            <select
              value={slot3 || ''}
              onChange={(e) => setSlot3(e.target.value || null)}
              disabled={isFinalized}
              className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">-- Selecione o Certificado Folha --</option>
              {PKI_CHAIN_NODES.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.subject})</option>
              ))}
            </select>
            {selectedNode3 && (
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Subject:</span>
                  <span className="text-white truncate">{selectedNode3.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-zinc-500">Issuer:</span>
                  <span className="text-white truncate">{selectedNode3.issuer ?? 'Nenhum'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 col-span-full">
                  <span className="text-zinc-500">Key Usage:</span>
                  <span className="text-cyan-300 truncate">{selectedNode3.keyUsage}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé / Controles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`avionics-button text-xs font-mono py-1 px-3 ${
                confidence === 'CONFIDENT'
                  ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                  : 'text-zinc-400'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`avionics-button text-xs font-mono py-1 px-3 ${
                confidence === 'HESITANT'
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                  : 'text-zinc-400'
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
              type="button"
              disabled={!slot1 || !slot2 || !slot3 || isFinalized}
              onClick={handleValidateChain}
              className="avionics-primary text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              Validar Cadeia PKI <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FEEDBACK / DEBRIEF DE VALIDAÇÃO DA CADEIA                            */}
      {/* -------------------------------------------------------------------- */}
      {feedback && (
        <section className={`cockpit-card rounded-xl p-6 space-y-4 font-mono text-xs border ${
          feedback.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white font-heading tracking-wide">
              {feedback.isCorrect ? 'Cadeia de Confiança Estabelecida com Sucesso' : (mode === 'exam' ? 'Avaliação Registrada' : 'Cadeia de Certificados Inválida')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed text-sm">
            {feedback.message}
          </p>
          {feedback.trustValidationStep && (
            <div className="cockpit-subcard p-3 rounded-lg border-cyan-500/30 bg-cyan-950/20 text-cyan-300 font-mono text-[11px] mt-2">
              {feedback.trustValidationStep}
            </div>
          )}

          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-4 rounded-lg border-white/10 text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block text-[11px]">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans leading-relaxed text-sm">
                Em TLS/HTTPS, o cliente valida a cadeia de certificação reconstruindo a trilha criptográfica até a AC Raiz confiada no sistema operacional. A AC Raiz assina a Intermediária, e esta emite o certificado final com o Common Name (CN) do host.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
