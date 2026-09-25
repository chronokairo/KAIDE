import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/conversations-service';

export async function GET() {
  try {
    const settings = await ConversationService.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();
    await ConversationService.updateSettings(newSettings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
