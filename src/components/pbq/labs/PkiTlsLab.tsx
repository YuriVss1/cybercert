"use client";

import { useState, useMemo } from "react";
import { Key, CheckCircle2, Lock, Unlock, RefreshCw, Layers } from "lucide-react";
import { PbqLabProps, deterministicShuffle } from "@/lib/pbqData";

type BundleType = "EXPIRED_G2" | "VALID_G4" | "SELF_SIGNED";

const RAW_BUNDLES = [
  {
    type: "EXPIRED_G2" as BundleType,
    title: "bundle-legacy-g2.crt (DigiTrust G2 - Expirado em 15/01/2024)",
    desc: "Certificado antigo remanescente da instalação anterior. Causa rejeição imediata em clientes.",
    isCorrect: false
  },
  {
    type: "VALID_G4" as BundleType,
    title: "bundle-digitrust-g4-fullchain.crt (DigiTrust G4 Cross-Chain - Válido até 2028)",
    desc: "Pacote oficial contendo a autoridade intermediária atualizada emitida pela Root CA confiável.",
    isCorrect: true
  },
  {
    type: "SELF_SIGNED" as BundleType,
    title: "self-signed-fallback.crt (Certificado Autoassinado local)",
    desc: "Gera par de chaves próprio sem assinatura de CA pública reconhecida.",
    isCorrect: false
  }
];

