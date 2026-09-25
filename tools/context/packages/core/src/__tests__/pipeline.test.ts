import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineService, AGENT_META } from '../pipeline';
import type { AgentRole, Pipeline } from '../pipeline';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('fs');
vi.mock('os');

describe('PipelineService', () => {
  let service: PipelineService;
  const mockProjectId = 'test-project-123';
  const mockPipelinesDir = '/home/user/.anamnesic/pipelines/test-project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PipelineService();

    vi.mocked(os.homedir).mockReturnValue('/home/user');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
  });

  describe('AGENT_META', () => {
    it('should contain metadata for all agent roles', () => {
      const roles: AgentRole[] = [
        'product-manager',
        'architect',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
      ];

      roles.forEach(role => {
        expect(AGENT_META[role]).toBeDefined();
        expect(AGENT_META[role].label).toBeTruthy();
        expect(AGENT_META[role].description).toBeTruthy();
      });
    });

    it('should have correct labels', () => {
      expect(AGENT_META['product-manager'].label).toBe('Product Manager');
      expect(AGENT_META['architect'].label).toBe('Architect');
      expect(AGENT_META['qa'].label).toBe('QA Engineer');
    });
  });

  describe('create', () => {
    it('should create a pipeline with default phases', () => {
      const pipeline = service.create(
        mockProjectId,
        'Build user authentication',
        '/workspace/project'
      );

      expect(pipeline.id).toBeDefined();
      expect(pipeline.projectId).toBe(mockProjectId);
      expect(pipeline.objective).toBe('Build user authentication');
      expect(pipeline.workspace).toBe('/workspace/project');
      expect(pipeline.status).toBe('active');
      expect(pipeline.currentPhase).toBe(0);
      expect(pipeline.phases).toHaveLength(5);
    });

    it('should create phases in correct order', () => {
      const pipeline = service.create(mockProjectId, 'Test objective', '/workspace');

      expect(pipeline.phases[0].name).toBe('Planning');
      expect(pipeline.phases[1].name).toBe('Architecture');
      expect(pipeline.phases[2].name).toBe('Implementation');
      expect(pipeline.phases[3].name).toBe('Testing');
      expect(pipeline.phases[4].name).toBe('Code Review');
    });

    it('should set first phase to in-progress', () => {
      const pipeline = service.create(mockProjectId, 'Test', '/workspace');

      expect(pipeline.phases[0].status).toBe('in-progress');
      expect(pipeline.phases[1].status).toBe('pending');
    });

    it('should create tasks for each agent in phases', () => {
      const pipeline = service.create(mockProjectId, 'Test', '/workspace');
      const planningPhase = pipeline.phases[0];

      expect(planningPhase.agents).toContain('product-manager');
      expect(planningPhase.tasks).toHaveLength(1);
      expect(planningPhase.tasks[0].agent).toBe('product-manager');
      expect(planningPhase.tasks[0].status).toBe('pending');
    });

    it('should create custom phases when provided', () => {
      const customPhases = [
        { name: 'Discovery', order: 0, parallel: false, agents: ['product-manager' as AgentRole] },
        { name: 'Build', order: 1, parallel: true, agents: ['backend' as AgentRole, 'frontend' as AgentRole] },
      ];

      const pipeline = service.create(mockProjectId, 'Test', '/workspace', customPhases);

      expect(pipeline.phases).toHaveLength(2);
      expect(pipeline.phases[0].name).toBe('Discovery');
      expect(pipeline.phases[1].name).toBe('Build');
      expect(pipeline.phases[1].parallel).toBe(true);
    });

    it('should save pipeline to filesystem', () => {
      service.create(mockProjectId, 'Test', '/workspace');

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(writeCall[0]).toContain('.anamnesic/pipelines');
      expect(writeCall[0]).toContain(`${mockProjectId}`);
    });
  });

  describe('get', () => {
    it('should return pipeline when file exists', () => {
      const mockPipeline: Pipeline = {
        id: 'pipeline-123',
        projectId: mockProjectId,
        workspace: '/workspace',
        objective: 'Test',
        status: 'active',
        currentPhase: 0,
        phases: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPipeline));

      const result = service.get(mockProjectId, 'pipeline-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('pipeline-123');
      expect(result?.objective).toBe('Test');
    });

    it('should return null when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = service.get(mockProjectId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should return null on parse error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json{');

      const result = service.get(mockProjectId, 'corrupted');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no pipelines exist', () => {
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = service.list(mockProjectId);

      expect(result).toEqual([]);
    });

    it('should list all pipelines for a project', () => {
      const pipeline1 = { id: 'p1', projectId: mockProjectId, status: 'active' };
      const pipeline2 = { id: 'p2', projectId: mockProjectId, status: 'completed' };

      vi.mocked(fs.readdirSync).mockReturnValue(['p1.json', 'p2.json'] as any);
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(JSON.stringify(pipeline1))
        .mockReturnValueOnce(JSON.stringify(pipeline2));

      const result = service.list(mockProjectId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p2');
    });

    it('should skip non-json files', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['p1.json', 'readme.txt', 'p2.json'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ id: 'test' }));

      const result = service.list(mockProjectId);

      expect(result).toHaveLength(2);
    });

    it('should handle filesystem errors gracefully', () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = service.list(mockProjectId);

      expect(result).toEqual([]);
    });
  });

  describe('getActive', () => {
    it('should return first active pipeline', () => {
      const pipelines = [
        { id: 'p1', status: 'completed' },
        { id: 'p2', status: 'active' },
        { id: 'p3', status: 'failed' },
      ];

      vi.mocked(fs.readdirSync).mockReturnValue(['p1.json', 'p2.json', 'p3.json'] as any);
      pipelines.forEach((p, i) => {
        vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify(p));
      });

      const result = service.getActive(mockProjectId);

      expect(result?.id).toBe('p2');
    });

    it('should return null when no active pipelines', () => {
      const pipelines = [
        { id: 'p1', status: 'completed' },
        { id: 'p2', status: 'failed' },
      ];

      vi.mocked(fs.readdirSync).mockReturnValue(['p1.json', 'p2.json'] as any);
      pipelines.forEach(p => {
        vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify(p));
      });

      const result = service.getActive(mockProjectId);

      expect(result).toBeNull();
    });
  });

  describe('task operations', () => {
    let pipeline: Pipeline;

    beforeEach(() => {
      pipeline = service.create(mockProjectId, 'Test', '/workspace');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
    });

    describe('startTask', () => {
      it('should mark task as in-progress', () => {
        const taskId = pipeline.phases[0].tasks[0].id;

        const updated = service.startTask(mockProjectId, pipeline.id, taskId);

        expect(updated?.phases[0].tasks[0].status).toBe('in-progress');
        expect(updated?.phases[0].tasks[0].startedAt).toBeDefined();
      });

      it('should not restart already started task', () => {
        const taskId = pipeline.phases[0].tasks[0].id;
        service.startTask(mockProjectId, pipeline.id, taskId);

        const firstStart = pipeline.phases[0].tasks[0].startedAt;
        
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
        const updated = service.startTask(mockProjectId, pipeline.id, taskId);

        expect(updated?.phases[0].tasks[0].startedAt).toBe(firstStart);
      });
    });

    describe('completeTask', () => {
      it('should mark task as completed with output', () => {
        const taskId = pipeline.phases[0].tasks[0].id;
        const output = 'Task completed successfully';
        const artifacts = ['file1.ts', 'file2.ts'];

        const updated = service.completeTask(
          mockProjectId,
          pipeline.id,
          taskId,
          output,
          artifacts
        );

        expect(updated?.phases[0].tasks[0].status).toBe('completed');
        expect(updated?.phases[0].tasks[0].output).toBe(output);
        expect(updated?.phases[0].tasks[0].artifacts).toEqual(artifacts);
        expect(updated?.phases[0].tasks[0].completedAt).toBeDefined();
      });

      it('should set phase to awaiting-approval when all tasks done', () => {
        const taskId = pipeline.phases[0].tasks[0].id;

        const updated = service.completeTask(mockProjectId, pipeline.id, taskId, 'Done');

        expect(updated?.phases[0].status).toBe('awaiting-approval');
      });
    });

    describe('failTask', () => {
      it('should mark task and phase as failed', () => {
        const taskId = pipeline.phases[0].tasks[0].id;
        const reason = 'Task failed due to error';

        const updated = service.failTask(mockProjectId, pipeline.id, taskId, reason);

        expect(updated?.phases[0].tasks[0].status).toBe('failed');
        expect(updated?.phases[0].tasks[0].output).toBe(reason);
        expect(updated?.phases[0].status).toBe('failed');
        expect(updated?.status).toBe('failed');
      });
    });
  });

  describe('phase operations', () => {
    let pipeline: Pipeline;

    beforeEach(() => {
      pipeline = service.create(mockProjectId, 'Test', '/workspace');
      const taskId = pipeline.phases[0].tasks[0].id;
      pipeline.phases[0].status = 'awaiting-approval';
      pipeline.phases[0].tasks[0].status = 'completed';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
    });

    describe('approvePhase', () => {
      it('should approve phase and advance to next', () => {
        const updated = service.approvePhase(mockProjectId, pipeline.id);

        expect(updated?.phases[0].status).toBe('approved');
        expect(updated?.phases[0].approvedAt).toBeDefined();
        expect(updated?.phases[0].approvedBy).toBe('programmer');
        expect(updated?.currentPhase).toBe(1);
        expect(updated?.phases[1].status).toBe('in-progress');
      });

      it('should allow custom approver name', () => {
        const updated = service.approvePhase(mockProjectId, pipeline.id, 'john-doe');

        expect(updated?.phases[0].approvedBy).toBe('john-doe');
      });

      it('should complete pipeline at last phase', () => {
        pipeline.currentPhase = 4;
        pipeline.phases[4].status = 'awaiting-approval';
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));

        const updated = service.approvePhase(mockProjectId, pipeline.id);

        expect(updated?.status).toBe('completed');
        expect(updated?.completedAt).toBeDefined();
      });
    });

    describe('rejectPhase', () => {
      it('should reset phase to in-progress', () => {
        const feedback = 'Please revise the architecture';

        const updated = service.rejectPhase(mockProjectId, pipeline.id, feedback);

        expect(updated?.phases[0].status).toBe('in-progress');
        expect(updated?.phases[0].tasks[0].status).toBe('pending');
        expect(updated?.phases[0].tasks[0].output).toContain(feedback);
      });
    });
  });

  describe('getStatusSummary', () => {
    it('should generate formatted status summary', () => {
      const pipeline = service.create(mockProjectId, 'Build API', '/workspace');
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));

      const summary = service.getStatusSummary(mockProjectId, pipeline.id);

      expect(summary).toContain('Pipeline: Build API');
      expect(summary).toContain('Status: active');
      expect(summary).toContain('Planning');
      expect(summary).toContain('Product Manager');
    });

    it('should return error for non-existent pipeline', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const summary = service.getStatusSummary(mockProjectId, 'non-existent');

      expect(summary).toBe('Pipeline not found.');
    });
  });

  describe('delete', () => {
    it('should delete pipeline file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

      const result = service.delete(mockProjectId, 'pipeline-123');

      expect(result).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should return false for non-existent pipeline', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = service.delete(mockProjectId, 'non-existent');

      expect(result).toBe(false);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
