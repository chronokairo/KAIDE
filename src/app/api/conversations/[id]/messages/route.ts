import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/server/rag/features/conversations/service';
import { generalLimit } from '../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/conversations/:id/messages - Adiciona uma mensagem à conversa.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { id } = await params;
    try {
        const body = await request.json().catch(() => null);
        const { message } = body ?? {};
        if (!message) {
            return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
        }
        await ConversationService.addMessage(id, message);
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
