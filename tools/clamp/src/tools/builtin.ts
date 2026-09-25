import { z } from "zod";
import { defineTool, type ToolRegistry } from "../registry.js";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import { applyUpdateHunk, type UpdateFileChunk } from "../lib/apply-patch.js";
import { compileGlobPattern, matchesAnyGlobPattern } from "../lib/glob-pattern.js";
import { resolveSafePath } from "../lib/path-policy.js";
import { validateCommand } from "../lib/command-validator.js";

const NO_IGNORE = new Set([".git", "node_modules", "dist", ".cache"]);

export function registerBuiltinTools(registry: ToolRegistry): void {
  registry.register(
    defineTool({
      name: "list",
      description: "List entries in a directory",
      schema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path }, ctx) => {
        const target = await resolveSafePath(ctx.cwd, path);
        const entries = await readdir(target, { withFileTypes: true });
        return entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "dir" : "file",
        }));
      },
    }),
  );

  registry.register(
    defineTool({
      name: "read",
      description: "Read a file's content",
      schema: z.object({
        path: z.string(),
      }),
      execute: async ({ path }, ctx) => {
        const target = await resolveSafePath(ctx.cwd, path);
        return await (ctx.cache?.read(target) ?? readFile(target, "utf8"));
      },
    }),
  );

  registry.register(
    defineTool({
      name: "write",
      description: "Write content to a file (overwrites)",
      schema: z.object({
        path: z.string(),
        content: z.string(),
      }),
      execute: async ({ path, content }, ctx) => {
        const target = await resolveSafePath(ctx.cwd, path);
        await writeFile(target, content, "utf8");
        ctx.cache?.invalidate(target);
        return { ok: true, path: target };
      },
    }),
  );

  registry.register(
    defineTool({
      name: "bash",
      description: "Run a shell command and capture its output",
      schema: z.object({
        command: z.string(),
        timeoutMs: z.number().optional().default(30_000),
      }),
      execute: async ({ command, timeoutMs }, ctx) => {
        const validation = validateCommand(command, ctx.cwd);
        if (!validation.allowed) {
          throw new Error(validation.reason ?? "command blocked by policy");
        }
        if (validation.requiresConfirmation) {
          throw new Error(`command requires explicit confirmation: ${validation.reason ?? command}`);
        }
        return await runShell(command, ctx.cwd, timeoutMs);
      },
    }),
  );

  registry.register(
    defineTool({
      name: "edit",
      description:
        "Apply precise line-based edits to a file. Provide an array of chunks, each with optional changeContext, oldLines (lines to replace, may be empty to insert), newLines (replacement), and isEndOfFile.",
      schema: z.object({
        path: z.string(),
        chunks: z.array(
          z.object({
            changeContext: z.string().optional(),
            oldLines: z.array(z.string()),
            newLines: z.array(z.string()),
            isEndOfFile: z.boolean().optional().default(false),
          }),
        ),
      }),
      execute: async ({ path, chunks }, ctx) => {
        const target = await resolveSafePath(ctx.cwd, path);
        const normalized: UpdateFileChunk[] = chunks.map((chunk) => ({
          changeContext: chunk.changeContext,
          oldLines: chunk.oldLines,
          newLines: chunk.newLines,
          isEndOfFile: chunk.isEndOfFile,
        }));
        const updated = await applyUpdateHunk(target, normalized);
        await writeFile(target, updated, "utf8");
        ctx.cache?.invalidate(target);
        return { ok: true, path: target, linesApplied: normalized.length };
      },
    }),
  );

  registry.register(
    defineTool({
      name: "glob",
      description: "Find files matching a glob pattern under a directory",
      schema: z.object({
        pattern: z.string(),
        base: z.string().default("."),
      }),
      execute: async ({ pattern, base }, ctx) => {
        const baseResolved = await resolveSafePath(ctx.cwd, base);
        const compiled = compileGlobPattern({ raw: pattern, normalize: (v) => v.replace(/\\/g, "/") });
        const results: string[] = [];
        await walk (baseResolved, (rel) => {
          if (matchesAnyGlobPattern(rel, [compiled])) {
            results.push(rel);
          }
        });
        return results;
      },
    }),
  );

  registry.register(
    defineTool({
      name: "grep",
      description: "Recursively search file contents for a regular expression",
      schema: z.object({
        pattern: z.string(),
        base: z.string().default("."),
        maxResults: z.number().optional().default(100),
      }),
      execute: async ({ pattern, base, maxResults }, ctx) => {
        const baseResolved = await resolveSafePath(ctx.cwd, base);
        const re = new RegExp(pattern);
        const matches: Array<{ file: string; line: number; text: string }> = [];
        await walk(baseResolved, async (rel, isDir) => {
          if (isDir || matches.length >= maxResults) {
            return;
          }
          const full = resolve(baseResolved, rel);
          let content: string;
          try {
            content = await readFile(full, "utf8");
          } catch {
            return;
          }
          const lines = content.split("\n");
          for (let i = 0; i < lines.length && matches.length < maxResults; i += 1) {
            const lineText = lines[i] ?? "";
            if (re.test(lineText)) {
              matches.push({ file: rel, line: i + 1, text: lineText.slice(0, 240) });
            }
          }
        });
        return matches;
      },
    }),
  );

  registry.register(
    defineTool({
      name: "web_fetch",
      description: "Fetch a URL and return its body as text",
      schema: z.object({
        url: z.string().url(),
      }),
      execute: async ({ url }) => {
        const response = await fetch(url);
        const text = await response.text();
        return { status: response.status, ok: response.ok, text: text.slice(0, 200_000) };
      },
    }),
  );
}

async function walk(
  dir: string,
  visitor: (rel: string, isDir: boolean) => void | Promise<void>,
): Promise<void> {
  const root = dir;
  const visit = async (current: string, prefix: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (NO_IGNORE.has(entry.name)) {
        continue;
      }
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isDir = entry.isDirectory();
      await visitor(rel, isDir);
      if (isDir) {
        await visit(join(current, entry.name), rel);
      }
    }
  };
  await visit(root, "");
}

function runShell(command: string, cwd: string, timeoutMs: number): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}> {
  return new Promise((resolvePromise) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: -1, stdout, stderr: String(error), timedOut: false });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code ?? -1, stdout, stderr, timedOut });
    });
  });
}
