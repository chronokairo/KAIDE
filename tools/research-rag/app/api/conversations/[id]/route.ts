import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversations-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ConversationService.deleteConversation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
