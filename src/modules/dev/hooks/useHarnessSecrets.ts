"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient, type SecretEntry } from '@/modules/dev/harness-client';

export function useSecretsManager() {
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (scope?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.listSecrets(scope);
      setSecrets(res.data);
    } catch (e) {
      setSecrets([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setSecret = useCallback(async (name: string, value: string, scope?: string) => {
    setError(null);
    try { await harnessClient.setSecret(name, value, scope); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, [refresh]);

  const getSecret = useCallback(async (name: string, scope?: string) => {
    const res = await harnessClient.getSecret(name, scope);
    return res.data;
  }, []);

  const deleteSecret = useCallback(async (name: string, scope?: string) => {
    setError(null);
    try { await harnessClient.deleteSecret(name, scope); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, [refresh]);

  return { secrets, loading, error, setSecret, getSecret, deleteSecret, refresh };
}

export function useRedactSecretValue() {
  const [redacted, setRedacted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redact = useCallback(async (value: string) => {
    setLoading(true); setError(null);
    try {
      const res = await harnessClient.redactSecretValue(value);
      setRedacted(res.data);
      return res.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  return { redacted, loading, error, redact };
}
