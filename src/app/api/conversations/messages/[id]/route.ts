import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/server/rag/features/conversations/service';
import { generalLimit } from '../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/conversations/messages/:id - Atualiza uma mensagem (caminho do legado Express).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { id } = await params;
    try {
        const body = await request.json().catch(() => null);
        const { content, isStreaming, sources, charts } = body ?? {};
        await ConversationService.updateMessage(id, content, isStreaming, sources, charts);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
