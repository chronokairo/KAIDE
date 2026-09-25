import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversations-service';

export async function GET() {
  try {
    const conversations = await ConversationService.getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, title } = await request.json();
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
