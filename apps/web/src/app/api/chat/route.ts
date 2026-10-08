import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../_lib/rag';
import { generalLimit } from '../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat - Chat simples (não streaming).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        const body = await request.json().catch(() => null);
        const message = body?.message?.trim();
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await ensureRagReady();
        const service = getChatService();
        const response = await service.processMessage(message);
        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
