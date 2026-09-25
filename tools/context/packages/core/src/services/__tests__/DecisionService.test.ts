import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import { DecisionService } from '../DecisionService';
import { ProjectService } from '../ProjectService';
import { Project } from '../../entities/Project';
import { Decision } from '../../entities/Decision';

describe('DecisionService', () => {
  let db: DataSource;
  let service: DecisionService;
  let projectService: ProjectService;
  let testProject: Project;

  beforeEach(async () => {
    db = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [Project, Decision],
    });
    await db.initialize();
    service = new DecisionService(db);
    projectService = new ProjectService(db);
    testProject = await projectService.create({ name: 'Test Project' });
  });

  afterEach(async () => {
    if (db?.isInitialized) {
      await db.destroy();
    }
  });

  describe('create', () => {
    it('should create a decision', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Use TypeScript',
        description: 'We will use TypeScript for type safety and better developer experience',
      });

      expect(decision.id).toBeDefined();
      expect(decision.title).toBe('Use TypeScript');
      expect(decision.description).toBe(
        'We will use TypeScript for type safety and better developer experience'
      );
      expect(decision.status).toBe('active');
    });

    it('should accept rationale', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Decision with rationale',
        description: 'Description',
        rationale: {
          pros: ['Type safety', 'Better IDE support'],
          cons: ['Learning curve'],
        },
      });

      expect(decision.rationale).toEqual({
        pros: ['Type safety', 'Better IDE support'],
        cons: ['Learning curve'],
      });
    });

    it('should accept alternatives', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Decision with alternatives',
        description: 'Description',
        alternatives: {
          javascript: 'More flexible but less type safe',
          flow: 'Similar to TypeScript but less popular',
        },
      });

      expect(decision.alternatives).toEqual({
        javascript: 'More flexible but less type safe',
        flow: 'Similar to TypeScript but less popular',
      });
    });

    it('should throw error if project not found', async () => {
      await expect(
        service.create({
          projectId: 'non-existent',
          title: 'Test',
          description: 'Test description',
        })
      ).rejects.toThrow('Project not found');
    });
  });

  describe('listByProject', () => {
    beforeEach(async () => {
      await service.create({
        projectId: testProject.id,
        title: 'Decision 1',
        description: 'First decision',
      });
      await service.create({
        projectId: testProject.id,
        title: 'Decision 2',
        description: 'Second decision',
      });
      await service.create({
        projectId: testProject.id,
        title: 'Decision 3',
        description: 'Third decision',
      });
    });

    it('should list all decisions for a project', async () => {
      const decisions = await service.listByProject(testProject.id);

      expect(decisions).toHaveLength(3);
    });

    it('should order by createdAt DESC', async () => {
      const decisions = await service.listByProject(testProject.id);

      expect(decisions[0].title).toBe('Decision 3');
      expect(decisions[1].title).toBe('Decision 2');
      expect(decisions[2].title).toBe('Decision 1');
    });

    it('should return empty array for project with no decisions', async () => {
      const newProject = await projectService.create({ name: 'Empty Project' });
      const decisions = await service.listByProject(newProject.id);

      expect(decisions).toEqual([]);
    });
  });

  describe('get', () => {
    it('should get decision by id', async () => {
      const created = await service.create({
        projectId: testProject.id,
        title: 'Test Decision',
        description: 'Test description',
      });

      const decision = await service.get(created.id);

      expect(decision).toBeDefined();
      expect(decision?.id).toBe(created.id);
      expect(decision?.title).toBe('Test Decision');
    });

    it('should return null for non-existent decision', async () => {
      const decision = await service.get('non-existent');

      expect(decision).toBeNull();
    });
  });

  describe('update', () => {
    it('should update decision title', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Old Title',
        description: 'Description',
      });

      const updated = await service.update(decision.id, { title: 'New Title' });

      expect(updated.title).toBe('New Title');
    });

    it('should update decision description', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Title',
        description: 'Old description',
      });

      const updated = await service.update(decision.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update decision status', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Title',
        description: 'Description',
      });

      const updated = await service.update(decision.id, { status: 'deprecated' });

      expect(updated.status).toBe('deprecated');
    });

    it('should update rationale', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Title',
        description: 'Description',
      });

      const updated = await service.update(decision.id, {
        rationale: { reason: 'Because we need it' },
      });

      expect(updated.rationale).toEqual({ reason: 'Because we need it' });
    });

    it('should update alternatives', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'Title',
        description: 'Description',
      });

      const updated = await service.update(decision.id, {
        alternatives: { option1: 'First option', option2: 'Second option' },
      });

      expect(updated.alternatives).toEqual({
        option1: 'First option',
        option2: 'Second option',
      });
    });

    it('should throw error if decision not found', async () => {
      await expect(
        service.update('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Decision not found');
    });
  });

  describe('delete', () => {
    it('should delete decision', async () => {
      const decision = await service.create({
        projectId: testProject.id,
        title: 'To Delete',
        description: 'This will be deleted',
      });

      const result = await service.delete(decision.id);

      expect(result).toBe(true);
      const deleted = await service.get(decision.id);
      expect(deleted).toBeNull();
    });

    it('should throw error if decision not found', async () => {
      await expect(service.delete('non-existent')).rejects.toThrow(
        'Decision not found'
      );
    });
  });
});
