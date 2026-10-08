"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type AssembledContext } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessContextFiles(workspace?: string) {
  return useHarnessQuery(useCallback(() => harnessClient.contextFiles(workspace), [workspace]));
}

export function useContextFragments(workspace?: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.getContextFragments(workspace), [workspace]),
  );
}

export function useAssembledContext(workspace?: string) {
  const [assembled, setAssembled] = useState<AssembledContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assemble = useCallback(async (config?: { include_files?: string[]; exclude_files?: string[]; total_max_bytes?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await harnessClient.assembleContextFragments(workspace, config);
      setAssembled(res.data);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  const preview = useCallback(async (maxBytes?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await harnessClient.previewContextForPrompt(workspace, maxBytes);
      return res.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  return { assembled, loading, error, assemble, preview };
}
