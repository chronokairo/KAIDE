import { DataSource } from 'typeorm';
import { Project } from '../entities/Project';
import { CreateProjectInput, UpdateProjectInput } from '../validation/schemas';

export class ProjectService {
  private repo;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(Project);
  }

  async list() {
    return this.repo.find({
      relations: ['contextEntries', 'decisions'],
      order: { createdAt: 'DESC' },
    });
  }

  async get(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['contextEntries', 'decisions'],
    });
  }

  async findByName(name: string) {
    return this.repo.findOne({
      where: { name },
      relations: ['contextEntries', 'decisions'],
    });
  }

  /** Find a project linked to a workspace directory */
  async findByWorkspace(workspacePath: string) {
    const all = await this.list();
    // metadata is simple-json, stored as string — compare workspace field
    return all.find(p => {
      if (!p.metadata) return false;
      const ws = (p.metadata as any).workspace;
      return ws && this._normalizePath(ws) === this._normalizePath(workspacePath);
    }) || null;
  }

  /** Link a project to a workspace directory */
  async linkWorkspace(id: string, workspacePath: string) {
    const project = await this.get(id);
    if (!project) throw new Error(`Project not found: ${id}`);
    project.metadata = { ...(project.metadata || {}), workspace: workspacePath };
    return this.repo.save(project);
  }

  private _normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  }

  async create(input: CreateProjectInput) {
    const project = this.repo.create(input);
    return this.repo.save(project);
  }

  async update(id: string, input: UpdateProjectInput) {
    const project = await this.get(id);
    if (!project) throw new Error(`Project not found: ${id}`);
    Object.assign(project, input);
    return this.repo.save(project);
  }

  async delete(id: string) {
    const project = await this.get(id);
    if (!project) throw new Error(`Project not found: ${id}`);
    await this.repo.remove(project);
    return true;
  }
}
