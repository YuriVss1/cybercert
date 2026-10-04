'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateQuestionInput {
  cert_id: string;
  domain: string;
  difficulty: 'Low' | 'Medium' | 'High';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  skills?: string[];
  source?: string;
  author?: string;
  review_status?: 'approved' | 'draft' | 'archived';
}

export interface UpdateQuestionInput {
  cert_id?: string;
  domain?: string;
  difficulty?: 'Low' | 'Medium' | 'High';
  question_text?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  skills?: string[];
  source?: string;
  author?: string;
  review_status?: 'approved' | 'draft' | 'archived';
}

export type ActionResponse<T = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string; code?: string };

/**
 * Server Action for creating a new question in the question bank.
 * Enforces canonical cert_id, strict option uniqueness, correct_answer inclusion, and server-side RBAC.
 */
export async function createQuestionAction(
  input: CreateQuestionInput,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ questionId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  // 2. Validações estritas de contrato canônico
  if (!input.cert_id || !UUID_REGEX.test(input.cert_id)) {
    return {
      success: false,
      error: 'A certificação (cert_id) é obrigatória e deve ser um identificador UUID válido.',
      code: 'INVALID_CERT_ID',
    };
  }

  if (!input.domain || typeof input.domain !== 'string' || !input.domain.trim()) {
    return { success: false, error: 'O domínio é obrigatório.', code: 'INVALID_DOMAIN' };
  }

  if (!input.difficulty || !['Low', 'Medium', 'High'].includes(input.difficulty)) {
    return {
      success: false,
      error: 'A dificuldade deve ser estritamente Low, Medium ou High.',
      code: 'INVALID_DIFFICULTY',
    };
  }

  if (!input.question_text || typeof input.question_text !== 'string' || !input.question_text.trim()) {
    return { success: false, error: 'O enunciado da questão é obrigatório.', code: 'INVALID_QUESTION_TEXT' };
  }

  if (!Array.isArray(input.options) || input.options.length < 2) {
    return {
      success: false,
      error: 'A questão deve conter no mínimo duas opções de resposta.',
      code: 'INSUFFICIENT_OPTIONS',
    };
  }

  const trimmedOptions = input.options.map(opt => (typeof opt === 'string' ? opt.trim() : ''));
  if (trimmedOptions.some(opt => !opt)) {
    return {
      success: false,
      error: 'Todas as opções de resposta devem ser preenchidas com texto válido.',
      code: 'EMPTY_OPTION_FOUND',
    };
  }

  // Prevenção de opções duplicadas
  const uniqueOptions = new Set(trimmedOptions);
  if (uniqueOptions.size !== trimmedOptions.length) {
    return {
      success: false,
      error: 'Não são permitidas alternativas duplicadas na mesma questão.',
      code: 'DUPLICATE_OPTIONS',
    };
  }

  if (!input.correct_answer || typeof input.correct_answer !== 'string' || !input.correct_answer.trim()) {
    return { success: false, error: 'A resposta correta é obrigatória.', code: 'INVALID_CORRECT_ANSWER' };
  }

  const trimmedCorrect = input.correct_answer.trim();
  if (!trimmedOptions.includes(trimmedCorrect)) {
    return {
      success: false,
      error: 'A resposta correta deve corresponder exatamente a uma das alternativas cadastradas.',
      code: 'CORRECT_ANSWER_MISMATCH',
    };
  }

  if (!input.explanation || typeof input.explanation !== 'string' || !input.explanation.trim()) {
    return { success: false, error: 'A explicação técnica da questão é obrigatória.', code: 'INVALID_EXPLANATION' };
  }

  const supabase = customClient ?? (await createClient());

  // 3. Validação de existência do cert_id e busca do código legado correspondente
  const { data: certRow, error: certError } = await supabase
    .from('certifications')
    .select('id, code')
    .eq('id', input.cert_id)
    .maybeSingle();

  if (certError || !certRow) {
    return {
      success: false,
      error: 'A certificação especificada não foi encontrada no catálogo.',
      code: 'CERTIFICATION_NOT_FOUND',
    };
  }

  // 4. Montagem do payload de inserção
  const formattedData: Record<string, unknown> = {
    cert_id: input.cert_id,
    certification: certRow.code, // Preserva sincronização retrocompatível da coluna legada
    domain: input.domain.trim(),
    difficulty: input.difficulty,
    question_text: input.question_text.trim(),
    options: JSON.stringify(trimmedOptions),
    correct_answer: trimmedCorrect,
    explanation: input.explanation.trim(),
    review_status: input.review_status || 'approved',
  };

  if (input.skills && Array.isArray(input.skills) && input.skills.length > 0) {
    formattedData.skills = input.skills.map(s => s.trim()).filter(Boolean);
  }

  if (input.source && typeof input.source === 'string' && input.source.trim()) {
    formattedData.source = input.source.trim();
  }

  if (input.author && typeof input.author === 'string' && input.author.trim()) {
    formattedData.author = input.author.trim();
  }

  // 5. Inserção via Supabase Server Client autenticado (RLS enforced)
  const { data, error } = await supabase
    .from('questions')
    .insert([formattedData])
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'Erro ao persistir questão no banco de dados.',
      code: error?.code || 'DATABASE_INSERT_ERROR',
    };
  }

  return {
    success: true,
    questionId: data.id,
  };
}

