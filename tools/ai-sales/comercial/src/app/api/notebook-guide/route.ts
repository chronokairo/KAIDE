/**
 * POST /api/notebook-guide — gera um "Guia do Notebook" estilo NotebookLM
 *
 * Body: { baseUrl?: string; modelId?: string }
 *
 * Retorna: { summary: string; topics: string[]; questions: string[] }
 *
 * Fluxo:
 *  1. Carrega todas as fontes do DB (raw_content)
 *  2. Chama o LLM para gerar visão geral, tópicos e perguntas sugeridas
 *  3. Faz parse do JSON retornado
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSourceStore } from '@/lib/sources/factory';

const store = getSourceStore();

const FALLBACK_BASE_URL = 'http://localhost:1234/v1';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { baseUrl?: string; modelId?: string };
  const baseUrl = (body.baseUrl ?? FALLBACK_BASE_URL).replace(/\/$/, '');
  const modelId = body.modelId;

  if (!modelId) {
    return NextResponse.json(
      { error: 'modelId é obrigatório para gerar o guia.' },
      { status: 400 },
    );
  }

  /* ── Carrega fontes ──────────────────────────────────────────── */
  let sources: Array<{ name: string; rawContent: string | null }> = [];
  try {
    const all = await store.listSources();
    sources = all.filter((s) => s.rawContent).map((s) => ({
      name: s.name,
      rawContent: s.rawContent,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Erro ao carregar fontes: ${msg}` }, { status: 500 });
  }

  if (sources.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma fonte com conteúdo disponível.' },
      { status: 400 },
    );
  }

  /* ── Monta contexto truncado (máx 6000 chars por fonte) ─────── */
  const MAX_PER_SOURCE = 4000;
  const MAX_TOTAL = 20_000;

  let totalChars = 0;
  const sections: string[] = [];

  for (const src of sources) {
    if (!src.rawContent) continue;
    const truncated = src.rawContent.slice(0, MAX_PER_SOURCE);
    const section = `[Fonte: ${src.name}]\n${truncated}`;
    if (totalChars + section.length > MAX_TOTAL) break;
    sections.push(section);
    totalChars += section.length;
  }

  const sourceBlock = sections.join('\n\n---\n\n');

  /* ── Chama o LLM ─────────────────────────────────────────────── */
  const prompt = `Você é um assistente especializado em análise de documentos. Analise as fontes abaixo e gere:
1. Uma visão geral objetiva (2-3 frases resumindo os documentos)
2. Lista de 4-8 tópicos principais (palavras-chave curtas, substantivos)
3. Lista de 5-7 perguntas relevantes que o usuário poderia fazer sobre essas fontes

Responda APENAS com JSON válido, sem texto adicional, no formato exato:
{
  "summary": "texto de visão geral...",
  "topics": ["tópico 1", "tópico 2", "..."],
  "questions": ["Pergunta 1?", "Pergunta 2?", "..."]
}

FONTES:
${sourceBlock}`;

  // Attempts in order: requested model first, then Ollama fallbacks
  async function tryChat(model: string): Promise<{ choices?: Array<{ message?: { content?: string } }> }> {
    const chatRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!chatRes.ok) {
      const errText = await chatRes.text();
      throw new Error(`LLM HTTP ${chatRes.status}: ${errText}`);
    }
    return chatRes.json();
  }

  try {
    // Ordered candidate list: user-selected model + small instruction-following fallbacks
    const candidates = [modelId, 'gemma3:4b', 'nemotron-3-nano:4b'];
    const tried = new Set<string>();

    let chatData: { choices?: Array<{ message?: { content?: string } }> } | null = null;
    let lastErr = '';

    for (const candidate of candidates) {
      if (tried.has(candidate)) continue;
      tried.add(candidate);
      try {
        chatData = await tryChat(candidate);
        break; // success
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        // Only try fallbacks on OOM or connection errors
        const isOOM = lastErr.includes('more system memory') || lastErr.includes('out of memory');
        const isConn = lastErr.includes('ECONNREFUSED') || lastErr.includes('fetch failed');
        if (!isOOM && !isConn) throw e; // surface other errors immediately
      }
    }

    if (!chatData) {
      throw new Error(lastErr || 'Nenhum modelo disponível retornou resposta.');
    }

    const raw = chatData.choices?.[0]?.message?.content ?? '';

    /* ── Parse JSON (extrai mesmo que venha com markdown code block) */
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM não retornou JSON válido');
    }

    const guide = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      topics?: string[];
      questions?: string[];
    };

    return NextResponse.json({
      summary: guide.summary ?? '',
      topics: Array.isArray(guide.topics) ? guide.topics : [],
      questions: Array.isArray(guide.questions) ? guide.questions : [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
