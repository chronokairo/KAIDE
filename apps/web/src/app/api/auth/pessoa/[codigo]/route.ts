import { NextRequest, NextResponse } from 'next/server';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { authenticate, auditLog, authRequiredResponse } from '../../../_lib/auth';
import { getClientIp, handleRouteError } from '../../../_lib/http';
import { generalLimit, personDataLimit, strictLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/pessoa/:codigo - Consulta de pessoa por código (protegida).
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

    if (!/^\d+$/.test(codigo)) {
        logger.warn('API', `Código de pessoa inválido: ${codigo}`, { ip: getClientIp(request) });
        return NextResponse.json(
            { success: false, error: 'Código de pessoa inválido', code: 'INVALID_CODE' },
            { status: 400 }
        );
    }

    try {
        const data = await totvsRestRequest('E.PESSOA', { CODPESSOA: codigo });
        return NextResponse.json(data);
    } catch (error) {
        return handleRouteError(error, `totvs/pessoa/${codigo}`);
    }
}
