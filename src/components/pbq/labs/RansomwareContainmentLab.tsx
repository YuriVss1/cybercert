"use client";

import { useState, useMemo } from "react";
import { Server, Monitor, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface HostNode {
  id: string;
  name: string;
  ip: string;
  role: string;
  isPatientZero: boolean;
  isServer: boolean;
  smbConnections: string[];
  cpuUsage: string;
  recentFiles: string[];
}

const RAW_HOSTS: HostNode[] = [
  {
    id: 'host-fin-01',
    name: 'WS-FIN-01',
    ip: '192.168.10.15',
    role: 'Estação Contabilidade',
    isPatientZero: false,
    isServer: false,
    smbConnections: ['FILE-SRV-01 (Inativo)'],
    cpuUsage: '4%',
    recentFiles: ['relatorio_q3.xlsx', 'balancete.pdf']
  },
  {
    id: 'host-patient-zero',
    name: 'WS-FIN-02',
    ip: '192.168.10.18',
    role: 'Estação Contas a Pagar',
    isPatientZero: true,
    isServer: false,
    smbConnections: ['FILE-SRV-01 (445/SMB - 14.2 MB/s)', 'WS-FIN-03 (Varredura SMB)'],
    cpuUsage: '98%',
    recentFiles: ['invoice_update.exe', 'temp_enc.tmp', 'shares_finance.locked']
  },
  {
    id: 'host-fin-03',
    name: 'WS-FIN-03',
    ip: '192.168.10.22',
    role: 'Estação Tesouraria',
    isPatientZero: false,
    isServer: false,
    smbConnections: ['Nenhuma conexão externa'],
    cpuUsage: '8%',
    recentFiles: ['conciliacao_bancaria.pdf']
  },
  {
    id: 'host-file-srv',
    name: 'FILE-SRV-01',
    ip: '192.168.10.50',
    role: 'Servidor Central de Arquivos (Target)',
    isPatientZero: false,
    isServer: true,
    smbConnections: ['Recebendo conexão intensa de WS-FIN-02 (445)'],
    cpuUsage: '72%',
    recentFiles: ['/shares/finance/folha.xlsx', '/shares/finance/contratos/']
  }
];

export default function RansomwareContainmentLab({ onActionSubmit, isLocked }: PbqLabProps) {
  const shuffledHosts = useMemo(() => {
    return deterministicShuffle(RAW_HOSTS, 101);
  }, []);

  const [selectedHostId, setSelectedHostId] = useState<string>(shuffledHosts[0].id);
  const [isolatedHosts, setIsolatedHosts] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const selectedHost = shuffledHosts.find(h => h.id === selectedHostId) || shuffledHosts[0];

  const handleIsolate = (hostId: string) => {
    if (isLocked || completed) return;

    if (hostId === 'host-file-srv') {
      onActionSubmit({
        correct: false,
        actionId: 'isolate-file-srv',
        errorType: 'wrong_target',
        consequence: {
          title: 'Wrong Target: File Server',
          actionTaken: 'You isolated the file server FILE-SRV-01 instead of the infected endpoint.',
          consequence: 'The malicious process on the infected endpoint remained active and redirected SMB scans to neighboring workstations.',
          severity: 'critical'
        }
      });
      return;
    }

    if (hostId !== 'host-patient-zero') {
      onActionSubmit({
        correct: false,
        actionId: `isolate-${hostId}`,
        errorType: 'wrong_target',
        consequence: {
          title: 'Wrong Target: Clean Endpoint',
          actionTaken: `You isolated ${selectedHost.name}, which has no infection.`,
          consequence: 'Patient zero continued operating without restrictions, maintaining cryptographic transmissions in the background.',
          severity: 'high'
        }
      });
      return;
    }

    // Correct patient zero isolated
    setIsolatedHosts(prev => [...prev, hostId]);
    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'isolate-patient-zero'
    });
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Telemetry Bar */}
      <div className="cockpit-card p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            Topologia de Rede — VLAN 10 (Financeiro)
          </span>
          <span className="telemetry-chip text-amber-400 border-amber-500/40 bg-amber-950/40 font-semibold">
            INCIDENTE EM ANDAMENTO
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          Selecione o host para telemetria de tráfego SMB e processos
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Host list */}
        <div className="space-y-2">
          {shuffledHosts.map(host => {
            const isSelected = selectedHostId === host.id;
            const isIsolated = isolatedHosts.includes(host.id);

            return (
              <button
                key={host.id}
                onClick={() => setSelectedHostId(host.id)}
                className={`w-full text-left p-3 rounded transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-cyan-950/30 border border-cyan-500/60 shadow-sm shadow-cyan-950/40"
                    : "cockpit-subcard hover:border-zinc-700/80 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded border ${
                    host.isServer
                      ? "bg-cyan-950/60 text-cyan-400 border-cyan-700/60"
                      : "bg-zinc-900 text-zinc-300 border-zinc-800"
                  }`}>
                    {host.isServer ? <Server className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{host.name}</span>
                      {isIsolated && (
                        <span className="telemetry-chip text-[9px] font-bold text-red-400 border-red-500/50 bg-red-950/60 uppercase">
                          Isolado
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">{host.ip}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[9px] text-zinc-500 block uppercase">CPU</span>
                  <span className={`font-bold text-xs ${
                    parseInt(host.cpuUsage) > 80 ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {host.cpuUsage}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Telemetry panel */}
        <div className="lg:col-span-2 cockpit-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Selected host header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
              <div>
                <span className="text-white font-bold text-base uppercase tracking-wide">
                  {selectedHost.name}
                </span>
                <span className="telemetry-chip text-cyan-300 border-cyan-500/40 bg-cyan-950/40 font-mono ml-2.5">
                  {selectedHost.ip}
                </span>
                <span className="text-zinc-400 text-xs ml-2">({selectedHost.role})</span>
              </div>
              <span className={`telemetry-chip text-[10px] font-bold uppercase tracking-wider ${
                isolatedHosts.includes(selectedHost.id)
                  ? "text-red-400 border-red-500/40 bg-red-950/60"
                  : "text-emerald-400 border-emerald-500/40 bg-emerald-950/60"
              }`}>
                {isolatedHosts.includes(selectedHost.id) ? "Desconectado" : "Online"}
              </span>
            </div>

            {/* Telemetry data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="cockpit-subcard p-3 border-zinc-800/80 bg-zinc-950/60">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block mb-2">
                  Sessões SMB Ativas (Porta 445)
                </span>
                <ul className="space-y-1.5 text-zinc-200 text-xs font-mono">
                  {selectedHost.smbConnections.map((conn, idx) => (
                    <li key={idx} className="truncate p-1 bg-zinc-900/60 rounded border border-zinc-800/40">{conn}</li>
                  ))}
                </ul>
              </div>

              <div className="cockpit-subcard p-3 border-zinc-800/80 bg-zinc-950/60">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block mb-2">
                  Arquivos Manipulados Recentemente
                </span>
                <ul className="space-y-1.5 text-zinc-200 text-xs font-mono">
                  {selectedHost.recentFiles.map((file, idx) => (
                    <li key={idx} className="truncate p-1 bg-zinc-900/60 rounded border border-zinc-800/40">{file}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Infection assessment */}
            <div className="cockpit-subcard p-3 border-zinc-800/80 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-zinc-400 uppercase text-[10px] tracking-wider">Nível de Suspeita Heurística:</span>
              <span className={`telemetry-chip font-bold uppercase text-[10px] ${
                selectedHost.id === 'host-patient-zero'
                  ? "text-red-400 border-red-500/50 bg-red-950/60 font-mono"
                  : "text-zinc-400 border-zinc-700 bg-zinc-900 font-mono"
              }`}>
                {selectedHost.id === 'host-patient-zero' ? "CRÍTICO — Atividade Criptográfica" : "NORMAL — Sem Anomalias"}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={() => handleIsolate(selectedHost.id)}
              disabled={isLocked || completed || isolatedHosts.includes(selectedHost.id)}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                completed
                  ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 cursor-not-allowed"
                  : isolatedHosts.includes(selectedHost.id)
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  : isLocked
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "avionics-primary bg-red-950/80 border-red-500/60 hover:bg-red-900 text-red-200 shadow-md shadow-red-950/30"
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>PACIENTE ZERO ISOLADO — AMEAÇA CONTIDA</span>
                </>
              ) : isolatedHosts.includes(selectedHost.id) ? (
                <span>ENDPOINT JÁ ISOLADO</span>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>ISOLAR HOST DA REDE (CONTAINMENT)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
