/**
 * Centralized file tools for Anamnesic agents.
 * All file operations go through these functions to ensure:
 * - Path safety (no traversal outside workspace)
 * - Snapshot integration (backup before writes/deletes)
 * - Action logging
 * - Dry-run support
 */

import fs from 'fs';
import path from 'path';
import { safePath } from '../utils/safe-path';
import { SnapshotService } from '../services/SnapshotService';
import { ActionLogService } from '../services/ActionLogService';
import { ToolResult, FileAction, ToolName } from '../types/safety-net';

// ─── Constants ─────────────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.mp3', '.mp4', '.avi', '.mov', '.wav',
  '.sqlite', '.db', '.lock',
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.venv', 'venv', '.tox', 'coverage', '.nyc_output', '.cache',
  'target', 'bin', 'obj', '.gradle', '.anamnesic',
]);

// ─── Tool Context ──────────────────────────────────────────────

export interface ToolContext {
  workspaceRoot: string;
  pipelineId: string;
  phaseIndex: number;
  phaseName: string;
  taskId: string;
  agentRole: string;
  dryRun: boolean;
  snapshotService?: SnapshotService;
  actionLogService?: ActionLogService;
}

// ─── Read File ─────────────────────────────────────────────────

export interface ReadFileInput {
  path: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Reads a file from the workspace with optional line range.
 */
export async function readFile(
  ctx: ToolContext,
  input: ReadFileInput
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const absPath = safePath(ctx.workspaceRoot, input.path);

    if (!fs.existsSync(absPath)) {
      return logAndReturn(ctx, 'read_file', input, startTime, {
        success: false,
        error: `File not found: ${input.path}`,
        output: '',
      });
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      return logAndReturn(ctx, 'read_file', input, startTime, {
        success: false,
        error: `Path is a directory: ${input.path}`,
        output: '',
      });
    }

    const ext = path.extname(absPath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return logAndReturn(ctx, 'read_file', input, startTime, {
        success: false,
        error: `Binary file (${ext}): ${input.path}`,
        output: '',
      });
    }

    const content = fs.readFileSync(absPath, 'utf-8');
    const lines = content.split('\n');

    const start = Math.max(1, input.startLine || 1);
    const end = Math.min(lines.length, input.endLine || lines.length);
    const slice = lines.slice(start - 1, end);
    const numbered = slice.map((l, i) => `${start + i}: ${l}`).join('\n');

    const header = `File: ${input.path} (lines ${start}-${end} of ${lines.length})`;
    const output = `${header}\n\n${numbered}`;

    return logAndReturn(ctx, 'read_file', input, startTime, {
      success: true,
      output,
      filesAffected: [{ path: input.path, action: 'read' as FileAction }],
    });
  } catch (err) {
    return logAndReturn(ctx, 'read_file', input, startTime, {
      success: false,
      error: (err as Error).message,
      output: '',
    });
  }
}

// ─── Write File ────────────────────────────────────────────────

export interface WriteFileInput {
  path: string;
  content: string;
}

/**
 * Writes content to a file (create or overwrite).
 * Creates parent directories if needed.
 * Takes snapshot before overwriting existing files.
 */
