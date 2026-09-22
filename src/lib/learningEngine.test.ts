import assert from 'node:assert';
import { 
  calculateReadiness, 
  calculateDomainPerformance, 
  calculateSkillPerformance,
  identifyWeakAreas, 
  generateStudyRecommendations, 
  analyzeRecurringErrors, 
  classifyQuestionForSpacedRepetition,
  normalizeSkillSlug,
  LEARNING_THRESHOLDS 
} from './learningEngine.ts';
import type { ExamHistoryItem, Question } from '../stores/examStore.ts';

console.log('--- INICIANDO TESTES DO LEARNING ENGINE (CYBERCERT) ---');

// Helper para criar mock de ExamHistoryItem
function createMockExam(params: {
  id?: string;
  score?: number;
  correct_count: number;
  total_questions: number;
  passed?: boolean;
  created_at?: string;
  exam_type?: string;
  domain_stats?: Record<string, { total: number; correct: number; percentage: number }>;
  incorrect_questions?: string[];
  cert_id?: string;
}): ExamHistoryItem {
  return {
    id: params.id || `exam-${Math.random().toString(36).substring(2, 9)}`,
    score: params.score ?? Math.round(100 + (params.correct_count * (800 / Math.max(1, params.total_questions)))),
    correct_count: params.correct_count,
    total_questions: params.total_questions,
    passed: params.passed ?? ((params.score ?? 750) >= 750),
    created_at: params.created_at || new Date().toISOString(),
    exam_type: params.exam_type || 'official',
    domain_stats: params.domain_stats,
    incorrect_questions: params.incorrect_questions || [],
    cert_id: params.cert_id || 'SY0-701'
  };
}

// ============================================================================
// CENÁRIO 1: 0 Tentativas (Histórico Vazio)
// ============================================================================
{
  const result = calculateReadiness([]);
  assert.strictEqual(result.overallPercentage, null, 'Cenário 1 falhou: overallPercentage deve ser null para 0 tentativas');
  assert.strictEqual(result.state, 'insufficient_data', 'Cenário 1 falhou: state deve ser insufficient_data');
  assert.strictEqual(result.totalEvaluatedQuestions, 0, 'Cenário 1 falhou: total questões deve ser 0');
  assert.strictEqual(result.isProvisional, true, 'Cenário 1 falhou: deve ser isProvisional');
  assert.strictEqual(result.dimensions.performance.score, null, 'Cenário 1 falhou: performance deve ser null');
  assert.strictEqual(result.dimensions.retention.score, null, 'Cenário 1 falhou: retention deve ser null');
  assert.strictEqual(result.dimensions.consistency.score, null, 'Cenário 1 falhou: consistency deve ser null');
  assert.strictEqual(result.dimensions.application.score, null, 'Cenário 1 falhou: application deve ser null');
  console.log('✓ Cenário 1: 0 tentativas tratado com sucesso (null, dados insuficientes).');
}

// ============================================================================
// CENÁRIO 2: 3 Tentativas (< 10 Limiar Mínimo)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 2, total_questions: 3 })
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.overallPercentage, null, 'Cenário 2 falhou: overallPercentage deve ser null para 3 tentativas (<10)');
  assert.strictEqual(result.state, 'insufficient_data', 'Cenário 2 falhou: state deve ser insufficient_data');
  assert.strictEqual(result.totalEvaluatedQuestions, 3, 'Cenário 2 falhou: total questões deve ser 3');
  console.log('✓ Cenário 2: 3 tentativas tratado com sucesso (<10 limiar mínimo).');
}

