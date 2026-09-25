import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { ProjectService } from '../ProjectService';
import { Project } from '../../entities/Project';

describe('ProjectService', () => {
  let db: DataSource;
  let service: ProjectService;

  beforeEach(async () => {
    db = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [Project],
    });
    await db.initialize();
    service = new ProjectService(db);
  });

  afterEach(async () => {
    if (db?.isInitialized) {
      await db.destroy();
    }
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const input = {
        name: 'Test Project',
        description: 'A test project',
      };

      const project = await service.create(input);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.status).toBe('active');
    });

    it('should create project without description', async () => {
      const project = await service.create({ name: 'Minimal Project' });

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Minimal Project');
      expect(project.description).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await service.list();

      expect(projects).toEqual([]);
    });

    it('should list all projects', async () => {
      await service.create({ name: 'Project 1' });
      await service.create({ name: 'Project 2' });
      await service.create({ name: 'Project 3' });

      const projects = await service.list();

      expect(projects).toHaveLength(3);
      expect(projects.map(p => p.name)).toContain('Project 1');
      expect(projects.map(p => p.name)).toContain('Project 2');
      expect(projects.map(p => p.name)).toContain('Project 3');
    });

    it('should order projects by createdAt DESC', async () => {
      const p1 = await service.create({ name: 'First' });
      const p2 = await service.create({ name: 'Second' });
      const p3 = await service.create({ name: 'Third' });

      const projects = await service.list();

      expect(projects[0].id).toBe(p3.id);
      expect(projects[1].id).toBe(p2.id);
      expect(projects[2].id).toBe(p1.id);
    });
  });

  describe('get', () => {
    it('should get project by id', async () => {
      const created = await service.create({ name: 'Test Project' });

      const project = await service.get(created.id);

      expect(project).toBeDefined();
      expect(project?.id).toBe(created.id);
      expect(project?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      const project = await service.get('non-existent-id');

      expect(project).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find project by exact name', async () => {
      await service.create({ name: 'Unique Project' });

      const project = await service.findByName('Unique Project');

      expect(project).toBeDefined();
      expect(project?.name).toBe('Unique Project');
    });

    it('should return null if name not found', async () => {
      const project = await service.findByName('Non-Existent');

      expect(project).toBeNull();
    });

    it('should be case sensitive', async () => {
      await service.create({ name: 'CaseSensitive' });

      const found = await service.findByName('casesensitive');

      expect(found).toBeNull();
    });
  });

  describe('findByWorkspace', () => {
    it('should find project by workspace path', async () => {
      const project = await service.create({ name: 'Workspace Project' });
      await service.linkWorkspace(project.id, '/home/user/projects/test');

      const found = await service.findByWorkspace('/home/user/projects/test');

      expect(found).toBeDefined();
      expect(found?.id).toBe(project.id);
    });

    it('should normalize paths for comparison', async () => {
      const project = await service.create({ name: 'Path Project' });
      await service.linkWorkspace(project.id, '/home/user/projects/test/');

      const found = await service.findByWorkspace('/home/user/projects/test');

      expect(found).toBeDefined();
      expect(found?.id).toBe(project.id);
    });

    it('should handle Windows paths', async () => {
      const project = await service.create({ name: 'Windows Project' });
      await service.linkWorkspace(project.id, 'C:\\Users\\test\\project');

      const found = await service.findByWorkspace('c:/users/test/project');

      expect(found).toBeDefined();
      expect(found?.id).toBe(project.id);
    });

    it('should return null if no matching workspace', async () => {
      await service.create({ name: 'Project' });

      const found = await service.findByWorkspace('/non/existent/path');

      expect(found).toBeNull();
    });
  });

  describe('linkWorkspace', () => {
    it('should link workspace to project', async () => {
      const project = await service.create({ name: 'Link Test' });

      const updated = await service.linkWorkspace(project.id, '/workspace/path');

      expect(updated.metadata).toBeDefined();
      expect((updated.metadata as any).workspace).toBe('/workspace/path');
    });

    it('should preserve existing metadata when linking workspace', async () => {
      const project = await service.create({
        name: 'Metadata Project',
      });
      await service.update(project.id, {
        status: 'active',
      });
      const initial = await service.get(project.id);
      if (initial) {
        initial.metadata = { custom: 'value' };
        await db.getRepository(Project).save(initial);
      }

      const updated = await service.linkWorkspace(project.id, '/new/workspace');

      expect((updated.metadata as any).custom).toBe('value');
      expect((updated.metadata as any).workspace).toBe('/new/workspace');
    });

    it('should throw error if project not found', async () => {
      await expect(
        service.linkWorkspace('non-existent', '/path')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const project = await service.create({ name: 'Old Name' });

      const updated = await service.update(project.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
    });

    it('should update project description', async () => {
      const project = await service.create({ name: 'Project' });

      const updated = await service.update(project.id, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should update project status', async () => {
      const project = await service.create({ name: 'Project' });

      const updated = await service.update(project.id, { status: 'archived' });

      expect(updated.status).toBe('archived');
    });

    it('should update multiple fields at once', async () => {
      const project = await service.create({ name: 'Project' });

      const updated = await service.update(project.id, {
        name: 'Updated Project',
        description: 'Updated description',
        status: 'inactive',
      });

      expect(updated.name).toBe('Updated Project');
      expect(updated.description).toBe('Updated description');
      expect(updated.status).toBe('inactive');
    });

    it('should throw error if project not found', async () => {
      await expect(
        service.update('non-existent', { name: 'Name' })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      const project = await service.create({ name: 'To Delete' });

      const result = await service.delete(project.id);

      expect(result).toBe(true);
      const deleted = await service.get(project.id);
      expect(deleted).toBeNull();
    });

    it('should throw error if project not found', async () => {
      await expect(service.delete('non-existent')).rejects.toThrow('Project not found');
    });
  });
});
