'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin, AdminAuthError } from '@/lib/admin/require-admin';

export interface CreateQuestionInput {
  domain: string;
  difficulty: 'Low' | 'Medium' | 'High';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  cert_id?: string;
  skills?: string[];
  source?: string;
  author?: string;
  review_status?: string;
}

export type CreateQuestionResult =
  | { success: true; questionId: string }
  | { success: false; error: string; code?: string };

/**
 * Server Action for creating a new question in the question bank.
 * 
 * Flow:
 * 1. requireAdmin() gatekeeper validates active session & canonical public.is_admin() privilege.
 * 2. Validates incoming payload contract.
 * 3. Inserts into public.questions using authenticated server Supabase client (RLS enforced).
 * 4. Returns structured result { success, questionId } or { success, error, code }.
 */
export async function createQuestionAction(
  input: CreateQuestionInput,
  customClient?: SupabaseClient
): Promise<CreateQuestionResult> {
  // 1. Autorização administrativa server-side
  try {
    await requireAdmin(customClient);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return {
        success: false,
        error: err.message,
        code: err.code,
      };
    }
    return {
      success: false,
      error: 'Falha na verificação de autorização administrativa.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }

  // 2. Validação dos campos obrigatórios conforme contrato existente
  if (!input.question_text || typeof input.question_text !== 'string' || !input.question_text.trim()) {
    return { success: false, error: 'O texto da questão é obrigatório.', code: 'INVALID_QUESTION_TEXT' };
  }

  if (!input.domain || typeof input.domain !== 'string' || !input.domain.trim()) {
    return { success: false, error: 'O domínio é obrigatório.', code: 'INVALID_DOMAIN' };
  }

  if (!input.difficulty || !['Low', 'Medium', 'High'].includes(input.difficulty)) {
    return { success: false, error: 'A dificuldade deve ser Low, Medium ou High.', code: 'INVALID_DIFFICULTY' };
  }

  if (!Array.isArray(input.options) || input.options.length < 2 || input.options.some(opt => !opt || typeof opt !== 'string' || !opt.trim())) {
    return { success: false, error: 'A questão deve conter pelo menos duas opções válidas.', code: 'INVALID_OPTIONS' };
  }

  if (!input.correct_answer || typeof input.correct_answer !== 'string' || !input.correct_answer.trim()) {
    return { success: false, error: 'A resposta correta é obrigatória.', code: 'INVALID_CORRECT_ANSWER' };
  }

  if (!input.explanation || typeof input.explanation !== 'string' || !input.explanation.trim()) {
    return { success: false, error: 'A explicação da questão é obrigatória.', code: 'INVALID_EXPLANATION' };
  }

  // 3. Montagem do payload preservando a serialização de options
  const formattedData: Record<string, unknown> = {
    domain: input.domain.trim(),
    difficulty: input.difficulty,
    question_text: input.question_text.trim(),
    options: JSON.stringify(input.options.map(o => o.trim())),
    correct_answer: input.correct_answer.trim(),
    explanation: input.explanation.trim(),
  };

  if (input.cert_id) {
    formattedData.cert_id = input.cert_id;
  }

  if (input.skills && Array.isArray(input.skills) && input.skills.length > 0) {
    formattedData.skills = input.skills.map(s => s.trim()).filter(Boolean);
  }

  if (input.source) {
    formattedData.source = input.source;
  }

  if (input.author) {
    formattedData.author = input.author;
  }

  if (input.review_status) {
    formattedData.review_status = input.review_status;
  }

  // 4. Execução do INSERT através do cliente server autenticado (RLS enforced)
  const supabase = customClient ?? (await createClient());

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
