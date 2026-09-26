import { NextRequest, NextResponse } from 'next/server';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { handleRouteError } from '../../../../_lib/http';
import { generalLimit } from '../../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/atendentes/:codAtendente/historico - Histórico de atendimento.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ codAtendente: string }> }
) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { codAtendente } = await params;

    if (!/^[A-Z0-9]+$/i.test(codAtendente)) {
        return NextResponse.json(
            { success: false, error: 'Código de atendente inválido', code: 'INVALID_CODE' },
            { status: 400 }
        );
    }

    const sanitizedCode = codAtendente.toUpperCase().slice(0, 20);

    try {
        const data = await totvsRestRequest('E.HISTATEND', { SPSATEND: sanitizedCode }, { includeColigada: false });
        return NextResponse.json({
            success: true,
            historico: Array.isArray(data) ? data : [],
            codAtendente: sanitizedCode,
        });
    } catch (error) {
        if (error instanceof Error && error.message?.includes('404')) {
            return NextResponse.json({
                success: true,
                historico: [],
                codAtendente: sanitizedCode,
                message: 'Consulta SQL E.HISTATEND não configurada no TOTVS RM',
            });
        }
        return handleRouteError(error, `totvs/atendentes/${sanitizedCode}/historico`);
    }
}
