import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Task } from './Task';

export type AgentState = 'idle' | 'running' | 'paused' | 'error' | 'stopped';
export type AgentCapability = 'code-generation' | 'code-analysis' | 'security-analysis' | 'reasoning' | 'execution' | 'learning';

@Entity()
@Index(['workspaceId', 'name'], { unique: true })
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('text', { default: '1.0.0' })
  version: string;

  @Column('simple-array', { default: 'reasoning' })
  capabilities: AgentCapability[];

  @Column({ default: 'idle' })
  state: AgentState;

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-json', { nullable: true })
  config: {
    maxConcurrentTasks?: number;
    timeoutMs?: number;
    retryPolicy?: { maxRetries: number; backoffMultiplier: number };
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  } | null;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => Task, (task) => task.agent, { cascade: true, onDelete: 'CASCADE' })
  tasks: Task[];

  @Column('integer', { default: 0 })
  tasksCompleted: number;

  @Column('integer', { default: 0 })
  tasksFailed: number;

  @Column({ nullable: true })
  lastActivityAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
