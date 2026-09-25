import { NextRequest, NextResponse } from 'next/server';
import { taskQueue } from '@/shared/lib/task-queue';
import { logger } from '@/shared/lib/logger';
import { createErrorResponse } from '@/shared/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let tasks;

    switch (filter) {
      case 'pending':
        tasks = taskQueue.getPendingTasks();
        break;
      case 'processing':
        tasks = taskQueue.getProcessingTasks();
        break;
      case 'completed':
        tasks = taskQueue.getCompletedTasks(100);
        break;
      default:
        tasks = taskQueue.getPendingTasks().concat(taskQueue.getProcessingTasks());
    }

    const stats = taskQueue.getStats();

    logger.info('Queue status retrieved', {
      filter,
      taskCount: tasks.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      tasks,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get queue status', error instanceof Error ? (error as Error) : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE() {
  try {
    taskQueue.clear();

    logger.info('Task queue cleared');

    return NextResponse.json({
      success: true,
      message: 'Queue cleared',
    });
  } catch (error) {
    logger.error('Failed to clear queue', error instanceof Error ? (error as Error) : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
