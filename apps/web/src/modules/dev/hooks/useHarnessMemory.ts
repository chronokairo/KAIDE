"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient, type HarnessMemorySession, type MemorySearchResult } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessMemorySessions(workspace?: string, limit = 50) {
  return useHarnessQuery(useCallback(() => harnessClient.memorySessions(limit, workspace), [workspace, limit]));
}

export function useHarnessSessionMessages(sessionId: number | null) {
  return useHarnessQuery(
    useCallback(
      () =>
        sessionId !== null
          ? harnessClient.sessionMessages(sessionId)
          : Promise.resolve({ data: [], available: true }),
      [sessionId],
    ),
  );
}

export function useHarnessMemorySessionsBatch(workspaces: string[], limit = 50) {
  const [sessionsMap, setSessionsMap] = useState<Record<string, HarnessMemorySession[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaces.length === 0) return;
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setError(null);
      const map: Record<string, HarnessMemorySession[]> = {};
      const errors: string[] = [];
      await Promise.all(
        workspaces.map(async (ws) => {
          try {
            const result = await harnessClient.memorySessions(limit, ws);
            map[ws] = result.data ?? [];
          } catch (e) {
            map[ws] = [];
            errors.push(e instanceof Error ? e.message : String(e));
          }
        }),
      );
      if (!cancelled) {
        setSessionsMap(map);
        setLoading(false);
        if (errors.length > 0) setError(errors.join('; '));
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, [workspaces.join(','), limit]);

  return { sessionsMap, loading, error };
}

export function useMemoriesSearch() {
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, limit?: number) => {
    if (!query.trim()) { setResults([]); return []; }
    setLoading(true);
    setError(null);
    try {
      const res = await harnessClient.searchMemories(query, limit);
      setResults(res.data);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
