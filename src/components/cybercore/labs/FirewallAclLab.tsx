"use client";

import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, Plus, Trash2, ArrowUp, ArrowDown
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence, StageMode } from '@/lib/cyberCore/cyberCoreTypes';
import { Eye, Target, ShieldAlert, Lightbulb } from 'lucide-react';

interface AclRule {
  id: string;
  source: string;
  destination: string;
  port: string;
  protocol: 'TCP' | 'UDP' | 'ANY';
  action: 'ALLOW' | 'DENY';
}

interface TestScenario {
  id: string;
  description: string;
  traffic: {
    source: string;
    destination: string;
    port: string;
    protocol: 'TCP' | 'UDP';
  };
  expectedAction: 'ALLOW' | 'DENY';
  pedagogicalReason: string;
}

const INITIAL_RULES: AclRule[] = [
  { id: 'r1', source: 'ANY', destination: 'WEB_SRV (10.0.1.10)', port: '443', protocol: 'TCP', action: 'ALLOW' },
  { id: 'r2', source: 'MGMT_NET (192.168.100.0/24)', destination: 'ANY', port: '22', protocol: 'TCP', action: 'ALLOW' },
  { id: 'r3', source: 'ANY', destination: 'ANY', port: 'ANY', protocol: 'ANY', action: 'DENY' }
];

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'sc-1',
    description: 'Tráfego HTTPS público da Internet para o servidor Web',
    traffic: { source: '203.0.113.5', destination: '10.0.1.10', port: '443', protocol: 'TCP' },
    expectedAction: 'ALLOW',
    pedagogicalReason: 'Regra 1 permite tráfego TCP na porta 443 para o servidor Web. O tráfego deve ser liberado.'
  },
  {
    id: 'sc-2',
    description: 'Tentativa de conexão SSH da Internet para o servidor Web',
    traffic: { source: '203.0.113.5', destination: '10.0.1.10', port: '22', protocol: 'TCP' },
    expectedAction: 'DENY',
    pedagogicalReason: 'SSH (22) só é permitido a partir da rede de gerência (192.168.100.0/24). Pela regra implícita/final de DENY ALL, deve ser bloqueado.'
  },
  {
    id: 'sc-3',
    description: 'Acesso direto da Internet ao banco de dados interno (MySQL porta 3306)',
    traffic: { source: '198.51.100.42', destination: '10.0.2.50', port: '3306', protocol: 'TCP' },
    expectedAction: 'DENY',
    pedagogicalReason: 'Acesso a banco de dados a partir da Internet é violação crítica do Princípio do Menor Privilégio e deve ser bloqueado.'
  }
];

