import { invokeHarness } from './transport';
import type { HookInfo, HookDispatchResult } from './types';

export const hooksClient = {
  getHooksSystem: async () => invokeHarness<any>('load_hooks'),
  getHookEventNames: async () => invokeHarness<string[]>('get_hook_event_names'),
  loadHooks: async (path?: string) => invokeHarness<HookInfo[]>('load_hooks', { path }),
  dispatchHook: async (event: string, toolName?: string, sessionId?: string) =>
    invokeHarness<HookDispatchResult>('dispatch_hook_event', { event, toolName, sessionId }),
  dispatchHookEvent: async (event: string, toolName?: string, sessionId?: string) =>
    invokeHarness<HookDispatchResult>('dispatch_hook_event', { event, toolName, sessionId }),
};
