import { getChatService } from '@/lib/chat-service';

export async function POST() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (type: string, message: string, value?: number) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, message, value })}\n\n`));
      };

      try {
        sendEvent('log', '🗑️ Limpando cache anterior...');

        const { clearCache } = await import('@/lib/documents/persistence');
        await clearCache();
        sendEvent('progress', '✓ Cache limpo', 10);

        sendEvent('log', '🔄 Inicializando sistema...');
        const service = getChatService();
        await service.initialize();
        sendEvent('progress', '✓ Sistema inicializado', 30);

        sendEvent('log', '📚 Carregando dados dos documentos...');
        sendEvent('progress', '🔍 Coletando dados...', 50);

        sendEvent('log', '🧠 Gerando embeddings e indexando documentos...');
        const result = await service.indexDocuments();
        sendEvent('progress', `✓ Indexados ${result.indexed} documentos`, 90);

        if (result.errors > 0) {
          sendEvent('log', `⚠️ ${result.errors} erro(s) durante indexação`);
        }

        sendEvent('done', `✅ Concluído! ${result.indexed} documentos indexados.`, 100);
      } catch (error) {
        sendEvent('log', `❌ Erro: ${String(error)}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
