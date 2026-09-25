import { DataSource, Repository } from 'typeorm';
import { Workflow, WorkflowStep, WorkflowTrigger, RetryPolicy, WorkflowExecution } from '../entities/Workflow';

export interface CreateWorkflowInput {
  workspaceId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  schedule?: string;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
}

export class WorkflowService {
  private repo: Repository<Workflow>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(Workflow);
  }

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const workflow = this.repo.create({
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description || null,
      steps: input.steps,
      triggers: input.triggers,
      schedule: input.schedule || null,
      retryPolicy: input.retryPolicy || { maxRetries: 3, backoffMultiplier: 2, initialDelayMs: 1000 },
      timeoutMs: input.timeoutMs || 3600000,
      status: 'active',
      executionHistory: [],
    });
    return this.repo.save(workflow);
  }

  async getById(id: string): Promise<Workflow | null> {
    return this.repo.findOne({ where: { id } });
  }

  async listByWorkspace(workspaceId: string, onlyActive: boolean = true): Promise<Workflow[]> {
    return this.repo.find({
      where: onlyActive ? { workspaceId, status: 'active' } : { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      steps: WorkflowStep[];
      triggers: WorkflowTrigger[];
      schedule: string;
      retryPolicy: RetryPolicy;
      status: 'active' | 'paused' | 'archived';
    }>
  ): Promise<Workflow | null> {
    await this.repo.update(id, updates);
    return this.getById(id);
  }

  async recordExecution(
    id: string,
    execution: WorkflowExecution
  ): Promise<Workflow | null> {
    const workflow = await this.getById(id);
    if (!workflow) return null;

    const history = [...workflow.executionHistory, execution];
    const totalExecutions = workflow.totalExecutions + 1;
    const successfulExecutions =
      workflow.successfulExecutions +
      (execution.status === 'completed' ? 1 : 0);
    const failedExecutions =
      workflow.failedExecutions + (execution.status === 'failed' ? 1 : 0);

    await this.repo.update(id, {
      executionHistory: history,
      lastExecutedAt: new Date(),
      totalExecutions,
      successfulExecutions,
      failedExecutions,
    });

    return this.getById(id);
  }

  async getExecutionHistory(id: string, limit: number = 10): Promise<WorkflowExecution[]> {
    const workflow = await this.getById(id);
    if (!workflow) return [];
    return workflow.executionHistory.slice(-limit);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getStats(workspaceId: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
  }> {
    const workflows = await this.listByWorkspace(workspaceId, false);
    const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
    const totalExecutions = workflows.reduce((sum, w) => sum + w.totalExecutions, 0);
    const successfulExecutions = workflows.reduce(
      (sum, w) => sum + w.successfulExecutions,
      0
    );
    const successRate =
      totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    return {
      totalWorkflows: workflows.length,
      activeWorkflows,
      totalExecutions,
      successRate,
    };
  }
}
