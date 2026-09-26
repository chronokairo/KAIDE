/**
 * Calendar RAG — extracts text from the CIESA academic calendar PDF,
 * chunks it, generates embeddings via LMStudio, stores in PostgreSQL,
 * and performs cosine-similarity search at query time.
 *
 * Auto-reindex strategy: checks `anna_calendar_chunks` for the current year.
 * If no rows exist, fetches the new year's PDF and re-indexes everything.
 * This naturally fires every year when the first calendar-related query arrives.
 */

import { pool, ensureSchema } from './postgres';
import { ensureOcrModel, ocrPdf, isOllamaAvailable, hasModel } from './ollama-ocr';

/* ─── PDF URL pattern ───────────────────────────────────────────── */
const PDF_URL = (year: number) =>
  `https://ciesa-cms-midias.s3.us-east-1.amazonaws.com/documents/calendario_academico_${year}.pdf`;

/* ─── Brazilian month names for chunk boundary detection ─────────  */
const PT_MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/* ─── in-memory guard: prevent parallel re-index ───────────────── */
let indexingInProgress = false;

/* ─── estado de progresso da indexação ──────────────────────────── */
export interface IndexingState {
  active: boolean;
  year: number | null;
  step: 'idle' | 'downloading' | 'ocr' | 'chunking' | 'embedding' | 'storing' | 'done' | 'error';
  ocrPage: number;
  ocrTotal: number;
  extractionMethod: 'ocr' | 'pdfparse' | null;
  startedAt: string | null;
  error?: string;
}

let indexingState: IndexingState = {
  active: false, year: null, step: 'idle',
  ocrPage: 0, ocrTotal: 0, extractionMethod: null, startedAt: null,
};

export function getIndexingState(): IndexingState { return indexingState; }

function setStep(step: IndexingState['step'], extra?: Partial<IndexingState>) {
  indexingState = { ...indexingState, step, ...extra };
}

/* ─── types ─────────────────────────────────────────────────────── */
export interface CalendarIndexStatus {
  year: number;
  chunks: number;
  hasEmbeddings: boolean;
  pdfUrl: string | null;
  indexedAt: string | null;
  extractionMethod?: string;
  indexing?: IndexingState;
}

/* ─────────────────────────────────────────────────────────────────
   PDF PARSING
   ─────────────────────────────────────────────────────────────── */
async function fetchPdfText(url: string): Promise<{ text: string; method: 'ocr' | 'pdfparse' }> {
  // OCR via glm-ocr desabilitado temporariamente (segfault em @napi-rs/canvas)
  // TODO: reabilitar após corrigir canvasFactory para pdf-parse v2
  //
  // if (await isOllamaAvailable() && await hasModel('glm-ocr')) {
  //   try {
  //     setStep('ocr', { ocrPage: 0, ocrTotal: 0 });
  //     const text = await ocrPdf(url, (page, total) => setStep('ocr', { ocrPage: page, ocrTotal: total }));
  //     if (text && text.length > 100) return { text, method: 'ocr' };
  //   } catch (e) {
  //     console.warn('[CalendarRAG] OCR falhou, usando pdf-parse como fallback:', e);
  //   }
  // }

  // Fallback: pdf-parse v2 class API
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require('pdf-parse') as {
    PDFParse: new (opts: { data: Uint8Array }) => { getText(): Promise<{ text: string }> };
  };
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const { text } = await parser.getText();
  return { text, method: 'pdfparse' };
}

/* ─────────────────────────────────────────────────────────────────
   CHUNKING — split by month sections, then by paragraph
   ─────────────────────────────────────────────────────────────── */
