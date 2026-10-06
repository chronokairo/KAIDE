/**
 * Cliente Supabase Oficial de Produção (chronokairo-prod: eufyppwpnxmxeinabwyi).
 * 
 * ATENÇÃO: Este módulo NÃO é mock nem fallback offline.
 * Ele conecta diretamente ao banco PostgreSQL gerenciado da ChronoKairo no AWS sa-east-1.
 * Todas as leituras e escritas são executadas em produção oficial.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eufyppwpnxmxeinabwyi.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZnlwcHdwbnhteGVpbmFid3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTI1MjIsImV4cCI6MjEwMTg4ODUyMn0.CoOa4ofKbscoQ20JAHlo4cw6cg-YAs9BSy0doy72DO4';


/** ID da Organização Oficial ChronoKairo no Supabase de Produção */
export const PROD_ORGANIZATION_ID = 'e0f6b749-d7b9-5ea8-9b80-c1d919bf7aaf';

/** ID do Usuário Sócio / Tech Lead no Supabase de Produção */
export const PROD_USER_ID = '50e35fa5-3bbb-4769-ac0d-b8d13738056b';

/** Cliente Supabase autenticado via Chave Pública (Anon) */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
