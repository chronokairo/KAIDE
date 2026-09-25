/**
 * @layer features/documents
 * @description Gerenciador do Banco Vetorial com persistência
 */

import * as crypto from 'node:crypto';
import type { Document, SearchResult, VectorStoreStats } from './types.js';
import { saveVectorStore, loadVectorStore, isCacheExpired } from './persistence.js';

// Configurações
const CHROMA_PERSIST_DIR = process.env.CHROMA_PERSIST_DIR || './chroma_db';
const COLLECTION_NAME = 'obsidian_vault';
const TOP_K_RESULTS = parseInt(process.env.TOP_K_RESULTS || '5', 10);
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE_HOURS || '1', 10) * 60 * 60 * 1000;

export interface EmbeddingFunction {
  embed(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export class VectorStore {
  private persistDir: string;
  private collectionName: string;
  private embeddingFn: EmbeddingFunction | null = null;
  private documents: Map<string, Document> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private lastLoadTime: number = 0;
  private isLoaded: boolean = false;
  private storedHash: string | null = null;

  constructor(persistDir: string = CHROMA_PERSIST_DIR) {
    this.persistDir = persistDir;
    this.collectionName = COLLECTION_NAME;
  }

  /**
   * Carrega dados persistidos se disponíveis
   */
  async loadFromDisk(): Promise<boolean> {
    if (this.isLoaded) return true;

    const persisted = await loadVectorStore();
    if (!persisted) return false;

    // Verificar se cache está expirado
    if (isCacheExpired(persisted.timestamp, CACHE_MAX_AGE)) {
      console.log('[VectorStore] Cache expirado, será necessário re-indexar');
      return false;
    }

    this.documents = persisted.documents;
    this.embeddings = persisted.embeddings;
    this.lastLoadTime = persisted.timestamp;
    this.storedHash = persisted.hash || null;
    this.isLoaded = true;

    console.log(
      `[VectorStore] Dados carregados do cache (${this.documents.size} documentos)`
    );
    return true;
  }

  /**
   * Retorna o hash armazenado dos dados
   */
  getStoredHash(): string | null {
    return this.storedHash;
  }

  /**
   * Define a função de embedding a ser usada
   */
  setEmbeddingFunction(fn: EmbeddingFunction): void {
    this.embeddingFn = fn;
  }

  /**
   * Gera um ID único para o documento baseado no conteúdo
   */
  private generateId(document: Document): string {
    const hash = crypto.createHash('md5');
    // Usar mais informações para evitar colisões
    const uniqueString = JSON.stringify({
      source: document.metadata.source,
      title: document.metadata.title,
      chunkId: document.metadata.chunkId || 0,
      content: document.content,
    });
    hash.update(uniqueString);
    return hash.digest('hex');
  }

  /**
   * Calcula distância cosseno entre dois vetores
   */
  private cosineDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return 1;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return 1 - similarity; // Distância = 1 - similaridade
  }

  /**
   * Adiciona documentos ao banco vetorial
   */
  async addDocuments(documents: Document[], batchSize: number = 50): Promise<void> {
    if (!this.embeddingFn) {
      throw new Error('Embedding function not set. Call setEmbeddingFunction first.');
    }

    console.log(`[VectorStore] Indexando ${documents.length} documentos...`);

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const contents = batch.map((doc) => doc.content);

      try {
        // Gerar embeddings
        const embeddings = await this.embeddingFn.embed(contents);

        // Armazenar documentos e embeddings
        for (let j = 0; j < batch.length; j++) {
          const id = this.generateId(batch[j]);
          this.documents.set(id, batch[j]);
          this.embeddings.set(id, embeddings[j]);
        }

        console.log(
          `[VectorStore] Processado lote ${Math.floor(i / batchSize) + 1} (${i + batch.length}/${documents.length})`
        );
      } catch (error) {
        console.error(`[VectorStore] Erro ao processar lote ${Math.floor(i / batchSize) + 1}:`, error);
        // Continuar com próximo lote
      }
    }

    console.log(`[VectorStore] Indexação concluída! ${this.documents.size} documentos.`);

    // Salvar no disco para próxima vez
    this.isLoaded = true;
    this.lastLoadTime = Date.now();
    await saveVectorStore(this.documents, this.embeddings);
  }

  /**
   * Salva o vector store com hash dos dados
   */
  async saveWithHash(hash: string): Promise<void> {
    this.storedHash = hash;
    await saveVectorStore(this.documents, this.embeddings, hash);
  }

