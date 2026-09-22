"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Shield, CheckCircle2 } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface RuleItem {
  id: string;
  action: 'PERMIT' | 'DENY';
  source: string;
  dest: string;
  port: string;
  protocol: string;
  description: string;
}

const RAW_RULES: RuleItem[] = [
  {
    id: 'rule-rdp',
    action: 'PERMIT', // Inicialmente mal configurada!
    source: 'Any (Internet)',
    dest: 'Management-PC (10.0.5.10)',
    port: '3389 (RDP)',
    protocol: 'TCP',
    description: 'Acesso remoto administrativo exposto'
  },
  {
    id: 'rule-deny-all',
    action: 'DENY',
    source: 'Any (Internet)',
    dest: 'Any (LAN)',
    port: 'Any (*)',
    protocol: 'IP',
    description: 'Regra de descarte implícito (Default Drop)'
  },
  {
    id: 'rule-web',
    action: 'PERMIT',
    source: 'Any (Internet)',
    dest: 'Web-Server (10.0.1.50)',
    port: '443 (HTTPS)',
    protocol: 'TCP',
    description: 'Portal de clientes / E-commerce de produção'
  },
  {
    id: 'rule-c2',
    action: 'DENY',
    source: 'Internal-Net (10.0.0.0/16)',
    dest: '185.220.101.5 (Rogue C2)',
    port: '4444 (C2 Shell)',
    protocol: 'TCP',
    description: 'Bloqueio de canal de comando e controle'
  },
  {
    id: 'rule-ssh',
    action: 'PERMIT',
    source: 'Admin-VLAN (10.0.99.0/24)',
    dest: 'Management-PC (10.0.5.10)',
    port: '22 (SSH)',
    protocol: 'TCP',
    description: 'Acesso seguro do time de infraestrutura'
  }
];

export default function FirewallAclLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Initialize with shuffled order on mount
  const [rules, setRules] = useState<RuleItem[]>(() => {
    return deterministicShuffle(RAW_RULES, 202);
  });
  const [completed, setCompleted] = useState(false);

  const moveRule = (index: number, direction: 'up' | 'down') => {
    if (isLocked || completed) return;
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRules.length) return;

    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;
    setRules(newRules);
  };

  const toggleAction = (id: string) => {
    if (isLocked || completed) return;
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, action: r.action === 'PERMIT' ? 'DENY' : 'PERMIT' };
      }
      return r;
    }));
  };

  const handleApplyRules = () => {
    if (isLocked || completed) return;

    const denyAllIndex = rules.findIndex(r => r.id === 'rule-deny-all');
    const webIndex = rules.findIndex(r => r.id === 'rule-web');
    const rdpRule = rules.find(r => r.id === 'rule-rdp');

    // Trap 1: DENY ALL before HTTPS Web Traffic
    if (denyAllIndex !== -1 && webIndex !== -1 && denyAllIndex < webIndex) {
      onActionSubmit({
        correct: false,
        actionId: 'deny-before-https',
        errorType: 'dangerous_action',
        consequence: {
          title: 'INDISPONIBILIDADE DE SERVIÇO (OUTAGE)',
          actionTaken: 'Você inseriu uma regra DENY ALL antes da liberação do tráfego HTTPS legítimo.',
          consequence: 'O portal corporativo de e-commerce caiu para todos os clientes legítimos da internet.',
          severity: 'high'
        }
      });
      return;
    }

    // Trap 2: RDP rule is still PERMIT
    if (rdpRule && rdpRule.action === 'PERMIT') {
      onActionSubmit({
        correct: false,
        actionId: 'allow-rdp-any',
        errorType: 'dangerous_action',
        consequence: {
          title: 'EXPOSIÇÃO CRÍTICA DE PORTA DE GERÊNCIA',
          actionTaken: 'Você manteve a permissão de RDP (3389) aberta a partir de qualquer origem da internet.',
          consequence: 'A porta de gerenciamento remoto do servidor continuou respondendo a varreduras automatizadas externas.',
          severity: 'critical'
        }
      });
      return;
    }

    // Trap 3: DENY ALL is not at the bottom
    if (denyAllIndex !== rules.length - 1) {
      onActionSubmit({
        correct: false,
        actionId: 'deny-not-last',
        errorType: 'wrong_action',
        consequence: {
          title: 'REORDENAÇÃO INEFICAZ',
          actionTaken: 'A regra de descarte implícito (DENY ALL) não está posicionada na última linha.',
          consequence: 'Regras legítimas posicionadas abaixo da regra DENY ALL tornaram-se inacessíveis para o tráfego da rede.',
          severity: 'medium'
        }
      });
      return;
    }

    // Success!
    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'firewall-hardened'
    });
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            FIREWALL ACL EDITOR / INBOUND POLICY (TOP-DOWN EVALUATION)
          </span>
        </div>
        <span className="text-zinc-500 text-[10px]">
          Regras são avaliadas sequencialmente da linha 1 até a última
        </span>
      </div>

      {/* ACL Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-2.5 bg-zinc-950/80 border-b border-zinc-800 grid grid-cols-12 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Ação</div>
          <div className="col-span-3">Origem</div>
          <div className="col-span-3">Destino / Porta</div>
          <div className="col-span-3 text-right">Ordem Top-Down</div>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className={`p-2.5 grid grid-cols-12 items-center text-[11px] transition-colors ${
                rule.id === 'rule-deny-all' ? 'bg-zinc-950/60 font-semibold' : 'hover:bg-zinc-800/30'
              }`}
            >
              <div className="col-span-1 text-zinc-500 font-bold">{idx + 1}</div>

              <div className="col-span-2">
                <button
                  onClick={() => toggleAction(rule.id)}
                  disabled={isLocked || completed || rule.id === 'rule-deny-all'}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    rule.action === 'PERMIT'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                      : 'bg-red-950/80 border-red-500 text-red-400'
                  }`}
                >
                  {rule.action}
                </button>
              </div>

              <div className="col-span-3 text-zinc-300 truncate">
                {rule.source}
              </div>

              <div className="col-span-3">
                <div className="text-zinc-200 truncate">{rule.dest}</div>
                <div className="text-[10px] text-zinc-500">{rule.port}</div>
              </div>

              <div className="col-span-3 flex justify-end gap-1">
                <button
                  onClick={() => moveRule(idx, 'up')}
                  disabled={isLocked || completed || idx === 0}
                  className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded disabled:opacity-30"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveRule(idx, 'down')}
                  disabled={isLocked || completed || idx === rules.length - 1}
                  className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded disabled:opacity-30"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleApplyRules}
          disabled={isLocked || completed}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
            completed
              ? "bg-emerald-600 text-white cursor-not-allowed"
              : isLocked
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>REGRAS COMPILADAS NO FIREWALL</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span>APLICAR REGRAS NO FIREWALL DE BORDA</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
