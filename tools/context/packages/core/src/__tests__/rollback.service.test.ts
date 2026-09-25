import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RollbackService } from '../services/RollbackService';
import { SnapshotService } from '../services/SnapshotService';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('RollbackService', () => {
  let snapshotsDir: string;
  let workspaceDir: string;
  let snapshotService: SnapshotService;
  let rollbackService: RollbackService;

  beforeEach(async () => {
    snapshotsDir = path.join(os.tmpdir(), `anamnesic-snapshots-${Date.now()}`);
    workspaceDir = path.join(os.tmpdir(), `anamnesic-workspace-${Date.now()}`);

    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });

    snapshotService = new SnapshotService(snapshotsDir, workspaceDir);
    rollbackService = new RollbackService(snapshotService, workspaceDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(snapshotsDir, { recursive: true, force: true });
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('plan', () => {
    it('should throw error if snapshot not found', async () => {
      try {
        await rollbackService.plan('pipeline-001', 0);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Snapshot não encontrado');
      }
    });

    it('should plan to delete files marked as created', async () => {
      await snapshotService.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');

      const plan = await rollbackService.plan('pipeline-001', 0);

      expect(plan.filesToDelete).toContain('src/new.ts');
      expect(plan.filesToRestore).toHaveLength(0);
    });

    it('should plan to restore files marked as modified', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'original', 'utf-8');

      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      const plan = await rollbackService.plan('pipeline-001', 0);

      expect(plan.filesToRestore).toContain('src/index.ts');
      expect(plan.filesToDelete).toHaveLength(0);
    });

    it('should plan to restore files marked as deleted', async () => {
      const testFile = path.join(workspaceDir, 'src', 'old.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'content', 'utf-8');

      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/old.ts', 'deleted');

      const plan = await rollbackService.plan('pipeline-001', 0);

      expect(plan.filesToRestore).toContain('src/old.ts');
    });

    it('should handle mixed file operations', async () => {
      // Create files for snapshot
      const created = path.join(workspaceDir, 'src', 'new.ts');
      const modified = path.join(workspaceDir, 'src', 'index.ts');
      const deleted = path.join(workspaceDir, 'src', 'old.ts');

      for (const file of [modified, deleted]) {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, 'content', 'utf-8');
      }

      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/new.ts', 'created');
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/old.ts', 'deleted');

      const plan = await rollbackService.plan('pipeline-001', 0);

      expect(plan.filesToDelete).toContain('src/new.ts');
      expect(plan.filesToRestore).toContain('src/index.ts');
      expect(plan.filesToRestore).toContain('src/old.ts');
    });
  });

  describe('execute', () => {
    it('should restore modified file', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      const originalContent = 'original content';
      const modifiedContent = 'modified content';

      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, originalContent, 'utf-8');

      // Take snapshot before modification
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      // Simulate modification
      await fs.writeFile(testFile, modifiedContent, 'utf-8');

      // Execute rollback
      await rollbackService.execute('pipeline-001', 0);

      const restoredContent = await fs.readFile(testFile, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should delete newly created files', async () => {
      const testFile = path.join(workspaceDir, 'src', 'new.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });

      // Record that file was created
      await snapshotService.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');

      // Create the file (simulating agent's creation)
      await fs.writeFile(testFile, 'new content', 'utf-8');

      // Execute rollback
      await rollbackService.execute('pipeline-001', 0);

      const exists = await fs
        .access(testFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(false);
    });

    it('should restore deleted files', async () => {
      const testFile = path.join(workspaceDir, 'src', 'old.ts');
      const fileContent = 'original content';

      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, fileContent, 'utf-8');

      // Take snapshot before deletion
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/old.ts', 'deleted');

      // Simulate deletion
      await fs.rm(testFile, { force: true });

      // Execute rollback
      await rollbackService.execute('pipeline-001', 0);

      const restoredContent = await fs.readFile(testFile, 'utf-8');
      expect(restoredContent).toBe(fileContent);
    });

    it('should create parent directories if not exist', async () => {
      const testFile = path.join(workspaceDir, 'deep', 'nested', 'path', 'file.ts');
      const fileContent = 'content in nested dir';

      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, fileContent, 'utf-8');

      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'deep/nested/path/file.ts', 'modified');

      // Delete the file and its parent directories
      await fs.rm(path.dirname(testFile), { recursive: true, force: true });

      // Execute rollback
      await rollbackService.execute('pipeline-001', 0);

      const restoredContent = await fs.readFile(testFile, 'utf-8');
      expect(restoredContent).toBe(fileContent);
    });

    it('should handle mixed rollback scenario', async () => {
      // Setup files
      const created = path.join(workspaceDir, 'src', 'new.ts');
      const modified = path.join(workspaceDir, 'src', 'index.ts');
      const deleted = path.join(workspaceDir, 'src', 'old.ts');

      await fs.mkdir(path.dirname(created), { recursive: true });

      const modifiedOriginal = 'original index';
      const deletedContent = 'deleted file content';

      await fs.writeFile(modified, modifiedOriginal, 'utf-8');
      await fs.writeFile(deleted, deletedContent, 'utf-8');

      // Take snapshots
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');
      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/old.ts', 'deleted');
      await snapshotService.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');

      // Simulate changes
      await fs.writeFile(modified, 'modified content', 'utf-8');
      await fs.rm(deleted, { force: true });
      await fs.writeFile(created, 'newly created', 'utf-8');

      // Execute rollback
      await rollbackService.execute('pipeline-001', 0);

      // Verify results
      const modifiedContent = await fs.readFile(modified, 'utf-8');
      const deletedExists = await fs
        .access(deleted)
        .then(() => true)
        .catch(() => false);
      const createdExists = await fs
        .access(created)
        .then(() => true)
        .catch(() => false);

      expect(modifiedContent).toBe(modifiedOriginal);
      expect(deletedExists).toBe(true);
      expect(createdExists).toBe(false);
    });

    it('should throw error if snapshot not found', async () => {
      try {
        await rollbackService.execute('pipeline-001', 0);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Snapshot não encontrado');
      }
    });

    it('should throw error if file has no hash for restore', async () => {
      // Create a fake snapshot with invalid data
      const snapshotDir = path.join(snapshotsDir, 'pipeline-001', '0');
      await fs.mkdir(snapshotDir, { recursive: true });

      const metadata = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        timestamp: new Date().toISOString(),
        files: [
          {
            path: 'src/index.ts',
            action: 'modified' as const,
            // missing hash - should cause error
          },
        ],
      };

      await fs.writeFile(path.join(snapshotDir, 'snapshot.json'), JSON.stringify(metadata), 'utf-8');

      try {
        await rollbackService.execute('pipeline-001', 0);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Missing hash');
      }
    });
  });

  describe('error handling', () => {
    it('should warn when file cannot be deleted', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await snapshotService.recordCreatedFile('pipeline-001', 0, 'analysis', 'nonexistent/file.ts');

      // Execute rollback - should not throw even if file doesn't exist
      await rollbackService.execute('pipeline-001', 0);

      consoleSpy.mockRestore();
    });

    it('should throw when file cannot be restored', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'content', 'utf-8');

      await snapshotService.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      // Delete snapshot file to simulate corruption
      const snapshotDir = path.join(snapshotsDir, 'pipeline-001', '0');
      const files = await fs.readdir(snapshotDir);
      const hashFile = files.find(f => f !== 'snapshot.json');

      if (hashFile) {
        await fs.rm(path.join(snapshotDir, hashFile), { force: true });
      }

      try {
        await rollbackService.execute('pipeline-001', 0);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Could not restore file');
      }
    });
  });
});
