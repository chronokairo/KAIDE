import { NextRequest } from 'next/server';
import { ensureRagReady, rebuildEvents } from '../../_lib/rag';
import { generalLimit } from '../../_lib/rate-limit';
import { sseResponse } from '../../_lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/index/rebuild - Alias de compatibilidade com o frontend (mesmo comportamento de /api/chat/index/rebuild).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    await ensureRagReady().catch(() => {});
    return sseResponse(rebuildEvents());
}
