import { NextRequest, NextResponse } from 'next/server';
import { validateCPF } from '@/server/rag/shared/lib/validation';
import { getSupabaseAdmin } from '@/infrastructure/persistence/supabase-admin';
import { authenticate, auditLog, authRequiredResponse } from '../../../../_lib/auth';
import { getClientIp, handleRouteError } from '../../../../_lib/http';
import { generalLimit, personDataLimit, strictLimit } from '../../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/pessoa/cpf/:cpf - Consulta de pessoa por CPF no Supabase prod
 * (customers por documento + contacts). Protegida, isolada por organização.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cpf: string }> }
) {
    const limited = generalLimit(request) ?? strictLimit(request) ?? personDataLimit(request);
    if (limited) return limited;

    const userId = authenticate(request, request.nextUrl.pathname);
    if (!userId) return authRequiredResponse();
    auditLog(request);

    const { cpf } = await params;

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        logger.warn('API', `CPF inválido: ${cpf}`, { ip: getClientIp(request) });
        return NextResponse.json(
            { success: false, error: 'CPF inválido', code: 'INVALID_CPF' },
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
            .eq('documento', cpfValidation.cleaned)
            .maybeSingle();

        if (error) throw error;
        if (!customer) {
            return NextResponse.json(
                { success: false, error: 'Pessoa não encontrada', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, phone, job_title, is_primary')
            .eq('organization_id', organizationId)
            .eq('customer_id', (customer as { id: string }).id);

        return NextResponse.json({ success: true, data: { ...customer, contacts: contacts || [] } });
    } catch (error) {
        return handleRouteError(error, `pessoa/cpf/${cpfValidation.cleaned}`);
    }
}
