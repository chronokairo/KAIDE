import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../../_lib/rag';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/index - Indexa os documentos.
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        await ensureRagReady();
        const service = getChatService();
        const result = await service.indexDocuments();

        return NextResponse.json({
            success: true,
            indexed: result.indexed,
            errors: result.errors,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
