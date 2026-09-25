import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/lib/chat-service';
import type { ChatRequest } from '@/lib/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const service = getChatService();
    const response = await service.processMessage(body.message);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
