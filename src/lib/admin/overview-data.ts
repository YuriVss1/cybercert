import type { SupabaseClient } from '@supabase/supabase-js';

export interface QueryResult<T> {
  status: 'success' | 'error' | 'empty';
  data?: T;
  error?: string;
}

export interface QuestionsMetric {
  total: number;
  byDifficulty: {
    Low: number;
    Medium: number;
    High: number;
    [key: string]: number;
  };
  byDomain: Record<string, number>;
}

export interface SkillItem {
  id: string;
  name: string;
  slug: string;
  cert_id: string | null;
  cert_code?: string;
}

export interface SkillsMetric {
  total: number;
  linkedToCertCount: number;
  items: SkillItem[];
}

export interface ExamSessionItem {
  id: string;
  score: number;
  passed: boolean;
  exam_type: string;
  created_at: string;
  cert_id?: string | null;
  cert_code?: string;
}

export interface ExamHistoryMetric {
  total: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
  recentExams: ExamSessionItem[];
}

export interface AdminUserItem {
  user_id: string;
  role: string;
  created_at: string;
}

export interface OperatorsMetric {
  total: number;
  roles: Record<string, number>;
  currentOperatorRole: string;
  operators: AdminUserItem[];
}

export interface CertificationItem {
  id: string;
  code: string;
  name: string;
}

export interface AdminOverviewPayload {
  questions: QueryResult<QuestionsMetric>;
  skills: QueryResult<SkillsMetric>;
  attempts: QueryResult<{ total: number }>;
  exams: QueryResult<ExamHistoryMetric>;
  operators: QueryResult<OperatorsMetric>;
  certifications: QueryResult<CertificationItem[]>;
}

/**
 * Server-side loader for the Admin Overview dashboard.
 * Executes queries against Supabase using the authenticated server client with active session cookies.
 * RLS is strictly enforced. No service_role key is used.
 * Captures granular query status (success, empty, error) without masking failures.
 */
