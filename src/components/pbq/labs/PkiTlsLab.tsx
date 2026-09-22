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
      {/* Header */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
            PKI CERTIFICATE CHAIN INSPECTOR / HOST: api.rootsec.academy (PORT 443)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            intermediateBundle === "VALID_G4" && !disableHttpsPort80
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-400"
              : "bg-red-950/80 border-red-500 text-red-400"
          }`}>
            {intermediateBundle === "VALID_G4" && !disableHttpsPort80
              ? "CHAIN: VERIFIED & TRUSTED"
              : "CHAIN: SEC_ERROR_UNKNOWN_ISSUER"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Chain Representation */}
        <div className="lg:col-span-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-violet-400" />
            HIERARQUIA DA CADEIA TLS (X.509)
          </div>

          <div className="space-y-2 relative">
            {/* Root CA */}
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">1. ROOT CA (ÂNCORA DE CONFIANÇA)</span>
                <span className="text-[9px] text-emerald-400 font-bold">TRUST STORE OK</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">DigiTrust Global Root CA</p>
              <span className="text-[9px] text-zinc-500">SHA256 Fingerprint: 35:9A:..:12 | Validade: 2038</span>
            </div>

            <div className="flex justify-center -my-1">
              <span className="text-zinc-600 font-bold">↓</span>
            </div>

            {/* Intermediate CA */}
            <div className={`p-2.5 rounded border transition-colors ${
              intermediateBundle === "VALID_G4"
                ? "bg-emerald-950/30 border-emerald-500"
                : intermediateBundle === "SELF_SIGNED"
                ? "bg-amber-950/30 border-amber-500"
                : "bg-red-950/40 border-red-500"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">2. INTERMEDIATE CA BUNDLE</span>
                <span className={`text-[9px] font-bold ${
                  intermediateBundle === "VALID_G4"
                    ? "text-emerald-400"
                    : intermediateBundle === "SELF_SIGNED"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}>
                  {intermediateBundle === "VALID_G4" ? "VALID (G4)" : intermediateBundle === "SELF_SIGNED" ? "SELF-SIGNED" : "EXPIRED"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 mt-1">
                {intermediateBundle === "VALID_G4"
                  ? "DigiTrust Intermediate CA G4 (Cross-Signed)"
                  : intermediateBundle === "SELF_SIGNED"
                  ? "OpenSSL Self-Signed Untrusted Root"
                  : "DigiTrust Intermediate CA G2 (Expirou em 2024)"}
              </p>
              <span className="text-[9px] text-zinc-500">
                {intermediateBundle === "VALID_G4" ? "Cadeia completa até a Raiz" : "Quebra de confiança no cliente"}
              </span>
            </div>

            <div className="flex justify-center -my-1">
              <span className="text-zinc-600 font-bold">↓</span>
            </div>

            {/* Leaf Certificate */}
            <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-[10px]">3. SERVER LEAF CERTIFICATE</span>
                <span className="text-[9px] text-emerald-400 font-bold">CN VALIDO</span>
              </div>
              <p className="text-[10px] text-zinc-300 mt-1">CN = api.rootsec.academy</p>
              <span className="text-[9px] text-zinc-500">SAN: api.rootsec.academy, rootsec.academy</span>
            </div>
          </div>
        </div>

        {/* Nginx Configuration & Options */}
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>CONFIGURAÇÃO DE BUNDLE TLS (/etc/nginx/conf.d/ssl.conf)</span>
              <span className="text-[10px] text-zinc-500">Web Server: Nginx 1.24</span>
            </div>

            {/* Certificate Bundle Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-300 block">
                1. SELECIONE O PACOTE DE AUTORIDADE INTERMEDIÁRIA (CA-BUNDLE):
              </label>
              <div className="space-y-2">
                {bundleOptions.map(b => (
                  <label
                    key={b.type}
                    className={`block p-2.5 rounded border cursor-pointer ${
                      intermediateBundle === b.type
                        ? b.type === "VALID_G4"
                          ? "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                          : "bg-red-950/30 border-red-500 text-red-200"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bundle"
                        checked={intermediateBundle === b.type}
                        onChange={() => setIntermediateBundle(b.type)}
                      />
                      <span className={`font-bold text-[11px] ${
                        b.type === "VALID_G4" ? "text-emerald-400" : b.type === "EXPIRED_G2" ? "text-red-400" : "text-amber-400"
                      }`}>
                        {b.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 pl-5">{b.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* TLS Protocol & Security controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 block">
                  2. PROTOCOLO MÍNIMO TLS:
                </label>
                <select
                  value={minTlsVersion}
                  onChange={(e) => setMinTlsVersion(e.target.value as "TLS1.0" | "TLS1.2" | "TLS1.3")}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-violet-500"
                >
                  <option value="TLS1.0">TLSv1.0 + TLSv1.1 (Depreciados / Inseguros)</option>
                  <option value="TLS1.2">TLSv1.2 (Padrão de compatibilidade)</option>
                  <option value="TLS1.3">TLSv1.3 (Moderno / Forward Secrecy obrigatório)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 block">
                  3. CONTROLE DE PORTA WEB:
                </label>
                <button
                  onClick={() => setDisableHttpsPort80(!disableHttpsPort80)}
                  className={`w-full py-2 px-3 rounded border text-left text-[10px] font-semibold flex items-center justify-between ${
                    disableHttpsPort80
                      ? "bg-red-950/40 border-red-500 text-red-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <span>{disableHttpsPort80 ? "Desativar HTTPS (Voltar para HTTP/80)" : "Manter HTTPS Obrigatório (Porta 443)"}</span>
                  {disableHttpsPort80 ? <Unlock className="w-3.5 h-3.5 text-red-400" /> : <Lock className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyChain}
            disabled={isLocked || completed}
            className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              completed
                ? "bg-emerald-600 text-white cursor-not-allowed"
                : isLocked
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white"
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
