import { TaskPlan, TaskStep } from '@/processes/orchestrator/agent-orchestrator';

export interface QueuedTask {
  id: string;
  plan: TaskPlan;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: number; // 1-10, higher = more important
  retries: number;
  maxRetries: number;
  error?: {
    message: string;
    code: string;
  };
}

export class TaskQueue {
  private queue: Map<string, QueuedTask> = new Map();
  private processingTasks: Set<string> = new Set();
  private maxConcurrent = 3;

  enqueue(plan: TaskPlan, priority: number = 5, maxRetries: number = 3): QueuedTask {
    const task: QueuedTask = {
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      plan,
      status: 'queued',
      createdAt: new Date(),
      priority,
      retries: 0,
      maxRetries,
    };

    this.queue.set(task.id, task);
    return task;
  }

  dequeue(): QueuedTask | null {
    if (this.processingTasks.size >= this.maxConcurrent) {
      return null;
    }

    let nextTask: QueuedTask | null = null;
    let highestPriority = -1;

    for (const task of this.queue.values()) {
      if (task.status === 'queued' && task.priority > highestPriority) {
        nextTask = task;
        highestPriority = task.priority;
      }
    }

    if (nextTask) {
      nextTask.status = 'processing';
      nextTask.startedAt = new Date();
      this.processingTasks.add(nextTask.id);
    }

    return nextTask;
  }

  complete(taskId: string, plan: TaskPlan): void {
    const task = this.queue.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = new Date();
    task.plan = plan;
    this.processingTasks.delete(taskId);
  }

  fail(taskId: string, error: { message: string; code: string }): void {
    const task = this.queue.get(taskId);
    if (!task) return;

    task.error = error;
    task.retries++;

    if (task.retries < task.maxRetries) {
      task.status = 'queued';
      task.startedAt = undefined;
    } else {
      task.status = 'failed';
      task.completedAt = new Date();
    }

    this.processingTasks.delete(taskId);
  }

  getTask(taskId: string): QueuedTask | undefined {
    return this.queue.get(taskId);
  }

  getPendingTasks(): QueuedTask[] {
    const pending: QueuedTask[] = [];

    for (const task of this.queue.values()) {
      if (task.status === 'queued' || task.status === 'processing') {
        pending.push(task);
      }
    }

    return pending.sort((a, b) => b.priority - a.priority);
  }

  getProcessingTasks(): QueuedTask[] {
    const processing: QueuedTask[] = [];

    for (const taskId of this.processingTasks) {
      const task = this.queue.get(taskId);
      if (task) {
        processing.push(task);
      }
    }

    return processing;
  }

  getCompletedTasks(limit: number = 100): QueuedTask[] {
    const completed: QueuedTask[] = [];

    for (const task of this.queue.values()) {
      if (task.status === 'completed' || task.status === 'failed') {
        completed.push(task);
      }
    }

    return completed.sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)).slice(0, limit);
  }

  clear(): void {
    this.queue.clear();
    this.processingTasks.clear();
  }

  getStats() {
    const tasks = Array.from(this.queue.values());
    return {
      total: tasks.length,
      queued: tasks.filter((t) => t.status === 'queued').length,
      processing: tasks.filter((t) => t.status === 'processing').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };
  }
}

export const taskQueue = new TaskQueue();
