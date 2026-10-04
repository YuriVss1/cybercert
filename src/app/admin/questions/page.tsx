import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  FileQuestion,
  Layers,
  Users,
  Terminal,
  Lock,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';
import { createClient } from '@/lib/supabase-server';
import { getAdminQuestions, AdminQuestionsFilterParams } from '@/lib/admin/questions-data';
import { QuestionsManager } from '@/components/admin/QuestionsManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminQuestionsPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;

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
              Privilégios administrativos necessários para gerenciar o repositório de questões.
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

  // Normalização segura de parâmetros de busca
  const filterParams: AdminQuestionsFilterParams = {
    page: typeof resolvedSearchParams.page === 'string' ? Number(resolvedSearchParams.page) : 1,
    pageSize: 15,
    search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined,
    cert_id: typeof resolvedSearchParams.cert_id === 'string' ? resolvedSearchParams.cert_id : undefined,
    domain: typeof resolvedSearchParams.domain === 'string' ? resolvedSearchParams.domain : undefined,
    difficulty: typeof resolvedSearchParams.difficulty === 'string' ? resolvedSearchParams.difficulty : undefined,
    review_status: typeof resolvedSearchParams.review_status === 'string' ? resolvedSearchParams.review_status : undefined,
  };

  const questionsData = await getAdminQuestions(supabase, filterParams);

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
                  Question Repository
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Gestão Canônica de Questões & Avaliações
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Operador:</span>
              <span className="text-zinc-200 font-semibold truncate max-w-[200px]" title={user.email}>
                {user.email}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                RBAC Canônico
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]">
                RLS Enforced
              </span>
            </div>

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
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            Overview
          </Link>
          <span className="px-3 py-1.5 rounded-md bg-zinc-800 text-cyan-400 font-semibold flex items-center gap-2 border border-cyan-500/30 shadow-xs">
            <FileQuestion className="w-3.5 h-3.5" />
            Questões
          </span>
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

      {/* 3. CONTEÚDO PRINCIPAL: GESTÃO DE QUESTÕES */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">
            <FileQuestion className="w-3.5 h-3.5" />
            Repositório de Questões do CyberCert
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 font-sans">
            Banco de Questões
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Catálogo oficial de itens de múltipla escolha com vínculo canônico por <code className="text-cyan-400 font-mono text-xs">cert_id</code>, balanceamento de dificuldade e gestão de gabaritos.
          </p>
        </div>

        <QuestionsManager initialData={questionsData} />
      </main>
    </div>
  );
}
