"use client";

import { useEffect, useState, useRef } from "react";
import { useExamStore } from "@/stores/examStore";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, Terminal, Clock, CheckCircle2, XCircle, ChevronRight, 
  ChevronLeft, Bookmark, Activity, History, BookOpen, Eye, 
  LayoutDashboard, Target, Search, BarChart3, Rocket, Skull, Calendar, AlertTriangle,
  Server, Lightbulb, Play, RotateCcw, Database, Crosshair, GraduationCap,
  ChevronLeftCircle, Flame, LogOut, MessageSquare, Send, Award, Trophy, Medal, Crown, Sparkles, Zap,
  Brain, Heart, Flag, Reply, Compass, TrendingUp, TrendingDown, HelpCircle, Printer,
  Gauge
} from "lucide-react";
import { 
  calculateReadiness, 
  calculateDomainPerformance, 
  calculateSkillPerformance,
  identifyWeakAreas, 
  generateStudyRecommendations, 
  analyzeRecurringErrors, 
  classifyQuestionForSpacedRepetition,
  LEARNING_THRESHOLDS 
} from "@/lib/learningEngine";
import type { ConfidenceFeedback } from "@/stores/examStore";

const CONFIDENCE_OPTIONS: { id: ConfidenceFeedback; label: string }[] = [
  { id: 'knew_concept', label: 'Eu sabia o conceito' },
  { id: 'had_doubt', label: 'Fiquei em dúvida' },
  { id: 'guessed', label: 'Chutei' },
  { id: 'confused', label: 'Confundi conceitos' },
  { id: 'interpretation_error', label: 'Errei por interpretação' },
  { id: 'did_not_know', label: 'Não sabia' },
];

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import PbqOperationsBoard from "@/components/pbq/PbqOperationsBoard";


const securityPlusPbqs = [
  {
    id: 'security-plus-pbq-03',
    cert_id: 'SY0-701',
    title: 'Resposta a Incidente: Ransomware',
    type: 'scenario-lab',
    description: 'Priorize as ações de contenção após detectar criptografia anômala em uma estação.',
    prompt: 'Qual é a primeira ação técnica recomendada?',
    options: ['Desligar todos os servidores', 'Isolar a estação comprometida da rede', 'Pagar o resgate', 'Apagar os logs do sistema'],
    correctOption: 1,
    explanation: 'O isolamento limita a propagação e preserva evidências para investigação e recuperação.'
  },
  {
    id: 'security-plus-pbq-04',
    cert_id: 'SY0-701',
    title: 'IAM: Acesso Privilegiado',
    type: 'scenario-lab',
    description: 'Configure a política de acesso para administradores seguindo o princípio do menor privilégio.',
    prompt: 'Qual controle reduz melhor o risco de abuso de credenciais administrativas?',
    options: ['Conta compartilhada com senha rotativa', 'Acesso permanente para toda a equipe', 'JIT com MFA e aprovação registrada', 'Desabilitar os registros de auditoria'],
    correctOption: 2,
    explanation: 'A elevação Just-in-Time com MFA, aprovação e auditoria reduz a janela de exposição.'
  },
  {
    id: 'security-plus-pbq-05',
    cert_id: 'SY0-701',
    title: 'Segurança de Rede: Segmentação',
    type: 'scenario-lab',
    description: 'Separe dispositivos IoT de sistemas corporativos sem interromper o monitoramento.',
    prompt: 'Qual arquitetura oferece o melhor isolamento?',
    options: ['Colocar tudo na mesma VLAN', 'Criar uma VLAN IoT com ACL restritiva', 'Liberar acesso lateral entre os dispositivos', 'Remover o firewall interno'],
    correctOption: 1,
    explanation: 'Uma VLAN dedicada com ACL permite somente os fluxos necessários e bloqueia movimento lateral.'
  },
  {
    id: 'security-plus-pbq-06',
    cert_id: 'SY0-701',
    title: 'Criptografia: Dados em Trânsito',
    type: 'scenario-lab',
    description: 'Proteja uma API que troca dados sensíveis entre filiais e serviços em nuvem.',
    prompt: 'Qual combinação atende melhor ao requisito?',
    options: ['HTTP e autenticação básica', 'TLS 1.2+ com certificados válidos', 'FTP em rede privada', 'Hash MD5 no corpo da requisição'],
    correctOption: 1,
    explanation: 'TLS moderno fornece confidencialidade, integridade e autenticação do endpoint.'
  },
  {
    id: 'security-plus-pbq-07',
    cert_id: 'SY0-701',
    title: 'Vulnerabilidades: Correção Prioritária',
    type: 'scenario-lab',
    description: 'Escolha a correção mais urgente para um servidor exposto à internet.',
    prompt: 'Qual vulnerabilidade deve receber prioridade máxima?',
    options: ['CVSS 9.8 explorável remotamente sem autenticação', 'Falha visual de baixo impacto', 'Atualização opcional de um editor local', 'Regra de nomenclatura em documentação'],
    correctOption: 0,
    explanation: 'Alta severidade combinada com exploração remota e ausência de autenticação indica risco crítico.'
  }
];

interface TooltipPayloadItem {
  payload: {
    date: string;
    score: number;
    passed: boolean;
  };
}

interface CustomLineTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomLineTooltip({ active, payload, label }: CustomLineTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs font-mono">
        <p className="text-zinc-400 mb-1">{label} <span className="text-zinc-600">({data.date})</span></p>
        <p className={`font-bold text-lg ${data.passed ? 'text-emerald-400' : 'text-red-400'}`}>Score: {data.score}</p>
      </div>
    );
  }
  return null;
}

