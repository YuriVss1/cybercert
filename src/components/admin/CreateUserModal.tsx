'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { adminCreateUserAction } from '@/app/admin/actions';

export function CreateUserModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    email: string;
    password?: string;
    role: string;
  } | null>(null);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('user');
    setErrorMessage(null);
    setSuccessData(null);
    setCopied(false);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    resetForm();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    if (!successData?.password) return;
    const text = `E-mail: ${successData.email}\nSenha: ${successData.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe o e-mail do operador.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    startTransition(async () => {
      const savedPassword = password;
      const response = await adminCreateUserAction({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      });

      if (response.success) {
        setSuccessData({
          email: response.email,
          password: savedPassword,
          role: response.assignedRole,
        });
        router.refresh();
      } else {
        setErrorMessage(response.error || 'Falha ao criar operador.');
      }
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors shadow-xs"
        title="Provisionar novo usuário ou operador"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>+ Novo Operador</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    Provisionar Novo Usuário
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                      Auth Instantâneo
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Crie credenciais no Supabase com ativação operacional imediata.
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Feedback de Sucesso */}
              {successData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Conta criada e ativada com sucesso!</span>
                    </div>
                    <p className="text-xs text-emerald-200/80 leading-relaxed font-mono">
                      O usuário já está confirmado no Supabase Auth e pode realizar login imediatamente na tela inicial.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400 uppercase text-[10px]">Credenciais Provisionadas</span>
                      <button
                        onClick={handleCopyCredentials}
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Dados</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-zinc-400">E-mail:</span>
                      <span className="col-span-2 text-zinc-100 font-bold select-all">{successData.email}</span>

                      <span className="text-zinc-400">Senha:</span>
                      <span className="col-span-2 text-zinc-100 font-bold select-all">{successData.password}</span>

                      <span className="text-zinc-400">Papel:</span>
                      <span className="col-span-2 text-cyan-400 uppercase font-bold">{successData.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={resetForm}
                      type="button"
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                    >
                      Provisionar Outro
                    </button>
                    <button
                      onClick={handleClose}
                      type="button"
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs font-mono transition-colors"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulário de Criação */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Nome do Operador (Opcional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Ex: Operador Silva"
                        disabled={isPending}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-cyan-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                      E-mail de Acesso <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="operador@cybercert.local"
                        disabled={isPending}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-cyan-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Senha com Gerador */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Senha Temporária / Definitiva <span className="text-cyan-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        Gerar Senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        disabled={isPending}
                        className="w-full pl-9 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-cyan-500 transition-colors disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        aria-label="Alternar exibição de senha"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Seleção de Perfil / Papel */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Privilégio de Acesso
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-3 rounded-lg border cursor-pointer text-xs font-mono transition-all flex flex-col justify-between ${
                          role === 'user'
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">Operador (Padrão)</span>
                          <input
                            type="radio"
                            name="role"
                            value="user"
                            checked={role === 'user'}
                            onChange={() => setRole('user')}
                            className="sr-only"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Acesso a simulados, Cyber Core e treinos.
                        </span>
                      </label>

                      <label
                        className={`p-3 rounded-lg border cursor-pointer text-xs font-mono transition-all flex flex-col justify-between ${
                          role === 'admin'
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3 text-cyan-400" />
                            Admin
                          </span>
                          <input
                            type="radio"
                            name="role"
                            value="admin"
                            checked={role === 'admin'}
                            onChange={() => setRole('admin')}
                            className="sr-only"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Flight Deck, gerenciar questões e catálogo.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isPending}
                      className="px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-mono transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-cyan-950 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisionando...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Criar Operador</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
