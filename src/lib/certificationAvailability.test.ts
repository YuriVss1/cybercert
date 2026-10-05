import assert from 'node:assert';
import { useExamStore } from '../stores/examStore.ts';
import { EXAM_PBQS } from '../data/examPbqsData.ts';
import { supabase } from './supabase.ts';

console.log('--- INICIANDO TESTES DE DISPONIBILIDADE E CICLO DE VIDA DE CERTIFICAÇÕES ---');

async function runTests() {
  const secPlusCert = {
    id: 'e990ade7-9c84-434b-a309-43870ca19413',
    code: 'SY0-701',
    name: 'Security+',
    color_theme: 'cyan',
    is_available: true,
  };

  const ccnaDisabledCert = {
    id: '64b9217b-c0fe-490a-9244-ceec3489f4d2',
    code: '200-301',
    name: 'CCNA',
    color_theme: 'emerald',
    is_available: false,
  };

  const ccnaEnabledCert = {
    ...ccnaDisabledCert,
    is_available: true,
  };

  const nse4DisabledCert = {
    id: 'b5a03e1a-c75c-43f6-95ff-4ea0f6667923',
    code: 'NSE4',
    name: 'Fortinet Certified Professional',
    color_theme: 'orange',
    is_available: false,
  };

  // TESTE 1: CompTIA Security+ (SY0-701) permanece disponível para usuário comum
  console.log('1. Testando seleção de Security+ por usuário comum...');
  useExamStore.setState({
    isAdmin: false,
    selectedCert: null,
    questions: [],
    isStarted: false,
  });

  useExamStore.getState().setSelectedCert(secPlusCert);
  const secState = useExamStore.getState();
  assert.strictEqual(secState.selectedCert?.code, 'SY0-701', 'Security+ deve ser selecionável por usuário comum');
  console.log('✓ TESTE 1: Security+ habilitada e selecionável normalmente.');

  // TESTE 2: CCNA desabilitada NÃO pode ser selecionada por usuário comum
  console.log('2. Testando bloqueio de seleção de CCNA desabilitada para usuário comum...');
  useExamStore.setState({
    isAdmin: false,
    selectedCert: null,
    questions: [],
    isStarted: false,
  });

  useExamStore.getState().setSelectedCert(ccnaDisabledCert);
  const ccnaBlockedState = useExamStore.getState();
  assert.strictEqual(ccnaBlockedState.selectedCert, null, 'CCNA desabilitada não pode ser selecionada por usuário comum');
  console.log('✓ TESTE 2: Seleção de CCNA desabilitada bloqueada com sucesso.');

  // TESTE 3: Fluxos operacionais bloqueados quando certificação está desabilitada
  console.log('3. Testando bloqueio de Simulado, Treino e Retaliação para certificação desabilitada...');
  useExamStore.setState({
    isAdmin: false,
    selectedCert: ccnaDisabledCert, // Simula tentativa forçada
    questions: [],
    isStarted: false,
  });

  // Tenta Simulado
  await useExamStore.getState().generateSimulado(90);
  assert.strictEqual(useExamStore.getState().isStarted, false, 'Simulado não pode iniciar para cert desabilitada');
  assert.strictEqual(useExamStore.getState().questions.length, 0, '0 questões carregadas');

  // Tenta Treinamento
  await useExamStore.getState().generateTreinamento(['Network Fundamentals'], 30);
  assert.strictEqual(useExamStore.getState().isStarted, false, 'Treinamento não pode iniciar para cert desabilitada');

  // Tenta Retaliação
  await useExamStore.getState().generateRetaliacao(30);
  assert.strictEqual(useExamStore.getState().isStarted, false, 'Retaliação não pode iniciar para cert desabilitada');

  // Tenta Repetição Espaçada
  await useExamStore.getState().generateSpacedRepetitionSession(['q-mock-1'], 20);
  assert.strictEqual(useExamStore.getState().isStarted, false, 'Repetição espaçada não pode iniciar para cert desabilitada');
  console.log('✓ TESTE 3: Todos os fluxos operacionais (Simulado, Treino, Retaliação, Repetição) bloqueados com segurança.');

  // TESTE 4: Isolamento — NENHUM conteúdo Security+ vaza para CCNA desabilitada
  console.log('4. Verificando ausência absoluta de vazamento cross-certification para CCNA desabilitada...');
  const stateAfterAttempts = useExamStore.getState();
  const hasSecPbqs = stateAfterAttempts.questions.some(q => EXAM_PBQS.some(p => p.id === q.id));
  assert.strictEqual(hasSecPbqs, false, 'Jamais deve haver PBQs de Security+ em CCNA');
  assert.strictEqual(stateAfterAttempts.questions.length, 0, 'Total de questões deve ser estritamente zero');
  console.log('✓ TESTE 4: Isolamento absoluto confirmado: 0 vazamentos de Security+.');

  // TESTE 5: Fortinet NSE 4 desabilitada bloqueia usuário comum
  console.log('5. Testando bloqueio de NSE 4 desabilitada para usuário comum...');
  useExamStore.setState({
    isAdmin: false,
    selectedCert: null,
    questions: [],
    isStarted: false,
  });

  useExamStore.getState().setSelectedCert(nse4DisabledCert);
  assert.strictEqual(useExamStore.getState().selectedCert, null, 'NSE 4 desabilitada não pode ser selecionada');
  console.log('✓ TESTE 5: NSE 4 desabilitada bloqueada para usuário comum.');

  // TESTE 6: Administrador possui permissão para acessar certificação em preparação
  console.log('6. Testando acesso administrativo a certificação em preparação...');
  useExamStore.setState({
    isAdmin: true,
    selectedCert: null,
    questions: [],
    isStarted: false,
  });

  useExamStore.getState().setSelectedCert(ccnaDisabledCert);
  const adminState = useExamStore.getState();
  assert.strictEqual(adminState.selectedCert?.code, '200-301', 'Administrador deve poder selecionar para testes');
  console.log('✓ TESTE 6: Acesso de auditoria/administrador validado.');

  // TESTE 7: CCNA habilitada pelo administrador torna-se disponível para usuário comum
  console.log('7. Testando seleção de CCNA após habilitação (is_available = true)...');
  useExamStore.setState({
    isAdmin: false,
    selectedCert: null,
    questions: [],
    isStarted: false,
  });

  useExamStore.getState().setSelectedCert(ccnaEnabledCert);
  const enabledState = useExamStore.getState();
  assert.strictEqual(enabledState.selectedCert?.code, '200-301', 'CCNA habilitada deve ser selecionável por usuário comum');
  console.log('✓ TESTE 7: CCNA habilitada torna-se disponível dinamicamente.');

  console.log('\n================================================================');
  console.log('TODOS OS 7 TESTES DE DISPONIBILIDADE E SEGURANÇA PASSARAM COM SUCESSO (PASS)!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Falha nos testes de disponibilidade:', err);
  process.exit(1);
});
