"use client";

import { useCallback, useEffect, useState } from 'react';
import { type HarnessResult } from '@/modules/dev/harness-client';

export function useHarnessQuery<T>(loader: () => Promise<HarnessResult<T>>) {
  const [result, setResult] = useState<HarnessResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    loader()
      .then(setResult)
      .catch((err) => {
        setResult(null);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [loader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, loading, error, refresh };
}
