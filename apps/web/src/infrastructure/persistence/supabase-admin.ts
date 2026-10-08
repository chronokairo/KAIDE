import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '@/shared/supabase';

let client: SupabaseClient | undefined;

/** Backend only. Deployment credentials must never be included in browser modules. */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for backend operations');
  client = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
