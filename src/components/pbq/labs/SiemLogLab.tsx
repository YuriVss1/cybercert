"use client";

import { useState, useMemo } from "react";
import { Search, ShieldAlert, CheckCircle2, Terminal, Database, Ban } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface LogEntry {
  id: string;
  timestamp: string;
  eventId: number;
  eventDesc: string;
  user: string;
  sourceIp: string;
  destHost: string;
  status: string;
  isMalicious: boolean;
  rawDetails: string;
}

const SAMPLE_LOGS: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "14:22:01.104",
    eventId: 4625,
    eventDesc: "An account failed to log on",
    user: "svc_database",
    sourceIp: "185.220.101.44",
    destHost: "DC-PROD-01.corp",
    status: "0xC000006A (Bad Password)",
    isMalicious: true,
    rawDetails: "LogonType: 3 (Network) | SubStatus: 0xC000006A | CallerProcess: C:\\Windows\\System32\\lsass.exe | WorkstationName: ATTACK-RIG"
  },
  {
    id: "log-2",
    timestamp: "14:22:01.890",
    eventId: 4625,
    eventDesc: "An account failed to log on",
    user: "svc_database",
    sourceIp: "185.220.101.44",
    destHost: "DC-PROD-01.corp",
    status: "0xC000006A (Bad Password)",
    isMalicious: true,
    rawDetails: "LogonType: 3 (Network) | SubStatus: 0xC000006A | FailureReason: Unknown user name or bad password"
  },
  {
    id: "log-3",
    timestamp: "14:22:02.340",
    eventId: 4624,
    eventDesc: "An account was successfully logged on",
    user: "svc_monitor",
    sourceIp: "10.0.0.1",
    destHost: "DC-PROD-01.corp",
    status: "0x0 (Success)",
    isMalicious: false,
    rawDetails: "LogonType: 5 (Service) | AuthenticationPackage: Kerberos | TargetOutboundUserName: SYSTEM"
  },
  {
    id: "log-4",
    timestamp: "14:22:02.910",
    eventId: 4625,
    eventDesc: "An account failed to log on",
    user: "svc_database",
    sourceIp: "185.220.101.44",
    destHost: "DC-PROD-01.corp",
    status: "0xC000006A (Bad Password)",
    isMalicious: true,
    rawDetails: "LogonType: 3 (Network) | SubStatus: 0xC000006A | SourcePort: 49182 | Protocol: NTLMv2"
  },
  {
    id: "log-5",
    timestamp: "14:22:03.450",
    eventId: 4625,
    eventDesc: "An account failed to log on",
    user: "svc_database",
    sourceIp: "185.220.101.44",
    destHost: "DC-PROD-01.corp",
    status: "0xC000006A (Bad Password)",
    isMalicious: true,
    rawDetails: "LogonType: 3 (Network) | SubStatus: 0xC000006A | DictionaryAttackThreshold: EXCEEDED"
  },
  {
    id: "log-6",
    timestamp: "14:22:04.120",
    eventId: 4624,
    eventDesc: "An account was successfully logged on",
    user: "admin_backup",
    sourceIp: "192.168.1.50",
    destHost: "BACKUP-SRV-01",
    status: "0x0 (Success)",
    isMalicious: false,
    rawDetails: "LogonType: 2 (Interactive) | LogonProcessName: User32 | AuthenticationPackage: Negotiate"
  }
];

const RAW_IP_OPTIONS = [
  { ip: "185.220.101.44", label: "185.220.101.44 (Origem de 138 falhas 4625 sequenciais)" },
  { ip: "10.0.0.1", label: "10.0.0.1 (Domain Controller Principal da Corporação)" },
  { ip: "192.168.1.50", label: "192.168.1.50 (Estação admin_backup - Logon legítimo)" }
];

const RAW_ACCOUNT_OPTIONS = [
  { id: "lock-account", label: "Bloquear svc_database no AD e rotacionar hash Kerberos" },
  { id: "clear-logs", label: "Limpar logs de auditoria do SIEM para liberar CPU" },
  { id: "ignore-user", label: "Apenas manter observação passiva sem interrupção" }
];

