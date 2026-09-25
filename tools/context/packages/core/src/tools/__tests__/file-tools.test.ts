import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  searchCode,
  ToolContext,
} from '../file-tools';
import { ActionLogService } from '../../services/ActionLogService';
import { SnapshotService } from '../../services/SnapshotService';

describe('File Tools', () => {
  let workspaceDir: string;
  let ctx: ToolContext;
  let snapshotService: SnapshotService;
  let actionLogService: ActionLogService;
  const testPipelineId = 'tools-test-' + Date.now();

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filetools-test-'));
    snapshotService = new SnapshotService(workspaceDir);
    actionLogService = new ActionLogService(workspaceDir);

    ctx = {
      workspaceRoot: workspaceDir,
      pipelineId: testPipelineId,
      phaseIndex: 0,
      phaseName: 'test-phase',
      taskId: 'task-1',
      agentRole: 'backend',
      dryRun: false,
      snapshotService,
      actionLogService,
    };
  });

  afterEach(() => {
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    // Clean up snapshots
    const snapshotsDir = path.join(os.homedir(), '.anamnesic', 'snapshots', testPipelineId);
    if (fs.existsSync(snapshotsDir)) {
      fs.rmSync(snapshotsDir, { recursive: true, force: true });
    }
    // Clean up logs
    const logFile = path.join(os.homedir(), '.anamnesic', 'logs', `${testPipelineId}.jsonl`);
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  describe('readFile()', () => {
    it('should read file content with line numbers', async () => {
      const testFile = path.join(workspaceDir, 'test.txt');
      fs.writeFileSync(testFile, 'line1\nline2\nline3');

      const result = await readFile(ctx, { path: 'test.txt' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('line1');
      expect(result.output).toContain('1: line1');
      expect(result.output).toContain('2: line2');
      expect(result.output).toContain('3: line3');
    });

    it('should read specific line range', async () => {
      const testFile = path.join(workspaceDir, 'test.txt');
      fs.writeFileSync(testFile, 'line1\nline2\nline3\nline4\nline5');

      const result = await readFile(ctx, { path: 'test.txt', startLine: 2, endLine: 4 });

      expect(result.success).toBe(true);
      expect(result.output).not.toContain('1: line1');
      expect(result.output).toContain('2: line2');
      expect(result.output).toContain('3: line3');
      expect(result.output).toContain('4: line4');
      expect(result.output).not.toContain('5: line5');
    });

    it('should fail for non-existent file', async () => {
      const result = await readFile(ctx, { path: 'nonexistent.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should fail for directory', async () => {
      fs.mkdirSync(path.join(workspaceDir, 'subdir'));

      const result = await readFile(ctx, { path: 'subdir' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('directory');
    });

    it('should fail for binary files', async () => {
      const binFile = path.join(workspaceDir, 'image.png');
      fs.writeFileSync(binFile, Buffer.from([0x89, 0x50, 0x4E, 0x47]));

      const result = await readFile(ctx, { path: 'image.png' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Binary file');
    });

    it('should block path traversal', async () => {
      const result = await readFile(ctx, { path: '../../../etc/passwd' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('traversal');
    });
  });

  describe('writeFile()', () => {
    it('should create new file', async () => {
      const result = await writeFile(ctx, {
        path: 'new-file.ts',
        content: 'export const x = 1;',
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('created');

      const filePath = path.join(workspaceDir, 'new-file.ts');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('export const x = 1;');
    });

    it('should create parent directories', async () => {
      const result = await writeFile(ctx, {
        path: 'deep/nested/dir/file.ts',
        content: 'test',
      });

      expect(result.success).toBe(true);
      const filePath = path.join(workspaceDir, 'deep', 'nested', 'dir', 'file.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should overwrite existing file and create snapshot', async () => {
      const testFile = path.join(workspaceDir, 'existing.txt');
      fs.writeFileSync(testFile, 'original');

      const result = await writeFile(ctx, {
        path: 'existing.txt',
        content: 'updated',
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('updated');
      expect(fs.readFileSync(testFile, 'utf-8')).toBe('updated');

      // Verify snapshot was created
      const snapshot = await snapshotService.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.files[0].path).toBe('existing.txt');
    });

    it('should not write in dry-run mode', async () => {
      const dryRunCtx = { ...ctx, dryRun: true };

      const result = await writeFile(dryRunCtx, {
        path: 'should-not-exist.txt',
        content: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('DRY-RUN');
      expect(fs.existsSync(path.join(workspaceDir, 'should-not-exist.txt'))).toBe(false);
    });

    it('should block path traversal', async () => {
      const result = await writeFile(ctx, {
        path: '../outside.txt',
        content: 'malicious',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('traversal');
    });
  });

  describe('deleteFile()', () => {
    it('should delete existing file with snapshot', async () => {
      const testFile = path.join(workspaceDir, 'to-delete.txt');
      fs.writeFileSync(testFile, 'content');

      const result = await deleteFile(ctx, { path: 'to-delete.txt' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('deleted');
      expect(fs.existsSync(testFile)).toBe(false);

      // Verify snapshot was created
      const snapshot = await snapshotService.getSnapshot(testPipelineId, 0);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.files[0].action).toBe('deleted');
    });

    it('should fail for non-existent file', async () => {
      const result = await deleteFile(ctx, { path: 'nonexistent.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should not delete in dry-run mode', async () => {
      const testFile = path.join(workspaceDir, 'keep-me.txt');
      fs.writeFileSync(testFile, 'content');

      const dryRunCtx = { ...ctx, dryRun: true };
      const result = await deleteFile(dryRunCtx, { path: 'keep-me.txt' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('DRY-RUN');
      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should delete directory recursively', async () => {
      const dir = path.join(workspaceDir, 'dir-to-delete');
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, 'file.txt'), 'content');

      const result = await deleteFile(ctx, { path: 'dir-to-delete' });

      expect(result.success).toBe(true);
      expect(fs.existsSync(dir)).toBe(false);
    });
  });

  describe('listFiles()', () => {
    it('should list files and directories', async () => {
      fs.writeFileSync(path.join(workspaceDir, 'file1.ts'), '');
      fs.writeFileSync(path.join(workspaceDir, 'file2.ts'), '');
      fs.mkdirSync(path.join(workspaceDir, 'subdir'));

      const result = await listFiles(ctx, { path: '.' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('file1.ts');
      expect(result.output).toContain('file2.ts');
      expect(result.output).toContain('subdir/');
    });

    it('should list recursively', async () => {
      fs.mkdirSync(path.join(workspaceDir, 'src'));
      fs.writeFileSync(path.join(workspaceDir, 'src', 'index.ts'), '');

      const result = await listFiles(ctx, { path: '.', recursive: true });

      expect(result.success).toBe(true);
      expect(result.output).toContain('src/index.ts');
    });

    it('should ignore node_modules', async () => {
      fs.mkdirSync(path.join(workspaceDir, 'node_modules'));
      fs.writeFileSync(path.join(workspaceDir, 'node_modules', 'package.json'), '{}');

      const result = await listFiles(ctx, { path: '.', recursive: true });

      expect(result.success).toBe(true);
      expect(result.output).toContain('node_modules/ (ignored)');
      expect(result.output).not.toContain('package.json');
    });

    it('should fail for non-existent path', async () => {
      const result = await listFiles(ctx, { path: 'nonexistent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('searchCode()', () => {
    it('should find matches across files', async () => {
      fs.writeFileSync(path.join(workspaceDir, 'a.ts'), 'const foo = 1;');
      fs.writeFileSync(path.join(workspaceDir, 'b.ts'), 'const bar = 2;\nconst foo = 3;');

      const result = await searchCode(ctx, { pattern: 'foo' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Found');
      expect(result.output).toContain('a.ts');
      expect(result.output).toContain('b.ts');
    });

    it('should respect file glob', async () => {
      fs.writeFileSync(path.join(workspaceDir, 'script.ts'), 'const foo = 1;');
      fs.writeFileSync(path.join(workspaceDir, 'style.css'), '.foo { color: red; }');

      const result = await searchCode(ctx, { pattern: 'foo', fileGlob: '**/*.ts' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('script.ts');
      expect(result.output).not.toContain('style.css');
    });

    it('should return no matches message', async () => {
      fs.writeFileSync(path.join(workspaceDir, 'test.ts'), 'const x = 1;');

      const result = await searchCode(ctx, { pattern: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('No matches');
    });

    it('should skip binary files', async () => {
      fs.writeFileSync(path.join(workspaceDir, 'image.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]));
      fs.writeFileSync(path.join(workspaceDir, 'text.ts'), 'const png = "test";');

      const result = await searchCode(ctx, { pattern: 'png' });

      expect(result.success).toBe(true);
      expect(result.output).toContain('text.ts');
      // Should not throw or include binary file
    });

    it('should respect maxResults', async () => {
      fs.writeFileSync(
        path.join(workspaceDir, 'many.ts'),
        Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`).join('\n')
      );

      const result = await searchCode(ctx, { pattern: 'const', maxResults: 5 });

      expect(result.success).toBe(true);
      expect(result.output).toContain('5 match');
    });
  });
});
