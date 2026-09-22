"use client";

import { useState, useMemo } from "react";
import { Activity, ShieldAlert, CheckCircle2, RefreshCw, ArrowUpRight, Ban } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface NetFlowRecord {
  id: string;
  source: string;
  destination: string;
  proto: string;
  port: number;
  transferredBytes: string;
  duration: string;
  geoAsn: string;
  isExfiltration: boolean;
}

const RAW_FLOWS: NetFlowRecord[] = [
  {
    id: "flow-exfil",
    source: "10.10.40.10:52189 (DB-PROD-01)",
    destination: "198.51.100.77:443",
    proto: "TCP",
    port: 443,
    transferredBytes: "9.84 GB",
    duration: "11m 42s",
    geoAsn: "AS48123 (HostCloud - Bucareste, RO)",
    isExfiltration: true
  },
  {
    id: "flow-smb",
    source: "10.10.40.10:445 (DB-PROD-01)",
    destination: "10.10.40.20:445 (BACKUP-SRV)",
    proto: "TCP",
    port: 445,
    transferredBytes: "48.2 MB",
    duration: "4m 10s",
    geoAsn: "Rede Interna LAN",
    isExfiltration: false
  },
  {
    id: "flow-ntp",
    source: "10.10.40.10:123 (DB-PROD-01)",
    destination: "200.160.7.186:123 (NTP.br)",
    proto: "UDP",
    port: 123,
    transferredBytes: "3.4 KB",
    duration: "1s",
    geoAsn: "AS22548 (NIC.br)",
    isExfiltration: false
  },
  {
    id: "flow-http",
    source: "10.10.40.10:80 (DB-PROD-01)",
    destination: "91.189.91.38:80 (Ubuntu Mirror)",
    proto: "TCP",
    port: 80,
    transferredBytes: "14.1 MB",
    duration: "35s",
    geoAsn: "AS41231 (Canonical Ltd)",
    isExfiltration: false
  }
];

