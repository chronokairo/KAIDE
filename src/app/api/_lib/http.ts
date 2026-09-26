import { NextRequest, NextResponse } from 'next/server';

/**
 * IP do cliente (equivalente a `trust proxy 1` + req.ip do Express).
 */
export function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Resposta com headers de cache (equivalente a sendCachedResponse do Express).
 */
export function cachedResponse(
    data: unknown,
    options: { cached?: boolean; maxAge?: number } = {}
): NextResponse {
    const { cached = false, maxAge = 300 } = options;
    return NextResponse.json(data, {
        headers: {
            'X-Cache': cached ? 'HIT' : 'MISS',
            'Cache-Control': `public, max-age=${maxAge}`,
        },
    });
}

/**
 * Erro padrão das rotas (equivalente a handleError do Express).
 */
export function handleRouteError(error: unknown, fallbackMessage = 'Internal server error'): NextResponse {
    const message = error instanceof Error ? error.message : fallbackMessage;
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message, status }, { status });
}
