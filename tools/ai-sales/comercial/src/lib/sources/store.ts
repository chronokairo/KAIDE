/**
 * SourceStore — inspirado no Vane UploadStore + baseSearch
 *
 * Gerencia fontes (sources) com:
 * - Armazenamento em PostgreSQL
 * - Chunking de texto (512 char chunks, 128 char overlap)
 * - Embeddings via LMStudio/Ollama (reutiliza padrão do calendar-rag)
 * - Busca semântica com RRF (Reciprocal Rank Fusion)
 * - Fallback para busca por keywords
 */

import { ensureSchema, pool } from '@/lib/postgres';

/* ─── Types ───────────────────────────────────────────────────── */

export interface SourceRecord {
  id: string;
  type: 'file' | 'web' | 'text' | 'drive';
  name: string;
  description: string | null;
  rawContent: string | null;
  createdAt: Date;
  conversationId?: string | null;
}

export interface SourceChunk {
  id: number;
  sourceId: string;
  chunkIndex: number;
  content: string;
  embedding: number[] | null;
}

export interface SourceSearchResult {
  sourceId: string;
  name: string;
  type: SourceRecord['type'];
  content: string;
  score: number;
}

export interface SearchOptions {
  topK?: number;
  rrfK?: number;
  minScore?: number;
}

/* ─── Schema ──────────────────────────────────────────────────── */

let schemaInitialized = false;

