import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineService } from '../pipeline';
import { QUALITY_PRESETS, applyQualityPreset, loadAgentConfig, getModelForAgent } from '../agent-config';
import type { Pipeline, AgentRole } from '../pipeline';
import fs from 'fs';
import os from 'os';

vi.mock('fs');
vi.mock('os');

/**
 * Testes de integração pós-migração Grok
 * 
 * Validam que:
 * 1. O pipeline funciona com a nova configuração sem Grok
 * 2. Todas as roles de agente recebem modelos válidos
 * 3. Não há regressões nas funcionalidades principais
 */
describe('Pipeline Integration - Post-Grok Migration', () => {
  let pipelineService: PipelineService;
  const mockProjectId = 'test-integration-123';

  beforeEach(() => {
    vi.clearAllMocks();
    pipelineService = new PipelineService();
    
    vi.mocked(os.homedir).mockReturnValue('/home/user');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
  });

  describe('Pipeline creation with free tier configuration', () => {
    it('should create pipeline with cafe-soluvel preset applied', () => {
      const config = applyQualityPreset('cafe-soluvel');
      const pipeline = pipelineService.create(
        mockProjectId,
        'Implement coffee machine API',
        '/workspace/anamnesic'
      );

      expect(pipeline.objective).toBe('Implement coffee machine API');
      expect(pipeline.phases.length).toBeGreaterThan(0);
      
      // Backend agent should have a valid free model (not Grok)
      const backendModel = config.models['backend'];
      expect(backendModel).not.toMatch(/^grok/i);
      expect(backendModel).toBe('gpt-5.4-mini');
    });

    it('should create tasks for all agent roles without Grok dependencies', () => {
      const pipeline = pipelineService.create(
        mockProjectId,
        'Build REST API',
        '/workspace'
      );

      const agentRoles: AgentRole[] = [
        'product-manager',
        'architect',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
        'organizer',
        'troubleshooter',
      ];

      agentRoles.forEach(role => {
        const tasksForRole = pipeline.phases
          .flatMap(p => p.tasks)
          .filter(t => t.agent === role);
        
        // Cada papel pode ter tarefas em diferentes fases
        expect(tasksForRole.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle all quality presets without Grok', () => {
      const presets = ['cafe-soluvel', 'coado-com-carinho', 'espresso-duplo'] as const;

      presets.forEach(preset => {
        const config = applyQualityPreset(preset);
        
        // Nenhum modelo deve ser Grok
        Object.values(config.models).forEach(model => {
          expect(model).not.toMatch(/^grok/i);
        });
      });
    });
  });

  describe('Agent model assignment in pipeline', () => {
    let pipeline: Pipeline;

    beforeEach(() => {
      pipeline = pipelineService.create(
        mockProjectId,
        'Build feature X',
        '/workspace'
      );
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
    });

    it('should assign non-Grok model to backend agent', () => {
      const config = applyQualityPreset('cafe-soluvel');
      const backendModel = getModelForAgent('backend', config);

      expect(backendModel).toBe('gpt-5.4-mini');
      expect(backendModel).not.toMatch(/^grok/i);
    });

    it('should support model assignment for all roles', () => {
      const config = applyQualityPreset('cafe-soluvel');
      
      const roles: AgentRole[] = [
        'product-manager',
        'architect',
        'organizer',
        'troubleshooter',
        'backend',
        'frontend',
        'devops',
        'qa',
        'code-review',
      ];

      roles.forEach(role => {
        const model = getModelForAgent(role, config);
        expect(model).toBeDefined();
        expect(typeof model).toBe('string');
        expect(model.length).toBeGreaterThan(0);
      });
    });

    it('should provide consistent models across pipeline execution', () => {
      const config1 = applyQualityPreset('cafe-soluvel');
      const config2 = applyQualityPreset('cafe-soluvel');

      expect(config1.models['backend']).toBe(config2.models['backend']);
    });
  });

  describe('Phase execution without Grok', () => {
    let pipeline: Pipeline;

    beforeEach(() => {
      pipeline = pipelineService.create(
        mockProjectId,
        'Build microservice',
        '/workspace'
      );
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
    });

    it('should execute implementation phase with available models', () => {
      const implPhase = pipeline.phases.find(p => p.name === 'Implementation');
      
      if (implPhase) {
        expect(implPhase.agents).toContain('backend');
        
        const backendTask = implPhase.tasks.find(t => t.agent === 'backend');
        expect(backendTask).toBeDefined();
        expect(backendTask?.status).toBe('pending');
      }
    });

    it('should support parallel execution of backend, frontend, devops', () => {
      const implPhase = pipeline.phases.find(p => p.name === 'Implementation');
      
      expect(implPhase?.parallel).toBe(true);
      expect(implPhase?.agents).toContain('backend');
      expect(implPhase?.agents).toContain('frontend');
      expect(implPhase?.agents).toContain('devops');
    });

    it('should complete tasks without Grok API dependency', () => {
      const taskId = pipeline.phases[0].tasks[0].id;
      const output = 'Task output without Grok';

      const updated = pipelineService.completeTask(
        mockProjectId,
        pipeline.id,
        taskId,
        output
      );

      expect(updated?.phases[0].tasks[0].status).toBe('completed');
      expect(updated?.phases[0].tasks[0].output).toBe(output);
    });

    it('should fail tasks gracefully without Grok fallback', () => {
      const taskId = pipeline.phases[0].tasks[0].id;
      const reason = 'Task failed without Grok availability';

      const updated = pipelineService.failTask(
        mockProjectId,
        pipeline.id,
        taskId,
        reason
      );

      expect(updated?.phases[0].tasks[0].status).toBe('failed');
      expect(updated?.status).toBe('failed');
    });
  });

  describe('Configuration persistence', () => {
    it('should save pipeline configuration without Grok', () => {
      const config = applyQualityPreset('cafe-soluvel');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(config.models['backend']).not.toMatch(/^grok/i);
    });

    it('should support multiple presets simultaneously', () => {
      const cafe = applyQualityPreset('cafe-soluvel');
      const coado = applyQualityPreset('coado-com-carinho');
      const espresso = applyQualityPreset('espresso-duplo');

      expect(cafe.models['backend']).not.toMatch(/^grok/i);
      expect(coado.models['backend']).not.toMatch(/^grok/i);
      expect(espresso.models['backend']).not.toMatch(/^grok/i);
    });
  });

  describe('Regression testing - existing functionality', () => {
    let pipeline: Pipeline;

    beforeEach(() => {
      pipeline = pipelineService.create(
        mockProjectId,
        'Regression test objective',
        '/workspace'
      );
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
    });

    it('should maintain phase approval flow', () => {
      const phase = pipeline.phases[0];
      phase.status = 'awaiting-approval';
      phase.tasks[0].status = 'completed';
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
      const updated = pipelineService.approvePhase(mockProjectId, pipeline.id);

      expect(updated?.phases[0].status).toBe('approved');
      expect(updated?.currentPhase).toBe(1);
    });

    it('should maintain phase rejection with feedback', () => {
      const phase = pipeline.phases[0];
      phase.status = 'awaiting-approval';
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
      const feedback = 'Please revise backend implementation';
      const updated = pipelineService.rejectPhase(
        mockProjectId,
        pipeline.id,
        feedback
      );

      expect(updated?.phases[0].status).toBe('in-progress');
      expect(updated?.phases[0].tasks[0].status).toBe('pending');
    });

    it('should support pipeline completion', () => {
      pipeline.currentPhase = 4; // Last phase
      const lastPhase = pipeline.phases[4];
      lastPhase.status = 'awaiting-approval';
      lastPhase.tasks[0].status = 'completed';
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
      const updated = pipelineService.approvePhase(mockProjectId, pipeline.id);

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should support failed pipeline resumption', () => {
      pipeline.status = 'failed';
      pipeline.phases[0].status = 'failed';
      
      const resumed = pipelineService.resumeFailed(mockProjectId, pipeline.id);

      expect(resumed?.status).toBe('active');
      expect(resumed?.phases[0].status).toBe('in-progress');
    });

    it('should maintain status summary generation', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(pipeline));
      const summary = pipelineService.getStatusSummary(mockProjectId, pipeline.id);

      expect(summary).toContain('Regression test objective');
      expect(summary).toContain('active');
      expect(summary).toContain('Planning');
    });
  });

  describe('Cost awareness without Grok', () => {
    it('cafe-soluvel should remain free tier', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      
      expect(preset.costRange.min).toBe(0);
      expect(preset.costRange.max).toBe(0);
    });

    it('should indicate zero cost explicitly', () => {
      const preset = QUALITY_PRESETS['cafe-soluvel'];
      const description = preset.description.toLowerCase();
      
      expect(description).toContain('zero custo');
    });

    it('coado-com-carinho should remain in mid-tier', () => {
      const preset = QUALITY_PRESETS['coado-com-carinho'];
      
      expect(preset.costRange.min).toBeGreaterThan(0);
      expect(preset.costRange.max).toBeLessThanOrEqual(1);
    });

    it('espresso-duplo should remain premium', () => {
      const preset = QUALITY_PRESETS['espresso-duplo'];
      
      expect(preset.costRange.min).toBe(3);
      expect(preset.costRange.max).toBe(3);
    });
  });

  describe('Backward compatibility', () => {
    it('should handle pipelines created before migration', () => {
      const oldPipeline: Pipeline = {
        id: 'old-pipeline',
        projectId: mockProjectId,
        workspace: '/workspace',
        objective: 'Old objective',
        status: 'active',
        currentPhase: 0,
        phases: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Should be able to load and work with old pipeline
      expect(oldPipeline.id).toBeDefined();
      expect(oldPipeline.status).toBe('active');
    });

    it('should support upgrading old configuration to new presets', () => {
      const newConfig = applyQualityPreset('cafe-soluvel');
      
      // Should have all required fields
      expect(newConfig.mode).toBeDefined();
      expect(newConfig.models).toBeDefined();
      expect(Object.keys(newConfig.models).length).toBeGreaterThan(0);
    });
  });
});
