/**
 * Driven port for safe command line tool execution.
 *
 * All executions use array arguments without shell interpolation to prevent command injection.
 * Callers specify timeouts and working directories, and receive structured exit codes and buffers.
 */

export interface CliExecutionResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  error?: string;
}

export interface CliExecutionOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: Record<string, string>;
}

export interface CliRunnerPort {
  exec(
    command: string,
    args: string[],
    options?: CliExecutionOptions
  ): Promise<CliExecutionResult>;
}