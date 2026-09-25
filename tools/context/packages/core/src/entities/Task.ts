import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Agent } from './Agent';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
export type TaskType =
  | 'simple'
  | 'workflow'
  | 'scheduled'
  | 'security-analysis'
  | 'code-generation'
  | 'advanced-code-generation'
  | 'auto-debugging'
  | 'code-refactoring'
  | 'vulnerability-scan'
  | 'attack-simulation'
  | 'multi-step-problem-solving'
  | 'long-running-workflow'
  | 'multimodal-analysis'
  | 'scientific-analysis';

export interface TaskStep {
  stepNumber: number;
  description: string;
  status: TaskStatus;
  reasoning?: string;
  result?: Record<string, any>;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface ReasoningContext {
  reasoning: string;
  steps: Array<{
    number: number;
    thinking: string;
    decision: string;
  }>;
  uncertainties: string[];
  confidence: number;
  alternativeApproaches: string[];
}

@Entity()
@Index(['agentId', 'status'])
@Index(['workspaceId', 'createdAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @ManyToOne(() => Agent, (agent) => agent.tasks, { onDelete: 'CASCADE' })
  agent: Agent;

  @Column('uuid')
  agentId: string;

  @Column('text')
  type: TaskType;

  @Column('text')
  description: string;

  @Column('simple-json')
  input: Record<string, any>;

  @Column({ default: 'pending' })
  status: TaskStatus;

  @Column('simple-json', { nullable: true })
  reasoning: ReasoningContext | null;

  @Column('simple-json', { nullable: true })
  output: Record<string, any> | null;

  @Column('text', { nullable: true })
  error: string | null;

  @Column('simple-json', { default: '[]' })
  history: TaskStep[];

  @Column({ nullable: true })
  startedAt: Date | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @Column('integer', { default: 0 })
  durationMs: number;

  @Column({ default: 1 })
  retryCount: number;

  @Column({ nullable: true })
  parentTaskId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
