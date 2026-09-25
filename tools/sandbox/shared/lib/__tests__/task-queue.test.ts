import { describe, it, expect, beforeEach } from 'vitest';
import { taskQueue } from '@/shared/lib/task-queue';

describe('TaskQueue', () => {
  beforeEach(() => {
    taskQueue.clear();
  });

  it('should enqueue a task', () => {
    const task = taskQueue.enqueue(
      {
        id: 'plan1',
        description: 'Test plan',
        steps: [],
        status: 'pending',
      },
      5
    );

    expect(task.status).toBe('queued');
    expect(task.priority).toBe(5);
  });

  it('should dequeue tasks in priority order', () => {
    const task1 = taskQueue.enqueue(
      { id: 'plan1', description: 'Low', steps: [], status: 'pending' },
      2
    );
    const task2 = taskQueue.enqueue(
      { id: 'plan2', description: 'High', steps: [], status: 'pending' },
      8
    );

    const dequeued = taskQueue.dequeue();
    expect(dequeued?.id).toBe(task2.id);
  });

  it('should complete a task', () => {
    const task = taskQueue.enqueue(
      { id: 'plan1', description: 'Test', steps: [], status: 'pending' },
      5
    );

    taskQueue.dequeue();
    taskQueue.complete(task.id, { ...task.plan, status: 'completed' });

    const completed = taskQueue.getCompletedTasks();
    expect(completed.length).toBeGreaterThan(0);
  });

  it('should retry failed tasks', () => {
    const task = taskQueue.enqueue(
      { id: 'plan1', description: 'Test', steps: [], status: 'pending' },
      5,
      2
    );

    taskQueue.dequeue();
    taskQueue.fail(task.id, { message: 'Failed', code: 'ERROR' });

    const pending = taskQueue.getPendingTasks();
    expect(pending.length).toBeGreaterThan(0);
  });

  it('should mark task as failed after max retries', () => {
    const task = taskQueue.enqueue(
      { id: 'plan1', description: 'Test', steps: [], status: 'pending' },
      5,
      1
    );

    taskQueue.dequeue();
    taskQueue.fail(task.id, { message: 'Failed', code: 'ERROR' });

    const failedTasks = taskQueue.getCompletedTasks();
    const failed = failedTasks.find((t) => t.status === 'failed');
    expect(failed).toBeDefined();
  });

  it('should get queue stats', () => {
    taskQueue.enqueue({ id: 'plan1', description: 'Test', steps: [], status: 'pending' }, 5);
    taskQueue.enqueue({ id: 'plan2', description: 'Test', steps: [], status: 'pending' }, 5);

    const stats = taskQueue.getStats();
    expect(stats.total).toBe(2);
    expect(stats.queued).toBe(2);
  });
});
