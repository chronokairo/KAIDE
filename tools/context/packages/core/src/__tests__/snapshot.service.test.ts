import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnapshotService } from '../services/SnapshotService';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('SnapshotService', () => {
  let snapshotsDir: string;
  let workspaceDir: string;
  let service: SnapshotService;

  beforeEach(async () => {
    snapshotsDir = path.join(os.tmpdir(), `anamnesic-snapshots-${Date.now()}`);
    workspaceDir = path.join(os.tmpdir(), `anamnesic-workspace-${Date.now()}`);

    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });

    service = new SnapshotService(snapshotsDir, workspaceDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(snapshotsDir, { recursive: true, force: true });
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('snapshotFile', () => {
    it('should capture snapshot of modified file', async () => {
      // Create a test file in the workspace
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'console.log("test");', 'utf-8');

      // Take snapshot
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      // Verify snapshot was created
      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot?.files).toHaveLength(1);
      expect(snapshot?.files[0].path).toBe('src/index.ts');
      expect(snapshot?.files[0].action).toBe('modified');
      expect(snapshot?.files[0].hash).toBeDefined();
      expect(snapshot?.files[0].size).toBe(21);
    });

    it('should not snapshot non-existent file', async () => {
      // Try to snapshot a file that doesn't exist
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'nonexistent/file.ts', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      // Should not create snapshot for non-existent file
      expect(snapshot?.files).toHaveLength(0);
    });

    it('should snapshot deleted file before deletion', async () => {
      // Create a test file
      const testFile = path.join(workspaceDir, 'src', 'old.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'old content', 'utf-8');

      // Snapshot it as deleted
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/old.ts', 'deleted');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files[0].action).toBe('deleted');
      expect(snapshot?.files[0].hash).toBeDefined();
    });

    it('should not duplicate snapshots for same file in phase', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'content', 'utf-8');

      // Snapshot twice
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files).toHaveLength(1);
    });

    it('should snapshot multiple files in phase', async () => {
      // Create multiple test files
      const file1 = path.join(workspaceDir, 'src', 'index.ts');
      const file2 = path.join(workspaceDir, 'src', 'app.ts');

      await fs.mkdir(path.dirname(file1), { recursive: true });
      await fs.writeFile(file1, 'file1 content', 'utf-8');
      await fs.writeFile(file2, 'file2 content', 'utf-8');

      // Snapshot both
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/app.ts', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files).toHaveLength(2);
    });

    it('should preserve file content in snapshot', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      const originalContent = 'console.log("test");\nconst x = 42;';

      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, originalContent, 'utf-8');

      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      const hash = snapshot?.files[0].hash;

      if (hash) {
        const snapshotFile = path.join(snapshotsDir, 'pipeline-001', '0', hash);
        const snapshotContent = await fs.readFile(snapshotFile, 'utf-8');
        expect(snapshotContent).toBe(originalContent);
      }
    });
  });

  describe('recordCreatedFile', () => {
    it('should record file marked as created', async () => {
      await service.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files).toHaveLength(1);
      expect(snapshot?.files[0].path).toBe('src/new.ts');
      expect(snapshot?.files[0].action).toBe('created');
      expect(snapshot?.files[0].hash).toBeUndefined();
    });

    it('should not duplicate created file records', async () => {
      await service.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');
      await service.recordCreatedFile('pipeline-001', 0, 'analysis', 'src/new.ts');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files).toHaveLength(1);
    });
  });

  describe('getSnapshot', () => {
    it('should return null for non-existent snapshot', async () => {
      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot).toBeNull();
    });

    it('should retrieve complete snapshot metadata', async () => {
      const testFile = path.join(workspaceDir, 'src', 'index.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'content', 'utf-8');

      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);

      expect(snapshot).not.toBeNull();
      expect(snapshot?.pipelineId).toBe('pipeline-001');
      expect(snapshot?.phaseIndex).toBe(0);
      expect(snapshot?.phaseName).toBe('analysis');
      expect(snapshot?.timestamp).toBeDefined();
      expect(snapshot?.files).toHaveLength(1);
    });

    it('should differentiate snapshots by phase', async () => {
      const file1 = path.join(workspaceDir, 'src', 'index.ts');
      const file2 = path.join(workspaceDir, 'src', 'app.ts');

      await fs.mkdir(path.dirname(file1), { recursive: true });
      await fs.writeFile(file1, 'content1', 'utf-8');
      await fs.writeFile(file2, 'content2', 'utf-8');

      // Phase 0
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'src/index.ts', 'modified');

      // Phase 1
      await service.snapshotFile('pipeline-001', 1, 'implementation', 'src/app.ts', 'modified');

      const snapshot0 = await service.getSnapshot('pipeline-001', 0);
      const snapshot1 = await service.getSnapshot('pipeline-001', 1);

      expect(snapshot0?.files).toHaveLength(1);
      expect(snapshot1?.files).toHaveLength(1);
      expect(snapshot0?.files[0].path).toBe('src/index.ts');
      expect(snapshot1?.files[0].path).toBe('src/app.ts');
    });
  });

  describe('file integrity', () => {
    it('should store correct hash for file content', async () => {
      const testFile = path.join(workspaceDir, 'test.txt');
      const content = 'test content 123';

      await fs.writeFile(testFile, content, 'utf-8');
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'test.txt', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      const hash = snapshot?.files[0].hash;

      expect(hash).toBeDefined();
      expect(hash?.length).toBe(64); // SHA-256 is 64 hex chars
    });

    it('should track correct file size', async () => {
      const testFile = path.join(workspaceDir, 'test.txt');
      const content = 'test content 123';

      await fs.writeFile(testFile, content, 'utf-8');
      await service.snapshotFile('pipeline-001', 0, 'analysis', 'test.txt', 'modified');

      const snapshot = await service.getSnapshot('pipeline-001', 0);
      expect(snapshot?.files[0].size).toBe(content.length);
    });
  });
});
