import { NextRequest } from 'next/server';
import { apiCache, CACHE_TTL, createCacheKey } from '@/server/rag/shared/lib/cache';
import { validateCodeParam, sanitizeQueryParam } from '@/server/rag/shared/lib/validation';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { cachedResponse, handleRouteError } from '../../_lib/http';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/ofertas - Ofertas de cursos.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const sp = request.nextUrl.searchParams;
    const codTipoCurso = sp.get('codTipoCurso')
        ? validateCodeParam(sp.get('codTipoCurso')!)
        : { valid: true as const, value: '' };
    const codTipoHab = sp.get('codTipoHabilitacao')
        ? validateCodeParam(sp.get('codTipoHabilitacao')!)
        : { valid: true as const, value: '' };
    const codTipoEnsino = sp.get('codTipoEnsino')
        ? validateCodeParam(sp.get('codTipoEnsino')!)
        : { valid: true as const, value: '' };
    const curso = sanitizeQueryParam(sp.get('curso') ?? undefined);

    const validationErrors = [codTipoCurso, codTipoHab, codTipoEnsino]
        .filter((v) => !v.valid)
        .map((v) => (v as { error?: string }).error);

    if (validationErrors.length > 0) {
        return Response.json(
            { success: false, error: validationErrors.join(', '), code: 'INVALID_PARAMS' },
            { status: 400 }
        );
    }

    const cacheKey = createCacheKey('totvs:ofertas', codTipoCurso.value, codTipoHab.value, curso, codTipoEnsino.value);

    const cached = apiCache.get<unknown>(cacheKey);
    if (cached) {
        return cachedResponse(cached, { cached: true });
    }

    try {
        const params: Record<string, string> = {
            CODTIPOCURSO: codTipoCurso.value,
            CODTIPOHABILITACAO: codTipoHab.value,
            CODCURSO: curso,
            CODTIPOENSINO: codTipoEnsino.value,
        };

        const data = await totvsRestRequest('E.OFERTAS', params);
        apiCache.set(cacheKey, data, CACHE_TTL.OFERTAS);
        return cachedResponse(data, { cached: false });
    } catch (error) {
        return handleRouteError(error, 'totvs/ofertas');
    }
}
