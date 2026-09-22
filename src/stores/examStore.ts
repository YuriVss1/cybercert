import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type Question = {
  id: string;
  domain: string;
  difficulty: 'Low' | 'Medium' | 'High';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  cert_id?: string;
  skills?: string[]; // Conceito de "Skills" (Conceitos técnicos associados)
  source?: string;
  author?: string;
  review_status?: string;
};

export type ConfidenceFeedback = 
  | 'knew_concept' 
  | 'had_doubt' 
  | 'guessed' 
  | 'confused' 
  | 'interpretation_error' 
  | 'did_not_know';

export type Certification = {
  id: string;
  code: string;
  name: string;
  color_theme: string;
  vendors?: { name: string };
};

export type DomainResult = {
  total: number;
  correct: number;
  percentage: number;
};

export type ExamHistoryItem = {
  id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  created_at: string;
  exam_type?: string;
  domain_stats?: Record<string, DomainResult>;
  incorrect_questions?: string[];
  cert_id?: string;
  user_id?: string;
};

export type PbqItem = {
  id: string;
  cert_id: string;
  title: string;
  type: string;
  description: string;
  config_data: Record<string, unknown> | null;
};

export type CommentItem = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string };
};

type AppMode = 'dashboard' | 'simulado' | 'treinamento' | 'historico' | 'metrics' | 'pbqs' | 'intelligence' | 'admin' | 'cyber-core';
type ExamType = 'official' | 'training';

