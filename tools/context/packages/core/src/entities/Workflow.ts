import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  taskType: string;
  input: Record<string, any>;
  dependsOn?: string[];
  timeout?: number;
}

export interface WorkflowTrigger {
  type: 'cron' | 'event' | 'manual' | 'webhook';
  config: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface WorkflowExecution {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  tasksRun: number;
  tasksFailed: number;
  result?: Record<string, any>;
  error?: string;
}

@Entity()
@Index(['workspaceId', 'name'], { unique: true })
@Index(['workspaceId', 'status'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('simple-json')
  steps: WorkflowStep[];

  @Column('simple-json')
  triggers: WorkflowTrigger[];

  @Column('text', { nullable: true })
  schedule: string | null; // Cron expression

  @Column('simple-json')
  retryPolicy: RetryPolicy;

  @Column('integer', { default: 3600000 })
  timeoutMs: number;

  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'archived';

  @Column('simple-json', { default: '[]' })
  executionHistory: WorkflowExecution[];

  @Column({ nullable: true })
  lastExecutedAt: Date | null;

  @Column({ default: 0 })
  totalExecutions: number;

  @Column({ default: 0 })
  successfulExecutions: number;

  @Column({ default: 0 })
  failedExecutions: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
