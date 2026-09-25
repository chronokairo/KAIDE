import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type PolicyDecisionType = 'auto-blocked' | 'approved' | 'rejected';

@Entity()
@Index(['workspaceId', 'createdAt'])
@Index(['planId', 'createdAt'])
export class PolicyDecisionAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  planId: string;

  @Column('uuid', { nullable: true })
  runId: string | null;

  @Column('uuid', { nullable: true })
  requestedByUserId: string | null;

  @Column('uuid', { nullable: true })
  approvedByUserId: string | null;

  @Column('text')
  mode: 'defensive' | 'controlled-red-team';

  @Column('simple-json', { default: '[]' })
  allowedCapabilities: string[];

  @Column('simple-json', { default: '[]' })
  blockedCapabilities: string[];

  @Column('simple-json', { nullable: true })
  approvedTestScope: string[] | null;

  @Column('text')
  decision: PolicyDecisionType;

  @Column('text', { nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
