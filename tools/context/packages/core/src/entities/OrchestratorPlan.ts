import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type OrchestratorPlanStatus = 'draft' | 'ready' | 'archived';

@Entity()
@Index(['workspaceId', 'createdAt'])
export class OrchestratorPlanRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid', { nullable: true })
  projectId: string | null;

  @Column('uuid', { nullable: true })
  createdByUserId: string | null;

  @Column('text')
  objective: string;

  @Column('simple-json')
  requestPayload: Record<string, any>;

  @Column('simple-json')
  planPayload: Record<string, any>;

  @Column('integer')
  complexityScore: number;

  @Column('text')
  reasoningMode: 'standard' | 'extended';

  @Column('text', { default: 'ready' })
  status: OrchestratorPlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
