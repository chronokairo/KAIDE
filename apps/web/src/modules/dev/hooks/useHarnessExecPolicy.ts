"use client";

import { useCallback, useEffect, useState } from 'react';
import { harnessClient, type ExecPolicyData, type ExecPolicyRule } from '@/modules/dev/harness-client';

export function useExecPolicy() {
  const [policy, setPolicy] = useState<ExecPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true); setError(null);
    harnessClient.getExecPolicy()
      .then((res) => setPolicy(res.data))
      .catch((err) => { setPolicy(null); setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addRule = useCallback(async (command: string, decision: 'allow' | 'prompt' | 'forbidden', scope?: string) => {
    setError(null);
    try {
      const current = policy ?? { rules: [] };
      const newRule: ExecPolicyRule = { command, decision, scope };
      const newPolicy = { rules: [...current.rules.filter((r: ExecPolicyRule) => r.command !== command), newRule] };
      await harnessClient.setExecPolicy(newPolicy);
      setPolicy(newPolicy);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  }, [policy]);

  const removeRule = useCallback(async (command: string) => {
    if (!policy) return;
    setError(null);
    try {
      const newPolicy = { rules: policy.rules.filter((r: ExecPolicyRule) => r.command !== command) };
      await harnessClient.setExecPolicy(newPolicy);
      setPolicy(newPolicy);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  }, [policy]);

  const allowAlways = useCallback(async (command: string, scope?: string) => {
    setError(null);
    try { await harnessClient.allowCommandAlways(command, scope); refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  }, [refresh]);

  const checkPolicy = useCallback(async (cmd: string[], workspace?: string) => {
    const res = await harnessClient.checkCommandPolicy(cmd, workspace);
    return res.data;
  }, []);

  return { policy, loading, error, addRule, removeRule, allowAlways, checkPolicy, refresh };
}
