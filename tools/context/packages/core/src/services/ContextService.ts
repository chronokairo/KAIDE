import { DataSource, Like } from 'typeorm';
import { ContextEntry } from '../entities/ContextEntry';
import { Project } from '../entities/Project';
import { 
  reportContextEntryCreated, 
  reportContextEntryDeleted,
  reportBulkContextEntriesCreated,
  reportBulkContextEntriesDeleted,
  validateApiKeyAndCheckQuota,
  type UsageReport
} from './UsageMeteringService';

export class ContextService {
  private repo;
  private projectRepo;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(ContextEntry);
    this.projectRepo = db.getRepository(Project);
  }

  async listByProject(projectId: string, category?: string) {
    const where: any = { project: { id: projectId } };
    if (category) where.category = category;

    return this.repo.find({
      where,
      relations: ['project'],
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async get(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['project'] });
  }

  async search(projectId: string, query: string) {
    return this.repo
      .createQueryBuilder('ctx')
      .leftJoinAndSelect('ctx.project', 'project')
      .where('ctx.projectId = :projectId', { projectId })
      .andWhere('(ctx.key LIKE :q OR ctx.value LIKE :q)', { q: `%${query}%` })
      .orderBy('ctx.priority', 'DESC')
      .getMany();
  }

  async create(input: {
    projectId: string;
    key: string;
    value: string;
    category?: string;
    priority?: number;
    metadata?: Record<string, any> | null;
  }) {
    // Check quota if SaaS is configured
    const quota = await validateApiKeyAndCheckQuota();
    if (quota && quota.usage.remaining <= 0) {
      throw new Error(
        `Context entry quota exceeded. You have ${quota.usage.contextEntries} entries ` +
        `out of ${quota.usage.contextEntriesLimit} allowed. Please upgrade your plan.`
      );
    }

    const project = await this.projectRepo.findOne({ where: { id: input.projectId } });
    if (!project) throw new Error(`Project not found: ${input.projectId}`);

    const entry = this.repo.create({
      key: input.key,
      value: input.value,
      category: input.category || 'general',
      priority: input.priority || 1,
      metadata: input.metadata || undefined,
      project,
    });
    const saved = await this.repo.save(entry);
    
    // Report usage to SaaS if configured
    reportContextEntryCreated(input.projectId).catch(() => {});
    
    return saved;
  }

  async update(id: string, input: {
    key?: string;
    value?: string;
    category?: string;
    priority?: number;
    metadata?: Record<string, any> | null;
  }) {
    const entry = await this.get(id);
    if (!entry) throw new Error(`Context entry not found: ${id}`);
    Object.assign(entry, input);
    return this.repo.save(entry);
  }

  async delete(id: string) {
    const entry = await this.get(id);
    if (!entry) throw new Error(`Context entry not found: ${id}`);
    await this.repo.remove(entry);
    
    // Report usage to SaaS if configured
    reportContextEntryDeleted(entry.project.id).catch(() => {});
    
    return true;
  }
}
