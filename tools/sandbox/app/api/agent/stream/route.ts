import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get('containerId');

  if (!containerId) {
    return new Response('Missing containerId', { status: 400 });
  }

  // Create a ReadableStream for streaming responses
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();

        // Simulate streaming output (will be replaced with real Docker logs)
        const messages = [
          'Container initialized...',
          'Setting up environment...',
          'Ready for commands',
        ];

        for (const msg of messages) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'log',
                content: msg,
                timestamp: new Date().toISOString(),
              }) + '\n'
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
