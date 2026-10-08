import { NextRequest } from 'next/server';
import { ensureRagReady, rebuildEvents } from '../../../_lib/rag';
import { generalLimit } from '../../../_lib/rate-limit';
import { sseResponse } from '../../../_lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/index/rebuild - Reconstrói o índice (limpa cache + reindexa) com progresso via SSE.
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    await ensureRagReady().catch(() => {});
    return sseResponse(rebuildEvents());
}
