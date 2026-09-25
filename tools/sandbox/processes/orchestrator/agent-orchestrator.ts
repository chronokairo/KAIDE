import { ContainerConfig, ContainerMode } from '../../entities/docker/model/types';
import { RealDockerService } from '../docker/real-docker-service';

export interface OrchestratorConfig {
  defaultMode: ContainerMode;
  maxContainers: number;
  autoCleanup: boolean;
}

export interface TaskPlan {
  id: string;
  description: string;
  steps: TaskStep[];
  status: TaskStatus;
  containerId?: string;
}

export interface TaskStep {
  id: string;
  command: string;
  description: string;
  status: TaskStepStatus;
  output?: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export class AgentOrchestrator {
  private dockerService: RealDockerService;
  private config: OrchestratorConfig;
  private tasks: Map<string, TaskPlan> = new Map();
  private activeContainer: ContainerConfig | null = null;

  constructor(dockerService: RealDockerService, config?: Partial<OrchestratorConfig>) {
    this.dockerService = dockerService;
    this.config = {
      defaultMode: config?.defaultMode || 'ubuntu',
      maxContainers: config?.maxContainers || 3,
      autoCleanup: config?.autoCleanup ?? true,
    };
  }

  async initialize(): Promise<void> {
    const container = await this.dockerService.createContainer(
      'default-agent-container',
      this.config.defaultMode
    );
    
    this.activeContainer = container;
  }

  async executeTask(plan: TaskPlan): Promise<TaskPlan> {
    if (!this.activeContainer) {
      await this.initialize();
    }

    plan.containerId = this.activeContainer?.id;
    plan.status = 'running';
    this.tasks.set(plan.id, plan);

    for (const step of plan.steps) {
      try {
        step.status = 'running';
        
        const result = await this.dockerService.executeCommand({
          containerId: this.activeContainer!.id,
          command: step.command,
        });

        step.output = result.output;
        step.status = result.success ? 'completed' : 'failed';

        if (!result.success) {
          plan.status = 'failed';
          break;
        }
      } catch (error) {
        step.status = 'failed';
        step.output = error instanceof Error ? error.message : 'Unknown error';
        plan.status = 'failed';
        break;
      }
    }

    if (plan.status === 'running') {
      plan.status = 'completed';
    }

    this.tasks.set(plan.id, plan);
    return plan;
  }

  async getTaskStatus(taskId: string): Promise<TaskPlan | undefined> {
    return this.tasks.get(taskId);
  }

  async listTasks(): Promise<TaskPlan[]> {
    return Array.from(this.tasks.values());
  }

  async getActiveContainer(): Promise<ContainerConfig | null> {
    return this.activeContainer;
  }

  async cleanup(): Promise<void> {
    if (this.activeContainer && this.config.autoCleanup) {
      await this.dockerService.removeContainer(this.activeContainer.id);
      this.activeContainer = null;
    }
  }
}
