import { describe, it, expect, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../agent-orchestrator';
import { RealDockerService } from '../../docker/real-docker-service';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let dockerService: RealDockerService;

  beforeEach(() => {
    dockerService = new RealDockerService();
    orchestrator = new AgentOrchestrator(dockerService, {
      defaultMode: 'ubuntu',
      maxContainers: 3,
      autoCleanup: true,
    });
  });

  it('should initialize with mock docker service', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should execute task plan with steps', async () => {
    await orchestrator.initialize();

    const plan = {
      id: 'test-plan',
      description: 'Test plan',
      steps: [
        {
          id: 'step1',
          command: 'echo "hello"',
          description: 'Say hello',
          status: 'pending' as const,
        },
      ],
      status: 'pending' as const,
    };

    const result = await orchestrator.executeTask(plan);
    expect(result.status).toBe('completed');
  });

  it('should get task status', async () => {
    await orchestrator.initialize();

    const plan = {
      id: 'test-plan',
      description: 'Test plan',
      steps: [],
      status: 'pending' as const,
    };

    await orchestrator.executeTask(plan);
    const status = await orchestrator.getTaskStatus('test-plan');

    expect(status).toBeDefined();
    expect(status?.id).toBe('test-plan');
  });

  it('should list tasks', async () => {
    await orchestrator.initialize();

    const tasks = await orchestrator.listTasks();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should cleanup resources', async () => {
    await orchestrator.initialize();
    await orchestrator.cleanup();

    const container = await orchestrator.getActiveContainer();
    expect(container).toBeNull();
  });
});
