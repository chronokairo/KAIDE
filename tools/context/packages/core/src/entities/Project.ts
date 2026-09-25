import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ContextEntry } from './ContextEntry';
import { Decision } from './Decision';
import { Workspace } from './Workspace';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column({ default: 'active' })
  status: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.projects, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;

  @Column('uuid', { nullable: true })
  workspaceId: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => ContextEntry, (context) => context.project, { cascade: true })
  contextEntries: ContextEntry[];

  @OneToMany(() => Decision, (decision) => decision.project, { cascade: true })
  decisions: Decision[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
