'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  RotateCcw,
  Layers,
} from 'lucide-react';
import type { AdminQuestionItem, AdminQuestionsResult } from '@/lib/admin/questions-data';
import {
  createQuestionAction,
  updateQuestionAction,
  archiveQuestionAction,
  setQuestionSkillsAction,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '@/app/admin/actions';

interface QuestionsManagerProps {
  initialData: AdminQuestionsResult;
}

export function QuestionsManager({ initialData }: QuestionsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estados locais para formulário de filtro
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Estados dos Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionItem | null>(null);
  const [archivingQuestion, setArchivingQuestion] = useState<AdminQuestionItem | null>(null);

  // Estado dos campos do formulário de criação/edição
  const [formCertId, setFormCertId] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formReviewStatus, setFormReviewStatus] = useState<'approved' | 'draft' | 'archived'>('approved');
  const [formSelectedSkillIds, setFormSelectedSkillIds] = useState<string[]>([]);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualização de Query Params na URL para filtros server-side
  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Retorna à primeira página ao filtrar
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParam('search', searchTerm.trim() || null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Abrir Modal de Criação
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormCertId(initialData.certifications[0]?.id || '');
    setFormDomain(initialData.availableDomains[0] || 'Conceitos gerais de segurança');
    setFormDifficulty('Medium');
    setFormQuestionText('');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex(0);
    setFormExplanation('');
    setFormReviewStatus('approved');
    setFormSelectedSkillIds([]);
    setFormErrorMessage('');
    setFormSuccessMessage('');
    setIsFormOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (q: AdminQuestionItem) => {
    setEditingQuestion(q);
    setFormCertId(q.cert_id || initialData.certifications[0]?.id || '');
    setFormDomain(q.domain);
    setFormDifficulty(q.difficulty);
    setFormQuestionText(q.question_text);
    
    const opts = q.options.length >= 2 ? [...q.options] : ['', '', '', ''];
    while (opts.length < 4) opts.push('');
    setFormOptions(opts);

    const correctIdx = opts.findIndex(o => o.trim() === q.correct_answer.trim());
    setFormCorrectIndex(correctIdx >= 0 ? correctIdx : 0);

    setFormExplanation(q.explanation);
    setFormReviewStatus((q.review_status as 'approved' | 'draft' | 'archived') || 'approved');
    setFormSelectedSkillIds(q.skill_ids || []);
    setFormErrorMessage('');
    setFormSuccessMessage('');
    setIsFormOpen(true);
  };

  // Submissão do Formulário (Create ou Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage('');
    setFormSuccessMessage('');

    // Validações básicas no client
    const cleanOptions = formOptions.map(o => o.trim()).filter(Boolean);
    if (!formCertId) {
      setFormErrorMessage('A certificação é obrigatória.');
      return;
    }
    if (!formDomain.trim()) {
      setFormErrorMessage('O domínio é obrigatório.');
      return;
    }
    if (!formQuestionText.trim()) {
      setFormErrorMessage('O enunciado da questão é obrigatório.');
      return;
    }
    if (cleanOptions.length < 2) {
      setFormErrorMessage('A questão deve conter ao menos duas alternativas válidas.');
      return;
    }
    if (new Set(cleanOptions).size !== cleanOptions.length) {
      setFormErrorMessage('Não são permitidas alternativas duplicadas.');
      return;
    }

    const selectedCorrectAnswer = formOptions[formCorrectIndex]?.trim();
    if (!selectedCorrectAnswer) {
      setFormErrorMessage('A resposta correta selecionada não pode ser vazia.');
      return;
    }
    if (!cleanOptions.includes(selectedCorrectAnswer)) {
      setFormErrorMessage('A resposta correta deve pertencer às alternativas cadastradas.');
      return;
    }
    if (!formExplanation.trim()) {
      setFormErrorMessage('A explicação técnica é obrigatória.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingQuestion) {
        // UPDATE QUESTION
        const updatePayload: UpdateQuestionInput = {
          cert_id: formCertId,
          domain: formDomain.trim(),
          difficulty: formDifficulty,
          question_text: formQuestionText.trim(),
          options: cleanOptions,
          correct_answer: selectedCorrectAnswer,
          explanation: formExplanation.trim(),
          review_status: formReviewStatus,
        };

        const result = await updateQuestionAction(editingQuestion.id, updatePayload);
        if (!result.success) {
          setFormErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }

        // Se a certificação mudou, as skills incompatíveis foram limpas no updateQuestionAction.
        // Se a cert for mantida ou alterada, sincronizar com o estado atual do seletor:
        const targetSkills = formCertId !== editingQuestion.cert_id ? [] : formSelectedSkillIds;
        const skillsResult = await setQuestionSkillsAction(editingQuestion.id, targetSkills);
        if (!skillsResult.success) {
          setFormErrorMessage(`Questão atualizada, mas falha ao vincular skills: ${skillsResult.error}`);
          setIsSubmitting(false);
          return;
        }

        setFormSuccessMessage('Questão e skills atualizadas com sucesso!');
        setTimeout(() => {
          setIsFormOpen(false);
          router.refresh();
        }, 800);
      } else {
        // CREATE QUESTION
        const createPayload: CreateQuestionInput = {
          cert_id: formCertId,
          domain: formDomain.trim(),
          difficulty: formDifficulty,
          question_text: formQuestionText.trim(),
          options: cleanOptions,
          correct_answer: selectedCorrectAnswer,
          explanation: formExplanation.trim(),
          review_status: formReviewStatus,
        };

        const result = await createQuestionAction(createPayload);
        if (!result.success) {
          setFormErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }

        // Vincular skills selecionadas se houver
        if (formSelectedSkillIds.length > 0) {
          const skillsResult = await setQuestionSkillsAction(result.questionId, formSelectedSkillIds);
          if (!skillsResult.success) {
            setFormErrorMessage(`Questão criada, mas falha ao associar skills: ${skillsResult.error}`);
            setIsSubmitting(false);
            return;
          }
        }

        setFormSuccessMessage('Questão cadastrada com sucesso!');
        setTimeout(() => {
          setIsFormOpen(false);
          router.refresh();
        }, 800);
      }
    } catch {
      setFormErrorMessage('Ocorreu uma falha inesperada na comunicação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submissão do Arquivamento (Soft-Delete)
  const handleConfirmArchive = async () => {
    if (!archivingQuestion) return;
    setIsSubmitting(true);

    try {
      const result = await archiveQuestionAction(archivingQuestion.id);
      if (result.success) {
        setArchivingQuestion(null);
        router.refresh();
      } else {
        alert(`Erro ao arquivar questão: ${result.error}`);
      }
    } catch {
      alert('Falha inesperada ao tentar arquivar questão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCertFilter = searchParams.get('cert_id') || 'all';
  const currentDomainFilter = searchParams.get('domain') || 'all';
  const currentDifficultyFilter = searchParams.get('difficulty') || 'all';
  const currentStatusFilter = searchParams.get('review_status') || 'all';

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE COMANDO SUPERIOR: BUSCA E FILTROS */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Busca textual */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por enunciado ou palavra-chave..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded-lg transition-colors border border-zinc-700/50"
            >
              Buscar
            </button>
          </form>

          {/* Botão de Nova Questão */}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-md shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            Nova Questão
          </button>
        </div>

        {/* Dropdowns de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/60 font-mono text-xs">
          {/* Filtro Certificação */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Certificação
            </label>
            <select
              value={currentCertFilter}
              onChange={e => updateQueryParam('cert_id', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">Todas as certificações</option>
              {initialData.certifications.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
              <option value="none">⚠️ Sem Certificação (Legado)</option>
            </select>
          </div>

          {/* Filtro Domínio */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Domínio
            </label>
            <select
              value={currentDomainFilter}
              onChange={e => updateQueryParam('domain', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs focus:outline-none focus:border-cyan-500/50 truncate"
            >
              <option value="all">Todos os domínios</option>
              {initialData.availableDomains.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Dificuldade */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Dificuldade
            </label>
            <select
              value={currentDifficultyFilter}
              onChange={e => updateQueryParam('difficulty', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">Todas as dificuldades</option>
              <option value="Low">Low (Fácil)</option>
              <option value="Medium">Medium (Média)</option>
              <option value="High">High (Difícil)</option>
            </select>
          </div>

          {/* Filtro Status */}
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Status de Revisão
            </label>
            <div className="flex items-center gap-2">
              <select
                value={currentStatusFilter}
                onChange={e => updateQueryParam('review_status', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 text-xs focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">Todos os status</option>
                <option value="approved">Aprovada (approved)</option>
                <option value="draft">Rascunho (draft)</option>
                <option value="archived">Arquivada (archived)</option>
              </select>

              {(searchParams.toString() !== '' && searchParams.toString() !== 'page=1') && (
                <button
                  onClick={handleClearFilters}
                  title="Limpar todos os filtros"
                  className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABELA DE QUESTÕES */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">Total encontrado:</span>
            <strong className="text-zinc-100">{initialData.total}</strong>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Página:</span>
            <strong className="text-cyan-400">
              {initialData.page} de {Math.max(1, initialData.totalPages)}
            </strong>
          </div>

          {isPending && (
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Atualizando lista...
            </span>
          )}
        </div>

        {initialData.status === 'error' ? (
          <div className="p-8 text-center space-y-3 font-mono">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-400">{initialData.error}</p>
          </div>
        ) : initialData.questions.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <FileQuestion className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400">Nenhuma questão encontrada para os filtros aplicados.</p>
            <button
              onClick={handleClearFilters}
              className="text-xs text-cyan-400 hover:underline pt-2 inline-block"
            >
              Limpar filtros de busca
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Certificação</th>
                  <th className="py-3 px-4">Domínio</th>
                  <th className="py-3 px-4">Dificuldade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enunciado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {initialData.questions.map(q => {
                  const isExpanded = expandedQuestionId === q.id;

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-zinc-800/25 transition-colors ${
                        isExpanded ? 'bg-zinc-800/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          title={isExpanded ? 'Recolher detalhes' : 'Ver alternativas e explicação'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {q.cert_id ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              q.cert_code === 'SY0-701'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                : q.cert_code === '200-301'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            }`}
                          >
                            {q.cert_code || 'Válida'}
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            title="Esta questão possui cert_id NULL (Legado). Não participa do simulado oficial até que seja editada."
                          >
                            Sem Cert (Legado)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-300 max-w-[200px] truncate" title={q.domain}>
                        {q.domain}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            q.difficulty === 'High'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            q.review_status === 'archived'
                              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              : q.review_status === 'draft'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {q.review_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-200 max-w-[320px]">
                        <p className="truncate" title={q.question_text}>
                          {q.question_text}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(q)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors border border-zinc-700/50"
                          title="Editar questão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {q.review_status !== 'archived' && (
                          <button
                            onClick={() => setArchivingQuestion(q)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-amber-950/40 text-zinc-400 hover:text-amber-400 transition-colors border border-zinc-700/50 hover:border-amber-500/40"
                            title="Arquivar questão (Soft Delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. PAINEL EXPANSÍVEL DE DETALHES DA QUESTÃO SELECIONADA */}
        {expandedQuestionId && (
          (() => {
            const q = initialData.questions.find(x => x.id === expandedQuestionId);
            if (!q) return null;

            return (
              <div className="p-6 bg-zinc-950/80 border-t border-zinc-800/80 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 text-[11px] uppercase font-bold">
                    Detalhes Técnicos da Questão [ID: {q.id}]
                  </span>
                  <button
                    onClick={() => setExpandedQuestionId(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-200 leading-relaxed font-sans text-sm">
                  {q.question_text}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt.trim() === q.correct_answer.trim();

                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isCorrect
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Gabarito
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                    Fundamentação / Explicação
                  </span>
                  <p className="text-zinc-400 font-sans text-xs leading-relaxed">
                    {q.explanation}
                  </p>
                </div>

                {/* Skills vinculadas */}
                <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                      Skills / Conceitos Associados
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      ({q.skill_ids.length} vinculada{q.skill_ids.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {q.skill_ids.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">
                      Nenhuma skill canônica vinculada a esta questão.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {q.skill_ids.map(sId => {
                        const allSkills = Object.values(initialData.availableSkillsByCert).flat();
                        const found = allSkills.find(s => s.id === sId);
                        return (
                          <span
                            key={sId}
                            className="px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-1.5"
                          >
                            <span>{found?.name || sId}</span>
                            {found && <span className="text-purple-500 text-[10px]">#{found.slug}</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 4. CONTROLES DE PAGINAÇÃO */}
        {initialData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-800/80 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-500">
              Exibindo {(initialData.page - 1) * initialData.pageSize + 1} a{' '}
              {Math.min(initialData.page * initialData.pageSize, initialData.total)} de {initialData.total}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1 || isPending}
                onClick={() => handlePageChange(initialData.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 transition-colors flex items-center gap-1 border border-zinc-700/50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages || isPending}
                onClick={() => handlePageChange(initialData.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 transition-colors flex items-center gap-1 border border-zinc-700/50"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL DE CRIAÇÃO / EDIÇÃO DE QUESTÃO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-sans">
                  {editingQuestion ? 'Editar Questão' : 'Cadastrar Nova Questão'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {editingQuestion ? `Identificador: ${editingQuestion.id}` : 'Inserção canônica vinculada a cert_id'}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formErrorMessage}</span>
              </div>
            )}

            {formSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Certificação Canônica */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                    Certificação (cert_id) *
                  </label>
                  <select
                    value={formCertId}
                    onChange={e => setFormCertId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="" disabled>Selecione uma certificação</option>
                    {initialData.certifications.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dificuldade */}
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                    Dificuldade *
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={e => setFormDifficulty(e.target.value as 'Low' | 'Medium' | 'High')}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Low">Low (Fácil)</option>
                    <option value="Medium">Medium (Média)</option>
                    <option value="High">High (Difícil)</option>
                  </select>
                </div>
              </div>

              {/* Domínio */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                  Domínio da Certificação *
                </label>
                <input
                  type="text"
                  value={formDomain}
                  onChange={e => setFormDomain(e.target.value)}
                  placeholder="Ex: Arquitetura de segurança"
                  required
                  list="domain-datalist"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                />
                <datalist id="domain-datalist">
                  {initialData.availableDomains.map(d => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                  Enunciado da Questão *
                </label>
                <textarea
                  value={formQuestionText}
                  onChange={e => setFormQuestionText(e.target.value)}
                  placeholder="Descreva o cenário e a pergunta técnica..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-sans text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Alternativas e Gabarito */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                    Alternativas & Seleção de Gabarito *
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Selecione a opção que será a resposta correta
                  </span>
                </div>

                <div className="space-y-2">
                  {formOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-answer-radio"
                        checked={formCorrectIndex === i}
                        onChange={() => setFormCorrectIndex(i)}
                        title="Marcar como gabarito correto"
                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                      />
                      <span className="w-5 text-zinc-400 font-bold">
                        {String.fromCharCode(65 + i)}:
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const nextOpts = [...formOptions];
                          nextOpts[i] = e.target.value;
                          setFormOptions(nextOpts);
                        }}
                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + i)}`}
                        required={i < 2}
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50 text-xs"
                      />
                      {formOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpts = formOptions.filter((_, idx) => idx !== i);
                            setFormOptions(nextOpts);
                            if (formCorrectIndex >= nextOpts.length) {
                              setFormCorrectIndex(0);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400"
                          title="Remover alternativa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {formOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setFormOptions([...formOptions, ''])}
                    className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar outra alternativa
                  </button>
                )}
              </div>

              {/* Explicação */}
              <div className="pt-2">
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                  Explicação Técnica / Pedagógica *
                </label>
                <textarea
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  placeholder="Fundamentação teórica do acerto e das razões de descarte dos distratores..."
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-sans text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Status de Revisão */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                  Status de Governança
                </label>
                <select
                  value={formReviewStatus}
                  onChange={e => setFormReviewStatus(e.target.value as 'approved' | 'draft' | 'archived')}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="approved">Aprovada (participa de novos simulados)</option>
                  <option value="draft">Rascunho (em elaboração)</option>
                  <option value="archived">Arquivada (inativa)</option>
                </select>
              </div>

              {/* Seção SKILLS / COMPETÊNCIAS */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <label className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold">
                      SKILLS / COMPETÊNCIAS
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {formSelectedSkillIds.length} selecionada{formSelectedSkillIds.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Vincule conceitos técnicos canônicos da certificação selecionada a esta questão para telemetria adaptativa.
                </p>

                {(() => {
                  const availableSkills = initialData.availableSkillsByCert[formCertId] || [];

                  if (availableSkills.length === 0) {
                    return (
                      <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-[11px] text-zinc-500 italic">
                        Nenhuma skill canônica cadastrada para esta certificação. Cadastre novas skills em Gestão de Skills.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {availableSkills.map(skill => {
                        const isSelected = formSelectedSkillIds.includes(skill.id);

                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormSelectedSkillIds(formSelectedSkillIds.filter(id => id !== skill.id));
                              } else {
                                setFormSelectedSkillIds([...formSelectedSkillIds, skill.id]);
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
                                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 rounded border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate leading-tight">
                                {skill.name}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                                #{skill.slug}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-zinc-950 font-bold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Gravando...' : editingQuestion ? 'Salvar Alterações' : 'Criar Questão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CONFIRMAÇÃO DE ARQUIVAMENTO (SOFT-DELETE) */}
      {archivingQuestion && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Archive className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100 font-sans">
                Arquivar esta questão?
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed">
                Ela deixará de participar de novos simulados e sessões de treino, mas o histórico existente de tentativas e exames dos alunos será <strong className="text-zinc-200">preservado integralmente</strong>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
              <p className="truncate font-sans text-xs mb-1 text-zinc-200">
                &ldquo;{archivingQuestion.question_text}&rdquo;
              </p>
              <span className="text-[10px] text-zinc-500">ID: {archivingQuestion.id}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setArchivingQuestion(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 font-bold rounded-lg text-xs font-mono transition-colors"
              >
                {isSubmitting ? 'Arquivando...' : 'Confirmar Arquivamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
