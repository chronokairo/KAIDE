import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { ContextService } from '../ContextService';
import { ProjectService } from '../ProjectService';
import { Project } from '../../entities/Project';
import { ContextEntry } from '../../entities/ContextEntry';

describe('ContextService', () => {
  let db: DataSource;
  let service: ContextService;
  let projectService: ProjectService;
  let testProject: Project;

  beforeEach(async () => {
    db = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [Project, ContextEntry],
    });
    await db.initialize();
    service = new ContextService(db);
    projectService = new ProjectService(db);
    testProject = await projectService.create({ name: 'Test Project' });
  });

  afterEach(async () => {
    if (db?.isInitialized) {
      await db.destroy();
    }
  });

  describe('create', () => {
    it('should create a context entry', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'tech-stack',
        value: 'Node.js, TypeScript',
        category: 'architecture',
        priority: 3,
      });

      expect(entry.id).toBeDefined();
      expect(entry.key).toBe('tech-stack');
      expect(entry.value).toBe('Node.js, TypeScript');
      expect(entry.category).toBe('architecture');
      expect(entry.priority).toBe(3);
    });

    it('should default to general category', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'note',
        value: 'Some note',
      });

      expect(entry.category).toBe('general');
    });

    it('should default to priority 1', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'note',
        value: 'Some note',
      });

      expect(entry.priority).toBe(1);
    });

    it('should accept metadata', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'api',
        value: 'REST API',
        metadata: { version: '1.0', author: 'dev-team' },
      });

      expect(entry.metadata).toEqual({ version: '1.0', author: 'dev-team' });
    });

    it('should throw error if project not found', async () => {
      await expect(
        service.create({
          projectId: 'non-existent',
          key: 'test',
          value: 'value',
        })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('listByProject', () => {
    beforeEach(async () => {
      await service.create({
        projectId: testProject.id,
        key: 'key1',
        value: 'value1',
        category: 'architecture',
        priority: 3,
      });
      await service.create({
        projectId: testProject.id,
        key: 'key2',
        value: 'value2',
        category: 'requirements',
        priority: 2,
      });
      await service.create({
        projectId: testProject.id,
        key: 'key3',
        value: 'value3',
        category: 'architecture',
        priority: 4,
      });
    });

    it('should list all entries for a project', async () => {
      const entries = await service.listByProject(testProject.id);

      expect(entries).toHaveLength(3);
    });

    it('should order by priority DESC, then createdAt DESC', async () => {
      const entries = await service.listByProject(testProject.id);

      expect(entries[0].key).toBe('key3'); // priority 4
      expect(entries[1].key).toBe('key1'); // priority 3
      expect(entries[2].key).toBe('key2'); // priority 2
    });

    it('should filter by category', async () => {
      const entries = await service.listByProject(testProject.id, 'architecture');

      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.category === 'architecture')).toBe(true);
    });

    it('should return empty array for project with no entries', async () => {
      const newProject = await projectService.create({ name: 'Empty Project' });
      const entries = await service.listByProject(newProject.id);

      expect(entries).toEqual([]);
    });
  });

  describe('get', () => {
    it('should get entry by id', async () => {
      const created = await service.create({
        projectId: testProject.id,
        key: 'test-key',
        value: 'test-value',
      });

      const entry = await service.get(created.id);

      expect(entry).toBeDefined();
      expect(entry?.id).toBe(created.id);
      expect(entry?.key).toBe('test-key');
    });

    it('should return null for non-existent entry', async () => {
      const entry = await service.get('non-existent');

      expect(entry).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.create({
        projectId: testProject.id,
        key: 'typescript',
        value: 'TypeScript is used for type safety',
      });
      await service.create({
        projectId: testProject.id,
        key: 'database',
        value: 'PostgreSQL for data persistence',
      });
      await service.create({
        projectId: testProject.id,
        key: 'api',
        value: 'REST API with TypeScript',
      });
    });

    it('should search by key', async () => {
      const results = await service.search(testProject.id, 'typescript');

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('typescript');
    });

    it('should search by value', async () => {
      const results = await service.search(testProject.id, 'TypeScript');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.key)).toContain('typescript');
      expect(results.map(r => r.key)).toContain('api');
    });

    it('should order results by priority DESC', async () => {
      await service.update((await service.search(testProject.id, 'TypeScript'))[0].id, {
        priority: 1,
      });
      await service.update((await service.search(testProject.id, 'TypeScript'))[1].id, {
        priority: 3,
      });

      const results = await service.search(testProject.id, 'TypeScript');

      expect(results[0].priority).toBeGreaterThanOrEqual(results[1].priority);
    });

    it('should return empty array if no matches', async () => {
      const results = await service.search(testProject.id, 'nonexistent');

      expect(results).toEqual([]);
    });

    it('should be case insensitive (SQL LIKE)', async () => {
      const results = await service.search(testProject.id, 'TYPESCRIPT');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update entry key', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'old-key',
        value: 'value',
      });

      const updated = await service.update(entry.id, { key: 'new-key' });

      expect(updated.key).toBe('new-key');
    });

    it('should update entry value', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'key',
        value: 'old value',
      });

      const updated = await service.update(entry.id, { value: 'new value' });

      expect(updated.value).toBe('new value');
    });

    it('should update category', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'key',
        value: 'value',
        category: 'general',
      });

      const updated = await service.update(entry.id, { category: 'architecture' });

      expect(updated.category).toBe('architecture');
    });

    it('should update priority', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'key',
        value: 'value',
        priority: 1,
      });

      const updated = await service.update(entry.id, { priority: 4 });

      expect(updated.priority).toBe(4);
    });

    it('should update metadata', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'key',
        value: 'value',
      });

      const updated = await service.update(entry.id, {
        metadata: { tag: 'important' },
      });

      expect(updated.metadata).toEqual({ tag: 'important' });
    });

    it('should throw error if entry not found', async () => {
      await expect(
        service.update('non-existent', { key: 'new-key' })
      ).rejects.toThrow('Context entry not found');
    });
  });

  describe('delete', () => {
    it('should delete entry', async () => {
      const entry = await service.create({
        projectId: testProject.id,
        key: 'to-delete',
        value: 'value',
      });

      const result = await service.delete(entry.id);

      expect(result).toBe(true);
      const deleted = await service.get(entry.id);
      expect(deleted).toBeNull();
    });

    it('should throw error if entry not found', async () => {
      await expect(service.delete('non-existent')).rejects.toThrow(
        'Context entry not found'
      );
    });
  });
});
