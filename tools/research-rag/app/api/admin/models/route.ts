import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';
import { ConversationService } from '@/lib/conversations-service';
import { OLLAMA_HOST } from '@/lib/environment';

export async function GET() {
  try {
    const ollama = new Ollama({ host: OLLAMA_HOST });
    const response = await ollama.list();
    const settings = await ConversationService.getSettings();
    
    return NextResponse.json({ 
      models: response.models.map(m => m.name),
      currentModel: settings.llmModel 
    });
  } catch (error) {
    console.error('Erro ao listar modelos Ollama:', error);
    return NextResponse.json({ error: 'Erro ao conectar com Ollama' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json();
    if (!model) {
      return NextResponse.json({ error: 'Modelo não especificado' }, { status: 400 });
    }
    
    await ConversationService.updateSettings({ llmModel: model });
    return NextResponse.json({ success: true, model });
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
