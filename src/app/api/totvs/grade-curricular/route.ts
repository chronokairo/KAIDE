import { NextRequest } from 'next/server';
import { apiCache, CACHE_TTL, createCacheKey } from '@/server/rag/shared/lib/cache';
import { validateCodeParam } from '@/server/rag/shared/lib/validation';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { cachedResponse, handleRouteError } from '../../_lib/http';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/grade-curricular - Grade curricular.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const sp = request.nextUrl.searchParams;
    const codCurso = validateCodeParam(sp.get('codCurso') ?? '');
    const codHabilitacao = validateCodeParam(sp.get('codHabilitacao') ?? '');

    const validationErrors = [codCurso, codHabilitacao]
        .filter((v) => !v.valid)
        .map((v) => (v as { error?: string }).error);

    if (validationErrors.length > 0) {
        return Response.json(
            { success: false, error: validationErrors.join(', '), code: 'INVALID_PARAMS' },
            { status: 400 }
        );
    }

    const cacheKey = createCacheKey('totvs:grade', codCurso.value, codHabilitacao.value);

    const cached = apiCache.get<unknown>(cacheKey);
    if (cached) {
        return cachedResponse(cached, { cached: true });
    }

    try {
        const params: Record<string, string> = {};
        if (codCurso.value) params.CODCURSO = codCurso.value;
        if (codHabilitacao.value) params.CODHABILITACAO = codHabilitacao.value;

        const data = await totvsRestRequest('E.GRADE', params);
        apiCache.set(cacheKey, data, CACHE_TTL.GRADE);
        return cachedResponse(data, { cached: false });
    } catch (error) {
        return handleRouteError(error, 'totvs/grade-curricular');
    }
}
