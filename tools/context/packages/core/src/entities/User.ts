import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { WorkspaceMember } from './WorkspaceMember';

@Entity()
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  passwordHash: string;

  @Column('text')
  fullName: string;

  @Column('text', { nullable: true })
  avatar: string | null;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(
    () => WorkspaceMember,
    (member) => member.user,
    { cascade: true, onDelete: 'CASCADE' }
  )
  workspaceMembers: WorkspaceMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date | null;
}
