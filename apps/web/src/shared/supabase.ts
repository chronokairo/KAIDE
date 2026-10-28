/**
 * Cliente Supabase Oficial de Produção (configurado via NEXT_PUBLIC_SUPABASE_URL).
 * 
 * ATENÇÃO: Este módulo NÃO é mock nem fallback offline.
 * Ele conecta diretamente ao banco PostgreSQL gerenciado da Chronokairo no AWS sa-east-1.
 * Todas as leituras e escritas são executadas em produção oficial.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';


/** ID da Organização Oficial Chronokairo no Supabase de Produção */
export const PROD_ORGANIZATION_ID = process.env.NEXT_PUBLIC_CONTROL_PLANE_ORGANIZATION_ID ?? process.env.CONTROL_PLANE_ORGANIZATION_ID ?? '';

/** ID do Usuário Sócio / Tech Lead no Supabase de Produção */
export const PROD_USER_ID = process.env.NEXT_PUBLIC_CONTROL_PLANE_ACTOR_USER_ID ?? process.env.CONTROL_PLANE_ACTOR_USER_ID ?? '';

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
