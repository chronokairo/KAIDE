#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const server = new McpServer({
  name: "saas-distribuidora",
  version: "1.0.0",
});

// Helper functions
function readFile(filePath) {
  const fullPath = path.join(REPO_ROOT, filePath);
  if (!fullPath.startsWith(REPO_ROOT)) throw new Error("Path traversal not allowed");
  return fs.readFileSync(fullPath, "utf-8");
}

function writeFile(filePath, content) {
  const fullPath = path.join(REPO_ROOT, filePath);
  if (!fullPath.startsWith(REPO_ROOT)) throw new Error("Path traversal not allowed");
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  return `File written: ${filePath}`;
}

function listFiles(dirPath, recursive = false) {
  const fullPath = path.join(REPO_ROOT, dirPath);
  if (!fullPath.startsWith(REPO_ROOT)) throw new Error("Path traversal not allowed");

  const results = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || ["node_modules", "dist", "build"].includes(entry.name))
        continue;

      const fullPath = path.join(dir, entry.name);
      const relative = path.relative(REPO_ROOT, fullPath);

      if (entry.isDirectory()) {
        results.push(`📁 ${relative}/`);
        if (recursive) walk(fullPath);
      } else {
        results.push(`📄 ${relative}`);
      }
    }
  };

  walk(fullPath);
  return results.join("\n");
}

function executeCommand(command) {
  try {
    const output = execSync(command, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return output;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function searchFiles(pattern, type) {
  const regex = new RegExp(pattern, "i");
  const results = [];

  const search = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || ["node_modules", "dist"].includes(entry.name))
          continue;

        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(REPO_ROOT, fullPath);

        if (entry.isDirectory()) {
          search(fullPath);
        } else if (type === "filename") {
          if (regex.test(entry.name)) results.push(relative);
        } else if (type === "content") {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (regex.test(content)) results.push(relative);
          } catch {}
        }
      }
    } catch {}
  };

  search(REPO_ROOT);
  return results.length > 0 ? results.join("\n") : "No matches found";
}

function getProjectStructure() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8")
    );

    return {
      name: pkg.name,
      version: pkg.version,
      packages: fs
        .readdirSync(path.join(REPO_ROOT, "packages"), { withFileTypes: true })
        .filter((f) => f.isDirectory())
        .map((f) => f.name),
      scripts: Object.keys(pkg.scripts || {}),
    };
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function getGitStatus() {
  try {
    const status = execSync("git status --porcelain", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    }).trim();
    return `Branch: ${branch}\n\nChanges:\n${status || "No changes"}`;
  } catch {
    return "Git not available";
  }
}

function gitLog(maxCount = 10) {
  try {
    const log = execSync(
      `git log --oneline -${maxCount} --graph --decorate`,
      {
        cwd: REPO_ROOT,
        encoding: "utf-8",
      }
    );
    return log || "No commits found";
  } catch {
    return "Git not available";
  }
}

function gitDiff(filePath = null) {
  try {
    const cmd = filePath
      ? `git diff ${filePath}`
      : "git diff --stat";
    const diff = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return diff || "No changes";
  } catch {
    return "Git not available";
  }
}

