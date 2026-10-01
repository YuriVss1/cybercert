"use client";

import React, { useState } from 'react';
import { 
  Terminal, HelpCircle, 
  RotateCcw, ArrowRight, ShieldCheck, ShieldAlert,
  Eye, Target, Lightbulb
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';

interface PermissionTarget {
  r: boolean;
  w: boolean;
  x: boolean;
}

export default function LinuxPermissionsLab({
  concept,
  activeStage,
  stageMode,
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const mode: StageMode = stageMode || (
    activeStage === 'interact' ? 'guided' :
    activeStage === 'test' ? 'exam' : 'practice'
  );

  // Estado dos bits de permissão
  const [userPerms, setUserPerms] = useState<PermissionTarget>({ r: true, w: true, x: true }); // 7
  const [groupPerms, setGroupPerms] = useState<PermissionTarget>({ r: true, w: false, x: true }); // 5
  const [othersPerms, setOthersPerms] = useState<PermissionTarget>({ r: true, w: false, x: true }); // 5

  const [activeScenario, setActiveScenario] = useState<'script' | 'ssh_key'>('ssh_key');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
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
    if (isFinalized) return;
    if (target === 'user') setUserPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
    if (target === 'group') setGroupPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
    if (target === 'others') setOthersPerms(prev => ({ ...prev, [bit]: !prev[bit] }));
  };

  const handleReset = () => {
    setUserPerms({ r: true, w: true, x: false });
    setGroupPerms({ r: true, w: false, x: false });
    setOthersPerms({ r: true, w: false, x: false });
    setFeedback(null);
    setShowHintRevealed(false);
    setIsFinalized(false);
  };

  const handleValidate = () => {
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

    if (isCorrect) {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setIsFinalized(true);
    }

    setFeedback({
      tested: true,
      isCorrect,
      message: isCorrect
        ? `Excelente! A permissão ${totalOctal} (${totalSymbolic}) atende estritamente à política de segurança. Para o arquivo especificado, ${expectedString} protege contra acessos indevidos por usuários locais não privilegiados.`
        : (mode === 'exam'
          ? 'Avaliação registrada para análise.'
          : `Ajuste necessário: A permissão esperada para este cenário era ${expectedString}. Sua configuração atual resultou em ${totalOctal} (${totalSymbolic}).`)
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow(`linux-perm-${activeScenario}`, 'BUILD');
    }
    setFeedback({
      tested: true,
      isCorrect: false,
      message: 'Marcado como "Não sei". No Linux, cada dígito octal soma: r=4, w=2, x=1. Para a chave SSH id_rsa, a exigência é 600 (Dono: 4+2=6, Grupo: 0, Outros: 0). Chaves privadas abertas para o grupo são rejeitadas pelo cliente OpenSSH por motivos de segurança.'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Cada dígito octal é uma soma ponderada de 3 bits: Leitura r = 4, Escrita w = 2, Execução x = 1.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Para a chave privada SSH (~/.ssh/id_rsa), NENHUMA permissão pode ser dada para grupo ou outros (600).'
    },
    exam: {
      label: 'Comprovação Autônoma (Testar)',
      color: 'text-amber-400',
      bg: 'bg-amber-950/60 border-amber-800',
      icon: ShieldAlert,
      hint: ''
    }
  }[mode];

  const ModeIcon = modeBadge.icon;
  const canRevealHint = mode === 'practice' && feedback && !feedback.isCorrect && !showHintRevealed;

  return (
    <div className="space-y-6 font-mono text-zinc-200">
      {/* Mission / Header */}
      <section className="cockpit-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className={`telemetry-chip flex items-center gap-1.5 font-bold ${modeBadge.color} border-current/30`}>
              <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
            </span>
            <span className="telemetry-chip text-zinc-400">
              SUBSYSTEM: POSIX ACCESS CONTROL
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {concept.title}
          </span>
        </div>

        <div>
          <h2 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2 uppercase">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Permissões POSIX do Linux (Octal & Simbólico)
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-sans">
            Manipule diretamente os bits de leitura (r=4), escrita (w=2) e execução (x=1) para <strong>Owner</strong>, <strong>Group</strong> e <strong>Others</strong>. Compreenda por que chaves privadas SSH e scripts de sistema exigem modos octais específicos.
          </p>
        </div>

        {mode === 'guided' && (
          <div className="cockpit-subcard p-3 border-emerald-800/40 bg-emerald-950/20">
            <p className="text-xs text-emerald-300 flex items-start gap-2 font-sans">
              <Eye className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span><strong className="font-mono uppercase text-emerald-200">Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="cockpit-subcard p-3 border-cyan-800/40 bg-cyan-950/20">
            <p className="text-xs text-cyan-300 flex items-start gap-2 font-sans">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
              <span><strong className="font-mono uppercase text-cyan-200">Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* Permission Instrument & Matrix */}
      <section className="cockpit-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveScenario('ssh_key'); setFeedback(null); setShowHintRevealed(false); }}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeScenario === 'ssh_key' 
                  ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-sm' 
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Desafio 1: Chave SSH Privada (~/.ssh/id_rsa)
            </button>
            <button
              type="button"
              onClick={() => { setActiveScenario('script'); setFeedback(null); setShowHintRevealed(false); }}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeScenario === 'script' 
                  ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-sm' 
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Desafio 2: Script Executável (/opt/deploy.sh)
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="avionics-button text-[11px] text-zinc-400 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" /> Redefinir Bits
          </button>
        </div>

        {/* Cenário Descritivo */}
        <div className="cockpit-subcard p-3 border-emerald-800/30 bg-emerald-950/10 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
            Objetivo de Hardening:
          </span>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            {activeScenario === 'ssh_key' 
              ? 'Configure a chave privada de forma que apenas o proprietário do arquivo tenha permissão de leitura e escrita. O grupo e os demais usuários não devem possuir qualquer permissão (risco de recusa de autenticação pelo OpenSSH: "Permissions 0644 for id_rsa are too open").'
              : 'Configure o script para que o proprietário tenha controle total (leitura, escrita, execução), e os membros do grupo e demais usuários tenham apenas permissão de leitura e execução (sem permissão de modificação).'}
          </p>
        </div>

        {/* Display Visual Simbólico e Octal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded bg-zinc-950/90 border border-zinc-800/80 flex flex-col justify-center items-center font-mono">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Notação Octal (chmod)</span>
            <span className="text-3xl font-black text-emerald-400 mt-1 tracking-wider">{totalOctal}</span>
          </div>
          <div className="p-3.5 rounded bg-zinc-950/90 border border-zinc-800/80 flex flex-col justify-center items-center font-mono">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Notação Simbólica (ls -l)</span>
            <span className="text-2xl font-bold text-cyan-300 mt-1 tracking-widest">{totalSymbolic}</span>
          </div>
        </div>

        {/* Seletor de Bits (Owner, Group, Others) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Owner */}
          <div className="cockpit-subcard p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">User / Owner (u)</span>
              <span className="telemetry-chip text-emerald-400 border-emerald-500/30 font-bold">Octal: {userOctal}</span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Leitura (r = 4)</span>
                <input
                  type="checkbox"
                  checked={userPerms.r}
                  disabled={isFinalized}
                  onChange={() => handleToggle('user', 'r')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Escrita (w = 2)</span>
                <input
                  type="checkbox"
                  checked={userPerms.w}
                  disabled={isFinalized}
                  onChange={() => handleToggle('user', 'w')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Execução (x = 1)</span>
                <input
                  type="checkbox"
                  checked={userPerms.x}
                  disabled={isFinalized}
                  onChange={() => handleToggle('user', 'x')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Group */}
          <div className="cockpit-subcard p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Group (g)</span>
              <span className="telemetry-chip text-emerald-400 border-emerald-500/30 font-bold">Octal: {groupOctal}</span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Leitura (r = 4)</span>
                <input
                  type="checkbox"
                  checked={groupPerms.r}
                  disabled={isFinalized}
                  onChange={() => handleToggle('group', 'r')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Escrita (w = 2)</span>
                <input
                  type="checkbox"
                  checked={groupPerms.w}
                  disabled={isFinalized}
                  onChange={() => handleToggle('group', 'w')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Execução (x = 1)</span>
                <input
                  type="checkbox"
                  checked={groupPerms.x}
                  disabled={isFinalized}
                  onChange={() => handleToggle('group', 'x')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Others */}
          <div className="cockpit-subcard p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Others / World (o)</span>
              <span className="telemetry-chip text-emerald-400 border-emerald-500/30 font-bold">Octal: {othersOctal}</span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Leitura (r = 4)</span>
                <input
                  type="checkbox"
                  checked={othersPerms.r}
                  disabled={isFinalized}
                  onChange={() => handleToggle('others', 'r')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Escrita (w = 2)</span>
                <input
                  type="checkbox"
                  checked={othersPerms.w}
                  disabled={isFinalized}
                  onChange={() => handleToggle('others', 'w')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300">Execução (x = 1)</span>
                <input
                  type="checkbox"
                  checked={othersPerms.x}
                  disabled={isFinalized}
                  onChange={() => handleToggle('others', 'x')}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Rodapé de Controle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Confiança:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                confidence === 'CONFIDENT'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 font-bold'
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                confidence === 'HESITANT'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 font-bold'
                  : 'avionics-button text-zinc-400'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canRevealHint && (
              <button
                type="button"
                onClick={() => setShowHintRevealed(true)}
                className="avionics-button text-amber-300 border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 text-xs uppercase"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
              </button>
            )}

            <button
              type="button"
              onClick={handleDontKnow}
              className="avionics-button text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 text-xs uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              disabled={isFinalized}
              onClick={handleValidate}
              className="avionics-primary text-xs uppercase tracking-wider flex items-center gap-2"
            >
              Aplicar chmod & Validar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Feedback Panel */}
      {feedback && (
        <section className={`cockpit-card p-5 space-y-3 font-mono text-xs ${
          feedback.isCorrect 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              {feedback.isCorrect ? 'Hardening de Permissões Aprovado' : (mode === 'exam' ? 'Avaliação Registrada' : 'Permissão Insegura ou Inadequada')}
            </h4>
          </div>
          <p className="text-zinc-300 font-sans leading-relaxed">
            {feedback.message}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-3 border-zinc-800 bg-zinc-950/80 text-xs space-y-1 mt-2">
              <span className="font-mono text-zinc-400 uppercase font-bold block">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans">
                No modelo de segurança POSIX, chaves criptográficas como ~/.ssh/id_rsa exigem modo restrito 600 (-rw-------), onde apenas o proprietário pode ler e escrever. Scripts executáveis de sistema geralmente adotam 755 (-rwxr-xr-x), impedindo modificação por terceiros.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
