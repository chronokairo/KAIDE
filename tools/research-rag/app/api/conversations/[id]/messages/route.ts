import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversations-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();
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
