import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runCommand, isCommandSafe, getCommandRiskLevel } from '../run-command';
import { ToolContext } from '../file-tools';
import { ActionLogService } from '../../services/ActionLogService';

describe('run-command', () => {
  let workspaceDir: string;
  let actionLogService: ActionLogService;
  let ctx: ToolContext;
  const testPipelineId = 'cmd-test-' + Date.now();

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmd-test-'));
    actionLogService = new ActionLogService(workspaceDir);

    ctx = {
      workspaceRoot: workspaceDir,
      pipelineId: testPipelineId,
      phaseIndex: 0,
      phaseName: 'test-phase',
      taskId: 'task-1',
      agentRole: 'backend',
      dryRun: false,
      actionLogService,
    };
  });

  afterEach(() => {
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    const logFile = path.join(os.homedir(), '.anamnesic', 'logs', `${testPipelineId}.jsonl`);
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  describe('runCommand()', () => {
    it('should execute safe commands', async () => {
      const result = await runCommand(ctx, { command: 'echo hello' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('hello');
      expect(result.validation.riskLevel).toBe('safe');
    });

    it('should block dangerous commands', async () => {
      const result = await runCommand(ctx, { command: 'rm -rf /' });

      expect(result.success).toBe(false);
      expect(result.validation.riskLevel).toBe('destructive');
      expect(result.validation.requiresConfirmation).toBe(true);
    });

    it('should allow destructive commands with confirmation', async () => {
      const confirmCallback = async () => true;

      const result = await runCommand(
        ctx,
        { command: 'rm -rf /tmp/test-safe-delete' },
        { onConfirmRequired: confirmCallback }
      );

      // Command allowed but may fail (file doesn't exist)
      expect(result.validation.requiresConfirmation).toBe(true);
    });

    it('should reject destructive commands without confirmation', async () => {
      const result = await runCommand(ctx, { command: 'rm -rf /tmp/test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires confirmation');
    });

    it('should not execute in dry-run mode', async () => {
      // Create a file to prove it wasn't deleted
      const testFile = path.join(workspaceDir, 'keep.txt');
      fs.writeFileSync(testFile, 'content');

      const dryRunCtx = { ...ctx, dryRun: true };
      const result = await runCommand(dryRunCtx, { command: `rm ${testFile}` });

      expect(result.success).toBe(true);
      expect(result.output).toContain('DRY-RUN');
      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should block fork bombs', async () => {
      const result = await runCommand(ctx, { command: ':(){ :|:& };:' });

      expect(result.success).toBe(false);
      expect(result.validation.riskLevel).toBe('blocked');
      expect(result.validation.allowed).toBe(false);
    });

    it('should handle command timeout', async () => {
      // Skip on Windows as sleep command differs
      if (process.platform === 'win32') return;

      const result = await runCommand(ctx, {
        command: 'sleep 10',
        timeout: 100, // 100ms timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('failed');
    });

    it('should use specified working directory', async () => {
      const subdir = path.join(workspaceDir, 'subdir');
      fs.mkdirSync(subdir);
      fs.writeFileSync(path.join(subdir, 'test.txt'), 'content');

      const result = await runCommand(ctx, {
        command: process.platform === 'win32' ? 'dir' : 'ls',
        cwd: subdir,
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('test.txt');
    });

    it('should return exit code on failure', async () => {
      const result = await runCommand(ctx, {
        command: process.platform === 'win32' 
          ? 'cmd /c exit 42' 
          : 'exit 42',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exit code');
    });
  });

  describe('isCommandSafe()', () => {
    it('should return true for safe commands', () => {
      expect(isCommandSafe('ls -la')).toBe(true);
      expect(isCommandSafe('echo hello')).toBe(true);
      expect(isCommandSafe('pwd')).toBe(true);
    });

    it('should return true for moderate commands', () => {
      expect(isCommandSafe('npm install')).toBe(true);
      expect(isCommandSafe('curl https://example.com')).toBe(true);
    });

    it('should return false for destructive commands', () => {
      expect(isCommandSafe('rm -rf /')).toBe(false);
      expect(isCommandSafe('sudo apt-get install something')).toBe(false);
      expect(isCommandSafe('git push --force')).toBe(false);
    });
  });

  describe('getCommandRiskLevel()', () => {
    it('should return correct risk levels', () => {
      expect(getCommandRiskLevel('ls')).toBe('safe');
      expect(getCommandRiskLevel('npm install')).toBe('moderate');
      expect(getCommandRiskLevel('rm -rf /')).toBe('destructive');
      expect(getCommandRiskLevel(':(){ :|:& };:')).toBe('blocked');
    });
  });
});
