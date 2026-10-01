"use client";

import { useState, useMemo } from "react";
import { ShieldAlert, CheckCircle2, Play, Network, CornerDownLeft } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface CommandHistory {
  command: string;
  output: string;
}

const COMMAND_OUTPUTS: Record<string, string> = {
  "help": "Comandos disponíveis: arp -a | tracert 8.8.8.8 | ping 192.168.1.1 | show mac-address-table | ipconfig /flushdns",
  "arp -a": 
`Interface: 192.168.1.25 --- 0x3
  Endereço IP          Endereço Físico (MAC)     Tipo
  192.168.1.1          00-0c-29-ab-12-99         dinâmico  [ALERTA: MAC DUPLICADO!]
  192.168.1.50         00-50-56-c0-00-50         dinâmico
  192.168.1.88         00-0c-29-ab-12-99         dinâmico  [ALERTA: MESMO MAC DO GATEWAY!]
  192.168.1.254        00-50-56-fe-88-11         dinâmico`,

  "tracert 8.8.8.8":
`Rastreando a rota para dns.google [8.8.8.8] com no máximo 30 saltos:
  1     2 ms     1 ms     2 ms  192.168.1.88  [INTERCEPTAÇÃO MITM - SALTO ANÔMALO]
  2    14 ms    12 ms    13 ms  192.168.1.1
  3    18 ms    17 ms    18 ms  200.189.80.1
  4    22 ms    21 ms    21 ms  8.8.8.8`,

  "ping 192.168.1.1":
`Disparando 192.168.1.1 com 32 bytes de dados:
Resposta de 192.168.1.1: bytes=32 tempo=2ms TTL=64 (Respondido via 00-0c-29-ab-12-99)
Resposta de 192.168.1.1: bytes=32 tempo=1ms TTL=64 (Respondido via 00-0c-29-ab-12-99)`,

  "show mac-address-table":
`Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
10      0050.56c0.0001    STATIC      Fa0/1   (Legitimate Gateway Router Interface)
10      0050.56c0.0050    DYNAMIC     Fa0/4   (Workstation WS-FIN)
10      000c.29ab.1299    DYNAMIC     Fa0/8   (ROUGE HOST / Kali Linux VM: 192.168.1.88)
10      0050.56fe.8811    DYNAMIC     Fa0/12  (Printer / AP)`,

  "ipconfig /flushdns":
`Configuração do IP do Windows
Liberação do Cache do Resolvedor DNS bem-sucedida.`
};

const RAW_MITIGATIONS = [
  {
    id: "isolate-port-8",
    title: "Isolar Porta Fa0/8 (Shutdown Switch Port & Ativar Port Security)",
    desc: "Corta a conexão da máquina invasora que está forjando ser o gateway padrão.",
    isCorrect: true
  },
  {
    id: "shutdown-gateway",
    title: "Desativar Interface Fa0/1 do Default Gateway Legítimo",
    desc: "Derruba a interface do roteador de borda oficial da corporação.",
    isCorrect: false
  },
  {
    id: "flush-dns",
    title: 'Executar "ipconfig /flushdns" nas estações locais',
    desc: "Tenta solucionar o problema limpando o cache DNS das máquinas locais.",
    isCorrect: false
  }
];

