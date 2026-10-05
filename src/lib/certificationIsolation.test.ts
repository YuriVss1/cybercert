import assert from 'node:assert';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { useExamStore } from '../stores/examStore.ts';
import { EXAM_PBQS } from '../data/examPbqsData.ts';
import { supabase } from './supabase.ts';

console.log('--- INICIANDO TESTES DE ISOLAMENTO POR CERTIFICAÇÃO (F-ISO-01) ---');

async function runTests() {
  const store = useExamStore.getState();

  // Mock de certificações
  const secPlusCert = {
    id: 'e990ade7-9c84-434b-a309-43870ca19413',
    code: 'SY0-701',
    name: 'Security+',
    color_theme: 'cyan',
    created_at: new Date().toISOString()
  };

  const ccnaCert = {
    id: '64b9217b-c0fe-490a-9244-ceec3489f4d2',
    code: '200-301',
    name: 'CCNA',
    color_theme: 'emerald',
    is_available: true,
    created_at: new Date().toISOString()
  };

  const nse4Cert = {
    id: 'b5a03e1a-c75c-43f6-95ff-4ea0f6667923',
    code: 'NSE4',
    name: 'Fortinet Certified Professional',
    color_theme: 'orange',
    created_at: new Date().toISOString()
  };

  // TESTE 1: EXAM_PBQS pertencem estritamente a domínios de Security+
  console.log('Verificando taxonomia de EXAM_PBQS...');
  assert.strictEqual(EXAM_PBQS.length, 3, 'EXAM_PBQS deve conter exatamente 3 PBQs');
  const validSecPlusDomains = [
    'Operações de segurança',
    'Ameaças, vulnerabilidades e mitigações',
    'Arquitetura de segurança',
    'Conceitos gerais de segurança',
    'Gerenciamento e supervisão do programa de segurança'
  ];
  for (const pbq of EXAM_PBQS) {
    assert.ok(
      validSecPlusDomains.includes(pbq.domain),
      `PBQ ${pbq.id} possui domínio ${pbq.domain}, que deve ser de Security+`
    );
  }
  console.log('✓ TESTE 1: EXAM_PBQS contêm exclusivamente domínios de Security+ (SY0-701).');

  // TESTE 2: CCNA - Chamada a generateSimulado NÃO pode iniciar prova, NÃO pode injetar EXAM_PBQS
  console.log('Testando bloqueio de Simulado Oficial para CCNA (200-301)...');
  useExamStore.setState({
    selectedCert: ccnaCert,
    questions: [],
    isStarted: false,
    examType: 'training'
  });

  await useExamStore.getState().generateSimulado(90);

  const ccnaState = useExamStore.getState();
  assert.strictEqual(ccnaState.isStarted, false, 'Simulado não deve ser iniciado para CCNA');
  assert.strictEqual(ccnaState.questions.length, 0, 'CCNA não deve receber nenhuma questão no Simulado Oficial');
  
  const ccnaHasSecurityPbqs = ccnaState.questions.some(q => EXAM_PBQS.some(p => p.id === q.id));
  assert.strictEqual(ccnaHasSecurityPbqs, false, 'CCNA NUNCA deve conter PBQs de Security+');
  console.log('✓ TESTE 2: CCNA bloqueado para Simulado Oficial com 0 PBQs e 0 questões Security+');

  // TESTE 3: NSE 4 - Chamada a generateSimulado NÃO pode iniciar prova, NÃO pode injetar EXAM_PBQS
  console.log('Testando bloqueio de Simulado Oficial para NSE 4 (NSE4)...');
  useExamStore.setState({
    selectedCert: nse4Cert,
    questions: [],
    isStarted: false,
    examType: 'training'
  });

  await useExamStore.getState().generateSimulado(90);

  const nse4State = useExamStore.getState();
  assert.strictEqual(nse4State.isStarted, false, 'Simulado não deve ser iniciado para NSE 4');
  assert.strictEqual(nse4State.questions.length, 0, 'NSE 4 não deve receber nenhuma questão no Simulado Oficial');
  
  const nse4HasSecurityPbqs = nse4State.questions.some(q => EXAM_PBQS.some(p => p.id === q.id));
  assert.strictEqual(nse4HasSecurityPbqs, false, 'NSE 4 NUNCA deve conter PBQs de Security+');
  console.log('✓ TESTE 3: NSE 4 bloqueado para Simulado Oficial com 0 PBQs e 0 questões Security+');

  // TESTE 4: Certificação nula - generateSimulado é rejeitado
  console.log('Testando tentativa com certificação nula...');
  useExamStore.setState({
    selectedCert: null,
    questions: [],
    isStarted: false
  });

  await useExamStore.getState().generateSimulado(90);

  const nullCertState = useExamStore.getState();
  assert.strictEqual(nullCertState.isStarted, false, 'Simulado não deve ser iniciado sem certificação');
  assert.strictEqual(nullCertState.questions.length, 0, 'Nenhuma questão deve ser carregada sem certificação');
  console.log('✓ TESTE 4: Certificação nula rejeitada com segurança.');

  // TESTE 5: Security+ (SY0-701) - Inicia Simulado Oficial com 3 PBQs e MCQs isolados (90 itens totais)
  console.log('Testando Simulado Oficial para CompTIA Security+ (SY0-701)...');

  // Mock determinístico de supabase.from('questions') para teste hermético
  const originalFrom = (supabase as any).from.bind(supabase);
  (supabase as any).from = (table: string) => {
    if (table === 'questions') {
      return {
        select: (_cols: string) => ({
          eq: (field: string, val: string) => {
            if (field === 'cert_id' && val === secPlusCert.id) {
              const mockQuestions = Array.from({ length: 100 }, (_, i) => ({
                id: `q-mock-secplus-${i + 1}`,
                question_text: `Mock Security+ Question ${i + 1}`,
                options: ['A', 'B', 'C', 'D'],
                correct_answer: 'A',
                explanation: 'Mock explanation',
                domain: 'Operações de segurança',
                difficulty: 'medium',
                cert_id: secPlusCert.id,
                skills: []
              }));
              return Promise.resolve({ data: mockQuestions, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }
        })
      };
    }
    return originalFrom(table);
  };

  useExamStore.setState({
    selectedCert: secPlusCert,
    questions: [],
    isStarted: false
  });

  await useExamStore.getState().generateSimulado(90);

  // Restaurar método original
  (supabase as any).from = originalFrom;

  const secState = useExamStore.getState();
  assert.strictEqual(secState.isStarted, true, 'Simulado deve iniciar para Security+');
  assert.strictEqual(secState.questions.length, 90, 'Security+ deve carregar exatamente 90 itens (3 PBQs + 87 MCQs)');

  const pbqItems = secState.questions.filter(q => q.type === 'pbq');
  const mcqItems = secState.questions.filter(q => q.type !== 'pbq');

  assert.strictEqual(pbqItems.length, 3, 'Security+ deve conter exatamente 3 PBQs');
  assert.strictEqual(mcqItems.length, 87, 'Security+ deve conter exatamente 87 MCQs');

  // Confirmar que todos os MCQs retornados pertencem ao cert_id de Security+
  for (const mcq of mcqItems) {
    if ('cert_id' in mcq && mcq.cert_id) {
      assert.strictEqual(
        mcq.cert_id,
        secPlusCert.id,
        `Questão ${mcq.id} deve ter cert_id de Security+`
      );
    }
  }
  console.log('✓ TESTE 5: Security+ (SY0-701) inicia com 3 PBQs + 87 MCQs = 90 itens estritamente isolados.');

  // TESTE 6: Troca de certificação via setSelectedCert reseta exame ativo
  console.log('Testando isolamento de estado de exame ao trocar de certificação...');
  useExamStore.setState({
    selectedCert: secPlusCert,
    questions: [{ id: 'mock-q-sec', type: 'question' as const, domain: 'Operações de segurança', difficulty: 'Medium' as const, question_text: 'Sec?', options: ['A'], correct_answer: 'A', explanation: 'E' }],
    isStarted: true,
    answers: { 'mock-q-sec': 'A' }
  });

  // Troca para CCNA
  useExamStore.getState().setSelectedCert(ccnaCert);
  const switchedState = useExamStore.getState();
  assert.strictEqual(switchedState.selectedCert?.code, '200-301');
  assert.strictEqual(switchedState.isStarted, false, 'Troca de certificação deve desarmar isStarted');
  assert.strictEqual(switchedState.questions.length, 0, 'Troca de certificação deve limpar questões da prova anterior');
  assert.deepStrictEqual(switchedState.answers, {}, 'Troca de certificação deve limpar respostas anteriores');
  console.log('✓ TESTE 6: Troca de certificação via setSelectedCert purga estado de exame ativo.');

  // TESTE 7: calculateReadiness não vaza históricos sem cert_id ou de outra certificação
  console.log('Testando isolamento estrito de histórico em calculateReadiness...');
  const { calculateReadiness } = await import('./learningEngine.ts');
  const mixedHistory: any[] = [
    { id: 'h1', cert_id: 'SY0-701', total_questions: 90, correct_count: 80, score: 820, passed: true },
    { id: 'h2', cert_id: null, total_questions: 50, correct_count: 45, score: 850, passed: true }, // Sem cert_id
    { id: 'h3', cert_id: '200-301', total_questions: 10, correct_count: 5, score: 500, passed: false }, // CCNA
  ];

  const ccnaReadiness = calculateReadiness(mixedHistory, '200-301');
  // CCNA possui apenas h3 (10 questões avaliadas)
  assert.strictEqual(ccnaReadiness.totalEvaluatedQuestions, 10, 'CCNA deve avaliar somente o histórico estritamente pertencente a 200-301');
  
  const nse4Readiness = calculateReadiness(mixedHistory, 'NSE4');
  // NSE4 não possui nenhum histórico (0 questões)
  assert.strictEqual(nse4Readiness.totalEvaluatedQuestions, 0, 'NSE4 não deve herdar nenhum histórico sem cert_id ou de outra cert');
  console.log('✓ TESTE 7: calculateReadiness ignora estritamente históricos sem cert_id ou de terceiros.');

  // TESTE 8: calculateSkillPerformance descarta tentativas sem cert_id ou de outras certs
  console.log('Testando isolamento granular de telemetria em calculateSkillPerformance...');
  const { calculateSkillPerformance } = await import('./learningEngine.ts');
  const mixedAttempts = [
    { question_id: 'q1', is_correct: true, user_id: 'u1', cert_id: 'SY0-701' },
    { question_id: 'q1', is_correct: true, user_id: 'u1', cert_id: null as unknown as string }, // Nulo
    { question_id: 'q1', is_correct: false, user_id: 'u1', cert_id: '200-301' }, // CCNA
  ];
  const mockMappings = [
    { question_id: 'q1', skill_id: 'sk1', skill_slug: 'ip-routing', skill_name: 'IP Routing' }
  ];

  const ccnaSkillPerf = calculateSkillPerformance(
    mixedAttempts,
    mockMappings,
    undefined,
    { userId: 'u1', certId: '200-301' }
  );
  assert.strictEqual(ccnaSkillPerf.length, 1);
  assert.strictEqual(ccnaSkillPerf[0].totalAttempts, 1, 'Apenas a tentativa de CCNA deve ser computada');
  assert.strictEqual(ccnaSkillPerf[0].correctCount, 0, 'A tentativa de CCNA foi errada');
  console.log('✓ TESTE 8: calculateSkillPerformance isola estritamente tentativas por cert_id.');

  console.log('\n======================================================');
  console.log('TODOS OS 8 TESTES DE ISOLAMENTO PASSARAM COM SUCESSO (PASS)!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Falha nos testes de isolamento:', err);
  process.exit(1);
});
