/**
 * Command validation utilities for agent guardrails.
 * Portado e aprimorado do ThinkCoffee para o ChronoKairo AI.
 * Impede a execução de comandos destrutivos e bloqueia ameaças críticas.
 */

import type { CommandValidationResult, CommandRiskLevel } from './types';

/**
 * Padrões de comandos totalmente bloqueados que NUNCA devem ser executados.
 */
export const BLOCKED_PATTERNS: RegExp[] = [
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

  // Destruição bruta de partições de hardware
  /\becho\s+.*>\s*\/dev\/sd[a-z]/i,
  /\bdd\s+if=.*of=\/dev\/(sd[a-z]|nvme[0-9])/i,
  /\b>\s*\/dev\/null\s*2>&1\s*&\s*disown/i,
];

/**
 * Padrões de comandos potencialmente destrutivos.
 * Exigem confirmação explícita do desenvolvedor antes da execução.
 */
export const DESTRUCTIVE_PATTERNS: RegExp[] = [
  // Deleção recursiva - Unix
  /\brm\s+-[a-z]*r[a-z]*\b/i,
  /\brm\s+(-[rf]+\s+)*[\/~]/i,
  /\brm\s+-rf?\s+\*/i,
  /\brmdir\s+/i,

  // Deleção recursiva - Windows
  /\bdel\s+\/[sqf]/i,
  /\brd\s+\/s/i,
  /\brmdir\s+\/s/i,
  /\bRemove-Item\s+.*-Recurse/i,

  // Operações de formatação de disco
  /\bformat\s+[a-z]:/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bfdisk\b/i,

  // Modificação crítica de permissões e root
  /\bchmod\s+777/i,
  /\bchown\s+-R\s+/i,
  /\bsudo\s+/i,
  /\bsu\s+-/i,

  // Exfiltração de rede com execução direta (pipe to shell)
  /\b(curl|wget)\s+.*\|\s*(ba)?sh/i,
  /\b(curl|wget)\s+.*-o\s+\/tmp/i,

  // Gerenciadores de pacote com sudo
  /\bsudo\s+(apt|yum|dnf|pacman|brew)/i,

  // Operações destrutivas / forçadas de Git
  /\bgit\s+push\s+.*--force/i,
  /\bgit\s+push\s+.*-f\b/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-fd/i,

  // Destruição de banco de dados
  /\bDROP\s+(DATABASE|TABLE|SCHEMA)/i,
  /\bTRUNCATE\s+TABLE/i,
  /\bDELETE\s+FROM\s+.*WHERE\s+1\s*=\s*1/i,

  // Manipulação de ambiente de execução
  /\bexport\s+PATH=/i,
  /\bunset\s+PATH/i,

  // Encerramento forçado de processos
  /\bkill\s+-9\s+/i,
  /\bkillall\s+/i,
  /\btaskkill\s+\/f/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
];

/**
 * Padrões de risco moderado (acesso a rede, instalações de pacote, etc.).
 */
export const MODERATE_PATTERNS: RegExp[] = [
  /\b(curl|wget|fetch)\b/i,
  /\bnpm\s+(install|i|add)/i,
  /\bpnpm\s+(install|i|add)/i,
  /\byarn\s+add/i,
  /\bpip\s+install/i,
  /\bcargo\s+add/i,
  /\bchmod\b/i,
  /\bmkdir\s+-p/i,
];

/**
 * Comandos seguros que não necessitam de confirmação prévia.
 */
export const SAFE_COMMANDS: string[] = [
  'ls', 'dir', 'pwd', 'cd', 'cat', 'head', 'tail', 'less', 'more',
  'grep', 'find', 'which', 'whereis', 'echo', 'printf',
  'node --version', 'npm --version', 'pnpm --version', 'yarn --version',
  'git status', 'git log', 'git diff', 'git branch',
  'tsc --version', 'npx --version', 'cargo --version', 'rustc --version',
];

/**
 * Valida um comando de shell antes da execução pelo agente.
 */
export function validateCommand(command: string): CommandValidationResult {
  const normalized = command.trim();

  // 1. Verificar comandos bloqueados permanentemente
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Comando BLOQUEADO por segurança: padrão malicioso detectado (${pattern.source})`,
        riskLevel: 'blocked',
      };
    }
  }

  // 2. Verificar comandos destrutivos que exigem aprovação humana
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Comando de ALTO RISCO: requer confirmação humana antes da execução (${pattern.source})`,
        riskLevel: 'destructive',
      };
    }
  }

  // 3. Verificar comandos de risco moderado (rede, pacotes)
  for (const pattern of MODERATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: true,
        requiresConfirmation: false,
        reason: 'Risco moderado: operação de rede ou gerenciamento de pacotes',
        riskLevel: 'moderate',
      };
    }
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    reason: 'Comando seguro para execução',
    riskLevel: 'safe',
  };
}

export function isDestructiveCommand(command: string): boolean {
  const result = validateCommand(command);
  return result.riskLevel === 'destructive' || result.riskLevel === 'blocked';
}

export function isBlockedCommand(command: string): boolean {
  return validateCommand(command).riskLevel === 'blocked';
}