export async function writeFile(
  ctx: ToolContext,
  input: WriteFileInput
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const absPath = safePath(ctx.workspaceRoot, input.path);
    const fileExists = fs.existsSync(absPath);
    const action: FileAction = fileExists ? 'write' : 'create';

    // Dry-run mode: don't actually write
    if (ctx.dryRun) {
      const output = fileExists
        ? `[DRY-RUN] Would overwrite: ${input.path} (${input.content.length} bytes)`
        : `[DRY-RUN] Would create: ${input.path} (${input.content.length} bytes)`;

      return logAndReturn(ctx, 'write_file', input, startTime, {
        success: true,
        output,
        filesAffected: [{ path: input.path, action }],
      }, true);
    }

    // Create snapshot before modifying existing file
    if (fileExists && ctx.snapshotService) {
      const originalContent = fs.readFileSync(absPath);
      await ctx.snapshotService.saveFileContent(
        ctx.pipelineId,
        ctx.phaseIndex,
        ctx.phaseName,
        input.path,
        'modified',
        originalContent
      );
    } else if (!fileExists && ctx.snapshotService) {
      // Record creation for rollback
      await ctx.snapshotService.recordFileCreation(
        ctx.pipelineId,
        ctx.phaseIndex,
        ctx.phaseName,
        input.path
      );
    }

    // Ensure directory exists
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(absPath, input.content, 'utf-8');

    const output = fileExists
      ? `File updated: ${input.path} (${input.content.length} bytes written)`
      : `File created: ${input.path} (${input.content.length} bytes written)`;

    return logAndReturn(ctx, 'write_file', input, startTime, {
      success: true,
      output,
      filesAffected: [{ path: input.path, action }],
    });
  } catch (err) {
    return logAndReturn(ctx, 'write_file', input, startTime, {
      success: false,
      error: (err as Error).message,
      output: '',
    });
  }
}

// ─── Delete File ───────────────────────────────────────────────

export interface DeleteFileInput {
  path: string;
}

/**
 * Deletes a file from the workspace.
 * Takes snapshot before deletion.
 */
export async function deleteFile(
  ctx: ToolContext,
  input: DeleteFileInput
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const absPath = safePath(ctx.workspaceRoot, input.path);

    if (!fs.existsSync(absPath)) {
      return logAndReturn(ctx, 'delete_file', input, startTime, {
        success: false,
        error: `File not found: ${input.path}`,
        output: '',
      });
    }

    // Dry-run mode
    if (ctx.dryRun) {
      return logAndReturn(ctx, 'delete_file', input, startTime, {
        success: true,
        output: `[DRY-RUN] Would delete: ${input.path}`,
        filesAffected: [{ path: input.path, action: 'delete' }],
      }, true);
    }

    // Create snapshot before deletion
    if (ctx.snapshotService) {
      const originalContent = fs.readFileSync(absPath);
      await ctx.snapshotService.saveFileContent(
        ctx.pipelineId,
        ctx.phaseIndex,
        ctx.phaseName,
        input.path,
        'deleted',
        originalContent
      );
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      fs.rmSync(absPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(absPath);
    }

    return logAndReturn(ctx, 'delete_file', input, startTime, {
      success: true,
      output: `File deleted: ${input.path}`,
      filesAffected: [{ path: input.path, action: 'delete' }],
    });
  } catch (err) {
    return logAndReturn(ctx, 'delete_file', input, startTime, {
      success: false,
      error: (err as Error).message,
      output: '',
    });
  }
}

// ─── List Files ────────────────────────────────────────────────

export interface ListFilesInput {
  path: string;
  recursive?: boolean;
  maxDepth?: number;
}

/**
 * Lists files and directories at a path.
 */
export async function listFiles(
  ctx: ToolContext,
  input: ListFilesInput
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const absPath = safePath(ctx.workspaceRoot, input.path);

    if (!fs.existsSync(absPath)) {
      return logAndReturn(ctx, 'list_files', input, startTime, {
        success: false,
        error: `Path not found: ${input.path}`,
        output: '',
      });
    }

    const stat = fs.statSync(absPath);
    if (!stat.isDirectory()) {
      return logAndReturn(ctx, 'list_files', input, startTime, {
        success: false,
        error: `Path is not a directory: ${input.path}`,
        output: '',
      });
    }

    const entries: string[] = [];
    const maxDepth = input.maxDepth ?? (input.recursive ? 5 : 1);

    collectEntries(absPath, input.path || '.', 0, maxDepth, entries, input.recursive ?? false);

    const output = entries.length > 0
      ? entries.join('\n')
      : '(empty directory)';

    return logAndReturn(ctx, 'list_files', input, startTime, {
      success: true,
      output,
    });
  } catch (err) {
    return logAndReturn(ctx, 'list_files', input, startTime, {
      success: false,
      error: (err as Error).message,
      output: '',
    });
  }
}

