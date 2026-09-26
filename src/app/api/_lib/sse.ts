/**
 * Resposta Server-Sent Events a partir de um AsyncGenerator
 * (porta do streaming SSE do Express).
 */
export function sseResponse(events: AsyncGenerator<unknown>): Response {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const event of events) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                }
            } catch (error) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', data: String(error) })}\n\n`)
                );
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}
