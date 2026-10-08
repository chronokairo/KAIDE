"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import type { AttributionPolicy, GitUserInfo } from '@/modules/dev/harness/git-attribution';

export function useHarnessGitAttribution(workspace?: string) {
  const [policy, setPolicy] = useState<AttributionPolicy | null>(null);
  const [gitUser, setGitUser] = useState<GitUserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, u] = await Promise.all([
        harnessClient.getAttributionPolicy(workspace),
        harnessClient.getGitUserInfo(workspace),
      ]);
      setPolicy(p);
      setGitUser(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  const formatCommit = useCallback(async (message: string) => {
    try {
      return await harnessClient.formatCommitAttribution(message, workspace);
    } catch (e) {
      console.error("Failed to format commit attribution:", e);
      return message; // Fallback to original message
    }
  }, [workspace]);

  useEffect(() => {
    refreshInfo();
  }, [refreshInfo]);

  return { policy, gitUser, loading, error, refreshInfo, formatCommit };
}
