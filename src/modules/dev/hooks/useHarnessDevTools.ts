"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type DevToolExecutionResult } from '@/modules/dev/harness-client';

export function useExecuteDevTool() {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<DevToolExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (toolId: string, options?: { workspace?: string; cmd?: string }) => {
    setRunning(true);
    setError(null);
    try {
      const res = await harnessClient.executeDevTool(toolId, options ?? {});
      if (res.data) { setLastResult(res.data); return res.data; }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { run, running, lastResult, error };
}
