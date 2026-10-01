"use client";

import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';
import { Eye, Target, ShieldAlert, Lightbulb } from 'lucide-react';

interface IncidentPhase {
  id: string;
  name: string;
  correctOrder: number;
  objective: string;
  exampleAction: string;
}

const PHASES_DATA: IncidentPhase[] = [
  {
    id: 'p-prep',
    name: '1. Preparação (Preparation)',
    correctOrder: 1,
    objective: 'Garantir políticas, ferramentas de monitoramento e capacitação prévia da equipe.',
    exampleAction: 'Configurar baselines de EDR, treinar equipe de plantão e criar playbooks de resposta.'
  },
  {
    id: 'p-id',
    name: '2. Identificação / Detecção (Detection & Analysis)',
    correctOrder: 2,
    objective: 'Detectar precursores, correlacionar alertas e determinar escopo e gravidade do incidente.',
    exampleAction: 'Identificar beacon C2 no firewall e verificar processo suspeito executado via PowerShell.'
  },
  {
    id: 'p-contain',
    name: '3. Contenção (Containment)',
    correctOrder: 3,
    objective: 'Isolar os sistemas afetados para impedir disseminação lateral e vazamento de dados.',
    exampleAction: 'Desconectar a máquina infectada da VLAN e revogar tokens de sessão comprometidos.'
  },
  {
    id: 'p-erad',
    name: '4. Erradicação (Eradication)',
    correctOrder: 4,
    objective: 'Remover artefatos do atacante, fechar vulnerabilidades e eliminar persistências.',
    exampleAction: 'Excluir tarefas agendadas criadas pelo atacante, remover backdoors e aplicar patch no servidor.'
  },
  {
    id: 'p-rec',
    name: '5. Recuperação (Recovery)',
    correctOrder: 5,
    objective: 'Restaurar serviços para produção com monitoramento reforçado para evitar re-infecção.',
    exampleAction: 'Restaurar backup íntegro do banco de dados e habilitar validação estrita de integridade.'
  },
  {
    id: 'p-ll',
    name: '6. Lições Aprendidas (Post-Incident Activity)',
    correctOrder: 6,
    objective: 'Documentar causa raiz, tempo de resposta e atualizar controles para o futuro.',
    exampleAction: 'Reunião de pós-mortem com líderes para corrigir a falha de processo e atualizar regras de SIEM.'
  }
];

// Ordem inicial embaralhada
const INITIAL_SHUFFLED: IncidentPhase[] = [
  PHASES_DATA[2], // Contenção
  PHASES_DATA[0], // Preparação
  PHASES_DATA[3], // Erradicação
  PHASES_DATA[1], // Identificação
  PHASES_DATA[5], // Lições Aprendidas
  PHASES_DATA[4], // Recuperação
];

