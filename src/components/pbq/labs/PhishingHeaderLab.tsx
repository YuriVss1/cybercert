"use client";

import { useState, useMemo } from "react";
import { Mail, ShieldCheck, Ban, Archive } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface Indicator {
  id: string;
  label: string;
  isRealIndicator: boolean;
}

const RAW_INDICATORS: Indicator[] = [
  { id: 'spf-fail', label: 'Received-SPF com resultado Fail (IP não autorizado no TXT)', isRealIndicator: true },
  { id: 'punycode', label: 'Uso de domínio homógrafo / punycode enganoso (xn--pypal-4ve.com)', isRealIndicator: true },
  { id: 'dkim-mismatch', label: 'Falha de assinatura DKIM (discrepância de d=darkweb-drop.ru)', isRealIndicator: true },
  { id: 'macro-attachment', label: 'Anexo com extensão executável/macro (.docm compactado)', isRealIndicator: true }
];

export default function PhishingHeaderLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled indicators
  const indicators = useMemo(() => {
    return deterministicShuffle(RAW_INDICATORS, 404);
  }, []);

  const [selectedFlags, setSelectedFlags] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);

  const toggleFlag = (id: string) => {
    if (isLocked || completed) return;
    setSelectedFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAction = (actionType: 'whitelist' | 'ignore' | 'quarantine') => {
    if (isLocked || completed) return;

    if (actionType === 'whitelist') {
      onActionSubmit({
        correct: false,
        actionId: 'whitelist-sender',
        errorType: 'dangerous_action',
        consequence: {
          title: 'LIBERAÇÃO INDEVIDA DE REMETENTE MALICIOSO',
          actionTaken: 'Você colocou o domínio remetente na whitelist de confiança.',
          consequence: 'O invasor passou a enviar centenas de e-mails de phishing diretamente para a caixa de todos os colaboradores sem inspeção.',
          severity: 'critical'
        }
      });
      return;
    }

    if (actionType === 'ignore') {
      onActionSubmit({
        correct: false,
        actionId: 'ignore-spf-fail',
        errorType: 'missed_indicator',
        consequence: {
          title: 'FALHA DE VALIDAÇÃO DE AUTENTICIDADE',
          actionTaken: 'Você marcou como legítimo um e-mail com resultado "SPF: Fail" e "DKIM: None".',
          consequence: 'Credenciais corporativas de funcionários foram capturadas na página falsa de login.',
          severity: 'high'
        }
      });
      return;
    }

    if (actionType === 'quarantine') {
      const flaggedCount = Object.values(selectedFlags).filter(Boolean).length;
      if (flaggedCount < 2) {
        onActionSubmit({
          correct: false,
          actionId: 'incomplete-indicators',
          errorType: 'incomplete_action',
          consequence: {
            title: 'INDICADORES FORENSES INCOMPLETOS',
            actionTaken: 'Você solicitou quarentena sem assinalar as evidências técnicas do cabeçalho.',
            consequence: 'O relatório do SOC foi rejeitado por ausência de evidências documentadas de SPF/DKIM para alimentar as regras do gateway.',
            severity: 'medium'
          }
        });
        return;
      }

      setCompleted(true);
      onActionSubmit({
        correct: true,
        actionId: 'quarantine-and-block'
      });
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Raw Email Headers Viewer */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-200 font-bold text-xs uppercase tracking-wider">
              RFC 822 EMAIL HEADERS // VISUALIZADOR FORENSE DE MTA
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-900 font-bold">
            GATEWAY HOLD
          </span>
        </div>

        <div className="bg-black/80 border border-zinc-900 rounded p-3 space-y-1.5 overflow-x-auto text-[11px] leading-relaxed text-zinc-300 font-mono">
          <div><strong className="text-zinc-500">From:</strong> CEO Office &lt;ceo@pаypal.com&gt; <span className="text-red-400 text-[10px]">[Punycode: xn--pypal-4ve.com]</span></div>
          <div><strong className="text-zinc-500">To:</strong> financeiro@empresa.com</div>
          <div><strong className="text-zinc-500">Subject:</strong> URGENTE: Autorização de Pagamento Imediato</div>
          <div><strong className="text-zinc-500">Received-SPF:</strong> <span className="text-red-400 font-bold">Fail</span> (mx.empresa.com: domain of paypal.com does not designate 195.12.50.4 as permitted sender)</div>
          <div><strong className="text-zinc-500">Authentication-Results:</strong> dkim=<span className="text-red-400 font-bold">fail (domain mismatch d=darkweb-drop.ru)</span>; dmarc=fail</div>
          <div><strong className="text-zinc-500">Return-Path:</strong> &lt;bounce-catcher@darkweb-drop.ru&gt;</div>
          <div><strong className="text-zinc-500">X-Originating-IP:</strong> [195.12.50.4] (AS4812 - Tor Exit Node / Bucareste)</div>
          <div><strong className="text-zinc-500">Attachment:</strong> comprovante_solicitacao.docm (Contém VBA Macro Oculta)</div>
        </div>
      </div>

      {/* Forensic Checklist & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Checklist */}
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2.5">
          <span className="text-[11px] text-zinc-300 font-bold uppercase block pb-1 border-b border-zinc-800">
            1. Marque os Indicadores de Comprometimento (IoC):
          </span>
          <div className="space-y-1.5">
            {indicators.map(ind => (
              <label
                key={ind.id}
                onClick={() => toggleFlag(ind.id)}
                className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors text-[11px] ${
                  selectedFlags[ind.id]
                    ? 'bg-amber-950/30 border-amber-500 text-amber-200'
                    : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(selectedFlags[ind.id])}
                  onChange={() => {}}
                  className="mt-0.5 text-amber-500 focus:ring-0 rounded"
                />
                <span className="leading-tight">{ind.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-zinc-300 font-bold uppercase block pb-1 border-b border-zinc-800 mb-3">
              2. Ação Operacional no Gateway de E-mail:
            </span>
            <div className="space-y-2">
              <button
                onClick={() => handleAction('quarantine')}
                disabled={isLocked || completed}
                className="w-full py-2.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
              >
                <Archive className="w-4 h-4" />
                <span>[ QUARENTENA & BLOQUEIO DE MTA ]</span>
              </button>

              <button
                onClick={() => handleAction('whitelist')}
                disabled={isLocked || completed}
                className="w-full py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Adicionar à Whitelist de Confiança</span>
              </button>

              <button
                onClick={() => handleAction('ignore')}
                disabled={isLocked || completed}
                className="w-full py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Ban className="w-4 h-4 text-amber-400" />
                <span>Liberar Mensagem para a Caixa Postal</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 italic">
            * A decisão no MTA é definitiva para as caixas de correio da corporação.
          </div>
        </div>
      </div>
    </div>
  );
}
