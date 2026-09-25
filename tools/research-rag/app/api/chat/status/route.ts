import { NextResponse } from 'next/server';
import { getChatService } from '@/lib/chat-service';

export async function GET() {
  try {
    const service = getChatService();
    const status = await service.getStatus();

    return NextResponse.json({
      status: 'online',
      ...status,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
