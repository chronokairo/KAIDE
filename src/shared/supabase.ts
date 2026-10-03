// Supabase Client Oficial de Produção para ChronoKairo AI (chronokairo-prod: your-project-ref)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'REDACTED_SUPABASE_JWT';

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'REDACTED_SUPABASE_JWT';

/** ID da Organização Oficial ChronoKairo no Supabase de Produção */
export const PROD_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';

/** ID do Usuário Sócio / Tech Lead no Supabase de Produção */
export const PROD_USER_ID = '00000000-0000-4000-8000-000000000002';

/** Cliente Supabase autenticado via Chave Pública (Anon) */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Cliente Supabase com Chave de Serviço Administrativa para rotas de backend e auditoria */
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function getAuthSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return {
      access_token: data.session.access_token,
      user: data.session.user,
    };
  } catch {
    return null;
  }
}
