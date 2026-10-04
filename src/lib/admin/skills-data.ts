import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminSkillItem {
  id: string;
  cert_id: string;
  cert_code?: string;
  cert_name?: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  question_count: number;
}

export interface AdminSkillsResult {
  skills: AdminSkillItem[];
  total: number;
  certifications: Array<{ id: string; code: string; name: string }>;
  status: 'success' | 'empty' | 'error';
  error?: string;
}

/**
 * Normaliza uma string em slug canônico seguro (letras minúsculas, números e hífens).
 */
export function normalizeSkillSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Carrega a lista administrativa de skills em public.skills, com contagem real de question_skills
 * e metadados da certificação vinculada.
 * Suporta filtro opcional por cert_id.
 */
export async function getAdminSkills(
  supabase: SupabaseClient,
  certIdFilter?: string
): Promise<AdminSkillsResult> {
  try {
    // 1. Carregar certificações reais para dropdown e joins
    const { data: certsData, error: certsError } = await supabase
      .from('certifications')
      .select('id, code, name')
      .order('code');

    if (certsError) {
      return {
        skills: [],
        total: 0,
        certifications: [],
        status: 'error',
        error: `Falha ao carregar certificações: ${certsError.message}`,
      };
    }

    const certMap = new Map<string, { code: string; name: string }>();
    certsData?.forEach(c => certMap.set(c.id, { code: c.code, name: c.name }));

    // 2. Montar query de skills
    let query = supabase
      .from('skills')
      .select('id, cert_id, name, slug, description, created_at')
      .order('name');

    if (certIdFilter && certIdFilter !== 'all') {
      query = query.eq('cert_id', certIdFilter);
    }

    const { data: skillsData, error: skillsError } = await query;

    if (skillsError) {
      return {
        skills: [],
        total: 0,
        certifications: certsData || [],
        status: 'error',
        error: `Falha ao carregar skills: ${skillsError.message}`,
      };
    }

    if (!skillsData || skillsData.length === 0) {
      return {
        skills: [],
        total: 0,
        certifications: certsData || [],
        status: 'empty',
      };
    }

    // 3. Obter contagem de vínculos em question_skills
    const skillIds = skillsData.map(s => s.id);
    const { data: qsData, error: qsError } = await supabase
      .from('question_skills')
      .select('skill_id')
      .in('skill_id', skillIds);

    const countMap: Record<string, number> = {};
    if (!qsError && qsData) {
      qsData.forEach(row => {
        countMap[row.skill_id] = (countMap[row.skill_id] || 0) + 1;
      });
    }

    // 4. Mapear itens formatados
    const items: AdminSkillItem[] = skillsData.map(s => {
      const cert = s.cert_id ? certMap.get(s.cert_id) : undefined;
      return {
        id: s.id,
        cert_id: s.cert_id,
        cert_code: cert?.code,
        cert_name: cert?.name,
        name: s.name,
        slug: s.slug,
        description: s.description || null,
        created_at: s.created_at,
        question_count: countMap[s.id] || 0,
      };
    });

    return {
      skills: items,
      total: items.length,
      certifications: certsData || [],
      status: 'success',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro inesperado ao consultar skills.';
    return {
      skills: [],
      total: 0,
      certifications: [],
      status: 'error',
      error: message,
    };
  }
}