/**
 * Server Action for updating an existing question.
 * Ensures data integrity between options and correct_answer, verifies cert_id, and protects immutable fields.
 */
export async function updateQuestionAction(
  id: string,
  input: UpdateQuestionInput,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ updatedId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  if (!id || !UUID_REGEX.test(id)) {
    return { success: false, error: 'Identificador de questão inválido.', code: 'INVALID_QUESTION_ID' };
  }

  const supabase = customClient ?? (await createClient());

  // 2. Busca da questão existente para garantir integridade e merge seguro
  const { data: existingQ, error: fetchErr } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !existingQ) {
    return { success: false, error: 'Questão não encontrada para edição.', code: 'QUESTION_NOT_FOUND' };
  }

  const updatePayload: Record<string, unknown> = {};

  // Validação e sincronização de Certificação se enviada
  if (input.cert_id !== undefined) {
    if (!input.cert_id || !UUID_REGEX.test(input.cert_id)) {
      return { success: false, error: 'O cert_id fornecido é inválido.', code: 'INVALID_CERT_ID' };
    }

    const { data: certRow, error: certErr } = await supabase
      .from('certifications')
      .select('id, code')
      .eq('id', input.cert_id)
      .maybeSingle();

    if (certErr || !certRow) {
      return { success: false, error: 'Certificação não encontrada.', code: 'CERTIFICATION_NOT_FOUND' };
    }

    updatePayload.cert_id = input.cert_id;
    updatePayload.certification = certRow.code;
  }

  if (input.domain !== undefined) {
    if (!input.domain || typeof input.domain !== 'string' || !input.domain.trim()) {
      return { success: false, error: 'O domínio não pode ser vazio.', code: 'INVALID_DOMAIN' };
    }
    updatePayload.domain = input.domain.trim();
  }

  if (input.difficulty !== undefined) {
    if (!['Low', 'Medium', 'High'].includes(input.difficulty)) {
      return { success: false, error: 'Dificuldade inválida.', code: 'INVALID_DIFFICULTY' };
    }
    updatePayload.difficulty = input.difficulty;
  }

  if (input.question_text !== undefined) {
    if (!input.question_text || typeof input.question_text !== 'string' || !input.question_text.trim()) {
      return { success: false, error: 'O texto da questão não pode ser vazio.', code: 'INVALID_QUESTION_TEXT' };
    }
    updatePayload.question_text = input.question_text.trim();
  }

  if (input.explanation !== undefined) {
    if (!input.explanation || typeof input.explanation !== 'string' || !input.explanation.trim()) {
      return { success: false, error: 'A explicação não pode ser vazia.', code: 'INVALID_EXPLANATION' };
    }
    updatePayload.explanation = input.explanation.trim();
  }

  if (input.review_status !== undefined) {
    if (!['approved', 'draft', 'archived'].includes(input.review_status)) {
      return { success: false, error: 'Status de revisão inválido.', code: 'INVALID_REVIEW_STATUS' };
    }
    updatePayload.review_status = input.review_status;
  }

  // Validação crítica de consistência entre Options e Correct Answer
  const currentOptions: string[] = input.options !== undefined
    ? input.options
    : (Array.isArray(existingQ.options) ? existingQ.options : JSON.parse(existingQ.options || '[]'));

  const trimmedOptions = currentOptions.map(opt => (typeof opt === 'string' ? opt.trim() : ''));
  if (input.options !== undefined) {
    if (trimmedOptions.length < 2 || trimmedOptions.some(opt => !opt)) {
      return { success: false, error: 'A questão deve conter ao menos duas opções válidas.', code: 'INVALID_OPTIONS' };
    }
    if (new Set(trimmedOptions).size !== trimmedOptions.length) {
      return { success: false, error: 'Não são permitidas alternativas duplicadas.', code: 'DUPLICATE_OPTIONS' };
    }
    updatePayload.options = JSON.stringify(trimmedOptions);
  }

  const targetCorrect = input.correct_answer !== undefined
    ? input.correct_answer.trim()
    : existingQ.correct_answer.trim();

  if (!targetCorrect) {
    return { success: false, error: 'A resposta correta é obrigatória.', code: 'INVALID_CORRECT_ANSWER' };
  }

  if (!trimmedOptions.includes(targetCorrect)) {
    return {
      success: false,
      error: 'A resposta correta deve pertencer às alternativas cadastradas.',
      code: 'CORRECT_ANSWER_MISMATCH',
    };
  }

  if (input.correct_answer !== undefined) {
    updatePayload.correct_answer = targetCorrect;
  }

  if (input.skills !== undefined) {
    updatePayload.skills = Array.isArray(input.skills) ? input.skills.map(s => s.trim()).filter(Boolean) : [];
  }

  if (input.source !== undefined) {
    updatePayload.source = input.source?.trim() || null;
  }

  if (input.author !== undefined) {
    updatePayload.author = input.author?.trim() || null;
  }

  // 3. Execução do UPDATE via cliente Supabase server (RLS enforced)
  const { data, error } = await supabase
    .from('questions')
    .update(updatePayload)
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar questão no banco de dados.',
      code: error?.code || 'DATABASE_UPDATE_ERROR',
    };
  }

  // 4. Se a certificação mudou, remover vínculos de question_skills incompatíveis
  if (input.cert_id !== undefined && input.cert_id !== existingQ.cert_id) {
    await supabase.from('question_skills').delete().eq('question_id', id);
    await supabase.from('questions').update({ skills: [] }).eq('id', id);
  }

  return {
    success: true,
    updatedId: data.id,
  };
}

