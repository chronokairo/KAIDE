"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient, type DryRunResult, type PatchResult } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useFileWatchSnapshot(workspace?: string, since?: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.getFileWatchSnapshot(workspace, since), [workspace, since]),
  );
}

export function useApplyPatch() {
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [lastResult, setLastResult] = useState<PatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dryRun = useCallback(async (patch: string, workspace?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.applyPatchDryRun(patch, workspace);
      setDryRunResult(res.data);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  const apply = useCallback(async (patch: string, workspace?: string, withBackup = true) => {
    setLoading(true); setError(null);
    try {
      const res = withBackup
        ? await harnessClient.applyPatchWithBackup(patch, workspace)
        : await harnessClient.applyPatchCommit(patch, workspace);
      setLastResult(res.data);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  const revert = useCallback(async (patchId: number, workspace?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.revertPatch(patchId, workspace);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  return { dryRun, apply, revert, dryRunResult, lastResult, loading, error };
}

export function useHarnessFileEditor(path: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError(null);
    try {
      const result = await harnessClient.readFile(path);
      setContent(result.data);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => {
    if (path) load(); else setContent(null);
  }, [path, load]);

  const save = useCallback(async (newContent: string) => {
    if (!path) return;
    setSaving(true); setError(null);
    try {
      await harnessClient.writeFile(path, newContent);
      setContent(newContent);
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }, [path]);

  return { content, loading, saving, error, load, save, setContent };
}

export function useFileSearch() {
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, roots: string[], limit?: number) => {
    if (!query.trim()) { setResults(null); return null; }
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.searchFiles(query, roots, limit);
      setResults(res.data);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  return { results, loading, error, search };
}
