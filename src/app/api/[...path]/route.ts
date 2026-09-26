import { NextRequest } from 'next/server';
import { proxyToTotvs } from '../_lib/totvs-proxy';
import { generalLimit } from '../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Catch-all /api/* - Proxy TOTVS (equivalente aos proxies montados após as rotas no Express).
 * Rotas específicas têm precedência; tudo que sobra vai para o TOTVS:
 * - /api/wsDataServer/* → SOAP (timeout 800ms)
 * - /api/api/* e demais  → REST (timeout 10s)
 */

export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;
    return proxyToTotvs(request);
}

export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;
    return proxyToTotvs(request);
}

export async function PUT(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;
    return proxyToTotvs(request);
}

export async function DELETE(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;
    return proxyToTotvs(request);
}

export async function PATCH(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;
    return proxyToTotvs(request);
}
