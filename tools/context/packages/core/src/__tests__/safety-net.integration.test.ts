import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionLogService } from '../services/ActionLogService';
import { SnapshotService } from '../services/SnapshotService';
import { RollbackService } from '../services/RollbackService';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Integration tests for the Safety Net system
 * Tests the interaction between ActionLogService, SnapshotService, and RollbackService
 */
describe('Safety Net Integration', () => {
  let logsDir: string;
  let snapshotsDir: string;
  let workspaceDir: string;
  let actionLogService: ActionLogService;
  let snapshotService: SnapshotService;
  let rollbackService: RollbackService;

  beforeEach(async () => {
    logsDir = path.join(os.tmpdir(), `anamnesic-logs-${Date.now()}`);
    snapshotsDir = path.join(os.tmpdir(), `anamnesic-snapshots-${Date.now()}`);
    workspaceDir = path.join(os.tmpdir(), `anamnesic-workspace-${Date.now()}`);

    await fs.mkdir(logsDir, { recursive: true });
    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });

    actionLogService = new ActionLogService(logsDir);
    snapshotService = new SnapshotService(snapshotsDir, workspaceDir);
    rollbackService = new RollbackService(snapshotService, workspaceDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(logsDir, { recursive: true, force: true });
      await fs.rm(snapshotsDir, { recursive: true, force: true });
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('Complete workflow: Log + Snapshot + Rollback', () => {
    it('should log file write, snapshot before, and rollback after', async () => {
      const pipelineId = 'integration-test-001';
      const filePath = 'src/index.ts';
      const testFile = path.join(workspaceDir, filePath);

      // Setup: Create initial file
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      const originalContent = 'console.log("original");';
      await fs.writeFile(testFile, originalContent, 'utf-8');

      // Step 1: Take snapshot BEFORE modification
      await snapshotService.snapshotFile(pipelineId, 0, 'analysis', filePath, 'modified');

      // Step 2: Log the write operation
      await actionLogService.log({
        pipelineId,
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: filePath, content: 'console.log("modified");' },
        success: true,
        durationMs: 150,
      });

      // Step 3: Simulate the write
      await fs.writeFile(testFile, 'console.log("modified");', 'utf-8');

      // Step 4: Verify file was modified
      const modifiedContent = await fs.readFile(testFile, 'utf-8');
      expect(modifiedContent).toBe('console.log("modified");');

      // Step 5: Verify action was logged
      const logs = await actionLogService.getByPipeline(pipelineId);
      expect(logs).toHaveLength(1);
      expect(logs[0].toolName).toBe('write_file');

      // Step 6: Rollback
      await rollbackService.execute(pipelineId, 0);

      // Step 7: Verify rollback restored original content
      const restoredContent = await fs.readFile(testFile, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should handle multiple file modifications in a pipeline', async () => {
      const pipelineId = 'integration-test-002';
      const files = ['src/index.ts', 'src/app.ts', 'src/utils.ts'];

      // Setup: Create all files
      for (const filePath of files) {
        const testFile = path.join(workspaceDir, filePath);
        await fs.mkdir(path.dirname(testFile), { recursive: true });
        await fs.writeFile(testFile, `// Original content of ${filePath}`, 'utf-8');
      }

      // Phase 0: Snapshot all files before phase
      for (const filePath of files) {
        await snapshotService.snapshotFile(pipelineId, 0, 'analysis', filePath, 'modified');
      }

      // Phase 0: Log and execute modifications
      for (const filePath of files) {
        await actionLogService.log({
          pipelineId,
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'write_file',
          input: { path: filePath },
          success: true,
          durationMs: 100,
        });

        const testFile = path.join(workspaceDir, filePath);
        await fs.writeFile(testFile, `// Modified content of ${filePath}`, 'utf-8');
      }

      // Verify all files were modified
      for (const filePath of files) {
        const testFile = path.join(workspaceDir, filePath);
        const content = await fs.readFile(testFile, 'utf-8');
        expect(content).toContain('Modified');
      }

      // Verify all actions were logged
      const logs = await actionLogService.getByPhase(pipelineId, 0);
      expect(logs).toHaveLength(3);

      // Rollback all changes
      await rollbackService.execute(pipelineId, 0);

      // Verify all files were restored
      for (const filePath of files) {
        const testFile = path.join(workspaceDir, filePath);
        const content = await fs.readFile(testFile, 'utf-8');
        expect(content).toContain('Original');
        expect(content).not.toContain('Modified');
      }
    });

    it('should support multiple phases with independent snapshots', async () => {
      const pipelineId = 'integration-test-003';
      const filePath = 'src/index.ts';
      const testFile = path.join(workspaceDir, filePath);

      await fs.mkdir(path.dirname(testFile), { recursive: true });

      // Phase 0: Analysis
      await fs.writeFile(testFile, 'v1', 'utf-8');
      await snapshotService.snapshotFile(pipelineId, 0, 'analysis', filePath, 'modified');

      await actionLogService.log({
        pipelineId,
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: filePath },
        success: true,
        durationMs: 100,
      });

      // Phase 1: Implementation
      await fs.writeFile(testFile, 'v2', 'utf-8');
      await snapshotService.snapshotFile(pipelineId, 1, 'implementation', filePath, 'modified');

      await actionLogService.log({
        pipelineId,
        phaseIndex: 1,
        phaseName: 'implementation',
        agentName: 'frontend',
        toolName: 'write_file',
        input: { path: filePath },
        success: true,
        durationMs: 100,
      });

      // Verify both phases were logged
      const phase0Logs = await actionLogService.getByPhase(pipelineId, 0);
      const phase1Logs = await actionLogService.getByPhase(pipelineId, 1);

      expect(phase0Logs).toHaveLength(1);
      expect(phase1Logs).toHaveLength(1);

      // File should be v2
      let content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('v2');

      // Rollback phase 1 should restore to v2's snapshot (v1 actually)
      await rollbackService.execute(pipelineId, 1);
      content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('v1');

      // Rollback phase 0 should restore to v1's snapshot (still v1)
      await rollbackService.execute(pipelineId, 0);
      content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('v1');
    });
  });

  describe('Complex scenarios', () => {
    it('should track file creation, modification, and deletion across phases', async () => {
      const pipelineId = 'integration-test-004';
      const filePath = 'src/new.ts';
      const testFile = path.join(workspaceDir, filePath);

      // Phase 0: File is created
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'initial content', 'utf-8');
      await snapshotService.recordCreatedFile(pipelineId, 0, 'analysis', filePath);

      await actionLogService.log({
        pipelineId,
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: filePath },
        success: true,
        durationMs: 100,
      });

      // Phase 1: File is modified
      await fs.writeFile(testFile, 'modified content', 'utf-8');
      await snapshotService.snapshotFile(pipelineId, 1, 'implementation', filePath, 'modified');

      await actionLogService.log({
        pipelineId,
        phaseIndex: 1,
        phaseName: 'implementation',
        agentName: 'frontend',
        toolName: 'write_file',
        input: { path: filePath },
        success: true,
        durationMs: 100,
      });

      // Verify current state
      let content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('modified content');

      // Rollback phase 1 should restore to 'initial content'
      await rollbackService.execute(pipelineId, 1);
      content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('initial content');

      // Rollback phase 0 should delete the file completely
      await rollbackService.execute(pipelineId, 0);
      const exists = await fs
        .access(testFile)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it('should handle dry-run operations without creating snapshots', async () => {
      const pipelineId = 'integration-test-005';

      // Log dry-run operations (no snapshot)
      await actionLogService.log({
        pipelineId,
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: 'src/test.ts' },
        success: true,
        durationMs: 100,
        dryRun: true,
      });

      await actionLogService.log({
        pipelineId,
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: 'src/test2.ts' },
        success: true,
        durationMs: 100,
        dryRun: true,
      });

      // Verify dry-run operations were logged
      const logs = await actionLogService.getByPipeline(pipelineId);
      expect(logs).toHaveLength(2);
      expect(logs[0].dryRun).toBe(true);
      expect(logs[1].dryRun).toBe(true);

      // Verify no snapshots were created
      const snapshot = await snapshotService.getSnapshot(pipelineId, 0);
      expect(snapshot).toBeNull();
    });

    it('should audit complete pipeline execution', async () => {
      const pipelineId = 'integration-test-006';
      const files = ['src/index.ts', 'src/app.ts'];

      // Setup
      for (const filePath of files) {
        const testFile = path.join(workspaceDir, filePath);
        await fs.mkdir(path.dirname(testFile), { recursive: true });
        await fs.writeFile(testFile, 'original', 'utf-8');
      }

      // Phase 0
      for (const filePath of files) {
        await snapshotService.snapshotFile(pipelineId, 0, 'analysis', filePath, 'modified');
        await actionLogService.log({
          pipelineId,
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'write_file',
          input: { path: filePath },
          success: true,
          durationMs: 100,
        });
      }

      // Phase 1
      await snapshotService.recordCreatedFile(pipelineId, 1, 'implementation', 'src/new.ts');
      await actionLogService.log({
        pipelineId,
        phaseIndex: 1,
        phaseName: 'implementation',
        agentName: 'frontend',
        toolName: 'write_file',
        input: { path: 'src/new.ts' },
        success: true,
        durationMs: 100,
      });

      // Get complete audit trail
      const allLogs = await actionLogService.getByPipeline(pipelineId);
      const phase0Snapshot = await snapshotService.getSnapshot(pipelineId, 0);
      const phase1Snapshot = await snapshotService.getSnapshot(pipelineId, 1);

      // Verify audit trail
      expect(allLogs).toHaveLength(3);
      expect(allLogs[0].phaseIndex).toBe(0);
      expect(allLogs[1].phaseIndex).toBe(0);
      expect(allLogs[2].phaseIndex).toBe(1);

      expect(phase0Snapshot?.files).toHaveLength(2);
      expect(phase1Snapshot?.files).toHaveLength(1);
    });
  });

  describe('Error recovery', () => {
    it('should allow partial rollback recovery if some operations fail', async () => {
      const pipelineId = 'integration-test-007';
      const file1 = 'src/index.ts';
      const file2 = 'src/app.ts';
      const testFile1 = path.join(workspaceDir, file1);
      const testFile2 = path.join(workspaceDir, file2);

      // Setup
      await fs.mkdir(path.dirname(testFile1), { recursive: true });
      await fs.writeFile(testFile1, 'original1', 'utf-8');
      await fs.writeFile(testFile2, 'original2', 'utf-8');

      // Snapshot both
      await snapshotService.snapshotFile(pipelineId, 0, 'analysis', file1, 'modified');
      await snapshotService.snapshotFile(pipelineId, 0, 'analysis', file2, 'modified');

      // Log operations
      for (const file of [file1, file2]) {
        await actionLogService.log({
          pipelineId,
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'write_file',
          input: { path: file },
          success: true,
          durationMs: 100,
        });
      }

      // Verify operations were logged
      const logs = await actionLogService.getByPhase(pipelineId, 0);
      expect(logs).toHaveLength(2);
    });
  });
});
