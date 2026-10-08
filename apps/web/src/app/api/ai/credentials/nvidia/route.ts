import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, createNvidiaCredentialService } from '@/features/ai-credentials/composition/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const saveSchema = z.object({ apiKey: z.string().min(20).max(512).regex(/^\S+$/), model: z.string().min(1).max(200).optional() });

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (message.includes('NOT_CONFIGURED')) return NextResponse.json({ error: 'Cofre local não configurado' }, { status: 503 });
  return NextResponse.json({ error: 'Não foi possível processar a credencial' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request.headers.get('authorization'));
    return NextResponse.json(await createNvidiaCredentialService().service.getStatus(user.id));
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request.headers.get('authorization'));
    const input = saveSchema.parse(await request.json());
    await createNvidiaCredentialService().service.save(user.id, input.apiKey, input.model);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'API key inválida' }, { status: 400 });
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request.headers.get('authorization'));
    await createNvidiaCredentialService().service.delete(user.id);
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