function chunkCalendarText(rawText: string): string[] {
  // Normalize whitespace
  const text = rawText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

  // Try to split by month headers (case-insensitive)
  const monthRegex = new RegExp(
    `(?=(?:${PT_MONTHS.join('|')})\\s*(?:de\\s*)?\\d{4})`,
    'gi',
  );

  let parts = text.split(monthRegex).map((s) => s.trim()).filter((s) => s.length > 20);

  // If month splitting produced too few chunks (<= 2), fall back to paragraph splits
  if (parts.length <= 2) {
    parts = text
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30);
  }

  // Merge tiny fragments (<80 chars) into the previous chunk
  const merged: string[] = [];
  for (const part of parts) {
    if (part.length < 80 && merged.length > 0) {
      merged[merged.length - 1] += '\n' + part;
    } else {
      merged.push(part);
    }
  }

  // Hard-cap each chunk at 1200 chars (sliding window, no overlap needed for calendar)
  const final: string[] = [];
  for (const chunk of merged) {
    if (chunk.length <= 1200) {
      final.push(chunk);
    } else {
      // Split long chunks by newline boundaries near 1200 chars
      let start = 0;
      while (start < chunk.length) {
        let end = start + 1200;
        if (end < chunk.length) {
          const nl = chunk.lastIndexOf('\n', end);
          if (nl > start + 200) end = nl;
        }
        final.push(chunk.slice(start, end).trim());
        start = end;
      }
    }
  }

  return final.filter((c) => c.length > 0);
}

/* ─────────────────────────────────────────────────────────────────
   EMBEDDINGS — via LMStudio /v1/embeddings
   Returns null[] gracefully when no embedding model is available
   ─────────────────────────────────────────────────────────────── */
async function getEmbeddings(
  texts: string[],
  baseUrl: string,
): Promise<(number[] | null)[]> {
  if (!texts.length) return [];

  // Try to discover an embedding model
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
      // Fallback: use first available model (some LMStudio versions use it for embeddings too)
      if (!embedModel && (modData.data ?? []).length > 0) {
        embedModel = modData.data![0].id;
      }
    }
  } catch { /* no models endpoint */ }

  if (!embedModel) return texts.map(() => null);

  // Batch in groups of 32 to avoid token limits
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
      // Pad if fewer embeddings returned than input
      while (all.length < i + batch.length) all.push(null);
    } catch {
      all.push(...batch.map(() => null));
    }
  }
  return all;
}

/* ─────────────────────────────────────────────────────────────────
   COSINE SIMILARITY
   ─────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────
   KEYWORD SCORE — fallback when no embeddings
   ─────────────────────────────────────────────────────────────── */
function keywordScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const lc = content.toLowerCase();
  return queryWords.reduce((score, word) => {
    const count = (lc.match(new RegExp(word, 'g')) ?? []).length;
    return score + count;
  }, 0);
}

/* ─────────────────────────────────────────────────────────────────
   STORE CHUNKS IN POSTGRES
   ─────────────────────────────────────────────────────────────── */
async function storeChunks(
  year: number,
  pdfUrl: string,
  chunks: string[],
  embeddings: (number[] | null)[],
): Promise<void> {
  // Clear old data for this year before re-inserting
  await pool.query('DELETE FROM anna_calendar_chunks WHERE year = $1', [year]);

  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `INSERT INTO anna_calendar_chunks (year, chunk_index, content, embedding, pdf_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (year, chunk_index) DO UPDATE
         SET content = EXCLUDED.content,
             embedding = EXCLUDED.embedding,
             pdf_url = EXCLUDED.pdf_url`,
      [year, i, chunks[i], embeddings[i] ?? null, pdfUrl],
    );
  }
}

/* ─────────────────────────────────────────────────────────────────
   FULL INDEX PIPELINE
   ─────────────────────────────────────────────────────────────── */
export async function indexCalendar(
  year: number,
  baseUrl: string,
): Promise<{ chunks: number; hasEmbeddings: boolean; extractionMethod: string }> {
  await ensureSchema();

  indexingState = { active: true, year, step: 'downloading', ocrPage: 0, ocrTotal: 0, extractionMethod: null, startedAt: new Date().toISOString() };
  indexingInProgress = true;

  try {
    const url = PDF_URL(year);
    const { text: rawText, method: extractionMethod } = await fetchPdfText(url);
    console.log(`[CalendarRAG] Extração concluída via ${extractionMethod}`);

    setStep('chunking', { extractionMethod });
    const chunks = chunkCalendarText(rawText);

    setStep('embedding');
    const embeddings = await getEmbeddings(chunks, baseUrl);

    setStep('storing');
    await storeChunks(year, url, chunks, embeddings);

    const hasEmbeddings = embeddings.some((e) => e !== null);
    setStep('done', { active: false });
    return { chunks: chunks.length, hasEmbeddings, extractionMethod };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setStep('error', { active: false, error: msg });
    throw e;
  } finally {
    indexingInProgress = false;
  }
}

