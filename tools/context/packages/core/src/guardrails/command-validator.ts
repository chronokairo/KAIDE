/**
 * Command validation utilities for agent guardrails.
 * Prevents execution of dangerous shell commands.
 */

/**
 * Patterns that indicate potentially destructive commands.
 * These should require explicit user confirmation before execution.
 */
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  // File deletion - Unix
  /\brm\s+(-[rf]+\s+)*[\/~]/i,
  /\brm\s+-rf?\s+\*/i,
  /\brmdir\s+/i,

  // File deletion - Windows
  /\bdel\s+\/[sqf]/i,
  /\brd\s+\/s/i,
  /\brmdir\s+\/s/i,
  /\bRemove-Item\s+.*-Recurse/i,

  // Disk operations
  /\bformat\s+[a-z]:/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bfdisk\b/i,

  // System modification
  /\bchmod\s+777/i,
  /\bchown\s+-R\s+/i,
  /\bsudo\s+/i,
  /\bsu\s+-/i,

  // Network exfiltration
  /\b(curl|wget)\s+.*\|\s*(ba)?sh/i,
  /\b(curl|wget)\s+.*-o\s+\/tmp/i,

  // Package managers with sudo
  /\bsudo\s+(apt|yum|dnf|pacman|brew)/i,

  // Git force operations
  /\bgit\s+push\s+.*--force/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-fd/i,

  // Database drops
  /\bDROP\s+(DATABASE|TABLE|SCHEMA)/i,
  /\bTRUNCATE\s+TABLE/i,
  /\bDELETE\s+FROM\s+.*WHERE\s+1\s*=\s*1/i,

  // Environment manipulation
  /\bexport\s+PATH=/i,
  /\bunset\s+PATH/i,

  // Process killing
  /\bkill\s+-9\s+/i,
  /\bkillall\s+/i,
  /\btaskkill\s+\/f/i,
];

/**
 * Patterns for commands that are completely blocked and should never execute.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  // Fork bombs
  /:\(\)\s*{\s*:\|:&\s*};:/,
  /\bfork\s+bomb/i,

  // Crypto miners
  /\bxmrig\b/i,
  /\bcryptominer\b/i,

  // Reverse shells
  /\bbash\s+-i\s+>&\s+\/dev\/tcp/i,
  /\bnc\s+-e\s+\/bin\/(ba)?sh/i,
  /\bpython.*socket.*connect/i,

  // System destruction
  /\becho\s+.*>\s*\/dev\/sd[a-z]/i,
  /\b>\s*\/dev\/null\s*2>&1\s*&\s*disown/i,
];

export interface CommandValidationResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  riskLevel: 'safe' | 'moderate' | 'destructive' | 'blocked';
}

/**
 * Validate a shell command before execution.
 *
 * @param command - The shell command to validate
 * @param _workspaceRoot - Optional workspace root (reserved for future path-aware checks)
 * @returns Validation result with risk assessment
 */
export function validateCommand(command: string, _workspaceRoot?: string): CommandValidationResult {
  // Check for completely blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Command blocked: matches dangerous pattern "${pattern.source}"`,
        riskLevel: 'blocked',
      };
    }
  }

  // Check for destructive patterns
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Potentially destructive command: matches pattern "${pattern.source}"`,
        riskLevel: 'destructive',
      };
    }
  }

  // Check for moderate risk patterns (network, package installs)
  if (isModerateRisk(command)) {
    return {
      allowed: true,
      requiresConfirmation: false,
      reason: 'Moderate risk command - network or file system access',
      riskLevel: 'moderate',
    };
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    riskLevel: 'safe',
  };
}

/**
 * Check if a command is potentially destructive and requires confirmation.
 */
export function isDestructiveCommand(command: string): boolean {
  const result = validateCommand(command);
  return result.riskLevel === 'destructive' || result.riskLevel === 'blocked';
}

/**
 * Check if a command is completely blocked.
 */
export function isBlockedCommand(command: string): boolean {
  return BLOCKED_PATTERNS.some(p => p.test(command));
}

/**
 * Check if command has moderate risk (not destructive but worth logging).
 */
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

  return moderatePatterns.some(p => p.test(command));
}

/**
 * List of safe commands that don't require any special handling.
 */
export const SAFE_COMMANDS: string[] = [
  'ls', 'dir', 'pwd', 'cd', 'cat', 'head', 'tail', 'less', 'more',
  'grep', 'find', 'which', 'whereis', 'echo', 'printf',
  'node --version', 'npm --version', 'pnpm --version', 'yarn --version',
  'git status', 'git log', 'git diff', 'git branch',
  'tsc --version', 'npx --version',
];
