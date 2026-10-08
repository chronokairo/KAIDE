import { invokeRuntime } from './transport';
import type { ExecPolicyData, ExecPolicyEvaluation } from './types';

export const execPolicyClient = {
  getExecPolicy: async () => invokeRuntime<ExecPolicyData>('get_exec_policy'),
  setExecPolicy: async (policy: ExecPolicyData) => invokeRuntime<any>('set_exec_policy', { policy }),
  checkCommandPolicy: async (command: string[], workspace?: string) =>
    invokeRuntime<ExecPolicyEvaluation>('check_command_policy', { command, workspace }),
  allowCommandAlways: async (command: string, scope?: string) =>
    invokeRuntime<any>('allow_command_always', { command, scope }),
  removeExecPolicyRule: async (command: string) =>
    invokeRuntime<any>('remove_exec_policy_rule', { command }),
};
