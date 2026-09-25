import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { SnapshotService } from '../SnapshotService';

describe('SnapshotService', () => {
  let workspaceDir: string;
  let service: SnapshotService;
  const testPipelineId = 'snapshot-test-' + Date.now();

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-test-'));
    service = new SnapshotService(workspaceDir);
  });

  afterEach(() => {
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    const snapshotsDir = path.join(os.homedir(), '.anamnesic', 'snapshots', testPipelineId);
    if (fs.existsSync(snapshotsDir)) {
      fs.rmSync(snapshotsDir, { recursive: true, force: true });
    }
  });

  describe('createSnapshot()', () => {
    it('should create snapshot of existing file', async () => {
      const filePath = 'test.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      fs.writeFileSync(fileAbsPath, 'original content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.files).toHaveLength(1);
      expect(snapshot!.files[0].path).toBe(filePath);
      expect(snapshot!.files[0].action).toBe('modified');
      expect(snapshot!.files[0].originalHash).toBeDefined();
      expect(snapshot!.files[0].originalSize).toBe('original content'.length);
    });

    it('should back up file content', async () => {
      const filePath = 'code.ts';
      const fileAbsPath = path.join(workspaceDir, filePath);
      const originalContent = 'export const x = 1;';
      fs.writeFileSync(fileAbsPath, originalContent);

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const filesDir = service.getSnapshotFilesDir(testPipelineId, 0);
      const backupPath = path.join(filesDir, filePath);
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(fs.readFileSync(backupPath, 'utf-8')).toBe(originalContent);
    });

    it('should calculate correct hash', async () => {
      const filePath = 'hashtest.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      const content = 'test content';
      fs.writeFileSync(fileAbsPath, content);

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(snapshot!.files[0].originalHash).toBe(expectedHash);
    });

    it('should not re-snapshot same file in same phase', async () => {
      const filePath = 'test.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      fs.writeFileSync(fileAbsPath, 'original');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      // Modify file in workspace
      fs.writeFileSync(fileAbsPath, 'modified');

      // Try to snapshot again
      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      // Should still have original backup (not the modified one)
      const snapshot = await service.getSnapshot(testPipelineId, 0);
      const filesDir = service.getSnapshotFilesDir(testPipelineId, 0);
      const backupPath = path.join(filesDir, filePath);
      expect(fs.readFileSync(backupPath, 'utf-8')).toBe('original');
    });

    it('should not snapshot non-existent file', async () => {
      const filePath = 'nonexistent.txt';

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).toBeNull();
    });

    it('should not snapshot directories', async () => {
      const dirPath = 'test-dir';
      fs.mkdirSync(path.join(workspaceDir, dirPath));

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', dirPath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).toBeNull();
    });

    it('should handle nested file paths', async () => {
      const filePath = 'src/deep/nested/file.ts';
      const fileAbsPath = path.join(workspaceDir, filePath);
      fs.mkdirSync(path.dirname(fileAbsPath), { recursive: true });
      fs.writeFileSync(fileAbsPath, 'nested content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot!.files[0].path).toBe(filePath);

      const filesDir = service.getSnapshotFilesDir(testPipelineId, 0);
      const backupPath = path.join(filesDir, filePath);
      expect(fs.existsSync(backupPath)).toBe(true);
    });
  });

  describe('recordFileCreation()', () => {
    it('should record file creation without backing up', async () => {
      const filePath = 'new-file.ts';

      await service.recordFileCreation(testPipelineId, 0, 'Phase 0', filePath);

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.files).toHaveLength(1);
      expect(snapshot!.files[0].path).toBe(filePath);
      expect(snapshot!.files[0].action).toBe('created');
      expect(snapshot!.files[0].originalHash).toBe('');
      expect(snapshot!.files[0].originalSize).toBe(0);
    });

    it('should not duplicate file creation records', async () => {
      const filePath = 'new-file.ts';

      await service.recordFileCreation(testPipelineId, 0, 'Phase 0', filePath);
      await service.recordFileCreation(testPipelineId, 0, 'Phase 0', filePath);

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot!.files).toHaveLength(1);
    });
  });

  describe('getSnapshot()', () => {
    it('should return null for non-existent snapshot', async () => {
      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).toBeNull();
    });

    it('should return valid snapshot metadata', async () => {
      const filePath = 'test.txt';
      const fileAbsPath = path.join(workspaceDir, filePath);
      fs.writeFileSync(fileAbsPath, 'content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', filePath, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.pipelineId).toBe(testPipelineId);
      expect(snapshot!.phaseIndex).toBe(0);
      expect(snapshot!.phaseName).toBe('Phase 0');
      expect(snapshot!.timestamp).toBeDefined();
      expect(snapshot!.files).toHaveLength(1);
    });
  });

  describe('listSnapshots()', () => {
    it('should list all snapshots for pipeline', async () => {
      const file1 = 'file1.txt';
      const file2 = 'file2.txt';
      fs.writeFileSync(path.join(workspaceDir, file1), 'content1');
      fs.writeFileSync(path.join(workspaceDir, file2), 'content2');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file1, 'modified');
      await service.createSnapshot(testPipelineId, 1, 'Phase 1', file2, 'modified');

      const snapshots = await service.listSnapshots(testPipelineId);
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].phaseIndex).toBe(0);
      expect(snapshots[1].phaseIndex).toBe(1);
    });

    it('should return snapshots in phase order', async () => {
      const file = 'test.txt';
      fs.writeFileSync(path.join(workspaceDir, file), 'content');

      // Create snapshots in reverse order
      await service.createSnapshot(testPipelineId, 2, 'Phase 2', file, 'modified');
      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');
      await service.createSnapshot(testPipelineId, 1, 'Phase 1', file, 'modified');

      const snapshots = await service.listSnapshots(testPipelineId);
      expect(snapshots.map(s => s.phaseIndex)).toEqual([0, 1, 2]);
    });

    it('should return empty array for pipeline with no snapshots', async () => {
      const snapshots = await service.listSnapshots(testPipelineId);
      expect(snapshots).toEqual([]);
    });
  });

  describe('deleteSnapshot()', () => {
    it('should delete snapshot directory', async () => {
      const file = 'test.txt';
      fs.writeFileSync(path.join(workspaceDir, file), 'content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();

      await service.deleteSnapshot(testPipelineId, 0);

      const deletedSnapshot = await service.getSnapshot(testPipelineId, 0);
      expect(deletedSnapshot).toBeNull();
    });

    it('should not error for non-existent snapshot', async () => {
      // Should not throw
      await service.deleteSnapshot(testPipelineId, 0);
    });
  });

  describe('cleanup()', () => {
    it('should remove old snapshots based on retention', async () => {
      const file = 'test.txt';
      fs.writeFileSync(path.join(workspaceDir, file), 'content');

      // Create a snapshot
      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');

      // Manually set old timestamp in metadata
      const metadataPath = path.join(
        os.homedir(),
        '.anamnesic',
        'snapshots',
        testPipelineId,
        '0',
        'snapshot.json'
      );
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.timestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      const result = await service.cleanup();

      expect(result.removedCount).toBe(1);
      expect(result.freedSizeMb).toBeGreaterThan(0);

      // Snapshot should be gone
      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).toBeNull();
    });

    it('should not remove snapshots from active pipelines', async () => {
      const file = 'test.txt';
      fs.writeFileSync(path.join(workspaceDir, file), 'content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');

      // Make it old
      const metadataPath = path.join(
        os.homedir(),
        '.anamnesic',
        'snapshots',
        testPipelineId,
        '0',
        'snapshot.json'
      );
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.timestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      // Run cleanup protecting this pipeline
      const result = await service.cleanup(new Set([testPipelineId]));

      expect(result.removedCount).toBe(0);

      // Snapshot should still exist
      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
    });

    it('should report freed space correctly', async () => {
      const file = 'test.txt';
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      fs.writeFileSync(path.join(workspaceDir, file), largeContent);

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');

      // Make it old
      const metadataPath = path.join(
        os.homedir(),
        '.anamnesic',
        'snapshots',
        testPipelineId,
        '0',
        'snapshot.json'
      );
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.timestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      const result = await service.cleanup();

      expect(result.freedSizeMb).toBeGreaterThan(0.5); // Should be around 1MB
    });
  });

  describe('getSnapshotFilesDir()', () => {
    it('should return correct files directory path', () => {
      const filesDir = service.getSnapshotFilesDir(testPipelineId, 0);

      expect(filesDir).toContain('.anamnesic');
      expect(filesDir).toContain('snapshots');
      expect(filesDir).toContain(testPipelineId);
      expect(filesDir).toContain('0');
      expect(filesDir).toContain('files');
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted snapshot metadata gracefully', async () => {
      const file = 'test.txt';
      fs.writeFileSync(path.join(workspaceDir, file), 'content');

      await service.createSnapshot(testPipelineId, 0, 'Phase 0', file, 'modified');

      // Corrupt the metadata file
      const metadataPath = path.join(
        os.homedir(),
        '.anamnesic',
        'snapshots',
        testPipelineId,
        '0',
        'snapshot.json'
      );
      fs.writeFileSync(metadataPath, 'INVALID JSON {', 'utf-8');

      const snapshot = await service.getSnapshot(testPipelineId, 0);
      expect(snapshot).toBeNull();
    });
  });
});