export default function NetworkCliLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled mitigations
  const mitigations = useMemo(() => deterministicShuffle(RAW_MITIGATIONS, 909), []);

  const [terminalInput, setTerminalInput] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      command: "system_init",
      output: "ROOTSEC NETWORK ANALYZER v4.2 -- Digite 'arp -a' ou 'help' para iniciar investigação."
    }
  ]);
  const [selectedMitigation, setSelectedMitigation] = useState<string>("");
  const [completed, setCompleted] = useState(false);

  const handleExecuteCommand = (cmdText?: string) => {
    const rawCmd = (cmdText || terminalInput).trim();
    if (!rawCmd) return;

    const lower = rawCmd.toLowerCase();
    const output = COMMAND_OUTPUTS[lower] || `Comando não reconhecido: '${rawCmd}'. Digite 'help' para listar os comandos.`;

    setHistory(prev => [...prev, { command: rawCmd, output }]);
    setTerminalInput("");
  };

  const handleApplyAction = () => {
    if (isLocked || completed) return;

    if (!selectedMitigation) {
      alert("Selecione a ação tática de contenção na camada de enlace/switch.");
      return;
    }

    if (selectedMitigation === "flush-dns") {
      onActionSubmit({
        correct: false,
        actionId: 'flush-all-dns',
        errorType: 'wrong_action',
        consequence: {
          title: 'AÇÃO INEFICAZ NA CAMADA DE APLICAÇÃO',
          actionTaken: 'Você apenas limpou o cache DNS com ipconfig /flushdns.',
          consequence: 'O ataque ocorre na camada 2 (Enlace/ARP); a limpeza do DNS não teve nenhum efeito sobre as respostas ARP envenenadas.',
          severity: 'medium'
        }
      });
      return;
    }

    if (selectedMitigation === "shutdown-gateway") {
      onActionSubmit({
        correct: false,
        actionId: 'shutdown-gateway',
        errorType: 'dangerous_action',
        consequence: {
          title: 'INTERRUPÇÃO DO GATEWAY LEGÍTIMO',
          actionTaken: 'Você desativou a interface do Default Gateway oficial.',
          consequence: 'Toda a filial perdeu conectividade de rede com a matriz e os serviços em nuvem.',
          severity: 'critical'
        }
      });
      return;
    }

    if (selectedMitigation === "isolate-port-8") {
      setCompleted(true);
      onActionSubmit({
        correct: true,
        actionId: 'port-security-isolated'
      });
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Network Header */}
      <div className="p-3 cockpit-card rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            INVESTIGAÇÃO CLI / ANÁLISE DE TRÁFEGO CAMADA 2 & 3
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span>Status Rede:</span>
          <span className="telemetry-chip border-red-500/40 text-red-400 bg-red-950/30 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            MAN-IN-THE-MIDDLE SUSPEITO
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Terminal */}
        <div className="lg:col-span-2 cockpit-card hud-bracket rounded-xl overflow-hidden flex flex-col h-[350px]">
          {/* Terminal Avionics Title Bar */}
          <div className="p-2.5 bg-white/[0.02] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="telemetry-chip border-cyan-500/30 text-cyan-300 bg-cyan-950/20 font-bold">
                SEC-WORKSTATION-CLI
              </span>
              <span className="telemetry-chip border-emerald-500/30 text-emerald-400 bg-emerald-950/20 font-bold">
                LINK: ACTIVE
              </span>
            </div>
            {/* Quick Command Pills */}
            <div className="flex items-center gap-1.5">
              {["arp -a", "tracert 8.8.8.8", "show mac-address-table"].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleExecuteCommand(cmd)}
                  className="avionics-button px-2.5 py-1 text-zinc-300 rounded text-[9px] font-mono font-bold"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[11px] font-mono leading-relaxed bg-[#05070a]/90">
            {history.map((item, idx) => (
              <div key={idx} className="space-y-1">
                {item.command !== "system_init" && (
                  <div className="text-cyan-400 flex items-center gap-1.5 font-bold">
                    <span className="text-zinc-500 font-normal">analyst@sec-workstation:~$</span>
                    <span>{item.command}</span>
                  </div>
                )}
                <pre className="text-zinc-300 whitespace-pre-wrap font-mono text-[10px] cockpit-subcard p-2.5 rounded border border-white/[0.05]">
                  {item.output}
                </pre>
              </div>
            ))}
          </div>

          {/* Terminal Input Bar */}
          <div className="p-2.5 bg-white/[0.02] border-t border-white/[0.06] flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-xs font-bold">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExecuteCommand()}
              placeholder="Digite comando (ex: arp -a, tracert 8.8.8.8, show mac-address-table)..."
              className="flex-1 bg-transparent text-zinc-200 text-xs focus:outline-none font-mono placeholder:text-zinc-600"
            />
            <button
              onClick={() => handleExecuteCommand()}
              className="avionics-button px-3 py-1 rounded text-zinc-200 text-[10px] font-mono font-bold flex items-center gap-1.5"
            >
              <CornerDownLeft className="w-3 h-3 text-cyan-400" />
              <span>Enter</span>
            </button>
          </div>
        </div>

        {/* Right Col: Remediation Decision */}
        <div className="cockpit-card rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-200 pb-2 border-b border-white/[0.08] flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="uppercase tracking-wider">AÇÃO TÁTICA DE CONTENÇÃO</span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Analise a saída do terminal, descubra a porta do switch onde o host invasor está conectado e aplique a mitigação correta:
            </p>

            <div className="space-y-2">
              {mitigations.map(mit => {
                const isSelected = selectedMitigation === mit.id;
                return (
                  <label
                    key={mit.id}
                    className={`block p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? mit.isCorrect
                          ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]"
                          : "bg-red-950/30 border-red-500/50 text-red-200 shadow-[inset_0_1px_0_0_rgba(239,68,68,0.2)]"
                        : "cockpit-subcard border-white/[0.06] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mitigation"
                        checked={isSelected}
                        onChange={() => setSelectedMitigation(mit.id)}
                        className="accent-cyan-500"
                      />
                      <span className="font-bold text-[10px] font-mono">
                        {mit.title}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-1 pl-5 font-sans leading-normal">
                      {mit.desc}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleApplyAction}
            disabled={isLocked || completed}
            className={`w-full py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600/90 text-white border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-not-allowed"
                : isLocked
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                : "avionics-primary text-white"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>ATAQUE MITM BLOQUEADO</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-200 fill-current" />
                <span>APLICAR MITIGAÇÃO DE REDE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
