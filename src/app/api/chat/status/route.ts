import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../../_lib/rag';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/status - Status do sistema de chat.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    void ensureRagReady().catch(() => {});

    try {
        const service = getChatService();
        const status = await service.getStatus();
        return NextResponse.json({ status: 'online', ...status });
    } catch (error) {
        return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
    }
}
