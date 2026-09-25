import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportProject, getExportFilename } from '../index';
import { Project } from '../../entities/Project';
import { ContextEntry } from '../../entities/ContextEntry';
import { Decision } from '../../entities/Decision';

describe('Export', () => {
  let mockProject: Project;

  beforeEach(() => {
    mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      description: 'A test project for export functionality',
      status: 'active',
      metadata: null,
      contextEntries: [
        {
          id: 'ctx-1',
          key: 'tech-stack',
          value: 'Node.js, TypeScript, SQLite',
          category: 'architecture',
          priority: 3,
          metadata: null,
        } as ContextEntry,
        {
          id: 'ctx-2',
          key: 'coding-standards',
          value: 'Follow ESLint rules, use Prettier',
          category: 'standards',
          priority: 2,
          metadata: null,
        } as ContextEntry,
        {
          id: 'ctx-3',
          key: 'api-design',
          value: 'RESTful API with JSON responses',
          category: 'requirements',
          priority: 1,
          metadata: null,
        } as ContextEntry,
      ],
      decisions: [
        {
          id: 'dec-1',
          title: 'Use TypeScript',
          description: 'TypeScript provides type safety and better developer experience',
          status: 'active',
          rationale: { pros: ['Type safety', 'Better IDE support'], cons: ['Learning curve'] },
          alternatives: null,
        } as Decision,
        {
          id: 'dec-2',
          title: 'Use SQLite',
          description: 'SQLite is lightweight and perfect for this use case',
          status: 'active',
          rationale: null,
          alternatives: { postgres: 'More features but heavier', mysql: 'More popular but overkill' },
        } as Decision,
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('exportJSON', () => {
    it('should export project as JSON', () => {
      const json = exportProject(mockProject, 'json');

      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.project.name).toBe('Test Project');
      expect(parsed.contexts).toHaveLength(3);
      expect(parsed.decisions).toHaveLength(2);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should include all context fields', () => {
      const json = exportProject(mockProject, 'json');
      const parsed = JSON.parse(json);

      const ctx = parsed.contexts[0];
      expect(ctx.key).toBe('tech-stack');
      expect(ctx.value).toBe('Node.js, TypeScript, SQLite');
      expect(ctx.category).toBe('architecture');
      expect(ctx.priority).toBe(3);
    });

    it('should include all decision fields', () => {
      const json = exportProject(mockProject, 'json');
      const parsed = JSON.parse(json);

      const dec = parsed.decisions[0];
      expect(dec.title).toBe('Use TypeScript');
      expect(dec.description).toBeDefined();
      expect(dec.status).toBe('active');
      expect(dec.rationale).toBeDefined();
    });

    it('should handle empty collections', () => {
      mockProject.contextEntries = [];
      mockProject.decisions = [];

      const json = exportProject(mockProject, 'json');
      const parsed = JSON.parse(json);

      expect(parsed.contexts).toEqual([]);
      expect(parsed.decisions).toEqual([]);
    });
  });

  describe('exportMarkdown', () => {
    it('should export project as Markdown', () => {
      const markdown = exportProject(mockProject, 'markdown');

      expect(markdown).toContain('# Test Project');
      expect(markdown).toContain('A test project for export functionality');
      expect(markdown).toContain('## Context & Architecture');
      expect(markdown).toContain('## Architectural Decisions');
    });

    it('should group context entries by category', () => {
      const markdown = exportProject(mockProject, 'markdown');

      expect(markdown).toContain('### Architecture');
      expect(markdown).toContain('### Standards');
      expect(markdown).toContain('### Requirements');
    });

    it('should include context details', () => {
      const markdown = exportProject(mockProject, 'markdown');

      expect(markdown).toContain('**tech-stack** (priority: 3)');
      expect(markdown).toContain('Node.js, TypeScript, SQLite');
    });

    it('should include decision details', () => {
      const markdown = exportProject(mockProject, 'markdown');

      expect(markdown).toContain('### Use TypeScript');
      expect(markdown).toContain('**Status:** active');
      expect(markdown).toContain('TypeScript provides type safety');
    });

    it('should handle project without description', () => {
      mockProject.description = null;

      const markdown = exportProject(mockProject, 'markdown');

      expect(markdown).toContain('# Test Project');
      expect(markdown).not.toContain('undefined');
    });
  });

  describe('exportPlain', () => {
    it('should export project as plain text', () => {
      const plain = exportProject(mockProject, 'plain');

      expect(plain).toContain('TEST PROJECT');
      expect(plain).toContain('='.repeat('Test Project'.length));
      expect(plain).toContain('CONTEXT ENTRIES:');
      expect(plain).toContain('ARCHITECTURAL DECISIONS:');
    });

    it('should include context entries with category and priority', () => {
      const plain = exportProject(mockProject, 'plain');

      expect(plain).toContain('[architecture] tech-stack (Priority: 3)');
      expect(plain).toContain('Node.js, TypeScript, SQLite');
    });

    it('should include decisions with status', () => {
      const plain = exportProject(mockProject, 'plain');

      expect(plain).toContain('Use TypeScript [active]');
      expect(plain).toContain('TypeScript provides type safety');
    });
  });

  describe('exportCopilot', () => {
    it('should export for GitHub Copilot format', () => {
      const copilot = exportProject(mockProject, 'copilot');

      expect(copilot).toContain('# Copilot Instructions - Test Project');
      expect(copilot).toContain('Auto-generated by Anamnesic');
      expect(copilot).toContain('## Architecture');
      expect(copilot).toContain('## Standards');
      expect(copilot).toContain('## Key Decisions');
    });

    it('should format context as bullet points', () => {
      const copilot = exportProject(mockProject, 'copilot');

      expect(copilot).toContain('- **tech-stack**: Node.js, TypeScript, SQLite');
      expect(copilot).toContain('- **coding-standards**: Follow ESLint rules, use Prettier');
    });

    it('should only include active decisions', () => {
      mockProject.decisions![0].status = 'deprecated';

      const copilot = exportProject(mockProject, 'copilot');

      expect(copilot).toContain('Use SQLite');
      expect(copilot).not.toContain('Use TypeScript');
    });
  });

  describe('exportClaude', () => {
    it('should export for Claude format', () => {
      const claude = exportProject(mockProject, 'claude');

      expect(claude).toContain('# Test Project');
      expect(claude).toContain('Auto-generated by Anamnesic');
      expect(claude).toContain('## Architecture');
      expect(claude).toContain('### tech-stack');
    });

    it('should include decision rationale', () => {
      const claude = exportProject(mockProject, 'claude');

      expect(claude).toContain('### Use TypeScript [active]');
      expect(claude).toContain('**Rationale:**');
    });

    it('should handle decisions without rationale', () => {
      const claude = exportProject(mockProject, 'claude');

      // Decision 2 has no rationale
      expect(claude).toContain('### Use SQLite [active]');
    });
  });

  describe('exportCursor', () => {
    it('should export for Cursor format', () => {
      const cursor = exportProject(mockProject, 'cursor');

      expect(cursor).toContain('# Test Project - Cursor Rules');
      expect(cursor).toContain('Auto-generated by Anamnesic');
      expect(cursor).toContain('## Coding Standards');
      expect(cursor).toContain('## Architecture');
    });

    it('should format as bullet list', () => {
      const cursor = exportProject(mockProject, 'cursor');

      expect(cursor).toContain('- tech-stack: Node.js, TypeScript, SQLite');
      expect(cursor).toContain('- coding-standards: Follow ESLint rules, use Prettier');
    });

    it('should only include active decisions', () => {
      mockProject.decisions![0].status = 'superseded';

      const cursor = exportProject(mockProject, 'cursor');

      expect(cursor).toContain('Use SQLite');
      expect(cursor).not.toContain('Use TypeScript');
    });
  });

  describe('getExportFilename', () => {
    it('should return correct filename for JSON', () => {
      expect(getExportFilename('json', 'My Project')).toBe('my-project-context.json');
    });

    it('should return correct filename for Markdown', () => {
      expect(getExportFilename('markdown', 'My Project')).toBe('my-project-context.md');
    });

    it('should return correct filename for Plain', () => {
      expect(getExportFilename('plain', 'My Project')).toBe('my-project-context.txt');
    });

    it('should return correct filename for Copilot', () => {
      expect(getExportFilename('copilot', 'My Project')).toBe(
        '.github/copilot-instructions.md'
      );
    });

    it('should return correct filename for Claude', () => {
      expect(getExportFilename('claude', 'My Project')).toBe('CLAUDE.md');
    });

    it('should return correct filename for Cursor', () => {
      expect(getExportFilename('cursor', 'My Project')).toBe('.cursorrules');
    });

    it('should handle project names with spaces', () => {
      expect(getExportFilename('json', 'Multi Word Project')).toBe(
        'multi-word-project-context.json'
      );
    });

    it('should convert to lowercase', () => {
      expect(getExportFilename('markdown', 'UPPERCASE')).toBe('uppercase-context.md');
    });
  });
});
