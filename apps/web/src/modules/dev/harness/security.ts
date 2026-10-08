import { invokeHarness } from './transport';
import type { HardeningStatus, ShellAnalysis, SecretEntry } from './types';

export const securityClient = {
  getHardeningStatus: async () => invokeHarness<HardeningStatus>('get_hardening_status'),
  hardeningStatus: async () => invokeHarness<HardeningStatus>('get_hardening_status'),
  applyProcessHardening: async () => invokeHarness<any>('apply_process_hardening'),
  analyzeShellCommand: async (command: string) => invokeHarness<ShellAnalysis>('analyze_shell_command', { command }),
  isShellCommandSafe: async (command: string) => invokeHarness<boolean>('is_shell_command_safe', { command }),
  isShellCommandDangerous: async (command: string) => invokeHarness<boolean>('is_shell_command_dangerous', { command }),
  listSecrets: async (scope?: string) => invokeHarness<SecretEntry[]>('list_secrets', { scope }),
  setSecret: async (key: string, value: string, scope?: string) => invokeHarness<any>('set_secret', { key, value, scope }),
  getSecret: async (key: string, scope?: string) => invokeHarness<string | null>('get_secret', { key, scope }),
  deleteSecret: async (key: string, scope?: string) => invokeHarness<any>('delete_secret', { key, scope }),
  redactSecretValue: async (value: string) => invokeHarness<string>('redact_secret_value', { value }),
};