/**
 * Server Action for soft-deleting (archiving) a question.
 * Preserves relational integrity with user_question_attempts and exam_history.
 */
export async function archiveQuestionAction(
  id: string,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ archivedId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  if (!id || !UUID_REGEX.test(id)) {
    return { success: false, error: 'Identificador de questão inválido.', code: 'INVALID_QUESTION_ID' };
  }

  const supabase = customClient ?? (await createClient());

  // 2. Soft-delete: atualiza review_status para 'archived'
  const { data, error } = await supabase
    .from('questions')
    .update({ review_status: 'archived' })
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'Erro ao arquivar questão.',
      code: error?.code || 'DATABASE_ARCHIVE_ERROR',
    };
  }

  return {
    success: true,
    archivedId: data.id,
  };
}

// ============================================================================
// PHASE 2.4A: SKILLS CORE SERVER ACTIONS
// ============================================================================

export interface CreateSkillInput {
  cert_id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateSkillInput {
  name: string;
  slug: string;
  description?: string;
}

import { normalizeSkillSlug } from '@/lib/admin/skills-data';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Cria uma nova Skill canônica vinculada a uma certificação.
 */
export async function createSkillAction(
  input: CreateSkillInput,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ skillId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  // 2. Validações de cert_id
  if (!input.cert_id || !UUID_REGEX.test(input.cert_id)) {
    return {
      success: false,
      error: 'A certificação (cert_id) é obrigatória e deve ser um UUID válido.',
      code: 'INVALID_CERT_ID',
    };
  }

  // 3. Validações de name
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    return {
      success: false,
      error: 'O nome da Skill é obrigatório.',
      code: 'INVALID_SKILL_NAME',
    };
  }

