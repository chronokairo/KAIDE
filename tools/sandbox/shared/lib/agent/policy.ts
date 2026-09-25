import { AgentMode, PolicyResult } from "@/entities/agent/model/types";
import { getEnabledBlocklistPatterns } from "@/shared/lib/dashboard/store";

const STATIC_BLOCKED_PATTERNS: RegExp[] = [
  /rm\s+-rf\s+\//i,
  /:\(\)\s*\{\s*:\|:\s*&\s*\};\s*:/,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /format\s+[a-z]:/i,
  /docker\s+run\s+.*--privileged/i,
];

const ALLOWED_PREFIXES_BY_MODE: Record<AgentMode, string[]> = {
  debian: ["pwd", "ls", "cat", "echo", "python3", "pip", "mkdir", "cd", "printf", "apt-get", "curl"],
  ubuntu: [
    "pwd",
    "ls",
    "cat",
    "echo",
    "python3",
    "pip",
    "mkdir",
    "cd",
    "printf",
    "node",
    "npm",
    "git",
    "apt-get",
    "curl",
    "docker",
    "psql",
    "sqlite3",
  ],
  nixos: ["pwd", "ls", "cat", "echo", "mkdir", "cd", "printf", "nix", "nix-shell", "nix-env", "nix-build", "curl"],
};

function firstToken(command: string): string {
  return command.trim().split(/\s+/)[0] ?? "";
}

export function validateCommandPolicy(command: string, mode: AgentMode): PolicyResult {
  const dynamicPatterns = getEnabledBlocklistPatterns();
  const allPatterns = [...STATIC_BLOCKED_PATTERNS, ...dynamicPatterns];

  for (const pattern of allPatterns) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: "Command matched blocked safety pattern.",
      };
    }
  }

  const first = firstToken(command);
  const allowedPrefixes = ALLOWED_PREFIXES_BY_MODE[mode];

  if (!allowedPrefixes.includes(first)) {
    return {
      allowed: false,
      reason: `Command prefix '${first}' is not allowed in ${mode} mode.`,
    };
  }

  return { allowed: true };
}
