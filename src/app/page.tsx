"use client";

import { useEffect, useState, useRef } from "react";
import { useExamStore } from "@/stores/examStore";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, Terminal, Clock, CheckCircle2, XCircle, ChevronRight, 
  ChevronLeft, Bookmark, Activity, History, BookOpen, Eye, 
  LayoutDashboard, Target, Search, BarChart3, Rocket, Coffee, Biohazard, Skull, Calendar, AlertTriangle,
  Server, Lightbulb, ArrowUp, ArrowDown, Play, RotateCcw, Database, Save, Crosshair, HelpCircle, GraduationCap, ChevronLeftCircle, Flame, LogOut, MessageSquare, Send, Award, Trophy, Medal, Crown, Sparkles, Zap, Brain, Heart, Flag, Reply
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell 
} from 'recharts';

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

export default function RootSecApp() {
  const {
    user, checkUser, signOut,
    activeTab, setActiveTab, examType, timeRange, setTimeRange,
    certifications, selectedCert, setSelectedCert, fetchCertifications, seedDatabase,
    pbqsList,
    questions, currentIndex, answers, markedForReview, revealedExplanations, timeLeft,
    isStarted, isFinished, isReviewing, isLoading, domainResults, history,
    questionComments, fetchComments, addComment, upvoteComment,
    pbqAclRules, setPbqAclRules, pbqSubmitted, pbqPassed, submitPbqAcl, resetPbqAcl,
    cliHistory, pbq2Answer, setPbq2Answer, pbq2Submitted, pbq2Passed, processCliCommand, submitPbq2, resetPbq2,
    generateSimulado, generateTreinamento, generateRetaliacao, fetchHistory, answerQuestion, 
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

  const [adminForm, setAdminForm] = useState({
    domain: '', difficulty: 'Medium', question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 'A', explanation: ''
  });

  useEffect(() => {
    setSelectedDomains([]);
    if (selectedCert) {
      setAdminForm(prev => ({ ...prev, domain: getDomainsForCert(selectedCert.code)[0] }));
    }
  }, [selectedCert]);

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
    setCommentInput('');
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

    const success = await addQuestion({
      domain: adminForm.domain, difficulty: adminForm.difficulty as any, question_text: adminForm.question_text,
      options: optionsArray, correct_answer: correctText, explanation: adminForm.explanation
    });

    if (success) {
      setAdminForm({ ...adminForm, question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', explanation: '' });
    }
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
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
                Nenhuma certificação instalada. Clique em "Instalar Cursos Base" acima.
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

  const totalTreinos = filteredHistoryTraining.length;
  const totalAcertosTreino = filteredHistoryTraining.reduce((acc, curr) => acc + curr.correct_count, 0);
  const totalQuestoesTreino = filteredHistoryTraining.reduce((acc, curr) => acc + curr.total_questions, 0);
  const totalErrosTreino = totalQuestoesTreino - totalAcertosTreino;
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
  // TELA DE PROVA / REVISÃO
  // ==========================================
  if (isStarted && (!isFinished || isReviewing)) {
    const currentQ = questions[currentIndex];
    if (!currentQ) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Inicializando...</div>;
    const visibleComments = [...questionComments].sort((a, b) => commentSort === 'useful'
      ? (b.upvotes || 0) - (a.upvotes || 0)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-mono p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col max-w-5xl">
          <div className={`flex items-center gap-3 mb-6 bg-zinc-900/40 p-4 rounded-xl border ${isReviewing ? 'border-purple-900/50' : 'border-cyan-900/30'}`}>
            {isReviewing ? <Search className="text-purple-500 w-5 h-5" /> : (examType === 'official' ? <ShieldAlert className="text-red-500 w-5 h-5" /> : <Target className="text-cyan-500 w-5 h-5" />)}
            <span className="font-bold text-white tracking-widest uppercase text-sm">
              {isReviewing ? 'REVISÃO (POST-MORTEM)' : (examType === 'official' ? 'SIMULADO OFICIAL' : 'TREINAMENTO TÁTICO')} - {selectedCert.code}
            </span>
          </div>

          <div className="bg-zinc-950/80 backdrop-blur p-6 md:p-10 rounded-2xl border border-zinc-800/80 shadow-2xl flex-1 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${isReviewing ? 'bg-purple-600/50' : (examType === 'official' ? 'bg-red-600/50' : 'bg-cyan-600/50')}`}></div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className={`${isReviewing ? 'text-purple-400' : 'text-cyan-400'} font-black text-xl mb-1 tracking-tight`}>Q-{String(currentIndex + 1).padStart(2, '0')}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{currentQ.domain}</p>
              </div>
              <button onClick={() => !isReviewing && toggleMarkForReview(currentQ.id)} disabled={isReviewing} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${markedForReview.includes(currentQ.id) ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-500' : 'border-zinc-700/50 text-zinc-400'} ${isReviewing ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:bg-zinc-800'}`}>
                <Bookmark className="w-4 h-4" /> {markedForReview.includes(currentQ.id) ? 'Em Revisão' : 'Marcar p/ Revisão'}
              </button>
            </div>

            <p className="text-lg md:text-xl text-zinc-100 mb-10 leading-relaxed font-sans">{currentQ.question_text}</p>

            <div className="space-y-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === opt;
                const isRevealed = revealedExplanations[currentQ.id] || isReviewing;
                const isCorrectOption = opt === currentQ.correct_answer;
                
                let borderClass = isSelected ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900';
                if (isRevealed) {
                  if (isCorrectOption) borderClass = 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50';
                  else if (isSelected && !isCorrectOption) borderClass = 'bg-red-950/40 border-red-500/50 opacity-60';
                  else borderClass = 'bg-zinc-950 border-zinc-900 opacity-50';
                }

                return (
                  <div key={idx} onClick={() => !isRevealed && answerQuestion(currentQ.id, opt)} className={`p-5 rounded-xl border ${!isRevealed && 'cursor-pointer'} transition-all ${borderClass}`}>
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected || (isRevealed && isCorrectOption) ? (isRevealed && isCorrectOption ? 'border-emerald-400 bg-emerald-950' : 'border-cyan-400 bg-cyan-950') : 'border-zinc-600'}`}>
                        {(isSelected || (isRevealed && isCorrectOption)) && <div className={`w-2.5 h-2.5 rounded-sm ${isRevealed && isCorrectOption ? 'bg-emerald-400' : 'bg-cyan-400'}`} />}
                      </div>
                      <span className={`leading-relaxed font-sans ${isSelected || (isRevealed && isCorrectOption) ? (isRevealed && isCorrectOption ? 'text-emerald-100 font-bold' : 'text-cyan-50') : 'text-zinc-300'}`}>{opt}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {(examType === 'training' || isReviewing) && (
              <div className="mt-8 border-t border-zinc-800/80 pt-6">
                {!revealedExplanations[currentQ.id] && !isReviewing ? (
                  <button onClick={() => revealExplanation(currentQ.id)} disabled={!answers[currentQ.id]} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl transition-all disabled:opacity-30 text-sm uppercase tracking-widest">
                    <Eye className="w-4 h-4" /> Revelar Gabarito e Explicação
                  </button>
                ) : (
                  <div className="space-y-6">
                    {/* Explicação Técnica */}
                    <div className="bg-zinc-900/50 border border-emerald-900/50 p-6 rounded-xl animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><h4 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Explicação Técnica</h4></div>
                      <p className="text-zinc-300 font-sans leading-relaxed">{currentQ.explanation || "Sem explicação cadastrada no banco de dados."}</p>
                    </div>

                  </div>
                )}
                <div className="mt-6 bg-zinc-900/30 border border-cyan-900/40 p-6 rounded-xl">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                      <h4 className="text-white font-bold tracking-widest uppercase text-sm">Debates da comunidade</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={commentSort} onChange={e => setCommentSort(e.target.value as 'recent' | 'useful')} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 outline-none">
                        <option value="recent">Recentes</option>
                        <option value="useful">Mais úteis</option>
                      </select>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-600">{questionComments.length} comentário(s)</span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                    {questionComments.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">Nenhum comentário nesta questão. Compartilhe seu raciocínio com a comunidade.</p>
                    ) : visibleComments.map((c) => (
                      <div key={c.id} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-lg text-xs">
                        <div className="flex justify-between items-center mb-1 gap-3">
                          <span className="font-bold text-cyan-400">{c.profiles?.full_name || 'Operador Anônimo'}</span>
                          <span className="text-[10px] text-zinc-600">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-zinc-300 font-sans whitespace-pre-wrap">{c.content}</p>
                        <div className="mt-3 flex items-center gap-3 border-t border-zinc-900 pt-2">
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
                    <input required type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Adicionar macete, dúvida ou raciocínio..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-cyan-500" />
                    <button type="submit" disabled={!commentInput.trim()} className="px-4 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-100 rounded-lg transition-all flex items-center justify-center disabled:opacity-30">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button onClick={prevQuestion} disabled={currentIndex === 0} className="px-6 py-3 flex items-center gap-2 text-zinc-400 hover:text-white disabled:opacity-25 hover:bg-zinc-900 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /> ANTERIOR</button>
            <button onClick={nextQuestion} disabled={currentIndex === questions.length - 1} className="px-8 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-100 rounded-xl font-bold flex items-center gap-2 disabled:opacity-25 transition-all">PRÓXIMA <ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-zinc-950/80 backdrop-blur p-6 rounded-2xl border border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{isReviewing ? 'Tempo Final' : 'Tempo Restante'}</p>
            <div className={`text-4xl font-black font-mono tracking-tight flex items-center justify-center gap-3 ${isReviewing ? 'text-zinc-600' : 'text-emerald-400'}`}>
              <Clock className="w-8 h-8 opacity-50" /> {examType === 'official' && !isReviewing ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>

          <div className="bg-zinc-950/80 backdrop-blur p-5 rounded-2xl border border-zinc-800/80 flex-1 flex flex-col">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-bold border-b border-zinc-800 pb-2">Mapa Tático ({Object.keys(answers).length}/{questions.length})</p>
            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentIndex === idx;
                let btnClass = "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500";
                if (isReviewing || revealedExplanations[q.id]) {
                   btnClass = answers[q.id] === q.correct_answer ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400" : "bg-red-900/30 border-red-700/50 text-red-400";
                } else if (isAnswered) btnClass = "bg-cyan-900/30 border-cyan-700/50 text-cyan-300";
                
                return (
                  <button key={q.id} onClick={() => useExamStore.setState({ currentIndex: idx })} className={`h-10 text-xs font-bold rounded border transition-all flex items-center justify-center ${btnClass} ${isCurrent ? 'ring-2 ring-white scale-110 z-10' : ''}`}>{idx + 1}</button>
                );
              })}
            </div>
          </div>

          {isReviewing ? (
             <button onClick={stopReview} className="w-full py-5 font-bold rounded-2xl transition-all tracking-widest text-sm uppercase bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white">Voltar ao Resultado</button>
          ) : (
            <button onClick={finishExam} className="w-full py-5 font-bold rounded-2xl transition-all tracking-widest text-sm uppercase bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white">Finalizar Treinamento</button>
          )}
        </div>
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
      
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col relative z-10">
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
        
        {/* ABA: OPERAÇÃO REAL */}
        {activeTab === 'simulado' && (
          <div className="max-w-5xl space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-red-500/25 bg-gradient-to-br from-red-950/50 via-zinc-950 to-zinc-950 p-6 shadow-[0_0_50px_rgba(220,38,38,0.1)] md:p-8">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-300"><ShieldAlert className="h-4 w-4 animate-pulse" /> Canal seguro // missão oficial</div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">OPERAÇÃO <span className="text-red-500">REAL</span></h1>
                  <p className="mt-2 text-sm tracking-widest text-zinc-400">Ambiente de combate estrito sob condições oficiais de exame.</p>
                </div>
                <span className="w-fit rounded-full border border-red-500/30 bg-red-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Risco alto</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                <Clock className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Tempo Limite</p>
                <p className="text-xl font-black text-white font-mono">90 Minutos</p><p className="mt-2 text-xs text-zinc-600">Cronômetro sem pausa</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                <Target className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Nota de Corte</p>
                <p className="text-xl font-black text-white font-mono">750 / 900</p><p className="mt-2 text-xs text-zinc-600">Performance mínima exigida</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                <Terminal className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Questões</p>
                <p className="text-xl font-black text-white font-mono">90 Alvos</p><p className="mt-2 text-xs text-zinc-600">Domínios oficiais</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-red-900/30 p-8 rounded-2xl shadow-xl relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Diretrizes da Missão:
              </h3>
              <ul className="space-y-3 text-sm text-zinc-400 font-sans mb-6">
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div><span>O cronômetro roda continuamente. Caso expire, o sistema encerrará automaticamente.</span></li>
                <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div><span>As questões cobrem os domínios oficiais da certificação {selectedCert.code}.</span></li>
              </ul>
              <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
                <input type="checkbox" checked={missionReady} onChange={e => setMissionReady(e.target.checked)} className="h-4 w-4 accent-red-500" />
                Confirmo que estou pronto para iniciar uma tentativa oficial.
              </label>

              <button onClick={() => generateSimulado(90)} disabled={isLoading || !missionReady} className="w-full py-5 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-40 text-sm tracking-widest uppercase">
                {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-3"><Terminal className="w-5 h-5" /> INICIAR OPERAÇÃO REAL</span>}
              </button>
            </div>
          </div>
        )}

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

        {/* ABA: PBQs */}
        {activeTab === 'pbqs' && (
          <div className="max-w-4xl">
            {activePbqView === 'list' ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <Server className="w-8 h-8 text-purple-500 animate-pulse" />
                  <h1 className="text-3xl font-bold text-white tracking-tight">SIMULADORES <span className="text-purple-500">PRÁTICOS (PBQ)</span></h1>
                </div>
                <p className="text-zinc-500 mb-8 text-sm tracking-widest">Performance-Based Questions: Testes reais de aplicação em ambiente controlado.</p>
                
                <h3 className="font-bold text-white tracking-widest uppercase text-sm mb-4 border-b border-zinc-800 pb-2">Central de Laboratórios Virtuais ({selectedCert.code})</h3>
                
                {displayedPbqs.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-800/80 p-12 rounded-2xl text-center text-zinc-500">
                    <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    Nenhum laboratório prático (PBQ) disponível para esta certificação no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedPbqs.map((pbq, idx) => (
                      <div key={pbq.id} className={`bg-zinc-950 border p-6 rounded-2xl relative overflow-hidden group shadow-lg ${pbq.type === 'acl-lab' ? 'border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.05)]' : 'border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.05)]'}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${pbq.type === 'acl-lab' ? 'bg-purple-600' : 'bg-cyan-600'}`}></div>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${pbq.type === 'acl-lab' ? 'bg-purple-950 text-purple-400 border-purple-900' : 'bg-cyan-950 text-cyan-400 border-cyan-900'}`}>PBQ-0{idx + 1}</span>
                          <span className="px-2 py-1 bg-emerald-950 text-emerald-400 text-[10px] uppercase font-bold rounded border border-emerald-900">Disponível</span>
                        </div>
                        <h4 className="text-white font-bold text-base mb-2 mt-2">{pbq.title}</h4>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{pbq.description}</p>
                        <button onClick={() => pbq.type === 'scenario-lab' ? openScenario(pbq as (typeof securityPlusPbqs)[number]) : setActivePbqView(pbq.type as any)} className={`w-full py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border ${pbq.type === 'acl-lab' ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-700/50' : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-700/50'}`}>
                          <Play className="w-4 h-4" /> {pbq.type === 'acl-lab' ? 'Iniciar Laboratório' : pbq.type === 'scenario-lab' ? 'Iniciar Simulação' : 'Iniciar Terminal'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : activePbqView === 'scenario-lab' && selectedScenario ? (
              <div className="bg-zinc-950 border border-amber-900/40 p-6 md:p-8 rounded-2xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Laboratório Security+</span>
                    <h2 className="text-xl font-bold text-white">{selectedScenario.title}</h2>
                  </div>
                  <button onClick={() => setActivePbqView('list')} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider rounded-xl transition-all">Voltar</button>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl mb-6">
                  <p className="text-sm text-zinc-300 leading-relaxed font-sans">{selectedScenario.description}</p>
                  <p className="mt-4 text-base font-bold text-white">{selectedScenario.prompt}</p>
                </div>
                <div className="space-y-3 mb-6">
                  {selectedScenario.options.map((option, index) => (
                    <button key={option} disabled={scenarioSubmitted} onClick={() => setScenarioAnswer(index)} className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${scenarioAnswer === index ? 'border-amber-400 bg-amber-950/30 text-amber-100' : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600'} disabled:cursor-default`}>
                      <span className="mr-3 font-mono text-amber-400">{String.fromCharCode(65 + index)}.</span>{option}
                    </button>
                  ))}
                </div>
                {scenarioSubmitted && (
                  <div className={`p-4 rounded-xl border mb-5 ${scenarioAnswer === selectedScenario.correctOption ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-red-950/30 border-red-500/50 text-red-300'}`}>
                    <p className="font-bold uppercase tracking-widest text-xs mb-2">{scenarioAnswer === selectedScenario.correctOption ? 'Resposta correta' : 'Resposta incorreta'}</p>
                    <p className="text-sm font-sans">{selectedScenario.explanation}</p>
                  </div>
                )}
                <button disabled={scenarioAnswer === null || scenarioSubmitted} onClick={() => setScenarioSubmitted(true)} className="w-full py-4 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 font-bold uppercase text-xs rounded-xl disabled:opacity-40">
                  {scenarioSubmitted ? 'Simulação concluída' : 'Validar resposta'}
                </button>
              </div>
            ) : activePbqView === 'acl-lab' ? (
              <div className="bg-zinc-950 border border-purple-900/40 p-6 md:p-8 rounded-2xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Laboratório Interativo</span>
                    <h2 className="text-xl font-bold text-white">PBQ-01: Firewall ACL</h2>
                  </div>
                  <button onClick={() => setActivePbqView('list')} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider rounded-xl transition-all">Voltar</button>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl mb-6 text-xs text-zinc-300 leading-relaxed font-sans">
                  Reordene as regras de cima para baixo na ordem correta em que o Firewall deve processá-las.
                </div>
                <div className="space-y-3 mb-8">
                  {pbqAclRules.map((rule, idx) => (
                    <div key={rule.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center font-bold text-xs text-purple-400">{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.action === 'DENY' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'}`}>{rule.action}</span>
                            <span className="text-xs text-zinc-400 font-mono">Porta: <strong className="text-zinc-200">{rule.port}</strong></span>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">De: <span className="text-zinc-200">{rule.source}</span> ➔ Para: <span className="text-zinc-200">{rule.dest}</span></p>
                        </div>
                      </div>
                      {!pbqSubmitted && (
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveRule(idx, 'up')} disabled={idx === 0} className="p-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 disabled:opacity-25"><ArrowUp className="w-4 h-4" /></button>
                          <button onClick={() => moveRule(idx, 'down')} disabled={idx === pbqAclRules.length - 1} className="p-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 disabled:opacity-25"><ArrowDown className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pbqSubmitted && (
                  <div className={`p-5 rounded-xl border mb-6 animate-in fade-in duration-300 ${pbqPassed ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-red-950/30 border-red-500/50 text-red-300'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {pbqPassed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                      <h4 className="font-bold uppercase tracking-widest text-sm">{pbqPassed ? 'ACL Configurada!' : 'Falha na Sequência!'}</h4>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  {!pbqSubmitted ? (
                    <button onClick={submitPbqAcl} className="flex-1 py-4 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-100 font-bold uppercase text-xs rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)]">Validar ACL</button>
                  ) : (
                    <button onClick={resetPbqAcl} className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold uppercase text-xs rounded-xl flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Reiniciar</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-cyan-900/40 p-6 md:p-8 rounded-2xl shadow-2xl relative flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4 shrink-0">
                  <div>
                    <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Laboratório Prático (CLI)</span>
                    <h2 className="text-xl font-bold text-white">PBQ-02: Troubleshooting de Rede</h2>
                  </div>
                  <button onClick={() => setActivePbqView('list')} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider rounded-xl transition-all">Voltar</button>
                </div>
                
                <div className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 overflow-y-auto mb-4 font-mono text-xs shadow-inner" onClick={() => document.getElementById('cli-input')?.focus()}>
                  {cliHistory.map((item, i) => (
                    <div key={i} className="mb-3">
                      {item.command && <div className="text-cyan-400 mb-1">C:\Users\Admin&gt; {item.command}</div>}
                      {item.output.map((line, j) => (
                        <div key={j} className="text-emerald-500/90 whitespace-pre-wrap">{line}</div>
                      ))}
                    </div>
                  ))}
                  <form onSubmit={handleCliSubmit} className="flex mt-1">
                    <span className="text-cyan-400 mr-2">C:\Users\Admin&gt;</span>
                    <input id="cli-input" type="text" value={cliInput} onChange={e => setCliInput(e.target.value)} className="flex-1 bg-transparent outline-none text-emerald-400 font-mono caret-emerald-500" autoComplete="off" spellCheck="false" autoFocus />
                  </form>
                  <div ref={terminalEndRef} />
                </div>

                <div className="shrink-0 bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Relatório do Incidente</label>
                    <select disabled={pbq2Submitted} value={pbq2Answer} onChange={e => setPbq2Answer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 outline-none focus:border-cyan-500">
                      <option value="">Selecione o equipamento defeituoso...</option>
                      <option value="gateway">Gateway Local (192.168.10.1) - Offline</option>
                      <option value="switch">Core Switch (10.0.0.5) - Falha de Roteamento</option>
                      <option value="firewall">Firewall (Próximo Salto) - Bloqueando Tráfego</option>
                    </select>
                  </div>
                  
                  {pbq2Submitted ? (
                    <div className={`px-6 py-3 rounded-xl border flex items-center justify-center gap-2 ${pbq2Passed ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'bg-red-950/40 border-red-500/50 text-red-400'}`}>
                      {pbq2Passed ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                      <span className="text-sm font-bold uppercase">{pbq2Passed ? 'Correto!' : 'Incorreto'}</span>
                    </div>
                  ) : (
                    <button onClick={submitPbq2} disabled={!pbq2Answer} className="w-full md:w-auto px-8 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/50 text-cyan-100 font-bold uppercase tracking-widest text-sm rounded-xl transition-all disabled:opacity-30">
                      Enviar Relatório
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO (OFICIAL) */}
        {activeTab === 'historico' && (
          <div className="max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">LOG DE <span className="text-emerald-500">OPERAÇÕES</span></h1>
                <p className="text-zinc-500 text-sm tracking-widest">Trend Analysis para {selectedCert.code}</p>
              </div>
            </div>

            <div className="w-full h-72 bg-zinc-950/80 backdrop-blur border border-zinc-800/80 rounded-2xl p-6 mb-8 shadow-xl">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 900]} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <ReferenceLine y={750} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'CORTE (750)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="score" stroke="#0891b2" strokeWidth={3} dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#09090b' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {filteredHistoryOfficial.length === 0 && (
              <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-2xl text-center">
                <History className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 uppercase tracking-widest text-xs">Nenhum simulado encontrado para {selectedCert.code}. O gráfico abaixo fica em modo de espera até a primeira execução.</p>
              </div>
            )}
          </div>
        )}

        {/* ABA: MÉTRICAS (TREINO) */}
        {activeTab === 'metrics' && (
          <div className="max-w-5xl space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 via-zinc-950 to-purple-950/30 p-6 md:p-8 shadow-[0_0_50px_rgba(8,145,178,0.12)]">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                    <Sparkles className="h-4 w-4" /> Central de evolução
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">MÉTRICAS <span className="text-cyan-400">// LEVEL UP</span></h1>
                  <p className="mt-2 text-sm tracking-widest text-zinc-400">Sua operação em {selectedCert.code}, transformada em progresso.</p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-black/20 px-5 py-4">
                  <Crown className="h-9 w-9 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">Nível atual</p>
                    <p className="font-mono text-3xl font-black text-white">{nivelTreino}</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-7">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-widest text-zinc-300">Próxima patente: nível {nivelTreino + 1}</span>
                  <span className="font-mono text-cyan-300">{nivelProgress}/25 questões</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-900/90 ring-1 ring-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-400 to-purple-400 shadow-[0_0_18px_rgba(34,211,238,0.65)] transition-all" style={{ width: `${progressoMeta}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{questoesRestantes === 0 ? 'Patente desbloqueada!' : `Resolva mais ${questoesRestantes} questões para subir de nível.`}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'XP acumulado', value: xpTreino.toLocaleString('pt-BR'), icon: Zap, tone: 'text-amber-300', accent: 'from-amber-500/20' },
                { label: 'Questões resolvidas', value: totalQuestoesTreino, icon: Crosshair, tone: 'text-cyan-300', accent: 'from-cyan-500/20' },
                { label: 'Acertos', value: totalAcertosTreino, icon: CheckCircle2, tone: 'text-emerald-300', accent: 'from-emerald-500/20' },
                { label: 'Precisão', value: `${taxaAcertoTreino}%`, icon: Target, tone: 'text-purple-300', accent: 'from-purple-500/20' },
              ].map(({ label, value, icon: Icon, tone, accent }) => (
                <div key={label} className={`rounded-2xl border border-zinc-800/80 bg-gradient-to-br ${accent} to-zinc-950 p-4`}>
                  <Icon className={`mb-4 h-5 w-5 ${tone}`} />
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
                  <p className={`mt-1 font-mono text-2xl font-black ${tone}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Janela de análise</p>
                  <p className="text-xs text-zinc-300">Filtre seus resultados para enxergar o ritmo atual.</p>
                </div>
              </div>
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 outline-none focus:border-cyan-400">
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="12m">Último ano</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 lg:col-span-3">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">Radar de domínio</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Onde você está evoluindo</h2>
                  </div>
                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="space-y-4">
                  {domainTrainingStats.map(({ domain, total, percentage }) => (
                    <div key={domain}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-zinc-300">{domain}</span>
                        <span className={`font-mono font-bold ${total > 0 ? 'text-cyan-300' : 'text-zinc-600'}`}>{total > 0 ? `${percentage}%` : 'Sem dados'}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                        <div className={`h-full rounded-full transition-all ${percentage >= 80 ? 'bg-emerald-400' : percentage >= 60 ? 'bg-cyan-400' : 'bg-amber-400'}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-zinc-950 p-5 lg:col-span-2">
                <div className="mb-5 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-300" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Insight do operador</p>
                </div>
                {bestDomain ? (
                  <div className="space-y-4">
                    <div><p className="text-xs uppercase tracking-widest text-zinc-500">Seu domínio de elite</p><p className="mt-1 text-lg font-bold text-white">{bestDomain.domain}</p><p className="mt-1 text-sm text-emerald-300">{bestDomain.percentage}% de precisão</p></div>
                    {focusDomain && focusDomain.domain !== bestDomain.domain && <div className="border-t border-zinc-800 pt-4"><p className="text-xs uppercase tracking-widest text-zinc-500">Próximo alvo</p><p className="mt-1 text-sm font-bold text-white">{focusDomain.domain}</p><p className="mt-1 text-xs text-amber-300">Reforce este domínio no Estudo Tático.</p></div>}
                  </div>
                ) : <p className="text-sm leading-relaxed text-zinc-400">Complete sua primeira bateria para desbloquear recomendações personalizadas.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-5 md:p-6">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Missões de resolução</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Metas por questões resolvidas</h2>
                </div>
                <Trophy className="h-7 w-7 text-amber-300" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {metasQuestoes.map(({ meta, concluida, progresso }) => (
                  <div key={meta} className={`rounded-xl border p-4 ${concluida ? 'border-amber-400/40 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/40'}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-lg font-black text-white">{meta}</span>
                      {concluida ? <Medal className="h-4 w-4 text-amber-300" /> : <span className="text-[10px] text-zinc-600">META</span>}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className={`h-full rounded-full ${concluida ? 'bg-amber-300' : 'bg-cyan-500'}`} style={{ width: `${progresso}%` }} />
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">{concluida ? 'Desbloqueada' : `${progresso}% concluída`}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Trophy className="h-5 w-5 text-amber-300" />
              <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Coleção do operador</p><h2 className="text-xl font-bold text-white">Conquistas e patentes</h2></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {achievementList.map(({ title, detail, active, tone, icon: Icon }) => (
                <div key={title} className={`rounded-2xl border p-5 transition-all ${active ? 'border-amber-500/40 bg-amber-950/10 shadow-[0_0_20px_rgba(251,191,36,0.08)]' : 'border-zinc-800 bg-zinc-950/60 opacity-70'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? 'border-amber-500/40 bg-amber-900/20' : 'border-zinc-700 bg-zinc-900'}`}>
                      <Icon className={`w-5 h-5 ${active ? tone : 'text-zinc-500'}`} />
                    </span>
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${active ? 'text-amber-300' : 'text-zinc-500'}`}>
                      {active ? 'Conquistada' : 'Pendente'}
                    </span>
                  </div>
                  <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">{title}</h3>
                  <p className="text-zinc-400 text-sm font-sans">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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