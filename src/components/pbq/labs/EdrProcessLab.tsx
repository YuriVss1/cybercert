"use client";

import { useState } from "react";
import { Terminal, Shield, CheckCircle2, Cpu, AlertCircle, RefreshCw, Trash2, ShieldX } from "lucide-react";
import { PbqLabProps } from "@/lib/pbqData";

interface ProcessNode {
  pid: number;
  name: string;
  commandLine: string;
  parentPid: number;
  user: string;
  cpu: string;
  isMalicious: boolean;
  status: "RUNNING" | "TERMINATED";
}

const INITIAL_PROCESSES: ProcessNode[] = [
  {
    pid: 1040,
    name: "services.exe",
    commandLine: "C:\\Windows\\System32\\services.exe",
    parentPid: 650,
    user: "NT AUTHORITY\\SYSTEM",
    cpu: "0.2%",
    isMalicious: false,
    status: "RUNNING"
  },
  {
    pid: 2450,
    name: "WINWORD.EXE",
    commandLine: "\"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE\" Invoice_9918.docm",
    parentPid: 4012,
    user: "CORP\\diretoria",
    cpu: "1.1%",
    isMalicious: false,
    status: "RUNNING"
  },
  {
    pid: 4012,
    name: "explorer.exe",
    commandLine: "C:\\Windows\\Explorer.EXE",
    parentPid: 1040,
    user: "CORP\\diretoria",
    cpu: "2.5%",
    isMalicious: false,
    status: "RUNNING"
  },
  {
    pid: 6120,
    name: "powershell.exe",
    commandLine: "powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...",
    parentPid: 2450,
    user: "CORP\\diretoria",
    cpu: "34.2%",
    isMalicious: true,
    status: "RUNNING"
  },
  {
    pid: 8812,
    name: "rundll32.exe",
    commandLine: "C:\\Windows\\System32\\rundll32.exe C:\\Users\\Public\\updater.dll,StartRoutine",
    parentPid: 6120,
    user: "CORP\\diretoria",
    cpu: "18.7%",
    isMalicious: true,
    status: "RUNNING"
  }
];

