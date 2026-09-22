"use client";

import { useCallback, useState } from 'react';
import { harnessClient, type AgentEvent, type ApprovalRequest, type ApprovalDecision, type ToolCallDeltaPayload } from '@/modules/dev/harness-client';
import { useHarnessQuery } from './useHarnessQuery';

export function useAcpProviders() {
  return useHarnessQuery(useCallback(() => harnessClient.acpProviders(), []));
}

export function useRunAcpAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (providerId: string, model: string, prompt: string, opts?: { dossierContext?: string; runId?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await harnessClient.runAcpAgent(providerId, model, prompt, opts);
        return result.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { run, loading, error };
}

export function useAskIntelligenceAgent() {
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const ask = useCallback(
    async (prompt: string, opts?: { targetName?: string; targetDoc?: string; model?: string }) => {
      setSending(true);
      setLastError(null);
      try {
        const result = await harnessClient.askIntelligenceAgent(prompt, opts);
        return result;
      } catch (err) {
        setLastError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        setSending(false);
      }
    },
    [],
  );

  return { ask, sending, lastError };
}

export function useCreateHarnessSession() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (opts: { workspace?: string; model?: string; title?: string; initialPrompt?: string }) => {
      setCreating(true);
      setError(null);
      try {
        const res = await harnessClient.createSession(opts);
        return res.data;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  return { create, creating, error };
}

export function useStreamAgentSession() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [textDeltas, setTextDeltas] = useState<string>('');
  const [toolCallDeltas, setToolCallDeltas] = useState<ToolCallDeltaPayload[]>([]);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const startStream = useCallback(
    async (
      prompt: string,
      onEvent: (event: AgentEvent) => void,
      opts: {
        workspace?: string;
        model?: string;
        session_id?: string;
        onTextDelta?: (text: string) => void;
        onToolCallDelta?: (delta: ToolCallDeltaPayload) => void;
        onApproval?: (request: ApprovalRequest) => void;
      } = {},
    ) => {
      setRunning(true);
      setEvents([]);
      setTextDeltas('');
      setToolCallDeltas([]);
      setApprovalRequest(null);
      setLastError(null);

      const id = opts.session_id ?? crypto.randomUUID();
      setSessionId(id);

      const handleEvent = (ev: AgentEvent) => {
        setEvents((prev) => [...prev, ev]);
        onEvent(ev);
      };

      const handleTextDelta = (text: string) => {
        setTextDeltas((prev) => prev + text);
        opts.onTextDelta?.(text);
      };

      const handleToolCallDelta = (delta: ToolCallDeltaPayload) => {
        setToolCallDeltas((prev) => {
          const existing = prev.find((d) => d.index === delta.index);
          if (existing) {
            return prev.map((d) =>
              d.index === delta.index
                ? { ...d, name: delta.name ?? d.name, args_delta: d.args_delta + delta.args_delta }
                : d,
            );
          }
          return [...prev, delta];
        });
        opts.onToolCallDelta?.(delta);
      };

      const handleApproval = (request: ApprovalRequest) => {
        setApprovalRequest(request);
        opts.onApproval?.(request);
      };

      try {
        const res = await harnessClient.streamAgentSession(prompt, handleEvent, {
          ...opts,
          session_id: id,
          onTextDelta: handleTextDelta,
          onToolCallDelta: handleToolCallDelta,
          onApproval: handleApproval,
        });
        return res.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLastError(msg);
        handleEvent({ type: 'Failed', payload: { message: msg } });
        return null;
      } finally {
        setRunning(false);
      }
    },
    [],
  );

  const interrupt = useCallback(() => {
    if (sessionId) return harnessClient.interruptAgent(sessionId);
  }, [sessionId]);

  const resolveApproval = useCallback(
    (decision: ApprovalDecision) => {
      if (approvalRequest && sessionId) {
        return harnessClient.resolveApproval(sessionId, approvalRequest.id, decision);
      }
    },
    [approvalRequest, sessionId],
  );

  return {
    startStream, interrupt, resolveApproval,
    running, events, textDeltas, toolCallDeltas,
    approvalRequest, sessionId, lastError,
  };
}
