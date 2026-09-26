/**
 * WebSearch — busca web nativa
 *
 * Motores (em ordem de prioridade):
 * 1. SearXNG          — se SEARXNG_URL estiver configurado
 * 2. Brave Search     — se BRAVE_SEARCH_API_KEY estiver configurado
 * 3. Google News RSS  — gratuito, sem chave, sempre disponível
 * 4. DuckDuckGo IA    — respostas rápidas/factuais sem chave
 */

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
}

/* ─── SearXNG ─────────────────────────────────────────────────── */

function getSearxngURL(): string | null {
  return process.env.SEARXNG_URL ?? null;
}

async function searchSearxng(query: string): Promise<WebSearchResult[]> {
  const searxngURL = getSearxngURL();
  if (!searxngURL) return [];

  const url = new URL(`${searxngURL.replace(/\/$/, '')}/search?format=json`);
  url.searchParams.append('q', query);
  url.searchParams.append('language', 'pt-BR');
  url.searchParams.append('categories', 'general');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{ title: string; url: string; content: string }>;
    };

    return (data.results ?? []).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
      engine: 'searxng',
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/* ─── Brave Search (optional — BRAVE_SEARCH_API_KEY) ──────────── */

async function searchBrave(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('search_lang', 'pt');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      web?: { results?: Array<{ title: string; url: string; description: string }> };
    };

    return (data.web?.results ?? []).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.description ?? '',
      engine: 'brave',
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/* ─── Google News RSS (free, no key required) ─────────────────── */

async function searchGoogleNewsRSS(query: string): Promise<WebSearchResult[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    return parseGoogleNewsRSS(xml).slice(0, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseGoogleNewsRSS(xml: string): WebSearchResult[] {
  const results: WebSearchResult[] = [];

  // Extract <item>...</item> blocks
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRe.exec(xml)) !== null) {
    const block = itemMatch[1];

    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    // Try to find the real article URL in <guid> (sometimes contains the real URL)
    const guidMatch = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    const rawLink = linkMatch ? linkMatch[1].trim() : '';
    const guidUrl = guidMatch ? guidMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    // Prefer guid URL if it's not a google.com URL (it may be the actual article)
    const url = (guidUrl && !guidUrl.includes('google.com') && guidUrl.startsWith('http'))
      ? guidUrl
      : rawLink;
    const desc = descMatch
      ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()
      : '';
    const source = sourceMatch ? sourceMatch[1].trim() : '';

    if (!title || !url) continue;

    results.push({
      title,
      url,
      content: desc || (source ? `Fonte: ${source}` : ''),
      engine: 'google-news',
    });
  }

  return results;
}

/* ─── DuckDuckGo Instant Answers (free, no key) ───────────────── */

async function searchDuckDuckGoIA(query: string): Promise<WebSearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      Heading?: string;
      RelatedTopics?: Array<{
        Text?: string;
        FirstURL?: string;
        Topics?: Array<{ Text?: string; FirstURL?: string }>;
      }>;
    };

    const results: WebSearchResult[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading ?? data.AbstractSource ?? query,
        url: data.AbstractURL,
        content: data.AbstractText,
        engine: 'duckduckgo-ia',
      });
    }

    for (const topic of data.RelatedTopics ?? []) {
      if (topic.FirstURL && topic.Text) {
        results.push({
          title: topic.Text.split(' - ')[0] ?? topic.Text,
          url: topic.FirstURL,
          content: topic.Text,
          engine: 'duckduckgo-ia',
        });
      }
      for (const sub of topic.Topics ?? []) {
        if (sub.FirstURL && sub.Text) {
          results.push({
            title: sub.Text.split(' - ')[0] ?? sub.Text,
            url: sub.FirstURL,
            content: sub.Text,
            engine: 'duckduckgo-ia',
          });
        }
      }
    }

    return results.slice(0, 5);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/* ─── Public API ──────────────────────────────────────────────── */

/**
 * Busca na web. Prioridade: SearXNG → Brave → Google News RSS + DDG IA.
 */
export async function searchWeb(query: string): Promise<WebSearchResult[]> {
  // 1. SearXNG (configuração self-hosted)
  if (getSearxngURL()) {
    const results = await searchSearxng(query);
    if (results.length > 0) return results;
  }

  // 2. Brave Search API (chave opcional)
  if (process.env.BRAVE_SEARCH_API_KEY) {
    const results = await searchBrave(query);
    if (results.length > 0) return results;
  }

  // 3. Google News RSS + DuckDuckGo IA (sempre disponíveis, sem chave)
  const [news, ia] = await Promise.all([
    searchGoogleNewsRSS(query),
    searchDuckDuckGoIA(query),
  ]);

  // Prioriza resultados do DDG IA (factuais) + News
  const combined = [...ia, ...news];
  return combined.slice(0, 10);
}

