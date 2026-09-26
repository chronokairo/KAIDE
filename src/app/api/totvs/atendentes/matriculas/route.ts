import { NextRequest, NextResponse } from 'next/server';
import { apiCache, CACHE_TTL } from '@/server/rag/shared/lib/cache';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { cachedResponse, handleRouteError } from '../../../_lib/http';
import { generalLimit } from '../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/atendentes/matriculas - Todas as matrículas de todos os atendentes.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const cacheKey = 'totvs:matriculas:all';

    const cached = apiCache.get<unknown>(cacheKey);
    if (cached) {
        return cachedResponse(cached, { cached: true });
    }

    try {
        const atendentes = await totvsRestRequest('E.ATENDENTE', {}, { includeColigada: false });

        if (!Array.isArray(atendentes) || atendentes.length === 0) {
            return NextResponse.json({
                success: true,
                matriculas: [],
                total: 0,
                message: 'Nenhum atendente encontrado',
            });
        }

        const historicos = await Promise.all(
            (atendentes as Array<Record<string, unknown>>).map(async (atendente) => {
                try {
                    const historico = await totvsRestRequest(
                        'E.HISTATEND',
                        { SPSATEND: String(atendente.CODIGO ?? '') },
                        { includeColigada: false }
                    );
                    return Array.isArray(historico) ? historico : [];
                } catch {
                    return [];
                }
            })
        );

        const todasMatriculas = historicos.flat();

        const response = {
            success: true,
            matriculas: todasMatriculas,
            total: todasMatriculas.length,
            porAtendente: (atendentes as Array<Record<string, unknown>>).map((a, i) => ({
                codigo: a.CODIGO,
                nome: a.NOME,
                qtdMatriculas: historicos[i].length,
            })),
        };

        apiCache.set(cacheKey, response, CACHE_TTL.OFERTAS);
        return NextResponse.json(response);
    } catch (error) {
        return handleRouteError(error, 'totvs/atendentes/matriculas');
    }
}
