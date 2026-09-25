import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  createContextEntrySchema,
  updateContextEntrySchema,
  createDecisionSchema,
  updateDecisionSchema,
  createApiKeySchema,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate correct project input', () => {
      const input = { name: 'Valid Project', description: 'A valid description' };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Valid Project');
        expect(result.data.description).toBe('A valid description');
      }
    });

    it('should accept project without description', () => {
      const input = { name: 'Minimal Project' };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const input = { name: 'A' };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const input = { name: 'A'.repeat(101) };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject description longer than 500 characters', () => {
      const input = { name: 'Project', description: 'A'.repeat(501) };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const input = { description: 'No name provided' };
      const result = createProjectSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial updates', () => {
      const input = { name: 'Updated Name' };
      const result = updateProjectSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate status enum', () => {
      const valid = updateProjectSchema.safeParse({ status: 'active' });
      const invalid = updateProjectSchema.safeParse({ status: 'invalid-status' });

      expect(valid.success).toBe(true);
      expect(invalid.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['active', 'archived', 'inactive'];
      
      statuses.forEach(status => {
        const result = updateProjectSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('createContextEntrySchema', () => {
    it('should validate correct context entry', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'tech-stack',
        value: 'Node.js, TypeScript',
        category: 'architecture',
        priority: 3,
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should use default category when not provided', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'key',
        value: 'value',
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('general');
      }
    });

    it('should use default priority when not provided', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'key',
        value: 'value',
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(1);
      }
    });

    it('should reject invalid UUID for projectId', () => {
      const input = {
        projectId: 'not-a-uuid',
        key: 'key',
        value: 'value',
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject priority out of range', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'key',
        value: 'value',
        priority: 5,
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should validate category enum', () => {
      const validCategories = ['architecture', 'requirements', 'dependencies', 'standards', 'general'];
      
      validCategories.forEach(category => {
        const input = {
          projectId: '123e4567-e89b-12d3-a456-426614174000',
          key: 'key',
          value: 'value',
          category,
        };
        const result = createContextEntrySchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      const invalid = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'key',
        value: 'value',
        category: 'invalid-category',
      };
      expect(createContextEntrySchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject value longer than 10000 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        key: 'key',
        value: 'A'.repeat(10001),
      };
      const result = createContextEntrySchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('createDecisionSchema', () => {
    it('should validate correct decision', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Use TypeScript',
        description: 'We will use TypeScript for type safety and better developer experience',
        rationale: { reason: 'Better tooling' },
      };
      const result = createDecisionSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 3 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'AB',
        description: 'Valid description here',
      };
      const result = createDecisionSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject description shorter than 10 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Title',
        description: 'Short',
      };
      const result = createDecisionSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject title longer than 200 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(201),
        description: 'Valid description',
      };
      const result = createDecisionSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject description longer than 5000 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Title',
        description: 'A'.repeat(5001),
      };
      const result = createDecisionSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('updateDecisionSchema', () => {
    it('should validate status enum', () => {
      const validStatuses = ['active', 'deprecated', 'superseded'];
      
      validStatuses.forEach(status => {
        const result = updateDecisionSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = updateDecisionSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('createApiKeySchema', () => {
    it('should validate correct API key input', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Production API Key',
      };
      const result = createApiKeySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const input = {
        projectId: 'not-a-uuid',
        name: 'API Key',
      };
      const result = createApiKeySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
      };
      const result = createApiKeySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const input = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A'.repeat(101),
      };
      const result = createApiKeySchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
