import { NextRequest, NextResponse } from 'next/server';
import { appendConversationTurn, listConversations } from '@/lib/conversations';

export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      conversationId?: string;
      providerId?: string;
      modelId?: string;
      userContent?: string;
      assistantContent?: string;
    };

    if (!body.providerId || !body.modelId || !body.userContent || !body.assistantContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await appendConversationTurn({
      conversationId: body.conversationId,
      providerId: body.providerId,
      modelId: body.modelId,
      userContent: body.userContent,
      assistantContent: body.assistantContent,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}