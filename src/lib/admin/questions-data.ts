import type { SupabaseClient } from '@supabase/supabase-js';

export interface QuestionSkillMeta {
  id: string;
  name: string;
  slug: string;
  cert_id: string;
}

export interface AdminQuestionItem {
  id: string;
  cert_id: string | null;
  certification: string | null;
  cert_code?: string;
  cert_name?: string;
  domain: string;
  difficulty: 'Low' | 'Medium' | 'High';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  review_status: string;
  skills: string[];
  skill_ids: string[];
  source?: string | null;
  author?: string | null;
}

export interface AdminQuestionsFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  cert_id?: string;
  domain?: string;
  difficulty?: string;
  review_status?: string;
}

export interface AdminQuestionsResult {
  questions: AdminQuestionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  certifications: Array<{ id: string; code: string; name: string }>;
  availableDomains: string[];
  availableSkillsByCert: Record<string, QuestionSkillMeta[]>;
  status: 'success' | 'empty' | 'error';
  error?: string;
}

export async function getAdminQuestions(
  supabase: SupabaseClient,
  params: AdminQuestionsFilterParams = {}
): Promise<AdminQuestionsResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 15));

  try {
    // 1. Carregar Certificações Reais
    const { data: certsData, error: certsError } = await supabase
      .from('certifications')
      .select('id, code, name')
      .order('code');

    if (certsError) {
      return {
        questions: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        certifications: [],
        availableDomains: [],
        availableSkillsByCert: {},
        status: 'error',
        error: `Falha ao carregar certificações: ${certsError.message}`,
      };
    }

    const certsMap = new Map<string, { code: string; name: string }>();
    certsData?.forEach(c => certsMap.set(c.id, { code: c.code, name: c.name }));

    // 2. Carregar Skills Canônicas agrupadas por cert_id
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name, slug, cert_id')
      .order('name');

    const availableSkillsByCert: Record<string, QuestionSkillMeta[]> = {};
    skillsData?.forEach(s => {
      if (s.cert_id) {
        if (!availableSkillsByCert[s.cert_id]) {
          availableSkillsByCert[s.cert_id] = [];
        }
        availableSkillsByCert[s.cert_id].push({
          id: s.id,
          name: s.name,
          slug: s.slug,
          cert_id: s.cert_id,
        });
      }
    });

    // 3. Carregar Lista Global de Domínios para os Filtros
    const { data: domainRows } = await supabase
      .from('questions')
      .select('domain');
    
    const availableDomains = Array.from(
      new Set(domainRows?.map(r => r.domain).filter(Boolean) || [])
    ).sort();

    // 4. Montagem da Query Filtrada de Questões
    let query = supabase.from('questions').select('*', { count: 'exact' });

    // Filtro de Busca Textual (enunciado ou ID)
    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      query = query.ilike('question_text', `%${term}%`);
    }

    // Filtro de Certificação (suporta 'none' para os 8 registros legados com cert_id NULL)
    if (params.cert_id) {
      if (params.cert_id === 'none') {
        query = query.is('cert_id', null);
      } else {
        query = query.eq('cert_id', params.cert_id);
      }
    }

    // Filtro de Domínio
    if (params.domain) {
      query = query.eq('domain', params.domain);
    }

    // Filtro de Dificuldade
    if (params.difficulty) {
      query = query.eq('difficulty', params.difficulty);
    }

    // Filtro de Status de Revisão
    if (params.review_status) {
      query = query.eq('review_status', params.review_status);
    }

    // Paginação
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    const { data: rows, count, error: qError } = await query
      .order('id', { ascending: true })
      .range(startRange, endRange);

    if (qError) {
      return {
        questions: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        certifications: certsData || [],
        availableDomains,
        availableSkillsByCert,
        status: 'error',
        error: `Erro ao consultar questões: ${qError.message}`,
      };
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // 5. Carregar vínculos de question_skills para as questões retornadas nesta página
    const questionIds = (rows || []).map(r => r.id);
    const questionSkillsMap = new Map<string, string[]>();

    if (questionIds.length > 0) {
      const { data: qsRows } = await supabase
        .from('question_skills')
        .select('question_id, skill_id')
        .in('question_id', questionIds);

      qsRows?.forEach(qs => {
        const arr = questionSkillsMap.get(qs.question_id) || [];
        arr.push(qs.skill_id);
        questionSkillsMap.set(qs.question_id, arr);
      });
    }

    const questions: AdminQuestionItem[] = (rows || []).map(r => {
      let parsedOptions: string[] = [];
      if (Array.isArray(r.options)) {
        parsedOptions = r.options;
      } else if (typeof r.options === 'string') {
        try {
          parsedOptions = JSON.parse(r.options);
        } catch {
          parsedOptions = [r.options];
        }
      }

      const certInfo = r.cert_id ? certsMap.get(r.cert_id) : undefined;
      const associatedSkillIds = questionSkillsMap.get(r.id) || [];

      return {
        id: r.id,
        cert_id: r.cert_id,
        certification: r.certification,
        cert_code: certInfo?.code || r.certification || undefined,
        cert_name: certInfo?.name,
        domain: r.domain,
        difficulty: r.difficulty || 'Medium',
        question_text: r.question_text,
        options: parsedOptions,
        correct_answer: r.correct_answer,
        explanation: r.explanation,
        review_status: r.review_status || 'approved',
        skills: Array.isArray(r.skills) ? r.skills : [],
        skill_ids: associatedSkillIds,
        source: r.source,
        author: r.author,
      };
    });

    return {
      questions,
      total,
      page,
      pageSize,
      totalPages,
      certifications: certsData || [],
      availableDomains,
      availableSkillsByCert,
      status: total === 0 ? 'empty' : 'success',
    };
  } catch (err: unknown) {
    return {
      questions: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      certifications: [],
      availableDomains: [],
      availableSkillsByCert: {},
      status: 'error',
      error: err instanceof Error ? err.message : 'Erro interno ao consultar questões',
    };
  }
}
