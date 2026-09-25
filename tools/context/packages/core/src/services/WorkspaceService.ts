import { DataSource, Repository } from 'typeorm';
import { Workspace } from '../entities/Workspace';
import { WorkspaceMember, WorkspaceRole } from '../entities/WorkspaceMember';
import { User } from '../entities/User';

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
}

export class WorkspaceService {
  private workspaceRepo: Repository<Workspace>;
  private memberRepo: Repository<WorkspaceMember>;

  constructor(private db: DataSource) {
    this.workspaceRepo = db.getRepository(Workspace);
    this.memberRepo = db.getRepository(WorkspaceMember);
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({
      name: input.name,
      slug: input.slug.toLowerCase(),
      description: input.description || null,
      ownerId: input.ownerId,
      status: 'active',
    });

    const savedWorkspace = await this.workspaceRepo.save(workspace);

    // Add owner as member
    await this.memberRepo.save(
      this.memberRepo.create({
        workspaceId: savedWorkspace.id,
        userId: input.ownerId,
        role: 'owner',
      })
    );

    return savedWorkspace;
  }

  async getById(id: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { id },
      relations: ['projects', 'members', 'members.user', 'owner'],
    });
  }

  async getBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { slug: slug.toLowerCase() },
      relations: ['projects', 'members', 'members.user', 'owner'],
    });
  }

  async listByUser(userId: string): Promise<Workspace[]> {
    const members = await this.memberRepo.find({
      where: { userId },
      relations: ['workspace', 'workspace.owner', 'workspace.projects'],
    });
    return members.map((m) => m.workspace);
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    await this.workspaceRepo.update(id, data);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.workspaceRepo.update(id, { status: 'deleted' });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    const existing = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      throw new Error('User is already a member');
    }

    const member = this.memberRepo.create({
      workspaceId,
      userId,
      role,
    });
    return this.memberRepo.save(member);
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ workspaceId, userId });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember | null> {
    await this.memberRepo.update({ workspaceId, userId }, { role });
    return this.memberRepo.findOne({
      where: { workspaceId, userId },
      relations: ['user', 'workspace'],
    });
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.memberRepo.find({
      where: { workspaceId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }
}