async function ensureSourceSchema(): Promise<void> {
  if (schemaInitialized) return;
  await ensureSchema();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anna_sources (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL CHECK (type IN ('file', 'web', 'text', 'drive')),
      name        TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      raw_content TEXT DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS anna_source_chunks (
      id          BIGSERIAL PRIMARY KEY,
      source_id   TEXT NOT NULL REFERENCES anna_sources(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content     TEXT NOT NULL,
      embedding   DOUBLE PRECISION[] DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source_id, chunk_index)
    );

    CREATE INDEX IF NOT EXISTS anna_source_chunks_source_id_idx
      ON anna_source_chunks(source_id, chunk_index);
  `);
  schemaInitialized = true;
}

/* ─── Text chunking (inspirado no Vane: 512 chars, 128 overlap) ─ */

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 128;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = start + CHUNK_SIZE;
    if (end >= normalized.length) {
      chunks.push(normalized.slice(start).trim());
      break;
    }

    // Tenta quebrar em final de frase ou linha
    const slice = normalized.slice(start, end);
    const lastPeriod = slice.lastIndexOf('.');
    const lastNewline = slice.lastIndexOf('\n');
    const breakPoint = Math.max(lastPeriod, lastNewline);
    if (breakPoint > CHUNK_SIZE * 0.3) {
      end = start + breakPoint + 1;
    }

    chunks.push(normalized.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 20);
}

/* ─── Embeddings (reutiliza padrão do calendar-rag) ──────────── */

async function getEmbeddings(
  texts: string[],
  baseUrl: string,
): Promise<(number[] | null)[]> {
  if (!texts.length) return [];

  let embedModel: string | null = null;
  try {
    const modRes = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (modRes.ok) {
      const modData = (await modRes.json()) as { data?: { id: string }[] };
      const embedModels = (modData.data ?? []).filter(
        (m) => m.id.toLowerCase().includes('embed') || m.id.toLowerCase().includes('nomic'),
      );
      if (embedModels.length > 0) embedModel = embedModels[0].id;
      if (!embedModel && (modData.data ?? []).length > 0) {
        embedModel = modData.data![0].id;
      }
    }
  } catch { /* no models endpoint */ }

  if (!embedModel) return texts.map(() => null);

  const all: (number[] | null)[] = [];
  const BATCH = 32;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embedModel, input: batch }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) { all.push(...batch.map(() => null)); continue; }
      const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
      for (const item of data.data ?? []) {
        all.push(item.embedding ?? null);
      }
      while (all.length < i + batch.length) all.push(null);
    } catch {
      all.push(...batch.map(() => null));
    }
  }
  return all;
}

/* ─── Cosine similarity ───────────────────────────────────────── */

function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/* ─── Keyword score (fallback) ────────────────────────────────── */

function keywordScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const lc = content.toLowerCase();
  return queryWords.reduce((score, word) => {
    const count = (lc.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    return score + count;
  }, 0);
}

/* ─── RRF (Reciprocal Rank Fusion) — inspirado no Vane ───────── */

function reciprocalRankFusion(
  results: SourceChunk[][],
  topK: number,
  rrfK: number = 60,
): SourceChunk[] {
  const scoreMap = new Map<number, number>();
  const chunkMap = new Map<number, SourceChunk>();

  for (const list of results) {
    for (let j = 0; j < list.length; j++) {
      const chunk = list[j];
      const hash = chunk.id;
      chunkMap.set(hash, chunk);
      scoreMap.set(hash, (scoreMap.get(hash) || 0) + 1 / (j + 1 + rrfK));
    }
  }

  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => chunkMap.get(id)!)
    .slice(0, topK);
}

/* ─── SourceStore ─────────────────────────────────────────────── */

export class SourceStore {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.LLM_BASE_URL ?? 'http://localhost:1234/v1';
  }

  /* ── CRUD ──────────────────────────────────────────────────── */

  async addSource(source: Omit<SourceRecord, 'createdAt'>): Promise<void> {
    await ensureSourceSchema();
    await pool.query(
      `INSERT INTO anna_sources (id, type, name, description, raw_content)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         raw_content = EXCLUDED.raw_content`,
      [source.id, source.type, source.name, source.description, source.rawContent],
    );
  }

  async removeSource(id: string): Promise<void> {
    await ensureSourceSchema();
    await pool.query('DELETE FROM anna_sources WHERE id = $1', [id]);
  }

  async listSources(): Promise<SourceRecord[]> {
    await ensureSourceSchema();
    const { rows } = await pool.query<SourceRecord>(
      'SELECT id, type, name, description, raw_content, created_at FROM anna_sources ORDER BY created_at DESC',
    );
    return rows;
  }

  async getSource(id: string): Promise<SourceRecord | null> {
    await ensureSourceSchema();
    const { rows } = await pool.query<SourceRecord>(
      'SELECT id, type, name, description, raw_content, created_at FROM anna_sources WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  /* ── Indexação (chunking + embeddings) ─────────────────────── */

  async indexSource(sourceId: string): Promise<{ chunks: number; hasEmbeddings: boolean }> {
    await ensureSourceSchema();

    const source = await this.getSource(sourceId);
    if (!source || !source.rawContent) {
      throw new Error(`Source ${sourceId} not found or has no content`);
    }

    // Remove chunks antigos
    await pool.query('DELETE FROM anna_source_chunks WHERE source_id = $1', [sourceId]);

    // Chunking
    const chunks = chunkText(source.rawContent);
    if (chunks.length === 0) return { chunks: 0, hasEmbeddings: false };

    // Embeddings
    const embeddings = await getEmbeddings(chunks, this.baseUrl);
    const hasEmbeddings = embeddings.some((e) => e !== null);

    // Store
    for (let i = 0; i < chunks.length; i++) {
      await pool.query(
        `INSERT INTO anna_source_chunks (source_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4)`,
        [sourceId, i, chunks[i], embeddings[i] ?? null],
      );
    }

    return { chunks: chunks.length, hasEmbeddings };
  }

  /* ── Busca semântica (inspirada no Vane: embeddings + RRF) ── */

  async search(
    queries: string[],
    options: SearchOptions = {},
  ): Promise<SourceSearchResult[]> {
    const { topK = 5, rrfK = 60, minScore = 0.3 } = options;
    await ensureSourceSchema();

    // Busca todos os chunks com embedding
    const { rows: allChunks } = await pool.query<SourceChunk>(
      `SELECT sc.id, sc.source_id AS "sourceId", sc.chunk_index AS "chunkIndex",
              sc.content, sc.embedding
       FROM anna_source_chunks sc
       ORDER BY sc.source_id, sc.chunk_index`,
    );

    if (allChunks.length === 0) return [];

    const hasEmbeddings = allChunks.some((c) => c.embedding !== null);
    let ranked: SourceChunk[];

    if (hasEmbeddings) {
      // Busca embeddings para cada query
      const queryEmbeddings: (number[] | null)[] = await getEmbeddings(queries, this.baseUrl);
      const validQueryEmbeds = queryEmbeddings.filter((e): e is number[] => e !== null);

      if (validQueryEmbeds.length > 0) {
        // RRF: para cada query, ranqueia os chunks por similaridade
        const perQueryResults: SourceChunk[][] = validQueryEmbeds.map((qVec) =>
          allChunks
            .filter((c) => c.embedding !== null)
            .map((c) => ({ ...c, score: cosine(c.embedding!, qVec) }))
            .filter((c) => c.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK * 3) as SourceChunk[],
        );

        ranked = reciprocalRankFusion(perQueryResults, topK, rrfK);
      } else {
        // Fallback para keyword
        ranked = this.keywordSearch(allChunks, queries, topK);
      }
    } else {
      // Keyword fallback
      ranked = this.keywordSearch(allChunks, queries, topK);
    }

    // Busca metadados das fontes
    const sourceIds = [...new Set(ranked.map((c) => c.sourceId))];
    if (sourceIds.length === 0) return [];

    const { rows: sources } = await pool.query<SourceRecord>(
      'SELECT id, type, name, description, raw_content, created_at FROM anna_sources WHERE id = ANY($1)',
      [sourceIds],
    );
    const sourceMap = new Map(sources.map((s) => [s.id, s]));

    return ranked.map((chunk) => {
      const src = sourceMap.get(chunk.sourceId);
      return {
        sourceId: chunk.sourceId,
        name: src?.name ?? chunk.sourceId,
        type: src?.type ?? 'text',
        content: chunk.content,
        score: (chunk as SourceChunk & { score?: number }).score ?? 0,
      };
    });
  }

  private keywordSearch(
    chunks: SourceChunk[],
    queries: string[],
    topK: number,
  ): SourceChunk[] {
    const combinedQuery = queries.join(' ');
    return [...chunks]
      .map((c) => ({ ...c, score: keywordScore(combinedQuery, c.content) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /* ── Busca única (para uso direto no chat) ──────────────────── */

  async searchSingle(
    query: string,
    options?: SearchOptions,
  ): Promise<SourceSearchResult[]> {
    return this.search([query], options);
  }

  /* ── Formatar resultados para contexto do LLM ──────────────── */

  formatForContext(results: SourceSearchResult[]): string {
    if (results.length === 0) return '';

    const sections = results.map(
      (r, i) =>
        `[Fonte ${i + 1}] "${r.name}" (${r.type})\n${r.content}`,
    );

    return (
      '### Fontes do usuário\n\n' +
      sections.join('\n\n---\n\n')
    );
  }

  /* ── Destruição ────────────────────────────────────────────── */

  async clearAll(): Promise<void> {
    await ensureSourceSchema();
    await pool.query('DELETE FROM anna_source_chunks');
    await pool.query('DELETE FROM anna_sources');
  }
}
