export interface ChatQueueProgress {
  ahead: number;
  total: number;
  processing: boolean;
}

export interface ChatRequestResult {
  ok: boolean;
  status: number;
  content: string;
}

const POLL_INTERVAL_MS = 750;

interface JobStatusPayload {
  status: 'queued' | 'processing' | 'done' | 'error';
  position: number;
  total: number;
  result: { status: number; body: string } | null;
  error: string | null;
}

export async function requestChat(
  payload: Record<string, unknown>,
  onQueue?: (progress: ChatQueueProgress) => void,
): Promise<ChatRequestResult> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status !== 202) {
    let content = '';
    try {
      const data = (await res.json()) as { content?: string };
      content = data.content ?? '';
    } catch {}
    return { ok: res.ok, status: res.status, content };
  }

  const { jobId } = (await res.json()) as { jobId: string };

  for (;;) {
    const jr = await fetch(`/api/chat/jobs/${jobId}`);
    if (!jr.ok) return { ok: false, status: jr.status, content: '' };

    const data = (await jr.json()) as JobStatusPayload;

    if (data.status === 'queued' || data.status === 'processing') {
      onQueue?.({
        ahead: data.position,
        total: data.total,
        processing: data.status === 'processing',
      });
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    if (data.status === 'done' && data.result) {
      let content = '';
      try {
        const parsed = JSON.parse(data.result.body) as { content?: string };
        content = parsed.content ?? '';
      } catch {}
      return { ok: data.result.status < 400, status: data.result.status, content };
    }

    return { ok: false, status: 500, content: '' };
  }
}
