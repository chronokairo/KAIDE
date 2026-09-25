import { DataSource, Repository } from 'typeorm';
import { ExecutionLog, ExecutionLogLevel, ExecutionPhase } from '../entities/ExecutionLog';

export interface CreateExecutionLogInput {
  workspaceId: string;
  taskId: string;
  agentId?: string;
  level: ExecutionLogLevel;
  phase: ExecutionPhase;
  message: string;
  data?: Record<string, any>;
  reasoning?: string;
  duration?: number;
  status?: string;
}

export class ExecutionLogService {
  private repo: Repository<ExecutionLog>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(ExecutionLog);
  }

  async log(input: CreateExecutionLogInput): Promise<ExecutionLog> {
    const sanitized = this.sanitizeInput(input);
    const log = this.repo.create(sanitized);
    return this.repo.save(log);
  }

  async getTaskLogs(
    taskId: string,
    level?: ExecutionLogLevel,
    phase?: ExecutionPhase
  ): Promise<ExecutionLog[]> {
    return this.repo.find({
      where: level && phase
        ? { taskId, level, phase }
        : level
          ? { taskId, level }
          : phase
            ? { taskId, phase }
            : { taskId },
      order: { timestamp: 'ASC' },
    });
  }

  async getAgentLogs(
    agentId: string,
    limit: number = 100
  ): Promise<ExecutionLog[]> {
    return this.repo.find({
      where: { agentId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getWorkspaceLogs(
    workspaceId: string,
    level?: ExecutionLogLevel,
    limit: number = 100
  ): Promise<ExecutionLog[]> {
    return this.repo.find({
      where: level
        ? { workspaceId, level }
        : { workspaceId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getErrors(workspaceId: string, limit: number = 50): Promise<ExecutionLog[]> {
    return this.repo.find({
      where: { workspaceId, level: 'error' },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getPhaseStats(taskId: string): Promise<Record<ExecutionPhase, number>> {
    const logs = await this.getTaskLogs(taskId);
    return {
      planning: logs.filter((l) => l.phase === 'planning').length,
      reasoning: logs.filter((l) => l.phase === 'reasoning').length,
      execution: logs.filter((l) => l.phase === 'execution').length,
      validation: logs.filter((l) => l.phase === 'validation').length,
      completion: logs.filter((l) => l.phase === 'completion').length,
    };
  }

  async getTotalDuration(taskId: string): Promise<number> {
    const logs = await this.getTaskLogs(taskId);
    return logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  }

  async deleteOldLogs(olderThanDays: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - olderThanDays);

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('timestamp < :date', { date })
      .execute();

    return result.affected || 0;
  }

  private sanitizeInput(input: CreateExecutionLogInput): CreateExecutionLogInput {
    return {
      ...input,
      message: this.redactText(input.message),
      reasoning: input.reasoning ? this.redactText(input.reasoning) : undefined,
      data: input.data ? this.redactData(input.data) : undefined,
    };
  }

  private redactData(data: Record<string, any>): Record<string, any> {
    const clone = JSON.parse(JSON.stringify(data)) as Record<string, any>;
    const walk = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => walk(item));
      }
      if (value && typeof value === 'object') {
        const entryObj = value as Record<string, unknown>;
        const next: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(entryObj)) {
          if (/(token|secret|password|apikey|api_key|authorization|auth)/i.test(key)) {
            next[key] = '[REDACTED]';
          } else {
            next[key] = walk(inner);
          }
        }
        return next;
      }
      if (typeof value === 'string') {
        return this.redactText(value);
      }
      return value;
    };
    return walk(clone) as Record<string, any>;
  }

  private redactText(text: string): string {
    return text
      .replace(/(Bearer\s+)[A-Za-z0-9._\-+/=]+/gi, '$1[REDACTED]')
      .replace(/(api[_-]?key\s*[:=]\s*)[^\s"']+/gi, '$1[REDACTED]')
      .replace(/(token\s*[:=]\s*)[^\s"']+/gi, '$1[REDACTED]')
      .replace(/(password\s*[:=]\s*)[^\s"']+/gi, '$1[REDACTED]');
  }
}
