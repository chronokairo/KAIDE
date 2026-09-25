import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversations-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, isStreaming, sources, charts } = await request.json();
    await ConversationService.updateMessage(id, content, isStreaming, sources, charts);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { feedback } = await request.json();
    const success = await ConversationService.setMessageFeedback(id, feedback);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }
  } catch (error) {
    console.error('Erro ao atualizar feedback da mensagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
