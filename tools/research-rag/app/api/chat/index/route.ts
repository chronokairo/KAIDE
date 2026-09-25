import { NextResponse } from 'next/server';
import { getChatService } from '@/lib/chat-service';

export async function POST() {
  try {
    const service = getChatService();
    const result = await service.indexDocuments();

    return NextResponse.json({
      success: true,
      indexed: result.indexed,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
