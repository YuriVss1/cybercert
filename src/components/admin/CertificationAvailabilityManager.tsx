'use client';

import { useState, useTransition } from 'react';
import type { CertificationItem } from '@/lib/admin/overview-data';
import { toggleCertificationAvailabilityAction } from '@/app/admin/actions';
import { CheckCircle2, AlertTriangle, Activity, ShieldCheck, Lock } from 'lucide-react';

interface CertificationAvailabilityManagerProps {
  initialCertifications?: CertificationItem[];
}

export function CertificationAvailabilityManager({
  initialCertifications = [],
}: CertificationAvailabilityManagerProps) {
  const [certifications, setCertifications] = useState<CertificationItem[]>(initialCertifications);
  const [isPending, startTransition] = useTransition();
  const [updatingCertId, setUpdatingCertId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleToggle = (cert: CertificationItem) => {
    const newStatus = !(cert.is_available ?? (cert.code === 'SY0-701'));
    setUpdatingCertId(cert.id);
    setFeedbackMessage(null);

    startTransition(async () => {
      const response = await toggleCertificationAvailabilityAction({
        certId: cert.id,
        isAvailable: newStatus,
      });

      setUpdatingCertId(null);

      if (response.success) {
        setCertifications(prev =>
          prev.map(c => (c.id === cert.id ? { ...c, is_available: newStatus } : c))
        );
        setFeedbackMessage({
          text: `Certificação ${cert.code} atualizada para ${newStatus ? 'Disponível' : 'Em preparação'}.`,
          type: 'success',
        });
      } else {
        setFeedbackMessage({
          text: response.error || 'Falha ao atualizar certificação.',
          type: 'error',
        });
      }
    });
  };

  if (!certifications || certifications.length === 0) {
    return <div className="text-xs text-zinc-400 font-mono">Nenhuma certificação catalogada</div>;
  }

  return (
    <div className="space-y-3">
      {feedbackMessage && (
        <div
          className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {certifications.map(cert => {
          const isAvailable = cert.is_available ?? (cert.code === 'SY0-701');
          const isCurrentUpdating = isPending && updatingCertId === cert.id;

          return (
            <div
              key={cert.id}
              className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-all hover:border-zinc-700/80"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800 text-[10px] font-bold">
                  {cert.code}
                </span>
                <div>
                  <span className="text-zinc-200 font-medium block">{cert.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Disponível
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        Em preparação
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(cert)}
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                    isAvailable
                      ? 'bg-zinc-900 hover:bg-amber-950/40 text-zinc-300 hover:text-amber-300 border-zinc-700 hover:border-amber-600/50'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/50 shadow-sm shadow-emerald-950/30'
                  }`}
                >
                  {isCurrentUpdating ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>Atualizando...</span>
                    </>
                  ) : isAvailable ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Desabilitar</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Habilitar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
