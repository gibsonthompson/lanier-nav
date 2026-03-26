import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized — never runs at build time
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// For backwards compat — same as getSupabase() but accessed as property
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabase() as any)[prop]; },
});

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase env vars not set (need URL + service role key)');
  return createClient(url, serviceKey);
}