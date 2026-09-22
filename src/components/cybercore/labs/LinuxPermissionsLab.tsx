"use client";

import React, { useState } from 'react';
import { 
  Terminal, HelpCircle, 
  RotateCcw, ArrowRight, ShieldCheck, ShieldAlert
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

interface PermissionTarget {
  r: boolean;
  w: boolean;
  x: boolean;
}

export default function LinuxPermissionsLab({
  concept,
  activeStage,
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  // Estado dos bits de permissão
  const [userPerms, setUserPerms] = useState<PermissionTarget>({ r: true, w: true, x: true }); // 7
  const [groupPerms, setGroupPerms] = useState<PermissionTarget>({ r: true, w: false, x: true }); // 5
  const [othersPerms, setOthersPerms] = useState<PermissionTarget>({ r: true, w: false, x: true }); // 5

  const [activeScenario, setActiveScenario] = useState<'script' | 'ssh_key'>('ssh_key');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  // Cálculo numérico octal (4 = r, 2 = w, 1 = x)
  const calcOctal = (p: PermissionTarget) => (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
  const userOctal = calcOctal(userPerms);
  const groupOctal = calcOctal(groupPerms);
  const othersOctal = calcOctal(othersPerms);
  const totalOctal = `${userOctal}${groupOctal}${othersOctal}`;

  // Formato simbólico (ex: -rwxr-xr-x)
  const formatSymbolic = (p: PermissionTarget) => `${p.r ? 'r' : '-'}${p.w ? 'w' : '-'}${p.x ? 'x' : '-'}`;
  const totalSymbolic = `-${formatSymbolic(userPerms)}${formatSymbolic(groupPerms)}${formatSymbolic(othersPerms)}`;

  const handleToggle = (target: 'user' | 'group' | 'others', bit: 'r' | 'w' | 'x') => {
    if (target === 'user') setUserPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
    if (target === 'group') setGroupPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
    if (target === 'others') setOthersPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
  };

  const handleReset = () => {
    setUserPerms({ r: true, w: true, x: false });
    setGroupPerms({ r: true, w: false, x: false });
    setOthersPerms({ r: true, w: false, x: false });
    setFeedback(null);
  };

  const handleValidate = () => {
    // Cenário SSH Key: Exige 600 (-rw-------)
    // Cenário Script: Exige 755 (-rwxr-xr-x)
    let isCorrect = false;
    let expectedString = '';

    if (activeScenario === 'ssh_key') {
      isCorrect = totalOctal === '600';
      expectedString = 'chmod 600 ~/.ssh/id_rsa (rw-------)';
    } else {
      isCorrect = totalOctal === '755';
      expectedString = 'chmod 755 /opt/deploy.sh (rwxr-xr-x)';
    }

    onRecordAttempt({
      challengeId: `linux-perm-${activeScenario}`,
      challengeType: 'BUILD',
      isCorrect,
      confidence,
      durationMs: 5000,
      submittedAnswer: { octal: totalOctal, symbolic: totalSymbolic, scenario: activeScenario },
      feedbackGiven: isCorrect ? `Permissão ${totalOctal} configurada perfeitamente.` : `Permissão ${totalOctal} inadequada.`
    });

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? `Excelente! A permissão ${totalOctal} (${totalSymbolic}) atende estritamente à política de segurança. Para o arquivo especificado, ${expectedString} protege contra acessos indevidos por usuários locais não privilegiados.`
        : `Ajuste necessário: A permissão esperada para este cenário era ${expectedString}. Sua configuração atual resultou em ${totalOctal} (${totalSymbolic}).`
    });

    if (isCorrect) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow(`linux-perm-${activeScenario}`, 'BUILD');
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No Linux, cada dígito octal soma: r=4, w=2, x=1. Para a chave SSH id_rsa, a exigência é 600 (Dono: 4+2=6, Grupo: 0, Outros: 0). Chaves privadas abertas para o grupo são rejeitadas pelo cliente OpenSSH por motivos de segurança.'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-emerald-800/60">
            Laboratório Interativo • BUILD
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Permissões POSIX do Linux (Octal & Simbólico)
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Manipule diretamente os bits de leitura (r=4), escrita (w=2) e execução (x=1) para <strong>Owner</strong>, <strong>Group</strong> e <strong>Others</strong>. Compreenda por que chaves privadas SSH e scripts de sistema exigem modos octais específicos.
        </p>
      </section>

      {/* Desafio Atual */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveScenario('ssh_key'); setFeedback(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeScenario === 'ssh_key' 
                  ? 'bg-emerald-500 text-black shadow' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Desafio 1: Chave SSH Privada (~/.ssh/id_rsa)
            </button>
            <button
              type="button"
              onClick={() => { setActiveScenario('script'); setFeedback(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeScenario === 'script' 
                  ? 'bg-emerald-500 text-black shadow' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Desafio 2: Script de Deploy (/opt/deploy.sh)
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Redefinir
          </button>
        </div>

        {/* Enunciado do Desafio */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
            Objetivo de Segurança:
          </span>
          <p className="text-xs md:text-sm text-zinc-200 font-sans">
            {activeScenario === 'ssh_key' 
              ? 'Configure as permissões para proteger a chave privada SSH id_rsa: o proprietário deve ter permissão de leitura e escrita, mas grupo e outros NÃO devem possuir NENHUM acesso.'
              : 'Configure o script de deploy para que o proprietário tenha acesso total (leitura, escrita e execução), enquanto grupo e outros possam apenas ler e executar o script.'}
          </p>
        </div>

        {/* Display do Resultado em Tempo Real */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">
              Notação Simbólica
            </span>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {totalSymbolic}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">
              Modo Octal
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {totalOctal}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold mb-1">
              Comando Terminal
            </span>
            <span className="text-xs font-bold text-white font-mono block truncate pt-1">
              chmod {totalOctal} {activeScenario === 'ssh_key' ? '~/.ssh/id_rsa' : '/opt/deploy.sh'}
            </span>
          </div>
        </div>

        {/* Tabela de Bits Interativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* User / Owner */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-white uppercase">User / Owner (u)</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold">
                {userOctal}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { bit: 'r' as const, label: 'Read (Leitura) - 4', val: userPerms.r },
                { bit: 'w' as const, label: 'Write (Escrita) - 2', val: userPerms.w },
                { bit: 'x' as const, label: 'Execute (Execução) - 1', val: userPerms.x }
              ].map(item => (
                <button
                  key={item.bit}
                  type="button"
                  onClick={() => handleToggle('user', item.bit)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    item.val ? 'bg-emerald-950/60 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.val ? 'bg-emerald-600 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {item.val ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Group */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-white uppercase">Group (g)</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-bold">
                {groupOctal}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { bit: 'r' as const, label: 'Read (Leitura) - 4', val: groupPerms.r },
                { bit: 'w' as const, label: 'Write (Escrita) - 2', val: groupPerms.w },
                { bit: 'x' as const, label: 'Execute (Execução) - 1', val: groupPerms.x }
              ].map(item => (
                <button
                  key={item.bit}
                  type="button"
                  onClick={() => handleToggle('group', item.bit)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    item.val ? 'bg-cyan-950/60 border-cyan-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.val ? 'bg-cyan-600 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {item.val ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Others */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-white uppercase">Others (o)</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold">
                {othersOctal}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { bit: 'r' as const, label: 'Read (Leitura) - 4', val: othersPerms.r },
                { bit: 'w' as const, label: 'Write (Escrita) - 2', val: othersPerms.w },
                { bit: 'x' as const, label: 'Execute (Execução) - 1', val: othersPerms.x }
              ].map(item => (
                <button
                  key={item.bit}
                  type="button"
                  onClick={() => handleToggle('others', item.bit)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    item.val ? 'bg-amber-950/60 border-amber-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.val ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {item.val ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'CONFIDENT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' : 'text-zinc-500'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs font-mono ${
                confidence === 'HESITANT' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'text-zinc-500'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Aplicar chmod & Validar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {feedback && (
        <section className={`p-6 rounded-xl border space-y-3 font-mono text-xs ${
          feedback.isCorrect 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {feedback.isCorrect ? 'Permissão POSIX Válida e Segura' : 'Permissão Vulnerável ou Inadequada'}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>
        </section>
      )}
    </div>
  );
}
