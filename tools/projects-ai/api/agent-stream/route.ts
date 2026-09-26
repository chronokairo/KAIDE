import { updateTag } from 'next/cache';
import { runAgentStream, type AgentContext, type AgentMode } from '@/infrastructure/ai/agentStream';
import type { AiChatMessage, AiProvider } from '@/core/application/ports/out/IGateways';

function revalidateGitCache(repoFullName?: string) {
  for (const kind of ['prs', 'issues', 'actions']) {
    updateTag(`github:${kind}`);
    if (repoFullName) updateTag(`github:${kind}:${repoFullName}`);
  }
}

export async function POST(request: Request) {
  let body: { provider?: unknown; messages?: unknown; model?: unknown; thinking?: unknown; context?: unknown; mode?: unknown };
  try { body = await request.json(); } catch { return new Response('JSON inválido.', { status: 400 }); }

  const provider: AiProvider | null = body.provider === 'openrouter' ? 'openrouter' : body.provider === 'nvidia-nim' ? 'nvidia-nim' : null;
  if (!provider) return new Response('Provider inválido.', { status: 400 });

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: AiChatMessage[] = rawMessages
    .filter((message): message is { role: unknown; content: unknown } => Boolean(message) && typeof message === 'object')
    .map((message) => ({ role: (message as { role: unknown }).role === 'assistant' ? 'assistant' as const : 'user' as const, content: typeof (message as { content: unknown }).content === 'string' ? (message as { content: string }).content : '' }))
    .filter((message) => message.content.trim());
  if (!messages.length || messages[messages.length - 1].role !== 'user') return new Response('Envie uma mensagem válida.', { status: 400 });

  const model = typeof body.model === 'string' ? body.model : undefined;
  const thinking = ['off', 'low', 'medium', 'high'].includes(String(body.thinking)) ? (body.thinking as 'off' | 'low' | 'medium' | 'high') : 'off';
  const mode: AgentMode = body.mode === 'build' || body.mode === 'auto' ? body.mode : 'strategy';
  const rawContext = body.context && typeof body.context === 'object' ? body.context as Record<string, unknown> : null;
  const context: AgentContext | undefined = rawContext && typeof rawContext.repoFullName === 'string' && typeof rawContext.branch === 'string'
    ? { repoFullName: rawContext.repoFullName, branch: rawContext.branch, focus: typeof rawContext.focus === 'string' ? rawContext.focus : undefined }
    : undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      let mutated = false;
      try {
        for await (const evt of runAgentStream(provider, messages, { model, thinking }, context, mode)) {
          if (evt.type === 'done' && evt.mutatedRemote) mutated = true;
          send(evt.type, evt);
        }
      } catch (error) {
        send('error', { type: 'error', message: error instanceof Error ? error.message : 'Falha no agente.' });
      } finally {
        if (mutated) { try { revalidateGitCache(context?.repoFullName); } catch { /* ignore */ } }
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}
