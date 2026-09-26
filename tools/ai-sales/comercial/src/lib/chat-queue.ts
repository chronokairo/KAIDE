import { randomUUID } from 'crypto';

/**
 * Fila de atendimento da IA — todas as solicitações ao LLM entram como jobs
 * e são processadas em segundo plano, de forma linear (um por vez).
 * Singleton em globalThis para sobreviver ao hot-reload do Next.js em dev.
 */

export interface ChatJobResult {
  status: number;
  body: string;
}

interface ChatJob {
  id: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  run: () => Promise<ChatJobResult>;
  result?: ChatJobResult;
  error?: string;
  createdAt: number;
  finishedAt?: number;
}

interface QueueState {
  jobs: Map<string, ChatJob>;
  pending: string[];
  processingId: string | null;
  running: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __annaChatQueue: QueueState | undefined;
}

const state: QueueState = globalThis.__annaChatQueue ?? {
  jobs: new Map(),
  pending: [],
  processingId: null,
  running: false,
};
globalThis.__annaChatQueue = state;

/** Jobs finalizados são mantidos por 10 min para o cliente buscar o resultado. */
const FINISHED_TTL_MS = 10 * 60 * 1000;

function purgeFinished() {
  const now = Date.now();
  for (const [id, job] of state.jobs) {
    if (
      (job.status === 'done' || job.status === 'error') &&
      job.finishedAt &&
      now - job.finishedAt > FINISHED_TTL_MS
    ) {
      state.jobs.delete(id);
    }
  }
}

/** Total de jobs ativos (em processamento + aguardando). */
function activeCount(): number {
  return state.pending.length + (state.processingId ? 1 : 0);
}

export interface ChatJobStatus {
  id: string;
  status: ChatJob['status'];
  /** Quantos jobs estão à frente deste (0 quando processando/finalizado). */
  position: number;
  /** Total de jobs ativos na fila. */
  total: number;
  result: ChatJobResult | null;
  error: string | null;
}

export function enqueueChatJob(run: () => Promise<ChatJobResult>): {
  id: string;
  position: number;
  total: number;
} {
  purgeFinished();

  const id = randomUUID();
  state.jobs.set(id, { id, status: 'queued', run, createdAt: Date.now() });
  state.pending.push(id);

  void processLoop();

  return {
    id,
    position: state.pending.indexOf(id) + (state.processingId ? 1 : 0),
    total: activeCount(),
  };
}

export function getChatJob(id: string): ChatJobStatus | null {
  purgeFinished();

  const job = state.jobs.get(id);
  if (!job) return null;

  const position =
    job.status === 'queued'
      ? state.pending.indexOf(id) + (state.processingId ? 1 : 0)
      : 0;

  return {
    id: job.id,
    status: job.status,
    position: Math.max(position, 0),
    total: activeCount(),
    result: job.result ?? null,
    error: job.error ?? null,
  };
}

/** Worker único: consome a fila em ordem, um job por vez. */
async function processLoop() {
  if (state.running) return;
  state.running = true;

  try {
    while (state.pending.length > 0) {
      const id = state.pending.shift()!;
      const job = state.jobs.get(id);
      if (!job) continue;

      state.processingId = id;
      job.status = 'processing';

      try {
        job.result = await job.run();
        job.status = 'done';
      } catch (e) {
        job.status = 'error';
        job.error = e instanceof Error ? e.message : String(e);
      } finally {
        job.finishedAt = Date.now();
        state.processingId = null;
      }
    }
  } finally {
    state.running = false;
    state.processingId = null;
  }
}