  // 4. Validações e normalização de slug
  const normalizedSlug = normalizeSkillSlug(input.slug || input.name);
  if (!normalizedSlug || !SLUG_REGEX.test(normalizedSlug)) {
    return {
      success: false,
      error: 'O slug informado é inválido. Utilize apenas letras minúsculas, números e hífens.',
      code: 'INVALID_SLUG',
    };
  }

  const supabase = customClient ?? (await createClient());

  // 5. Validar existência da certificação
  const { data: certData, error: certError } = await supabase
    .from('certifications')
    .select('id')
    .eq('id', input.cert_id)
    .maybeSingle();

  if (certError || !certData) {
    return {
      success: false,
      error: 'A certificação especificada não existe no catálogo oficial.',
      code: 'CERTIFICATION_NOT_FOUND',
    };
  }

  // 6. Validar unicidade UNIQUE(cert_id, slug)
  const { data: existingSkill } = await supabase
    .from('skills')
    .select('id')
    .eq('cert_id', input.cert_id)
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (existingSkill) {
    return {
      success: false,
      error: `Já existe uma Skill com o slug "${normalizedSlug}" cadastrada para esta certificação.`,
      code: 'DUPLICATE_SKILL_SLUG',
    };
  }

  // 7. Inserir Skill
  const { data: newSkill, error: insertError } = await supabase
    .from('skills')
    .insert([
      {
        cert_id: input.cert_id,
        name: input.name.trim(),
        slug: normalizedSlug,
        description: input.description?.trim() || null,
      },
    ])
    .select('id')
    .single();

  if (insertError || !newSkill) {
    return {
      success: false,
      error: insertError?.message || 'Erro ao criar skill no banco de dados.',
      code: insertError?.code || 'DATABASE_INSERT_ERROR',
    };
  }

  return {
    success: true,
    skillId: newSkill.id,
  };
}

/**
 * Atualiza os metadados de uma Skill existente (nome, slug, descrição).
 */
export async function updateSkillAction(
  id: string,
  input: UpdateSkillInput,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ skillId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  if (!id || !UUID_REGEX.test(id)) {
    return { success: false, error: 'Identificador de skill inválido.', code: 'INVALID_SKILL_ID' };
  }

  // 2. Validações de name
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    return {
      success: false,
      error: 'O nome da Skill é obrigatório.',
      code: 'INVALID_SKILL_NAME',
    };
  }

  // 3. Validações de slug
  const normalizedSlug = normalizeSkillSlug(input.slug || input.name);
  if (!normalizedSlug || !SLUG_REGEX.test(normalizedSlug)) {
    return {
      success: false,
      error: 'O slug informado é inválido. Utilize apenas letras minúsculas, números e hífens.',
      code: 'INVALID_SLUG',
    };
  }

  const supabase = customClient ?? (await createClient());

  // 4. Buscar skill atual para verificar cert_id
  const { data: currentSkill, error: fetchError } = await supabase
    .from('skills')
    .select('id, cert_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !currentSkill) {
    return {
      success: false,
      error: 'Skill não encontrada para atualização.',
      code: 'SKILL_NOT_FOUND',
    };
  }

  // 5. Verificar colisão de UNIQUE(cert_id, slug) com outro registro
  const { data: conflictSkill } = await supabase
    .from('skills')
    .select('id')
    .eq('cert_id', currentSkill.cert_id)
    .eq('slug', normalizedSlug)
    .neq('id', id)
    .maybeSingle();

  if (conflictSkill) {
    return {
      success: false,
      error: `Já existe outra Skill com o slug "${normalizedSlug}" nesta certificação.`,
      code: 'DUPLICATE_SKILL_SLUG',
    };
  }

  // 6. Executar update
  const { data: updated, error: updateError } = await supabase
    .from('skills')
    .update({
      name: input.name.trim(),
      slug: normalizedSlug,
      description: input.description !== undefined ? (input.description.trim() || null) : undefined,
    })
    .eq('id', id)
    .select('id')
    .single();

  if (updateError || !updated) {
    return {
      success: false,
      error: updateError?.message || 'Erro ao atualizar skill.',
      code: updateError?.code || 'DATABASE_UPDATE_ERROR',
    };
  }

  return {
    success: true,
    skillId: updated.id,
  };
}

