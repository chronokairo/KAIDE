import { NextResponse } from 'next/server';
import { getConversation, saveConversationSuggestions } from '@/lib/conversations';

type Params = Promise<{ id: string }>;

export async function GET(_: Request, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { suggestions?: unknown; assistantCount?: unknown };

    const items = Array.isArray(body.suggestions)
      ? body.suggestions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 4)
      : [];

    if (!items.length || typeof body.assistantCount !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const saved = await saveConversationSuggestions(id, {
      items,
      assistantCount: body.assistantCount,
    });

    if (!saved) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}