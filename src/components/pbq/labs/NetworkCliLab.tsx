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
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            INVESTIGAÇÃO CLI / ANÁLISE DE TRÁFEGO CAMADA 2 & 3
          </span>
        </div>
        <div className="text-[10px] text-zinc-400">
          Status Rede: <span className="text-red-400 font-bold">MAN-IN-THE-MIDDLE SUSPEITO</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Terminal */}
        <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[340px]">
          {/* Terminal Title Bar */}
          <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] text-zinc-400 ml-2 font-mono">analyst@sec-workstation:~$</span>
            </div>
            {/* Quick Command Pills */}
            <div className="flex gap-1">
              {["arp -a", "tracert 8.8.8.8", "show mac-address-table"].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleExecuteCommand(cmd)}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] font-semibold border border-zinc-700"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[11px] font-mono leading-relaxed">
            {history.map((item, idx) => (
              <div key={idx} className="space-y-1">
                {item.command !== "system_init" && (
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <span className="text-zinc-500">analyst@sec-workstation:~$</span>
                    <span>{item.command}</span>
                  </div>
                )}
                <pre className="text-zinc-300 whitespace-pre-wrap font-mono text-[10px] bg-zinc-950/60 p-2 rounded border border-zinc-900">
                  {item.output}
                </pre>
              </div>
            ))}
          </div>

          {/* Terminal Input Bar */}
          <div className="p-2 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-xs">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExecuteCommand()}
              placeholder="Digite comando (ex: arp -a, tracert 8.8.8.8, show mac-address-table)..."
              className="flex-1 bg-transparent text-zinc-200 text-xs focus:outline-none font-mono"
            />
            <button
              onClick={() => handleExecuteCommand()}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] flex items-center gap-1"
            >
              <CornerDownLeft className="w-3 h-3" />
              <span>Enter</span>
            </button>
          </div>
        </div>

        {/* Right Col: Remediation Decision */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              AÇÃO TÁTICA DE CONTENÇÃO
            </div>

            <p className="text-[10px] text-zinc-400">
              Analise a saída do terminal, descubra a porta do switch onde o host invasor está conectado e aplique a mitigação correta:
            </p>

            <div className="space-y-2">
              {mitigations.map(mit => (
                <label
                  key={mit.id}
                  className={`block p-2.5 rounded border cursor-pointer ${
                    selectedMitigation === mit.id
                      ? mit.isCorrect
                        ? "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                        : "bg-red-950/30 border-red-500 text-red-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mitigation"
                      checked={selectedMitigation === mit.id}
                      onChange={() => setSelectedMitigation(mit.id)}
                    />
                    <span className="font-bold text-[10px]">
                      {mit.title}
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1 pl-5">
                    {mit.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyAction}
            disabled={isLocked || completed}
            className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600 text-white cursor-not-allowed"
                : isLocked
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ATAQUE MITM BLOQUEADO</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>APLICAR MITIGAÇÃO DE REDE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