/**
 * Exclui uma Skill somente se não houver questões vinculadas a ela em public.question_skills.
 */
export async function deleteSkillAction(
  id: string,
  customClient?: SupabaseClient
): Promise<ActionResponse<{ deletedId: string }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  if (!id || !UUID_REGEX.test(id)) {
    return { success: false, error: 'Identificador de skill inválido.', code: 'INVALID_SKILL_ID' };
  }

  const supabase = customClient ?? (await createClient());

  // 2. Verificar se a Skill existe
  const { data: skillData, error: skillError } = await supabase
    .from('skills')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (skillError || !skillData) {
    return {
      success: false,
      error: 'A Skill informada não foi encontrada.',
      code: 'SKILL_NOT_FOUND',
    };
  }

  // 3. Verificar vínculos em public.question_skills
  const { count: linkedCount, error: countError } = await supabase
    .from('question_skills')
    .select('*', { count: 'exact', head: true })
    .eq('skill_id', id);

  if (countError) {
    return {
      success: false,
      error: `Erro ao verificar vínculos da skill: ${countError.message}`,
      code: 'DATABASE_QUERY_ERROR',
    };
  }

  if (linkedCount && linkedCount > 0) {
    return {
      success: false,
      error: `Exclusão bloqueada: a Skill "${skillData.name}" possui ${linkedCount} questão(ões) vinculada(s). Desvincule as questões antes de excluir a Skill.`,
      code: 'SKILL_HAS_LINKED_QUESTIONS',
    };
  }

  // 4. Executar delete seguro (sem vínculos)
  const { error: deleteError } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message || 'Erro ao excluir a skill no banco de dados.',
      code: deleteError.code || 'DATABASE_DELETE_ERROR',
    };
  }

  return {
    success: true,
    deletedId: id,
  };
}

// ============================================================================
// PHASE 2.4B: QUESTION ↔ SKILL CANONICAL INTEGRATION
// ============================================================================

/**
 * Associa um conjunto de Skills a uma Questão específica.
 * Esta é a ÚNICA operação responsável pela associação canônica Question ↔ Skill.
 * Regras:
 * 1. requireAdmin()
 * 2. Valida UUID da questão e confirma existência
 * 3. Valida array de skillIds (elimina duplicatas, valida UUIDs)
 * 4. Verifica que TODOS os skillIds existem
 * 5. Verifica que TODOS os skills pertencem à MESMA certificação da questão (skill.cert_id === question.cert_id)
 *    Se qualquer skill pertencer a outra certificação, rejeita toda a operação.
 * 6. Sincroniza public.question_skills como fonte de verdade (remove não presentes, insere novas)
 * 7. Atualiza o cache de compatibilidade public.questions.skills com os slugs ordenados deterministicamente.
 */