export default function RootSecApp() {
  const {
    user, checkUser, signOut,
    activeTab, setActiveTab, examType, timeRange, setTimeRange,
    certifications, selectedCert, setSelectedCert, fetchCertifications, seedDatabase,
    pbqsList,
    questions, currentIndex, answers, markedForReview, revealedExplanations, timeLeft,
    userFeedback, recordFeedback,
    isStarted, isFinished, isReviewing, isLoading, history,
    questionComments, fetchComments, addComment, upvoteComment,
    pbqAclRules, setPbqAclRules, pbqSubmitted, pbqPassed, submitPbqAcl, resetPbqAcl,
    cliHistory, pbq2Answer, setPbq2Answer, pbq2Submitted, pbq2Passed, processCliCommand, submitPbq2,
    generateSimulado, generateTreinamento, generateRetaliacao, generateSpacedRepetitionSession, fetchHistory, answerQuestion, 
    toggleMarkForReview, revealExplanation, tickTimer, addQuestion,
    finishExam, startReview, stopReview, resetExam, nextQuestion, prevQuestion
  } = useExamStore();

  const isSuperAdmin = Boolean(
    user?.app_metadata?.role === 'admin' ||
    user?.app_metadata?.is_admin ||
    user?.user_metadata?.role === 'admin' ||
    user?.user_metadata?.is_admin ||
    user?.email?.toLowerCase() === 'admin@rootsec.io'
  );

  // Estados locais para a Autenticação
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Estado local para o Fórum
  const [commentInput, setCommentInput] = useState('');
  const [commentSort, setCommentSort] = useState<'recent' | 'useful'>('recent');
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const [reportedComments, setReportedComments] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Roteador dinâmico de domínios
  const getDomainsForCert = (code?: string) => {
    switch (code) {
      case 'SY0-701':
        return ['Conceitos gerais de segurança', 'Ameaças, vulnerabilidades e mitigações', 'Arquitetura de segurança', 'Operações de segurança', 'Gerenciamento e supervisão do programa de segurança'];
      case '200-301':
        return ['Network Fundamentals', 'Network Access', 'IP Connectivity', 'IP Services', 'Security Fundamentals', 'Automation and Programmability'];
      case 'NSE4':
        return ['FortiGate Deployment', 'Firewall and Authentication', 'Content Inspection', 'Routing and Layer 2 Switching', 'VPN'];
      default:
        return ['Domínio Padrão'];
    }
  };

  const domainsList = getDomainsForCert(selectedCert?.code);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [activePbqView, setActivePbqView] = useState<'list' | 'acl-lab' | 'cli-lab' | 'scenario-lab'>('list');
  const [selectedScenario, setSelectedScenario] = useState<(typeof securityPlusPbqs)[number] | null>(null);
  const [scenarioAnswer, setScenarioAnswer] = useState<number | null>(null);
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false);
  const [missionReady, setMissionReady] = useState(false);
  const [cliInput, setCliInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Estados dos Modais de Segurança e Filtro do Mapa da Prova
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [questionMapFilter, setQuestionMapFilter] = useState<'all' | 'unanswered' | 'marked'>('all');

  // Atalhos de Teclado Seguros para a Prova (A-D, ← / →)
  useEffect(() => {
    if (!isStarted || isFinished || showFinishModal || showExitModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT'
        )
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevQuestion();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextQuestion();
        return;
      }

      const currentQ = questions[currentIndex];
      if (!currentQ || !Array.isArray(currentQ.options)) return;
      const isRevealed = revealedExplanations[currentQ.id] || isReviewing;
      if (isRevealed) return;

      const upperKey = e.key.toUpperCase();
      const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      if (upperKey in optionMap) {
        const optionIndex = optionMap[upperKey];
        if (currentQ.options[optionIndex]) {
          e.preventDefault();
          answerQuestion(currentQ.id, currentQ.options[optionIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished, showFinishModal, showExitModal, currentIndex, questions, revealedExplanations, isReviewing, answerQuestion, prevQuestion, nextQuestion]);

  const [adminForm, setAdminForm] = useState({
    domain: '', difficulty: 'Medium', question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 'A', explanation: '', skills: ''
  });

  // Sincroniza domínios e formulário admin quando a certificação selecionada muda
  const [lastCertId, setLastCertId] = useState<string | undefined>(selectedCert?.id);
  if (selectedCert?.id !== lastCertId) {
    setLastCertId(selectedCert?.id);
    setSelectedDomains([]);
    if (selectedCert) {
      setAdminForm(prev => ({ ...prev, domain: getDomainsForCert(selectedCert.code)[0] }));
    }
  }

  // Sincroniza input de comentários ao mudar de questão
  const [lastQId, setLastQId] = useState<string | undefined>(questions[currentIndex]?.id);
  const currentQId = questions[currentIndex]?.id;
  if (currentQId !== lastQId) {
    setLastQId(currentQId);
    setCommentInput('');
  }

  useEffect(() => { 
    fetchCertifications();
    fetchHistory(); 
  }, [fetchCertifications, fetchHistory]);

  // Os comentários acompanham a questão atual durante o treino e a revisão.
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (currentQ && (examType === 'training' || isReviewing)) {
      fetchComments(currentQ.id);
    }
  }, [currentIndex, examType, isReviewing, questions, fetchComments]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isFinished && timeLeft > 0 && examType === 'official') {
      interval = setInterval(() => tickTimer(), 1000);
    } else if (timeLeft === 0 && isStarted && !isFinished && examType === 'official') {
      finishExam();
    }
    return () => clearInterval(interval);
  }, [isStarted, isFinished, timeLeft, tickTimer, finishExam, examType]);

  useEffect(() => {
    if (activePbqView === 'cli-lab') terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliHistory, activePbqView]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleDomain = (domain: string) => setSelectedDomains(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...pbqAclRules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRules.length) return;
    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;
    setPbqAclRules(newRules);
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    processCliCommand(cliInput);
    setCliInput('');
  };

  const openScenario = (scenario: (typeof securityPlusPbqs)[number]) => {
    setSelectedScenario(scenario);
    setScenarioAnswer(null);
    setScenarioSubmitted(false);
    setActivePbqView('scenario-lab');
  };

  const  handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: authName || 'Operador' } }
      });
      if (error) {
        setAuthError(error.message);
      } else {
        // Se cadastrou com sucesso sem confirmação, já loga automaticamente!
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (loginError) setAuthError(loginError.message);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentQ = questions[currentIndex];
    if (!currentQ || !commentInput.trim()) return;
    await addComment(currentQ.id, commentInput.trim());
    setCommentInput('');
  };

  const handleCommentLike = async (commentId: string, upvotes: number) => {
    if (likedComments.includes(commentId)) return;
    const succeeded = await upvoteComment(commentId, upvotes);
    if (succeeded) setLikedComments(prev => [...prev, commentId]);
  };

  const handleCommentReport = (commentId: string) => {
    setReportedComments(prev => prev.includes(commentId) ? prev : [...prev, commentId]);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.question_text || !adminForm.optionA || !adminForm.optionB || !adminForm.explanation) return;
    const optionsArray = [adminForm.optionA, adminForm.optionB, adminForm.optionC, adminForm.optionD].filter(Boolean);
    let correctText = '';
    if (adminForm.correct_answer === 'A') correctText = adminForm.optionA;
    if (adminForm.correct_answer === 'B') correctText = adminForm.optionB;
    if (adminForm.correct_answer === 'C') correctText = adminForm.optionC;
    if (adminForm.correct_answer === 'D') correctText = adminForm.optionD;

    const skillsArray = adminForm.skills ? adminForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    const success = await addQuestion({
      domain: adminForm.domain, difficulty: adminForm.difficulty as 'Low' | 'Medium' | 'High', question_text: adminForm.question_text,
      options: optionsArray, correct_answer: correctText, explanation: adminForm.explanation, skills: skillsArray
    });

    if (success) {
      setAdminForm({ ...adminForm, question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', explanation: '', skills: '' });
    }
  };

  // ==========================================
  // TELA DE AUTENTICAÇÃO (SE NÃO HOUVER USER)
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] font-mono text-zinc-300 relative overflow-hidden flex flex-col items-center justify-center px-4">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(8,145,178,0.08),transparent_70%)] pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur">
          <div className="flex flex-col items-center mb-8">
            <ShieldAlert className="w-12 h-12 text-cyan-500 mb-3 drop-shadow-[0_0_10px_rgba(8,145,178,0.5)]" />
            <h1 className="text-2xl font-black text-white tracking-wider">ROOT SEC <span className="text-cyan-500">ACADEMY</span></h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Autenticação de Acesso Restrito</p>
          </div>

          {authError && (
            <div className="bg-red-950/40 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-6">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500" placeholder="Yuri Vitor" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">E-mail Operacional</label>
              <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500" placeholder="analista@rootsec.io" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Senha de Acesso</label>
              <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={authLoading} className="w-full py-4 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-100 font-bold rounded-xl uppercase tracking-widest text-xs transition-all flex justify-center mt-2">
              {authLoading ? <Activity className="w-4 h-4 animate-spin" /> : (authMode === 'signin' ? 'Autenticar Sessão' : 'Cadastrar Operador')}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-800/80 pt-4">
            <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-xs text-zinc-500 hover:text-cyan-400 uppercase tracking-wider transition-colors">
              {authMode === 'signin' ? 'Não possui credenciais? Cadastre-se' : 'Já possui conta? Faça Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 1: VITRINE DE CERTIFICAÇÕES (LOBBY SAAS)
  // ==========================================
  if (!selectedCert) {
    return (
      <div className="min-h-screen bg-[#050505] font-mono text-zinc-300 relative overflow-hidden flex flex-col items-center pt-20 px-4">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(8,145,178,0.05),transparent_50%)] pointer-events-none"></div>
        
        <div className="absolute top-6 right-6 flex items-center gap-4">
          <span className="text-xs text-zinc-400 font-bold">{user.email}</span>
          <button onClick={signOut} className="p-2 bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-500/50 text-zinc-400 hover:text-red-400 rounded-lg transition-all" title="Encerrar Sessão">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-16 relative z-10">
          <ShieldAlert className="w-16 h-16 text-cyan-500 mb-6 drop-shadow-[0_0_15px_rgba(8,145,178,0.5)]" />
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">ROOT SEC <span className="text-cyan-500">ACADEMY</span></h1>
          <p className="text-sm md:text-base text-zinc-500 uppercase tracking-[0.3em] font-bold">Elite Cybersecurity Training</p>
        </div>

        <div className="w-full max-w-5xl relative z-10">
          <div className="flex items-center justify-between mb-8 border-b border-zinc-800/80 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3"><GraduationCap className="text-zinc-500" /> ESCOLHA SUA TRILHA DE CERTIFICAÇÃO</h2>
            {certifications.length === 0 && (
              <button onClick={seedDatabase} disabled={isLoading} className="px-4 py-2 bg-cyan-900/30 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-lg border border-cyan-800/50 hover:bg-cyan-800/50 transition-all flex items-center gap-2">
                {isLoading ? <Activity className="w-4 h-4 animate-spin"/> : <Database className="w-4 h-4" />} Instalar Cursos Base
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.length > 0 ? (
              certifications.map((cert) => {
                const themeMap: Record<string, string> = {
                  cyan: 'border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(8,145,178,0.2)] text-cyan-400 bg-cyan-950/10',
                  emerald: 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-400 bg-emerald-950/10',
                  orange: 'border-orange-500/50 hover:border-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] text-orange-400 bg-orange-950/10'
                };
                const colorClass = themeMap[cert.color_theme] || themeMap.cyan;

                return (
                  <div key={cert.id} onClick={() => setSelectedCert(cert)} className={`p-8 rounded-2xl border transition-all cursor-pointer group bg-zinc-950/80 backdrop-blur ${colorClass}`}>
                    <p className="text-xs uppercase tracking-widest font-bold mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{cert.vendors?.name}</p>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">{cert.code}</h3>
                    <p className="text-sm font-sans text-zinc-400 mb-8">{cert.name}</p>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                      Acessar Laboratório <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                Nenhuma certificação instalada. Clique em &quot;Instalar Cursos Base&quot; acima.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD DA CERTIFICAÇÃO SELECIONADA
  // ==========================================
  const currentHistory = history.filter(h => !h.cert_id || h.cert_id === selectedCert.id);
  const displayedPbqs = selectedCert.code === 'SY0-701'
    ? [...pbqsList, ...securityPlusPbqs.filter(scenario => !pbqsList.some(pbq => pbq.id === scenario.id))]
    : pbqsList;

  // LEARNING ENGINE ADAPTATIVO & TELEMETRIA COGNITIVA
  const readinessResult = calculateReadiness(currentHistory);
  const domainAnalyses = calculateDomainPerformance(currentHistory, domainsList);
  const weakAreasList = identifyWeakAreas(domainAnalyses);
  const recurringErrorsAnalysis = analyzeRecurringErrors(currentHistory, questions);
  const studyRecommendation = generateStudyRecommendations(domainAnalyses, weakAreasList, recurringErrorsAnalysis);
  const skillPerformanceList = calculateSkillPerformance(questions, currentHistory);

  // REPETIÇÃO ESPAÇADA & RETENÇÃO ATIVA
  const attemptedQuestionIds = Array.from(new Set(
    currentHistory.flatMap(h => {
      const ids: string[] = [];
      if (h.incorrect_questions && Array.isArray(h.incorrect_questions)) {
        ids.push(...h.incorrect_questions);
      }
      return ids;
    })
  ));

  const spacedReviewItems = attemptedQuestionIds.map(qId => 
    classifyQuestionForSpacedRepetition(qId, currentHistory, userFeedback[qId])
  );

  const hardReviewItems = spacedReviewItems.filter(s => s.status === 'hard');
  const scheduledReviewItems = spacedReviewItems.filter(s => s.status === 'review_needed');
  const masteredReviewItems = spacedReviewItems.filter(s => s.status === 'mastered');
  const dueForReviewQuestionIds = [...hardReviewItems, ...scheduledReviewItems].map(s => s.questionId);

  const handleStudyRecommendedTarget = (targetDomain: string) => {
    setSelectedDomains([targetDomain]);
    setActiveTab('treinamento');
  };

  const filterHistoryByTimeRange = (items: typeof currentHistory) => {
    const now = new Date().getTime();
    return items.filter(item => {
      const itemTime = new Date(item.created_at).getTime();
      const diffMs = now - itemTime; const diffHours = diffMs / (1000 * 60 * 60); const diffDays = diffHours / 24;
      switch (timeRange) {
        case '2h': return diffHours <= 2; case '12h': return diffHours <= 12; case '1d': return diffDays <= 1;
        case '2d': return diffDays <= 2; case '7d': return diffDays <= 7; case '15d': return diffDays <= 15;
        case '30d': return diffDays <= 30; case '3m': return diffDays <= 90; case '6m': return diffDays <= 180;
        case '12m': return diffDays <= 365; default: return true;
      }
    });
  };

  const historyOfficial = currentHistory.filter(h => h.exam_type !== 'training');
  const historyTraining = currentHistory.filter(h => h.exam_type === 'training');
  const filteredHistoryOfficial = filterHistoryByTimeRange(historyOfficial);
  const filteredHistoryTraining = filterHistoryByTimeRange(historyTraining);

  const chartData = filteredHistoryOfficial.map((item, index) => ({
    name: `Sim #${index + 1}`, score: item.score, date: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), passed: item.passed
  }));

  const totalAcertosTreino = filteredHistoryTraining.reduce((acc, curr) => acc + curr.correct_count, 0);
  const totalQuestoesTreino = filteredHistoryTraining.reduce((acc, curr) => acc + curr.total_questions, 0);
  const taxaAcertoTreino = totalQuestoesTreino > 0 ? Math.round((totalAcertosTreino / totalQuestoesTreino) * 100) : 0;
  const domainTrainingStats = domainsList.map((domain) => {
    const stats = filteredHistoryTraining.reduce((acc, item) => {
      const domainStat = item.domain_stats?.[domain];
      if (domainStat) {
        acc.total += domainStat.total;
        acc.correct += domainStat.correct;
      }
      return acc;
    }, { total: 0, correct: 0 });
    return { domain, ...stats, percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0 };
  });
  const bestDomain = [...domainTrainingStats].filter(item => item.total > 0).sort((a, b) => b.percentage - a.percentage)[0];
  const focusDomain = [...domainTrainingStats].filter(item => item.total > 0).sort((a, b) => a.percentage - b.percentage)[0];
  const xpTreino = (totalQuestoesTreino * 10) + (totalAcertosTreino * 15);
  const nivelTreino = Math.floor(totalQuestoesTreino / 25) + 1;
  const nivelProgress = totalQuestoesTreino % 25;
  const metaAtual = nivelTreino * 25;
  const progressoMeta = Math.min(100, Math.round((nivelProgress / 25) * 100));
  const questoesRestantes = Math.max(0, metaAtual - totalQuestoesTreino);
  const metasQuestoes = [10, 25, 50, 100].map((meta) => ({
    meta,
    concluida: totalQuestoesTreino >= meta,
    progresso: Math.min(100, Math.round((totalQuestoesTreino / meta) * 100))
  }));
  const studyDays = new Set(historyTraining.map(item => new Date(item.created_at).toLocaleDateString('en-CA')));
  let streakAtual = 0;
  const streakDate = new Date();
  while (studyDays.has(streakDate.toLocaleDateString('en-CA'))) {
    streakAtual++;
    streakDate.setDate(streakDate.getDate() - 1);
  }
  const desafioHojeConcluido = historyTraining.some(item => new Date(item.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA') && item.total_questions === 5);

  const uniqueIncorrectIds = new Set<string>();
  currentHistory.forEach(h => {
    if (h.incorrect_questions && Array.isArray(h.incorrect_questions)) {
      h.incorrect_questions.forEach(id => uniqueIncorrectIds.add(id));
    }
  });
  const totalErrosHistorico = uniqueIncorrectIds.size;
  const chartFallbackData = [
    { name: 'Sem dados', score: 0, date: 'Aguardando provas', passed: false },
    { name: 'Sem dados', score: 150, date: 'Aguardando provas', passed: false },
    { name: 'Sem dados', score: 300, date: 'Aguardando provas', passed: false },
    { name: 'Sem dados', score: 450, date: 'Aguardando provas', passed: false },
    { name: 'Sem dados', score: 600, date: 'Aguardando provas', passed: false },
  ];
  const displayChartData = filteredHistoryOfficial.length > 0 ? chartData : chartFallbackData;
  const achievementList = [
    { title: 'Troféu de Bronze', detail: '100 questões resolvidas', icon: Medal, active: totalQuestoesTreino >= 100, tone: 'text-orange-300' },
    { title: 'Troféu de Prata', detail: '250 questões resolvidas', icon: Medal, active: totalQuestoesTreino >= 250, tone: 'text-slate-300' },
    { title: 'Troféu de Ouro', detail: '400 questões resolvidas', icon: Trophy, active: totalQuestoesTreino >= 400, tone: 'text-amber-300' },
    { title: 'Troféu de Platina', detail: '1.000 questões resolvidas', icon: Crown, active: totalQuestoesTreino >= 1000, tone: 'text-cyan-200' },
    { title: 'Tu é bom', detail: '50 questões resolvidas', icon: Award, active: totalQuestoesTreino >= 50, tone: 'text-cyan-300' },
    { title: 'Crânio', detail: '100 questões resolvidas', icon: Skull, active: totalQuestoesTreino >= 100, tone: 'text-purple-300' },
    { title: 'Mente Incansável', detail: '300 questões resolvidas', icon: Brain, active: totalQuestoesTreino >= 300, tone: 'text-rose-300' },
    { title: 'Foco Absoluto', detail: '1.000 questões resolvidas', icon: Crosshair, active: totalQuestoesTreino >= 1000, tone: 'text-emerald-300' },
  ];

  // ==========================================
  // TELA DE PROVA / REVISÃO REDESENHADA (FOCO COGNITIVO + ERGONOMIA)
  // ==========================================
  if (isStarted && (!isFinished || isReviewing)) {
    const currentQ = questions[currentIndex];
    if (!currentQ) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono">Carregando questão...</div>;

    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;
    const markedCount = markedForReview.length;
    const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const isCriticalTime = timeLeft <= 5 * 60;
    const isWarningTime = timeLeft <= 15 * 60 && !isCriticalTime;

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    const visibleComments = [...questionComments].sort((a, b) => commentSort === 'useful'
      ? (b.upvotes || 0) - (a.upvotes || 0)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans p-4 md:p-6 flex flex-col gap-6">
        
        {/* 1. HEADER COMPACTO DA PROVA (PROGRESSO + CONTEXTO) */}
        <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 md:px-6 md:py-3.5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              {isReviewing ? <Search className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs uppercase tracking-widest text-white">
                  {isReviewing ? 'REVISÃO (POST-MORTEM)' : (examType === 'official' ? 'SIMULADO OFICIAL' : 'TREINAMENTO TÁTICO')}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="font-mono text-xs text-cyan-400 font-bold">{selectedCert.code}</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                QUESTÃO {currentIndex + 1} DE {totalQuestions}
              </p>
            </div>
          </div>

          {/* Barra de Progresso Discreta */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono font-bold text-zinc-300">
                {answeredCount} / {totalQuestions} RESPONDIDAS
              </span>
              <div className="w-36 sm:w-48 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Botão Sair com confirmação segura */}
            {!isReviewing && (
              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors uppercase tracking-wider"
              >
                Sair
              </button>
            )}
          </div>
        </div>

        {/* 2. CORPO DA PROVA: ÁREA PRINCIPAL (70%) + PAINEL LATERAL (30%) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* COLUNA ESQUERDA: ÁREA DA QUESTÃO E NAVEGAÇÃO (LG:W-8/12 OU FLEX-1) */}
          <div className="flex-1 w-full space-y-6">
            
            {/* CARD DA QUESTÃO */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-6 md:p-8 shadow-2xl relative">
              
              {/* Identificador e Domínio */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-black font-mono text-cyan-400">
                    Q-{String(currentIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    {currentQ.domain}
                  </span>
                </div>

                {currentQ.skills && currentQ.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Enunciado */}
              <div className="text-base md:text-lg text-zinc-100 font-sans leading-relaxed mb-8 max-w-4xl">
                {currentQ.question_text}
              </div>

              {/* Opções de Resposta Canônicas (A, B, C, D) */}
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  const isRevealed = revealedExplanations[currentQ.id] || isReviewing;
                  const isCorrectOption = opt === currentQ.correct_answer;
                  const letter = optionLetters[idx] || String(idx + 1);

                  let containerStyle = isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/30'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40';

                  let letterBadgeStyle = isSelected
                    ? 'bg-cyan-500 text-zinc-950 font-black border-cyan-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:text-zinc-200 group-hover:border-zinc-700';

                  if (isRevealed) {
                    if (isCorrectOption) {
                      containerStyle = 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50';
                      letterBadgeStyle = 'bg-emerald-500 text-zinc-950 font-black border-emerald-400';
                    } else if (isSelected && !isCorrectOption) {
                      containerStyle = 'bg-red-950/40 border-red-500/50 opacity-70';
                      letterBadgeStyle = 'bg-red-500 text-white font-black border-red-400';
                    } else {
                      containerStyle = 'bg-zinc-950 border-zinc-900 opacity-40';
                      letterBadgeStyle = 'bg-zinc-900 text-zinc-600 border-zinc-900';
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => !isRevealed && answerQuestion(currentQ.id, opt)}
                      className={`p-4 md:p-4.5 rounded-xl border ${!isRevealed ? 'cursor-pointer' : ''} transition-all group ${containerStyle}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs shrink-0 transition-colors ${letterBadgeStyle}`}>
                          {letter}
                        </div>
                        <span className={`text-sm md:text-base leading-relaxed font-sans pt-0.5 ${isSelected || (isRevealed && isCorrectOption) ? 'text-white font-medium' : 'text-zinc-300'}`}>
                          {opt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SEÇÃO DE GABARITO & EXPLICAÇÃO (APENAS TREINAMENTO OU REVISÃO) */}
              {(examType === 'training' || isReviewing) && (
                <div className="mt-8 border-t border-zinc-800/80 pt-6">
                  {!revealedExplanations[currentQ.id] && !isReviewing ? (
                    <button
                      onClick={() => revealExplanation(currentQ.id)}
                      disabled={!answers[currentQ.id]}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl transition-all disabled:opacity-30 text-xs font-mono uppercase tracking-wider"
                    >
                      <Eye className="w-4 h-4" /> Revelar Gabarito e Explicação
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Análise de Erro / Resultado */}
                      {(() => {
                        const userChoice = answers[currentQ.id];
                        const isCorrect = userChoice === currentQ.correct_answer;
                        return (
                          <div className="space-y-4">
                            <div className={`p-4 rounded-xl border flex items-center justify-between ${isCorrect ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' : 'bg-red-950/30 border-red-500/50 text-red-400'}`}>
                              <div className="flex items-center gap-3">
                                {isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-red-400" />}
                                <div>
                                  <p className="text-xs uppercase tracking-wider font-mono font-bold">
                                    {isCorrect ? 'RESULTADO: CORRETO' : 'RESULTADO: INCORRETO'}
                                  </p>
                                  <p className="text-xs font-sans text-zinc-300 mt-1">
                                    Sua escolha: <span className="font-mono font-bold text-white">{userChoice || 'Não respondida'}</span> | Oficial: <span className="font-mono font-bold text-white">{currentQ.correct_answer}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Pergunta de Feedback Cognitivo Opcional */}
                            <div className="bg-zinc-950/90 border border-zinc-800 p-4 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                                  Como você chegou nessa resposta? <span className="text-zinc-600 font-normal font-sans">(Opcional // calibra a telemetria)</span>
                                </p>
                                {userFeedback[currentQ.id] && (
                                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
                                    Feedback: {CONFIDENCE_OPTIONS.find(o => o.id === userFeedback[currentQ.id])?.label || userFeedback[currentQ.id]}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {CONFIDENCE_OPTIONS.map((opt) => {
                                  const isSelectedFeedback = userFeedback[currentQ.id] === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => recordFeedback(currentQ.id, opt.id)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all border ${
                                        isSelectedFeedback 
                                          ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(8,145,178,0.2)]' 
                                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Explicação Técnica */}
                            <div className="bg-zinc-900/50 border border-emerald-900/50 p-5 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-emerald-400 font-bold tracking-wider uppercase text-xs font-mono">
                                  Explicação Técnica Oficial:
                                </h4>
                              </div>
                              <p className="text-zinc-300 font-sans text-sm leading-relaxed">
                                {currentQ.explanation || "Sem explicação técnica cadastrada para esta questão."}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Fórum de debates */}
                  <div className="mt-6 bg-zinc-900/30 border border-cyan-900/40 p-6 rounded-xl">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-500" />
                        <h4 className="text-white font-bold tracking-wider uppercase text-sm font-mono">Debates da comunidade</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={commentSort} onChange={e => setCommentSort(e.target.value as 'recent' | 'useful')} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 outline-none font-mono">
                          <option value="recent">Recentes</option>
                          <option value="useful">Mais úteis</option>
                        </select>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">{questionComments.length} comentário(s)</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                      {questionComments.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic font-sans">Nenhum comentário nesta questão. Compartilhe seu raciocínio com a comunidade.</p>
                      ) : visibleComments.map((c) => (
                        <div key={c.id} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-lg text-xs font-sans">
                          <div className="flex justify-between items-center mb-1 gap-3">
                            <span className="font-bold text-cyan-400 font-mono">{c.profiles?.full_name || 'Operador Anônimo'}</span>
                            <span className="text-[10px] text-zinc-600 font-mono">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-zinc-300 whitespace-pre-wrap">{c.content}</p>
                          <div className="mt-3 flex items-center gap-3 border-t border-zinc-900 pt-2 font-mono">
                            <button type="button" onClick={() => handleCommentLike(c.id, c.upvotes || 0)} disabled={likedComments.includes(c.id)} className={`flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors ${likedComments.includes(c.id) ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'}`}>
                              <Heart className={`h-3.5 w-3.5 ${likedComments.includes(c.id) ? 'fill-current' : ''}`} /> {c.upvotes || 0}
                            </button>
                            <button type="button" onClick={() => setCommentInput(`@${c.profiles?.full_name || 'Operador'} `)} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-cyan-400">
                              <Reply className="h-3.5 w-3.5" /> Responder
                            </button>
                            <button type="button" onClick={() => handleCommentReport(c.id)} disabled={reportedComments.includes(c.id)} className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-600 hover:text-amber-400 disabled:text-amber-500/60">
                              <Flag className="h-3.5 w-3.5" /> {reportedComments.includes(c.id) ? 'Denunciado' : 'Denunciar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                      <input required type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Adicionar macete, dúvida ou raciocínio..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-cyan-500 font-sans" />
                      <button type="submit" disabled={!commentInput.trim()} className="px-4 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-100 rounded-lg transition-all flex items-center justify-center disabled:opacity-30">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* CONTROLES INFERIORES: MARCAR REVISÃO + ATALHOS + NAVEGAÇÃO */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-zinc-800/80">
                
                {/* Marcar para Revisão */}
                <button
                  type="button"
                  onClick={() => !isReviewing && toggleMarkForReview(currentQ.id)}
                  disabled={isReviewing}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                    markedForReview.includes(currentQ.id)
                      ? 'bg-amber-950/60 border-amber-600/70 text-amber-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  } ${isReviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${markedForReview.includes(currentQ.id) ? 'fill-current' : ''}`} />
                  <span>{markedForReview.includes(currentQ.id) ? 'Marcada para Revisão' : 'Marcar para Revisão'}</span>
                </button>

                {/* Dica de Atalhos (Desktop) */}
                <span className="hidden md:block text-[11px] font-mono text-zinc-500 text-center">
                  A–D para responder · ← → para navegar
                </span>

                {/* Botões Anterior / Próxima */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextQuestion}
                    disabled={currentIndex === totalQuestions - 1}
                    className="px-6 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-950/50 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* COLUNA DIREITA: PAINEL LATERAL (TIMER + MAPA + ENTREGAR) */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            
            {/* CARD DO CRONÔMETRO TÁTICO */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 text-center shadow-xl">
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                {isReviewing ? 'Tempo Final' : 'Tempo Restante'}
              </p>
              <div className={`text-3xl font-black font-mono tracking-tight flex items-center justify-center gap-2.5 ${
                isReviewing
                  ? 'text-zinc-500'
                  : isCriticalTime
                  ? 'text-red-400'
                  : isWarningTime
                  ? 'text-amber-400'
                  : 'text-cyan-400'
              }`}>
                <Clock className="w-5 h-5 opacity-70" />
                <span>{examType === 'official' && !isReviewing ? formatTime(timeLeft) : '--:--'}</span>
              </div>
            </div>

            {/* MAPA DE QUESTÕES COM FILTROS */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                  Questões
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>

              {/* Filtros da grade */}
              <div className="grid grid-cols-3 gap-1 mb-3 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setQuestionMapFilter('all')}
                  className={`py-1 text-[10px] font-mono uppercase rounded transition-all ${
                    questionMapFilter === 'all'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todas ({totalQuestions})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionMapFilter('unanswered')}
                  className={`py-1 text-[10px] font-mono uppercase rounded transition-all ${
                    questionMapFilter === 'unanswered'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Branco ({unansweredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionMapFilter('marked')}
                  className={`py-1 text-[10px] font-mono uppercase rounded transition-all ${
                    questionMapFilter === 'marked'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Marcadas ({markedCount})
                </button>
              </div>

              {/* Grade de botões com rolagem customizada */}
              <div className="grid grid-cols-5 gap-1.5 overflow-y-auto max-h-[42vh] pr-1.5 custom-scrollbar">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isMarked = markedForReview.includes(q.id);
                  const isCurrent = currentIndex === idx;

                  // Filtragem ativa
                  if (questionMapFilter === 'unanswered' && isAnswered) return null;
                  if (questionMapFilter === 'marked' && !isMarked) return null;

                  let btnStyle = 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300';
                  if (isReviewing || revealedExplanations[q.id]) {
                    btnStyle = answers[q.id] === q.correct_answer
                      ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                      : 'bg-red-950/50 border-red-700/60 text-red-300';
                  } else if (isAnswered && isMarked) {
                    btnStyle = 'bg-amber-950/50 border-amber-600/70 text-amber-300 font-bold';
                  } else if (isMarked) {
                    btnStyle = 'bg-amber-950/30 border-amber-600/50 text-amber-400';
                  } else if (isAnswered) {
                    btnStyle = 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300 font-medium';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => useExamStore.setState({ currentIndex: idx })}
                      className={`h-9 text-xs font-mono rounded-lg border transition-all flex items-center justify-center relative ${btnStyle} ${
                        isCurrent ? 'ring-2 ring-white font-bold text-white scale-105 z-10' : ''
                      }`}
                      title={`Questão ${idx + 1}${isMarked ? ' (Marcada para revisão)' : ''}${isAnswered ? ' (Respondida)' : ''}`}
                    >
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                      {isAnswered && !isMarked && (
                        <span className="absolute bottom-0.5 right-0.5 text-[8px] leading-none text-cyan-400">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legenda compacta */}
              <div className="mt-3 pt-3 border-t border-zinc-800/70 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-zinc-800 border border-zinc-700 inline-block" />
                  <span>Não respondida</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-cyan-950 border border-cyan-800 inline-block" />
                  <span className="text-cyan-400">● Respondida</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-950 border border-amber-600 inline-block" />
                  <span className="text-amber-400">🔖 Revisão</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded border-2 border-white inline-block" />
                  <span className="text-zinc-300">◎ Atual</span>
                </span>
              </div>
            </div>

            {/* BOTÃO FINALIZAR / ENTREGAR SIMULADO */}
            {isReviewing ? (
              <button
                type="button"
                onClick={stopReview}
                className="w-full py-4 font-mono font-bold rounded-xl transition-all text-xs tracking-wider uppercase bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white shadow-lg"
              >
                Voltar ao Resultado
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowFinishModal(true)}
                className="w-full py-4 font-mono font-bold rounded-xl transition-all text-xs tracking-wider uppercase bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white shadow-lg"
              >
                {examType === 'official' ? 'Entregar Simulado' : 'Finalizar Treinamento'}
              </button>
            )}

          </div>

        </div>

        {/* MODAL DE ENTREGA SEGURO */}
        {showFinishModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                    {examType === 'official' ? 'Entregar Simulado?' : 'Finalizar Treinamento?'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    Revise seu status antes da submissão final.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-300">
                  <span>Total de questões:</span>
                  <span className="font-bold text-white">{totalQuestions}</span>
                </div>
                <div className="flex justify-between text-cyan-400">
                  <span>Respondidas:</span>
                  <span className="font-bold">{answeredCount}</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex justify-between text-amber-400 pt-1 border-t border-zinc-800/60">
                    <span>Não respondidas:</span>
                    <span className="font-bold">{unansweredCount}</span>
                  </div>
                )}
                {markedCount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Marcadas para revisão:</span>
                    <span className="font-bold">{markedCount}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                {unansweredCount > 0
                  ? `Você ainda possui ${unansweredCount} questão(ões) não respondida(s). Ao confirmar, o simulado será encerrado e computado.`
                  : 'Todas as questões foram respondidas. Ao confirmar, o simulado será encerrado e o relatório de desempenho será gerado.'}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Continuar Prova
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinishModal(false);
                    finishExam();
                  }}
                  className="flex-1 py-3 rounded-xl border border-cyan-500/40 bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold text-white shadow-lg transition-colors"
                >
                  Confirmar e Finalizar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE SAIR SEGURO */}
        {showExitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                    Sair do Simulado?
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    Confirmação de cancelamento da sessão
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Se você sair agora, sua tentativa atual não será finalizada nem submetida para cálculo de pontuação oficial.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Continuar Prova
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    resetExam();
                  }}
                  className="flex-1 py-3 rounded-xl border border-red-900/60 bg-red-950/80 hover:bg-red-900 text-xs font-mono font-bold text-red-200 transition-colors"
                >
                  Sair para o Menu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // TELA DE RESULTADO PÓS-PROVA
  // ==========================================
  if (isFinished && !isReviewing) {
    const totalQuestions = questions.length;
    let correctCount = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_answer) correctCount++; });
    const finalScore = Math.round(100 + (correctCount * (800 / totalQuestions)));
    const passed = finalScore >= 750;

    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6 font-mono text-zinc-300 flex flex-col items-center justify-center overflow-y-auto py-12">
        <div className="max-w-4xl w-full bg-zinc-950/80 backdrop-blur border border-zinc-800/80 p-8 rounded-2xl shadow-2xl">
          <div className="text-center border-b border-zinc-800/80 pb-8 mb-8">
            {passed ? <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" /> : <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />}
            <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">{examType === 'official' ? (passed ? "CERTIFICAÇÃO ALCANÇADA" : "FALHA NA AVALIAÇÃO") : "TREINAMENTO TÁTICO FINALIZADO"}</h1>
            <p className="text-6xl font-black mt-4 mb-2 text-white">{correctCount} <span className="text-2xl text-zinc-600">/ {totalQuestions} Acertos</span></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button onClick={startReview} className="flex-1 py-4 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 text-purple-400 font-bold rounded-xl flex items-center justify-center gap-2 uppercase text-sm"><Search className="w-4 h-4"/> Revisar Respostas</button>
            <button onClick={resetExam} className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 uppercase text-sm"><LayoutDashboard className="w-4 h-4"/> Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA BASE DO SaaS (DASHBOARD + SIDEBAR)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-mono text-zinc-300 overflow-hidden">
      
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col relative z-10 no-print">
        <div className="p-6 border-b border-zinc-800 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-cyan-500 drop-shadow-[0_0_10px_rgba(8,145,178,0.5)]" />
            <div>
              <h2 className="font-bold text-white tracking-widest leading-tight">ROOT SEC</h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Academy</p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6 space-y-2">
          <button onClick={() => setSelectedCert(null)} className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl hover:bg-zinc-800 transition-all text-left group">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Módulo Ativo</p>
              <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{selectedCert.code}</p>
            </div>
            <ChevronLeftCircle className="w-5 h-5 text-zinc-600 group-hover:text-cyan-400" />
          </button>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
            <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
          </button>
        </div>

        <nav className="space-y-2 flex-1 px-6">
          <button onClick={() => setActiveTab('intelligence')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase font-bold ${activeTab === 'intelligence' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}>
            <Brain className="w-4 h-4 text-cyan-400" /> Learning Intelligence
          </button>
          <button onClick={() => setActiveTab('simulado')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase ${activeTab === 'simulado' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}><Terminal className="w-4 h-4" /> Operação Real</button>
          <button onClick={() => setActiveTab('treinamento')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase ${activeTab === 'treinamento' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}><BookOpen className="w-4 h-4" /> Estudo Tático</button>
          <button onClick={() => setActiveTab('pbqs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase ${activeTab === 'pbqs' ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}><Server className="w-4 h-4" /> Simuladores (PBQ)</button>
          <button onClick={() => setActiveTab('historico')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase ${activeTab === 'historico' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent mt-4'}`}><History className="w-4 h-4" /> Histórico (Oficial)</button>
          <button onClick={() => setActiveTab('metrics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase ${activeTab === 'metrics' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}><BarChart3 className="w-4 h-4" /> Métricas (Treino)</button>
          
          {isSuperAdmin && (
            <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all tracking-widest uppercase mt-8 border-t border-zinc-800 pt-4 ${activeTab === 'admin' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}>
              <Database className="w-4 h-4" /> Admin (Inserir Q.)
            </button>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(8,145,178,0.05),rgba(255,255,255,0))] relative">

        {/* ABA: LEARNING INTELLIGENCE (MOTOR ADAPTATIVO) */}
        {activeTab === 'intelligence' && (
          <div className="max-w-5xl space-y-8 animate-in fade-in duration-300">
            {/* Cabeçalho Formal para Impressão / Exportação PDF */}
            <div className="hidden print:block mb-8 border-b-2 border-cyan-500 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-white">ROOT SEC ACADEMY</h1>
                  <p className="text-xs text-cyan-400 uppercase tracking-widest font-mono">
                    Relatório Corporativo de Prontidão Técnica & Aprendizagem Adaptativa
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-zinc-400 space-y-0.5">
                  <p><strong className="text-zinc-200">Operador:</strong> {user?.email}</p>
                  <p><strong className="text-zinc-200">Certificação:</strong> {selectedCert.code} ({selectedCert.name})</p>
                  <p><strong className="text-zinc-200">Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            </div>

            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-zinc-950 p-6 md:p-8 shadow-[0_0_50px_rgba(8,145,178,0.15)]">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">
                    <Brain className="h-4 w-4 animate-pulse" />
                    Adaptive Learning Engine // {selectedCert.code}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                    LEARNING <span className="text-cyan-400">INTELLIGENCE</span>
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400 max-w-2xl font-sans leading-relaxed">
                    Diagnóstico cognitivo contínuo, prontidão para o exame oficial, mapeamento de lacunas e recomendação preditiva de estudo.
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Módulo Analítico</span>
                    <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-full">
                      {selectedCert.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="no-print px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md"
                    title="Exportar Relatório em PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    Exportar Relatório (PDF)
                  </button>
                </div>
              </div>
            </div>

            {/* Linha 1: Readiness Score & Próximo Alvo Recomendado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Certification Readiness (2 colunas) */}
              <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1">
                      Nível de Prontidão
                    </p>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-cyan-400" />
                      Certification Readiness
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {readinessResult.isProvisional && readinessResult.state !== 'insufficient_data' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/70 border border-amber-500/50 text-amber-300">
                        {4 - readinessResult.pendingDimensionsCount}/4 Dimensões
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      readinessResult.state === 'high_consistency' ? 'bg-purple-950/60 border-purple-500/50 text-purple-300' :
                      readinessResult.state === 'advanced' ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' :
                      readinessResult.state === 'developing' ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' :
                      readinessResult.state === 'initial' ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' :
                      readinessResult.state === 'provisional' ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' :
                      'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}>
                      {readinessResult.stateLabel}
                    </span>
                  </div>
                </div>

                {readinessResult.state === 'insufficient_data' ? (
                  <div className="py-6 text-center">
                    <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-xl font-bold text-zinc-300 uppercase tracking-widest font-mono">
                      Dados Insuficientes
                    </p>
                    <p className="text-xs text-zinc-500 font-sans mt-2 max-w-md mx-auto leading-relaxed">
                      Mínimo de {LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_INITIAL} questões respondidas para calibrar o índice. Complete sessões de simulado ou estudo tático.
                    </p>
                    <p className="text-[11px] text-cyan-400/80 font-mono mt-3">
                      Amostra atual: {readinessResult.totalEvaluatedQuestions} / {LEARNING_THRESHOLDS.MIN_QUESTIONS_READINESS_INITIAL} questões
                    </p>
                  </div>
                ) : readinessResult.isProvisional ? (
                  <div>
                    {/* Bloco de Índice Provisório - Sem score consolidado enganoso */}
                    <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-2xl font-black text-amber-300 uppercase tracking-tight">
                          Índice Provisório
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          Calibração em Andamento
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Métricas apresentadas apenas para as dimensões com amostragem real validada. O Readiness Score definitivo requer dados nas 4 dimensões (Performance, Retenção, Consistência e Condições de Exame).
                      </p>
                    </div>

                    {/* 4 Dimensões com status explícito */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-900">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Performance</span>
                          <span className={`font-bold ${readinessResult.dimensions.performance.score !== null ? 'text-white' : 'text-amber-400/80 text-[11px]'}`}>
                            {readinessResult.dimensions.performance.score !== null ? `${readinessResult.dimensions.performance.score}%` : 'Dados insuficientes'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.performance.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.performance.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Retenção</span>
                          <span className={`font-bold ${readinessResult.dimensions.retention.score !== null ? 'text-white' : 'text-amber-400/80 text-[11px]'}`}>
                            {readinessResult.dimensions.retention.score !== null ? `${readinessResult.dimensions.retention.score}%` : 'Dados insuficientes'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.retention.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.retention.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Consistência</span>
                          <span className={`font-bold ${readinessResult.dimensions.consistency.score !== null ? 'text-white' : 'text-amber-400/80 text-[11px]'}`}>
                            {readinessResult.dimensions.consistency.score !== null ? `${readinessResult.dimensions.consistency.score}%` : 'Dados insuficientes'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.consistency.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.consistency.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Condições de Exame</span>
                          <span className={`font-bold ${readinessResult.dimensions.application.score !== null ? 'text-white' : 'text-amber-400/80 text-[11px]'}`}>
                            {readinessResult.dimensions.application.score !== null ? `${readinessResult.dimensions.application.score}%` : 'Dados insuficientes'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.application.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.application.description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-4 mb-6">
                      <span className="font-mono text-6xl font-black text-white tracking-tighter">
                        {readinessResult.overallPercentage}%
                      </span>
                      <p className="text-xs text-zinc-400 font-sans max-w-sm leading-relaxed">
                        Readiness Score consolidado baseado nas 4 dimensões pedagógicas completas.
                        <span className="text-zinc-500 block mt-1 font-mono text-[10px]">
                          *Avaliação diagnóstica contínua; não constitui garantia de aprovação no exame oficial.
                        </span>
                      </p>
                    </div>

                    {/* 4 Dimensões */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-900">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Performance</span>
                          <span className="font-bold text-white">{readinessResult.dimensions.performance.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.performance.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.performance.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Retenção</span>
                          <span className="font-bold text-white">{readinessResult.dimensions.retention.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.retention.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.retention.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Consistência</span>
                          <span className="font-bold text-white">{readinessResult.dimensions.consistency.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.consistency.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.consistency.description}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-zinc-400">Condições de Exame</span>
                          <span className="font-bold text-white">{readinessResult.dimensions.application.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${readinessResult.dimensions.application.score ?? 0}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-tight">{readinessResult.dimensions.application.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-zinc-500">
                  <span>Amostra: {readinessResult.totalEvaluatedQuestions} questões avaliadas</span>
                  <span className="italic">*Métrica formativa interna para autogestão de aprendizado</span>
                </div>
              </div>

              {/* Card 2: Próximo Alvo Recomendado (1 coluna) */}
              <div className="bg-zinc-950 border border-cyan-900/40 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      Próximo Alvo
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      studyRecommendation.priority === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      studyRecommendation.priority === 'medium' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {studyRecommendation.priority === 'high' ? 'Prioridade Alta' :
                       studyRecommendation.priority === 'medium' ? 'Recomendado' : 'Manutenção'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight mb-2">
                    {studyRecommendation.targetDomain}
                  </h3>

                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 mb-4">
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                      <strong className="text-cyan-400">Diagnóstico:</strong> {studyRecommendation.reason}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStudyRecommendedTarget(studyRecommendation.targetDomain)}
                  className="w-full py-3.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-600/50 text-cyan-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                >
                  <Rocket className="w-4 h-4" />
                  Estudar Agora (15 Q.)
                </button>
              </div>
            </div>

            {/* Linha 2: Modo Retaliação 2.0 & Erros Recorrentes */}
            <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl shrink-0">
                  <Flame className="w-7 h-7 text-red-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      Modo Retaliação 2.0 // Anti-Vício
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800">
                      {recurringErrorsAnalysis.recurringErrorCount} Falhas Recorrentes
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-2xl">
                    {recurringErrorsAnalysis.recurringErrorCount > 0 
                      ? `O sistema detectou ${recurringErrorsAnalysis.recurringErrorCount} questão(ões) com falhas reincidentes (2+ erros). O Retaliação 2.0 prioriza esses conceitos até a retenção total.` 
                      : `Você possui ${totalErrosHistorico} questão(ões) únicas erradas. O algoritmo monitora reincidências para erradicar falhas persistentes antes do exame.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => generateRetaliacao(30)}
                disabled={isLoading || totalErrosHistorico === 0}
                className="w-full md:w-auto px-6 py-3.5 bg-red-950/60 hover:bg-red-900/70 border border-red-700/60 text-red-300 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all disabled:opacity-40 shrink-0"
              >
                <Crosshair className="w-4 h-4" />
                Iniciar Retaliação ({totalErrosHistorico})
              </button>
            </div>

            {/* Linha 2.5: Repetição Espaçada & Retenção Ativa */}
            <div className="bg-purple-950/20 border border-purple-900/40 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-950/60 border border-purple-800/50 rounded-xl shrink-0">
                  <RotateCcw className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      Repetição Espaçada // Curva de Esquecimento
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                      {dueForReviewQuestionIds.length} Itens em Fila
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-2xl mb-2">
                    Algoritmo de intervalos graduais (24h / 3d / 7d) para retenção de longo prazo. Questões com erros anteriores ou chutes são automaticamente priorizadas para consolidação de memória.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-red-400">● {hardReviewItems.length} Reforço 24h</span>
                    <span className="text-amber-400">● {scheduledReviewItems.length} Revisão 3d</span>
                    <span className="text-emerald-400">● {masteredReviewItems.length} Dominadas (7d+)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => generateSpacedRepetitionSession(dueForReviewQuestionIds, 20)}
                disabled={isLoading || dueForReviewQuestionIds.length === 0}
                className="w-full md:w-auto px-6 py-3.5 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/60 text-purple-200 font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all disabled:opacity-40 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              >
                <RotateCcw className="w-4 h-4" />
                Iniciar Revisão ({dueForReviewQuestionIds.length})
              </button>
            </div>

            {/* Linha 3: Seus Pontos Fracos */}
            <div className="bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 mb-1">
                    Gaps de Conhecimento
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Seus Pontos Fracos
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  Mínimo {LEARNING_THRESHOLDS.MIN_QUESTIONS_WEAK_AREA} respostas por domínio
                </span>
              </div>

              {weakAreasList.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 font-sans">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400 font-bold">Nenhum ponto fraco crítico detectado.</p>
                  <p className="text-xs text-zinc-600 mt-1">Continue respondendo simulados para calibrar o mapeamento contínuo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weakAreasList.map((weak, idx) => (
                    <div key={idx} className="bg-zinc-900/50 border border-amber-900/30 p-5 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">#{idx + 1} Prioridade</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            weak.hasEnoughData ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}>
                            {weak.hasEnoughData ? `${weak.percentage}% Acurácia` : 'Dados Insuficientes'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2 leading-snug">{weak.name}</h4>
                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 mb-3">
                          <span>{weak.totalQuestions} alvos</span>
                          <span className="text-red-400">{weak.errorCount} erros</span>
                          <span className="flex items-center gap-1 text-[11px]">
                            {weak.trend === 'improving' && <span className="text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> Melhora</span>}
                            {weak.trend === 'declining' && <span className="text-red-400 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> Queda</span>}
                            {weak.trend === 'stable' && <span className="text-zinc-500">Estável</span>}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-4">
                          {weak.recommendation}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStudyRecommendedTarget(weak.name)}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                      >
                        Treinar Este Domínio
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linha 4: Desempenho Completo por Domínio */}
            <div className="bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400 mb-1">
                    Análise Setorial
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Desempenho por Domínio Oficial
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedCert.code} ({domainsList.length} domínios)
                </span>
              </div>

              <div className="space-y-4">
                {domainAnalyses.map((d, idx) => (
                  <div key={idx} className="bg-zinc-900/40 border border-zinc-800/70 p-4 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{d.domain}</span>
                        {d.isStrongest && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-bold uppercase text-emerald-300">
                            Domínio Mais Forte
                          </span>
                        )}
                        {d.needsAttention && (
                          <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-[10px] font-bold uppercase text-red-300">
                            Requer Atenção
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-zinc-500">{d.totalQuestions} questões ({d.totalQuestions - d.correctCount} erros)</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          {d.trend === 'improving' && <span className="text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> Alta</span>}
                          {d.trend === 'declining' && <span className="text-red-400 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> Baixa</span>}
                          {d.trend === 'stable' && <span className="text-zinc-500">Estável</span>}
                        </span>
                        <span className={`text-base font-black ${
                          d.percentage >= 80 ? 'text-emerald-400' :
                          d.percentage >= 70 ? 'text-amber-400' :
                          d.totalQuestions === 0 ? 'text-zinc-600' : 'text-red-400'
                        }`}>
                          {d.totalQuestions > 0 ? `${d.percentage}%` : '--'}
                        </span>
                      </div>
                    </div>
                    {/* Barra de Progresso */}
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.percentage >= 80 ? 'bg-emerald-500' :
                          d.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linha 5: Conceitos Técnicos e Skills (se disponíveis no catálogo) */}
            {skillPerformanceList.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-1">
                      Conceitos Específicos
                    </p>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-400" />
                      Domínio de Skills Técnicas
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {skillPerformanceList.length} skills mapeadas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillPerformanceList.map((skillItem, idx) => (
                    <div key={idx} className="bg-zinc-900/40 border border-zinc-800/70 p-4 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{skillItem.skill}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          !skillItem.hasEnoughData ? 'bg-zinc-800 text-zinc-400' :
                          skillItem.percentage >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          skillItem.percentage >= 70 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {skillItem.hasEnoughData ? `${skillItem.percentage}%` : 'Amostra Baixa'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            !skillItem.hasEnoughData ? 'bg-zinc-700' :
                            skillItem.percentage >= 80 ? 'bg-emerald-500' :
                            skillItem.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${skillItem.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{skillItem.totalAttempts} tentativas avaliadas</span>
                        <span>{skillItem.correctCount} acertos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* ABA: OPERAÇÃO REAL */}
        {activeTab === 'simulado' && (() => {
          const officialSimulados = currentHistory.filter(h => h.exam_type === 'official');
          const latestOfficialExams = [...officialSimulados]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);
          const latestOfficialExam = latestOfficialExams[0] ?? null;
          const previousOfficialExam = latestOfficialExams[1] ?? null;
          const evolutionDelta = (latestOfficialExam && previousOfficialExam)
            ? latestOfficialExam.score - previousOfficialExam.score
            : null;

          const isInsufficientData = readinessResult.state === 'insufficient_data';
          const isProvisional = readinessResult.isProvisional;
          const readinessDisplayScore = isInsufficientData 
            ? '—' 
            : (readinessResult.overallPercentage ?? readinessResult.provisionalScore ?? '—');

          const dimensionsList = [
            { label: 'Performance', score: readinessResult.dimensions?.performance?.score },
            { label: 'Retenção', score: readinessResult.dimensions?.retention?.score },
            { label: 'Consistência', score: readinessResult.dimensions?.consistency?.score },
            { label: 'Aplicação', score: readinessResult.dimensions?.application?.score },
          ];

          const cutoffPct = (750 / 900) * 100;
          const lastScorePct = latestOfficialExam 
            ? Math.min(100, Math.max(0, (latestOfficialExam.score / 900) * 100)) 
            : null;

          const formatExamDate = (dateStr: string) => {
            try {
              const d = new Date(dateStr);
              return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
            } catch {
              return dateStr;
            }
          };

          return (
            <div className="w-full space-y-6">
              {/* HEADER: OPERAÇÃO REAL (PROFISSIONAL + CYBERSECURITY + CLEAN) */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                        Operação Real
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-zinc-800 bg-zinc-900 text-zinc-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${missionReady ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                        {missionReady ? 'PRONTO PARA INICIAR' : 'SIMULAÇÃO OFICIAL'}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                      Simulação Oficial da Certificação
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400 font-sans">
                      <span className="font-mono font-semibold text-zinc-200">{selectedCert.code}</span> · {selectedCert.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400">
                      Ambiente de Exame Oficial
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID PRINCIPAL: 7 COLS PREPARAÇÃO / 5 COLS SEU PROGRESSO */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COLUNA PRINCIPAL: PREPARAÇÃO (7 COLS) */}
                <div className="lg:col-span-7 space-y-6">

                  {/* PARÂMETROS DA SIMULAÇÃO (TRÍADE COMPACTA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider">Questões</span>
                        <Target className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">90</div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Questões Oficiais</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider">Tempo</span>
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">90 <span className="text-sm font-normal text-zinc-400">min</span></div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Tempo Limite</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider">Nota de Corte</span>
                        <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">750 <span className="text-sm font-normal text-zinc-500">/ 900</span></div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Critério de aprovação</p>
                    </div>
                  </div>

                  {/* RÉGUA DE PONTUAÇÃO (0 A 900) */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Escala de Pontuação (0 – 900)
                      </span>
                      {latestOfficialExam && (
                        <span className="text-xs font-mono text-zinc-300">
                          Último resultado: <strong className={latestOfficialExam.passed ? 'text-emerald-400' : 'text-amber-400'}>{latestOfficialExam.score} / 900</strong>
                        </span>
                      )}
                    </div>

                    <div className="relative pt-6 pb-4">
                      {/* Linha base */}
                      <div className="h-2 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                        <div 
                          className="h-full bg-cyan-950 border-r-2 border-cyan-500/50"
                          style={{ width: `${cutoffPct}%` }}
                        />
                      </div>

                      {/* Marcador da Nota de Corte (750) */}
                      <div 
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${cutoffPct}%` }}
                      >
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight whitespace-nowrap bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          Corte: 750
                        </span>
                        <div className="w-0.5 h-2.5 bg-zinc-400 mt-0.5" />
                      </div>

                      {/* Marcador do Último Resultado (se existir) */}
                      {lastScorePct !== null && latestOfficialExam && (
                        <div 
                          className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${lastScorePct}%` }}
                        >
                          <div className={`w-0.5 h-2.5 ${latestOfficialExam.passed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className={`text-[10px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded border mt-0.5 ${
                            latestOfficialExam.passed 
                              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
                              : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                          }`}>
                            ▲ {latestOfficialExam.score}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500 mt-2">
                      <span>0</span>
                      <span className="text-zinc-400">750 (Aprovação)</span>
                      <span>900</span>
                    </div>
                  </div>

                  {/* PREPARAÇÃO PARA A SIMULAÇÃO */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 space-y-5">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                        Preparação para a Simulação
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400 font-sans leading-relaxed">
                        Você está prestes a iniciar uma simulação completa da certificação. Revise as condições antes de começar.
                      </p>
                      <p className="mt-2 text-xs font-mono text-cyan-400/90">
                        Concentre-se, gerencie seu tempo e responda cada questão com atenção.
                      </p>
                    </div>

                    {/* CONDIÇÕES DA SIMULAÇÃO */}
                    <div className="p-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-2">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                        Condições da Simulação
                      </p>
                      <ul className="text-xs text-zinc-300 font-sans space-y-1.5">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>90 questões</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>90 minutos de duração</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Questões distribuídas pelos domínios da certificação</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Gabarito oculto durante a prova (revelado ao finalizar)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Resultado registrado no histórico</span>
                        </li>
                      </ul>
                    </div>

                    {/* VERIFICAÇÃO DE INÍCIO */}
                    <div className="p-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                          Verificação de Início
                        </p>
                        {missionReady && (
                          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pronto para iniciar
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs font-mono text-zinc-400">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Certificação selecionada ({selectedCert.code})</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Configuração carregada</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Sistema pronto</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {missionReady ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block shrink-0" />
                          )}
                          <span className={missionReady ? 'text-zinc-200' : 'text-zinc-500'}>
                            Confirmação do candidato
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 pt-2 cursor-pointer border-t border-zinc-800/70">
                        <input
                          type="checkbox"
                          checked={missionReady}
                          onChange={e => setMissionReady(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 font-sans">
                          Confirmo que estou pronto para iniciar a simulação.
                        </span>
                      </label>
                    </div>

                    {/* CTA PRINCIPAL */}
                    <button
                      onClick={() => generateSimulado(90)}
                      disabled={isLoading || !missionReady}
                      className={`w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2.5 ${
                        isLoading || !missionReady
                          ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-50'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30 shadow-lg shadow-cyan-950/40 active:scale-[0.99]'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Activity className="w-4 h-4 animate-spin" />
                          <span>Conectando ao banco de questões...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Iniciar Simulação</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* COLUNA LATERAL: SEU PROGRESSO (5 COLS) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* BLOCO HEADER DO PROGRESSO */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Seu Progresso
                    </h2>
                    <span className="text-xs font-mono text-zinc-500">
                      {selectedCert.code}
                    </span>
                  </div>

                  {/* ÍNDICE DE PRONTIDÃO */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                          Índice de Prontidão
                        </p>
                        <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                          Índice pedagógico baseado nos seus dados de desempenho.
                        </p>
                      </div>
                      {!isInsufficientData && (
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          isProvisional 
                            ? 'bg-amber-950/60 border-amber-800/50 text-amber-300' 
                            : 'bg-cyan-950/60 border-cyan-800/50 text-cyan-300'
                        }`}>
                          {isProvisional ? 'Índice Provisório' : readinessResult.stateLabel}
                        </span>
                      )}
                    </div>

                    {isInsufficientData ? (
                      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/70">
                        <div className="text-2xl font-bold font-mono text-zinc-500 mb-1">
                          — <span className="text-xs font-normal">/ 100</span>
                        </div>
                        <p className="text-xs font-semibold text-zinc-400 mb-1">Dados insuficientes</p>
                        <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                          Continue estudando e realizando questões para construir seu perfil de desempenho.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-black font-mono text-white">
                            {readinessDisplayScore} <span className="text-sm font-normal text-zinc-500">/ 100</span>
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            {readinessResult.totalEvaluatedQuestions} questões avaliadas
                          </span>
                        </div>

                        {/* Dimensões */}
                        <div className="pt-2 border-t border-zinc-800/70 space-y-2">
                          {dimensionsList.map((dim, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-zinc-400">{dim.label}</span>
                              <span className="font-semibold text-zinc-200">
                                {dim.score !== null && dim.score !== undefined ? `${dim.score}%` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ÚLTIMAS TENTATIVAS */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Últimas Tentativas
                      </p>
                      <span className="text-xs font-mono text-zinc-500">
                        {officialSimulados.length} no total
                      </span>
                    </div>

                    {latestOfficialExams.length > 0 ? (
                      <div className="space-y-2">
                        {latestOfficialExams.map((exam, idx) => (
                          <div 
                            key={exam.id || idx}
                            className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-mono font-bold text-sm text-white">
                                {exam.score} <span className="text-xs font-normal text-zinc-500">/ 900</span>
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                                {formatExamDate(exam.created_at)}
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                              exam.passed
                                ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                                : 'bg-zinc-800/70 border-zinc-700/50 text-zinc-400'
                            }`}>
                              {exam.passed ? '✓ ACIMA DO CORTE' : '— ABAIXO DO CORTE'}
                            </span>
                          </div>
                        ))}

                        {/* EVOLUÇÃO (se houver pelo menos 2 tentativas) */}
                        {evolutionDelta !== null && latestOfficialExam && (
                          <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/20 mt-3 flex items-center justify-between text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Evolução</span>
                              <span className="font-bold text-zinc-200">{latestOfficialExam.score} / 900</span>
                            </div>
                            <span className={`font-semibold ${
                              evolutionDelta > 0 
                                ? 'text-emerald-400' 
                                : evolutionDelta < 0 
                                ? 'text-amber-400' 
                                : 'text-zinc-400'
                            }`}>
                              {evolutionDelta > 0 && `+${evolutionDelta} pontos desde a anterior`}
                              {evolutionDelta < 0 && `${evolutionDelta} pontos desde a anterior`}
                              {evolutionDelta === 0 && 'Mesma pontuação da anterior'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* PRIMEIRO SIMULADO */
                      <div className="p-5 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
                        <Award className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Primeiro Simulado
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                          Esta será sua primeira tentativa oficial nesta certificação.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PRÓXIMO FOCO (STUDY RECOMMENDATION - APENAS SE EXISTIR) */}
                  {studyRecommendation && studyRecommendation.targetDomain && (
                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                          Próximo Foco
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">Learning Engine</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans">
                        Reforçar: <strong className="text-white">{studyRecommendation.targetDomain}</strong>
                      </p>
                      <button
                        onClick={() => handleStudyRecommendedTarget(studyRecommendation.targetDomain)}
                        className="mt-2 text-[11px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                      >
                        [ Estudar Agora ]
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })()}

        {/* ABA: ESTUDO TÁTICO & MODO RETALIAÇÃO */}
        {activeTab === 'treinamento' && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ESTUDO <span className="text-cyan-500">TÁTICO</span></h1>
            <p className="text-zinc-500 mb-10 text-sm tracking-widest">Treinamento para {selectedCert.code} com telemetria e gabarito.</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 to-zinc-950 p-5">
                 <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
                 <div className="relative flex items-start justify-between">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-300">Ofensiva de estudo</p>
                     <p className="mt-2 font-mono text-3xl font-black text-white">{streakAtual} <span className="text-sm font-bold text-orange-300">dia(s)</span></p>
                     <p className="mt-1 text-xs text-zinc-500">Pratique hoje para manter sua sequência.</p>
                   </div>
                   <Flame className="h-7 w-7 text-orange-400" />
                 </div>
               </div>
               <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-zinc-950 p-5">
                 <div className="flex items-start justify-between">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Desafio diário</p>
                     <p className="mt-2 text-lg font-black text-white">{desafioHojeConcluido ? 'Concluído!' : '5 questões // 1 missão'}</p>
                     <p className="mt-1 text-xs text-zinc-500">{desafioHojeConcluido ? 'Volte amanhã para uma nova missão.' : 'Complete uma bateria rápida e ganhe XP.'}</p>
                   </div>
                   <Target className="h-7 w-7 text-amber-300" />
                 </div>
                 {!desafioHojeConcluido && <button onClick={() => generateTreinamento(domainsList, 5)} disabled={isLoading} className="mt-4 w-full rounded-xl border border-amber-600/50 bg-amber-950/40 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-200 transition-all hover:bg-amber-900/60 disabled:opacity-40"><Rocket className="mr-2 inline h-4 w-4" /> Iniciar desafio</button>}
               </div>
             </div>

              {/* Recomendação Direta do Learning Engine */}
              {studyRecommendation && (
                <div className="mb-6 p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(8,145,178,0.1)]">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-cyan-950/80 border border-cyan-600/50 rounded-xl text-cyan-400 shrink-0">
                      <Brain className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Recomendação do Motor Cognitivo</span>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                          {studyRecommendation.priority === 'high' ? 'Prioridade Alta' : 'Recomendado'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-1">{studyRecommendation.targetDomain}</p>
                      <p className="text-xs text-zinc-400 font-sans mt-0.5 leading-relaxed">{studyRecommendation.reason}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDomains([studyRecommendation.targetDomain]);
                      generateTreinamento([studyRecommendation.targetDomain], 15);
                    }}
                    disabled={isLoading}
                    className="w-full md:w-auto px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(8,145,178,0.25)]"
                  >
                    <Rocket className="w-4 h-4" /> Estudar Alvo (15 Q.)
                  </button>
                </div>
              )}
            
             <div className="bg-zinc-950 border border-cyan-900/30 p-8 rounded-2xl shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {domainsList.map((domain, idx) => (
                  <button key={idx} onClick={() => toggleDomain(domain)} className={`text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${selectedDomains.includes(domain) ? 'bg-cyan-900/20 border-cyan-700 text-cyan-100' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                    <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${selectedDomains.includes(domain) ? 'border-cyan-400 bg-cyan-500' : 'border-zinc-600'}`}>{selectedDomains.includes(domain) && <CheckCircle2 className="w-3 h-3 text-zinc-950" />}</div>
                    {domain}
                  </button>
                ))}
              </div>
              <button onClick={() => generateTreinamento(selectedDomains, 30)} disabled={isLoading || selectedDomains.length === 0} className="w-full py-5 bg-cyan-950/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-400 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm tracking-widest uppercase">
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-3"><BookOpen className="w-5 h-5" /> INICIAR BATERIA MISTA</span>}
              </button>
            </div>

            <div className="bg-red-950/20 border border-red-900/30 p-8 rounded-2xl shadow-xl mt-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
               <div className="flex items-center gap-3 mb-4">
                 <Flame className="w-6 h-6 text-red-500" />
                 <h3 className="text-red-500 font-bold uppercase tracking-widest text-lg">Modo Retaliação</h3>
               </div>
               <p className="text-zinc-400 text-sm mb-6 leading-relaxed font-sans">
                 Enfrente novamente seus pontos cegos. Você tem <strong className="text-red-400">{totalErrosHistorico} questões únicas</strong> erradas nesta certificação.
               </p>
               <button onClick={() => generateRetaliacao(30)} disabled={isLoading || totalErrosHistorico === 0} className="w-full py-4 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                 {isLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                 Iniciar Retaliação
               </button>
            </div>
          </div>
        )}

        {/* ABA: PBQs (CENTRO TÁTICO DE OPERAÇÕES) */}
        {activeTab === 'pbqs' && (
          <div className="max-w-6xl">
            <PbqOperationsBoard />
          </div>
        )}

        {/* ABA: HISTÓRICO (OFICIAL) — FORENSIC LOG & TREND ANALYSIS */}
        {activeTab === 'historico' && (() => {
          const officialExamCount = filteredHistoryOfficial.length;
          const passedExamCount = filteredHistoryOfficial.filter(h => h.passed).length;
          const officialPassRate = officialExamCount > 0 ? Math.round((passedExamCount / officialExamCount) * 100) : 0;
          const officialHighScore = officialExamCount > 0 ? Math.max(...filteredHistoryOfficial.map(h => h.score)) : null;
          const officialAvgScore = officialExamCount > 0 
            ? Math.round(filteredHistoryOfficial.reduce((acc, h) => acc + h.score, 0) / officialExamCount) 
            : null;
          const firstScore = officialExamCount > 0 ? filteredHistoryOfficial[0].score : null;
          const latestScore = officialExamCount > 0 ? filteredHistoryOfficial[officialExamCount - 1].score : null;
          const overallDelta = (firstScore !== null && latestScore !== null && officialExamCount > 1) 
            ? latestScore - firstScore 
            : null;

          const sortedHistoryDesc = [...filteredHistoryOfficial].reverse();

          return (
            <div className="max-w-6xl space-y-6 animate-in fade-in duration-300">
              {/* Header com filtro temporal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
                    <History className="w-3.5 h-3.5" />
                    Telemetria Forense Oficial
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
                    Histórico de Simulados · <span className="font-mono text-cyan-400">{selectedCert.code}</span>
                  </h1>
                  <p className="text-zinc-400 text-xs md:text-sm mt-1">
                    Registro detalhado e curva de evolução em condições oficiais de exame.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 outline-none focus:border-cyan-500"
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="3m">Últimos 3 meses</option>
                    <option value="6m">Últimos 6 meses</option>
                    <option value="12m">Último ano</option>
                  </select>
                </div>
              </div>

              {/* Tríade de KPIs Históricos */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Recorde Pessoal</span>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {officialHighScore !== null ? officialHighScore : '—'}{' '}
                    <span className="text-xs text-zinc-500 font-normal">/ 900</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {officialHighScore !== null && officialHighScore >= 750 ? '✓ Acima do corte' : 'Em calibração'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Média Consolidada</span>
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {officialAvgScore !== null ? officialAvgScore : '—'}{' '}
                    <span className="text-xs text-zinc-500 font-normal">/ 900</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {officialAvgScore !== null 
                      ? officialAvgScore >= 750 
                        ? `+${officialAvgScore - 750} pts acima da meta` 
                        : `${750 - officialAvgScore} pts até o corte` 
                      : 'Sem dados suficientes'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Taxa de Aprovação</span>
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {officialExamCount > 0 ? `${officialPassRate}%` : '—'}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {passedExamCount} de {officialExamCount} aprovações
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Evolução Geral</span>
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono ${
                    overallDelta === null 
                      ? 'text-zinc-500' 
                      : overallDelta >= 0 
                      ? 'text-emerald-400' 
                      : 'text-amber-400'
                  }`}>
                    {overallDelta !== null ? `${overallDelta >= 0 ? `+${overallDelta}` : overallDelta} pts` : '—'}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    {overallDelta !== null ? 'Do primeiro ao último teste' : 'Aguardando mais tentativas'}
                  </p>
                </div>
              </div>

              {/* Gráfico de Área Interativo */}
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                      Curva de Desempenho Histórico
                    </span>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                      Comparação cronológica dos scores em relação à nota de corte oficial (750).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Pontuação
                    </span>
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="w-2.5 h-0.5 bg-red-400 border-dashed inline-block" /> Corte 750
                    </span>
                  </div>
                </div>

                <div className="w-full h-72 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayChartData} margin={{ top: 10, right: 20, bottom: 5, left: -15 }}>
                      <defs>
                        <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 900]} stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <ReferenceLine y={750} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'CORTE (750)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreAreaGradient)" dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#09090b' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Registro Forense de Sessões (Timeline Detalhada) */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                      Log de Sessões Oficiais
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                      Auditoria detalhada de cada simulado realizado nesta credencial.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {officialExamCount} {officialExamCount === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {sortedHistoryDesc.length > 0 ? (
                  <div className="space-y-3">
                    {sortedHistoryDesc.map((exam, idx) => {
                      const examNumber = officialExamCount - idx;
                      const accuracyPct = exam.total_questions > 0 ? Math.round((exam.correct_count / exam.total_questions) * 100) : 0;
                      return (
                        <div
                          key={exam.id || idx}
                          className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                                SIM-{String(examNumber).padStart(2, '0')}
                              </span>
                              <div>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  exam.passed
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  {exam.passed ? '✓ APROVADO' : '— ABAIXO DO CORTE'}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-500 ml-2">
                                  {new Date(exam.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-baseline gap-2 sm:text-right">
                              <span className={`text-2xl font-black font-mono ${exam.passed ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                {exam.score}
                              </span>
                              <span className="text-xs font-mono text-zinc-500">/ 900</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs font-mono text-zinc-400">
                            <div>
                              Acertos: <strong className="text-white">{exam.correct_count}</strong> de {exam.total_questions} ({accuracyPct}%)
                            </div>
                            {exam.domain_stats && Object.keys(exam.domain_stats).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(exam.domain_stats).slice(0, 3).map(([dom, st]) => (
                                  <span key={dom} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 truncate max-w-[140px]" title={dom}>
                                    {dom.split(' ')[0]}: {st.percentage}%
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-3">
                    <History className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm font-bold uppercase tracking-wider text-zinc-300 font-mono">
                      Nenhum Simulado Oficial Registrado
                    </p>
                    <p className="text-xs text-zinc-500 font-sans max-w-md mx-auto">
                      Realize sua primeira tentativa em Operação Real para desbloquear o registro forense e calibrar os gráficos.
                    </p>
                    <button
                      onClick={() => setActiveTab('simulado')}
                      className="mt-2 px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono uppercase tracking-wider transition-colors"
                    >
                      Ir para Operação Real
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ABA: MÉTRICAS (TREINO) — CARREIRA & PROGRESSÃO GAMIFICADA */}
        {activeTab === 'metrics' && (() => {
          const RANKS = [
            { minXp: 0, title: 'Recruta Operacional', tier: 'Tier I', desc: 'Fundamentos iniciais de segurança cibernética' },
            { minXp: 250, title: 'Operador de Defesa', tier: 'Tier II', desc: 'Controles básicos e identificação de anomalias' },
            { minXp: 750, title: 'Analista SOC N1', tier: 'Tier III', desc: 'Triagem de alertas e análise tática de eventos' },
            { minXp: 1500, title: 'Threat Hunter Tático', tier: 'Tier IV', desc: 'Investigação proativa de ameaças e mitigação' },
            { minXp: 3000, title: 'Engenheiro de Segurança', tier: 'Tier V', desc: 'Arquitetura resiliente e resposta a incidentes' },
            { minXp: 6000, title: 'Cyber Commander', tier: 'Tier VI (Elite)', desc: 'Domínio operacional absoluto e liderança' },
          ];

          const currentRank = [...RANKS].reverse().find(r => xpTreino >= r.minXp) || RANKS[0];
          const nextRank = RANKS.find(r => r.minXp > xpTreino);
          const xpNeededForNext = nextRank ? nextRank.minXp - xpTreino : 0;
          const rankProgressPct = nextRank
            ? Math.min(100, Math.max(0, Math.round(((xpTreino - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100)))
            : 100;

          // Categorização de Domínios
          const masteryDomains = domainTrainingStats.filter(d => d.total > 0 && d.percentage >= 85);
          const stabilityDomains = domainTrainingStats.filter(d => d.total > 0 && d.percentage >= 70 && d.percentage < 85);
          const vulnerabilityDomains = domainTrainingStats.filter(d => d.total > 0 && d.percentage < 70);

          // Mindset Telemetry (Feedbacks Cognitivos)
          const feedbackEntries = Object.values(userFeedback);
          const totalFeedbacks = feedbackEntries.length;
          const feedbackCounts = CONFIDENCE_OPTIONS.map(opt => {
            const count = feedbackEntries.filter(f => f === opt.id).length;
            const pct = totalFeedbacks > 0 ? Math.round((count / totalFeedbacks) * 100) : 0;
            return { id: opt.id, label: opt.label, count, pct };
          });

          return (
            <div className="max-w-6xl space-y-6 animate-in fade-in duration-300">
              
              {/* HERO: PROGRESSÃO DE CARREIRA & PATENTE */}
              <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-purple-950/20 p-6 md:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                      <Sparkles className="h-3.5 w-3.5" /> Progressão Operacional
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                      Patente Atual: <span className="text-cyan-400 font-mono">{currentRank.title}</span>
                    </h1>
                    <p className="mt-1 text-xs md:text-sm text-zinc-400 font-sans">
                      {currentRank.desc} · <span className="font-mono text-zinc-300">{selectedCert.code}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-3.5 shrink-0">
                    <Crown className="h-8 w-8 text-amber-300" />
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Status de Carreira</span>
                      <span className="text-sm font-mono font-bold text-white">{currentRank.tier}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de XP para Próxima Patente */}
                <div className="mt-6 pt-5 border-t border-zinc-800/70 space-y-2">
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="text-zinc-400">
                      {nextRank ? `Próxima patente: ${nextRank.title}` : 'Patente máxima alcançada'}
                    </span>
                    <span className="font-bold text-cyan-300">
                      {xpTreino.toLocaleString('pt-BR')} XP {nextRank ? `/ ${nextRank.minXp.toLocaleString('pt-BR')} XP` : ''}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${rankProgressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500">
                    {nextRank 
                      ? `Faltam ${xpNeededForNext.toLocaleString('pt-BR')} XP para a próxima promoção.` 
                      : 'Parabéns! Você alcançou o nível mais alto de telemetria.'}
                  </p>
                </div>
              </div>

              {/* GRID DE KPIs TÁTICOS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">XP Acumulado</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {xpTreino.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Base de treino</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Questões Feitas</span>
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {totalQuestoesTreino}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{totalAcertosTreino} acertos</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Precisão Global</span>
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {taxaAcertoTreino}%
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Treinamento tático</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Ofensiva Ativa</span>
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {streakAtual} <span className="text-xs font-normal text-zinc-500">dia(s)</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Consistência diária</p>
                </div>
              </div>

              {/* SELETOR DE JANELA TEMPORAL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/80">
                <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Janela de telemetria dos dados de treinamento:</span>
                </div>
                <select
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="3m">Últimos 3 meses</option>
                  <option value="6m">Últimos 6 meses</option>
                  <option value="12m">Último ano</option>
                </select>
              </div>

              {/* RADAR DE DOMÍNIOS POR TIERS (MAESTRIA, ESTABILIDADE, VULNERABILIDADE) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                        Radar de Domínios Oficiais
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                        Performance consolidada por área de conhecimento da prova.
                      </p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                  </div>

                  {domainTrainingStats.some(d => d.total > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                        Maestria: {masteryDomains.length}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                        Estáveis: {stabilityDomains.length}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-400">
                        Atenção: {vulnerabilityDomains.length}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    {domainTrainingStats.map(({ domain, total, percentage }) => {
                      let barColor = 'bg-cyan-500';
                      let statusBadge = 'Estável';
                      let badgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40';

                      if (total === 0) {
                        statusBadge = 'Sem dados';
                        badgeColor = 'text-zinc-600 bg-zinc-900 border-zinc-800';
                      } else if (percentage >= 85) {
                        barColor = 'bg-emerald-400';
                        statusBadge = 'Maestria (>=85%)';
                        badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40';
                      } else if (percentage < 70) {
                        barColor = 'bg-amber-400';
                        statusBadge = 'Atenção (<70%)';
                        badgeColor = 'text-amber-400 bg-amber-950/60 border-amber-800/40';
                      }

                      return (
                        <div key={domain} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-zinc-200 font-sans font-medium">{domain}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                {statusBadge}
                              </span>
                              <span className="font-mono font-bold text-white">
                                {total > 0 ? `${percentage}%` : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${Math.max(2, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DIAGNÓSTICO FORENSE DE MINDSET & FOCO */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Card de Ação Tática Imediata */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                        Diagnóstico Tático
                      </h3>
                    </div>

                    {bestDomain && bestDomain.total > 0 ? (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Ponto Forte</span>
                          <p className="font-bold text-white mt-0.5">{bestDomain.domain}</p>
                          <p className="text-zinc-400 mt-1">{bestDomain.percentage}% de aproveitamento.</p>
                        </div>

                        {focusDomain && focusDomain.domain !== bestDomain.domain && focusDomain.total > 0 && (
                          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Prioridade de Reforço</span>
                              <p className="font-bold text-white mt-0.5">{focusDomain.domain}</p>
                              <p className="text-zinc-400 mt-1">{focusDomain.percentage}% de precisão — vulnerabilidade identificada.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStudyRecommendedTarget(focusDomain.domain)}
                              className="w-full py-2 rounded-lg border border-amber-500/40 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                            >
                              Reforçar este domínio
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                        Complete sua primeira bateria de questões no Estudo Tático para desbloquear o diagnóstico comparativo de forças e fraquezas.
                      </p>
                    )}
                  </div>

                  {/* Mindset Telemetry (Causas de Erros/Acertos) */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                        Padrão Cognitivo
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {totalFeedbacks} autoavaliações
                      </span>
                    </div>

                    {totalFeedbacks > 0 ? (
                      <div className="space-y-2 pt-1">
                        {feedbackCounts.map(f => (
                          <div key={f.id} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-zinc-400">{f.label}</span>
                              <span className="text-zinc-200 font-semibold">{f.count} ({f.pct}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-cyan-500/70"
                                style={{ width: `${Math.max(2, f.pct)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                        Ao revisar questões e informar se acertou por conceito ou dúvida, o padrão cognitivo será desenhado aqui.
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* METAS POR QUESTÕES RESOLVIDAS */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                      Metas de Volume Operacional
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                      Marcos graduais de questões resolvidas para consolidar a retenção.
                    </p>
                  </div>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {metasQuestoes.map(({ meta, concluida, progresso }) => (
                    <div
                      key={meta}
                      className={`p-4 rounded-xl border transition-all ${
                        concluida 
                          ? 'border-amber-500/40 bg-amber-950/20' 
                          : 'border-zinc-800 bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xl font-bold text-white">{meta}</span>
                        {concluida ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600">META</span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${concluida ? 'bg-amber-400' : 'bg-cyan-500'}`}
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 mt-2 block">
                        {concluida ? 'Desbloqueada' : `${progresso}% concluída`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLEÇÃO DE CONQUISTAS */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                      Conquistas Desbloqueadas
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                      Medalhas de mérito técnico conquistadas durante as sessões de treino.
                    </p>
                  </div>
                  <Award className="w-4 h-4 text-cyan-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {achievementList.map(({ title, detail, active, tone, icon: Icon }) => {
                    const toneBorder = active
                      ? tone === 'amber'
                        ? 'border-amber-500/40 bg-amber-950/15 shadow-sm'
                        : tone === 'purple'
                        ? 'border-purple-500/40 bg-purple-950/15 shadow-sm'
                        : tone === 'emerald'
                        ? 'border-emerald-500/40 bg-emerald-950/15 shadow-sm'
                        : 'border-cyan-500/40 bg-cyan-950/15 shadow-sm'
                      : 'border-zinc-800/80 bg-zinc-900/20 opacity-60';

                    const iconStyle = active
                      ? tone === 'amber'
                        ? 'border-amber-500/40 bg-amber-900/30 text-amber-300'
                        : tone === 'purple'
                        ? 'border-purple-500/40 bg-purple-900/30 text-purple-300'
                        : tone === 'emerald'
                        ? 'border-emerald-500/40 bg-emerald-900/30 text-emerald-300'
                        : 'border-cyan-500/40 bg-cyan-900/30 text-cyan-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-600';

                    const badgeStyle = active
                      ? tone === 'amber'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                        : tone === 'purple'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-800/50'
                        : tone === 'emerald'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/50'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800';

                    return (
                      <div
                        key={title}
                        className={`p-4 rounded-xl border transition-all ${toneBorder}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg border ${iconStyle}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                            {active ? 'Conquistada' : 'Bloqueada'}
                          </span>
                        </div>
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{title}</h4>
                        <p className="text-[11px] text-zinc-400 font-sans mt-1 leading-relaxed">{detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}

        {/* ABA: PAINEL ADMIN DE INSERÇÃO */}
        {isSuperAdmin && activeTab === 'admin' && (
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-8 h-8 text-zinc-500" />
              <h1 className="text-3xl font-bold text-white tracking-tight">PAINEL <span className="text-zinc-500">ADMIN</span></h1>
            </div>
            <p className="text-zinc-500 mb-8 text-sm tracking-widest">Inserindo inteligência para: <strong>{selectedCert.code}</strong></p>
            
            <form onSubmit={handleAdminSubmit} className="bg-zinc-950 border border-zinc-800/80 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Domínio</label>
                  <select value={adminForm.domain} onChange={e => setAdminForm({...adminForm, domain: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500 min-h-12">
                    {domainsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Dificuldade</label>
                  <select value={adminForm.difficulty} onChange={e => setAdminForm({...adminForm, difficulty: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500 min-h-12">
                    <option value="Low">Baixa</option><option value="Medium">Média</option><option value="High">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Skills / Conceitos Técnicos (separados por vírgula)</label>
                <input placeholder="Ex: IAM, RBAC, Least Privilege, Zero Trust" value={adminForm.skills} onChange={e => setAdminForm({...adminForm, skills: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500" />
              </div>

              <div><textarea required value={adminForm.question_text} onChange={e => setAdminForm({...adminForm, question_text: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200" placeholder="Texto da Questão" /></div>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="A" value={adminForm.optionA} onChange={e => setAdminForm({...adminForm, optionA: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300" />
                <input required placeholder="B" value={adminForm.optionB} onChange={e => setAdminForm({...adminForm, optionB: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300" />
                <input required placeholder="C" value={adminForm.optionC} onChange={e => setAdminForm({...adminForm, optionC: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300" />
                <input required placeholder="D" value={adminForm.optionD} onChange={e => setAdminForm({...adminForm, optionD: e.target.value})} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300" />
              </div>
              <div className="flex gap-4">
                  {['A', 'B', 'C', 'D'].map(l => (
                    <label key={l} className="flex gap-2 text-zinc-300 font-bold"><input type="radio" checked={adminForm.correct_answer === l} onChange={() => setAdminForm({...adminForm, correct_answer: l})} /> {l}</label>
                  ))}
              </div>
              <textarea required value={adminForm.explanation} onChange={e => setAdminForm({...adminForm, explanation: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200" placeholder="Explicação" />
              <button type="submit" className="py-4 bg-zinc-100 text-zinc-950 font-black rounded-xl uppercase tracking-widest text-xs transition-all flex justify-center">Gravar Inteligência na {selectedCert.code}</button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}