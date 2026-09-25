import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type OrchestratorRunStatus = 'running' | 'paused' | 'completed' | 'failed';

@Entity()
@Index(['workspaceId', 'status'])
@Index(['planId', 'createdAt'])
export class OrchestratorRunRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  planId: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid', { nullable: true })
  workflowId: string | null;

  @Column('uuid', { nullable: true })
  executionAgentId: string | null;

  @Column('uuid', { nullable: true })
  requestedByUserId: string | null;

  @Column('text', { default: 'running' })
  status: OrchestratorRunStatus;

  @Column('integer', { default: 0 })
  currentStep: number;

  @Column('integer', { default: 1 })
  checkpointEverySteps: number;

  @Column('integer', { default: 28800000 })
  maxRuntimeMs: number;

  @Column('simple-json')
  statePayload: Record<string, any>;

  @Column('simple-json', { default: '[]' })
  stepTaskMap: Array<{ stepId: string; taskId: string; status: string }>;

  @Column('simple-json', { default: '[]' })
  checkpoints: Array<{ step: number; at: string; note: string; state: Record<string, any> }>;

  @Column('integer', { default: 0 })
  resumeCount: number;

  @Column('text', { nullable: true })
  failureReason: string | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
