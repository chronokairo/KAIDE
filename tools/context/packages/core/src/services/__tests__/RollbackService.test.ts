import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RollbackService } from '../RollbackService';
import { SnapshotService } from '../SnapshotService';

describe('RollbackService', () => {
  let workspaceDir: string;
  let service: RollbackService;
  let snapshotService: SnapshotService;
  const testPipelineId = 'rollback-test-' + Date.now();

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
    service = new RollbackService(workspaceDir);
    snapshotService = new SnapshotService(workspaceDir);
  });

  afterEach(() => {
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    const snapshotsDir = path.join(os.homedir(), '.anamnesic', 'snapshots', testPipelineId);
    if (fs.existsSync(snapshotsDir)) {
      fs.rmSync(snapshotsDir, { recursive: true, force: true });
    }
    const logsDir = path.join(os.homedir(), '.anamnesic', 'logs');
    const logFile = path.join(logsDir, `${testPipelineId}.jsonl`);
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  describe('rollback()', () => {
    it('should restore modified files from snapshot', async () => {
      const filePath = 'test.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      const originalContent = 'original';

      // Setup: create file and snapshot it
      fs.writeFileSync(fileAbsPath, originalContent);
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      // Simulate modification
      fs.writeFileSync(fileAbsPath, 'modified content');
      expect(fs.readFileSync(fileAbsPath, 'utf-8')).toBe('modified content');

      // Execute rollback
      const result = await service.rollback(testPipelineId, 0);

      // Verify restoration
      expect(result.restored).toBe(1);
      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(fs.readFileSync(fileAbsPath, 'utf-8')).toBe(originalContent);
    });

    it('should delete files marked as created', async () => {
      const filePath = 'new-file.ts';
      const fileAbsPath = path.join(workspaceDir, filePath);

      // Record that this file was created
      await snapshotService.recordFileCreation(testPipelineId, 0, 'Phase 0', filePath);

      // Simulate file creation by agent
      fs.writeFileSync(fileAbsPath, 'new content');
      expect(fs.existsSync(fileAbsPath)).toBe(true);

      // Execute rollback
      const result = await service.rollback(testPipelineId, 0);

      // Verify deletion
      expect(result.restored).toBe(0);
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(fs.existsSync(fileAbsPath)).toBe(false);
    });

    it('should restore deleted files from snapshot', async () => {
      const filePath = 'deleted-file.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      const originalContent = 'original content';

      // Setup: create file and snapshot it as deleted
      fs.writeFileSync(fileAbsPath, originalContent);
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'deleted');

      // Simulate deletion
      fs.unlinkSync(fileAbsPath);
      expect(fs.existsSync(fileAbsPath)).toBe(false);

      // Execute rollback
      const result = await service.rollback(testPipelineId, 0);

      // Verify restoration
      expect(result.restored).toBe(1);
      expect(fs.existsSync(fileAbsPath)).toBe(true);
      expect(fs.readFileSync(fileAbsPath, 'utf-8')).toBe(originalContent);
    });

    it('should handle nested directories', async () => {
      const filePath = 'src/deep/nested/file.ts';
      const fileAbsPath = path.join(workspaceDir, filePath);
      const originalContent = 'nested code';

      // Setup
      fs.mkdirSync(path.dirname(fileAbsPath), { recursive: true });
      fs.writeFileSync(fileAbsPath, originalContent);
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      // Simulate modification
      fs.writeFileSync(fileAbsPath, 'modified nested code');

      // Execute rollback
      const result = await service.rollback(testPipelineId, 0);

      expect(result.restored).toBe(1);
      expect(fs.readFileSync(fileAbsPath, 'utf-8')).toBe(originalContent);
    });

    it('should handle mixed file operations in single rollback', async () => {
      // Create files
      const modified = 'modified.ts';
      const created = 'created.ts';
      const deleted = 'deleted.ts';

      // Setup modifications
      fs.writeFileSync(path.join(workspaceDir, modified), 'original');
      fs.writeFileSync(path.join(workspaceDir, deleted), 'original');

      // Create snapshots
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', modified, 'modified');
      await snapshotService.recordFileCreation(testPipelineId, 0, 'Phase 0', created);
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', deleted, 'deleted');

      // Simulate agent changes
      fs.writeFileSync(path.join(workspaceDir, modified), 'changed');
      fs.writeFileSync(path.join(workspaceDir, created), 'new content');
      fs.unlinkSync(path.join(workspaceDir, deleted));

      // Rollback
      const result = await service.rollback(testPipelineId, 0);

      expect(result.restored).toBe(2); // modified + deleted restored
      expect(result.deleted).toBe(1); // created deleted
      expect(result.errors).toHaveLength(0);

      // Verify final state
      expect(fs.readFileSync(path.join(workspaceDir, modified), 'utf-8')).toBe('original');
      expect(fs.existsSync(path.join(workspaceDir, created))).toBe(false);
      expect(fs.readFileSync(path.join(workspaceDir, deleted), 'utf-8')).toBe('original');
    });

    it('should throw error for non-existent snapshot', async () => {
      await expect(service.rollback(testPipelineId, 0)).rejects.toThrow('No snapshot found');
    });

    it('should collect errors but continue processing', async () => {
      const file1 = 'file1.ts';
      const file2 = 'file2.ts';

      fs.writeFileSync(path.join(workspaceDir, file1), 'content1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'content2');

      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file1, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file2, 'modified');

      // Corrupt file2's backup (simulate missing snapshot file)
      const filesDir = snapshotService.getSnapshotFilesDir(testPipelineId, 0);
      const file2Backup = path.join(filesDir, file2);
      fs.unlinkSync(file2Backup);

      // Rollback
      const result = await service.rollback(testPipelineId, 0);

      // Should restore file1 and error on file2
      expect(result.restored).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(file2);
    });

    it('should handle already-deleted snapshot files for created files', async () => {
      const filePath = 'new-file.ts';
      const fileAbsPath = path.join(workspaceDir, filePath);

      await snapshotService.recordFileCreation(testPipelineId, 0, 'Phase 0', filePath);

      // Don't create the actual file (already gone)
      expect(fs.existsSync(fileAbsPath)).toBe(false);

      // Rollback should still succeed
      const result = await service.rollback(testPipelineId, 0);

      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('previewRollback()', () => {
    it('should preview what would be restored and deleted', async () => {
      const modified = 'modified.ts';
      const created = 'created.ts';
      const deleted = 'deleted.ts';

      fs.writeFileSync(path.join(workspaceDir, modified), 'original');
      fs.writeFileSync(path.join(workspaceDir, deleted), 'original');

      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', modified, 'modified');
      await snapshotService.recordFileCreation(testPipelineId, 0, 'Phase 0', created);
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', deleted, 'deleted');

      const preview = await service.previewRollback(testPipelineId, 0);

      expect(preview.wouldRestore).toContain(modified);
      expect(preview.wouldRestore).toContain(deleted);
      expect(preview.wouldDelete).toContain(created);
      expect(preview.snapshotTimestamp).toBeDefined();
      expect(preview.phaseName).toBe('Phase 0');
    });

    it('should throw error for non-existent snapshot', async () => {
      await expect(service.previewRollback(testPipelineId, 0)).rejects.toThrow(
        'No snapshot found'
      );
    });
  });

  describe('rollbackAll()', () => {
    it('should rollback all phases in reverse order', async () => {
      const file0 = 'phase0.ts';
      const file1 = 'phase1.ts';
      const file2 = 'phase2.ts';

      // Create files for each phase
      fs.writeFileSync(path.join(workspaceDir, file0), 'phase0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'phase1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'phase2');

      // Create snapshots for phases 0, 1, 2
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file0, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 1, 'Phase 1', file1, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 2, 'Phase 2', file2, 'modified');

      // Modify all
      fs.writeFileSync(path.join(workspaceDir, file0), 'modified0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'modified1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'modified2');

      // Rollback all
      const result = await service.rollbackAll(testPipelineId);

      expect(result.restored).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(fs.readFileSync(path.join(workspaceDir, file0), 'utf-8')).toBe('phase0');
      expect(fs.readFileSync(path.join(workspaceDir, file1), 'utf-8')).toBe('phase1');
      expect(fs.readFileSync(path.join(workspaceDir, file2), 'utf-8')).toBe('phase2');
    });

    it('should throw error if no snapshots exist', async () => {
      await expect(service.rollbackAll(testPipelineId)).rejects.toThrow(
        'No snapshots found'
      );
    });

    it('should continue on phase errors', async () => {
      const file0 = 'file0.ts';
      const file1 = 'file1.ts';

      fs.writeFileSync(path.join(workspaceDir, file0), 'content0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'content1');

      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file0, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 1, 'Phase 1', file1, 'modified');

      // Corrupt phase 0's backup
      const filesDir0 = snapshotService.getSnapshotFilesDir(testPipelineId, 0);
      fs.unlinkSync(path.join(filesDir0, file0));

      // Modify both
      fs.writeFileSync(path.join(workspaceDir, file0), 'modified0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'modified1');

      // Rollback all
      const result = await service.rollbackAll(testPipelineId);

      // Phase 1 should succeed, phase 0 should error but not stop phase 1
      expect(result.restored).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(fs.readFileSync(path.join(workspaceDir, file1), 'utf-8')).toBe('content1');
    });
  });

  describe('rollbackTo()', () => {
    it('should rollback only phases after target', async () => {
      const file0 = 'file0.ts';
      const file1 = 'file1.ts';
      const file2 = 'file2.ts';

      fs.writeFileSync(path.join(workspaceDir, file0), 'phase0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'phase1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'phase2');

      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file0, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 1, 'Phase 1', file1, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 2, 'Phase 2', file2, 'modified');

      fs.writeFileSync(path.join(workspaceDir, file0), 'modified0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'modified1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'modified2');

      // Rollback TO phase 0 (keeping phase 0, rolling back phases 1+2)
      const result = await service.rollbackTo(testPipelineId, 0);

      expect(result.restored).toBe(2); // Only phases 1 and 2
      expect(fs.readFileSync(path.join(workspaceDir, file0), 'utf-8')).toBe('modified0');
      expect(fs.readFileSync(path.join(workspaceDir, file1), 'utf-8')).toBe('phase1');
      expect(fs.readFileSync(path.join(workspaceDir, file2), 'utf-8')).toBe('phase2');
    });

    it('should return empty result if no phases after target', async () => {
      const file0 = 'file0.ts';

      fs.writeFileSync(path.join(workspaceDir, file0), 'phase0');
      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file0, 'modified');

      fs.writeFileSync(path.join(workspaceDir, file0), 'modified0');

      // Rollback TO phase 0 (no phases after it)
      const result = await service.rollbackTo(testPipelineId, 0);

      expect(result.restored).toBe(0);
      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should rollback TO earlier phase', async () => {
      const file0 = 'file0.ts';
      const file1 = 'file1.ts';
      const file2 = 'file2.ts';

      fs.writeFileSync(path.join(workspaceDir, file0), 'phase0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'phase1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'phase2');

      await snapshotService.createSnapshot(testPipelineId, 0, 'Phase 0', file0, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 1, 'Phase 1', file1, 'modified');
      await snapshotService.createSnapshot(testPipelineId, 2, 'Phase 2', file2, 'modified');

      fs.writeFileSync(path.join(workspaceDir, file0), 'modified0');
      fs.writeFileSync(path.join(workspaceDir, file1), 'modified1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'modified2');

      // Rollback TO phase before any
      const result = await service.rollbackTo(testPipelineId, -1);

      // All phases should be rolled back
      expect(result.restored).toBe(3);
    });
  });

  describe('Directory deletion', () => {
    it('should delete directories created by agent', async () => {
      const dirPath = 'new-dir';
      const dirAbsPath = path.join(workspaceDir, dirPath);

      await snapshotService.recordFileCreation(testPipelineId, 0, 'Phase 0', dirPath);

      // Simulate directory creation with files
      fs.mkdirSync(dirAbsPath);
      fs.writeFileSync(path.join(dirAbsPath, 'file1.ts'), 'content1');
      fs.writeFileSync(path.join(dirAbsPath, 'file2.ts'), 'content2');

      const result = await service.rollback(testPipelineId, 0);

      expect(result.deleted).toBe(1);
      expect(fs.existsSync(dirAbsPath)).toBe(false);
    });
  });
});
