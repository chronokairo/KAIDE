/**
 * Unit Tests for PipelineTaskExecutionService
 * 
 * Tests task execution, agent prompts, and event emission
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineTaskExecutionService } from '../services/PipelineTaskExecutionService';
import type { AIProvider } from '../providers/AIProvider';
import type { TaskDefinition, TaskExecutionConfig } from '../services/PipelineTaskExecutionService';

describe('PipelineTaskExecutionService', () => {
  let service: PipelineTaskExecutionService;
  let mockAIProvider: AIProvider;

  beforeEach(() => {
    // Mock AIProvider
    mockAIProvider = {
      chat: vi.fn().mockResolvedValue({
        success: true,
        content: 'Task completed successfully',
        usage: { promptTokens: 100, completionTokens: 50 },
      }),
      stream: vi.fn(),
      getAvailableModels: vi.fn().mockReturnValue(['gpt-5.4-mini', 'gpt-5.4-turbo']),
    } as any;

    service = new PipelineTaskExecutionService(mockAIProvider);
  });

  describe('executeTask', () => {
    it('should execute a task with agent-specific prompt', async () => {
      const task: TaskDefinition = {
        taskId: 'task-1',
        agentRole: 'pm',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-1',
        title: 'Plan Sprint',
        description: 'Plan upcoming sprint with team',
        context: 'Team size: 5, Sprint duration: 2 weeks',
      };

      const config: TaskExecutionConfig = {
        timeout: 30000,
        sandboxed: false,
      };

      const result = await service.executeTask(task, config);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-1');
      expect(mockAIProvider.chat).toHaveBeenCalled();
    });

    it('should generate PM-specific prompt', async () => {
      const task: TaskDefinition = {
        taskId: 'task-2',
        agentRole: 'pm',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-1',
        title: 'Project Planning',
        description: 'Define project requirements',
      };

      await service.executeTask(task, { timeout: 30000 });

      // Verify prompt contains PM-specific context
      const callArgs = (mockAIProvider.chat as any).mock.calls[0];
      expect(callArgs[0][0].content).toContain('project manager');
    });

    it('should generate architect-specific prompt', async () => {
      const task: TaskDefinition = {
        taskId: 'task-3',
        agentRole: 'architect',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-2',
        title: 'Design Architecture',
        description: 'Design system architecture',
      };

      await service.executeTask(task, { timeout: 30000 });

      const callArgs = (mockAIProvider.chat as any).mock.calls[0];
      expect(callArgs[0][0].content).toContain('architect');
    });

    it('should handle task execution timeout', async () => {
      const task: TaskDefinition = {
        taskId: 'task-4',
        agentRole: 'backend',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-3',
        title: 'Implement API',
        description: 'Implement REST API',
      };

      // Mock slow AI provider
      mockAIProvider.chat = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, content: 'Done' }), 5000)
          )
      );

      // This should timeout
      const result = await service.executeTask(task, {
        timeout: 1000,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('executeTasksInPhase', () => {
    it('should execute multiple tasks in sequence', async () => {
      const tasks: TaskDefinition[] = [
        {
          taskId: 'task-1',
          agentRole: 'pm',
          pipelineId: 'pipeline-1',
          phaseId: 'phase-1',
          title: 'Task 1',
          description: 'First task',
        },
        {
          taskId: 'task-2',
          agentRole: 'architect',
          pipelineId: 'pipeline-1',
          phaseId: 'phase-1',
          title: 'Task 2',
          description: 'Second task',
        },
      ];

      const results = await service.executeTasksInPhase(
        { taskIds: ['task-1', 'task-2'] } as any,
        'pipeline-1',
        { timeout: 30000 }
      );

      expect(results).toBeDefined();
    });
  });

  describe('cancelTask', () => {
    it('should cancel an executing task', () => {
      service.cancelTask('task-1');
      // Task should be removed from active executions
      expect(service['activeExecutions'].has('task-1')).toBe(false);
    });
  });

  describe('event emission', () => {
    it('should emit pipeline:task:started event', async () => {
      const eventSpy = vi.spyOn(service['eventBus'], 'emit');

      const task: TaskDefinition = {
        taskId: 'task-5',
        agentRole: 'qa',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-1',
        title: 'Test Planning',
        description: 'Plan tests',
      };

      await service.executeTask(task, { timeout: 30000 });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pipeline:task:started',
        })
      );
    });

    it('should emit pipeline:task:completed event', async () => {
      const eventSpy = vi.spyOn(service['eventBus'], 'emit');

      const task: TaskDefinition = {
        taskId: 'task-6',
        agentRole: 'backend',
        pipelineId: 'pipeline-1',
        phaseId: 'phase-1',
        title: 'Implementation',
        description: 'Implement feature',
      };

      await service.executeTask(task, { timeout: 30000 });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pipeline:task:completed',
        })
      );
    });
  });
});
