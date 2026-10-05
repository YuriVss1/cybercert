import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Migrate legacy localStorage session to cookies if present
if (typeof window !== 'undefined') {
  try {
    const urlParts = supabaseUrl.split('//')[1]?.split('.');
    const projectRef = urlParts ? urlParts[0] : null;
    const storageKey = projectRef ? `sb-${projectRef}-auth-token` : null;

    if (storageKey) {
      const raw = localStorage.getItem(storageKey);
      if (raw && !document.cookie.includes(storageKey)) {
        const parsed = JSON.parse(raw);
        if (parsed?.access_token && parsed?.refresh_token) {
          supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          }).catch(() => {
            // Silently ignore if session is expired or invalid
          });
        }
      }
    }
  } catch {
    // Ignore migration failures
  }
}