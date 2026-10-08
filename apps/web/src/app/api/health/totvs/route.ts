import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, JSON_HEADERS } from '@/server/rag/shared/lib/http-core';
import { TOTVS_BASE_URL, TOTVS_AUTH } from '@/server/rag/shared/config/environment';
import { checkAdminAuth } from '../../_lib/auth';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/totvs - Testa conectividade com o TOTVS (protegido por admin key em produção).
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const unauthorized = checkAdminAuth(request);
    if (unauthorized) return unauthorized;

    const startTime = Date.now();

    try {
        const testUrl = `${TOTVS_BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/E.NIVEL/0/S/?parameters=CODCOLIGADA%3D4%3B`;

        const response = await fetchWithTimeout(
            testUrl,
            {
                method: 'GET',
                headers: {
                    ...JSON_HEADERS,
                    Authorization: `Basic ${TOTVS_AUTH}`,
                    login: '1',
                },
            },
            10000
        );

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            status: 'connected',
            duration: `${duration}ms`,
            statusCode: response.status,
            totvs_url: TOTVS_BASE_URL,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        const cause = (error as { cause?: { code?: string; message?: string } })?.cause;

        return NextResponse.json(
            {
                success: false,
                status: 'unreachable',
                duration: `${duration}ms`,
                error: error instanceof Error ? error.message : String(error),
                cause: cause?.code || cause?.message || 'unknown',
                totvs_url: TOTVS_BASE_URL,
            },
            { status: 503 }
        );
    }
}
