'use client';

/**
 * Tela canônica de task supervision (gap D06/D07 de docs/desktop-gap-analysis-2026.md).
 * O ponto central é a TASK, não uma coleção de painéis: timeline de eventos,
 * árvore de subagentes, approvals, checks de verificação, diff/patch e
 * worktrees/checkpoints duráveis — tudo numa única superfície.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  useStreamAgentSession,
  useIsTauri,
  type AgentEvent,
  type ApprovalRequest,
} from '@/modules/dev/hooks/useHarness';
import { agentClient } from '@/modules/dev/harness/agent';
import { PatchPreviewPanel } from '@/modules/ai/components/PatchPreviewPanel';

type TaskStatus = 'idle' | 'running' | 'attention' | 'failed' | 'complete';

interface TimelineEntry {
  id: string;
  kind: string;
  label: string;
  detail?: string;
  tone: 'neutral' | 'good' | 'bad' | 'warn';
  at: string;
}

interface WorktreeRow {
  id: string;
  path: string;
  branch: string;
  head: string;
}

interface CheckpointRow {
  id: string;
  task_id: string;
  branch: string;
  commit: string;
  message: string;
  created_at: string;
  turn_id?: number;
}

const STATUS_STYLE: Record<TaskStatus, { label: string; className: string }> = {
  idle: { label: 'aguardando', className: 'bg-zinc-100 text-zinc-600' },
  running: { label: 'executando', className: 'bg-blue-100 text-blue-700 animate-pulse' },
  attention: { label: 'atenção', className: 'bg-amber-100 text-amber-700' },
  failed: { label: 'falhou', className: 'bg-red-100 text-red-700' },
  complete: { label: 'concluída', className: 'bg-emerald-100 text-emerald-700' },
};

function deriveStatus(
  running: boolean,
  approvalRequest: ApprovalRequest | null,
  events: AgentEvent[],
): TaskStatus {
  if (events.some((e) => e.type === 'Failed')) return 'failed';
  if (events.some((e) => e.type === 'Done' || e.type === 'TurnComplete')) return 'complete';
  if (approvalRequest) return 'attention';
  if (running) return 'running';
  if (events.length > 0) return 'complete';
  return 'idle';
}

function eventToEntry(event: AgentEvent, seq: number): TimelineEntry | null {
  const at = new Date().toISOString().slice(11, 19);
  const tone: TimelineEntry['tone'] =
    event.type === 'Done' || event.type === 'Verification'
      ? 'good'
      : event.type === 'Failed' || event.type === 'Error'
        ? 'bad'
        : event.type === 'ExecApprovalRequest' || event.type === 'PlanApprovalRequest'
          ? 'warn'
          : 'neutral';
  const label =
    event.type === 'TurnContext'
      ? 'Turno iniciado'
      : event.type === 'TurnStarted'
        ? 'Sessão de turno'
        : event.type === 'TextDelta'
          ? 'Texto'
          : event.type === 'ToolCall'
            ? `Tool: ${event.payload?.name ?? 'desconhecida'}`
            : event.type === 'ToolCallDelta'
              ? 'Tool args (stream)'
              : event.type === 'ToolResult'
                ? `Resultado: ${event.payload?.name ?? ''}`
                : event.type === 'FileChanged'
                  ? `Arquivo alterado: ${event.payload?.path ?? ''}`
                  : event.type === 'Verification'
                    ? 'Verificação'
                    : event.type === 'PlanStep'
                      ? `Plano ${event.payload?.index + 1}/${event.payload?.total}`
                      : event.type === 'ExecApprovalRequest'
                        ? 'Aprovação necessária'
                        : event.type === 'TokenUsage'
                          ? 'Tokens'
                          : event.type === 'Done'
                            ? 'Concluído'
                            : event.type === 'Failed'
                              ? 'Falhou'
                              : event.type === 'Interrupted'
                                ? 'Interrompido'
                                : event.type;
  const detail: string | undefined =
    event.type === 'ToolResult'
      ? [
          event.payload?.output?.slice(0, 200),
          event.payload?.duration_ms != null ? `${event.payload.duration_ms}ms` : undefined,
          event.payload?.exit_code != null ? `exit ${event.payload.exit_code}` : undefined,
        ]
          .filter(Boolean)
          .join(' — ')
      : event.type === 'Verification'
        ? `${event.payload?.status ?? ''} ${event.payload?.summary ?? ''}`.trim() || undefined
        : event.type === 'TokenUsage'
          ? `prompt ${event.payload?.prompt_tokens ?? 0} · completion ${event.payload?.completion_tokens ?? 0}`
          : event.type === 'Done' || event.type === 'Failed'
            ? String(event.payload?.message ?? '').slice(0, 200) || undefined
            : event.type === 'TextDelta'
              ? undefined
              : undefined;
  if (event.type === 'TextDelta') return null; // deltas ficam no texto agregado
  return { id: `${seq}-${event.type}`, kind: event.type, label, detail, tone, at };
}

const TONE_STYLE: Record<TimelineEntry['tone'], string> = {
  neutral: 'text-zinc-600 border-zinc-200',
  good: 'text-emerald-700 border-emerald-200',
  bad: 'text-red-700 border-red-200',
  warn: 'text-amber-700 border-amber-200',
};

export const TaskSupervisionScreen: React.FC = () => {
  const isTauri = useIsTauri();
  const {
    startStream,
    interrupt,
    resolveApproval,
    running,
    events,
    textDeltas,
    approvalRequest,
    sessionId,
    lastError,
  } = useStreamAgentSession();

  const [prompt, setPrompt] = useState('');
  const [worktrees, setWorktrees] = useState<WorktreeRow[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointRow[]>([]);
  const [supervisionBusy, setSupervisionBusy] = useState(false);
  const [taskId, setTaskId] = useState('task-1');

  const status = useMemo(
    () => deriveStatus(running, approvalRequest, events),
    [running, approvalRequest, events],
  );

  const timeline = useMemo(
    () =>
      events
        .map((event, index) => eventToEntry(event, index))
        .filter((entry): entry is TimelineEntry => entry !== null),
    [events],
  );

  // Árvore de subagentes: tool results do fan-out "task" ([task i/N]: ...).
  const subagents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.type === 'ToolResult' &&
            (event.payload?.name === 'task' ||
              String(event.payload?.output ?? '').startsWith('[task ')),
        )
        .map((event, index) => ({
          id: `sub-${index}`,
          output: String(event.payload?.output ?? ''),
          ok: !String(event.payload?.output ?? '').includes('failed'),
        })),
    [events],
  );

  const filesChanged = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .filter((event) => event.type === 'FileChanged')
            .map((event) => String(event.payload?.path ?? '')),
        ),
      ),
    [events],
  );

  const checks = useMemo(
    () => events.filter((event) => event.type === 'Verification'),
    [events],
  );

  const tokenTotals = useMemo(() => {
    let prompt = 0;
    let completion = 0;
    let reasoning = 0;
    for (const event of events) {
      if (event.type === 'TokenUsage') {
        prompt += Number(event.payload?.prompt_tokens ?? 0);
        completion += Number(event.payload?.completion_tokens ?? 0);
        reasoning += Number(event.payload?.reasoning_tokens ?? 0);
      }
    }
    return { prompt, completion, reasoning };
  }, [events]);

  const refreshSupervision = useCallback(async () => {
    setSupervisionBusy(true);
    try {
      const [worktreeRes, checkpointRes] = await Promise.all([
        agentClient.listTaskWorktrees(),
        agentClient.listCheckpoints(taskId),
      ]);
      setWorktrees((worktreeRes.data?.worktrees ?? []) as WorktreeRow[]);
      setCheckpoints((checkpointRes.data?.checkpoints ?? []) as CheckpointRow[]);
    } finally {
      setSupervisionBusy(false);
    }
  }, [taskId]);

  const handleCreateWorktree = useCallback(async () => {
    setSupervisionBusy(true);
    try {
      await agentClient.createTaskWorktree(taskId);
      await refreshSupervision();
    } finally {
      setSupervisionBusy(false);
    }
  }, [taskId, refreshSupervision]);

  const handleCheckpoint = useCallback(async () => {
    setSupervisionBusy(true);
    try {
      await agentClient.createCheckpoint(taskId, {
        message: 'checkpoint manual da tela de supervisão',
        sessionId: sessionId ? undefined : undefined,
        eventSeq: events.length,
      });
      await refreshSupervision();
    } finally {
      setSupervisionBusy(false);
    }
  }, [taskId, sessionId, events.length, refreshSupervision]);

  const handleRestore = useCallback(
    async (checkpointId: string) => {
      setSupervisionBusy(true);
      try {
        await agentClient.restoreCheckpoint(checkpointId);
      } finally {
        setSupervisionBusy(false);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = prompt.trim();
      if (!trimmed) return;
      void startStream(trimmed, () => {}, {});
      setPrompt('');
    },
    [prompt, startStream],
  );

  const statusStyle = STATUS_STYLE[status];

  return (
    <div className="flex h-full flex-col gap-4 p-6 max-w-6xl mx-auto w-full">
      {/* Header da task */}
      <header className="flex items-center gap-3 border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Task Supervision</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle.className}`}>
          {statusStyle.label}
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          {sessionId ? `session ${sessionId.slice(0, 8)}` : 'sem sessão'}
        </span>
        {!isTauri && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
            WEB (IPC indisponível)
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-32 rounded-md border border-zinc-200 px-2 py-1 font-mono text-xs"
            aria-label="task id"
          />
          <button
            type="button"
            onClick={handleCreateWorktree}
            disabled={supervisionBusy}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
          >
            + worktree
          </button>
          <button
            type="button"
            onClick={handleCheckpoint}
            disabled={supervisionBusy}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
          >
            checkpoint
          </button>
          <button
            type="button"
            onClick={refreshSupervision}
            disabled={supervisionBusy}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700"
          >
            atualizar
          </button>
          {running && (
            <button
              type="button"
              onClick={() => void interrupt()}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white"
            >
              interromper
            </button>
          )}
        </div>
      </header>

      {/* Prompt + última saída */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="descreva a task para o agente..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          aria-label="prompt da task"
        />
        <button
          type="submit"
          disabled={running}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          executar
        </button>
      </form>
      {textDeltas && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 text-sm whitespace-pre-wrap">
          {textDeltas}
        </div>
      )}
      {lastError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {lastError}
        </div>
      )}

      {/* Approval — a task para até o humano decidir */}
      {approvalRequest && (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 p-3"
          data-testid="task-approval"
        >
          <div className="text-sm font-semibold text-amber-800">
            Aprovação necessária: {approvalRequest.tool}
          </div>
          <div className="font-mono text-xs text-amber-700">
            {approvalRequest.summary ?? approvalRequest.command ?? ''}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void resolveApproval('allow_once')}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
            >
              permitir
            </button>
            <button
              type="button"
              onClick={() => void resolveApproval('deny')}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white"
            >
              negar
            </button>
            <button
              type="button"
              onClick={() => void resolveApproval('allow_session')}
              className="rounded-md border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700"
            >
              permitir na sessão
            </button>
          </div>
        </div>
      )}

      {/* Corpo: timeline | sidebar de contexto */}
      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
        {/* Timeline */}
        <section className="col-span-2 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Timeline
          </div>
          <ol className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
            {timeline.length === 0 && (
              <li className="p-4 text-sm text-zinc-400">Nenhum evento ainda.</li>
            )}
            {timeline.map((entry) => (
              <li key={entry.id} className="flex gap-3 px-3 py-2">
                <span className="font-mono text-[10px] text-zinc-400">{entry.at}</span>
                <span className={`flex-1 border-l-2 pl-2 text-sm ${TONE_STYLE[entry.tone]}`}>
                  <span className="font-semibold">{entry.label}</span>
                  {entry.detail && (
                    <span className="block truncate font-mono text-[11px] opacity-70">
                      {entry.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Sidebar: subagentes, arquivos, checks, diff */}
        <div className="col-span-1 flex flex-col gap-4 overflow-y-auto">
          <section className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Subagentes
            </div>
            {subagents.length === 0 && (
              <p className="text-xs text-zinc-400">Nenhum fan-out de subagente.</p>
            )}
            <ul className="space-y-1">
              {subagents.map((sub) => (
                <li key={sub.id} className="font-mono text-[11px]">
                  <span className={sub.ok ? 'text-emerald-600' : 'text-red-600'}>
                    {sub.ok ? '●' : '▲'}
                  </span>{' '}
                  {sub.output.slice(0, 64)}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Checks ({checks.length})
            </div>
            {checks.length === 0 && (
              <p className="text-xs text-zinc-400">Nenhuma verificação rodou.</p>
            )}
            <ul className="space-y-1">
              {checks.map((check, index) => (
                <li key={index} className="font-mono text-[11px] text-zinc-700">
                  {String(check.payload?.status ?? '')} ·{' '}
                  {String(check.payload?.summary ?? '').slice(0, 48)}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Arquivos alterados ({filesChanged.length})
            </div>
            {filesChanged.length === 0 && (
              <p className="text-xs text-zinc-400">Nenhum arquivo tocado.</p>
            )}
            <ul className="space-y-0.5">
              {filesChanged.map((path) => (
                <li key={path} className="truncate font-mono text-[11px] text-zinc-700">
                  {path}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Tokens
              </div>
              <span className="font-mono text-[10px] text-zinc-400">
                {tokenTotals.prompt + tokenTotals.completion} total
              </span>
            </div>
            <div className="font-mono text-[11px] text-zinc-600">
              prompt {tokenTotals.prompt} · completion {tokenTotals.completion}
              {tokenTotals.reasoning > 0 && ` · reasoning ${tokenTotals.reasoning}`}
            </div>
          </section>
        </div>
      </div>

      {/* Rodapé: worktrees, checkpoints e diff/patch */}
      <div className="grid grid-cols-3 gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Worktrees ({worktrees.length})
          </div>
          {worktrees.length === 0 && (
            <p className="text-xs text-zinc-400">Nenhum worktree para tasks.</p>
          )}
          <ul className="space-y-1">
            {worktrees.map((worktree) => (
              <li key={worktree.id} className="font-mono text-[11px] text-zinc-700">
                {worktree.branch}
                <span className="ml-1 text-zinc-400">({worktree.head.slice(0, 7)})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Checkpoints ({checkpoints.length})
          </div>
          {checkpoints.length === 0 && (
            <p className="text-xs text-zinc-400">Nenhum checkpoint da task.</p>
          )}
          <ul className="space-y-1">
            {checkpoints.map((checkpoint) => (
              <li key={checkpoint.id} className="flex items-center gap-1">
                <span className="truncate font-mono text-[11px] text-zinc-700">
                  {checkpoint.id} · {checkpoint.message.slice(0, 24)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRestore(checkpoint.id)}
                  className="ml-auto rounded border border-zinc-300 px-1.5 text-[10px] text-zinc-600"
                >
                  restaurar
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Diff & Patch
          </div>
          <div className="max-h-32 overflow-y-auto">
            <PatchPreviewPanel />
          </div>
        </section>
      </div>
    </div>
  );
};
