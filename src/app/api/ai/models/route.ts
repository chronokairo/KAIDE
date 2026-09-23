import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createNvidiaCredentialService } from '@/features/ai-credentials/composition/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request.headers.get('authorization'));
    const credential = await createNvidiaCredentialService().service.resolve(user.id);
    if (!credential) return NextResponse.json({ error: 'Configure sua NVIDIA API key' }, { status: 409 });
    const response = await fetch(`${credential.baseUrl}/models`, { headers: { Authorization: `Bearer ${credential.apiKey}`, Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'NVIDIA rejeitou a credencial' }, { status: response.status });
    const payload = await response.json() as { data?: Array<{ id?: unknown }> };
    const models = (payload.data || []).flatMap((item) => typeof item.id === 'string' ? [item.id] : []).sort();
    return NextResponse.json({ models, selectedModel: credential.model });
  } catch (error) {
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Não autorizado' : 'Não foi possível listar modelos' }, { status });
  }
}
