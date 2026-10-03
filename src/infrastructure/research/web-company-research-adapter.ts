// Adapter de pesquisa pública de empresas (ADR-0028/0032): DuckDuckGo HTML.
// Pesquisa REAL — sem dados mockados. Falha lança erro (o caso de uso trata
// por lead e registra lead.research_failed).
// Arquitetura Hexagonal: Infrastructure — implementa CompanyResearchPort.

import type { CompanyResearchPort } from '@/application/ports/company-research-port';
import type { LeadResearch, LeadResearchSource } from '@/domain/control-plane';

const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';
const TIMEOUT_MS = 10_000;
const MAX_SOURCES = 5;

interface DdgResult {
  title: string;
  url: string;
  snippet: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Links do DDG são redirects: //duckduckgo.com/l/?uddg=<url codificada>&rut=… */
function extractRealUrl(href: string): string {
  try {
    const url = new URL(href, 'https://duckduckgo.com');
    const target = url.searchParams.get('uddg');
    return target ? decodeURIComponent(target) : href;
  } catch {
    return href;
  }
}

function parseResults(html: string): DdgResult[] {
  const links = [...html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];

  const results: DdgResult[] = [];
  for (let i = 0; i < links.length && results.length < MAX_SOURCES; i++) {
    const title = stripTags(links[i][2]);
    const url = extractRealUrl(links[i][1]);
    const snippet = snippets[i] ? stripTags(snippets[i][1]) : '';
    if (title && url.startsWith('http')) {
      results.push({ title, url, snippet });
    }
  }
  return results;
}

const SECTOR_HINTS: Array<[RegExp, string]> = [
  [/(saas|software|tecnologia|technology|dev|plataforma digital)/i, 'Tecnologia/Software'],
  [/(saúde|health|clínica|hospital|médic|medic)/i, 'Saúde'],
  [/(financ|banco|bank|fintech|seguro|insurance)/i, 'Financeiro'],
  [/(educaç|educat|school|curso|e-learning)/i, 'Educação'],
  [/(varejo|retail|e-commerce|ecommerce|loja)/i, 'Varejo/E-commerce'],
  [/(indústri|industri|manufatur|fábrica)/i, 'Indústria'],
  [/(agro|agrícol)/i, 'Agronegócio'],
  [/(logíst|logist|transport|frete)/i, 'Logística'],
];

const SIGNAL_HINTS: Array<[RegExp, string]> = [
  [/(cresc|expans|escala|round|investiment|funding|aquisi)/i, 'Sinal público de crescimento/expansão'],
  [/(vagas|carreiras|jobs|careers|contrat|we are hiring)/i, 'Contratação ativa (pressão operacional)'],
  [/(automaç|automation|eficiência|eficiencia|processos|workflow)/i, 'Menciona automação/eficiência (dor candidata)'],
  [/(ia|inteligência artificial|ai|machine learning|llm)/i, 'Menciona IA (maturidade tecnológica)'],
  [/(digital|transformação digital|digitalização)/i, 'Transformação digital em andamento'],
  [/(parceria|partner|integraç|integration)/i, 'Busca parcerias/integrações'],
];

export class WebCompanyResearchAdapter implements CompanyResearchPort {
  async researchCompany(lead: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
  }): Promise<LeadResearch> {
    const query = `"${lead.companyName}" empresa`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let html: string;
    try {
      const response = await fetch(`${DDG_HTML_URL}?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ChronoKairoHarness/1.0 (research; +https://chronokairo.com)',
          Accept: 'text/html',
        },
      });
      if (!response.ok) {
        throw new Error(`DuckDuckGo respondeu ${response.status}`);
      }
      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }

    const results = parseResults(html);
    const sources: LeadResearchSource[] = results.map((r) => ({
      title: r.title,
      url: r.url,
    }));

    const corpus = results.map((r) => `${r.title} ${r.snippet}`).join(' ');
    const sector = SECTOR_HINTS.find(([re]) => re.test(corpus))?.[1];
    const signals = SIGNAL_HINTS.filter(([re]) => re.test(corpus)).map(([, label]) => label);

    const summary =
      results.length === 0
        ? `Nenhum resultado público encontrado para "${lead.companyName}".`
        : results
            .slice(0, 3)
            .map((r) => r.snippet || r.title)
            .filter(Boolean)
            .join(' | ')
            .slice(0, 400);

    return {
      summary,
      sector,
      sizeHint: undefined,
      signals,
      sources,
      researchedAt: new Date().toISOString(),
    };
  }
}

let research: CompanyResearchPort | null = null;

export function getCompanyResearchAdapter(): CompanyResearchPort {
  if (!research) {
    research = new WebCompanyResearchAdapter();
  }
  return research;
}