// ============================================================================
// CENÁRIO 3: 10 Tentativas (1 sessão - Limiar Mínimo Inicial)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 8, total_questions: 10, exam_type: 'training' })
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.totalEvaluatedQuestions, 10, 'Cenário 3 falhou: total questões deve ser 10');
  assert.strictEqual(result.dimensions.performance.score, 80, 'Cenário 3 falhou: performance deve ser 80%');
  assert.strictEqual(result.dimensions.retention.score, null, 'Cenário 3 falhou: retenção deve ser null (apenas 1 sessão)');
  assert.strictEqual(result.dimensions.consistency.score, null, 'Cenário 3 falhou: consistência deve ser null (<3 sessões)');
  assert.strictEqual(result.dimensions.application.score, null, 'Cenário 3 falhou: aplicação deve ser null (não é exame oficial)');
  assert.strictEqual(result.isProvisional, true, 'Cenário 3 falhou: deve ser provisório por faltarem 3 dimensões');
  assert.strictEqual(result.state, 'provisional', 'Cenário 3 falhou: state deve ser provisional');
  // Em estado provisório, overallPercentage deve ser null para não enganar o usuário como "100% Readiness"
  assert.strictEqual(result.overallPercentage, null, 'Cenário 3 falhou: overallPercentage deve ser null em estado provisório');
  assert.strictEqual(result.provisionalScore, 80, 'Cenário 3 falhou: provisionalScore interno deve ser 80%');
  console.log('✓ Cenário 3: 10 tentativas em 1 sessão tratado com sucesso (provisório com overall null e provisionalScore interno).');
}

// ============================================================================
// CENÁRIO 4: 30 Tentativas em 3 Sessões (Em Desenvolvimento)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 8, total_questions: 10, exam_type: 'training', created_at: '2026-09-01T10:00:00Z' }),
    createMockExam({ correct_count: 7, total_questions: 10, exam_type: 'training', created_at: '2026-09-02T10:00:00Z' }),
    createMockExam({ correct_count: 9, total_questions: 10, exam_type: 'training', created_at: '2026-09-03T10:00:00Z' }),
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.totalEvaluatedQuestions, 30, 'Cenário 4 falhou: total questões deve ser 30');
  assert.strictEqual(result.dimensions.performance.score, 80, 'Cenário 4 falhou: 24/30 = 80%');
  assert.notStrictEqual(result.dimensions.retention.score, null, 'Cenário 4 falhou: retenção deve ser calculada (>=2 sessões)');
  assert.notStrictEqual(result.dimensions.consistency.score, null, 'Cenário 4 falhou: consistência deve ser calculada (>=3 sessões)');
  assert.strictEqual(result.dimensions.application.score, null, 'Cenário 4 falhou: aplicação deve ser null (sem simulado oficial)');
  assert.strictEqual(result.isProvisional, true, 'Cenário 4 falhou: ainda provisório pois falta Performance Under Exam Conditions');
  assert.strictEqual(result.overallPercentage, null, 'Cenário 4 falhou: overallPercentage deve ser null enquanto for provisório');
  assert.notStrictEqual(result.provisionalScore, null, 'Cenário 4 falhou: provisionalScore interno deve estar disponível');
  console.log('✓ Cenário 4: 30 tentativas em 3 sessões tratado com sucesso (retenção e consistência ativas, aplicação pendente).');
}

// ============================================================================
// CENÁRIO 5: 60+ Tentativas com Simulado Oficial (Avançado / Alta Consistência)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 8, total_questions: 10, exam_type: 'training', created_at: '2026-09-01T10:00:00Z' }),
    createMockExam({ correct_count: 9, total_questions: 10, exam_type: 'training', created_at: '2026-09-02T10:00:00Z' }),
    createMockExam({ correct_count: 8, total_questions: 10, exam_type: 'training', created_at: '2026-09-03T10:00:00Z' }),
    createMockExam({ correct_count: 80, total_questions: 90, score: 820, passed: true, exam_type: 'official', created_at: '2026-09-04T10:00:00Z' }),
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.totalEvaluatedQuestions, 120, 'Cenário 5 falhou: total questões deve ser 120 (>=60)');
  assert.strictEqual(result.isProvisional, false, 'Cenário 5 falhou: não deve ser provisório com todas as 4 dimensões preenchidas');
  assert.notStrictEqual(result.overallPercentage, null, 'Cenário 5 falhou: overallPercentage deve estar preenchido quando não é provisório');
  assert.notStrictEqual(result.dimensions.performance.score, null);
  assert.notStrictEqual(result.dimensions.retention.score, null);
  assert.notStrictEqual(result.dimensions.consistency.score, null);
  assert.notStrictEqual(result.dimensions.application.score, null);
  assert.strictEqual(result.dimensions.application.label, 'Performance Under Exam Conditions');
  assert(result.state === 'advanced' || result.state === 'high_consistency', 'Cenário 5 falhou: estado deve ser advanced ou high_consistency');
  console.log(`✓ Cenário 5: 60+ tentativas com simulado oficial (estado: ${result.state}, todas 4 dimensões completas).`);
}