export default function SiemLogLab({ onActionSubmit, isLocked }: PbqLabProps) {
  const [filterQuery, setFilterQuery] = useState("index=wineventlog EventCode=4625");
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "4625" | "4624">("4625");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(SAMPLE_LOGS[0]);

  // Shuffled options
  const ipOptions = useMemo(() => deterministicShuffle(RAW_IP_OPTIONS, 505), []);
  const accountOptions = useMemo(() => deterministicShuffle(RAW_ACCOUNT_OPTIONS, 506), []);

  // Actions state
  const [selectedBlockIp, setSelectedBlockIp] = useState<string>("");
  const [selectedAccountAction, setSelectedAccountAction] = useState<string>("");
  const [completed, setCompleted] = useState(false);

  const filteredLogs = SAMPLE_LOGS.filter(log => {
    if (activeFilterTab === "4625") return log.eventId === 4625;
    if (activeFilterTab === "4624") return log.eventId === 4624;
    return true;
  });

  const handleApplyRemediation = () => {
    if (isLocked || completed) return;

    if (!selectedBlockIp || !selectedAccountAction) {
      alert("Selecione o IP para bloqueio perimetral e a ação sobre a conta visada.");
      return;
    }

    // Trap 1: Blocking internal DC IP
    if (selectedBlockIp === "10.0.0.1") {
      onActionSubmit({
        correct: false,
        actionId: 'block-internal-ip',
        errorType: 'wrong_target',
        consequence: {
          title: 'BLOQUEIO DO CONTROLADOR DE DOMÍNIO',
          actionTaken: 'Você bloqueou o IP do Domain Controller interno (10.0.0.1) em vez do IP externo atacante.',
          consequence: 'Nenhum usuário da rede corporativa conseguiu autenticar em suas estações de trabalho.',
          severity: 'critical'
        }
      });
      return;
    }

    // Trap 2: Disabling logging / Clear SIEM queue
    if (selectedAccountAction === "clear-logs") {
      onActionSubmit({
        correct: false,
        actionId: 'disable-logging',
        errorType: 'dangerous_action',
        consequence: {
          title: 'DESTRUIÇÃO DE TELEMETRIA FORENSE',
          actionTaken: 'Você limpou a fila de logs do SIEM para reduzir o consumo de CPU.',
          consequence: 'A equipe de perícia forense perdeu todas as evidências temporais do ataque.',
          severity: 'high'
        }
      });
      return;
    }

    // Trap 3: Passive observation
    if (selectedAccountAction === "ignore-user") {
      onActionSubmit({
        correct: false,
        actionId: 'ignore-user',
        errorType: 'incomplete_action',
        consequence: {
          title: 'OMISSÃO DE RESPOSTA A INCIDENTES',
          actionTaken: 'Você manteve observação passiva sem mitigar o ataque na conta.',
          consequence: 'O processo automatizado de força bruta continuou testando combinações de senha.',
          severity: 'medium'
        }
      });
      return;
    }

    // Correct combination: 185.220.101.44 + lock-account
    if (selectedBlockIp === "185.220.101.44" && selectedAccountAction === "lock-account") {
      setCompleted(true);
      onActionSubmit({
        correct: true,
        actionId: 'siem-bruteforce-mitigated'
      });
    } else {
      onActionSubmit({
        correct: false,
        actionId: 'incorrect-target-ip',
        errorType: 'wrong_target',
        consequence: {
          title: 'IP DE ORIGEM INCORRETO',
          actionTaken: `Você selecionou ${selectedBlockIp} para a regra de descarte.`,
          consequence: 'O IP externo agressor permaneceu sem restrições no firewall de borda.',
          severity: 'high'
        }
      });
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* SIEM Search Header */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <div className="flex items-center gap-2 text-amber-400 font-semibold uppercase tracking-wider text-[11px] shrink-0">
          <Terminal className="w-4 h-4" />
          <span>SIEM SPL QUERY:</span>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-3 py-1.5 pl-8 focus:border-amber-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => { setActiveFilterTab("4625"); setFilterQuery("index=wineventlog EventCode=4625"); }}
            className={`px-2.5 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
              activeFilterTab === "4625"
                ? "bg-red-950/60 border-red-500 text-red-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Event 4625 (Falha)
          </button>
          <button
            onClick={() => { setActiveFilterTab("4624"); setFilterQuery("index=wineventlog EventCode=4624"); }}
            className={`px-2.5 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
              activeFilterTab === "4624"
                ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Event 4624 (Sucesso)
          </button>
          <button
            onClick={() => { setActiveFilterTab("ALL"); setFilterQuery("index=wineventlog *"); }}
            className={`px-2.5 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
              activeFilterTab === "ALL"
                ? "bg-blue-950/60 border-blue-500 text-blue-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Events Table & Detail Inspector */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-2.5 bg-zinc-950/80 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                TELEMETRIA DE LOGS CORRELACIONADOS ({filteredLogs.length})
              </span>
              <span className="text-[10px] text-zinc-500">Clique na linha para inspecionar</span>
            </div>

            <div className="divide-y divide-zinc-800/60 max-h-[260px] overflow-y-auto">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between text-[11px] ${
                    selectedLog?.id === log.id
                      ? "bg-zinc-800/90 border-l-4 border-l-amber-500"
                      : "hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.eventId === 4625
                        ? "bg-red-950/80 text-red-400 border border-red-800/60"
                        : "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                    }`}>
                      ID {log.eventId}
                    </span>
                    <div>
                      <div className="text-zinc-200 font-semibold">{log.user}</div>
                      <div className="text-[10px] text-zinc-400">{log.eventDesc}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${log.isMalicious ? "text-red-400" : "text-zinc-300"}`}>
                      {log.sourceIp}
                    </div>
                    <div className="text-[10px] text-zinc-500">{log.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Raw Log Box */}
          {selectedLog && (
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                <span>INSPEÇÃO DETALHADA: EVENTO {selectedLog.eventId}</span>
                <span className="text-zinc-500">{selectedLog.timestamp}</span>
              </div>
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800/80 text-[10px] text-zinc-300 font-mono space-y-1">
                <div><strong className="text-zinc-400">Target Host:</strong> {selectedLog.destHost}</div>
                <div><strong className="text-zinc-400">Account Name:</strong> {selectedLog.user}</div>
                <div><strong className="text-zinc-400">Source Network Address:</strong> {selectedLog.sourceIp}</div>
                <div><strong className="text-zinc-400">Status Code:</strong> {selectedLog.status}</div>
                <div className="text-amber-400/90 pt-1 border-t border-zinc-800">
                  <strong>Extended Telemetry:</strong> {selectedLog.rawDetails}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Remediation Actions */}
        <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-zinc-200 font-bold tracking-wide">PLANO DE RESPOSTA</span>
          </div>

          {/* Action 1: Edge Firewall Block */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-300 font-semibold block">
              1. IP DE ORIGEM PARA DROP NO FIREWALL DE BORDA:
            </label>
            <div className="space-y-1.5">
              {ipOptions.map(opt => (
                <label
                  key={opt.ip}
                  className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                    selectedBlockIp === opt.ip
                      ? "bg-amber-950/30 border-amber-500 text-amber-200"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="blockIp"
                    value={opt.ip}
                    checked={selectedBlockIp === opt.ip}
                    onChange={(e) => setSelectedBlockIp(e.target.value)}
                    className="mt-0.5 text-amber-500 focus:ring-0"
                  />
                  <span className="text-[10px] leading-tight">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action 2: Target Account Action */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="text-[11px] text-zinc-300 font-semibold block">
              2. MEDIDA DE CONTENÇÃO NA CONTA ALVO:
            </label>
            <div className="space-y-1.5">
              {accountOptions.map(act => (
                <label
                  key={act.id}
                  className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                    selectedAccountAction === act.id
                      ? "bg-amber-950/30 border-amber-500 text-amber-200"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="accountAction"
                    value={act.id}
                    checked={selectedAccountAction === act.id}
                    onChange={(e) => setSelectedAccountAction(e.target.value)}
                    className="mt-0.5 text-amber-500 focus:ring-0"
                  />
                  <span className="text-[10px] leading-tight">{act.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyRemediation}
            disabled={isLocked || completed}
            className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600 text-white cursor-not-allowed"
                : isLocked
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ATAQUE NEUTRALIZADO</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>APLICAR BLOQUEIO DE PERÍMETRO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
