import { NextResponse } from 'next/server';
import { getChatService } from '@/lib/chat-service';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const service = getChatService();
    const status = await service.getStatus();
    const stats = service.getStats();

    return NextResponse.json({
      status: 'online',
      indexed_documents: stats.totalDocuments || 0,
      ...status,
    });
  } catch (error) {
    return NextResponse.json({ status: 'offline', error: String(error) }, { status: 500 });
  }
}