function collectEntries(
  absPath: string,
  relativePath: string,
  depth: number,
  maxDepth: number,
  entries: string[],
  recursive: boolean
): void {
  if (depth >= maxDepth) return;

  const dirEntries = fs.readdirSync(absPath, { withFileTypes: true });

  for (const entry of dirEntries) {
    const entryRelPath = relativePath === '.'
      ? entry.name
      : path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        entries.push(`${entryRelPath}/ (ignored)`);
        continue;
      }
      entries.push(`${entryRelPath}/`);
      if (recursive) {
        collectEntries(
          path.join(absPath, entry.name),
          entryRelPath,
          depth + 1,
          maxDepth,
          entries,
          recursive
        );
      }
    } else {
      entries.push(entryRelPath);
    }
  }
}

// ─── Search Code ───────────────────────────────────────────────

export interface SearchCodeInput {
  pattern: string;
  fileGlob?: string;
  maxResults?: number;
}

/**
 * Searches for a pattern across workspace files.
 */
export async function searchCode(
  ctx: ToolContext,
  input: SearchCodeInput
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const results: string[] = [];
    const maxResults = input.maxResults ?? 100;
    const regex = new RegExp(input.pattern, 'gi');
    const globPattern = input.fileGlob || '**/*';

    searchInDirectory(
      ctx.workspaceRoot,
      '',
      regex,
      globPattern,
      results,
      maxResults
    );

    const output = results.length > 0
      ? `Found ${results.length} match(es):\n\n${results.join('\n')}`
      : `No matches found for pattern: ${input.pattern}`;

    return logAndReturn(ctx, 'search_code', input, startTime, {
      success: true,
      output,
    });
  } catch (err) {
    return logAndReturn(ctx, 'search_code', input, startTime, {
      success: false,
      error: (err as Error).message,
      output: '',
    });
  }
}

function searchInDirectory(
  absPath: string,
  relativePath: string,
  regex: RegExp,
  glob: string,
  results: string[],
  maxResults: number
): void {
  if (results.length >= maxResults) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (results.length >= maxResults) break;

    const entryRelPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
    const entryAbsPath = path.join(absPath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      searchInDirectory(entryAbsPath, entryRelPath, regex, glob, results, maxResults);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;

      // Simple glob matching (supports **/*.ts style)
      if (!matchesGlob(entryRelPath, glob)) continue;

      try {
        const content = fs.readFileSync(entryAbsPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length && results.length < maxResults; i++) {
          if (regex.test(lines[i])) {
            results.push(`${entryRelPath}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}

function matchesGlob(filePath: string, glob: string): boolean {
  // Simple glob matching
  if (glob === '**/*' || glob === '*') return true;

  // Handle **/*.ext pattern
  const extMatch = glob.match(/^\*\*\/\*(\.\w+)$/);
  if (extMatch) {
    return filePath.endsWith(extMatch[1]);
  }

  // Handle *.ext pattern
  const simpleExtMatch = glob.match(/^\*(\.\w+)$/);
  if (simpleExtMatch) {
    return filePath.endsWith(simpleExtMatch[1]);
  }

  // Fallback: check if glob is a substring
  return filePath.includes(glob.replace(/\*/g, ''));
}

// ─── Helper: Log and Return ────────────────────────────────────

async function logAndReturn(
  ctx: ToolContext,
  toolName: ToolName,
  input: unknown,
  startTime: number,
  result: ToolResult,
  isDryRun = false
): Promise<ToolResult> {
  const durationMs = Date.now() - startTime;

  if (ctx.actionLogService) {
    await ctx.actionLogService.log({
      pipelineId: ctx.pipelineId,
      phaseIndex: ctx.phaseIndex,
      taskId: ctx.taskId,
      agentRole: ctx.agentRole,
      toolName,
      input: input as Record<string, unknown>,
      output: result.output || result.error || '',
      result: result.success ? 'success' : 'error',
      durationMs,
      dryRun: isDryRun || ctx.dryRun,
      filesAffected: result.filesAffected,
    });
  }

  return result;
}
