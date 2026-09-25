import { NextRequest, NextResponse } from 'next/server';
import { getAgentService } from '../service';
import { logger } from '@/shared/lib/logger';
import { taskQueue } from '@/shared/lib/task-queue';
import { ValidationError, createErrorResponse, isAegisError } from '@/shared/lib/errors';
import { httpMiddleware } from '@/shared/lib/http-middleware';
import { validate, commonRules } from '@/shared/lib/validator';
import { defaultRateLimit } from '@/shared/lib/middleware';

export interface TaskExecutionRequest {
  message: string;
  taskId?: string;
  priority?: number;
  async?: boolean;
}

export interface TaskExecutionResponse {
  success: boolean;
  task?: any;
  taskId?: string;
  queued?: boolean;
  error?: { code: string; message: string };
}

export async function POST(request: NextRequest) {
  const handler = async (req: NextRequest) => {
    const agentService = getAgentService();
    const startTime = Date.now();

    try {
      const body: TaskExecutionRequest = await req.json();
      const { message, taskId, priority = 5, async: isAsync = false } = body;

      // Use validator library
      const validation = validate(body, [
        {
          field: 'message',
          rules: [
            commonRules.required('Message is required'),
            commonRules.maxLength(10000, 'Message must be less than 10000 characters'),
          ],
        },
      ]);

      if (!validation.valid) {
        throw new ValidationError(validation.errors[0]?.message || 'Invalid request');
      }

      logger.info('Processing agent request', {
        taskId,
        messageLength: message.length,
        async: isAsync,
      });

      const finalTaskId = taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const taskRequest = {
        id: finalTaskId,
        userMessage: message,
      };

      // If async, queue the task
      if (isAsync) {
        logger.info('Task queued for async processing', { taskId: finalTaskId });

        return NextResponse.json(
          {
            success: true,
            taskId: finalTaskId,
            queued: true,
          },
          { status: 202 }
        );
      }

      // Process synchronously
      const result = await agentService.processRequest(taskRequest);

      logger.info('Task completed successfully', {
        taskId: finalTaskId,
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        {
          success: true,
          task: result,
        },
        { status: 200 }
      );
    } catch (error) {
      logger.error('Agent API error', error instanceof Error ? (error as Error) : new Error(String(error)), {
        duration: Date.now() - startTime,
      });

      const errorResponse = createErrorResponse(error);
      const statusCode = isAegisError(error) ? error.statusCode : 500;

      return NextResponse.json(errorResponse, { status: statusCode });
    }
  };

  return defaultRateLimit(request, handler);
}

export async function GET(request: NextRequest) {
  const handler = async (req: NextRequest) => {
    const agentService = getAgentService();
    try {
      const { searchParams } = new URL(req.url);
      const taskId = searchParams.get('taskId');

      if (taskId) {
        const queuedTask = taskQueue.getTask(taskId);

        if (!queuedTask) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Task not found' },
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          task: queuedTask,
        });
      }

      // Get agent state and stats
      const state = agentService.getState();
      const queueStats = taskQueue.getStats();

      return NextResponse.json({
        success: true,
        agent: state,
        queue: queueStats,
      });
    } catch (error) {
      logger.error('Failed to get agent status', error instanceof Error ? (error as Error) : new Error(String(error)));

      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }
  };

  return defaultRateLimit(request, handler);
}