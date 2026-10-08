import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/infrastructure/persistence/supabase-admin';
import { authenticate, auditLog, authRequiredResponse } from '../../../_lib/auth';
import { getClientIp, handleRouteError } from '../../../_lib/http';
import { generalLimit, personDataLimit, strictLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/pessoa/:codigo - Consulta de pessoa por id (uuid) no Supabase
 * prod (customers). Protegida, isolada por organização.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    const limited = generalLimit(request) ?? strictLimit(request) ?? personDataLimit(request);
    if (limited) return limited;

    const userId = authenticate(request, request.nextUrl.pathname);
    if (!userId) return authRequiredResponse();
    auditLog(request);

    const { codigo } = await params;

    if (!codigo || codigo.length > 64) {
        logger.warn('API', `Código de pessoa inválido: ${codigo}`, { ip: getClientIp(request) });
        return NextResponse.json(
            { success: false, error: 'Código de pessoa inválido', code: 'INVALID_CODE' },
            { status: 400 }
        );
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data: memberships } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .limit(1);
        if (!memberships?.length) {
            return NextResponse.json(
                { success: false, error: 'Usuário sem organização ativa', code: 'NO_ACTIVE_ORG' },
                { status: 403 }
            );
        }
        const organizationId = (memberships[0] as { organization_id: string }).organization_id;

        const { data: customer, error } = await supabase
            .from('customers')
            .select('id, name, nome_fantasia, documento, email, phone, tipo, status, segmento, cidade, created_at')
            .eq('organization_id', organizationId)
            .eq('id', codigo)
            .maybeSingle();

        if (error) throw error;
        if (!customer) {
            return NextResponse.json(
                { success: false, error: 'Pessoa não encontrada', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: customer });
    } catch (error) {
        return handleRouteError(error, `pessoa/${codigo}`);
    }
}