// ============================================================================
// CENÁRIO 6: Histórico com Apenas Acertos (100% Taxa de Acerto)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 10, total_questions: 10, exam_type: 'training', created_at: '2026-09-01T10:00:00Z' }),
    createMockExam({ correct_count: 10, total_questions: 10, exam_type: 'training', created_at: '2026-09-02T10:00:00Z' }),
    createMockExam({ correct_count: 10, total_questions: 10, exam_type: 'training', created_at: '2026-09-03T10:00:00Z' }),
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.dimensions.performance.score, 100, 'Cenário 6 falhou: performance deve ser 100%');
  assert.strictEqual(result.dimensions.consistency.score, 100, 'Cenário 6 falhou: variância zero deve produzir consistência máxima (100)');
  assert.strictEqual(result.overallPercentage, null, 'Cenário 6: deve ser null pois falta Exame Oficial');
  assert.strictEqual(result.provisionalScore, 100, 'Cenário 6: provisionalScore consolidado deve ser 100');
  assert(!isNaN(result.provisionalScore!), 'Cenário 6 falhou: provisionalScore não pode ser NaN');
  console.log('✓ Cenário 6: Histórico 100% acertos testado (sem NaN, consistência máxima 100, provisionalScore = 100).');
}

// ============================================================================
// CENÁRIO 7: Histórico com Apenas Erros (0% Taxa de Acerto)
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 0, total_questions: 10, exam_type: 'training', created_at: '2026-09-01T10:00:00Z' }),
    createMockExam({ correct_count: 0, total_questions: 10, exam_type: 'training', created_at: '2026-09-02T10:00:00Z' }),
    createMockExam({ correct_count: 0, total_questions: 10, exam_type: 'training', created_at: '2026-09-03T10:00:00Z' }),
  ];
  const result = calculateReadiness(history);
  assert.strictEqual(result.dimensions.performance.score, 0, 'Cenário 7 falhou: performance deve ser 0%');
  assert.strictEqual(result.overallPercentage, null, 'Cenário 7: overallPercentage deve ser null pois é provisório');
  assert.strictEqual(result.provisionalScore, 25, 'Cenário 7: provisionalScore distribuído corretamente (20 / 0.80 = 25)');
  assert(!isNaN(result.provisionalScore!), 'Cenário 7 falhou: provisionalScore não pode ser NaN');
  console.log('✓ Cenário 7: Histórico 0% acertos testado (sem divisão por zero, sem NaN, provisionalScore calculado).');
}

// ============================================================================
// CENÁRIO 8: Questões Sem Skills Cadastradas
// ============================================================================
{
  const mockQuestions: Question[] = [
    {
      id: 'q-legacy-1',
      domain: 'General Security Concepts',
      difficulty: 'Medium',
      question_text: 'O que é MFA?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      explanation: 'MFA exige múltiplos fatores.',
      // skills ausente intencionalmente
    },
    {
      id: 'q-legacy-2',
      domain: 'General Security Concepts',
      difficulty: 'Medium',
      question_text: 'O que é VPN?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'B',
      explanation: 'VPN criptografa o tráfego.',
      skills: [] // skills vazio
    }
  ];

  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 1, total_questions: 2, incorrect_questions: ['q-legacy-1'] })
  ];

  const skillPerf = calculateSkillPerformance(mockQuestions, history);
  assert(Array.isArray(skillPerf), 'Cenário 8 falhou: calculateSkillPerformance deve retornar array');
  assert.strictEqual(skillPerf.length, 0, 'Cenário 8 falhou: deve retornar vazio sem quebrar para questões sem skills');
  console.log('✓ Cenário 8: Questões sem skills tratadas com segurança (retorno vazio resiliente).');
}

