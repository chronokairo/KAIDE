import { DataSource } from 'typeorm';
import { ApiKey } from '../entities/ApiKey';
import { Project } from '../entities/Project';
import { CryptoUtils } from '../utils/crypto';

export class ApiKeyService {
  private repo;
  private projectRepo;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(ApiKey);
    this.projectRepo = db.getRepository(Project);
  }

  async listByProject(projectId: string) {
    return this.repo.find({
      where: { project: { id: projectId }, revokedAt: undefined },
      order: { createdAt: 'DESC' },
    });
  }

  async generate(projectId: string, name: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const plainKey = CryptoUtils.generateApiKey();
    const keyHash = CryptoUtils.hashApiKey(plainKey);

    const apiKey = this.repo.create({ name, keyHash, project });
    const saved = await this.repo.save(apiKey);

    return { ...saved, key: plainKey };
  }

  async validate(plainKey: string) {
    const keyHash = CryptoUtils.hashApiKey(plainKey);
    const stored = await this.repo.findOne({
      where: { keyHash, isActive: true },
      relations: ['project'],
    });
    if (!stored) return null;

    stored.lastUsed = new Date().toISOString();
    await this.repo.save(stored);
    return stored;
  }

  async revoke(keyId: string) {
    const apiKey = await this.repo.findOne({ where: { id: keyId } });
    if (!apiKey) throw new Error(`API key not found: ${keyId}`);

    apiKey.isActive = false;
    apiKey.revokedAt = new Date();
    await this.repo.save(apiKey);
    return true;
  }
}
