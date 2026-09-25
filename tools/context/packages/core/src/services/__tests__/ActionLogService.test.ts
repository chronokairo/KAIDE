import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ActionLogService } from '../ActionLogService';
import { ActionLogEntry } from '../../types/safety-net';

describe('ActionLogService', () => {
  let workspaceDir: string;
  let service: ActionLogService;
  const testPipelineId = 'action-log-test-' + Date.now();

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'action-log-test-'));
    service = new ActionLogService(workspaceDir);
  });

  afterEach(() => {
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    const logsDir = path.join(os.homedir(), '.anamnesic', 'logs');
    const logFile = path.join(logsDir, `${testPipelineId}.jsonl`);
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  describe('log()', () => {
    it('should create a new log entry with auto-generated id and timestamp', async () => {
      const entry = await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: { path: 'test.ts', content: 'code' },
        output: 'File created',
        result: 'success',
        durationMs: 42,
        dryRun: false,
        filesAffected: [{ path: 'test.ts', action: 'create' }],
      });

      expect(entry.id).toBeDefined();
      expect(entry.id).toMatch(/^[0-9a-f-]{36}$/); // UUID v4 format
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0);
      expect(entry.pipelineId).toBe(testPipelineId);
      expect(entry.toolName).toBe('write_file');
    });

    it('should append to JSONL file', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Test output',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-2',
        agentRole: 'frontend',
        toolName: 'read_file',
        input: {},
        output: 'File content',
        result: 'success',
        durationMs: 5,
        dryRun: false,
      });

      const entries = await service.getByPipeline(testPipelineId);
      expect(entries).toHaveLength(2);
      expect(entries[0].taskId).toBe('task-1');
      expect(entries[1].taskId).toBe('task-2');
    });

    it('should handle special characters in output', async () => {
      const specialOutput = 'Error: "quoted" and \'single\'\nMultiline\tWithTabs';

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'qa',
        toolName: 'run_command',
        input: { command: 'test command' },
        output: specialOutput,
        result: 'success',
        durationMs: 100,
        dryRun: false,
      });

      const entries = await service.getByPipeline(testPipelineId);
      expect(entries[0].output).toBe(specialOutput);
    });
  });

  describe('getByPipeline()', () => {
    it('should return all entries for a pipeline', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Entry 1',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 1,
        taskId: 'task-2',
        agentRole: 'frontend',
        toolName: 'read_file',
        input: {},
        output: 'Entry 2',
        result: 'success',
        durationMs: 5,
        dryRun: false,
      });

      const entries = await service.getByPipeline(testPipelineId);
      expect(entries).toHaveLength(2);
    });

    it('should return empty array for non-existent pipeline', async () => {
      const entries = await service.getByPipeline('non-existent-pipeline');
      expect(entries).toEqual([]);
    });

    it('should return entries in chronological order', async () => {
      const ids: string[] = [];

      for (let i = 0; i < 5; i++) {
        const entry = await service.log({
          pipelineId: testPipelineId,
          phaseIndex: 0,
          taskId: `task-${i}`,
          agentRole: 'backend',
          toolName: 'write_file',
          input: {},
          output: `Output ${i}`,
          result: 'success',
          durationMs: i * 10,
          dryRun: false,
        });
        ids.push(entry.id);
      }

      const entries = await service.getByPipeline(testPipelineId);
      expect(entries).toHaveLength(5);
      expect(entries.map(e => e.id)).toEqual(ids);
    });
  });

  describe('getByPhase()', () => {
    it('should return only entries for specified phase', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Phase 0',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 1,
        taskId: 'task-2',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Phase 1',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-3',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Phase 0 again',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      const phaseEntries = await service.getByPhase(testPipelineId, 0);
      expect(phaseEntries).toHaveLength(2);
      expect(phaseEntries[0].output).toBe('Phase 0');
      expect(phaseEntries[1].output).toBe('Phase 0 again');
    });
  });

  describe('getFileActions()', () => {
    it('should return only entries with file actions', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: { path: 'file1.ts' },
        output: 'File created',
        result: 'success',
        durationMs: 10,
        dryRun: false,
        filesAffected: [{ path: 'file1.ts', action: 'create' }],
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-2',
        agentRole: 'backend',
        toolName: 'run_command',
        input: { command: 'echo hello' },
        output: 'hello',
        result: 'success',
        durationMs: 5,
        dryRun: false,
        // No filesAffected
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-3',
        agentRole: 'backend',
        toolName: 'delete_file',
        input: { path: 'file2.ts' },
        output: 'File deleted',
        result: 'success',
        durationMs: 8,
        dryRun: false,
        filesAffected: [{ path: 'file2.ts', action: 'delete' }],
      });

      const fileActions = await service.getFileActions(testPipelineId, 0);
      expect(fileActions).toHaveLength(2);
      expect(fileActions[0].toolName).toBe('write_file');
      expect(fileActions[1].toolName).toBe('delete_file');
    });
  });

  describe('getSummary()', () => {
    it('should generate summary with counts and stats', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Created',
        result: 'success',
        durationMs: 100,
        dryRun: false,
        filesAffected: [
          { path: 'file1.ts', action: 'create' },
          { path: 'file2.ts', action: 'create' },
        ],
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-2',
        agentRole: 'backend',
        toolName: 'read_file',
        input: {},
        output: 'Content',
        result: 'success',
        durationMs: 50,
        dryRun: false,
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-3',
        agentRole: 'backend',
        toolName: 'read_file',
        input: {},
        output: 'Another read',
        result: 'error',
        durationMs: 25,
        dryRun: true,
      });

      const summary = await service.getSummary(testPipelineId);

      expect(summary.totalActions).toBe(3);
      expect(summary.byTool['write_file']).toBe(1);
      expect(summary.byTool['read_file']).toBe(2);
      expect(summary.byResult['success']).toBe(2);
      expect(summary.byResult['error']).toBe(1);
      expect(summary.totalFilesAffected).toBe(2);
      expect(summary.totalDurationMs).toBe(175);
      expect(summary.dryRunCount).toBe(1);
    });
  });

  describe('getDryRunSummary()', () => {
    it('should summarize only dry-run entries', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: { path: 'file1.ts' },
        output: 'Created (dry-run)',
        result: 'success',
        durationMs: 10,
        dryRun: true,
        filesAffected: [{ path: 'file1.ts', action: 'create' }],
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-2',
        agentRole: 'backend',
        toolName: 'delete_file',
        input: { path: 'file2.ts' },
        output: 'Deleted (dry-run)',
        result: 'success',
        durationMs: 8,
        dryRun: true,
        filesAffected: [{ path: 'file2.ts', action: 'delete' }],
      });

      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-3',
        agentRole: 'backend',
        toolName: 'write_file',
        input: { path: 'file3.ts' },
        output: 'Created (real)',
        result: 'success',
        durationMs: 12,
        dryRun: false,
        filesAffected: [{ path: 'file3.ts', action: 'create' }],
      });

      const dryRunSummary = await service.getDryRunSummary(testPipelineId);

      expect(dryRunSummary.totalActions).toBe(2);
      expect(dryRunSummary.writesPlanned).toBe(1);
      expect(dryRunSummary.deletesPlanned).toBe(1);
      expect(dryRunSummary.filesAffected).toHaveLength(2);
      expect(dryRunSummary.filesAffected).toContain('file1.ts');
      expect(dryRunSummary.filesAffected).toContain('file2.ts');
    });

    it('should return empty summary for pipeline with no dry-runs', async () => {
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Real write',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      const dryRunSummary = await service.getDryRunSummary(testPipelineId);

      expect(dryRunSummary.totalActions).toBe(0);
      expect(dryRunSummary.writesPlanned).toBe(0);
      expect(dryRunSummary.filesAffected).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should skip malformed log lines gracefully', async () => {
      // Add a valid entry first
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-1',
        agentRole: 'backend',
        toolName: 'write_file',
        input: {},
        output: 'Valid',
        result: 'success',
        durationMs: 10,
        dryRun: false,
      });

      // Manually corrupt the log file
      const logsDir = path.join(os.homedir(), '.anamnesic', 'logs');
      const logFile = path.join(logsDir, `${testPipelineId}.jsonl`);
      const currentContent = fs.readFileSync(logFile, 'utf-8');
      fs.writeFileSync(logFile, currentContent + 'INVALID JSON\n', 'utf-8');

      // Add another valid entry to test recovery
      await service.log({
        pipelineId: testPipelineId,
        phaseIndex: 0,
        taskId: 'task-2',
        agentRole: 'backend',
        toolName: 'read_file',
        input: {},
        output: 'Another valid',
        result: 'success',
        durationMs: 5,
        dryRun: false,
      });

      // Should still read valid entries, skipping the malformed one
      const entries = await service.getByPipeline(testPipelineId);
      expect(entries).toHaveLength(2);
      expect(entries[0].output).toBe('Valid');
      expect(entries[1].output).toBe('Another valid');
    });
  });
});
