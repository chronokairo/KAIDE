import { DataSource, Repository } from 'typeorm';
import { Agent, AgentState, AgentCapability } from '../entities/Agent';

export interface CreateAgentInput {
  workspaceId: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  config?: Record<string, any>;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  capabilities?: AgentCapability[];
  config?: Record<string, any>;
  state?: AgentState;
}

export class AgentService {
  private repo: Repository<Agent>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(Agent);
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    const agent = this.repo.create({
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description || null,
      capabilities: input.capabilities,
      config: input.config || null,
      state: 'idle',
      isActive: true,
    });
    return this.repo.save(agent);
  }

  async getById(id: string): Promise<Agent | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['tasks'],
    });
  }

  async getByName(workspaceId: string, name: string): Promise<Agent | null> {
    return this.repo.findOne({
      where: { workspaceId, name },
    });
  }

  async listByWorkspace(workspaceId: string, onlyActive: boolean = true): Promise<Agent[]> {
    return this.repo.find({
      where: onlyActive ? { workspaceId, isActive: true } : { workspaceId },
      relations: ['tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent | null> {
    await this.repo.update(id, input);
    return this.getById(id);
  }

  async setState(id: string, state: AgentState): Promise<Agent | null> {
    await this.repo.update(id, {
      state,
      lastActivityAt: new Date(),
    });
    return this.getById(id);
  }

  async incrementStats(id: string, success: boolean): Promise<void> {
    const agent = await this.getById(id);
    if (!agent) return;

    if (success) {
      await this.repo.update(id, { tasksCompleted: agent.tasksCompleted + 1 });
    } else {
      await this.repo.update(id, { tasksFailed: agent.tasksFailed + 1 });
    }

    await this.repo.update(id, { lastActivityAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getActiveAgents(workspaceId: string): Promise<Agent[]> {
    return this.repo.find({
      where: {
        workspaceId,
        isActive: true,
        state: 'idle', // or 'running'
      },
    });
  }

  async getStats(workspaceId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
  }> {
    const agents = await this.listByWorkspace(workspaceId, false);
    const activeAgents = agents.filter((a) => a.isActive).length;
    const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
    const totalTasksFailed = agents.reduce((sum, a) => sum + a.tasksFailed, 0);

    return {
      totalAgents: agents.length,
      activeAgents,
      totalTasksCompleted,
      totalTasksFailed,
    };
  }
}
