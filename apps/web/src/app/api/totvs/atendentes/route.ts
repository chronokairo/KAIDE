import { NextRequest, NextResponse } from 'next/server';
import { apiCache, CACHE_TTL } from '@/server/rag/shared/lib/cache';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { cachedResponse, handleRouteError } from '../../_lib/http';
import { generalLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/atendentes - Lista de atendentes.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const cacheKey = 'totvs:atendentes';

    const cached = apiCache.get<unknown>(cacheKey);
    if (cached) {
        return cachedResponse(cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.ATENDENTE', {}, { includeColigada: false });
        const response = {
            success: true,
            atendentes: Array.isArray(data) ? data : [],
            source: 'totvs',
        };
        apiCache.set(cacheKey, response, CACHE_TTL.OFERTAS);
        return NextResponse.json(response);
    } catch (error) {
        if (error instanceof Error && error.message?.includes('404')) {
            logger.warn('TOTVS', 'Consulta E.ATENDENTE não encontrada no TOTVS.');
            return NextResponse.json({
                success: true,
                atendentes: [],
                message: 'Consulta SQL E.ATENDENTE não configurada no TOTVS RM',
                source: 'fallback',
            });
        }
        return handleRouteError(error, 'totvs/atendentes');
    }
}
