"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type LocalRepoStatus } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useHarnessGitScan(dir?: string) {
  return useHarnessQuery(useCallback(() => harnessClient.gitScan(dir), [dir]));
}

export function useCloneRepo() {
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clone = useCallback(async (url: string, destDir: string, branch?: string) => {
    setCloning(true);
    setError(null);
    try {
      const res = await harnessClient.cloneRepo(url, destDir, branch);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setCloning(false);
    }
  }, []);

  return { clone, cloning, error };
}

export function useHarnessGitRepoStatus(repo: string | null) {
  return useHarnessQuery(
    useCallback(
      () =>
        repo
          ? harnessClient.gitRepoStatus(repo)
          : Promise.resolve({ data: { branch: '', upstream: '', ahead: 0, behind: 0, files: [], error: null } as LocalRepoStatus, available: true }),
      [repo],
    ),
  );
}
