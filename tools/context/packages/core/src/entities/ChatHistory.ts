import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ChatHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  channelId: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  sender: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
