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
import { buildSourceContextText } from '@/lib/sources/content';

const store = getSourceStore();

const FALLBACK_BASE_URL = 'http://localhost:1234/v1';

interface NotebookSource {
  name: string;
  description: string | null;
  rawContent: string | null;
}

interface NotebookGuide {
  summary: string;
  topics: string[];
  questions: string[];
}

const STOP_WORDS = new Set([
  'para', 'com', 'uma', 'das', 'dos', 'que', 'por', 'sobre', 'como', 'mais', 'esta', 'este',
  'esse', 'essa', 'seus', 'suas', 'pela', 'pelo', 'entre', 'tambem', 'quando', 'onde', 'qual',
  'quais', 'fonte', 'origem', 'titulo', 'https', 'http', 'www', 'noticia', 'noticias', 'jornal',
]);

function buildFallbackGuide(sources: NotebookSource[]): NotebookGuide {
  const sourceTexts = sources.map((source) => buildSourceContextText(source)).filter(Boolean);
  const names = sources.map((source) => source.name).filter(Boolean);
  const joined = sourceTexts.join('\n\n');
  const firstSource = names[0] ?? 'as fontes adicionadas';
  const sourceCount = sources.length;

  const words = joined
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g) ?? [];

  const counts = new Map<string, number>();
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const topics = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  const summary = sourceCount === 1
    ? `A fonte adicionada trata de ${firstSource}. O conteúdo disponível indica os principais dados identificáveis da notícia/documento e deve ser usado como base para perguntas específicas.`
    : `As ${sourceCount} fontes adicionadas cobrem temas como ${names.slice(0, 3).join('; ')}. O guia foi montado a partir do conteúdo disponível nas fontes, priorizando títulos, origem e trechos extraídos.`;

  const mainTopic = topics[0] ?? 'conteúdo das fontes';
  const questions = [
    `Qual é o ponto principal de ${firstSource}?`,
    `Quais informações as fontes trazem sobre ${mainTopic}?`,
    'Quais fatos aparecem diretamente nas fontes adicionadas?',
    'Que limitações existem no conteúdo recuperado dessas fontes?',
    'Como as fontes se relacionam entre si?',
  ];

  return { summary, topics, questions };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { baseUrl?: string; modelId?: string; sourceIds?: string[]; conversationId?: string | null };
  const baseUrl = (body.baseUrl ?? FALLBACK_BASE_URL).replace(/\/$/, '');
  const modelId = body.modelId;

  if (!modelId) {
    return NextResponse.json(
      { error: 'modelId é obrigatório para gerar o guia.' },
      { status: 400 },
    );
  }

  /* -- Carrega fontes -------------------------------------------- */
  let sources: NotebookSource[] = [];
  try {
    const cid = body.conversationId === undefined ? undefined : body.conversationId ?? 'session';
    const selectedIds = body.sourceIds?.length ? new Set(body.sourceIds) : null;
    const all = await store.listSources(cid);
    sources = all.filter((s) => s.rawContent).map((s) => ({
      name: s.name,
      description: s.description,
      rawContent: s.rawContent,
      id: s.id,
    })).filter((s) => !selectedIds || selectedIds.has(s.id));
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

  /* -- Monta contexto truncado (máx 6000 chars por fonte) ------- */
  const MAX_PER_SOURCE = 4000;
  const MAX_TOTAL = 20_000;

  let totalChars = 0;
  const sections: string[] = [];

  for (const src of sources) {
    if (!src.rawContent) continue;
    const sourceText = buildSourceContextText(src);
    const truncated = sourceText.slice(0, MAX_PER_SOURCE);
    const section = `[Fonte: ${src.name}]\n${truncated}`;
    if (totalChars + section.length > MAX_TOTAL) break;
    sections.push(section);
    totalChars += section.length;
  }

  const sourceBlock = sections.join('\n\n---\n\n');

  /* -- Chama o LLM ----------------------------------------------- */
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

    /* -- Parse JSON (extrai mesmo que venha com markdown code block) */
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
    return NextResponse.json({ ...buildFallbackGuide(sources), warning: msg });
  }
}
