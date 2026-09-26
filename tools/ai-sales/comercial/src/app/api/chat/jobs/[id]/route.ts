import { NextResponse } from 'next/server';
import { getChatJob } from '@/lib/chat-queue';

type Params = Promise<{ id: string }>;

/** Status de um job da fila de atendimento da IA. */
export async function GET(_: Request, context: { params: Params }) {
  const { id } = await context.params;
  const job = getChatJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    position: job.position,
    total: job.total,
    result: job.result,
    error: job.error,
  });
}
