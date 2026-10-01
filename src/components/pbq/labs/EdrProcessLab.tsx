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

    const updatedProcesses = processes.map(p => {
      if (p.pid === pid) {
        return { ...p, status: "TERMINATED" as const };
      }
      return p;
    });

    setProcesses(updatedProcesses);

    // Condição de sucesso: ambos os processos maliciosos (6120 e 8812) devem ser finalizados
    const maliciousRemaining = updatedProcesses.some(
      p => (p.pid === 8812 || p.pid === 6120) && p.status === "RUNNING"
    );

    if (!maliciousRemaining) {
      setCompleted(true);
      setRegistryRunKeyPresent(false);
      onActionSubmit({
        correct: true,
        actionId: 'edr-remediation-success'
      });
    }
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
    <div className="space-y-4 font-mono text-xs">
      {/* Top Telemetry Header */}
      <div className="cockpit-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
                EDR SENSOR / WS-DIR-01
              </span>
              <span className="telemetry-chip">KERNEL TELEMETRY ACTIVE</span>
            </div>
            <div className="text-[10px] text-zinc-500">Live Endpoint Inspection & Process Tree Analysis</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Status EDR:</span>
            <span className="telemetry-chip text-red-400 border-red-500/40 bg-red-950/40 font-semibold">
              C2 BEACON DETECTADO
            </span>
          </div>
          <button
            onClick={handleReboot}
            className="avionics-button flex items-center gap-1.5 text-[10px] text-amber-300 border-amber-500/30 hover:border-amber-400 hover:text-amber-200"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Reiniciar Estação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Process Tree List */}
        <div className="lg:col-span-2 cockpit-card p-0 overflow-hidden flex flex-col">
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800/80 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-200 font-bold text-[11px] uppercase tracking-wider">
                Árvore Hierárquica de Processos
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">Selecione para inspecionar memória</span>
          </div>

          <div className="divide-y divide-zinc-800/60 p-2 space-y-1">
            {processes.map(proc => {
              const isSelected = selectedPid === proc.pid;
              const isDead = proc.status === "TERMINATED";

              return (
                <div
                  key={proc.pid}
                  onClick={() => setSelectedPid(proc.pid)}
                  className={`p-3 rounded cursor-pointer transition-all ${
                    isSelected
                      ? "bg-cyan-950/30 border border-cyan-500/50 shadow-sm shadow-cyan-950/40"
                      : "cockpit-subcard hover:border-zinc-700/80 border-transparent"
                  } ${isDead ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-zinc-400 font-mono text-[10px]">PID: {proc.pid}</span>
                      <span className="text-zinc-500 text-[10px]">(PPID: {proc.parentPid})</span>
                      <span className="text-zinc-100 font-bold text-xs">{proc.name}</span>
                      {proc.isMalicious && (
                        <span className="telemetry-chip text-red-400 border-red-500/40 bg-red-950/50 text-[9px] font-bold">
                          THREAT DETECTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`telemetry-chip text-[10px] font-semibold ${
                        isDead ? "text-zinc-400 border-zinc-700 bg-zinc-900" : "text-emerald-400 border-emerald-500/40 bg-emerald-950/40"
                      }`}>
                        {proc.status}
                      </span>
                      {!isDead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleKillProcess(proc.pid); }}
                          className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 rounded text-[10px] font-bold transition-colors"
                        >
                          KILL PID
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono bg-zinc-950/60 p-1.5 rounded border border-zinc-800/40">
                    <span className="text-zinc-500 font-semibold">Cmd:</span> {proc.commandLine}
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
            <div className="cockpit-card p-3 space-y-2.5">
              <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="uppercase tracking-wider">Análise de Binário (PID {selectedProcess.pid})</span>
                <span className={`telemetry-chip text-[9px] ${selectedProcess.status === "TERMINATED" ? "text-zinc-500" : "text-emerald-400 border-emerald-500/30"}`}>
                  {selectedProcess.status}
                </span>
              </div>
              <div className="text-[10px] space-y-1.5 text-zinc-400">
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <strong className="text-zinc-300">Processo:</strong>
                  <span className="text-zinc-200 font-mono">{selectedProcess.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <strong className="text-zinc-300">Contexto Usuário:</strong>
                  <span className="text-zinc-200 font-mono">{selectedProcess.user}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <strong className="text-zinc-300">Consumo de CPU:</strong>
                  <span className="text-cyan-400 font-mono">{selectedProcess.cpu}</span>
                </div>
                <div className="pt-1.5">
                  <strong className="text-zinc-300 block mb-1">Linha de Comando Completa:</strong>
                  <p className="text-amber-300/90 text-[10px] break-all bg-zinc-950/80 p-2 rounded border border-zinc-800/60 font-mono">
                    {selectedProcess.commandLine}
                  </p>
                </div>

                {/* Ação Direta no Processo Selecionado */}
                <div className="pt-2">
                  {selectedProcess.status === "RUNNING" ? (
                    <button
                      onClick={() => handleKillProcess(selectedProcess.pid)}
                      disabled={isLocked || completed}
                      className="w-full py-2 bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-200 rounded font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Encerrar Processo (PID {selectedProcess.pid})</span>
                    </button>
                  ) : (
                    <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-500 font-mono text-[10px] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>PROCESSO FINALIZADO NA MEMÓRIA</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Registry Persistence Box */}
          <div className="cockpit-card p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-zinc-200 font-bold text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Persistência no Registro
              </span>
            </div>

            {registryRunKeyPresent ? (
              <div className="cockpit-subcard p-2.5 border-red-800/40 bg-red-950/20 text-[10px] space-y-2">
                <div className="text-red-300 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Chave Run Anômala Ativa:
                </div>
                <div className="text-zinc-400 font-mono text-[9px] break-all bg-zinc-950/90 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500">HKCU\Software\Microsoft\Windows\CurrentVersion\Run</span><br />
                  <span className="text-amber-300">&quot;SecurityUpdate&quot;</span> = &quot;rundll32.exe C:\Users\Public\updater.dll,StartRoutine&quot;
                </div>
                <button
                  onClick={handlePurgeRegistry}
                  className="w-full py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  DELETAR CHAVE DE REGISTRO
                </button>
              </div>
            ) : (
              <div className="cockpit-subcard p-2.5 border-emerald-800/40 bg-emerald-950/20 text-[10px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chave Run maliciosa removida com sucesso. Sem persistência ativa.</span>
              </div>
            )}

            <button
              onClick={handleFinalizeRemediation}
              disabled={isLocked || completed}
              className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                completed
                  ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 cursor-not-allowed"
                  : isLocked
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "avionics-primary"
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
