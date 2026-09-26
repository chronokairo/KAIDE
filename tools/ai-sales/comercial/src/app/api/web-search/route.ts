/**
 * Web Search API — implementação nativa
 *
 * POST /api/web-search  { query: string; mode?: 'web' | 'quick' }
 *
 * Usa SearXNG (se SEARXNG_URL configurado) ou DuckDuckGo Lite como fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/sources/web-search';

/* ─── POST handler ────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { query?: string; mode?: 'web' | 'quick' };
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const results = await searchWeb(query);

    if (results.length === 0) {
      return NextResponse.json({
        engine: 'unavailable',
        answer: null,
        sources: [],
        setupHint: true,
      });
    }

    return NextResponse.json({
      engine: 'native',
      answer: null,
      sources: results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
