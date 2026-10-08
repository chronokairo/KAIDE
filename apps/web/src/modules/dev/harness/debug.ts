import { invokeHarness } from './transport';
import type { DebugContext, DiagnosticsSnapshot, LlmUsageStats } from './types';

export const debugClient = {
  extractResponseDebugContext: async (statusCode: number, headers: [string, string][], body?: string) =>
    invokeHarness<DebugContext>('extract_response_debug_context', { statusCode, headers, body }),
  getResponseDebugContext: async (statusCode?: number, headers?: [string, string][], body?: string) =>
    invokeHarness<DebugContext>('extract_response_debug_context', { statusCode, headers, body }),
  formatDebugContext: async (context: DebugContext) =>
    invokeHarness<string>('format_debug_context', { context }),
  getDiagnosticsSnapshot: async () =>
    invokeHarness<DiagnosticsSnapshot>('get_diagnostics_snapshot'),
  getDiagnostics: async () =>
    invokeHarness<DiagnosticsSnapshot>('get_diagnostics_snapshot'),
  getLlmUsageStats: async () =>
    invokeHarness<LlmUsageStats>('get_llm_usage_stats'),
  resetLlmUsageStats: async () =>
    invokeHarness<any>('reset_llm_usage_stats'),
};