export default function EdrProcessLab({ onActionSubmit, isLocked }: PbqLabProps) {
  const [processes, setProcesses] = useState<ProcessNode[]>(INITIAL_PROCESSES);
  const [selectedPid, setSelectedPid] = useState<number>(8812);
  const [registryRunKeyPresent, setRegistryRunKeyPresent] = useState(true);
  const [completed, setCompleted] = useState(false);

  const selectedProcess = processes.find(p => p.pid === selectedPid);

  const handleKillProcess = (pid: number) => {
    if (isLocked || completed) return;

    if (pid === 4012) {
      onActionSubmit({
        correct: false,
        actionId: 'kill-explorer',
        errorType: 'wrong_target',
        consequence: {
          title: 'ENCERRAMENTO DE PROCESSO LEGÍTIMO',
          actionTaken: 'Você finalizou o processo legítimo do Windows Explorer sem desinfectar o binário injetado.',
          consequence: 'A interface gráfica do usuário travou, mas o processo filho malicioso permaneceu rodando em segundo plano.',
          severity: 'high'
        }
      });
      return;
    }

    setProcesses(prev => prev.map(p => {
      if (p.pid === pid) {
        return { ...p, status: "TERMINATED" as const };
      }
      return p;
    }));
  };

  const handlePurgeRegistry = () => {
    if (isLocked || completed) return;
    setRegistryRunKeyPresent(false);
  };

  const handleReboot = () => {
    if (isLocked || completed) return;
    if (registryRunKeyPresent) {
      onActionSubmit({
        correct: false,
        actionId: 'reboot-endpoint',
        errorType: 'dangerous_action',
        consequence: {
          title: 'REINICIALIZAÇÃO COM PERSISTÊNCIA ATIVA',
          actionTaken: 'Você reiniciou o computador sem remover a chave de persistência do Registro.',
          consequence: 'O malware foi executado automaticamente na inicialização com privilégios de SYSTEM.',
          severity: 'critical'
        }
      });
      return;
    }
  };

  const handleFinalizeRemediation = () => {
    if (isLocked || completed) return;

    const maliciousRunning = processes.some(p => (p.pid === 8812 || p.pid === 6120) && p.status === "RUNNING");

    if (maliciousRunning) {
      onActionSubmit({
        correct: false,
        actionId: 'process-alive',
        errorType: 'incomplete_action',
        consequence: {
          title: 'PROCESSO MALICIOSO AINDA ATIVO',
          actionTaken: 'Você tentou concluir a remediação enquanto processos da cadeia de ataque ainda estavam ativos na memória.',
          consequence: 'A conexão de comando e controle continuou ativa mantendo canal aberto com o atacante.',
          severity: 'high'
        }
      });
      return;
    }

    if (registryRunKeyPresent) {
      onActionSubmit({
        correct: false,
        actionId: 'registry-alive',
        errorType: 'incomplete_action',
        consequence: {
          title: 'CHAVE DE PERSISTÊNCIA NÃO REMOVIDA',
          actionTaken: 'Você encerrou o processo porém manteve a chave de registro Run intacta.',
          consequence: 'O binário será executado novamente no próximo logon do usuário.',
          severity: 'high'
        }
      });
      return;
    }

    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'edr-remediation-success'
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Top Telemetry Header */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            EDR SENSOR / WS-DIR-01 (KERNEL TELEMETRY ACTIVE)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Status EDR: <span className="text-red-400 font-semibold">C2 BEACON DETECTADO</span></span>
          <button
            onClick={handleReboot}
            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-300 flex items-center gap-1.5 text-[10px]"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Reiniciar Estação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Process Tree List */}
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-2.5 bg-zinc-950/80 border-b border-zinc-800 flex justify-between items-center">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              ÁRVORE HIERÁRQUICA DE PROCESSOS
            </span>
            <span className="text-[10px] text-zinc-500">Selecione para inspecionar memória</span>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {processes.map(proc => {
              const isSelected = selectedPid === proc.pid;
              const isDead = proc.status === "TERMINATED";

              return (
                <div
                  key={proc.pid}
                  onClick={() => setSelectedPid(proc.pid)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-zinc-800/80 border-l-4 border-l-cyan-500" : "hover:bg-zinc-800/30"
                  } ${isDead ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono text-[10px]">PID: {proc.pid}</span>
                      <span className="text-zinc-500 text-[10px]">(PPID: {proc.parentPid})</span>
                      <span className="text-zinc-200 font-bold">{proc.name}</span>
                      {proc.isMalicious && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800/60">
                          THREAT DETECTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isDead ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950 text-emerald-400"
                      }`}>
                        {proc.status}
                      </span>
                      {!isDead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleKillProcess(proc.pid); }}
                          className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded text-[10px] font-bold"
                        >
                          KILL PID
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">
                    <span className="text-zinc-500">Cmd:</span> {proc.commandLine}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details & Persistence Clean Panel */}
        <div className="space-y-4">
          {/* Process Inspector Box */}
          {selectedProcess && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
              <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <span>ANÁLISE DE BINÁRIO (PID {selectedProcess.pid})</span>
                <span className={selectedProcess.status === "TERMINATED" ? "text-zinc-500" : "text-emerald-400"}>
                  {selectedProcess.status}
                </span>
              </div>
              <div className="text-[10px] space-y-1 text-zinc-400">
                <div><strong className="text-zinc-300">Processo:</strong> {selectedProcess.name}</div>
                <div><strong className="text-zinc-300">Contexto de Usuário:</strong> {selectedProcess.user}</div>
                <div><strong className="text-zinc-300">Consumo de CPU:</strong> {selectedProcess.cpu}</div>
                <div className="break-all pt-1 border-t border-zinc-900">
                  <strong className="text-zinc-300">Linha de Comando Completa:</strong>
                  <p className="text-amber-400/90 mt-0.5">{selectedProcess.commandLine}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registry Persistence Box */}
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-200 font-bold text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                PERSISTÊNCIA NO REGISTRO DO WINDOWS
              </span>
            </div>

            {registryRunKeyPresent ? (
              <div className="p-2.5 bg-red-950/20 border border-red-800/50 rounded text-[10px] space-y-2">
                <div className="text-red-300 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  Chave Run Anômala Ativa:
                </div>
                <div className="text-zinc-400 font-mono text-[9px] break-all bg-zinc-950 p-1.5 rounded">
                  HKCU\Software\Microsoft\Windows\CurrentVersion\Run<br />
                  <span className="text-amber-300">&quot;SecurityUpdate&quot;</span> = &quot;rundll32.exe C:\Users\Public\updater.dll,StartRoutine&quot;
                </div>
                <button
                  onClick={handlePurgeRegistry}
                  className="w-full py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-600 text-red-200 rounded font-bold text-[10px] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETAR CHAVE DE REGISTRO
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded text-[10px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chave Run maliciosa removida com sucesso. Sem persistência ativa.</span>
              </div>
            )}

            <button
              onClick={handleFinalizeRemediation}
              disabled={isLocked || completed}
              className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                completed
                  ? "bg-emerald-600 text-white cursor-not-allowed"
                  : isLocked
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white"
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ENDPOINT DESINFECTADO</span>
                </>
              ) : (
                <>
                  <ShieldX className="w-4 h-4" />
                  <span>CONCLUIR REMEDIAÇÃO EDR</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
