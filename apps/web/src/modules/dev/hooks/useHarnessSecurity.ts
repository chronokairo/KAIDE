"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type HardeningStatus, type ShellAnalysis } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHardeningStatus() {
  return useHarnessQuery(useCallback(() => harnessClient.getHardeningStatus(), []));
}

export function useApplyProcessHardening() {
  const [status, setStatus] = useState<HardeningStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.applyProcessHardening();
      setStatus(res.data);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  return { status, loading, error, apply };
}

export function useShellCommandSafety() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (command: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.analyzeShellCommand(command);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  const isSafe = useCallback(async (command: string) => {
    const res = await harnessClient.isShellCommandSafe(command);
    return res.data;
  }, []);

  const isDangerous = useCallback(async (command: string) => {
    const res = await harnessClient.isShellCommandDangerous(command);
    return res.data;
  }, []);

  return { analyze, isSafe, isDangerous, loading, error };
}
