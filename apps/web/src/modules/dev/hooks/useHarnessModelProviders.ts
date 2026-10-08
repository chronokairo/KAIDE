"use client";

import { useCallback, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useModelProviders(configPath?: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.listModelProviders(configPath), [configPath]),
  );
}

export function useModelProviderApiKey(providerId: string | null) {
  return useHarnessQuery(
    useCallback(() => providerId ? harnessClient.getModelProviderApiKey(providerId) : Promise.resolve({ data: null, available: false }), [providerId]),
  );
}

export function useValidateModelProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (name: string, baseUrl?: string, wireApi?: string) => {
    setLoading(true); setError(null);
    try { await harnessClient.validateModelProvider(name, baseUrl, wireApi); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setLoading(false); }
  }, []);

  return { validate, loading, error };
}

export function useSetModelProviderApiKey() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setKey = useCallback(async (providerId: string, apiKey: string, apiBase?: string) => {
    setLoading(true); setError(null);
    try { await harnessClient.setModelProviderApiKey(providerId, apiKey, apiBase); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setLoading(false); }
  }, []);

  return { setKey, loading, error };
}

export function useSetModelProviderBase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBase = useCallback(async (providerId: string, apiBase: string) => {
    setLoading(true); setError(null);
    try { await harnessClient.setModelProviderBase(providerId, apiBase); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setLoading(false); }
  }, []);

  return { setBase, loading, error };
}

export function useRemoveModelProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (providerId: string) => {
    setLoading(true); setError(null);
    try { await harnessClient.removeModelProvider(providerId); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setLoading(false); }
  }, []);

  return { remove, loading, error };
}

export function useProviderEnvStatus() {
  return useHarnessQuery(useCallback(() => harnessClient.getProviderEnvStatus(), []));
}

export function useTestNvidiaNim() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const test = useCallback(async (apiKey: string, model: string) => {
    setLoading(true); setError(null);
    try {
      const result = await harnessClient.testNvidiaNimConnection(apiKey, model);
      return result.data;
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); return null; }
    finally { setLoading(false); }
  }, []);

  return { test, loading, error };
}
