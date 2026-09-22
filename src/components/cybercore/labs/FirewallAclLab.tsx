"use client";

import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, AlertCircle, HelpCircle, 
  RotateCcw, ArrowRight, Plus, Trash2, ArrowUp, ArrowDown
} from 'lucide-react';
import type { ConceptExperienceProps, UserConfidence } from '@/lib/cyberCore/cyberCoreTypes';

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
  onCompleteStage,
  onRecordAttempt,
  onDidNotKnow
}: ConceptExperienceProps) {
  const [rules, setRules] = useState<AclRule[]>(INITIAL_RULES);
  const [newSource, setNewSource] = useState('ANY');
  const [newDest, setNewDest] = useState('WEB_SRV (10.0.1.10)');
  const [newPort, setNewPort] = useState('80');
  const [newProto, setNewProto] = useState<'TCP' | 'UDP' | 'ANY'>('TCP');
  const [newAction, setNewAction] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [confidence, setConfidence] = useState<UserConfidence>('CONFIDENT');
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

    setEvaluationResult({
      tested: true,
      allPassed: finalSuccess,
      scenarioResults,
      summary: finalSuccess
        ? 'Excelente! Sua lista de controle de acesso protege os recursos internos e libera apenas os serviços autorizados seguindo a ordem correta.'
        : (isOverlyPermissive 
          ? 'ALERTA DE SEGURANÇA: Uma regra ALLOW ANY ANY colocada no topo aceita todo e qualquer tráfego antes de avaliar as restrições posteriores (First Match Wins).' 
          : 'Ajuste necessário: Algumas requisições não obtiveram a ação esperada. Verifique a ordem das regras ou parâmetros.')
    });

    if (finalSuccess) {
      onCompleteStage(activeStage);
    }
  };

  const handleDontKnow = () => {
    onDidNotKnow('firewall-acl-build-1', 'BUILD');
    setEvaluationResult({
      tested: true,
      allPassed: false,
      scenarioResults: [],
      summary: 'Marcado como "Não sei". Regra fundamental de Firewalls: As regras são avaliadas de cima para baixo (Top-Down). A PRIMEIRA regra que der match decide a ação. No final de toda ACL existe um DENY ALL implícito.'
    });
  };

  return (
    <div className="space-y-8 font-sans text-zinc-200">
      {/* Header */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded bg-amber-950/80 text-amber-400 font-mono text-[10px] uppercase tracking-wider font-bold border border-amber-800/60">
            Laboratório Interativo • BUILD
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {concept.title}
          </span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Construção de Políticas de Firewall & ACL
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Firewalls operam com a semântica <strong>First Match Wins (Primeiro Match Vence)</strong>. Construa e ordene as regras para permitir tráfego legítimo sem abrir brechas excessivas.
        </p>
      </section>

      {/* Builder de Regras */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Tabela de Regras (Avaliadas de Cima para Baixo ↓)
          </h3>
          <button
            type="button"
            onClick={() => { setRules(INITIAL_RULES); setEvaluationResult(null); }}
            className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>
        </div>

        {/* Lista de Regras com Controles de Reordenação */}
        <div className="space-y-2 overflow-x-auto">
          {rules.map((rule, idx) => (
            <div 
              key={rule.id}
              className={`p-3 rounded-lg border font-mono text-xs flex items-center justify-between gap-3 ${
                rule.action === 'ALLOW' 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' 
                  : 'bg-red-950/20 border-red-800/40 text-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-zinc-500 font-bold">#{idx + 1}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rule.action === 'ALLOW' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'
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
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                  title="Subir regra"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === rules.length - 1}
                  onClick={() => handleMoveRule(idx, 'DOWN')}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                  title="Descer regra"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="p-1 text-zinc-500 hover:text-red-400"
                  title="Remover regra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulário para Adicionar Regra */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block font-bold">
            Adicionar Nova Regra
          </span>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <label className="text-zinc-500 block mb-1">Ação</label>
              <select 
                value={newAction} 
                onChange={(e) => setNewAction(e.target.value as 'ALLOW' | 'DENY')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white"
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Protocolo</label>
              <select 
                value={newProto} 
                onChange={(e) => setNewProto(e.target.value as 'TCP' | 'UDP' | 'ANY')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Origem</label>
              <select 
                value={newSource} 
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white"
              >
                <option value="ANY">ANY</option>
                <option value="MGMT_NET (192.168.100.0/24)">MGMT_NET (192.168.100.0/24)</option>
                <option value="INTERNET (203.0.113.0/24)">INTERNET</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Destino</label>
              <select 
                value={newDest} 
                onChange={(e) => setNewDest(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white"
              >
                <option value="WEB_SRV (10.0.1.10)">WEB_SRV (10.0.1.10)</option>
                <option value="DB_SRV (10.0.2.50)">DB_SRV (10.0.2.50)</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Porta</label>
              <select 
                value={newPort} 
                onChange={(e) => setNewPort(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white"
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
                className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Inserir
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">Grau de certeza:</span>
            <button
              type="button"
              onClick={() => setConfidence('CONFIDENT')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                confidence === 'CONFIDENT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500' : 'text-zinc-500'
              }`}
            >
              Certeza
            </button>
            <button
              type="button"
              onClick={() => setConfidence('HESITANT')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
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
              onClick={handleEvaluateAcl}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              Simular Tráfego & Validar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Resultados da Simulação */}
      {evaluationResult && (
        <section className={`p-6 rounded-xl border space-y-4 font-mono text-xs ${
          evaluationResult.allPassed 
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
            : 'bg-red-950/40 border-red-800/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {evaluationResult.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <h4 className="font-bold text-sm text-white">
              {evaluationResult.allPassed ? 'Validação de Política Aprovada' : 'Falha na Validação de Tráfego'}
            </h4>
          </div>

          <p className="text-zinc-300 leading-relaxed font-sans">
            {evaluationResult.summary}
          </p>

          {evaluationResult.scenarioResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                Cenários de Teste Avaliados:
              </span>
              {evaluationResult.scenarioResults.map((sr, idx) => (
                <div key={sr.id} className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold">Cenário {idx + 1}:</span>
                    <span className="text-zinc-400 ml-2">{TEST_SCENARIOS[idx]?.description}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sr.passed ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
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
