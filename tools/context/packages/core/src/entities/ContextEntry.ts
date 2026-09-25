import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './Project';

@Entity()
export class ContextEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column('text')
  value: string;

  @Column({ default: 'general' })
  category: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ default: 1 })
  priority: number;

  @ManyToOne(() => Project, (project) => project.contextEntries, { onDelete: 'CASCADE' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
