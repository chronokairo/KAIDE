"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import type { GitInfo, FsmonitorOverride } from '@/modules/dev/harness/git-info';

export function useHarnessGitInfo(workspace?: string) {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [fsmonitor, setFsmonitor] = useState<FsmonitorOverride | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [info, monitor, branch] = await Promise.all([
        harnessClient.collectGitInfo(workspace),
        harnessClient.detectFsmonitor(workspace),
        harnessClient.getDefaultBranch(workspace),
      ]);
      setGitInfo(info);
      setFsmonitor(monitor);
      setDefaultBranch(branch);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    refreshInfo();
  }, [refreshInfo]);

  return { gitInfo, fsmonitor, defaultBranch, loading, error, refreshInfo };
}
