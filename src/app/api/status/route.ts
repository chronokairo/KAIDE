import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/server/rag/features/chat/service';
import { ensureRagReady } from '../_lib/rag';
import { generalLimit } from '../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/status - Status do sistema RAG (usado pelo frontend).
 * Dispara a inicialização lazy em background (equivalente ao bootstrap do servidor Express).
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    void ensureRagReady().catch(() => {});

    try {
        const service = getChatService();
        const status = await service.getStatus();
        const stats = service.getStats();

        return NextResponse.json({
            status: 'online',
            indexed_documents: stats.totalDocuments || 0,
            ...status,
        });
    } catch (error) {
        return NextResponse.json({ status: 'offline', error: String(error) }, { status: 500 });
    }
}
