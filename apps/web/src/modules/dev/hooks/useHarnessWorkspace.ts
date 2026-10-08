"use client";

import { useCallback, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';

export function useHarnessWorkspace() {
  return { currentWorkspace: null };
}

export function useAddWorkspaceFolder() {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(async (folderPath: string) => {
    setAdding(true);
    setError(null);
    try {
      const res = await harnessClient.addWorkspaceFolder(folderPath);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setAdding(false);
    }
  }, []);

  return { add, adding, error };
}