export async function setQuestionSkillsAction(
  questionId: string,
  skillIds: string[],
  customClient?: SupabaseClient
): Promise<ActionResponse<{ questionId: string; syncedSkills: string[] }>> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { success: false, error: err.message, code: err.code };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  // 2. Validação do questionId
  if (!questionId || !UUID_REGEX.test(questionId)) {
    return {
      success: false,
      error: 'Identificador de questão inválido.',
      code: 'INVALID_QUESTION_ID',
    };
  }

  // 3. Validação dos skillIds fornecidos
  if (!Array.isArray(skillIds)) {
    return {
      success: false,
      error: 'O parâmetro skillIds deve ser um array.',
      code: 'INVALID_SKILL_IDS',
    };
  }

  const cleanSkillIds = Array.from(new Set(skillIds.map(s => String(s).trim()).filter(Boolean)));
  for (const sId of cleanSkillIds) {
    if (!UUID_REGEX.test(sId)) {
      return {
        success: false,
        error: `O identificador de skill "${sId}" não é um UUID válido.`,
        code: 'INVALID_SKILL_ID',
      };
    }
  }

  const supabase = customClient ?? (await createClient());

  // 4. Buscar a questão e verificar cert_id
  const { data: questionData, error: qErr } = await supabase
    .from('questions')
    .select('id, cert_id')
    .eq('id', questionId)
    .maybeSingle();

  if (qErr || !questionData) {
    return {
      success: false,
      error: 'Questão não encontrada para associação de skills.',
      code: 'QUESTION_NOT_FOUND',
    };
  }

  if (!questionData.cert_id) {
    if (cleanSkillIds.length > 0) {
      return {
        success: false,
        error: 'Esta questão possui dados legados sem certificação canônica (cert_id = null). Vincule uma certificação válida antes de associar skills.',
        code: 'QUESTION_HAS_NO_CERT_ID',
      };
    }
  }

  // 5. Se houver skillIds, verificar que todos existem e pertencem à MESMA certificação da questão
  let canonicalSlugs: string[] = [];
  if (cleanSkillIds.length > 0) {
    const { data: skillsRows, error: sErr } = await supabase
      .from('skills')
      .select('id, slug, cert_id')
      .in('id', cleanSkillIds);

    if (sErr || !skillsRows) {
      return {
        success: false,
        error: `Erro ao consultar catálogo de skills: ${sErr?.message || 'Dados indisponíveis'}`,
        code: 'DATABASE_QUERY_ERROR',
      };
    }

    if (skillsRows.length !== cleanSkillIds.length) {
      return {
        success: false,
        error: 'Uma ou mais Skills selecionadas não existem no catálogo oficial.',
        code: 'SKILL_NOT_FOUND',
      };
    }

    // Regra canônica estrita: skill.cert_id === question.cert_id
    for (const skill of skillsRows) {
      if (skill.cert_id !== questionData.cert_id) {
        return {
          success: false,
          error: `Incompatibilidade de certificação: a Skill "${skill.slug}" pertence a outra certificação e não pode ser associada a esta questão.`,
          code: 'CERTIFICATION_MISMATCH',
        };
      }
    }

    // Slugs canônicos em ordem determinística
    canonicalSlugs = skillsRows
      .map(s => s.slug)
      .sort((a, b) => a.localeCompare(b));
  }

  // 6. Atualização Relacional em public.question_skills
  // Obter vínculos atuais
  const { data: currentLinks, error: currentLinksErr } = await supabase
    .from('question_skills')
    .select('skill_id')
    .eq('question_id', questionId);

  if (currentLinksErr) {
    return {
      success: false,
      error: `Erro ao consultar vínculos atuais da questão: ${currentLinksErr.message}`,
      code: 'DATABASE_QUERY_ERROR',
    };
  }

  const currentSkillIds = new Set((currentLinks || []).map(l => l.skill_id));
  const targetSkillIds = new Set(cleanSkillIds);

  const toAdd = cleanSkillIds.filter(id => !currentSkillIds.has(id));
  const toRemove = Array.from(currentSkillIds).filter(id => !targetSkillIds.has(id));

  // Remover desmarcadas
  if (toRemove.length > 0) {
    const { error: removeErr } = await supabase
      .from('question_skills')
      .delete()
      .eq('question_id', questionId)
      .in('skill_id', toRemove);

    if (removeErr) {
      return {
        success: false,
        error: `Erro ao desvincular skills: ${removeErr.message}`,
        code: 'DATABASE_DELETE_ERROR',
      };
    }
  }

  // Inserir novas
  if (toAdd.length > 0) {
    const newRows = toAdd.map(skill_id => ({
      question_id: questionId,
      skill_id,
    }));

    const { error: insertErr } = await supabase
      .from('question_skills')
      .insert(newRows);

    if (insertErr) {
      return {
        success: false,
        error: `Erro ao vincular novas skills: ${insertErr.message}`,
        code: 'DATABASE_INSERT_ERROR',
      };
    }
  }

  // 7. Atualização do cache de compatibilidade public.questions.skills
  const { error: cacheErr } = await supabase
    .from('questions')
    .update({ skills: canonicalSlugs })
    .eq('id', questionId);

  if (cacheErr) {
    return {
      success: false,
      error: `Vínculos relacionais atualizados, mas falha ao atualizar cache em questions.skills: ${cacheErr.message}`,
      code: 'CACHE_SYNC_ERROR',
    };
  }

  return {
    success: true,
    questionId,
    syncedSkills: canonicalSlugs,
  };
}