function gitAdd(filePath) {
  try {
    const output = execSync(`git add "${filePath}"`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return `Added: ${filePath}`;
  } catch (error) {
    return `Error adding file: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function gitCommit(message) {
  try {
    const output = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return output;
  } catch (error) {
    return `Error committing: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function gitPush(branch = "main") {
  try {
    const output = execSync(`git push origin ${branch}`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return output;
  } catch (error) {
    return `Error pushing: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function gitPull(branch = "main") {
  try {
    const output = execSync(`git pull origin ${branch}`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return output;
  } catch (error) {
    return `Error pulling: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function gitBranch(action = "list", branchName = null) {
  try {
    let cmd;
    if (action === "list") {
      cmd = "git branch -a";
    } else if (action === "create" && branchName) {
      cmd = `git branch ${branchName}`;
    } else if (action === "delete" && branchName) {
      cmd = `git branch -d ${branchName}`;
    } else if (action === "checkout" && branchName) {
      cmd = `git checkout ${branchName}`;
    } else {
      return "Invalid action or missing branch name";
    }

    const output = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return output || "Branch operation completed";
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function gitStash(action = "list") {
  try {
    let cmd;
    if (action === "list") {
      cmd = "git stash list";
    } else if (action === "save") {
      cmd = 'git stash push -u -m "MCP stash"';
    } else if (action === "pop") {
      cmd = "git stash pop";
    } else {
      return "Invalid action";
    }

    const output = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return output || "Stash operation completed";
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Register tools
server.registerTool(
  "read_file",
  {
    description: "Read the contents of a file",
    inputSchema: z.object({
      path: z.string().describe("Relative path to the file"),
    }),
  },
  async (args) => {
    const result = readFile(args.path);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "write_file",
  {
    description: "Write or create a file",
    inputSchema: z.object({
      path: z.string().describe("Relative path to the file"),
      content: z.string().describe("File content"),
    }),
  },
  async (args) => {
    const result = writeFile(args.path, args.content);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "list_files",
  {
    description: "List files in a directory",
    inputSchema: z.object({
      path: z.string().optional().describe("Directory path"),
      recursive: z.boolean().optional().describe("List recursively"),
    }),
  },
  async (args) => {
    const result = listFiles(args.path || ".", args.recursive || false);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "execute_command",
  {
    description: "Execute a command",
    inputSchema: z.object({
      command: z.string().describe("Command to execute"),
    }),
  },
  async (args) => {
    const result = executeCommand(args.command);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "search_files",
  {
    description: "Search for files or content",
    inputSchema: z.object({
      pattern: z.string().describe("Search pattern"),
      type: z.enum(["filename", "content"]).describe("Search type"),
    }),
  },
  async (args) => {
    const result = searchFiles(args.pattern, args.type);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "get_project_structure",
  {
    description: "Get project structure",
    inputSchema: z.object({}),
  },
  async () => {
    const result = getProjectStructure();
    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "get_git_status",
  {
    description: "Get git status",
    inputSchema: z.object({}),
  },
  async () => {
    const result = getGitStatus();
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_log",
  {
    description: "Show git commit history",
    inputSchema: z.object({
      maxCount: z.number().optional().describe("Number of commits to show (default: 10)"),
    }),
  },
  async (args) => {
    const result = gitLog(args.maxCount || 10);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_diff",
  {
    description: "Show git diff",
    inputSchema: z.object({
      filePath: z.string().optional().describe("File path for diff (default: shows all changes)"),
    }),
  },
  async (args) => {
    const result = gitDiff(args.filePath);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_add",
  {
    description: "Stage a file for commit",
    inputSchema: z.object({
      filePath: z.string().describe("File path to add"),
    }),
  },
  async (args) => {
    const result = gitAdd(args.filePath);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_commit",
  {
    description: "Create a commit with a message",
    inputSchema: z.object({
      message: z.string().describe("Commit message"),
    }),
  },
  async (args) => {
    const result = gitCommit(args.message);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_push",
  {
    description: "Push commits to remote repository",
    inputSchema: z.object({
      branch: z.string().optional().describe("Branch to push (default: main)"),
    }),
  },
  async (args) => {
    const result = gitPush(args.branch || "main");
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_pull",
  {
    description: "Pull commits from remote repository",
    inputSchema: z.object({
      branch: z.string().optional().describe("Branch to pull (default: main)"),
    }),
  },
  async (args) => {
    const result = gitPull(args.branch || "main");
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_branch",
  {
    description: "List or manage git branches",
    inputSchema: z.object({
      action: z.enum(["list", "create", "delete", "checkout"]).optional().describe("Action to perform"),
      branchName: z.string().optional().describe("Branch name (required for create, delete, checkout)"),
    }),
  },
  async (args) => {
    const result = gitBranch(args.action || "list", args.branchName);
    return { content: [{ type: "text", text: result }] };
  }
);

server.registerTool(
  "git_stash",
  {
    description: "Manage git stash",
    inputSchema: z.object({
      action: z.enum(["list", "save", "pop"]).optional().describe("Action to perform"),
    }),
  },
  async (args) => {
    const result = gitStash(args.action || "list");
    return { content: [{ type: "text", text: result }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SaaS Distribuidora MCP server running");
}

main().catch(console.error);