/* ─────────────────────────────────────────────────────────────────
   ENSURE INDEXED — check if current year is already in DB
   If not, trigger async re-index (non-blocking on first call)
   ─────────────────────────────────────────────────────────────── */
export async function ensureCalendarIndexed(baseUrl: string): Promise<boolean> {
  await ensureSchema();
  const year = new Date().getFullYear();

  const { rows } = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM anna_calendar_chunks WHERE year = $1',
    [year],
  );
  const alreadyIndexed = parseInt(rows[0].count, 10) > 0;

  if (!alreadyIndexed && !indexingInProgress) {
    indexingInProgress = true;
    // Fire-and-forget so we don't block the chat response
    indexCalendar(year, baseUrl)
      .catch((err) => console.error('[CalendarRAG] index error:', err))
      .finally(() => { indexingInProgress = false; });
  }

  return alreadyIndexed;
}

/* ─────────────────────────────────────────────────────────────────
   SEARCH — main entry point for the chat route
   Returns a formatted string with the top-k most relevant chunks
   ─────────────────────────────────────────────────────────────── */
export async function searchCalendar(
  query: string,
  baseUrl: string,
  topK = 5,
): Promise<string> {
  await ensureSchema();
  const year = new Date().getFullYear();

  // Ensure background index is triggered; continue even if not yet indexed
  void ensureCalendarIndexed(baseUrl);

  const { rows } = await pool.query<{
    content: string;
    embedding: number[] | null;
  }>(
    'SELECT content, embedding FROM anna_calendar_chunks WHERE year = $1 ORDER BY chunk_index',
    [year],
  );

  if (rows.length === 0) return '';

  // Check if any embeddings exist
  const hasEmbeddings = rows.some((r) => r.embedding !== null);

  let ranked: typeof rows;
  if (hasEmbeddings) {
    // Get query embedding
    let queryVec: number[] | null = null;
    try {
      const embeds = await getEmbeddings([query], baseUrl);
      queryVec = embeds[0] ?? null;
    } catch { /* fallback to keyword */ }

    if (queryVec) {
      ranked = [...rows]
        .filter((r) => r.embedding !== null)
        .sort((a, b) => cosine(b.embedding!, queryVec!) - cosine(a.embedding!, queryVec!))
        .slice(0, topK);
    } else {
      ranked = [...rows]
        .sort((a, b) => keywordScore(query, b.content) - keywordScore(query, a.content))
        .slice(0, topK);
    }
  } else {
    // Keyword fallback
    ranked = [...rows]
      .sort((a, b) => keywordScore(query, b.content) - keywordScore(query, a.content))
      .slice(0, topK);
  }

  // Filter out chunks with zero relevance (keyword mode)
  const relevant = ranked.filter(
    (r) => !hasEmbeddings ? keywordScore(query, r.content) > 0 : true,
  );

  if (relevant.length === 0) return '';

  return (
    `### Calendário Acadêmico CIESA ${year}\n` +
    relevant.map((r) => r.content).join('\n\n---\n\n')
  );
}

/* ─────────────────────────────────────────────────────────────────
   STATUS — for the API route
   ─────────────────────────────────────────────────────────────── */
export async function getCalendarStatus(year?: number): Promise<CalendarIndexStatus> {
  await ensureSchema();
  const y = year ?? new Date().getFullYear();

  const { rows } = await pool.query<{
    count: string;
    has_emb: boolean;
    pdf_url: string | null;
    indexed_at: string | null;
  }>(
    `SELECT
       COUNT(*) AS count,
       BOOL_OR(embedding IS NOT NULL) AS has_emb,
       MAX(pdf_url) AS pdf_url,
       MAX(created_at)::text AS indexed_at
     FROM anna_calendar_chunks
     WHERE year = $1`,
    [y],
  );

  return {
    year: y,
    chunks: parseInt(rows[0].count, 10),
    hasEmbeddings: rows[0].has_emb ?? false,
    pdfUrl: rows[0].pdf_url,
    indexedAt: rows[0].indexed_at,
    indexing: getIndexingState(),
  };
}