export default function PkiTlsLab({ onActionSubmit, isLocked }: PbqLabProps) {
  // Shuffled bundle options
  const bundleOptions = useMemo(() => deterministicShuffle(RAW_BUNDLES, 808), []);

  const [intermediateBundle, setIntermediateBundle] = useState<BundleType>("EXPIRED_G2");
  const [minTlsVersion, setMinTlsVersion] = useState<"TLS1.0" | "TLS1.2" | "TLS1.3">("TLS1.0");
  const [disableHttpsPort80, setDisableHttpsPort80] = useState<boolean>(false);
  const [completed, setCompleted] = useState(false);

  const handleApplyChain = () => {
    if (isLocked || completed) return;

    if (disableHttpsPort80) {
      onActionSubmit({
        correct: false,
        actionId: 'disable-tls',
        errorType: 'dangerous_action',
        consequence: {
          title: 'REVERSÃO PARA PROTOCOLO INSEGURO',
          actionTaken: 'Você desabilitou o HTTPS e reverteu o tráfego para HTTP puro na porta 80.',
          consequence: 'Senhas e dados de cartão de crédito de clientes trafegaram em texto claro na rede pública.',
          severity: 'critical'
        }
      });
      return;
    }

    if (intermediateBundle === "SELF_SIGNED") {
      onActionSubmit({
        correct: false,
        actionId: 'self-signed-root',
        errorType: 'wrong_action',
        consequence: {
          title: 'INSTALAÇÃO DE CERTIFICADO NÃO RECONHECIDO',
          actionTaken: 'Você gerou e instalou um certificado autoassinado na DMZ.',
          consequence: 'Os navegadores emitiram alertas vermelhos de phishing e conexões bloqueadas.',
          severity: 'high'
        }
      });
      return;
    }

    if (intermediateBundle === "EXPIRED_G2") {
      onActionSubmit({
        correct: false,
        actionId: 'keep-expired-g2',
        errorType: 'wrong_action',
        consequence: {
          title: 'CADEIA DE CONFIANÇA QUEBRADA',
          actionTaken: 'Você manteve a autoridade intermediária antiga expirada.',
          consequence: 'Os clientes móveis e navegadores continuaram rejeitando as conexões com erro SEC_ERROR_UNKNOWN_ISSUER.',
          severity: 'high'
        }
      });
      return;
    }

    if (minTlsVersion === "TLS1.0") {
      onActionSubmit({
        correct: false,
        actionId: 'weak-tls-version',
        errorType: 'incomplete_action',
        consequence: {
          title: 'PROTOCOLO TLS INSEGURO / OBSOLETO',
          actionTaken: 'Você selecionou TLSv1.0 como versão mínima aceita no servidor web.',
          consequence: 'A conexão permanece vulnerável a ataques de quebra de cifra conhecidos como POODLE e BEAST.',
          severity: 'medium'
        }
      });
      return;
    }

    setCompleted(true);
    onActionSubmit({
      correct: true,
      actionId: 'pki-tls-success'
    });
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* -------------------------------------------------------------------- */}
      {/* MISSION HEADER + STATUS DE VALIDAÇÃO DA CADEIA                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="cockpit-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] font-mono">
            PKI CERTIFICATE CHAIN INSPECTOR / HOST: api.rootsec.academy (PORT 443)
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`telemetry-chip text-[10px] font-bold ${
            intermediateBundle === "VALID_G4" && !disableHttpsPort80
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
              : "border-red-500/40 bg-red-950/40 text-red-400"
          }`}>
            {intermediateBundle === "VALID_G4" && !disableHttpsPort80
              ? "CHAIN: VERIFIED & TRUSTED"
              : "CHAIN: SEC_ERROR_UNKNOWN_ISSUER"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ------------------------------------------------------------------ */}
        {/* VISUAL CHAIN HIERARCHY INSTRUMENT                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-1 cockpit-card rounded-xl p-4 space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-white/[0.08] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hud-bracket py-0.5">HIERARQUIA DA CADEIA TLS (X.509)</span>
          </div>

          <div className="space-y-2 relative">
            {/* Root CA */}
            <div className="cockpit-subcard p-3 rounded-lg border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">1. ROOT CA (ÂNCORA)</span>
                <span className="telemetry-chip text-[9px] text-emerald-400 border-emerald-500/30 font-bold">TRUST STORE OK</span>
              </div>
              <p className="text-[10px] text-zinc-300 font-sans">DigiTrust Global Root CA</p>
              <span className="text-[9px] text-zinc-500 block">SHA256: 35:9A:..:12 | Validade: 2038</span>
            </div>

            <div className="flex justify-center -my-1">
              <span className="text-zinc-600 font-bold text-xs">↓</span>
            </div>

            {/* Intermediate CA */}
            <div className={`cockpit-subcard p-3 rounded-lg border transition-colors space-y-1 ${
              intermediateBundle === "VALID_G4"
                ? "border-emerald-500/50 bg-emerald-950/20"
                : intermediateBundle === "SELF_SIGNED"
                ? "border-amber-500/50 bg-amber-950/20"
                : "border-red-500/50 bg-red-950/20"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">2. INTERMEDIATE CA</span>
                <span className={`telemetry-chip text-[9px] font-bold ${
                  intermediateBundle === "VALID_G4"
                    ? "text-emerald-400 border-emerald-500/40"
                    : intermediateBundle === "SELF_SIGNED"
                    ? "text-amber-400 border-amber-500/40"
                    : "text-red-400 border-red-500/40"
                }`}>
                  {intermediateBundle === "VALID_G4" ? "VALID (G4)" : intermediateBundle === "SELF_SIGNED" ? "SELF-SIGNED" : "EXPIRED"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 font-sans">
                {intermediateBundle === "VALID_G4"
                  ? "DigiTrust Intermediate CA G4 (Cross-Signed)"
                  : intermediateBundle === "SELF_SIGNED"
                  ? "OpenSSL Self-Signed Untrusted Root"
                  : "DigiTrust Intermediate CA G2 (Expirou em 2024)"}
              </p>
              <span className="text-[9px] text-zinc-500 block">
                {intermediateBundle === "VALID_G4" ? "Cadeia completa até a Raiz" : "Quebra de confiança no cliente"}
              </span>
            </div>

            <div className="flex justify-center -my-1">
              <span className="text-zinc-600 font-bold text-xs">↓</span>
            </div>

            {/* Leaf Certificate */}
            <div className="cockpit-subcard p-3 rounded-lg border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">3. SERVER LEAF CERTIFICATE</span>
                <span className="telemetry-chip text-[9px] text-emerald-400 border-emerald-500/30 font-bold">CN VÁLIDO</span>
              </div>
              <p className="text-[10px] text-zinc-300 font-sans">CN = api.rootsec.academy</p>
              <span className="text-[9px] text-zinc-500 block">SAN: api.rootsec.academy, rootsec.academy</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* NGINX CONFIGURATION & ACTIONS                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-2 cockpit-card rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-white/[0.08] flex items-center justify-between">
              <span className="hud-bracket py-0.5">CONFIGURAÇÃO DE BUNDLE TLS (/etc/nginx/conf.d/ssl.conf)</span>
              <span className="telemetry-chip text-[10px] text-zinc-400">Web Server: Nginx 1.24</span>
            </div>

            {/* Certificate Bundle Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                1. SELECIONE O PACOTE DE AUTORIDADE INTERMEDIÁRIA (CA-BUNDLE):
              </label>
              <div className="space-y-2">
                {bundleOptions.map(b => (
                  <label
                    key={b.type}
                    className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                      intermediateBundle === b.type
                        ? b.type === "VALID_G4"
                          ? "cockpit-subcard border-emerald-500/60 bg-emerald-950/20 text-emerald-200"
                          : "cockpit-subcard border-red-500/60 bg-red-950/20 text-red-200"
                        : "cockpit-subcard border-white/10 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bundle"
                        checked={intermediateBundle === b.type}
                        onChange={() => setIntermediateBundle(b.type)}
                        className="accent-cyan-500"
                      />
                      <span className={`font-bold text-[11px] ${
                        b.type === "VALID_G4" ? "text-emerald-400" : b.type === "EXPIRED_G2" ? "text-red-400" : "text-amber-400"
                      }`}>
                        {b.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 pl-5 font-sans leading-relaxed">{b.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* TLS Protocol & Security controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  2. PROTOCOLO MÍNIMO TLS:
                </label>
                <select
                  value={minTlsVersion}
                  onChange={(e) => setMinTlsVersion(e.target.value as "TLS1.0" | "TLS1.2" | "TLS1.3")}
                  className="w-full bg-black/60 border border-white/10 text-zinc-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="TLS1.0">TLSv1.0 + TLSv1.1 (Depreciados / Inseguros)</option>
                  <option value="TLS1.2">TLSv1.2 (Padrão de compatibilidade)</option>
                  <option value="TLS1.3">TLSv1.3 (Moderno / Forward Secrecy obrigatório)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 block uppercase tracking-wider">
                  3. CONTROLE DE PORTA WEB:
                </label>
                <button
                  type="button"
                  onClick={() => setDisableHttpsPort80(!disableHttpsPort80)}
                  className={`w-full py-2 px-3 rounded-lg border text-left text-[10px] font-semibold flex items-center justify-between transition-colors ${
                    disableHttpsPort80
                      ? "cockpit-subcard border-red-500/50 bg-red-950/30 text-red-300"
                      : "cockpit-subcard border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <span>{disableHttpsPort80 ? "Desativar HTTPS (Voltar para HTTP/80)" : "Manter HTTPS Obrigatório (Porta 443)"}</span>
                  {disableHttpsPort80 ? <Unlock className="w-3.5 h-3.5 text-red-400" /> : <Lock className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyChain}
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
                <span>CADEIA PKI VALIDADA COM SUCESSO</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>INSTALAR CADEIA TLS & REINICIAR NGINX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