export default function FirewallAclLab({
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

  const [rules, setRules] = useState<AclRule[]>(INITIAL_RULES);
  const [newSource, setNewSource] = useState('ANY');
  const [newDest, setNewDest] = useState('WEB_SRV (10.0.1.10)');
  const [newPort, setNewPort] = useState('80');
  const [newProto, setNewProto] = useState<'TCP' | 'UDP' | 'ANY'>('TCP');
  const [newAction, setNewAction] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
  const [showHintRevealed, setShowHintRevealed] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    tested: boolean;
    allPassed: boolean;
    scenarioResults: { id: string; matchedRuleIndex: number; action: string; passed: boolean; reason: string }[];
    summary: string;
  } | null>(null);

  const handleAddRule = () => {
    const newRule: AclRule = {
      id: `r-${Date.now()}`,
      source: newSource,
      destination: newDest,
      port: newPort,
      protocol: newProto,
      action: newAction
    };
    // Insere antes da última regra (geralmente o deny all)
    const updated = [...rules];
    if (updated.length > 0 && updated[updated.length - 1].action === 'DENY' && updated[updated.length - 1].source === 'ANY') {
      updated.splice(updated.length - 1, 0, newRule);
    } else {
      updated.push(newRule);
    }
    setRules(updated);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length <= 1) return;
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleMoveRule = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= rules.length) return;
    const updated = [...rules];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setRules(updated);
  };

  const handleEvaluateAcl = () => {
    const scenarioResults = TEST_SCENARIOS.map((sc) => {
      // First Match Wins
      let matchedIndex = -1;
      let matchedAction: 'ALLOW' | 'DENY' = 'DENY'; // Padrão implícito

      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        const protoMatch = r.protocol === 'ANY' || r.protocol === sc.traffic.protocol;
        const portMatch = r.port === 'ANY' || r.port === sc.traffic.port || r.port.includes(sc.traffic.port);
        const srcMatch = r.source === 'ANY' || (r.source.includes('MGMT') && sc.traffic.source.startsWith('192.168.100'));
        const dstMatch = r.destination === 'ANY' || (r.destination.includes('WEB') && sc.traffic.destination === '10.0.1.10');

        if (protoMatch && portMatch && srcMatch && dstMatch) {
          matchedIndex = i;
          matchedAction = r.action;
          break;
        }
      }

      const passed = matchedAction === sc.expectedAction;
      return {
        id: sc.id,
        matchedRuleIndex: matchedIndex + 1,
        action: matchedAction,
        passed,
        reason: sc.pedagogicalReason
      };
    });

    const allPassed = scenarioResults.every(s => s.passed);

    // Valida também se há regra excessivamente permissiva no topo
    const firstRule = rules[0];
    const isOverlyPermissive = firstRule && firstRule.action === 'ALLOW' && firstRule.source === 'ANY' && firstRule.destination === 'ANY' && firstRule.port === 'ANY';

    const finalSuccess = allPassed && !isOverlyPermissive;

    onRecordAttempt({
      challengeId: 'firewall-acl-build-1',
      challengeType: 'BUILD',
      isCorrect: finalSuccess,
      confidence,
      durationMs: 7000,
      submittedAnswer: { rulesCount: rules.length, rules: rules.map(r => `${r.action} ${r.source}->${r.destination}:${r.port}`) },
      feedbackGiven: finalSuccess 
        ? 'Tabela de ACL construída com sucesso respeitando First-Match-Wins e Menor Privilégio.' 
        : (isOverlyPermissive ? 'Regra ALLOW ANY/ANY no topo anula todas as restrições seguintes.' : 'A ordem ou configuração das regras permitiu tráfego indevido.')
    });

    if (finalSuccess) {
      setIsFinalized(true);
      onCompleteStage(activeStage);
    } else if (mode === 'exam') {
      setIsFinalized(true);
    }

    setEvaluationResult({
      tested: true,
      allPassed: finalSuccess,
      scenarioResults: mode === 'exam' && !finalSuccess ? [] : scenarioResults,
      summary: finalSuccess
        ? 'Excelente! Sua lista de controle de acesso protege os recursos internos e libera apenas os serviços autorizados seguindo a ordem correta.'
        : (mode === 'exam' 
          ? 'Avaliação registrada para análise.'
          : isOverlyPermissive 
          ? 'ALERTA DE SEGURANÇA: Uma regra ALLOW ANY ANY colocada no topo aceita todo e qualquer tráfego antes de avaliar as restrições posteriores (First Match Wins).' 
          : 'Ajuste necessário: Algumas requisições não obtiveram a ação esperada. Verifique a ordem das regras ou parâmetros.')
    });
  };

  const handleDontKnow = () => {
    if (onDidNotKnow) {
      onDidNotKnow('firewall-acl-build-1', 'BUILD');
    }
    setEvaluationResult({
      tested: true,
      allPassed: false,
      scenarioResults: [],
      summary: 'Marcado como "Não sei". Regra fundamental de Firewalls: As regras são avaliadas de cima para baixo (Top-Down). A PRIMEIRA regra que der match decide a ação. No final de toda ACL existe um DENY ALL implícito.'
    });
    setIsFinalized(true);
  };

  const modeBadge = {
    guided: {
      label: 'Exploração Guiada (Interagir)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800',
      icon: Eye,
      hint: 'Dica: Regras de Firewall funcionam por "First Match Wins". Regras específicas (Web 443, SSH de gerência) devem vir ANTES do DENY ALL final.'
    },
    practice: {
      label: 'Aplicação com Apoio (Praticar)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800',
      icon: Target,
      hint: 'Dica técnica: Nunca coloque ALLOW ANY ANY no topo da tabela, pois isso tornará inócuas todas as regras seguintes.'
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
  const canRevealHint = mode === 'practice' && evaluationResult && !evaluationResult.allPassed && !showHintRevealed;

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* -------------------------------------------------------------------- */}
      {/* MISSION HEADER + PEDAGOGICAL MODE INDICATOR                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-1">
              <span className={`telemetry-chip font-bold ${modeBadge.color} border-current/30 bg-white/[0.02]`}>
                <ModeIcon className="w-3.5 h-3.5" /> {modeBadge.label}
              </span>
              <span className="telemetry-chip text-zinc-400 border-white/10 bg-white/[0.02]">
                {concept.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide mt-2 font-heading flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
              Construção de Políticas de Firewall & ACL
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed max-w-3xl">
              Firewalls operam com a semântica <strong>First Match Wins (Primeiro Match Vence)</strong>. Construa e ordene as regras para permitir tráfego legítimo sem abrir brechas excessivas.
            </p>
          </div>
        </div>

        {mode === 'guided' && (
          <div className="cockpit-subcard p-3 rounded-lg border-emerald-500/30 bg-emerald-950/20">
            <p className="text-xs text-emerald-300 flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Orientação Pedagógica:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}

        {mode === 'practice' && showHintRevealed && (
          <div className="cockpit-subcard p-3 rounded-lg border-cyan-500/30 bg-cyan-950/20 animate-in fade-in">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
              <span><strong>Dica Revelada:</strong> {modeBadge.hint}</span>
            </p>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* BUILDER DE REGRAS & TABELA DA POLÍTICA                               */}
      {/* -------------------------------------------------------------------- */}
      <section className="cockpit-card rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="hud-bracket py-0.5 text-xs font-mono text-zinc-300 uppercase tracking-widest font-bold">
            Tabela de Regras (Avaliadas de Cima para Baixo ↓)
          </span>
          <button
            type="button"
            onClick={() => { setRules(INITIAL_RULES); setEvaluationResult(null); }}
            className="avionics-button text-xs font-mono flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>
        </div>

        {/* Lista de Regras com Controles de Reordenação */}
        <div className="space-y-2 overflow-x-auto">
          {rules.map((rule, idx) => (
            <div 
              key={rule.id}
              className={`p-3 rounded-lg border font-mono text-xs flex items-center justify-between gap-3 transition-colors ${
                rule.action === 'ALLOW' 
                  ? 'cockpit-subcard border-emerald-500/30 bg-emerald-950/10 text-emerald-200' 
                  : 'cockpit-subcard border-red-500/30 bg-red-950/10 text-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-zinc-500 font-bold font-mono">#{idx + 1}</span>
                <span className={`telemetry-chip px-2 py-0.5 rounded text-[10px] font-bold ${
                  rule.action === 'ALLOW' 
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' 
                    : 'border-red-500/40 bg-red-950/40 text-red-300'
                }`}>
                  {rule.action}
                </span>
                <span className="text-zinc-300">PROTO: <strong>{rule.protocol}</strong></span>
                <span className="text-zinc-300">SRC: <strong>{rule.source}</strong></span>
                <span className="text-zinc-300">DST: <strong>{rule.destination}</strong></span>
                <span className="text-zinc-300">PORT: <strong>{rule.port}</strong></span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveRule(idx, 'UP')}
                  className="avionics-button p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                  title="Subir regra"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === rules.length - 1}
                  onClick={() => handleMoveRule(idx, 'DOWN')}
                  className="avionics-button p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                  title="Descer regra"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="avionics-button p-1 text-zinc-500 hover:text-red-400"
                  title="Remover regra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulário para Adicionar Regra */}
        <div className="cockpit-subcard rounded-xl p-4 space-y-4 border-white/10">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block font-bold">
            Adicionar Nova Regra
          </span>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <label className="text-zinc-400 block mb-1">Ação</label>
              <select 
                value={newAction} 
                onChange={(e) => setNewAction(e.target.value as 'ALLOW' | 'DENY')}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Protocolo</label>
              <select 
                value={newProto} 
                onChange={(e) => setNewProto(e.target.value as 'TCP' | 'UDP' | 'ANY')}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Origem</label>
              <select 
                value={newSource} 
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="ANY">ANY</option>
                <option value="MGMT_NET (192.168.100.0/24)">MGMT_NET (192.168.100.0/24)</option>
                <option value="INTERNET (203.0.113.0/24)">INTERNET</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Destino</label>
              <select 
                value={newDest} 
                onChange={(e) => setNewDest(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="WEB_SRV (10.0.1.10)">WEB_SRV (10.0.1.10)</option>
                <option value="DB_SRV (10.0.2.50)">DB_SRV (10.0.2.50)</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Porta</label>
              <select 
                value={newPort} 
                onChange={(e) => setNewPort(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="80">80 (HTTP)</option>
                <option value="443">443 (HTTPS)</option>
                <option value="22">22 (SSH)</option>
                <option value="3306">3306 (MySQL)</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddRule}
                className="avionics-button w-full py-1.5 text-cyan-300 border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Inserir
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Grau de certeza:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`avionics-button text-xs font-mono py-1 px-3 ${
                confidence === 'CONFIDENT' ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300' : 'text-zinc-400'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`avionics-button text-xs font-mono py-1 px-3 ${
                confidence === 'HESITANT' ? 'border-amber-500/60 bg-amber-950/40 text-amber-300' : 'text-zinc-400'
              }`}
            >
              Dúvida
            </button>
          </div>

          <div className="flex items-center gap-3">
            {canRevealHint && (
              <button
                type="button"
                onClick={() => setShowHintRevealed(true)}
                className="avionics-button text-amber-400 border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Revelar Dica
              </button>
            )}

            <button
              type="button"
              onClick={handleDontKnow}
              className="avionics-button text-xs font-mono uppercase flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Não sei
            </button>
            <button
              type="button"
              onClick={handleEvaluateAcl}
              className="avionics-primary text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              Simular Tráfego & Validar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* RESULTADOS DA SIMULAÇÃO                                              */}
      {/* -------------------------------------------------------------------- */}
      {evaluationResult && (
        <section className={`cockpit-card rounded-xl p-6 space-y-4 font-mono text-xs border ${
          evaluationResult.allPassed 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200' 
            : 'border-red-500/40 bg-red-950/20 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {evaluationResult.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white font-heading tracking-wide">
              {evaluationResult.allPassed ? 'Validação de Política Aprovada' : 'Resultado da Avaliação'}
            </h4>
          </div>

          <p className="text-zinc-300 leading-relaxed font-sans text-sm">
            {evaluationResult.summary}
          </p>

          {mode === 'exam' && isFinalized && (
            <div className="cockpit-subcard p-4 rounded-lg border-white/10 text-xs space-y-1">
              <span className="font-mono text-zinc-400 uppercase font-bold block text-[11px]">Debrief do Exame:</span>
              <p className="text-zinc-300 font-sans leading-relaxed text-sm">
                Em firewalls com filtragem baseada em regras com estado, as regras são avaliadas sequencialmente de cima para baixo. Regras específicas devem preceder regras genéricas, e a política deve terminar com uma negação padrão (Default Deny).
              </p>
            </div>
          )}

          {evaluationResult.scenarioResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                Cenários de Teste Avaliados:
              </span>
              {evaluationResult.scenarioResults.map((sr, idx) => (
                <div key={sr.id} className="cockpit-subcard p-3 rounded-lg border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold font-mono">Cenário {idx + 1}:</span>
                    <span className="text-zinc-400 ml-2 font-sans">{TEST_SCENARIOS[idx]?.description}</span>
                  </div>
                  <span className={`telemetry-chip px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                    sr.passed ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' : 'border-red-500/40 bg-red-950/40 text-red-300'
                  }`}>
                    {sr.passed ? 'PASSED' : 'FAILED'} (Regra #{sr.matchedRuleIndex} → {sr.action})
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