  /**
   * Busca documentos similares à query
   */
  async search(query: string, nResults: number = TOP_K_RESULTS): Promise<SearchResult[]> {
    if (!this.embeddingFn) {
      throw new Error('Embedding function not set. Call setEmbeddingFunction first.');
    }

    console.log(`[VectorStore] Buscando em ${this.documents.size} documentos indexados`);

    // Gerar embedding da query
    const queryEmbedding = await this.embeddingFn.embedQuery(query);

    // Calcular distâncias para todos os documentos
    const results: Array<{ id: string; distance: number }> = [];

    for (const [id, embedding] of this.embeddings) {
      const distance = this.cosineDistance(queryEmbedding, embedding);
      results.push({ id, distance });
    }

    // Ordenar por distância (menor = mais similar)
    results.sort((a, b) => a.distance - b.distance);

    console.log(`[VectorStore] Distâncias calculadas. Melhor match: ${results[0]?.distance.toFixed(4)}`);

    // Retornar top N resultados
    return results.slice(0, nResults).map(({ id, distance }) => {
      const doc = this.documents.get(id)!;
      return {
        id,
        content: doc.content,
        metadata: doc.metadata,
        distance,
      };
    });
  }

  /**
   * Busca documentos via palavras-chave (Keyword Search simplificado)
   */
  async keywordSearch(query: string, nResults: number = TOP_K_RESULTS): Promise<SearchResult[]> {
    console.log(`[VectorStore] Buscando via palavras-chave em ${this.documents.size} documentos`);

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return [];

    const results: Array<{ id: string; score: number }> = [];

    for (const [id, doc] of this.documents) {
      const content = doc.content.toLowerCase();
      const title = (doc.metadata.title || '').toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        // Peso maior para título
        if (title.includes(word)) {
          score += 10;
        }

        // Contar ocorrências no conteúdo
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      if (score > 0) {
        results.push({ id, score });
      }
    }

    // Ordenar por score (maior = melhor)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, nResults).map(({ id, score }) => {
      const doc = this.documents.get(id)!;
      return {
        id,
        content: doc.content,
        metadata: doc.metadata,
        distance: 1 / (1 + score), // Pseudo-distância
      };
    });
  }

  /**
   * Busca híbrida combinando Vector Search e Keyword Search usando RRF (Reciprocal Rank Fusion)
   */
  async hybridSearch(query: string, nResults: number = TOP_K_RESULTS): Promise<SearchResult[]> {
    console.log(`[VectorStore] Iniciando busca híbrida para: "${query}"`);

    // 1. Executar as duas buscas em paralelo
    const [vectorResults, keywordResults] = await Promise.all([
      this.search(query, nResults * 2),
      this.keywordSearch(query, nResults * 2)
    ]);

    // 2. Combinar usando Reciprocal Rank Fusion (RRF)
    // RRF score = sum( 1 / (k + rank) )
    const k = 60; // Constante padrão do RRF
    const rrfScores: Map<string, number> = new Map();

    // Processar resultados vetoriais
    vectorResults.forEach((res, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);
      rrfScores.set(res.id, score);
    });

    // Processar resultados de palavras-chave
    keywordResults.forEach((res, index) => {
      const rank = index + 1;
      const score = 1 / (k + rank);
      const currentScore = rrfScores.get(res.id) || 0;
      rrfScores.set(res.id, currentScore + score);
    });

    // 3. Converter de volta para SearchResult e ordenar
    const combinedResults: SearchResult[] = Array.from(rrfScores.entries())
      .map(([id, rrfScore]) => {
        const doc = this.documents.get(id)!;
        return {
          id,
          content: doc.content,
          metadata: doc.metadata,
          distance: 1 - rrfScore, // Inverter para que menor seja "melhor" (distância)
        };
      })
      .sort((a, b) => a.distance - b.distance);

    console.log(`[VectorStore] Busca híbrida concluída. Top match RRF score: ${(1 - combinedResults[0]?.distance).toFixed(4)}`);

    return combinedResults.slice(0, nResults);
  }

  /**
   * Retorna estatísticas do banco vetorial
   */
  getStats(): VectorStoreStats {
    return {
      totalDocuments: this.documents.size,
      collectionName: this.collectionName,
      persistDirectory: this.persistDir,
    };
  }

  /**
   * Limpa todos os documentos do banco
   */
  clear(): void {
    this.documents.clear();
    this.embeddings.clear();
    console.log('[VectorStore] Banco vetorial limpo!');
  }
}

/**
 * Factory function para criar VectorStore
 */
export function createVectorStore(persistDir?: string): VectorStore {
  return new VectorStore(persistDir);
}
