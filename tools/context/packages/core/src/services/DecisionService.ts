import { DataSource } from 'typeorm';
import { Decision } from '../entities/Decision';
import { Project } from '../entities/Project';

export class DecisionService {
  private repo;
  private projectRepo;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(Decision);
    this.projectRepo = db.getRepository(Project);
  }

  async listByProject(projectId: string) {
    return this.repo.find({
      where: { project: { id: projectId } },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async get(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['project'] });
  }

  async create(input: {
    projectId: string;
    title: string;
    description: string;
    rationale?: Record<string, any> | null;
    alternatives?: Record<string, any> | null;
  }) {
    const project = await this.projectRepo.findOne({ where: { id: input.projectId } });
    if (!project) throw new Error(`Project not found: ${input.projectId}`);

    const decision = this.repo.create({
      title: input.title,
      description: input.description,
      rationale: input.rationale || undefined,
      alternatives: input.alternatives || undefined,
      project,
    });
    return this.repo.save(decision);
  }

  async update(id: string, input: {
    title?: string;
    description?: string;
    status?: string;
    rationale?: Record<string, any> | null;
    alternatives?: Record<string, any> | null;
  }) {
    const decision = await this.get(id);
    if (!decision) throw new Error(`Decision not found: ${id}`);
    Object.assign(decision, input);
    return this.repo.save(decision);
  }

  async delete(id: string) {
    const decision = await this.get(id);
    if (!decision) throw new Error(`Decision not found: ${id}`);
    await this.repo.remove(decision);
    return true;
  }
}
