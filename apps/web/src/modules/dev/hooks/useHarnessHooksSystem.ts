"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient, type HookInfo } from '@/modules/dev/harness-client';

export function useHooksSystem() {
  const [hooks, setHooks] = useState<HookInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    harnessClient.getHookEventNames().then((res) => setEventNames(res.data));
  }, []);

  const loadFromFile = useCallback(async (path: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.loadHooks(path);
      setHooks(res.data);
    } catch (e) {
      setHooks([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, []);

  const dispatch = useCallback(async (event: string, toolName?: string, sessionId?: string) => {
    setError(null);
    try {
      const res = await harnessClient.dispatchHookEvent(event, toolName, sessionId);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
  }, []);

  return { hooks, eventNames, loading, error, loadFromFile, dispatch };
}
