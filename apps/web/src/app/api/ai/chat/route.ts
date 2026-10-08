import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatComposition } from '@/features/ai-chat/composition/server';
import { CredentialNotConfiguredError, UnauthorizedError, UpstreamLlmError } from '@/domain/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1).max(100_000) });
const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  model: z.string().min(1).max(200).optional(),
  temperature: z.number().min(0).max(2).default(0.6),
  maxTokens: z.number().int().min(1).max(16_384).default(2048),
});

// Adapter HTTP (ADR-0022): valida entrada, delega ao caso de uso e traduz erros de domínio.
export async function POST(request: NextRequest) {
  try {
    const { identity, sendMessage } = createChatComposition();
    const actor = await identity.authenticate(request.headers.get('authorization'));
    const input = requestSchema.parse(await request.json());
    const result = await sendMessage.execute(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Requisição de chat inválida' }, { status: 400 });
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (error instanceof CredentialNotConfiguredError) return NextResponse.json({ error: 'Configure sua NVIDIA API key na sidebar de IA.' }, { status: 409 });
    if (error instanceof UpstreamLlmError) return NextResponse.json({ error: 'NVIDIA não conseguiu concluir a solicitação' }, { status: error.status });
    return NextResponse.json({ error: 'Erro interno no chat' }, { status: 500 });
  }
}
