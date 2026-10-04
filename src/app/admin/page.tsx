import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  FileQuestion,
  Layers,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle,
  Award,
  Terminal,
  Lock,
  Cpu,
  BarChart3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';
import { createClient } from '@/lib/supabase-server';
import { getAdminOverviewData } from '@/lib/admin/overview-data';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let adminContext;
  const supabase = await createClient();

  try {
    adminContext = await requireAdmin(supabase);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      if (error.code === 'UNAUTHENTICATED') {
        redirect('/');
      }

      // FORBIDDEN — Usuário autenticado sem privilégio administrativo no RBAC
      return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900/80 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-red-400">
              Acesso Negado
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sua sessão está autenticada, porém este identificador não possui atribuição administrativa na tabela autoritativa <code className="text-zinc-200 font-mono text-xs bg-zinc-800 px-1 py-0.5 rounded">public.admin_users</code>.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors border border-zinc-700/50"
              >
                Retornar ao Cockpit
              </Link>
            </div>
          </div>
        </main>
      );
    }
    throw error;
  }

  const { user } = adminContext;

  // Carregar dados reais dinâmicos via queries server-side protegidas
  const overview = await getAdminOverviewData(supabase, user.id);

  const currentRole =
    overview.operators.status === 'success' && overview.operators.data
      ? overview.operators.data.currentOperatorRole
      : 'superadmin';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. ADMIN SHELL: Barra Superior de Comando e Telemetria */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider uppercase text-zinc-100 font-sans">
                  CyberCert
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-zinc-800 text-cyan-400 border border-cyan-500/30">
                  Flight Deck Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Aerospace & Cyber Intelligence Console
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Contexto do Operador Autenticado */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Operador:</span>
              <span className="text-zinc-200 font-semibold truncate max-w-[200px]" title={user.email}>
                {user.email}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {currentRole}
              </span>
            </div>

            {/* Badges de Estado Arquitetural */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                RBAC Canônico
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]">
                RLS Enforced
              </span>
            </div>

            {/* Retorno à Plataforma Principal */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors border border-zinc-700/60 font-mono text-xs"
            >
              Plataforma
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. NAVEGAÇÃO DE COMANDO (ADMIN SHELL) */}
      <nav className="bg-zinc-900/40 border-b border-zinc-800/60 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto text-xs font-mono scrollbar-none">
          <span className="px-3 py-1.5 rounded-md bg-zinc-800 text-cyan-400 font-semibold flex items-center gap-2 border border-cyan-500/30 shadow-xs">
            <Cpu className="w-3.5 h-3.5" />
            Overview
          </span>
          <Link
            href="/admin/questions"
            className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            Questões
          </Link>
          <Link
            href="/admin/skills"
            className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Skills & Conceitos
          </Link>
          <span className="px-3 py-1.5 rounded-md text-zinc-400 flex items-center gap-2 opacity-60 cursor-not-allowed">
            <Users className="w-3.5 h-3.5" />
            Operadores
            <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Fase 2.5
            </span>
          </span>
        </div>
      </nav>

      {/* 3. CONTEÚDO PRINCIPAL: ADMIN OVERVIEW */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Título de Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5" />
              Telemetria Operacional da Plataforma
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 font-sans">
              Admin Overview
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Monitoramento centralizado de inventário de questões, catálogo de skills, sessões de avaliação e atividade de segurança.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>Instância:</span>
              <span className="text-zinc-200">PostgreSQL (Remoto)</span>
            </div>
          </div>
        </div>

        {/* 4. GRID DE MÉTRICAS OPERACIONAIS PRINCIPAIS (DADOS REAIS DINÂMICOS) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Questões */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Banco de Questões
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileQuestion className="w-4 h-4" />
              </div>
            </div>

            <div>
              {overview.questions.status === 'success' && overview.questions.data ? (
                <>
                  <div className="text-3xl font-mono font-extrabold text-zinc-100">
                    {overview.questions.data.total}
                  </div>
                  <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      Low: {overview.questions.data.byDifficulty.Low || 0}
                    </span>
                    <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      Med: {overview.questions.data.byDifficulty.Medium || 0}
                    </span>
                    <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      High: {overview.questions.data.byDifficulty.High || 0}
                    </span>
                  </div>
                </>
              ) : overview.questions.status === 'error' ? (
                <div className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {overview.questions.error || 'Erro na consulta'}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Nenhuma questão catalogada</div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Distribuição Ativa</span>
              <span className="text-zinc-300">
                {overview.questions.data ? Object.keys(overview.questions.data.byDomain).length : 0} domínios
              </span>
            </div>
          </div>

          {/* Card 2: Skills & Conceitos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Skills Catalogadas
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div>
              {overview.skills.status === 'success' && overview.skills.data ? (
                <>
                  <div className="text-3xl font-mono font-extrabold text-zinc-100">
                    {overview.skills.data.total}
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-2">
                    {overview.skills.data.linkedToCertCount} de {overview.skills.data.total} com certificação vinculada
                  </p>
                </>
              ) : overview.skills.status === 'error' ? (
                <div className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {overview.skills.error || 'Erro na consulta'}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Nenhuma skill catalogada</div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Catálogo Técnico</span>
              <span className="text-violet-400">Adaptive Ready</span>
            </div>
          </div>

          {/* Card 3: Sessões de Exame */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Sessões de Exame
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div>
              {overview.exams.status === 'success' && overview.exams.data ? (
                <>
                  <div className="text-3xl font-mono font-extrabold text-zinc-100">
                    {overview.exams.data.total}
                  </div>
                  <div className="flex items-center gap-3 mt-2 font-mono text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {overview.exams.data.passedCount} aprovados
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {overview.exams.data.failedCount} reprovados
                    </span>
                  </div>
                </>
              ) : overview.exams.status === 'error' ? (
                <div className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {overview.exams.error || 'Erro na consulta'}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Sem histórico gravado</div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Score Médio Geral</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {overview.exams.data ? `${overview.exams.data.averageScore} / 900` : '-'}
              </span>
            </div>
          </div>

          {/* Card 4: Tentativas & Atividade */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Tentativas Registradas
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div>
              {overview.attempts.status === 'success' && overview.attempts.data ? (
                <>
                  <div className="text-3xl font-mono font-extrabold text-zinc-100">
                    {overview.attempts.data.total}
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-2">
                    Tentativas cognitivas e telemetria granular
                  </p>
                </>
              ) : overview.attempts.status === 'error' ? (
                <div className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {overview.attempts.error || 'Erro na consulta'}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Zero tentativas</div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Learning Telemetry</span>
              <span className="text-amber-400 font-mono">Granular</span>
            </div>
          </div>
        </section>

        {/* 5. SEÇÃO DE DETALHAMENTO EM DOIS PAINÉIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel Esquerdo (2 colunas): Distribuição de Domínios do Banco de Questões */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-tight text-zinc-100 uppercase font-mono">
                  Distribuição de Questões por Domínio
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Total: {overview.questions.data?.total || 0}
              </span>
            </div>

            {overview.questions.status === 'success' && overview.questions.data ? (
              <div className="space-y-3.5">
                {Object.entries(overview.questions.data.byDomain)
                  .sort(([, a], [, b]) => b - a)
                  .map(([domainName, count]) => {
                    const totalQ = overview.questions.data?.total || 1;
                    const percentage = Math.round((count / totalQ) * 100);

                    return (
                      <div key={domainName} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-300 truncate max-w-[80%]" title={domainName}>
                            {domainName}
                          </span>
                          <span className="text-zinc-400 shrink-0">
                            <strong className="text-zinc-100">{count}</strong> ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : overview.questions.status === 'error' ? (
              <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-400 font-mono">
                {overview.questions.error}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 font-mono p-4">Nenhum domínio registrado.</div>
            )}
          </div>

          {/* Painel Direito (1 coluna): Governança de Operadores & Certificações */}
          <div className="space-y-6">
            {/* Bloco: Operadores Administrativos */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold tracking-tight text-zinc-100 uppercase font-mono">
                    Corpo de Operadores
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {overview.operators.data?.total || 0} ativo(s)
                </span>
              </div>

              {overview.operators.status === 'success' && overview.operators.data ? (
                <div className="space-y-2.5">
                  {overview.operators.data.operators.map(op => (
                    <div
                      key={op.user_id}
                      className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs font-mono flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="text-zinc-200 font-medium">
                          {op.user_id === user.id ? `${user.email} (Você)` : op.user_id.slice(0, 8) + '...'}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          UID: {op.user_id.slice(0, 18)}...
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {op.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : overview.operators.status === 'error' ? (
                <div className="text-xs text-red-400 font-mono p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
                  {overview.operators.error}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Nenhum operador provisionado</div>
              )}
            </div>

            {/* Bloco: Certificações Ativas */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold tracking-tight text-zinc-100 uppercase font-mono">
                    Certificações Ativas
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {overview.certifications.data?.length || 0} catálogo(s)
                </span>
              </div>

              {overview.certifications.status === 'success' && overview.certifications.data ? (
                <div className="space-y-2">
                  {overview.certifications.data.map(cert => (
                    <div
                      key={cert.id}
                      className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-zinc-200 font-medium">{cert.name}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700 text-[10px]">
                        {cert.code}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 font-mono">Nenhuma certificação catalogada</div>
              )}
            </div>
          </div>
        </div>

        {/* 6. TABELA DE SESSÕES RECENTES DE EXAME */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold tracking-tight text-zinc-100 uppercase font-mono">
                Últimas Sessões de Exame Registradas
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Amostra dos 5 registros mais recentes
            </span>
          </div>

          {overview.exams.status === 'success' && overview.exams.data?.recentExams.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Identificador</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Certificação</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Resultado</th>
                    <th className="py-2.5 px-3">Data / Hora (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {overview.exams.data.recentExams.map(exam => {
                    const formattedDate = new Date(exam.created_at).toLocaleString('pt-BR', {
                      timeZone: 'UTC',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={exam.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-2.5 px-3 text-zinc-300" title={exam.id}>
                          {exam.id.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] uppercase">
                            {exam.exam_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-400">
                          {exam.cert_code || 'Geral'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-100">
                          {exam.score} <span className="text-zinc-400 font-normal">/ 900</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {exam.passed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">
                              <XCircle className="w-3 h-3" />
                              Reprovado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : overview.exams.status === 'error' ? (
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-400 font-mono">
              {overview.exams.error}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 font-mono p-4">
              Nenhuma sessão de exame registrada no banco.
            </div>
          )}
        </section>

        {/* 7. QUICK ACTIONS E ROTEIRO DE PRÓXIMAS FASES */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold tracking-tight text-zinc-100 uppercase font-mono">
                Quick Actions & Roteiro Administrativo
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Módulos em Planejamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Banco de Questões</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Listagem, busca, filtros por certificação e domínio, criação, edição e arquivamento seguro.
                </p>
              </div>
              <Link
                href="/admin/questions"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-mono rounded-lg transition-colors border border-zinc-700/60 w-full"
              >
                Acessar Repositório
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Catálogo de Skills</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Mapeamento de conceitos técnicos, vinculação com certificações e taxonomia para aprendizagem adaptativa.
                </p>
              </div>
              <Link
                href="/admin/skills"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-400 text-xs font-mono rounded-lg transition-colors border border-zinc-700/60 w-full"
              >
                Gerenciar Skills
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">RBAC & Operadores</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Fase 2.5
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Gestão autoritativa de roles (superadmin, admin, auditor) com auditoria granular de privilégios.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
