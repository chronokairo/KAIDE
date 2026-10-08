/**
 * @layer shared/lib
 * @description Cliente Supabase oficial de produção (chronokairo-prod) para o servidor RAG.
 *
 * Server-side apenas: usa SERVICE_ROLE (bypassa RLS). Todo acesso a dados
 * pessoais é filtrado por organization_id resolvido por membership ativa.
 * Zero mock/fallback offline — fala com produção oficial.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://your-project-ref.supabase.co';

/** Organização padrão (mesmo valor de `@/shared/supabase` PROD_ORGANIZATION_ID). */
export const PROD_ORGANIZATION_ID =
    process.env.CONTROL_PLANE_ORGANIZATION_ID || '00000000-0000-4000-8000-000000000001';

let client: SupabaseClient | undefined;

/** Backend only. SERVICE_ROLE nunca vai para o browser. */
export function getSupabase(): SupabaseClient {
    if (client) return client;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key?.trim()) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for backend operations');
    client = createClient(SUPABASE_URL, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return client;
}

/**
 * Resolve a organização ativa de um usuário (membership ativa mais recente).
 * Retorna null quando o usuário não tem organização — o chamador deve 403.
 */
export async function resolveUserOrganizationId(userId: string | null | undefined): Promise<string | null> {
    if (!userId) return null;
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);
    if (error || !data?.length) return null;
    return (data[0] as { organization_id: string }).organization_id;
}
