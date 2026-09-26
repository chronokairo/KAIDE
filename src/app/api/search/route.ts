import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../_lib/rag';
import { generalLimit } from '../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/search - Busca semântica (vector search).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        const body = await request.json().catch(() => null);
        const query = body?.query;
        const topK = body?.top_k ?? 10;
        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        await ensureRagReady();
        const service = getChatService();
        const results = await service.search(query, topK);
        return NextResponse.json({ results });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
