import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  FileQuestion,
  Layers,
  Users,
  Lock,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';
import { createClient } from '@/lib/supabase-server';
import { getAdminSkills } from '@/lib/admin/skills-data';
import { SkillsManager } from '@/components/admin/SkillsManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSkillsPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;
  const certIdParam = typeof resolvedSearchParams.cert_id === 'string' ? resolvedSearchParams.cert_id : undefined;

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
              Privilégios administrativos necessários para gerenciar o catálogo de Skills.
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

  // Carregar dados de skills com filtro opcional
  const skillsData = await getAdminSkills(supabase, certIdParam);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background Decorativo Suave */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="border-b border-zinc-800/80 bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-widest font-mono text-zinc-200 group-hover:text-white transition-colors">
                      CYBERCERT
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/50">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                    SKILLS & CONCEPTS REPOSITORY
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-400">Operador:</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[150px]">
                  {adminContext.user.email}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RBAC Canônico
                </span>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
              >
                <span>Plataforma</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
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
            <Link
              href="/admin/questions"
              className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              Questões
            </Link>
            <span className="px-3 py-1.5 rounded-md bg-zinc-800 text-purple-400 font-semibold flex items-center gap-2 border border-purple-500/30 shadow-xs">
              <Layers className="w-3.5 h-3.5" />
              Skills & Conceitos
            </span>
            <span className="px-3 py-1.5 rounded-md text-zinc-400 flex items-center gap-2 opacity-60 cursor-not-allowed">
              <Users className="w-3.5 h-3.5" />
              Operadores
              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Fase 2.5
              </span>
            </span>
          </div>
        </nav>

        {/* Conteúdo Principal */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          {/* Header do Módulo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase">
                  Catálogo Pedagógico
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  Skills Canônicas
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1 font-mono">
                Gestão de Skills & Conceitos
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Repositório canônico de conceitos técnicos vinculados a certificações. Cada Skill representa uma competência granular mapeável para questões de exame.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Total de Skills</p>
                <p className="text-lg font-bold font-mono text-white">{skillsData.total}</p>
              </div>
            </div>
          </div>

          {/* Erro de Carregamento */}
          {skillsData.status === 'error' && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs text-red-300 font-mono flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold">Erro ao carregar repositório de skills</p>
                <p className="text-zinc-400 mt-0.5">{skillsData.error}</p>
              </div>
            </div>
          )}

          {/* Gerenciador de Skills */}
          <SkillsManager initialData={skillsData} />
        </main>
      </div>
    </div>
  );
}
