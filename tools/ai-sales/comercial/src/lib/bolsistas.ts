/**
 * Consulta de bolsistas do CIESA no portal público da Prefeitura de Manaus
 * (SGBU — Portal de Denúncias de Bolsas Universitárias).
 *
 * O portal não expõe API JSON; os dados são extraídos da tabela HTML
 * paginada (10 por página, parâmetro `bolsista_page`). A lista completa
 * é mantida em cache em memória para evitar requisições repetidas.
 */

export interface Bolsista {
  nome: string;
  instituicao: string;
  curso: string;
  turno: string;
}

export interface BolsistasFiltro {
  nome?: string;
  curso?: string;
  turno?: string;
}

const PORTAL_BASE = 'https://sgbu.manaus.am.gov.br/portaldenuncia/default/gerenciar';
const CIESA_IES_CODIGO = '8';
const PAGE_SIZE = 10;
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 3 meses

interface CacheState {
  data: Bolsista[] | null;
  fetchedAt: number;
  inflight: Promise<Bolsista[]> | null;
}

const globalCache = globalThis as unknown as { __ciesaBolsistasCache?: CacheState };
const cache: CacheState =
  globalCache.__ciesaBolsistasCache ?? (globalCache.__ciesaBolsistasCache = {
    data: null,
    fetchedAt: 0,
    inflight: null,
  });

function buildUrl(page: number): string {
  const params = new URLSearchParams({
    'bolsista[ies_codigo]': CIESA_IES_CODIGO,
    'bolsista[cur_codigo]': '',
    'bolsista[tur_turno]': '',
    'bolsista[bol_nome]': '',
  });
  if (page > 1) params.set('bolsista_page', String(page));
  return `${PORTAL_BASE}?${params.toString()}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parsePage(html: string): { rows: Bolsista[]; total: number } {
  const totalMatch = html.match(/Exibindo\s+[\d.]+-[\d.]+\s+de\s+([\d.]+)\s+resultados/i);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/\./g, ''), 10) : 0;

  const rows: Bolsista[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html)) !== null) {
    const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      decodeEntities(m[1].replace(/<[^>]*>/g, '')),
    );
    if (tds.length >= 4 && tds[0]) {
      rows.push({ nome: tds[0], instituicao: tds[1], curso: tds[2], turno: tds[3] });
    }
  }
  return { rows, total };
}

async function fetchPage(page: number): Promise<{ rows: Bolsista[]; total: number }> {
  const res = await fetch(buildUrl(page), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnnaCIESA/1.0)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Portal SGBU respondeu HTTP ${res.status}`);
  return parsePage(await res.text());
}

async function fetchAll(): Promise<Bolsista[]> {
  const first = await fetchPage(1);
  const pages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  const all = [...first.rows];

  /* páginas restantes em lotes de 5 para não sobrecarregar o portal */
  for (let start = 2; start <= pages; start += 5) {
    const batch = [];
    for (let p = start; p < start + 5 && p <= pages; p++) batch.push(fetchPage(p));
    const results = await Promise.all(batch);
    for (const r of results) all.push(...r.rows);
  }
  return all;
}

/** Lista completa de bolsistas do CIESA (com cache de 30 min). */
export async function getBolsistasCiesa(): Promise<Bolsista[]> {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  if (cache.inflight) return cache.inflight;

  cache.inflight = fetchAll()
    .then((data) => {
      cache.data = data;
      cache.fetchedAt = Date.now();
      return data;
    })
    .finally(() => {
      cache.inflight = null;
    });
  return cache.inflight;
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Busca bolsistas do CIESA filtrando por nome, curso e/ou turno. */
export async function buscarBolsistas(filtro: BolsistasFiltro = {}): Promise<Bolsista[]> {
  const all = await getBolsistasCiesa();
  const nome = filtro.nome ? normalize(filtro.nome) : '';
  const curso = filtro.curso ? normalize(filtro.curso) : '';
  const turno = filtro.turno ? normalize(filtro.turno) : '';

  return all.filter(
    (b) =>
      (!nome || normalize(b.nome).includes(nome)) &&
      (!curso || normalize(b.curso).includes(curso)) &&
      (!turno || normalize(b.turno).includes(turno)),
  );
}
