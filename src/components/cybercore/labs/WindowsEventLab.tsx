"use client";

import React, { useState } from 'react';
import { 
  Terminal, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowRight, FileText
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [caseFeedback, setCaseFeedback] = useState<Record<string, { isCorrect: boolean; message: string }>>({});

  const currentCase = WINDOWS_EVENT_CASES[activeCaseIdx];
  const currentSelection = selectedAnswers[currentCase.id];

  const handleSelectOption = (optionId: string) => {
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
          : `Ajuste necessário: ${currentCase.explanation}`
      }
    }));

    // Se completou todos com acerto
    const allAnswered = WINDOWS_EVENT_CASES.every(c => {
      if (c.id === currentCase.id) return isCorrect;
      return caseFeedback[c.id]?.isCorrect;
    });

    if (allAnswered) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow(`win-event-${currentCase.id}`, 'IDENTIFY');
    setCaseFeedback(prev => ({
      ...prev,
      [currentCase.id]: {
        isCorrect: false,
        message: `Marcado como "Não sei". Explicação: ${currentCase.explanation}`
      }
    }));
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-sky-950/80 text-sky-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-sky-800/60">
            Laboratório Interativo • IDENTIFY
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-sky-400" />
          Análise Forense de Logs de Eventos do Windows
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Event IDs do Windows Security e System Logs revelam exatamente o que aconteceu em um host: autenticações remotas (RDP vs Console), criação de processos maliciosos e serviços de persistência.
        </p>
      </section>

      {/* Seletor de Casos */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          {WINDOWS_EVENT_CASES.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCaseIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeCaseIdx === idx 
                  ? 'bg-sky-500 text-black shadow' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Caso {idx + 1} {caseFeedback[c.id]?.isCorrect && '✓'}
            </button>
          ))}
        </div>

        {/* Snippet do Log Bruto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Registro Bruto do Event Viewer:
            </span>
            <span className="text-[11px] font-mono text-zinc-500">{currentCase.title}</span>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {currentCase.eventSnippet}
          </pre>
        </div>

        {/* Pergunta e Opções */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-bold text-white font-mono">
            {currentCase.question}
          </h4>

          <div className="grid grid-cols-1 gap-2.5">
            {currentCase.options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt.id)}
                className={`p-3.5 rounded-xl border text-left font-mono text-xs transition-all flex items-center justify-between gap-3 ${
                  currentSelection === opt.id 
                    ? 'bg-sky-950/70 border-sky-500 text-white' 
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span>{opt.text}</span>
                {currentSelection === opt.id && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                )}
              </button>
            ))}
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
              disabled={!currentSelection}
              onClick={handleValidateCurrentCase}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              Confirmar Análise <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback do Caso */}
      {caseFeedback[currentCase.id] && (
        <section className={`p-6 rounded-xl border space-y-3 font-mono text-xs ${
          caseFeedback[currentCase.id].isCorrect 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {caseFeedback[currentCase.id].isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {caseFeedback[currentCase.id].isCorrect ? 'Identificação Precisa do Evento' : 'Análise Divergente'}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {caseFeedback[currentCase.id].message}
          </p>
        </section>
      )}
    </div>
  );
}
