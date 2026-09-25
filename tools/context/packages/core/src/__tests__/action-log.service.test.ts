import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionLogService, ActionLogEntry } from '../services/ActionLogService';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('ActionLogService', () => {
  let logsDir: string;
  let service: ActionLogService;

  beforeEach(async () => {
    // Create temporary directory for tests
    logsDir = path.join(os.tmpdir(), `anamnesic-logs-${Date.now()}`);
    await fs.mkdir(logsDir, { recursive: true });
    service = new ActionLogService(logsDir);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(logsDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('log', () => {
    it('should log a tool call with proper metadata', async () => {
      const entry = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: 'src/index.ts', content: 'test' },
        success: true,
        durationMs: 150,
      };

      await service.log(entry);

      const logs = await service.getByPipeline('pipeline-001');
      expect(logs).toHaveLength(1);
      expect(logs[0].pipelineId).toBe('pipeline-001');
      expect(logs[0].toolName).toBe('write_file');
      expect(logs[0].agentName).toBe('backend');
      expect(logs[0].timestamp).toBeDefined();
      expect(logs[0].id).toBeDefined();
    });

    it('should create nested directories if not exist', async () => {
      const entry = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'read_file',
        input: { path: 'src/index.ts' },
        success: true,
        durationMs: 100,
      };

      await service.log(entry);

      const logPath = path.join(logsDir, 'pipeline-001.jsonl');
      const fileExists = await fs
        .access(logPath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
    });

    it('should log multiple entries to same pipeline', async () => {
      const entries = [
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'read_file',
          input: { path: 'src/index.ts' },
          success: true,
          durationMs: 100,
        },
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'write_file',
          input: { path: 'src/app.ts' },
          success: true,
          durationMs: 200,
        },
      ];

      for (const entry of entries) {
        await service.log(entry);
      }

      const logs = await service.getByPipeline('pipeline-001');
      expect(logs).toHaveLength(2);
      expect(logs[0].toolName).toBe('read_file');
      expect(logs[1].toolName).toBe('write_file');
    });

    it('should handle failed operations', async () => {
      const entry = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: 'invalid/path.ts' },
        success: false,
        error: 'Permission denied',
        durationMs: 50,
      };

      await service.log(entry);

      const logs = await service.getByPipeline('pipeline-001');
      expect(logs[0].success).toBe(false);
      expect(logs[0].error).toBe('Permission denied');
    });

    it('should include dryRun flag when present', async () => {
      const entry = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: { path: 'src/test.ts' },
        success: true,
        durationMs: 75,
        dryRun: true,
      };

      await service.log(entry);

      const logs = await service.getByPipeline('pipeline-001');
      expect(logs[0].dryRun).toBe(true);
    });
  });

  describe('getByPipeline', () => {
    it('should return empty array if pipeline not found', async () => {
      const logs = await service.getByPipeline('non-existent');
      expect(logs).toEqual([]);
    });

    it('should return all entries for a pipeline', async () => {
      const entries = [
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'read_file',
          input: {},
          success: true,
          durationMs: 100,
        },
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 1,
          phaseName: 'implementation',
          agentName: 'frontend',
          toolName: 'write_file',
          input: {},
          success: true,
          durationMs: 200,
        },
      ];

      for (const entry of entries) {
        await service.log(entry);
      }

      const logs = await service.getByPipeline('pipeline-001');
      expect(logs).toHaveLength(2);
      expect(logs[0].phaseIndex).toBe(0);
      expect(logs[1].phaseIndex).toBe(1);
    });

    it('should not mix logs from different pipelines', async () => {
      await service.log({
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'read_file',
        input: {},
        success: true,
        durationMs: 100,
      });

      await service.log({
        pipelineId: 'pipeline-002',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'write_file',
        input: {},
        success: true,
        durationMs: 100,
      });

      const logs1 = await service.getByPipeline('pipeline-001');
      const logs2 = await service.getByPipeline('pipeline-002');

      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(1);
      expect(logs1[0].toolName).toBe('read_file');
      expect(logs2[0].toolName).toBe('write_file');
    });
  });

  describe('getByPhase', () => {
    it('should return entries filtered by phase', async () => {
      const entries = [
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'read_file',
          input: {},
          success: true,
          durationMs: 100,
        },
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 0,
          phaseName: 'analysis',
          agentName: 'backend',
          toolName: 'write_file',
          input: {},
          success: true,
          durationMs: 100,
        },
        {
          pipelineId: 'pipeline-001',
          phaseIndex: 1,
          phaseName: 'implementation',
          agentName: 'frontend',
          toolName: 'write_file',
          input: {},
          success: true,
          durationMs: 200,
        },
      ];

      for (const entry of entries) {
        await service.log(entry);
      }

      const phase0Logs = await service.getByPhase('pipeline-001', 0);
      const phase1Logs = await service.getByPhase('pipeline-001', 1);

      expect(phase0Logs).toHaveLength(2);
      expect(phase1Logs).toHaveLength(1);
      expect(phase1Logs[0].toolName).toBe('write_file');
    });

    it('should return empty array for non-existent phase', async () => {
      const logs = await service.getByPhase('pipeline-001', 999);
      expect(logs).toEqual([]);
    });
  });

  describe('log entry structure', () => {
    it('should have all required fields in logged entry', async () => {
      const entry = {
        pipelineId: 'pipeline-001',
        phaseIndex: 0,
        phaseName: 'analysis',
        agentName: 'backend',
        toolName: 'read_file',
        input: { path: 'src/index.ts' },
        success: true,
        durationMs: 100,
      };

      await service.log(entry);

      const logs = await service.getByPipeline('pipeline-001');
      const loggedEntry = logs[0];

      expect(loggedEntry.id).toBeDefined();
      expect(loggedEntry.timestamp).toBeDefined();
      expect(loggedEntry.pipelineId).toBe('pipeline-001');
      expect(loggedEntry.phaseIndex).toBe(0);
      expect(loggedEntry.phaseName).toBe('analysis');
      expect(loggedEntry.agentName).toBe('backend');
      expect(loggedEntry.toolName).toBe('read_file');
      expect(loggedEntry.input).toEqual({ path: 'src/index.ts' });
      expect(loggedEntry.success).toBe(true);
      expect(loggedEntry.durationMs).toBe(100);
    });
  });
});
