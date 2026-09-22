"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type RelationshipGraph, type InvestigationParams } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useGraphData(targetName: string, targetDoc: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.graphData(targetName, targetDoc), [targetName, targetDoc]),
  );
}

export function useVerificationReport(targetName: string, targetDoc: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.runVerification(targetName, targetDoc), [targetName, targetDoc]),
  );
}

export function useExecuteInvestigation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: InvestigationParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await harnessClient.executeInvestigation(params);
      return result.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

export function useGenerateDossier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (targetName: string, targetDoc: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await harnessClient.generateDossierMarkdown(targetName, targetDoc);
      return result.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}

export function usePublicSources(category?: string) {
  return useHarnessQuery(
    useCallback(() => harnessClient.getPublicSourcesByCategory(category), [category]),
  );
}

export function usePublicSourcesHistory() {
  return useHarnessQuery(useCallback(() => harnessClient.getPublicSourcesHistory(), []));
}

export function useAddPublicSource() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (name: string, category: string, description: string, url: string, opts?: { lgpdBasis?: string; evidenceType?: string; agentName?: string }) => {
      setLoading(true);
      setError(null);
      try {
        return await harnessClient.addPublicSource(name, category, description, url, opts);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { add, loading, error };
}

export function useRemovePublicSource() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (sourceName: string, agentName?: string) => {
    setLoading(true);
    setError(null);
    try {
      return await harnessClient.removePublicSource(sourceName, agentName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

export function useCaptureWebSnapshot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async (url: string, sourceName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await harnessClient.captureWebSnapshot(url, sourceName);
      return result.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { capture, loading, error };
}

export function useCapturedSnapshots() {
  return useHarnessQuery(useCallback(() => harnessClient.getCapturedSnapshots(), []));
}
