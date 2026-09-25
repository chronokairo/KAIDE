import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '@/processes/agent/agent-service';
import { config } from '@/shared/lib/config';
import { logger } from '@/shared/lib/logger';

const agentService = new AgentService({
  containerMode: config.get('defaultContainerMode') as any,
  ollamaModel: config.get('ollamaModel') as string,
  ollamaBaseUrl: config.get('ollamaBaseUrl') as string,
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { message, taskId } = body;

        if (!message || typeof message !== 'string') {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                content: 'Message is required',
              }) + '\n'
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'status',
              content: 'Initializing agent...',
            }) + '\n'
          )
        );

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'status',
              content: 'Processing request...',
            }) + '\n'
          )
        );

        const taskRequest = {
          id: taskId || `task_${Date.now()}`,
          userMessage: message,
        };

        try {
          const result = await agentService.processRequest(taskRequest);

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'task',
                taskId: result.id,
                status: result.status,
              }) + '\n'
            )
          );

          for (const step of result.steps || []) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'step',
                  stepId: step.id,
                  command: step.command,
                  description: step.description,
                  status: step.status,
                  output: step.output,
                }) + '\n'
              )
            );
          }

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'complete',
                status: result.status,
                duration: '0ms',
              }) + '\n'
            )
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                content: error instanceof Error ? error.message : 'Task execution failed',
              }) + '\n'
            )
          );
        }

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'error',
              content: error instanceof Error ? error.message : 'Stream error',
            }) + '\n'
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}