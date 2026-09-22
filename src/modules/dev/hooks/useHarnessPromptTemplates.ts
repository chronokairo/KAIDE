"use client";

import { useCallback, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function usePromptTemplates() {
  return useHarnessQuery(useCallback(() => harnessClient.listPromptTemplates(), []));
}

export function usePromptTemplate(name: string | null) {
  return useHarnessQuery(useCallback(async () => {
    if (!name) return { data: null, available: true };
    return await harnessClient.getPromptTemplate(name);
  }, [name]));
}

export function useReviewContext() {
  const [loading, setLoading] = useState(false);

  const resolveContext = useCallback(async (hint: string) => {
    setLoading(true);
    try {
      const res = await harnessClient.resolveReviewContext(hint);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resolveContext, loading };
}

export function useGoalBudgetPrompt() {
  const [loading, setLoading] = useState(false);

  const getPrompt = useCallback(async (used: number, limit: number) => {
    setLoading(true);
    try {
      const res = await harnessClient.getGoalBudgetPrompt(used, limit);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getPrompt, loading };
}
