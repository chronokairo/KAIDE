import { NextRequest, NextResponse } from 'next/server';
import { TOTVS_BASE_URL, TOTVS_AUTH, isProduction } from '@/server/rag/shared/config/environment';

/**
 * Proxy TOTVS (porta do http-proxy-middleware do legado):
 * - /api/wsDataServer/*  → SOAP (strip /api, timeout 800ms)
 * - /api/api/*           → REST (strip primeiro /api, timeout 10s)
 * - demais /api/*        → REST (path inalterado, timeout 10s)
 * Injeta Authorization Basic + login: 1.
 */

const SOAP_TIMEOUT_MS = 800;
const REST_TIMEOUT_MS = 10_000;

export function rewriteTotvsPath(pathname: string): string {
    if (pathname.startsWith('/api/wsDataServer')) {
        return pathname.replace(/^\/api/, '');
    }
    if (pathname.startsWith('/api/api/')) {
        return pathname.replace(/^\/api/, '');
    }
    return pathname;
}

export async function proxyToTotvs(request: NextRequest): Promise<Response> {
    if (!TOTVS_AUTH && isProduction) {
        return NextResponse.json(
            { error: 'Serviço temporariamente indisponível', code: 'SERVICE_UNAVAILABLE' },
            { status: 503 }
        );
    }
    if (!TOTVS_AUTH) {
        console.warn('⚠️ AVISO: Credenciais TOTVS não configuradas para proxy');
    }

    const { pathname, search } = request.nextUrl;
    const targetPath = rewriteTotvsPath(pathname);
    const timeout = targetPath.startsWith('/wsDataServer') ? SOAP_TIMEOUT_MS : REST_TIMEOUT_MS;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const headers: Record<string, string> = {
            Authorization: `Basic ${TOTVS_AUTH}`,
            login: '1',
        };
        const contentType = request.headers.get('content-type');
        if (contentType) headers['Content-Type'] = contentType;
        const accept = request.headers.get('accept');
        if (accept) headers['Accept'] = accept;

        const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
        const body = hasBody ? await request.arrayBuffer() : undefined;

        const response = await fetch(`${TOTVS_BASE_URL}${targetPath}${search}`, {
            method: request.method,
            headers,
            body,
            signal: controller.signal,
            cache: 'no-store',
        });

        // fetch descomprime gzip automaticamente: não repassar content-encoding/content-length
        const responseHeaders = new Headers();
        const responseContentType = response.headers.get('content-type');
        if (responseContentType) responseHeaders.set('Content-Type', responseContentType);

        return new Response(response.body, { status: response.status, headers: responseHeaders });
    } catch (error) {
        if (!isProduction) {
            console.log('proxy error', error instanceof Error ? error.message : String(error));
        }
        return NextResponse.json(
            { error: 'Serviço temporariamente indisponível', code: 'SERVICE_UNAVAILABLE' },
            { status: 503 }
        );
    } finally {
        clearTimeout(timer);
    }
}
