import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let cachedModels: string[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY;
    const baseUrl = (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
    if (!apiKey) return NextResponse.json({ error: 'NVIDIA_NIM_API_KEY não configurada no .env' }, { status: 503 });
    if (cachedModels && Date.now() - cachedAt < CACHE_TTL_MS) return NextResponse.json({ models: cachedModels, cached: true });
    const response = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'NVIDIA rejeitou a credencial' }, { status: response.status });
    const payload = await response.json() as { data?: Array<{ id?: unknown }> };
    const models = (payload.data || []).flatMap((item) => typeof item.id === 'string' ? [item.id] : []).sort();
    cachedModels = models;
    cachedAt = Date.now();
    return NextResponse.json({ models, cached: false });
  } catch (error) {
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Não autorizado' : 'Não foi possível listar modelos' }, { status });
  }
}
