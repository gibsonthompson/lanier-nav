import { createClient } from '@supabase/supabase-js';

// These are public — safe to expose in the browser.
// Set them in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-only, never expose)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set — running in offline/seed mode');
}

// Browser client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'placeholder');

// Server client (uses service role key, bypasses RLS — only use in API routes)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(supabaseUrl, serviceKey);
}