import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/server/rag/features/conversations/service';
import { generalLimit } from '../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations - Lista todas as conversas.
 */
export async function GET(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        const conversations = await ConversationService.getAllConversations();
        return NextResponse.json(conversations);
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * POST /api/conversations - Cria uma nova conversa.
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        const body = await request.json().catch(() => null);
        const { id, title } = body ?? {};
        if (!id || !title) {
            return NextResponse.json({ error: 'ID e título são obrigatórios' }, { status: 400 });
        }
        await ConversationService.createConversation(id, title);
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
