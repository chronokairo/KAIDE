import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './Project';

@Entity()
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  rationale: Record<string, any> | null;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  alternatives: Record<string, any> | null;

  @ManyToOne(() => Project, (project) => project.decisions, { onDelete: 'CASCADE' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
