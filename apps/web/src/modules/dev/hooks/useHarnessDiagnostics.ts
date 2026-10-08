"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type DebugContext } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useResponseDebugContext() {
  const [loading, setLoading] = useState(false);

  const extract = useCallback(async (statusCode: number, headers: [string, string][], body?: string) => {
    setLoading(true);
    try {
      const res = await harnessClient.extractResponseDebugContext(statusCode, headers, body);
      return res.data;
    } catch { return null; }
    finally { setLoading(false); }
  }, []);

  const format = useCallback(async (ctx: DebugContext) => {
    const res = await harnessClient.formatDebugContext(ctx);
    return res.data;
  }, []);

  return { extract, format, loading };
}

export function useDiagnostics() {
  return useHarnessQuery(useCallback(() => harnessClient.getDiagnosticsSnapshot(), []));
}

export function useLlmUsageStats() {
  return useHarnessQuery(useCallback(() => harnessClient.getLlmUsageStats(), []));
}

export function useResetLlmUsageStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true); setError(null);
    try { await harnessClient.resetLlmUsageStats(); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  return { execute, loading, error };
}
