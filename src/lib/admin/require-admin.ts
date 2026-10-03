import { User, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../supabase-server';

export class AdminAuthError extends Error {
  readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN';

  constructor(
    message: string,
    code: 'UNAUTHENTICATED' | 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AdminAuthError';
    this.code = code;
  }
}

export interface AdminContext {
  user: User;
  isAdmin: true;
}

/**
 * Server-Side Admin Boundary helper.
 * Validates:
 * 1. Active authenticated user session via server client cookies.
 * 2. Canonical administrative authority via database RPC public.is_admin().
 * 
 * Never relies on client metadata (user_metadata, app_metadata) or hardcoded email.
 * Rejects immediately if unauthenticated or non-admin.
 */
export async function requireAdmin(customClient?: SupabaseClient): Promise<AdminContext> {
  const supabase = customClient ?? (await createClient());

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AdminAuthError(
      'Authentication required: No valid session found',
      'UNAUTHENTICATED'
    );
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

  if (rpcError || !isAdmin) {
    throw new AdminAuthError(
      'Access denied: Administrative privileges required',
      'FORBIDDEN'
    );
  }

  return {
    user,
    isAdmin: true,
  };
}
