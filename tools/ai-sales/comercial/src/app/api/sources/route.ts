/**
 * Sources API — CRUD de fontes + busca semântica
 *
 * GET    /api/sources          — lista todas as fontes
 * POST   /api/sources          — adiciona uma fonte (com raw_content)
 * DELETE /api/sources?id=xxx   — remove uma fonte
 * POST   /api/sources/search   — busca semântica nas fontes
 * POST   /api/sources/index    — (re)indexa uma fonte (chunking + embeddings)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSourceStore } from '@/lib/sources/factory';
import { extractPDF, extractText, extractURL, detectFileType } from '@/lib/sources/extractor';
import { searchWeb } from '@/lib/sources/web-search';

const store = getSourceStore();

/* ─── GET — listar fontes ─────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cidParam = searchParams.get('conversationId'); // null | 'session' | '<uuid>'
    const sources = await (store as { listSources(cid?: string): Promise<unknown[]> }).listSources(
      cidParam ?? undefined
    );
    return NextResponse.json(sources);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── POST — adicionar fonte ──────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      return await handleFileUpload(req);
    }

    const body = (await req.json()) as {
      id?: string;
      type: 'file' | 'web' | 'text' | 'drive';
      name: string;
      description?: string;
      url?: string;
      text?: string;
      searchWeb?: boolean;
      query?: string;
      conversationId?: string | null;
    };

    // Ação: busca web real (inspirado no Vane web_search + searxng)
    if (body.searchWeb) {
      return await handleSearchWeb(body.query ?? body.name);
    }

    let { id, type, name, description, url, text } = body;
    const conversationId = body.conversationId ?? null;
    const fallbackContent = (body as Record<string, unknown>).fallbackContent as string | undefined;
    id = id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

    let rawContent: string | null = null;

    if (type === 'web' && url) {
      try {
        const extracted = await extractURL(url);
        // Accept extracted content only if it's meaningful (not just a redirect page title)
        const isUseless = !extracted.text || extracted.text.length < 100
          || extracted.title === 'Google Notícias' || extracted.title === 'Google News';
        if (isUseless && fallbackContent) {
          rawContent = fallbackContent;
        } else {
          rawContent = extracted.text;
          name = name || extracted.title || url;
        }
        description = description || url;
      } catch (e) {
        // Use fallback content if extraction fails (e.g. Google News redirects)
        rawContent = fallbackContent ?? `[Falha ao extrair conteúdo de ${url}: ${e instanceof Error ? e.message : String(e)}]`;
        name = name || url;
        description = description || url;
      }
    }

    if (type === 'text' && text) {
      const extracted = extractText(text, 'text');
      rawContent = extracted.text;
      name = name || extracted.title;
    }

    description = description ?? `${type === 'web' ? 'Link' : type === 'text' ? 'Texto' : type === 'file' ? 'Arquivo' : 'Drive'}`;

    await store.addSource({
      id,
      type,
      name,
      description,
      rawContent,
      conversationId,
    });

    // Indexa se tiver conteúdo
    if (rawContent) {
      store.indexSource(id).catch(() => {});
    }

    return NextResponse.json({ id, indexed: !!rawContent });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── Web search handler (inspirado no Vane: searxng.ts) ─────── */

async function handleSearchWeb(query: string): Promise<NextResponse> {
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const results = await searchWeb(query.trim());

  if (results.length === 0) {
    return NextResponse.json({ results: [], added: 0, message: 'Nenhum resultado encontrado' });
  }

  // Adiciona cada resultado como fonte
  let added = 0;
  for (const result of results) {
    try {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const extracted = await extractURL(result.url).catch(() => null);
      await store.addSource({
        id,
        type: 'web',
        name: result.title,
        description: result.url,
        rawContent: extracted?.text ?? result.content,
      });
      store.indexSource(id).catch(() => {});
      added++;
    } catch {
      // pula resultados que falharem
    }
  }

  return NextResponse.json({
    results: results.map((r) => ({ title: r.title, url: r.url })),
    added,
  });
}

/* ─── File upload handler ─────────────────────────────────────── */

async function handleFileUpload(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const cidRaw = formData.get('conversationId') as string | null;
  const conversationId = cidRaw === null || cidRaw === 'session' ? null : cidRaw;

  const fileType = detectFileType(file.name, file.type);
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

  let rawContent: string | null;
  const buffer = await file.arrayBuffer();

  switch (fileType) {
    case 'pdf':
      rawContent = (await extractPDF(buffer)).text;
      break;
    case 'csv':
    case 'text':
      rawContent = new TextDecoder().decode(buffer);
      break;
    default:
      // Midia/binario sem extrator: registra sem conteudo indexavel
      rawContent = file.type.startsWith('text/')
        ? new TextDecoder().decode(buffer)
        : null;
  }

  await store.addSource({
    id,
    type: 'file',
    name: file.name,
    description: `${(file.size / 1024).toFixed(0)} KB`,
    rawContent,
    conversationId,
  });

  // Indexa em background
  if (rawContent) {
    store.indexSource(id).catch(() => {});
  }

  return NextResponse.json({ id, indexed: !!rawContent });
}

/* ─── DELETE — remover fonte ──────────────────────────────────── */

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('all') === 'true') {
      // Clears session sources only (no conversationId)
      await (store as { clearAll(cid?: string | null): Promise<void> }).clearAll(undefined);
      return NextResponse.json({ removed: 'session' });
    }
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await store.removeSource(id);
    return NextResponse.json({ removed: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── PATCH — indexar/reindexar ou adotar fontes de sessão ───── */

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { action: string; sourceId?: string; conversationId?: string };
    if (body.action === 'index' && body.sourceId) {
      const result = await store.indexSource(body.sourceId);
      return NextResponse.json(result);
    }
    if (body.action === 'adopt' && body.conversationId) {
      await (store as { adoptSources(cid: string): Promise<void> }).adoptSources(body.conversationId);
      return NextResponse.json({ adopted: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
