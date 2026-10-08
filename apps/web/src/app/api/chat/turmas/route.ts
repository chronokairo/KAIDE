import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../../_lib/rag';
import { generalLimit } from '../../_lib/rate-limit';
import { sseResponse } from '../../_lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/turmas - Consulta específica sobre turmas e matrículas (SSE).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const message = body?.message?.trim();
    if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await ensureRagReady();
    const service = getChatService();
    return sseResponse(service.processMessageTurmas(message));
}