export default function DataExfilLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled flow list
  const flows = useMemo(() => deterministicShuffle(RAW_FLOWS, 1010), []);

  const [selectedFlow, setSelectedFlow] = useState<NetFlowRecord>(flows[0]);
  const [blockedPort, setBlockedPort] = useState<"443" | "80" | "ALL">("443");
  const [targetDestinationIp, setTargetDestinationIp] = useState<string>("198.51.100.77");
  const [completed, setCompleted] = useState(false);

  const handleRebootServer = () => {
    if (isLocked || completed) return;
    onActionSubmit({
      correct: false,
      actionId: 'restart-server',
      errorType: 'dangerous_action',
      consequence: {
        title: 'REINICIALIZAÇÃO INOPORTUNA DE SERVIÇO',
        actionTaken: 'Você reiniciou o servidor de banco de dados enquanto a exfiltração ocorria.',
        consequence: 'O processo já residia na memória e retomou o fluxo de dados automaticamente após o reboot, gerando indisponibilidade nas aplicações.',
        severity: 'high'
      }
    });
  };

  const handleApplyEgressBlock = () => {
    if (isLocked || completed) return;

    if (blockedPort === "80") {
      onActionSubmit({
        correct: false,
        actionId: 'block-wrong-port',
        errorType: 'wrong_action',
        consequence: {
          title: 'FILTRAGEM DE PORTA INCORRETA',
          actionTaken: 'Você bloqueou a porta 80/TCP enquanto a exfiltração ocorria via túnel criptografado 443/TCP.',
          consequence: 'A transferência maliciosa continuou inalterada pela porta 443 até a conclusão do upload.',
          severity: 'critical'
        }
      });
      return;
    }

    if (targetDestinationIp.trim() !== "198.51.100.77") {
      onActionSubmit({
        correct: false,
        actionId: 'wrong-destination-ip',
        errorType: 'wrong_target',
        consequence: {
          title: 'IP DE DESTINO INCORRETO',
          actionTaken: `Você configurou o bloqueio para o endereço ${targetDestinationIp}.`,
          consequence: 'O canal com o IP externo 198.51.100.77 não foi interrompido e a exfiltração continuou.',
          severity: 'high'
        }
      });
      return;
    }

    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'exfiltration-blocked'
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Sensor Header */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            ZEEK / NETFLOW EGRESS MONITOR (CORE GATEWAY SENSOR)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
            EGRESS SPIKE: 9.84 GB DETECTADO
          </span>
          <button
            onClick={handleRebootServer}
            disabled={isLocked || completed}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Reiniciar Servidor DB</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Flow Telemetry Table */}
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-zinc-950/80 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                CONEXÕES ATIVAS DE SAÍDA (EGRESS SESSIONS)
              </span>
              <span className="text-[10px] text-zinc-500">Selecione para inspecionar</span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {flows.map(flow => {
                const isSelected = selectedFlow.id === flow.id;
                return (
                  <div
                    key={flow.id}
                    onClick={() => {
                      setSelectedFlow(flow);
                      if (flow.isExfiltration) setTargetDestinationIp("198.51.100.77");
                    }}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-zinc-800/80 border-l-4 border-l-rose-500"
                        : "hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-200 font-bold">{flow.source}</span>
                        <span className="text-zinc-500">→</span>
                        <span className={`font-bold ${flow.isExfiltration ? "text-red-400" : "text-zinc-300"}`}>
                          {flow.destination}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        flow.isExfiltration
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : "bg-zinc-950 text-zinc-400"
                      }`}>
                        {flow.transferredBytes}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Proto: {flow.proto} / Porta {flow.port} | Duração: {flow.duration}</span>
                      <span className="text-zinc-500">{flow.geoAsn}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspector at bottom of left column */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[10px] space-y-1">
            <div className="text-zinc-300 font-bold flex items-center justify-between">
              <span>DETALHES DO FLUXO SELECIONADO: {selectedFlow.destination}</span>
              <span className={selectedFlow.isExfiltration ? "text-red-400 font-bold" : "text-emerald-400"}>
                {selectedFlow.isExfiltration ? "CRITICAL RISK: DATA EXFILTRATION" : "LEGITIMATE TRAFFIC"}
              </span>
            </div>
            <div className="text-zinc-400">
              Origem local: {selectedFlow.source} | ASN Destino: {selectedFlow.geoAsn}
            </div>
            {selectedFlow.isExfiltration && (
              <div className="p-2 bg-red-950/30 border border-red-900/60 rounded text-red-200 mt-1">
                Alerta Heurístico: Conexão direta de longa duração com criptografia TLS transportando arquivos de backup compactados fora da esteira regular.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Remediation Decision */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              CONTENÇÃO NO FIREWALL PERIMETRAL
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 block">
                1. IP DE DESTINO PARA REGRA DE DROP:
              </label>
              <input
                type="text"
                value={targetDestinationIp}
                onChange={(e) => setTargetDestinationIp(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded px-2.5 py-1.5 focus:border-rose-500 focus:outline-none text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 block">
                2. PORTA / PROTOCOLO ALVO:
              </label>
              <div className="space-y-2">
                <label className={`block p-2 rounded border cursor-pointer ${
                  blockedPort === "443" ? "bg-rose-950/30 border-rose-500" : "bg-zinc-950 border-zinc-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="port"
                      checked={blockedPort === "443"}
                      onChange={() => setBlockedPort("443")}
                    />
                    <span className="font-bold text-rose-400 text-[11px]">TCP 443 (Túnel Criptografado TLS)</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1 pl-5">
                    Porta onde o tráfego anômalo de 9.8 GB está sendo transmitido no momento.
                  </p>
                </label>

                <label className={`block p-2 rounded border cursor-pointer ${
                  blockedPort === "80" ? "bg-amber-950/30 border-amber-500" : "bg-zinc-950 border-zinc-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="port"
                      checked={blockedPort === "80"}
                      onChange={() => setBlockedPort("80")}
                    />
                    <span className="font-bold text-amber-400 text-[11px]">TCP 80 (HTTP Não Seguro)</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1 pl-5">
                    Porta padrão para tráfego web sem criptografia.
                  </p>
                </label>
              </div>
            </div>

            {/* Generated ACL syntax */}
            <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-[9px] text-zinc-400 font-mono">
              <span className="text-zinc-500">Regra de Borda Gerada:</span>
              <div className="text-rose-400 mt-0.5">
                access-list EGRESS_FILTER deny tcp host 10.10.40.10 host {targetDestinationIp} eq {blockedPort}
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyEgressBlock}
            disabled={isLocked || completed}
            className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600 text-white cursor-not-allowed"
                : isLocked
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>EXFILTRAÇÃO INTERROMPIDA</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>INTERROMPER FLUXO & APLICAR DROP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
