import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type ExecutionLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ExecutionPhase = 'planning' | 'reasoning' | 'execution' | 'validation' | 'completion';

@Entity()
@Index(['taskId', 'timestamp'])
@Index(['workspaceId', 'taskId'])
export class ExecutionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  taskId: string;

  @Column('uuid', { nullable: true })
  agentId: string | null;

  @Column('text')
  level: ExecutionLogLevel;

  @Column('text')
  phase: ExecutionPhase;

  @Column('text')
  message: string;

  @Column('simple-json', { nullable: true })
  data: Record<string, any> | null;

  @Column('text', { nullable: true })
  reasoning: string | null;

  @Column({ nullable: true })
  duration: number | null; // milliseconds

  @Column('text', { nullable: true })
  status: string | null; // status at this point

  @CreateDateColumn()
  timestamp: Date;
}
