'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { AdminSkillItem, AdminSkillsResult, normalizeSkillSlug } from '@/lib/admin/skills-data';
import {
  createSkillAction,
  updateSkillAction,
  deleteSkillAction,
  CreateSkillInput,
  UpdateSkillInput,
} from '@/app/admin/actions';

interface SkillsManagerProps {
  initialData: AdminSkillsResult;
}

export function SkillsManager({ initialData }: SkillsManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filtro de certificação
  const [selectedCertFilter, setSelectedCertFilter] = useState<string>('all');

  // Modais de Criação / Edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AdminSkillItem | null>(null);

  // Modal de Exclusão
  const [deletingSkill, setDeletingSkill] = useState<AdminSkillItem | null>(null);

  // Campos do formulário
  const [formCertId, setFormCertId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtragem dos itens exibidos
  const displayedSkills = initialData.skills.filter(s => {
    if (selectedCertFilter === 'all') return true;
    return s.cert_id === selectedCertFilter;
  });

  const openCreateModal = () => {
    setEditingSkill(null);
    setFormCertId(initialData.certifications[0]?.id || '');
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormErrorMessage('');
    setFormSuccessMessage('');
    setIsFormOpen(true);
  };

  const openEditModal = (skill: AdminSkillItem) => {
    setEditingSkill(skill);
    setFormCertId(skill.cert_id);
    setFormName(skill.name);
    setFormSlug(skill.slug);
    setFormDescription(skill.description || '');
    setFormErrorMessage('');
    setFormSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingSkill) {
      // Auto-gera slug apenas na criação
      setFormSlug(normalizeSkillSlug(name));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrorMessage('');
    setFormSuccessMessage('');

    if (!formName.trim()) {
      setFormErrorMessage('O nome da Skill é obrigatório.');
      setIsSubmitting(false);
      return;
    }

    if (!formSlug.trim()) {
      setFormErrorMessage('O slug é obrigatório.');
      setIsSubmitting(false);
      return;
    }

    if (!editingSkill && !formCertId) {
      setFormErrorMessage('Selecione uma certificação válida.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingSkill) {
        const payload: UpdateSkillInput = {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || undefined,
        };
        const res = await updateSkillAction(editingSkill.id, payload);
        if (res.success) {
          setFormSuccessMessage('Skill atualizada com sucesso!');
          setTimeout(() => {
            setIsFormOpen(false);
            startTransition(() => router.refresh());
          }, 800);
        } else {
          setFormErrorMessage(res.error || 'Erro ao atualizar skill.');
        }
      } else {
        const payload: CreateSkillInput = {
          cert_id: formCertId,
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || undefined,
        };
        const res = await createSkillAction(payload);
        if (res.success) {
          setFormSuccessMessage('Skill cadastrada com sucesso!');
          setTimeout(() => {
            setIsFormOpen(false);
            startTransition(() => router.refresh());
          }, 800);
        } else {
          setFormErrorMessage(res.error || 'Erro ao criar skill.');
        }
      }
    } catch {
      setFormErrorMessage('Erro de comunicação ao salvar skill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSkill) return;
    setIsSubmitting(true);
    setFormErrorMessage('');

    try {
      const res = await deleteSkillAction(deletingSkill.id);
      if (res.success) {
        setDeletingSkill(null);
        startTransition(() => router.refresh());
      } else {
        setFormErrorMessage(res.error || 'Falha ao excluir skill.');
      }
    } catch {
      setFormErrorMessage('Erro inesperado ao excluir skill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Certificação:</span>
            <select
              value={selectedCertFilter}
              onChange={e => setSelectedCertFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-purple-500 font-mono transition-colors"
            >
              <option value="all">Todas as Certificações</option>
              {initialData.certifications.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">
            {displayedSkills.length} skill{displayedSkills.length !== 1 ? 's' : ''} encontrada{displayedSkills.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nova Skill
          </button>
        </div>
      </div>

      {/* Grid de Skills */}
      {displayedSkills.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-200 font-mono">Nenhuma Skill Encontrada</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Não existem skills cadastradas para o filtro selecionado. Use o botão acima para registrar uma nova skill canônica.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedSkills.map(skill => (
            <div
              key={skill.id}
              className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-xl group space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/40 text-[10px] font-mono text-purple-300 font-semibold tracking-wider">
                    {skill.cert_code || 'SEM CERT'}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
                    <FileQuestion className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{skill.question_count} questão(ões)</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-100 tracking-tight group-hover:text-purple-300 transition-colors">
                    {skill.name}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    slug: {skill.slug}
                  </p>
                </div>

                {skill.description ? (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600 italic">Sem descrição registrada.</p>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-zinc-600 font-mono">
                  {new Date(skill.created_at).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(skill)}
                    className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    title="Editar Skill"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setFormErrorMessage('');
                      setDeletingSkill(skill);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      skill.question_count > 0
                        ? 'bg-zinc-800/30 text-zinc-600 cursor-not-allowed'
                        : 'bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20'
                    }`}
                    title={
                      skill.question_count > 0
                        ? 'Não é possível excluir: possui questões vinculadas'
                        : 'Excluir Skill'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  {editingSkill ? 'Editar Skill Canônica' : 'Nova Skill Canônica'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formErrorMessage}</span>
              </div>
            )}

            {formSuccessMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Certificação Vinculada <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={Boolean(editingSkill)}
                  value={formCertId}
                  onChange={e => setFormCertId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 font-mono disabled:opacity-50"
                  required
                >
                  {initialData.certifications.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {editingSkill && (
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    A certificação de uma Skill existente não pode ser alterada para preservar integridade.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Nome da Skill <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex: Criptografia Assimétrica & PKI"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Slug Canônico <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={e => setFormSlug(normalizeSkillSlug(e.target.value))}
                  placeholder="Ex: criptografia-assimetrica-pki"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 font-mono"
                  required
                />
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Identificador único por certificação: apenas letras minúsculas, números e hífens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Descrição Pedagógica <span className="text-zinc-600">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Explicação do conceito técnico coberto por esta skill..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-purple-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                  {editingSkill ? 'Salvar Alterações' : 'Criar Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Excluir Skill</h3>
                <p className="text-xs text-zinc-400 font-mono">Confirmação de operação administrativa</p>
              </div>
            </div>

            {formErrorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 font-mono">
                {formErrorMessage}
              </div>
            )}

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono space-y-1">
              <p>
                <span className="text-zinc-500">Nome:</span> {deletingSkill.name}
              </p>
              <p>
                <span className="text-zinc-500">Slug:</span> {deletingSkill.slug}
              </p>
              <p>
                <span className="text-zinc-500">Certificação:</span> {deletingSkill.cert_code}
              </p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Esta ação removerá permanentemente a Skill do catálogo. Como a Skill não possui questões vinculadas, a exclusão é segura.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSkill(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
