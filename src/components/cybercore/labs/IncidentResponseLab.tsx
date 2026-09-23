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
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Ciclo de Vida de Resposta a Incidentes (NIST SP 800-61)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Organize cronologicamente as etapas fundamentais da resposta a incidentes. A ordem não é apenas burocrática: erradicar sem antes conter permite que atacantes alterem suas táticas ou detonem payloads destrutivos.
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

      {/* Sorter */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
            Posicione na Ordem de Execução (Topo = Primeiro ↓)
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reembaralhar
          </button>
        </div>

        <div className="space-y-3">
          {orderedPhases.map((phase, idx) => (
            <div 
              key={phase.id}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-cyan-400 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white font-mono">
                    {phase.name}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {phase.objective}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500">
                    Exemplo real: {phase.exampleAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'UP')}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Subir etapa"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === orderedPhases.length - 1}
                  onClick={() => handleMove(idx, 'DOWN')}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Descer etapa"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
              onClick={handleValidate}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              Validar Fluxo de Resposta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {validation && (
        <section className={`p-6 rounded-xl border space-y-3 font-mono text-xs ${
          validation.isCorrect 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {validation.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {validation.isCorrect ? 'Sequência Correta de Incident Response' : (mode === 'exam' ? 'Avaliação Registrada' : 'Ordem Incorreta de Resposta')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {validation.message}
          </p>
          {validation.consequenceExplanation && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800/60 text-red-200 text-xs font-sans mt-2">
              <strong>Análise Técnica de Consequência:</strong> {validation.consequenceExplanation}
            </div>
          )}
          {mode === 'exam' && isFinalized && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-1 mt-2">
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
