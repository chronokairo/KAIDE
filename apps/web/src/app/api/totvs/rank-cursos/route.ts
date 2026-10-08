import { NextRequest } from 'next/server';
import { apiCache, CACHE_TTL } from '@/server/rag/shared/lib/cache';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { cachedResponse, handleRouteError } from '../../_lib/http';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/rank-cursos - Ranking de cursos.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const cacheKey = 'totvs:rank-cursos';

    const cached = apiCache.get<unknown>(cacheKey);
    if (cached) {
        return cachedResponse(cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.RANKCURSO');
        apiCache.set(cacheKey, data, CACHE_TTL.RANK_CURSOS);
        return cachedResponse(data, { cached: false });
    } catch (error) {
        return handleRouteError(error, 'totvs/rank-cursos');
    }
}
