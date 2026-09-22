"use client";

import { useState } from "react";
import { Key, Check, RefreshCw, Trash2, Lock, ShieldCheck } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

interface PolicyItem {
  id: string;
  name: string;
  type: string;
  isRogue: boolean;
  attached: boolean;
  statement: string;
}

const RAW_POLICIES: PolicyItem[] = [
  { id: 'pol-backup', name: 'AWSBackupOperatorAccess', type: 'Customer Managed', isRogue: false, attached: true, statement: '{"Effect": "Allow", "Action": "backup:*", "Resource": "arn:aws:backup:*"}' },
  { id: 'pol-admin', name: 'AdministratorAccess', type: 'AWS Managed', isRogue: true, attached: true, statement: '{"Effect": "Allow", "Action": "*", "Resource": "*"}' },
  { id: 'pol-s3', name: 'AmazonS3ReadOnlyAccess', type: 'AWS Managed', isRogue: false, attached: true, statement: '{"Effect": "Allow", "Action": ["s3:Get*", "s3:List*"], "Resource": "*"}' }
];

export default function IamPrivilegeLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled policies on mount
  const [policies, setPolicies] = useState<PolicyItem[]>(() => {
    return deterministicShuffle(RAW_POLICIES, 303);
  });

  const [keysRotated, setKeysRotated] = useState(false);
  const [mfaEnforced, setMfaEnforced] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleDetach = (policyId: string) => {
    if (isLocked || completed) return;
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, attached: false } : p));
  };

  const handleDeleteUser = () => {
    if (isLocked || completed) return;
    onActionSubmit({
      correct: false,
      actionId: 'delete-account',
      errorType: 'dangerous_action',
      consequence: {
        title: 'DELEÇÃO DESTRUTIVA DE CONTA',
        actionTaken: 'Você deletou a conta de serviço inteira em vez de apenas revogar os privilégios indevidos.',
        consequence: 'Todas as rotinas diárias automatizadas de backup do banco de dados de clientes falharam imediatamente.',
        severity: 'high'
      }
    });
  };

  const handleSubmit = () => {
    if (isLocked || completed) return;

    const adminPolicy = policies.find(p => p.id === 'pol-admin');
    
    // Trap 1: Admin wildcard kept
    if (adminPolicy && adminPolicy.attached) {
      onActionSubmit({
        correct: false,
        actionId: 'keep-wildcard',
        errorType: 'dangerous_action',
        consequence: {
          title: 'MANUTENÇÃO DE WILDCARD DE ALTO RISCO',
          actionTaken: 'A política com wildcard completo (*:*) permaneceu anexada à identidade svc-backup.',
          consequence: 'O invasor manteve privilégios administrativos globais e executou criação de instâncias não autorizadas.',
          severity: 'critical'
        }
      });
      return;
    }

    // Trap 2: Incomplete action - forgot to rotate the leaked access key
    if (!keysRotated) {
      onActionSubmit({
        correct: false,
        actionId: 'unrotated-key',
        errorType: 'incomplete_action',
        consequence: {
          title: 'CHAVE COMPROMETIDA AINDA ATIVA',
          actionTaken: 'Você alterou as políticas porém manteve a Access Key vazada ativa no IAM.',
          consequence: 'O invasor continuou utilizando a chave de API existente para realizar chamadas autenticadas na CLI da AWS.',
          severity: 'high'
        }
      });
      return;
    }

    // Success!
    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'iam-remediation-success'
    });
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Identity Banner */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold text-sm">IAM Identity: svc-backup</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-900 font-bold">
              POLÍTICA ANÔMALA
            </span>
          </div>
          <p className="text-zinc-500 text-[11px]">ARN: arn:aws:iam::948122019012:user/automation/svc-backup</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setKeysRotated(!keysRotated)}
            disabled={isLocked || completed}
            className={`px-3 py-1.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              keysRotated
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{keysRotated ? 'Access Keys Rotacionadas' : 'Rotacionar Access Keys'}</span>
          </button>

          <button
            onClick={() => setMfaEnforced(!mfaEnforced)}
            disabled={isLocked || completed}
            className={`px-3 py-1.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              mfaEnforced
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{mfaEnforced ? 'MFA Ativo' : 'Exigir MFA na Condição'}</span>
          </button>

          <button
            onClick={handleDeleteUser}
            disabled={isLocked || completed}
            className="px-3 py-1.5 rounded border text-[11px] font-bold transition-all flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deletar Conta</span>
          </button>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-2">
        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
          Políticas IAM Anexadas (Inspecione permissões excessivas e revogue):
        </span>

        {policies.map(policy => (
          <div
            key={policy.id}
            className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              policy.attached
                ? policy.isRogue
                  ? 'bg-red-950/20 border-red-800/80'
                  : 'bg-zinc-900/80 border-zinc-800'
                : 'bg-zinc-950/40 border-zinc-900 opacity-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${policy.isRogue && policy.attached ? 'text-red-400' : 'text-zinc-200'}`}>
                  {policy.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">({policy.type})</span>
                {!policy.attached && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400">
                    DESANEXADA
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-1 bg-zinc-950 p-1.5 rounded border border-zinc-850 truncate max-w-xl">
                Statement: {policy.statement}
              </p>
            </div>

            {policy.attached ? (
              <button
                onClick={() => handleDetach(policy.id)}
                disabled={isLocked || completed}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold border border-zinc-700 shrink-0"
              >
                DESANEXAR POLÍTICA
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 font-bold shrink-0">Revogado</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={isLocked || completed}
          className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
            completed
              ? "bg-emerald-600 text-white cursor-not-allowed"
              : isLocked
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          {completed ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>POLÍTICAS IAM REMEDIADAS</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>APLICAR REMEDIAÇÃO LEAST PRIVILEGE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
