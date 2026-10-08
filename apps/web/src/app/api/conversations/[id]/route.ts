import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/server/rag/features/conversations/service';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations/:id - Obtém uma conversa específica.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { id } = await params;
    try {
        const conversation = await ConversationService.getConversation(id);
        if (!conversation) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }
        return NextResponse.json(conversation);
    } catch (error) {
        console.error('Erro ao obter conversa:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * PUT /api/conversations/:id - Atualiza o título de uma conversa.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { id } = await params;
    try {
        const body = await request.json().catch(() => null);
        const { title } = body ?? {};
        if (!title) {
            return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
        }
        await ConversationService.updateConversation(id, title);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar conversa:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * DELETE /api/conversations/:id - Deleta uma conversa.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { id } = await params;
    try {
        await ConversationService.deleteConversation(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