// ============================================================================
// CENÁRIO 9: Certificação Sem Domínios Cadastrados
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 5, total_questions: 10 })
  ];
  const domainPerf = calculateDomainPerformance(history, []);
  assert(Array.isArray(domainPerf), 'Cenário 9 falhou: calculateDomainPerformance deve retornar array');
  assert.strictEqual(domainPerf.length, 0, 'Cenário 9 falhou: deve retornar array vazio quando certDomains for []');
  
  const weakAreas = identifyWeakAreas(domainPerf);
  assert.strictEqual(weakAreas.length, 0, 'Cenário 9 falhou: identifyWeakAreas deve retornar vazio para domínios vazios');
  console.log('✓ Cenário 9: Certificação sem domínios tratada com segurança (retorno [] sem erro).');
}

// ============================================================================
// CENÁRIO ADICIONAL: Normalização de Slugs de Skills (Deduplicação Canônica)
// ============================================================================
{
  const slug1 = normalizeSkillSlug('IAM');
  const slug2 = normalizeSkillSlug('iam');
  const slug3 = normalizeSkillSlug('  Identity and Access Management  ');
  const slug4 = normalizeSkillSlug('Firewall & ACLs');

  assert.strictEqual(slug1, 'iam', 'Falha na normalização do IAM');
  assert.strictEqual(slug2, 'iam', 'Falha na normalização do iam minúsculo');
  assert.strictEqual(slug1, slug2, 'IAM e iam devem convergir para o mesmo slug canônico');
  assert.strictEqual(slug3, 'identity-and-access-management', 'Falha no slug de texto longo com espaços');
  assert.strictEqual(slug4, 'firewall-acls', 'Falha no slug com caracteres especiais (&)');

  console.log('✓ Normalização de Skills testada: IAM e iam convergem para o slug canônico "iam".');
}

// ============================================================================
// CENÁRIO ADICIONAL: Repetição Espaçada e Erros Recorrentes
// ============================================================================
{
  const history: ExamHistoryItem[] = [
    createMockExam({ correct_count: 5, total_questions: 10, incorrect_questions: ['q1', 'q2'] }),
    createMockExam({ correct_count: 6, total_questions: 10, incorrect_questions: ['q1', 'q3'] }),
  ];

  const recurring = analyzeRecurringErrors(history);
  assert.strictEqual(recurring.recurringErrorCount, 1, 'Deve detectar 1 questão recorrente (q1)');
  assert.strictEqual(recurring.recurringQuestionIds[0], 'q1', 'q1 deve ser o ID reincidente');

  const spacedItem = classifyQuestionForSpacedRepetition('q1', history);
  assert.strictEqual(spacedItem.status, 'hard', 'Questão recorrente deve ser classificada como hard');
  assert.strictEqual(spacedItem.nextReviewDays, 1, 'Revisão deve ser em 1 dia (24h)');

  console.log('✓ Repetição espaçada e erros recorrentes testados com sucesso.');
}

// ============================================================================
// CENÁRIO ADICIONAL: Recomendações Automáticas e Limiares
// ============================================================================
{
  assert.strictEqual(LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_INITIAL, 10);
  assert.strictEqual(LEARNING_THRESHOLDS.PASSING_SCORE, 750);

  const domainAnalyses = [{
    domain: 'IAM',
    totalQuestions: 15,
    correctCount: 8,
    percentage: 53,
    recentPercentage: 50,
    trend: 'declining' as const,
    isStrongest: false,
    isWeakest: true,
    needsAttention: true
  }];
  const weakAreas = identifyWeakAreas(domainAnalyses);
  const recurring = { recurringErrorCount: 0, recurringQuestionIds: [], mostAffectedDomains: [], summaryMessage: '' };
  
  const rec = generateStudyRecommendations(domainAnalyses, weakAreas, recurring);
  assert.strictEqual(rec.targetDomain, 'IAM', 'Deve recomendar o domínio mais fraco IAM');
  assert.strictEqual(rec.priority, 'high');
  console.log('✓ Recomendações automáticas e limiares validados com sucesso.');
}

console.log('\n======================================================');
console.log('TODOS OS TESTES DO LEARNING ENGINE PASSARAM COM SUCESSO!');
console.log('======================================================\n');
