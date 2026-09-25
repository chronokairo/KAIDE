/**
 * Persistence system for the vector store
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Document } from './types';

const PERSIST_DIR = process.env.CHROMA_PERSIST_DIR || './chroma_db';

export interface PersistedVectorStore {
    documents: Array<[string, Document]>;
    embeddings: Array<[string, number[]]>;
    version: string;
    timestamp: number;
    hash?: string;
}

/**
 * Salva o estado do vector store em disco
 */
export async function saveVectorStore(
    documents: Map<string, Document>,
    embeddings: Map<string, number[]>,
    hash?: string
): Promise<void> {
    try {
        // Criar diretório se não existir
        await fs.mkdir(PERSIST_DIR, { recursive: true });

        const data: PersistedVectorStore = {
            documents: Array.from(documents.entries()),
            embeddings: Array.from(embeddings.entries()),
            version: '1.0',
            timestamp: Date.now(),
            hash,
        };

        const filePath = path.join(PERSIST_DIR, 'vector_store.json');
        await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');

        console.log(`[Persistence] Vector store salvo: ${documents.size} documentos`);
    } catch (error) {
        console.error('[Persistence] Erro ao salvar vector store:', error);
    }
}

/**
 * Carrega o estado do vector store do disco
 */
export async function loadVectorStore(): Promise<{
    documents: Map<string, Document>;
    embeddings: Map<string, number[]>;
    timestamp: number;
    hash?: string;
} | null> {
    try {
        const filePath = path.join(PERSIST_DIR, 'vector_store.json');

        // Verificar se arquivo existe
        try {
            await fs.access(filePath);
        } catch {
            console.log('[Persistence] Nenhum vector store persistido encontrado');
            return null;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const data: PersistedVectorStore = JSON.parse(content);

        const documents = new Map(data.documents);
        const embeddings = new Map(data.embeddings);

        console.log(`[Persistence] Vector store carregado: ${documents.size} documentos`);
        console.log(
            `[Persistence] Última indexação: ${new Date(data.timestamp).toLocaleString()}`
        );

        return {
            documents,
            embeddings,
            timestamp: data.timestamp,
            hash: data.hash,
        };
    } catch (error) {
        console.error('[Persistence] Erro ao carregar vector store:', error);
        return null;
    }
}

/**
 * Verifica se o cache está expirado
 */
export function isCacheExpired(timestamp: number, maxAgeMs: number = 1000 * 60 * 60): boolean {
    return Date.now() - timestamp > maxAgeMs;
}

/**
 * Remove arquivos de cache antigos
 */
export async function clearCache(): Promise<void> {
    try {
        const filePath = path.join(PERSIST_DIR, 'vector_store.json');
        await fs.unlink(filePath);
        console.log('[Persistence] Cache limpo');
    } catch (error) {
        // Ignorar se arquivo não existe
    }
}