export default function IncidentResponseLab({
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

  const [orderedPhases, setOrderedPhases] = useState<IncidentPhase[]>(INITIAL_SHUFFLED);
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [validation, setValidation] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
    consequenceExplanation?: string;
  } | null>(null);

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    if (isFinalized) return;
    const target = direction === 'UP' ? index - 1 : index + 1;
    if (target < 0 || target >= orderedPhases.length) return;
    const updated = [...orderedPhases];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setOrderedPhases(updated);
  };

  const handleReset = () => {
    setOrderedPhases(INITIAL_SHUFFLED);
    setValidation(null);
    setShowHintRevealed(false);
    setIsFinalized(false);
  };

  const handleValidate = () => {
    const isCorrect = orderedPhases.every((phase, idx) => phase.correctOrder === idx + 1);

    let consequence: string | undefined;
    const containIdx = orderedPhases.findIndex(p => p.id === 'p-contain');
    const eradIdx = orderedPhases.findIndex(p => p.id === 'p-erad');
    const idIdx = orderedPhases.findIndex(p => p.id === 'p-id');

    if (eradIdx < containIdx) {
      consequence = 'Consequência de Segurança Crítica: Iniciar a erradicação antes de conter a ameaça permite que o atacante note a intervenção, ative outros canais de C2 ocultos ou acelere a destruição/exfiltração de dados (Wiper / Ransomware).';
    } else if (containIdx < idIdx) {
      consequence = 'Consequência Técnica: Tentar conter um incidente antes de entender o escopo (Identificação) resulta em isolamento dos nós errados enquanto os verdadeiros sistemas comprometidos permanecem ativos.';
    }

    onRecordAttempt({
      challengeId: 'ir-lifecycle-sort-1',
      challengeType: 'SORT',
      isCorrect,
      confidence,
      durationMs: 6500,
      submittedAnswer: { order: orderedPhases.map(p => p.id) },
      feedbackGiven: isCorrect 
        ? 'Ciclo de Resposta a Incidentes (NIST SP 800-61) ordenado com perfeição.' 
        : (consequence || 'A ordem das fases do ciclo de incidentes está divergente.')
    });

    if (isCorrect) {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setIsFinalized(true);
    }

    setValidation({
      tested: true,
      isCorrect,
      message: isCorrect
        ? 'Parabéns! Você ordenou perfeitamente as 6 fases oficiais de Resposta a Incidentes (Preparação → Identificação → Contenção → Erradicação → Recuperação → Lições Aprendidas).'
        : (mode === 'exam'
          ? 'Avaliação de ordenação registrada para análise.'
          : 'A sequência possui fases fora da ordem canônica. Observe a relação de causa e efeito entre conter o dano antes de limpar os sistemas.'),
      consequenceExplanation: mode === 'exam' ? undefined : consequence
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('ir-lifecycle-sort-1', 'SORT');
    }
    setValidation({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". O ciclo de vida do NIST SP 800-61 estabelece: 1) Preparação -> 2) Detecção/Identificação -> 3) Contenção -> 4) Erradicação -> 5) Recuperação -> 6) Pós-incidente (Lições Aprendidas).'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica mnemônica: PICERL — Preparação → Identificação/Detecção → Contenção → Erradicação → Recuperação → Lições Aprendidas.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Lembre-se que você NUNCA deve erradicar antes de conter, nem conter antes de identificar o escopo.'
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
  const canRevealHint = mode === 'practice' && validation && !validation.isCorrect && !showHintRevealed;

  return (
    <div className="space-y-6 font-mono text-zinc-200">
      {/* Mission / Phase Header */}
      <section className="cockpit-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className={`telemetry-chip flex items-center gap-1.5 font-bold ${modeBadge.color} border-current/30`}>
              <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
            </span>
            <span className="telemetry-chip text-zinc-400">
              FRAMEWORK: NIST SP 800-61 R2
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {concept.title}
          </span>
        </div>

        <div>
          <h2 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2 uppercase">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Ciclo de Vida de Resposta a Incidentes
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-sans">
            Organize cronologicamente as etapas fundamentais da resposta a incidentes. A ordem não é apenas burocrática: erradicar sem antes conter permite que atacantes alterem suas táticas ou detonem payloads destrutivos.
          </p>
        </div>

        {mode === 'guided' && (
          <div className="cockpit-subcard p-3 border-emerald-800/40 bg-emerald-950/20">
            <p className="text-xs text-emerald-300 flex items-start gap-2 font-sans">
              <Eye className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span><strong className="font-mono uppercase text-emerald-200">Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="cockpit-subcard p-3 border-cyan-800/40 bg-cyan-950/20">
            <p className="text-xs text-cyan-300 flex items-start gap-2 font-sans">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
              <span><strong className="font-mono uppercase text-cyan-200">Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* Sorter Instrument */}
      <section className="cockpit-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-300 uppercase tracking-widest font-bold">
              Sequenciamento Operacional
            </span>
            <span className="telemetry-chip text-zinc-500">TOPO = PRIMEIRO ↓</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="avionics-button text-[11px] text-zinc-400 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reembaralhar
          </button>
        </div>

        <div className="space-y-2.5">
          {orderedPhases.map((phase, idx) => (
            <div 
              key={phase.id}
              className="cockpit-subcard p-3.5 flex items-center justify-between gap-4 transition-all hover:border-zinc-700/80"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded bg-zinc-950 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs md:text-sm font-bold text-white font-mono uppercase tracking-wide">
                    {phase.name}
                  </h4>
                  <p className="text-xs text-zinc-300 font-sans leading-normal">
                    {phase.objective}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 bg-zinc-950/60 px-2 py-0.5 rounded border border-zinc-800/60 inline-block">
                    <span className="text-zinc-400">Ação real:</span> {phase.exampleAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'UP')}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-700/60 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Subir etapa"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === orderedPhases.length - 1}
                  onClick={() => handleMove(idx, 'DOWN')}
                  className="p-1.5 rounded bg-zinc-900 border border-zinc-700/60 hover:border-cyan-500/50 hover:text-cyan-300 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Descer etapa"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé de Controle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                confidence === 'CONFIDENT'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 font-bold'
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                confidence === 'HESITANT'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canRevealHint && (
              <button
                type="button"
                onClick={() => setShowHintRevealed(true)}
                className="avionics-button text-amber-300 border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 text-xs uppercase"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
              </button>
            )}

            <button
              type="button"
              onClick={handleDontKnow}
              className="avionics-button text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 text-xs uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className="avionics-primary text-xs uppercase tracking-wider flex items-center gap-2"
            >
              Validar Fluxo de Resposta <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback Panel */}
      {validation && (
        <section className={`cockpit-card p-5 space-y-3 font-mono text-xs ${
          validation.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {validation.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              {validation.isCorrect ? 'Sequência Correta de Incident Response' : (mode === 'exam' ? 'Avaliação Registrada' : 'Ordem Incorreta de Resposta')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {validation.message}
          </p>
          {validation.consequenceExplanation && (
            <div className="cockpit-subcard p-3 border-red-800/60 bg-red-950/40 text-red-200 text-xs font-sans mt-2">
              <strong className="font-mono text-red-100 uppercase block mb-1">Análise Técnica de Consequência:</strong> {validation.consequenceExplanation}
            </div>
          )}
          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-3 border-zinc-800 bg-zinc-950/80 text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                O modelo NIST SP 800-61 estabelece que a contenção precede estritamente a erradicação. Se um analista erradicar artefatos antes de isolar a rede, o atacante reage ativando canais de C2 secundários ou disparando exfiltração em massa.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
