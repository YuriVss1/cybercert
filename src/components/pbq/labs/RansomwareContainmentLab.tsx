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
    <div className="space-y-3 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
          Host Topology — VLAN 10
        </span>
        <span className="text-[10px] text-zinc-600">
          Select a host to inspect telemetry
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
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-zinc-800 border-cyan-500/80 shadow-md shadow-cyan-950/20"
                    : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    host.isServer ? "bg-cyan-950/80 text-cyan-400 border border-cyan-850" : "bg-zinc-800 text-zinc-300"
                  }`}>
                    {host.isServer ? <Server className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{host.name}</span>
                      {isIsolated && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.2 rounded uppercase">
                          Isolado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">{host.ip}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-zinc-400 block font-semibold">CPU</span>
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
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-md">
          <div className="space-y-4">
            {/* Selected host header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-white font-bold text-base">
                  {selectedHost.name}
                </span>
                <span className="text-cyan-400 font-mono text-xs ml-3 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">{selectedHost.ip}</span>
                <span className="text-zinc-400 text-xs ml-2">({selectedHost.role})</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                isolatedHosts.includes(selectedHost.id)
                  ? "bg-red-950/80 text-red-400 border-red-800"
                  : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
              }`}>
                {isolatedHosts.includes(selectedHost.id) ? "Desconectado" : "Online"}
              </span>
            </div>

            {/* Telemetry data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                <span className="text-[11px] text-cyan-400 uppercase font-bold block mb-2">
                  Sessões SMB Ativas (Porta 445)
                </span>
                <ul className="space-y-1 text-zinc-200 text-xs font-mono">
                  {selectedHost.smbConnections.map((conn, idx) => (
                    <li key={idx} className="truncate">{conn}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                <span className="text-[11px] text-cyan-400 uppercase font-bold block mb-2">
                  Arquivos Manipulados Recentemente
                </span>
                <ul className="space-y-1 text-zinc-200 text-xs font-mono">
                  {selectedHost.recentFiles.map((file, idx) => (
                    <li key={idx} className="truncate">{file}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Infection assessment */}
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-300">Nível de Suspeita Heurística:</span>
              <span className={`font-bold uppercase px-2 py-0.5 rounded border ${
                selectedHost.id === 'host-patient-zero'
                  ? "bg-red-950/80 text-red-400 border-red-800"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
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
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                completed
                  ? "bg-emerald-600 text-white cursor-not-allowed"
                  : isolatedHosts.includes(selectedHost.id)
                  ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : isLocked
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40"
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PACIENTE ZERO ISOLADO — AMEAÇA CONTIDA</span>
                </>
              ) : isolatedHosts.includes(selectedHost.id) ? (
                <span>ENDPOINT JÁ ISOLADO</span>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
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
