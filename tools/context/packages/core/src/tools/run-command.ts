/**
 * Command execution tool with validation and safety checks.
 */

import { execSync, ExecSyncOptions } from 'child_process';
import { validateCommand, CommandValidationResult } from '../guardrails/command-validator';
import { ActionLogService } from '../services/ActionLogService';
import { ToolResult, CommandRiskLevel, UserDecision } from '../types/safety-net';
import { ToolContext } from './file-tools';

// ─── Types ─────────────────────────────────────────────────────

export interface RunCommandInput {
  command: string;
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface RunCommandOptions {
  /** 
   * Callback for destructive commands requiring confirmation.
   * Return true to allow, false to reject.
   * If not provided, destructive commands are auto-rejected.
   */
  onConfirmRequired?: (command: string, reason: string) => Promise<boolean>;
}

// ─── Run Command ───────────────────────────────────────────────

/**
 * Executes a shell command with validation and safety checks.
 * 
 * Features:
 * - Command validation (blocked, destructive, moderate, safe)
 * - Confirmation for destructive commands
 * - Timeout support
 * - Action logging
 * - Dry-run mode
 */
export async function runCommand(
  ctx: ToolContext,
  input: RunCommandInput,
  options?: RunCommandOptions
): Promise<ToolResult & { validation: CommandValidationResult }> {
  const startTime = Date.now();
  
  // Validate command
  const validation = validateCommand(input.command);

  // Handle blocked commands
  if (!validation.allowed) {
    const result: ToolResult & { validation: CommandValidationResult } = {
      success: false,
      output: '',
      error: validation.reason || 'Command blocked by security policy',
      validation,
    };

    await logCommandAction(ctx, input, startTime, result, validation, 'blocked');
    return result;
  }

  // Handle destructive commands requiring confirmation
  if (validation.requiresConfirmation) {
    let userDecision: UserDecision = 'rejected';

    if (options?.onConfirmRequired) {
      const confirmed = await options.onConfirmRequired(
        input.command,
        validation.reason || 'This command may be destructive'
      );
      userDecision = confirmed ? 'accepted' : 'rejected';
    }

    if (userDecision === 'rejected') {
      const result: ToolResult & { validation: CommandValidationResult } = {
        success: false,
        output: '',
        error: `Command requires confirmation and was rejected: ${input.command}`,
        validation,
      };

      await logCommandAction(ctx, input, startTime, result, validation, userDecision);
      return result;
    }
  }

  // Dry-run mode - don't execute
  if (ctx.dryRun) {
    const result: ToolResult & { validation: CommandValidationResult } = {
      success: true,
      output: `[DRY-RUN] Would execute: ${input.command}\nRisk level: ${validation.riskLevel}`,
      validation,
    };

    await logCommandAction(ctx, input, startTime, result, validation, undefined, true);
    return result;
  }

  // Execute the command
  try {
    const execOptions: ExecSyncOptions = {
      cwd: input.cwd || ctx.workspaceRoot,
      timeout: input.timeout || 60000, // 60s default
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: {
        ...process.env,
        ...input.env,
      },
    };

    const output = execSync(input.command, execOptions) as string;

    const result: ToolResult & { validation: CommandValidationResult } = {
      success: true,
      output: output.trim(),
      validation,
    };

    await logCommandAction(ctx, input, startTime, result, validation, 'accepted');
    return result;
  } catch (err: any) {
    const errorOutput = err.stderr?.toString() || err.stdout?.toString() || err.message;
    const exitCode = err.status || 1;

    const result: ToolResult & { validation: CommandValidationResult } = {
      success: false,
      output: errorOutput,
      error: `Command failed with exit code ${exitCode}`,
      validation,
    };

    await logCommandAction(ctx, input, startTime, result, validation, 'accepted', false, exitCode);
    return result;
  }
}

// ─── Helper: Log Command Action ────────────────────────────────

async function logCommandAction(
  ctx: ToolContext,
  input: RunCommandInput,
  startTime: number,
  result: ToolResult,
  validation: CommandValidationResult,
  userDecision?: UserDecision | 'blocked',
  isDryRun = false,
  exitCode?: number
): Promise<void> {
  if (!ctx.actionLogService) return;

  const durationMs = Date.now() - startTime;

  await ctx.actionLogService.log({
    pipelineId: ctx.pipelineId,
    phaseIndex: ctx.phaseIndex,
    taskId: ctx.taskId,
    agentRole: ctx.agentRole,
    toolName: 'run_command',
    input: {
      command: input.command,
      cwd: input.cwd,
      timeout: input.timeout,
    },
    output: result.output || result.error || '',
    result: userDecision === 'blocked' 
      ? 'blocked' 
      : (userDecision === 'rejected' 
        ? 'rejected' 
        : (result.success ? 'success' : 'error')),
    durationMs,
    dryRun: isDryRun || ctx.dryRun,
    commandDetails: {
      command: input.command,
      exitCode,
      validationResult: validation.riskLevel,
      userDecision: userDecision === 'blocked' ? undefined : userDecision,
    },
  });
}

// ─── Utility: Check if command is safe ─────────────────────────

export function isCommandSafe(command: string): boolean {
  const result = validateCommand(command);
  return result.riskLevel === 'safe' || result.riskLevel === 'moderate';
}

export function getCommandRiskLevel(command: string): CommandRiskLevel {
  return validateCommand(command).riskLevel;
}
