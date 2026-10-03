import { redirect } from 'next/navigation';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';

export default async function AdminPage() {
  let adminContext;

  try {
    adminContext = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      if (error.code === 'UNAUTHENTICATED') {
        redirect('/');
      }

      // FORBIDDEN — Usuário autenticado sem privilégio administrativo
      return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-xl p-6 text-center">
            <h1 className="text-xl font-bold text-red-400 mb-2">Acesso Negado</h1>
            <p className="text-sm text-zinc-400 mb-6">
              Privilégios administrativos necessários para acessar esta área.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors"
            >
              Voltar ao Início
            </a>
          </div>
        </main>
      );
    }
    throw error;
  }

  const { user } = adminContext;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-zinc-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Fronteira de Segurança Server-Side
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-md">
            Acesso Autorizado
          </span>
        </header>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block">
              Operador Autenticado
            </span>
            <span className="text-sm text-zinc-200 font-mono">
              {user.email}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block">
              ID do Usuário
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {user.id}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block">
              Status de Autorização
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              Verificado via public.is_admin() [RBAC canônico]
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
