"use client";

import { useState, useMemo } from "react";
import { Cloud, Lock, Unlock, CheckCircle2, Trash2, Key, ShieldCheck, AlertTriangle } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

type PrincipalType = "PUBLIC_STAR" | "AUTHORIZED_ROLE" | "PUBLIC_WRITE";

const RAW_OPTIONS = [
  {
    type: "PUBLIC_STAR" as PrincipalType,
    title: '"Principal": "*" (Acesso Público Total)',
    desc: 'Permite que qualquer pessoa não autenticada na internet execute GetObject.',
    color: 'text-red-400'
  },
  {
    type: "AUTHORIZED_ROLE" as PrincipalType,
    title: '"Principal": "arn:aws:iam::948122019012:role/FinanceAppRole"',
    desc: 'Restringe o acesso estritamente à role da aplicação interna autenticada.',
    color: 'text-emerald-400'
  },
  {
    type: "PUBLIC_WRITE" as PrincipalType,
    title: '"Action": ["s3:GetObject", "s3:PutObject"], "Principal": "*"',
    desc: 'Concede permissão de download e upload público irrestrito.',
    color: 'text-amber-400'
  }
];

export default function CloudS3Lab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled radio options
  const options = useMemo(() => deterministicShuffle(RAW_OPTIONS, 707), []);

  const [principalOption, setPrincipalOption] = useState<PrincipalType>("PUBLIC_STAR");
  const [blockPublicAccess, setBlockPublicAccess] = useState<boolean>(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState<boolean>(false);
  const [completed, setCompleted] = useState(false);

  const handleDeleteBucket = () => {
    if (isLocked || completed) return;
    onActionSubmit({
      correct: false,
      actionId: 'delete-bucket',
      errorType: 'dangerous_action',
      consequence: {
        title: 'PERDA TOTAL DE DADOS HISTÓRICOS',
        actionTaken: 'Você apagou o bucket inteiro em vez de apenas restringir o acesso público.',
        consequence: 'Todos os registros fiscais históricos dos últimos 5 anos foram permanentemente perdidos.',
        severity: 'critical'
      }
    });
  };

  const handleApplyHardening = () => {
    if (isLocked || completed) return;

    if (principalOption === "PUBLIC_WRITE") {
      onActionSubmit({
        correct: false,
        actionId: 'make-writeable',
        errorType: 'dangerous_action',
        consequence: {
          title: 'PERMISSÃO DE ESCRITA PÚBLICA CONCEDIDA',
          actionTaken: 'Você concedeu permissão s3:PutObject aberta para a internet.',
          consequence: 'Usuários anônimos da internet começaram a usar o bucket da empresa para hospedar arquivos arbitrários.',
          severity: 'critical'
        }
      });
      return;
    }

    if (principalOption === "PUBLIC_STAR") {
      onActionSubmit({
        correct: false,
        actionId: 'keep-public-star',
        errorType: 'wrong_action',
        consequence: {
          title: 'ACESSO PÚBLICO CONTINUA ATIVO',
          actionTaken: 'A política do bucket ainda contém "Principal": "*".',
          consequence: 'Qualquer usuário não autenticado continua conseguindo efetuar download de dados fiscais sigilosos.',
          severity: 'high'
        }
      });
      return;
    }

    if (!blockPublicAccess) {
      onActionSubmit({
        correct: false,
        actionId: 'missed-bpa',
        errorType: 'incomplete_action',
        consequence: {
          title: 'BLOQUEIO PÚBLICO NATIVO DESATIVADO',
          actionTaken: 'A salvaguarda de Block Public Access permaneceu desativada no nível do bucket.',
          consequence: 'ACLs individuais de objetos continuam permitindo exposição para a internet.',
          severity: 'medium'
        }
      });
      return;
    }

    if (!encryptionEnabled) {
      onActionSubmit({
        correct: false,
        actionId: 'missed-kms',
        errorType: 'incomplete_action',
        consequence: {
          title: 'DADOS EM REPOUSO SEM CRIPTOGRAFIA',
          actionTaken: 'A criptografia padrão SSE-KMS em repouso não foi habilitada.',
          consequence: 'Arquivos gravados não possuem proteção criptográfica exigida pelas normas de compliance.',
          severity: 'medium'
        }
      });
      return;
    }

    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 's3-hardening-success'
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* -------------------------------------------------------------------- */}
      {/* CLOUD S3 HEADER / MISSION PANEL                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="cockpit-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] font-mono">
            AWS S3 CONSOLE / BUCKET: s3://financial-records-internal
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`telemetry-chip text-[10px] font-bold ${
            blockPublicAccess
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
              : "border-red-500/40 bg-red-950/40 text-red-400"
          }`}>
            {blockPublicAccess ? "PUBLIC ACCESS BLOCKED" : "PUBLIC ACCESS: OPEN TO INTERNET"}
          </span>
          <button
            type="button"
            onClick={handleDeleteBucket}
            disabled={isLocked || completed}
            className="avionics-button px-2.5 py-1 text-red-300 border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-[10px] flex items-center gap-1 font-mono"
          >
            <Trash2 className="w-3 h-3" />
            <span>Deletar Bucket</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: BUCKET POLICY EDITOR                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="cockpit-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hud-bracket py-0.5">CONFIGURAR POLÍTICA DE ACESSO (BUCKET POLICY JSON)</span>
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-zinc-300 block font-semibold uppercase tracking-wider">
              Selecione a Declaração de Autorização (Principal):
            </label>
            <div className="space-y-2">
              {options.map(opt => (
                <label
                  key={opt.type}
                  className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                    principalOption === opt.type
                      ? opt.type === "AUTHORIZED_ROLE"
                        ? "cockpit-subcard border-emerald-500/60 bg-emerald-950/20 text-emerald-200"
                        : "cockpit-subcard border-red-500/60 bg-red-950/20 text-red-200"
                      : "cockpit-subcard border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="principal"
                      checked={principalOption === opt.type}
                      onChange={() => setPrincipalOption(opt.type)}
                      className="accent-cyan-500"
                    />
                    <span className={`font-bold text-[11px] ${opt.color}`}>{opt.title}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 pl-5 font-sans leading-relaxed">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Code Preview */}
          <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-[10px] text-zinc-300 font-mono">
            <span className="text-zinc-500">{"// Generated Bucket Policy Preview"}</span>
            <pre className="text-amber-300 mt-1 overflow-x-auto leading-relaxed">
{`{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "RestrictedFinancialAccess",
    "Effect": "Allow",
    "Principal": ${principalOption === "AUTHORIZED_ROLE" ? '"arn:aws:iam::948122019012:role/FinanceAppRole"' : '"*"'},
    "Action": ${principalOption === "PUBLIC_WRITE" ? '["s3:GetObject", "s3:PutObject"]' : '"s3:GetObject"'},
    "Resource": "arn:aws:s3:::financial-records-internal/*"
  }]
}`}
            </pre>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: SECURITY CONTROLS & HARDENING                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="cockpit-card rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-zinc-200 font-bold flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hud-bracket py-0.5">CONTROLES DE PROTEÇÃO DO S3 (HARDENING)</span>
              </span>
            </div>

            {/* Block Public Access Toggle */}
            <div className={`cockpit-subcard p-3 rounded-lg border transition-colors ${
              blockPublicAccess ? "border-emerald-500/50 bg-emerald-950/20" : "border-red-500/50 bg-red-950/20"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[11px] text-zinc-200 flex items-center gap-1.5">
                    {blockPublicAccess ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-red-400" />}
                    Block All Public Access (BPA)
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                    Bloqueia ACLs e políticas públicas em nível de bucket e objetos.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBlockPublicAccess(!blockPublicAccess)}
                  disabled={isLocked || completed}
                  className={`avionics-button px-3 py-1 text-[10px] font-bold ${
                    blockPublicAccess
                      ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                      : "text-zinc-300"
                  }`}
                >
                  {blockPublicAccess ? "HABILITADO" : "DESABILITADO"}
                </button>
              </div>
            </div>

            {/* KMS Encryption Toggle */}
            <div className={`cockpit-subcard p-3 rounded-lg border transition-colors ${
              encryptionEnabled ? "border-emerald-500/50 bg-emerald-950/20" : "border-white/10"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[11px] text-zinc-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    Criptografia Padrão SSE-KMS
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                    Criptografa todos os objetos em repouso com chave gerenciada AWS KMS.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                  disabled={isLocked || completed}
                  className={`avionics-button px-3 py-1 text-[10px] font-bold ${
                    encryptionEnabled
                      ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                      : "text-zinc-300"
                  }`}
                >
                  {encryptionEnabled ? "ATIVADA" : "DESATIVADA"}
                </button>
              </div>
            </div>

            {/* Risk Notice */}
            <div className="cockpit-subcard p-3 rounded-lg border-amber-500/30 bg-amber-950/20 text-[10px] text-zinc-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-sans leading-relaxed">
                Conformidade LGPD/ISO 27001 exige bloqueio público estrito e cifragem de ponta a ponta para registros financeiros sensíveis.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyHardening}
            disabled={isLocked || completed}
            className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600/80 text-white cursor-not-allowed"
                : isLocked
                ? "avionics-button opacity-50 cursor-not-allowed"
                : "avionics-primary"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>BUCKET PROTEGIDO COM SUCESSO</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>APLICAR POLÍTICAS DE HARDENING</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
