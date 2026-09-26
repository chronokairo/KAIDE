import { container } from '@/infrastructure/container';
import type { AiChatMessage } from '@/core/application/ports/out/IGateways';

// Streaming token-a-token do texto final (sem tool-calling). O chat usa esta rota
// apenas para perguntas sem repositório selecionado; quando há contexto de repo,
// o fluxo agêntico com aprovação de tools (runAiAgentAction) continua sendo usado.
export async function POST(request: Request) {
  let body: { provider?: unknown; messages?: unknown; model?: unknown; thinking?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response('JSON inválido.', { status: 400 });
  }

  const provider = body.provider === 'openrouter' ? 'openrouter' : body.provider === 'nvidia-nim' ? 'nvidia-nim' : null;
  if (!provider) return new Response('Provider inválido.', { status: 400 });

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: AiChatMessage[] = rawMessages
    .filter((message): message is { role: unknown; content: unknown } => Boolean(message) && typeof message === 'object')
    .map((message) => ({ role: (message as { role: unknown }).role === 'assistant' ? 'assistant' as const : 'user' as const, content: typeof (message as { content: unknown }).content === 'string' ? (message as { content: string }).content.trim().slice(0, 8000) : '' }))
    .filter((message) => message.content)
    .slice(-12);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return new Response('Envie uma mensagem válida.', { status: 400 });
  }

  const model = typeof body.model === 'string' ? body.model : undefined;
  const thinking = ['off', 'low', 'medium', 'high'].includes(String(body.thinking)) ? (body.thinking as 'off' | 'low' | 'medium' | 'high') : 'off';

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        for await (const delta of container.aiChatGateway.streamChat(provider, messages, { model, thinking })) {
          send('delta', delta);
        }
        send('done', {});
      } catch (error) {
        send('error', error instanceof Error ? error.message : 'Falha ao gerar resposta.');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
  });
}
