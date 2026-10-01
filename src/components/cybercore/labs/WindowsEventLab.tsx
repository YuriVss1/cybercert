"use client";

import React, { useState } from 'react';
import { 
  Terminal, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight, FileText, Eye, Target, ShieldAlert, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface WindowsEventCase {
  id: string;
  title: string;
  eventSnippet: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const WINDOWS_EVENT_CASES: WindowsEventCase[] = [
  {
    id: 'case-4624',
    title: 'Caso 1: Análise de Autenticação Remota (Event ID 4624)',
    eventSnippet: `Log Name: Security
Event ID: 4624
Task Category: Logon
Level: Information
Subject:
    Security ID: SYSTEM
Logon Information:
    Logon Type: 10
    Restricted Admin Mode: -
New Logon:
    Security ID: CORP\\jdoe
    Account Name: jdoe
    Account Domain: CORP
Network Information:
    Workstation Name: DESKTOP-WORK
    Source Network Address: 192.168.1.150`,
    question: 'Com base no Logon Type 10 registrado no Event ID 4624, como o usuário jdoe se conectou a este sistema?',
    options: [
      { id: 'opt-1', text: 'Logon local no teclado/monitor físico (Console - Logon Type 2)', isCorrect: false },
      { id: 'opt-2', text: 'Acesso remoto via Terminal Services / Remote Desktop (RDP - Logon Type 10)', isCorrect: true },
      { id: 'opt-3', text: 'Compartilhamento de arquivos de rede SMB (Network - Logon Type 3)', isCorrect: false },
      { id: 'opt-4', text: 'Agendamento de tarefa automática em lote (Batch - Logon Type 4)', isCorrect: false }
    ],
    explanation: 'Logon Type 10 indica RemoteInteractive (conexão via RDP / Terminal Services). Logon Type 2 é console local físico e Logon Type 3 é compartilhamento de rede SMB/RPC.'
  },
  {
    id: 'case-4688',
    title: 'Caso 2: Criação Anômala de Processo (Event ID 4688)',
    eventSnippet: `Log Name: Security
Event ID: 4688
Task Category: Process Creation
Subject:
    Account Name: finance_user
Process Information:
    New Process ID: 0x1f44
    New Process Name: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe
    Token Elevation Type: TokenElevationTypeLimited (1)
    Creator Process Name: C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE
    Process Command Line: powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Enc aQB3AHIA...`,
    question: 'Qual técnica de ataque clássica e de alta severidade é indicada por este log?',
    options: [
      { id: 'opt-1', text: 'Manutenção de rotina do Microsoft Office para download de atualizações', isCorrect: false },
      { id: 'opt-2', text: 'Execução de macro maliciosa em documento do Word iniciando script oculto (Initial Access / Execution)', isCorrect: true },
      { id: 'opt-3', text: 'Falha de compilação de assembly no .NET Framework', isCorrect: false },
      { id: 'opt-4', text: 'Comprometimento de credenciais de serviço via Kerberoasting', isCorrect: false }
    ],
    explanation: 'Um processo de produtividade como WINWORD.EXE ou EXCEL.EXE gerando (child process) powershell.exe com flags -ExecutionPolicy Bypass e -WindowStyle Hidden é a assinatura definitiva de macro maliciosa com payload oculto.'
  },
  {
    id: 'case-7045',
    title: 'Caso 3: Instalação de Novo Serviço no Sistema (Event ID 7045)',
    eventSnippet: `Log Name: System
Event ID: 7045
Source: Service Control Manager
Level: Information
A service was installed in the system.
Service Name: PSEXESVC
Service File Name: %SystemRoot%\\PSEXESVC.exe
Service Type: user mode service
Service Start Type: demand start
Service Account: LocalSystem`,
    question: 'A instalação do serviço PSEXESVC em um endpoint que não pertence à equipe de TI costuma ser evidência de:',
    options: [
      { id: 'opt-1', text: 'Movimentação Lateral remota utilizando a ferramenta PsExec (Sysinternals) por um adversário', isCorrect: true },
      { id: 'opt-2', text: 'Atualização periódica de drivers de vídeo da placa gráfica', isCorrect: false },
      { id: 'opt-3', text: 'Criação de chave de registro para auto-início no shell Explorer', isCorrect: false },
      { id: 'opt-4', text: 'Expiração da senha da conta do domínio', isCorrect: false }
    ],
    explanation: 'O serviço PSEXESVC é instanciado remotamente no alvo quando o utilitário PsExec é executado para obter execução de comandos com privilégios de SYSTEM, sendo amplamente abusado para Movimentação Lateral.'
  }
];

export default function WindowsEventLab({
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [caseFeedback, setCaseFeedback] = useState<Record<string, { isCorrect: boolean; message: string }>>({});

  const currentCase = WINDOWS_EVENT_CASES[activeCaseIdx];
  const currentSelection = selectedAnswers[currentCase.id];
  const currentFb = caseFeedback[currentCase.id];

  const handleSelectOption = (optionId: string) => {
    if (isFinalized) return;
    setSelectedAnswers(prev => ({ ...prev, [currentCase.id]: optionId }));
  };

  const handleValidateCurrentCase = () => {
    const chosen = currentCase.options.find(o => o.id === currentSelection);
    const isCorrect = Boolean(chosen?.isCorrect);

    onRecordAttempt({
      challengeId: `win-event-${currentCase.id}`,
      challengeType: 'IDENTIFY',
      isCorrect,
      confidence,
      durationMs: 5000,
      submittedAnswer: { caseId: currentCase.id, optionId: currentSelection },
      feedbackGiven: isCorrect ? 'Interpretação do Windows Event Log correta.' : 'Interpretação incorreta do evento.'
    });

    setCaseFeedback(prev => ({
      ...prev,
      [currentCase.id]: {
        isCorrect,
        message: isCorrect
          ? `Correto! ${currentCase.explanation}`
          : (mode === 'exam'
            ? 'Avaliação registrada para análise.'
            : `Ajuste necessário: ${currentCase.explanation}`)
      }
    }));

    if (mode === 'exam') {
      setIsFinalized(true);
    } else {
      const allAnswered = WINDOWS_EVENT_CASES.every(c => {
        if (c.id === currentCase.id) return isCorrect;
        return caseFeedback[c.id]?.isCorrect;
      });

      if (allAnswered) {
        setIsFinalized(true);
        onCompleteStage(activeStage);
      }
    }
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow(`win-event-${currentCase.id}`, 'IDENTIFY');
    }
    setCaseFeedback(prev => ({
      ...prev,
      [currentCase.id]: {
        isCorrect: false,
        message: `Marcado como "Não sei". Explicação forense: ${currentCase.explanation}`
      }
    }));
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Preste atenção no Logon Type (10 = RDP, 2 = Local, 3 = Rede) e nos processos pai (Creator Process) vs filhos.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Avalie os campos Subject e Process CommandLine para identificar anomalias de execução.'
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
  const canRevealHint = mode === 'practice' && currentFb && !currentFb.isCorrect && !showHintRevealed;

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
              <Terminal className="w-5 h-5 text-cyan-400 shrink-0" />
              Análise Forense de Windows Security Event Logs
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed max-w-3xl">
              Eventos de segurança do Windows (Event IDs 4624, 4688, 7045) registram evidências críticas de intrusão. Identifique técnicas adversárias (MITRE ATT&CK) a partir dos campos estruturados de telemetria.
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
      {/* NAVEGAÇÃO DE CASOS FORENSES                                          */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {WINDOWS_EVENT_CASES.map((c, idx) => {
          const isSolved = caseFeedback[c.id]?.isCorrect;
          const isCurrent = activeCaseIdx === idx;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setActiveCaseIdx(idx); setShowHintRevealed(false); }}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                isCurrent 
                  ? 'cockpit-subcard border-cyan-500/60 bg-cyan-950/30 text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                  : 'cockpit-subcard border-white/10 text-zinc-400 hover:border-white/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Caso {idx + 1}</span>
              {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* VISUALIZADOR DE LOG & ANÁLISE FORENSE                                */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-6">
        <div>
          <span className="hud-bracket py-0.5 text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            {currentCase.title}
          </span>
          <pre className="mt-3 p-4 rounded-xl bg-black/70 border border-white/10 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            {currentCase.eventSnippet}
          </pre>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-white font-mono leading-relaxed">
            {currentCase.question}
          </h3>

          <div className="space-y-2">
            {currentCase.options.map(opt => {
              const isSelected = currentSelection === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer font-mono text-xs flex items-center gap-3 transition-all ${
                    isSelected 
                      ? 'cockpit-subcard border-cyan-500/70 bg-cyan-950/30 text-white ring-1 ring-cyan-500/50' 
                      : 'cockpit-subcard border-white/10 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-zinc-600'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <span className="leading-relaxed font-sans">{opt.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
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
              type="button"
              disabled={!currentSelection}
              onClick={handleValidateCurrentCase}
              className="avionics-primary text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              Validar Hipótese <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FEEDBACK DO CASO ATUAL & DEBRIEF                                     */}
      {/* -------------------------------------------------------------------- */}
      {currentFb && (
        <section className={`cockpit-card rounded-xl p-6 space-y-4 font-mono text-xs border ${
          currentFb.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {currentFb.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white font-heading tracking-wide">
              {currentFb.isCorrect ? 'Identificação Forense Precisa' : (mode === 'exam' ? 'Avaliação Registrada' : 'Conclusão Requer Revisão')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed text-sm">
            {currentFb.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-4 rounded-lg border-white/10 text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block text-[11px]">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans leading-relaxed text-sm">
                Em perícia forense do Windows: Logon Type 10 corresponde a Remote Desktop (RDP). No Event 4688, processos como WINWORD gerando PowerShell com flags ocultas indicam vetor de macro maliciosa. A instalação de PSEXESVC (Event 7045) sinaliza execução remota lateral.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
