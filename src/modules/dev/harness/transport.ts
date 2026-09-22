import type { HarnessResult } from './types';

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__);
}

export async function invokeHarness<T = unknown>(command: string, args?: Record<string, unknown>): Promise<HarnessResult<T>> {
  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const data = await invoke<T>(command, args);
      return { data, available: true };
    } catch {
      return { data: undefined as T, available: false };
    }
  }
  return { data: undefined as T, available: false };
}

export async function invokeRuntime<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<HarnessResult<T>> {
  return invokeHarness<T>('runtime_request', {
    method,
    params,
    workspace: typeof params.workspace === 'string' ? params.workspace : undefined,
  });
}

export function ok<T>(data: T): HarnessResult<T> {
  return { data, available: true };
}

export function unavailable<T = never>(): HarnessResult<T> {
  return { data: undefined as T, available: false };
}
