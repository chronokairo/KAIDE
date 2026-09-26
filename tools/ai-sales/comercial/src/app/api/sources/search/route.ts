/**
 * POST /api/sources/search — busca semântica nas fontes do usuário
 *
 * Body:
 *   { queries: string[], topK?: number }
 *
 * Retorna resultados ranqueados por similaridade semântica + RRF
 * (inspirado no Vane UploadStore)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSourceStore } from '@/lib/sources/factory';

const store = getSourceStore();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      queries: string[];
      topK?: number;
    };

    if (!body.queries?.length) {
      return NextResponse.json({ error: 'Missing queries' }, { status: 400 });
    }

    const results = await store.search(body.queries, { topK: body.topK ?? 5 });
    const context = store.formatForContext(results);

    return NextResponse.json({ results, context });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
