import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User';

export interface CreateUserInput {
  email: string;
  fullName: string;
  avatar?: string;
}

export class UserService {
  private repo: Repository<User>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(User);
  }

  async create(input: CreateUserInput, passwordHash: string): Promise<User> {
    const user = this.repo.create({
      email: input.email,
      fullName: input.fullName,
      avatar: input.avatar || null,
      passwordHash,
      status: 'active',
    });
    return this.repo.save(user);
  }

  async getById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['workspaceMembers', 'workspaceMembers.workspace'],
    });
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase() },
      relations: ['workspaceMembers', 'workspaceMembers.workspace'],
    });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.getById(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async list(): Promise<User[]> {
    return this.repo.find({
      relations: ['workspaceMembers', 'workspaceMembers.workspace'],
      order: { createdAt: 'DESC' },
    });
  }
}
