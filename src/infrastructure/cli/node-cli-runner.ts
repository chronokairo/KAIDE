import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  CliExecutionOptions,
  CliExecutionResult,
  CliRunnerPort,
} from '@/application/ports/cli-runner-port';

const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_BUFFER_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Node.js child process execution adapter.
 * Uses `execFile` with array-based arguments (shell: false) to prevent injection.
 */
export class NodeCliRunner implements CliRunnerPort {
  async exec(
    command: string,
    args: string[],
    options?: CliExecutionOptions
  ): Promise<CliExecutionResult> {
    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        timeout: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
        windowsHide: true,
        shell: false,
        cwd: options?.cwd,
        env: options?.env ? { ...process.env, ...options.env } : process.env,
      });

      return {
        ok: true,
        stdout: String(stdout),
        stderr: String(stderr),
        exitCode: 0,
      };
    } catch (error: any) {
      const stderr =
        error && typeof error === 'object' && 'stderr' in error
          ? String(error.stderr ?? '')
          : '';
      const stdout =
        error && typeof error === 'object' && 'stdout' in error
          ? String(error.stdout ?? '')
          : '';
      const exitCode = typeof error?.code === 'number' ? error.code : 1;

      return {
        ok: false,
        stdout,
        stderr,
        exitCode,
        error: stderr.trim() || (error instanceof Error ? error.message : String(error)),
      };
    }
  }
}

export const defaultCliRunner: CliRunnerPort = new NodeCliRunner();
