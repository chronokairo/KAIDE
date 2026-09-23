import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, createNvidiaCredentialService } from '@/features/ai-credentials/composition/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1).max(100_000) });
const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  model: z.string().min(1).max(200).optional(),
  temperature: z.number().min(0).max(2).default(0.6),
  maxTokens: z.number().int().min(1).max(16_384).default(2048),
});

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request.headers.get('authorization'));
    const input = requestSchema.parse(await request.json());
    const credential = await createNvidiaCredentialService().service.resolve(user.id);
    if (!credential) return NextResponse.json({ error: 'Configure sua NVIDIA API key na sidebar de IA.' }, { status: 409 });
    const upstream = await fetch(`${credential.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: input.model || credential.model, messages: input.messages, temperature: input.temperature, max_tokens: input.maxTokens, stream: false }),
    });
    const payload = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ error: 'NVIDIA não conseguiu concluir a solicitação' }, { status: upstream.status });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Requisição de chat inválida' }, { status: 400 });
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Não autorizado' : 'Erro interno no chat' }, { status });
  }
}
