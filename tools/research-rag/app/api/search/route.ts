import { NextRequest, NextResponse } from 'next/server';
import { getChatService } from '@/lib/chat-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, top_k = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const service = getChatService();
    const results = await service.search(query, top_k);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
