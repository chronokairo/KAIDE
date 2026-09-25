/**
 * Ported from anamnesic-context/packages/core/src/guardrails/command-validator.ts
 * at afdd993d475a0f142e718e9e21534a21dc15c83a.
 */
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\brm\s+(-[rf]+\s+)*[\/~]/i,
  /\brm\s+-rf?\s+\*/i,
  /\brmdir\s+/i,
  /\bdel\s+\/[sqf]/i,
  /\brd\s+\/s/i,
  /\brmdir\s+\/s/i,
  /\bRemove-Item\s+.*-Recurse/i,
  /\bformat\s+[a-z]:/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bfdisk\b/i,
  /\bchmod\s+777/i,
  /\bchown\s+-R\s+\//i,
  /\bsudo\s+/i,
  /\bsu\s+-/i,
  /\b(curl|wget)\s+.*\|\s*(ba)?sh/i,
  /\b(curl|wget)\s+.*-o\s+\/tmp/i,
  /\bsudo\s+(apt|yum|dnf|pacman|brew)/i,
  /\bgit\s+push\s+.*--force/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-fd/i,
  /\bDROP\s+(DATABASE|TABLE|SCHEMA)/i,
  /\bTRUNCATE\s+TABLE/i,
  /\bDELETE\s+FROM\s+.*WHERE\s+1\s*=\s*1/i,
  /\bexport\s+PATH=/i,
  /\bunset\s+PATH/i,
  /\bkill\s+-9\s+/i,
  /\bkillall\s+/i,
  /\btaskkill\s+\/f/i,
];

const BLOCKED_PATTERNS: RegExp[] = [
  /:\(\)\s*\{\s*:\|:&\s*\};:/,
  /\bfork\s+bomb/i,
  /\bxmrig\b/i,
  /\bcryptominer\b/i,
  /\bbash\s+-i\s+>&\s+\/dev\/tcp/i,
  /\bnc\s+-e\s+\/bin\/(ba)?sh/i,
  /\bpython.*socket.*connect/i,
  /\becho\s+.*>\s*\/dev\/sd[a-z]/i,
  />\s*\/dev\/null\s*2>&1\s*&\s*disown/i,
];

export interface CommandValidationResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  riskLevel: "safe" | "moderate" | "destructive" | "blocked";
}

export function validateCommand(command: string, _workspaceRoot?: string): CommandValidationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Command blocked: matches dangerous pattern "${pattern.source}"`,
        riskLevel: "blocked",
      };
    }
  }

  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Potentially destructive command: matches pattern "${pattern.source}"`,
        riskLevel: "destructive",
      };
    }
  }

  if (isModerateRisk(command)) {
    return {
      allowed: true,
      requiresConfirmation: false,
      reason: "Moderate risk command - network or file system access",
      riskLevel: "moderate",
    };
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    riskLevel: "safe",
  };
}

export function isDestructiveCommand(command: string): boolean {
  const result = validateCommand(command);
  return result.riskLevel === "destructive" || result.riskLevel === "blocked";
}

export function isBlockedCommand(command: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(command));
}

function isModerateRisk(command: string): boolean {
  const moderatePatterns = [
    /\b(curl|wget|fetch)\b/i,
    /\bnpm\s+(install|i|add)/i,
    /\bpnpm\s+(install|i|add)/i,
    /\byarn\s+add/i,
    /\bpip\s+install/i,
    /\bchmod\b/i,
    /\bmkdir\s+-p/i,
  ];

  return moderatePatterns.some((pattern) => pattern.test(command));
}

export const SAFE_COMMANDS: string[] = [
  "ls", "dir", "pwd", "cd", "cat", "head", "tail", "less", "more",
  "grep", "find", "which", "whereis", "echo", "printf",
  "node --version", "npm --version", "pnpm --version", "yarn --version",
  "git status", "git log", "git diff", "git branch",
  "tsc --version", "npx --version",
];
