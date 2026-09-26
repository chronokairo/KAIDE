/**
 * JsonSourceStore — armazenamento local de fontes em arquivo JSON
 *
 * Usado quando o PostgreSQL não está disponível (desenvolvimento sem DB).
 * Salva em <cwd>/.anna-data/sources.json
 *
 * Interface idêntica à SourceStore (PostgreSQL).
 */

import path from 'path';
import fs from 'fs';
import type { SourceRecord, SourceSearchResult, SearchOptions } from './store';
import { chunkText } from './store';

const DATA_DIR = path.join(process.cwd(), '.anna-data');
const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');

interface StoredSource extends SourceRecord {
  chunks: string[];
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAll(): StoredSource[] {
  ensureDir();
  if (!fs.existsSync(SOURCES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8')) as StoredSource[];
  } catch {
    return [];
  }
}

function writeAll(sources: StoredSource[]) {
  ensureDir();
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2), 'utf-8');
}

function kwScore(query: string, content: string): number {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const lc = content.toLowerCase();
  return words.reduce((n, w) => {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    return n + (lc.match(re)?.length ?? 0);
  }, 0);
}

export class JsonSourceStore {
  async addSource(source: Omit<SourceRecord, 'createdAt'>): Promise<void> {
    const all = readAll();
    const idx = all.findIndex((s) => s.id === source.id);
    const record: StoredSource = {
      id: source.id,
      type: source.type,
      name: source.name,
      description: source.description ?? null,
      rawContent: source.rawContent ?? null,
      createdAt: new Date(),
      conversationId: source.conversationId ?? null,
      chunks: source.rawContent ? chunkText(source.rawContent) : [],
    };
    if (idx >= 0) all[idx] = record;
    else all.unshift(record);
    writeAll(all);
  }

  async removeSource(id: string): Promise<void> {
    writeAll(readAll().filter((s) => s.id !== id));
  }

  /** Clears session sources (no conversationId). Pass a conversationId to clear only that conversation's sources. */
  async clearAll(conversationId?: string | null): Promise<void> {
    if (conversationId === undefined) {
      // default: clear session sources only
      writeAll(readAll().filter((s) => s.conversationId != null));
    } else {
      writeAll(readAll().filter((s) => (s.conversationId ?? null) !== (conversationId ?? null)));
    }
  }

  /** Re-assigns all session sources (conversationId=null) to a specific conversation. */
  async adoptSources(conversationId: string): Promise<void> {
    const all = readAll().map((s) =>
      s.conversationId == null ? { ...s, conversationId } : s
    );
    writeAll(all);
  }

  async listSources(conversationId?: string): Promise<SourceRecord[]> {
    const all = readAll();
    const filtered = conversationId === undefined
      ? all
      : conversationId === 'session'
        ? all.filter((s) => s.conversationId == null)
        : all.filter((s) => s.conversationId === conversationId);
    return filtered.map(({ chunks: _chunks, ...rest }) => ({
      ...rest,
      createdAt: new Date(rest.createdAt),
    }));
  }

  async getSource(id: string): Promise<SourceRecord | null> {
    const s = readAll().find((x) => x.id === id);
    if (!s) return null;
    const { chunks: _chunks, ...rest } = s;
    return { ...rest, createdAt: new Date(rest.createdAt) };
  }

  async indexSource(sourceId: string): Promise<{ chunks: number; hasEmbeddings: boolean }> {
    const all = readAll();
    const idx = all.findIndex((s) => s.id === sourceId);
    if (idx < 0) throw new Error(`Source ${sourceId} not found`);
    if (all[idx].rawContent) {
      all[idx].chunks = chunkText(all[idx].rawContent!);
      writeAll(all);
    }
    return { chunks: all[idx].chunks.length, hasEmbeddings: false };
  }

  async search(queries: string[], options: SearchOptions = {}): Promise<SourceSearchResult[]> {
    const { topK = 5 } = options;
    const combined = queries.join(' ');
    const results: SourceSearchResult[] = [];

    for (const src of readAll()) {
      for (const chunk of src.chunks) {
        const score = kwScore(combined, chunk);
        if (score > 0) {
          results.push({ sourceId: src.id, name: src.name, type: src.type, content: chunk, score });
        }
      }
      // Also search raw content if no chunks yet
      if (src.chunks.length === 0 && src.rawContent) {
        const score = kwScore(combined, src.rawContent);
        if (score > 0) {
          results.push({
            sourceId: src.id,
            name: src.name,
            type: src.type,
            content: src.rawContent.slice(0, 500),
            score,
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async searchSingle(query: string, options?: SearchOptions): Promise<SourceSearchResult[]> {
    return this.search([query], options);
  }

  formatForContext(results: SourceSearchResult[]): string {
    if (results.length === 0) return '';
    const sections = results.map((r, i) => `[Fonte ${i + 1}] "${r.name}" (${r.type})\n${r.content}`);
    return '### Fontes do usuário\n\n' + sections.join('\n\n---\n\n');
  }
}