export async function getAdminOverviewData(
  supabase: SupabaseClient,
  currentUserId: string
): Promise<AdminOverviewPayload> {
  // 1. Consultar Certificações (usada também para enriquecer vínculos)
  const certsMap = new Map<string, string>();
  let certsResult: QueryResult<CertificationItem[]>;

  try {
    const { data: certsData, error: certsError } = await supabase
      .from('certifications')
      .select('id, code, name')
      .order('code');

    if (certsError) {
      certsResult = { status: 'error', error: certsError.message };
    } else if (!certsData || certsData.length === 0) {
      certsResult = { status: 'empty', data: [] };
    } else {
      certsData.forEach(c => certsMap.set(c.id, c.code));
      certsResult = { status: 'success', data: certsData };
    }
  } catch (err: unknown) {
    certsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar certificações',
    };
  }

  // 2. Consultar Questões (distribuição real de dificuldade e domínios)
  let questionsResult: QueryResult<QuestionsMetric>;
  try {
    const { data: qData, count: qCount, error: qError } = await supabase
      .from('questions')
      .select('domain, difficulty', { count: 'exact' });

    if (qError) {
      questionsResult = { status: 'error', error: qError.message };
    } else if (!qData || qData.length === 0) {
      questionsResult = {
        status: 'empty',
        data: { total: 0, byDifficulty: { Low: 0, Medium: 0, High: 0 }, byDomain: {} },
      };
    } else {
      const byDifficulty: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
      const byDomain: Record<string, number> = {};

      for (const q of qData) {
        if (q.difficulty) {
          byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
        }
        if (q.domain) {
          byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
        }
      }

      questionsResult = {
        status: 'success',
        data: {
          total: qCount ?? qData.length,
          byDifficulty: {
            Low: byDifficulty['Low'] || 0,
            Medium: byDifficulty['Medium'] || 0,
            High: byDifficulty['High'] || 0,
          },
          byDomain,
        },
      };
    }
  } catch (err: unknown) {
    questionsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar questões',
    };
  }

  // 3. Consultar Skills (conceitos técnicos reais)
  let skillsResult: QueryResult<SkillsMetric>;
  try {
    const { data: skData, count: skCount, error: skError } = await supabase
      .from('skills')
      .select('id, name, slug, cert_id', { count: 'exact' })
      .order('name');

    if (skError) {
      skillsResult = { status: 'error', error: skError.message };
    } else if (!skData || skData.length === 0) {
      skillsResult = {
        status: 'empty',
        data: { total: 0, linkedToCertCount: 0, items: [] },
      };
    } else {
      let linkedCount = 0;
      const items: SkillItem[] = skData.map(sk => {
        if (sk.cert_id) linkedCount++;
        return {
          id: sk.id,
          name: sk.name,
          slug: sk.slug,
          cert_id: sk.cert_id,
          cert_code: sk.cert_id ? certsMap.get(sk.cert_id) : undefined,
        };
      });

      skillsResult = {
        status: 'success',
        data: {
          total: skCount ?? skData.length,
          linkedToCertCount: linkedCount,
          items,
        },
      };
    }
  } catch (err: unknown) {
    skillsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar skills',
    };
  }

  // 4. Consultar Tentativas Granulares de Questões
  let attemptsResult: QueryResult<{ total: number }>;
  try {
    const { count: attCount, error: attError } = await supabase
      .from('user_question_attempts')
      .select('id', { count: 'exact', head: true });

    if (attError) {
      attemptsResult = { status: 'error', error: attError.message };
    } else {
      attemptsResult = {
        status: (attCount ?? 0) > 0 ? 'success' : 'empty',
        data: { total: attCount ?? 0 },
      };
    }
  } catch (err: unknown) {
    attemptsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar tentativas',
    };
  }

  // 5. Consultar Histórico de Exames
  let examsResult: QueryResult<ExamHistoryMetric>;
  try {
    const { data: ehData, count: ehCount, error: ehError } = await supabase
      .from('exam_history')
      .select('id, score, passed, exam_type, created_at, cert_id', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (ehError) {
      examsResult = { status: 'error', error: ehError.message };
    } else if (!ehData || ehData.length === 0) {
      examsResult = {
        status: 'empty',
        data: {
          total: 0,
          passedCount: 0,
          failedCount: 0,
          averageScore: 0,
          recentExams: [],
        },
      };
    } else {
      let passedCount = 0;
      let totalScore = 0;

      for (const row of ehData) {
        if (row.passed) passedCount++;
        totalScore += typeof row.score === 'number' ? row.score : 0;
      }

      const total = ehCount ?? ehData.length;
      const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

      const recentExams: ExamSessionItem[] = ehData.slice(0, 5).map(row => ({
        id: row.id,
        score: row.score,
        passed: Boolean(row.passed),
        exam_type: row.exam_type || 'official',
        created_at: row.created_at,
        cert_id: row.cert_id,
        cert_code: row.cert_id ? certsMap.get(row.cert_id) : undefined,
      }));

      examsResult = {
        status: 'success',
        data: {
          total,
          passedCount,
          failedCount: total - passedCount,
          averageScore,
          recentExams,
        },
      };
    }
  } catch (err: unknown) {
    examsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar histórico de exames',
    };
  }

  // 6. Consultar Administradores Provisionados (admin_users)
  let operatorsResult: QueryResult<OperatorsMetric>;
  try {
    const { data: auData, count: auCount, error: auError } = await supabase
      .from('admin_users')
      .select('user_id, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: true });

    if (auError) {
      operatorsResult = { status: 'error', error: auError.message };
    } else if (!auData || auData.length === 0) {
      operatorsResult = {
        status: 'empty',
        data: {
          total: 0,
          roles: {},
          currentOperatorRole: 'Desconhecido',
          operators: [],
        },
      };
    } else {
      const roles: Record<string, number> = {};
      let currentRole = 'admin';

      for (const op of auData) {
        roles[op.role] = (roles[op.role] || 0) + 1;
        if (op.user_id === currentUserId) {
          currentRole = op.role;
        }
      }

      operatorsResult = {
        status: 'success',
        data: {
          total: auCount ?? auData.length,
          roles,
          currentOperatorRole: currentRole,
          operators: auData.map(op => ({
            user_id: op.user_id,
            role: op.role,
            created_at: op.created_at,
          })),
        },
      };
    }
  } catch (err: unknown) {
    operatorsResult = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Falha ao consultar administradores',
    };
  }

  return {
    questions: questionsResult,
    skills: skillsResult,
    attempts: attemptsResult,
    exams: examsResult,
    operators: operatorsResult,
    certifications: certsResult,
  };
}