type ExamState = {
  user: User | null;
  setUser: (user: User | null) => void;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;

  activeTab: AppMode;
  examType: ExamType;
  setActiveTab: (tab: AppMode) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;

  certifications: Certification[];
  selectedCert: Certification | null;
  setSelectedCert: (cert: Certification | null) => void;
  fetchCertifications: () => Promise<void>;
  seedDatabase: () => Promise<void>; 

  pbqsList: PbqItem[];
  fetchPbqs: () => Promise<void>;

  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: string[];
  revealedExplanations: Record<string, boolean>;
  userFeedback: Record<string, ConfidenceFeedback>;
  recordFeedback: (questionId: string, feedback: ConfidenceFeedback) => void;
  timeLeft: number;
  isStarted: boolean;
  isFinished: boolean;
  isReviewing: boolean;
  isLoading: boolean;
  isSubmittingExam: boolean;
  
  history: ExamHistoryItem[];
  domainResults: Record<string, DomainResult>;

  // Comentários da Comunidade (Fórum)
  questionComments: CommentItem[];
  fetchComments: (questionId: string) => Promise<void>;
  addComment: (questionId: string, content: string) => Promise<void>;
  upvoteComment: (commentId: string, currentUpvotes: number) => Promise<boolean>;

  pbqAclRules: { id: string; action: 'PERMIT' | 'DENY'; source: string; dest: string; port: string }[];
  setPbqAclRules: (rules: { id: string; action: 'PERMIT' | 'DENY'; source: string; dest: string; port: string }[]) => void;
  pbqSubmitted: boolean;
  pbqPassed: boolean;
  submitPbqAcl: () => void;
  resetPbqAcl: () => void;

  cliHistory: { command: string; output: string[] }[];
  pbq2Answer: string;
  setPbq2Answer: (answer: string) => void;
  pbq2Submitted: boolean;
  pbq2Passed: boolean;
  processCliCommand: (cmd: string) => void;
  submitPbq2: () => void;
  resetPbq2: () => void;

  addQuestion: (questionData: Omit<Question, 'id'>) => Promise<boolean>;
  generateSimulado: (limit?: number) => Promise<void>;
  generateTreinamento: (domains: string[], limit?: number) => Promise<void>;
  generateRetaliacao: (limit?: number) => Promise<void>;
  generateSpacedRepetitionSession: (targetQuestionIds: string[], limit?: number) => Promise<void>;
  fetchHistory: () => Promise<void>;
  answerQuestion: (id: string, answer: string) => void;
  toggleMarkForReview: (id: string) => void;
  revealExplanation: (id: string) => void;
  tickTimer: () => void;
  startReview: () => void;
  stopReview: () => void;
  finishExam: () => Promise<void>;
  resetExam: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
};

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, selectedCert: null });
  },

  activeTab: 'intelligence',
  examType: 'official',
  timeRange: '30d',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTimeRange: (range) => set({ timeRange: range }),

  certifications: [],
  selectedCert: null,
  pbqsList: [],

  setSelectedCert: (cert) => {
    set({ selectedCert: cert, activeTab: 'intelligence' });
    if (cert) {
      get().fetchPbqs();
    }
  },
  
  fetchCertifications: async () => {
    const { data, error } = await supabase.from('certifications').select('*, vendors(name)');
    if (!error && data) set({ certifications: data });
  },

  fetchPbqs: async () => {
    const { selectedCert } = get();
    if (!selectedCert) return;
    const { data, error } = await supabase.from('pbqs').select('*').eq('cert_id', selectedCert.id);
    if (!error && data) {
      set({ pbqsList: data });
    }
  },

  seedDatabase: async () => {
    set({ isLoading: true });

    const seedCatalog = [
      { vendorName: 'CompTIA', cert: { code: 'SY0-701', name: 'Security+', color_theme: 'cyan' } },
      { vendorName: 'Cisco', cert: { code: '200-301', name: 'CCNA', color_theme: 'emerald' } },
      { vendorName: 'Fortinet', cert: { code: 'NSE4', name: 'Fortinet Certified Professional', color_theme: 'orange' } },
    ];

    for (const item of seedCatalog) {
      const { data: existingVendor, error: vendorLookupError } = await supabase
        .from('vendors')
        .select('id')
        .eq('name', item.vendorName)
        .maybeSingle();

      if (vendorLookupError && vendorLookupError.code !== 'PGRST116') {
        console.error(vendorLookupError);
        set({ isLoading: false });
        return;
      }

      let vendorId = existingVendor?.id;
      if (!vendorId) {
        const { data: createdVendor, error: vendorInsertError } = await supabase
          .from('vendors')
          .insert([{ name: item.vendorName }])
          .select('id')
          .single();

        if (vendorInsertError) {
          console.error(vendorInsertError);
          set({ isLoading: false });
          return;
        }

        vendorId = createdVendor?.id;
      }

      if (!vendorId) continue;

      const { data: existingCert, error: certLookupError } = await supabase
        .from('certifications')
        .select('id')
        .eq('code', item.cert.code)
        .maybeSingle();

      if (certLookupError && certLookupError.code !== 'PGRST116') {
        console.error(certLookupError);
        set({ isLoading: false });
        return;
      }

      if (!existingCert) {
        const { error: certInsertError } = await supabase.from('certifications').insert([{
          vendor_id: vendorId,
          code: item.cert.code,
          name: item.cert.name,
          color_theme: item.cert.color_theme,
        }]);

        if (certInsertError) {
          console.error(certInsertError);
          set({ isLoading: false });
          return;
        }
      }
    }

    await get().fetchCertifications();
    set({ isLoading: false });
  },

  // Fórum / Comentários por Questão
  questionComments: [],
  fetchComments: async (questionId: string) => {
    set({ questionComments: [] });
    const { data, error } = await supabase
      .from('question_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ questionComments: data });
    }
  },
  addComment: async (questionId: string, content: string) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('question_comments').insert([{
      question_id: questionId,
      user_id: user.id,
      content
    }]);
    if (!error) {
      get().fetchComments(questionId);
    }
  },
  upvoteComment: async (commentId: string, currentUpvotes: number) => {
    // 1. Tenta RPC atômico no banco (prevenção de concorrência)
    const { error: rpcError } = await supabase.rpc('increment_comment_upvote', { target_comment_id: commentId });
    if (!rpcError) {
      set((state) => ({
        questionComments: state.questionComments.map((comment) =>
          comment.id === commentId ? { ...comment, upvotes: (comment.upvotes || 0) + 1 } : comment
        )
      }));
      return true;
    }

    // 2. Fallback resiliente caso a migration do RPC ainda não tenha sido aplicada
    const { error } = await supabase
      .from('question_comments')
      .update({ upvotes: currentUpvotes + 1 })
      .eq('id', commentId);
    if (!error) {
      set((state) => ({
        questionComments: state.questionComments.map((comment) =>
          comment.id === commentId ? { ...comment, upvotes: currentUpvotes + 1 } : comment
        )
      }));
      return true;
    }
    return false;
  },

  questions: [],
  currentIndex: 0,
  answers: {},
  markedForReview: [],
  revealedExplanations: {},
  userFeedback: {},
  recordFeedback: (questionId, feedback) => set((state) => ({
    userFeedback: { ...state.userFeedback, [questionId]: feedback }
  })),
  timeLeft: 90 * 60,
  isStarted: false,
  isFinished: false,
  isReviewing: false,
  isLoading: false,
  isSubmittingExam: false,
  history: [],
  domainResults: {},

  pbqAclRules: [
    { id: 'rule-3', action: 'PERMIT', source: 'Any', dest: 'Web-Server (10.0.1.50)', port: '80 / 443' },
    { id: 'rule-1', action: 'DENY', source: 'Untrusted-Net (192.168.100.0/24)', dest: 'DB-Server (10.0.1.99)', port: '1433 (MSSQL)' },
    { id: 'rule-2', action: 'PERMIT', source: 'Admin-PC (10.0.5.10)', dest: 'Management (Any)', port: '22 (SSH)' },
    { id: 'rule-4', action: 'DENY', source: 'Any', dest: 'Any', port: 'Any (Implicit Deny)' },
  ],
  setPbqAclRules: (rules) => set({ pbqAclRules: rules }),
  pbqSubmitted: false,
  pbqPassed: false,
  submitPbqAcl: () => {
    const rules = get().pbqAclRules;
    const isCorrect = rules[0].id === 'rule-2' && rules[1].id === 'rule-1' && rules[2].id === 'rule-3' && rules[3].id === 'rule-4';
    set({ pbqSubmitted: true, pbqPassed: isCorrect });
  },
  resetPbqAcl: () => set({
    pbqSubmitted: false, pbqPassed: false,
    pbqAclRules: [
      { id: 'rule-3', action: 'PERMIT', source: 'Any', dest: 'Web-Server (10.0.1.50)', port: '80 / 443' },
      { id: 'rule-1', action: 'DENY', source: 'Untrusted-Net (192.168.100.0/24)', dest: 'DB-Server (10.0.1.99)', port: '1433 (MSSQL)' },
      { id: 'rule-2', action: 'PERMIT', source: 'Admin-PC (10.0.5.10)', dest: 'Management (Any)', port: '22 (SSH)' },
      { id: 'rule-4', action: 'DENY', source: 'Any', dest: 'Any', port: 'Any (Implicit Deny)' },
    ]
  }),

  cliHistory: [{ command: '', output: ['Root OS [Versão 10.0.1]', 'Digite "help" para ver os comandos disponíveis.'] }],
  pbq2Answer: '',
  setPbq2Answer: (answer) => set({ pbq2Answer: answer }),
  pbq2Submitted: false,
  pbq2Passed: false,
  processCliCommand: (cmd) => {
    const command = cmd.trim().toLowerCase();
    let output: string[] = [];
    if (command === 'clear' || command === 'cls') { set({ cliHistory: [] }); return; } 
    else if (command === 'help') { output = ['COMANDOS:', '  ping [ip]', '  tracert [ip]', '  ipconfig', '  clear']; } 
    else if (command === 'ipconfig') { output = ['Endereço IPv4: 192.168.10.45', 'Gateway Padrão: 192.168.10.1']; } 
    else if (command.startsWith('ping ')) { output = [`Disparando com 32 bytes: Esgotado o tempo limite.`]; } 
    else if (command.startsWith('tracert ')) { output = [`  1  <1 ms  192.168.10.1 (Gateway)`, `  2  2 ms  10.0.0.5 (Core Switch)`, `  3  *  *  Esgotado o tempo limite.`]; } 
    else if (command !== '') { output = [`'${command}' não reconhecido.`]; }
    set((state) => ({ cliHistory: [...state.cliHistory, { command: cmd, output }] }));
  },
  submitPbq2: () => set({ pbq2Submitted: true, pbq2Passed: get().pbq2Answer === 'firewall' }),
  resetPbq2: () => set({ pbq2Submitted: false, pbq2Passed: false, pbq2Answer: '', cliHistory: [{ command: '', output: ['Root OS', 'Digite "help".'] }] }),

  addQuestion: async (questionData) => {
    set({ isLoading: true });
    const { selectedCert } = get();
    const formattedData: Record<string, unknown> = {
      domain: questionData.domain, difficulty: questionData.difficulty, question_text: questionData.question_text,
      options: JSON.stringify(questionData.options), correct_answer: questionData.correct_answer, explanation: questionData.explanation,
      cert_id: selectedCert?.id 
    };
    if (questionData.skills && questionData.skills.length > 0) {
      formattedData.skills = questionData.skills;
    }
    const { error } = await supabase.from('questions').insert([formattedData]);
    set({ isLoading: false });
    if (error) { console.error(error); return false; }
    return true;
  },

  generateSimulado: async (limit = 90) => {
    set({ isLoading: true, examType: 'official' });
    const { selectedCert } = get();
    let query = supabase.from('questions').select('*');
    if (selectedCert) query = query.eq('cert_id', selectedCert.id);
    
    const { data, error } = await query;
    if (error || !data) { set({ isLoading: false }); return; }
    const formattedQuestions = data.map(q => ({ ...q, options: Array.isArray(q.options) ? q.options : JSON.parse(q.options) }));
    const selectedQuestions = shuffleArray(formattedQuestions).slice(0, limit);
    set({ questions: selectedQuestions, currentIndex: 0, answers: {}, markedForReview: [], revealedExplanations: {}, timeLeft: 90 * 60, isStarted: true, isFinished: false, isReviewing: false, isLoading: false, domainResults: {}, activeTab: 'simulado' });
  },

  generateTreinamento: async (domains: string[], limit = 30) => {
    set({ isLoading: true, examType: 'training' });
    const { selectedCert } = get();
    let query = supabase.from('questions').select('*');
    if (selectedCert) query = query.eq('cert_id', selectedCert.id);
    if (domains.length > 0) query = query.in('domain', domains);
    
    const { data, error } = await query;
    if (error || !data) { set({ isLoading: false }); return; }
    const formattedQuestions = data.map(q => ({ ...q, options: Array.isArray(q.options) ? q.options : JSON.parse(q.options) }));
    const selectedQuestions = shuffleArray(formattedQuestions).slice(0, limit);
    set({ questions: selectedQuestions, currentIndex: 0, answers: {}, markedForReview: [], revealedExplanations: {}, timeLeft: 999 * 60, isStarted: true, isFinished: false, isReviewing: false, isLoading: false, domainResults: {}, activeTab: 'treinamento' });
  },

  generateRetaliacao: async (limit = 30) => {
    set({ isLoading: true, examType: 'training' });
    const { history, selectedCert } = get();
    const allIncorrect = new Set<string>();
    const currentHist = selectedCert ? history.filter(h => h.cert_id === selectedCert.id) : history;
    currentHist.forEach(h => { if (h.incorrect_questions && Array.isArray(h.incorrect_questions)) h.incorrect_questions.forEach(id => allIncorrect.add(id)); });
    
    const incorrectArray = Array.from(allIncorrect);
    if (incorrectArray.length === 0) { set({ isLoading: false }); alert("Nenhum erro registrado nesta certificação!"); return; }
    const { data, error } = await supabase.from('questions').select('*').in('id', incorrectArray);
    if (error || !data || data.length === 0) { set({ isLoading: false }); return; }
    const formattedQuestions = data.map(q => ({ ...q, options: Array.isArray(q.options) ? q.options : JSON.parse(q.options) }));
    const selectedQuestions = shuffleArray(formattedQuestions).slice(0, limit);
    set({ questions: selectedQuestions, currentIndex: 0, answers: {}, markedForReview: [], revealedExplanations: {}, timeLeft: 999 * 60, isStarted: true, isFinished: false, isReviewing: false, isLoading: false, domainResults: {}, activeTab: 'treinamento' });
  },

  generateSpacedRepetitionSession: async (targetQuestionIds: string[], limit = 20) => {
    set({ isLoading: true, examType: 'training' });
    if (targetQuestionIds.length === 0) {
      set({ isLoading: false });
      alert("Nenhuma questão selecionada para a sessão de repetição espaçada!");
      return;
    }
    const { data, error } = await supabase.from('questions').select('*').in('id', targetQuestionIds.slice(0, limit));
    if (error || !data || data.length === 0) {
      set({ isLoading: false });
      return;
    }
    const formattedQuestions = data.map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options)
    }));
    const selectedQuestions = shuffleArray(formattedQuestions);
    set({
      questions: selectedQuestions,
      currentIndex: 0,
      answers: {},
      markedForReview: [],
      revealedExplanations: {},
      timeLeft: 999 * 60,
      isStarted: true,
      isFinished: false,
      isReviewing: false,
      isLoading: false,
      domainResults: {},
      activeTab: 'treinamento'
    });
  },

  fetchHistory: async () => {
    const { data, error } = await supabase.from('exam_history').select('*').order('created_at', { ascending: true });
    if (!error && data) set({ history: data });
  },
  
  answerQuestion: (id, answer) => set((state) => ({ answers: { ...state.answers, [id]: answer } })),
  toggleMarkForReview: (id) => set((state) => ({ markedForReview: state.markedForReview.includes(id) ? state.markedForReview.filter(qId => qId !== id) : [...state.markedForReview, id] })),
  revealExplanation: (id) => set((state) => ({ revealedExplanations: { ...state.revealedExplanations, [id]: true } })),
  tickTimer: () => set((state) => ({ timeLeft: Math.max(state.timeLeft - 1, 0) })),
  startReview: () => set({ isReviewing: true, currentIndex: 0 }),
  stopReview: () => set({ isReviewing: false }),
  
  finishExam: async () => {
    const state = get();
    // Prevenção de duplicação: se já estiver finalizando ou finalizado, encerra imediatamente
    if (state.isSubmittingExam || state.isFinished) return;
    const totalQuestions = state.questions.length;
    if (totalQuestions === 0) return;
    
    set({ isSubmittingExam: true });

    try {
      let correctCount = 0;
      const domainStats: Record<string, DomainResult> = {};
      const incorrectIds: string[] = [];

      state.questions.forEach(q => { if (!domainStats[q.domain]) domainStats[q.domain] = { total: 0, correct: 0, percentage: 0 }; domainStats[q.domain].total += 1; });
      state.questions.forEach((q) => {
        if (state.answers[q.id as string] === q.correct_answer) { correctCount++; domainStats[q.domain].correct += 1; } 
        else { incorrectIds.push(q.id); }
      });

      Object.keys(domainStats).forEach(domain => { domainStats[domain].percentage = Math.round((domainStats[domain].correct / domainStats[domain].total) * 100); });
      const finalScore = Math.round(100 + (correctCount * (800 / totalQuestions)));
      const passed = finalScore >= 750;

      // 1. Inserção do histórico agregado com captura do ID gerado
      let historyEntryId: string | null = null;
      try {
        const { data: insertedHistory, error: historyError } = await supabase.from('exam_history').insert([{
          score: finalScore, correct_count: correctCount, total_questions: totalQuestions, passed: passed,
          exam_type: state.examType, domain_stats: domainStats, incorrect_questions: incorrectIds,
          cert_id: state.selectedCert?.id,
          user_id: state.user?.id
        }]).select('id').maybeSingle();

        if (!historyError && insertedHistory) {
          historyEntryId = insertedHistory.id;
        }
      } catch (err) {
        console.warn('Falha de rede ao persistir exam_history (modo offline preservado):', err);
      }

      // 2. Registro granular de tentativas individuais com domínio e vínculo relacional
      if (state.user) {
        const attempts = state.questions.map((q) => ({
          user_id: state.user?.id,
          question_id: q.id,
          cert_id: state.selectedCert?.id,
          domain: q.domain || null,
          exam_history_id: historyEntryId,
          selected_answer: state.answers[q.id] || '',
          is_correct: state.answers[q.id] === q.correct_answer,
          confidence_level: state.userFeedback[q.id] || null,
          created_at: new Date().toISOString()
        }));

        void (async () => {
          try {
            const { error } = await supabase.from('user_question_attempts').insert(attempts);
            if (error) {
              console.info('user_question_attempts ainda não migrado no banco ou indisponível:', error.message);
            }
          } catch (err: unknown) {
            console.warn('Tentativa granular falhou de forma não-bloqueante:', err);
          }
        })();
      }

      // 3. Atualiza estado local garantindo que a tela de resultado seja exibida
      set({ isFinished: true, isSubmittingExam: false, domainResults: domainStats });
      get().fetchHistory();
    } catch (criticalErr) {
      console.error('Erro ao finalizar prova:', criticalErr);
      set({ isFinished: true, isSubmittingExam: false });
    }
  },
  
  resetExam: () => set({ currentIndex: 0, answers: {}, markedForReview: [], revealedExplanations: {}, userFeedback: {}, isStarted: false, isFinished: false, isReviewing: false, isSubmittingExam: false, questions: [], activeTab: 'simulado' }),
  nextQuestion: () => set((state) => ({ currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1) })),
  prevQuestion: () => set((state) => ({ currentIndex: Math.max(state.currentIndex - 1, 0) }))
    }),
    {
      name: 'cybercert_exam_session_v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      })),
      partialize: (state) => ({
        selectedCert: state.selectedCert,
        activeTab: state.activeTab,
        examType: state.examType,
        questions: state.questions,
        currentIndex: state.currentIndex,
        answers: state.answers,
        markedForReview: state.markedForReview,
        revealedExplanations: state.revealedExplanations,
        userFeedback: state.userFeedback,
        timeLeft: state.timeLeft,
        isStarted: state.isStarted,
        isFinished: state.isFinished,
        isReviewing: state.isReviewing,
        domainResults: state.domainResults,
      }),
    }
  )
);