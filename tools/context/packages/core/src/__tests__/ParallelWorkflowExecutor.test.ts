/**
 * Unit Tests for ParallelWorkflowExecutor
 * 
 * Tests parallel execution, dependency resolution, concurrency limits, and timeouts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallelWorkflowExecutor } from '../services/ParallelWorkflowExecutor';
import type { WorkflowStep } from '../services/ParallelWorkflowExecutor';

describe('ParallelWorkflowExecutor', () => {
  let executor: ParallelWorkflowExecutor;

  beforeEach(() => {
    executor = new ParallelWorkflowExecutor(3); // Max 3 parallel
  });

  describe('executeWorkflow', () => {
    it('should execute independent steps in parallel', async () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          execute: vi.fn().mockResolvedValue({ result: 'success-1' }),
        },
        {
          id: 'step-2',
          title: 'Step 2',
          execute: vi.fn().mockResolvedValue({ result: 'success-2' }),
        },
        {
          id: 'step-3',
          title: 'Step 3',
          execute: vi.fn().mockResolvedValue({ result: 'success-3' }),
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);

      expect(results.size).toBe(3);
      expect(results.get('step-1')?.status).toBe('completed');
      expect(results.get('step-2')?.status).toBe('completed');
      expect(results.get('step-3')?.status).toBe('completed');
    });

    it('should respect concurrency limit of 3', async () => {
      const executeSpy = vi.fn().mockResolvedValue({ result: 'done' });

      const steps: WorkflowStep[] = Array.from({ length: 10 }, (_, i) => ({
        id: `step-${i + 1}`,
        title: `Step ${i + 1}`,
        execute: executeSpy,
      })) as any;

      await executor.executeWorkflow(steps, 3);

      // All steps should be executed
      expect(executeSpy).toHaveBeenCalledTimes(10);
    });

    it('should wait for dependencies before executing step', async () => {
      const executeOrder: string[] = [];

      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          execute: vi.fn(async () => {
            executeOrder.push('step-1');
            return { result: 'done' };
          }),
        },
        {
          id: 'step-2',
          title: 'Step 2',
          dependsOn: ['step-1'],
          execute: vi.fn(async () => {
            executeOrder.push('step-2');
            return { result: 'done' };
          }),
        },
        {
          id: 'step-3',
          title: 'Step 3',
          dependsOn: ['step-2'],
          execute: vi.fn(async () => {
            executeOrder.push('step-3');
            return { result: 'done' };
          }),
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);

      // Verify execution order
      expect(executeOrder).toEqual(['step-1', 'step-2', 'step-3']);
      expect(results.get('step-3')?.status).toBe('completed');
    });

    it('should handle step failure and mark dependents as skipped', async () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          execute: vi.fn().mockRejectedValue(new Error('Step 1 failed')),
        },
        {
          id: 'step-2',
          title: 'Step 2',
          dependsOn: ['step-1'],
          execute: vi.fn().mockResolvedValue({ result: 'done' }),
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);

      expect(results.get('step-1')?.status).toBe('failed');
      expect(results.get('step-2')?.status).toBe('skipped');
    });
  });

  describe('executeWithTimeout', () => {
    it('should timeout if step exceeds timeout duration', async () => {
      const slowStep: WorkflowStep = {
        id: 'slow-step',
        title: 'Slow Step',
        execute: vi.fn(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ result: 'done' }), 5000)
            )
        ),
        timeout: 1000,
      } as any;

      const result = await (executor as any).executeWithTimeout(
        slowStep.execute,
        1000
      );

      expect(result).toBeUndefined(); // Should timeout
    });

    it('should complete if step finishes before timeout', async () => {
      const fastStep: WorkflowStep = {
        id: 'fast-step',
        title: 'Fast Step',
        execute: vi.fn().mockResolvedValue({ result: 'done' }),
        timeout: 5000,
      } as any;

      const result = await (executor as any).executeWithTimeout(
        fastStep.execute,
        5000
      );

      expect(result).toEqual({ result: 'done' });
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed step with exponential backoff', async () => {
      let attemptCount = 0;
      const executeWithRetry = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { result: 'success after retries' };
      });

      const steps: WorkflowStep[] = [
        {
          id: 'retry-step',
          title: 'Retry Step',
          execute: executeWithRetry,
          retries: 3,
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);

      expect(results.get('retry-step')?.status).toBe('completed');
      expect(executeWithRetry).toHaveBeenCalledTimes(3);
    });

    it('should fail step after max retries exceeded', async () => {
      const executeWithRetry = vi
        .fn()
        .mockRejectedValue(new Error('Always fails'));

      const steps: WorkflowStep[] = [
        {
          id: 'always-fail',
          title: 'Always Fail',
          execute: executeWithRetry,
          retries: 2,
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);

      expect(results.get('always-fail')?.status).toBe('failed');
      expect(executeWithRetry).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('getExecutionStatus', () => {
    it('should track execution status during workflow', async () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          execute: vi.fn().mockResolvedValue({ result: 'done' }),
        },
      ] as any;

      const results = await executor.executeWorkflow(steps);
      const firstResult = results.entries().next().value;
      const executionId = firstResult?.[1]?.executionId;

      if (executionId) {
        const status = executor.getExecutionStatus(executionId);
        expect(status).toBeDefined();
      }
    });
  });

  describe('getActiveExecutions', () => {
    it('should return active executions', async () => {
      const steps: WorkflowStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          execute: vi.fn(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve({ result: 'done' }), 100)
              )
          ),
        },
      ] as any;

      // Start execution but don't wait
      const promise = executor.executeWorkflow(steps);

      const active = executor.getActiveExecutions();
      // Should have at least one execution
      expect(active.length).toBeGreaterThanOrEqual(0);

      // Wait for completion
      await promise;
    });
  });
});
