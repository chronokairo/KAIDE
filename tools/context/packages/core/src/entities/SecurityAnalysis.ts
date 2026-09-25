import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type VulnerabilityType = 'injection' | 'xss' | 'csrf' | 'auth' | 'crypto' | 'dependency' | 'logic' | 'other';

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  cwe?: string;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  evidence?: string;
  remediationSteps: string[];
  references: string[];
  cvss?: number;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  steps: string[];
  timeEstimateHours: number;
}

@Entity()
@Index(['workspaceId', 'targetId', 'analyzedAt'])
@Index(['severity', 'analyzedAt'])
export class SecurityAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  targetId: string; // Project, codebase, or system ID

  @Column('text')
  targetName: string;

  @Column('text')
  type: 'code' | 'system' | 'api' | 'dependency' | 'infrastructure';

  @Column('simple-json')
  vulnerabilities: Vulnerability[];

  @Column('simple-json')
  recommendations: Recommendation[];

  @Column('text')
  severity: VulnerabilitySeverity;

  @Column('integer', { default: 0 })
  vulnerabilityCount: number;

  @Column('text', { nullable: true })
  scanMethod: string | null; // 'static' | 'dynamic' | 'hybrid'

  @Column('integer', { nullable: true })
  durationMs: number | null;

  @Column('text', { nullable: true })
  scannerVersion: string | null;

  @Column('text', { nullable: true })
  reportUrl: string | null;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  analyzedAt: Date;
}
