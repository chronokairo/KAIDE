import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { ApiKeyService } from '../ApiKeyService';
import { ProjectService } from '../ProjectService';
import { Project } from '../../entities/Project';
import { ApiKey } from '../../entities/ApiKey';
import { CryptoUtils } from '../../utils/crypto';

describe('ApiKeyService', () => {
  let db: DataSource;
  let service: ApiKeyService;
  let projectService: ProjectService;
  let testProject: Project;

  beforeEach(async () => {
    db = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [Project, ApiKey],
    });
    await db.initialize();
    service = new ApiKeyService(db);
    projectService = new ProjectService(db);
    testProject = await projectService.create({ name: 'Test Project' });
  });

  afterEach(async () => {
    if (db?.isInitialized) {
      await db.destroy();
    }
  });

  describe('generate', () => {
    it('should generate an API key', async () => {
      const result = await service.generate(testProject.id, 'Development Key');

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Development Key');
      expect(result.key).toBeDefined();
      expect(result.key).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.keyHash).toBeDefined();
      expect(result.isActive).toBe(true);
    });

    it('should hash the API key', async () => {
      const result = await service.generate(testProject.id, 'Test Key');

      const expectedHash = CryptoUtils.hashApiKey(result.key);
      expect(result.keyHash).toBe(expectedHash);
    });

    it('should generate unique keys', async () => {
      const key1 = await service.generate(testProject.id, 'Key 1');
      const key2 = await service.generate(testProject.id, 'Key 2');

      expect(key1.key).not.toBe(key2.key);
      expect(key1.keyHash).not.toBe(key2.keyHash);
    });

    it('should throw error if project not found', async () => {
      await expect(
        service.generate('non-existent', 'Test Key')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('listByProject', () => {
    it('should list all active keys for a project', async () => {
      await service.generate(testProject.id, 'Key 1');
      await service.generate(testProject.id, 'Key 2');

      const keys = await service.listByProject(testProject.id);

      expect(keys).toHaveLength(2);
      expect(keys.map(k => k.name)).toContain('Key 1');
      expect(keys.map(k => k.name)).toContain('Key 2');
    });

    it('should not include revoked keys', async () => {
      const key1 = await service.generate(testProject.id, 'Active Key');
      const key2 = await service.generate(testProject.id, 'Revoked Key');
      await service.revoke(key2.id);

      const keys = await service.listByProject(testProject.id);

      expect(keys).toHaveLength(1);
      expect(keys[0].name).toBe('Active Key');
    });

    it('should order by createdAt DESC', async () => {
      await service.generate(testProject.id, 'First');
      await service.generate(testProject.id, 'Second');
      await service.generate(testProject.id, 'Third');

      const keys = await service.listByProject(testProject.id);

      expect(keys[0].name).toBe('Third');
      expect(keys[1].name).toBe('Second');
      expect(keys[2].name).toBe('First');
    });

    it('should return empty array for project with no keys', async () => {
      const newProject = await projectService.create({ name: 'Empty Project' });
      const keys = await service.listByProject(newProject.id);

      expect(keys).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate a correct API key', async () => {
      const generated = await service.generate(testProject.id, 'Valid Key');

      const validated = await service.validate(generated.key);

      expect(validated).toBeDefined();
      expect(validated?.id).toBe(generated.id);
      expect(validated?.name).toBe('Valid Key');
    });

    it('should update lastUsed timestamp', async () => {
      const generated = await service.generate(testProject.id, 'Test Key');
      const beforeValidation = new Date();

      await service.validate(generated.key);

      const repo = db.getRepository(ApiKey);
      const updated = await repo.findOne({ where: { id: generated.id } });
      expect(updated?.lastUsed).toBeDefined();
      if (updated?.lastUsed) {
        const lastUsedDate = new Date(updated.lastUsed);
        expect(lastUsedDate.getTime()).toBeGreaterThanOrEqual(beforeValidation.getTime());
      }
    });

    it('should return null for invalid key', async () => {
      const validated = await service.validate('invalid-key-12345');

      expect(validated).toBeNull();
    });

    it('should return null for revoked key', async () => {
      const generated = await service.generate(testProject.id, 'Revoked Key');
      await service.revoke(generated.id);

      const validated = await service.validate(generated.key);

      expect(validated).toBeNull();
    });
  });

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      const key = await service.generate(testProject.id, 'To Revoke');

      const result = await service.revoke(key.id);

      expect(result).toBe(true);
      const repo = db.getRepository(ApiKey);
      const revoked = await repo.findOne({ where: { id: key.id } });
      expect(revoked?.isActive).toBe(false);
      expect(revoked?.revokedAt).toBeDefined();
    });

    it('should set revokedAt timestamp', async () => {
      const key = await service.generate(testProject.id, 'To Revoke');
      const beforeRevoke = new Date();

      await service.revoke(key.id);

      const repo = db.getRepository(ApiKey);
      const revoked = await repo.findOne({ where: { id: key.id } });
      expect(revoked?.revokedAt).toBeDefined();
      if (revoked?.revokedAt) {
        expect(revoked.revokedAt.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
      }
    });

    it('should throw error if key not found', async () => {
      await expect(service.revoke('non-existent')).rejects.toThrow('API key not found');
    });
  });
});
