/**
 * @layer features/rag
 * @description Motor de RAG baseado em Documentos e Vector Store
 */

import { Ollama } from 'ollama';
import { TOTVSDocumentLoader } from '../documents/totvs-loader.js';
import { VectorStore, type EmbeddingFunction } from '../documents/vector-store.js';
import type { Document } from '../documents/types.js';
import type { RAGResponse, RAGSource, LLMOptions } from './types.js';
import { formatPrompt, detectQueryType } from './prompt.js';
import { DEFAULT_LLM_OPTIONS } from './types.js';

// Configurações
const LLM_MODEL = process.env.LLM_MODEL || 'gemma3:1b';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const TOP_K_RESULTS = parseInt(process.env.TOP_K_RESULTS || '5', 10);
const CHROMA_PERSIST_DIR = process.env.CHROMA_PERSIST_DIR || './chroma_db';

/**
 * Função de embedding usando Ollama
 */
class OllamaEmbedding implements EmbeddingFunction {
    private ollama: Ollama;
    private model: string;

    constructor(model: string, host: string) {
        this.ollama = new Ollama({ host });
        this.model = model;
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        return Promise.race([promise, timeoutPromise]);
    }

    async embed(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        const batchSize = 10; // Processar 10 por vez em paralelo

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const promises = batch.map(async (text) => {
                try {
                    const response = await this.withTimeout(
                        this.ollama.embeddings({
                            model: this.model,
                            prompt: text.slice(0, 2000), // Limitar tamanho para evitar timeout
                        }),
                        30000 // 30 segundos de timeout
                    );
                    return response.embedding;
                } catch (error) {
                    console.error(`[OllamaEmbedding] Erro ao gerar embedding:`, error);
                    // Retornar embedding vazio em caso de erro
                    return new Array(768).fill(0); // Assumindo dimensão 768
                }
            });

            const batchEmbeddings = await Promise.all(promises);
            embeddings.push(...batchEmbeddings);

            console.log(`[OllamaEmbedding] Processados ${Math.min(i + batchSize, texts.length)}/${texts.length} textos`);
        }

        return embeddings;
    }

    async embedQuery(text: string): Promise<number[]> {
        try {
            const response = await this.withTimeout(
                this.ollama.embeddings({
                    model: this.model,
                    prompt: text.slice(0, 2000), // Limitar tamanho
                }),
                30000 // 30 segundos de timeout
            );
            return response.embedding;
        } catch (error) {
            console.error(`[OllamaEmbedding] Erro ao gerar embedding para query:`, error);
            throw error;
        }
    }
}

export class DocumentRAGEngine {
    private ollama: Ollama;
    private llmModel: string;
    private embeddingModel: string;
    private options: LLMOptions;
    private loader: TOTVSDocumentLoader;
    private vectorStore: VectorStore;
    private isInitialized: boolean = false;

    constructor(options: LLMOptions = DEFAULT_LLM_OPTIONS) {
        this.ollama = new Ollama({ host: OLLAMA_HOST });
        this.llmModel = LLM_MODEL;
        this.embeddingModel = EMBEDDING_MODEL;
        this.options = options;
        this.loader = new TOTVSDocumentLoader();
        this.vectorStore = new VectorStore(CHROMA_PERSIST_DIR);
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        return Promise.race([promise, timeoutPromise]);
    }

    /**
     * Inicializa o sistema: verifica modelos e configura embeddings
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log('[DocumentRAG] Inicializando sistema...');

        // Tentar carregar dados persistidos
        const loaded = await this.vectorStore.loadFromDisk();
        if (loaded) {
            console.log('[DocumentRAG] Dados carregados do cache, indexação não necessária');

            // Ainda precisa configurar embedding function para buscas
            const embeddingFn = new OllamaEmbedding(this.embeddingModel, OLLAMA_HOST);
            this.vectorStore.setEmbeddingFunction(embeddingFn);

            this.isInitialized = true;
            console.log('[DocumentRAG] Sistema inicializado com sucesso (usando cache)');
            return;
        }

        // Se não tem cache, inicializar normalmente

        // Verificar modelos
        await this.checkModels();

        // Configurar função de embedding
        const embeddingFn = new OllamaEmbedding(this.embeddingModel, OLLAMA_HOST);
        this.vectorStore.setEmbeddingFunction(embeddingFn);

        this.isInitialized = true;
        console.log('[DocumentRAG] Sistema inicializado com sucesso');
    }

    /**
     * Verifica se os modelos estão disponíveis
     */
    async checkModels(): Promise<boolean> {
        try {
            const response = await this.withTimeout(this.ollama.list(), 10000); // 10s para list
            const models = response.models.map(m => m.name);

            // Verificar LLM
            const hasLLM = models.some(m => m.includes(this.llmModel.split(':')[0]));
            if (!hasLLM) {
                console.log(`[DocumentRAG] Baixando modelo LLM: ${this.llmModel}...`);
                await this.withTimeout(this.ollama.pull({ model: this.llmModel }), 300000); // 5min para pull
            }

            // Verificar embedding model
            const hasEmbedding = models.some(m => m.includes(this.embeddingModel.split(':')[0]));
            if (!hasEmbedding) {
                console.log(`[DocumentRAG] Baixando modelo de embeddings: ${this.embeddingModel}...`);
                await this.withTimeout(this.ollama.pull({ model: this.embeddingModel }), 300000); // 5min para pull
            }

            return true;
        } catch (error) {
            console.error('[DocumentRAG] Erro ao verificar modelos:', error);
            return false;
        }
    }

    /**
     * Indexa todos os documentos
     */
    async indexDocuments(): Promise<{ indexed: number; errors: number }> {
        await this.initialize();

        console.log('[DocumentRAG] Iniciando indexação de documentos...');
        let indexed = 0;
        let errors = 0;

        try {
            const { documents: allDocs, hash } = await this.loader.loadAllDocuments();

            try {
                await this.vectorStore.addDocuments(allDocs);
                await this.vectorStore.saveWithHash(hash);
                indexed = allDocs.length;
                console.log(`[DocumentRAG] Indexados ${indexed} documentos com sucesso`);
            } catch (error) {
                console.error(`[DocumentRAG] Erro ao indexar documentos:`, error);
                errors = allDocs.length;
            } console.log(`[DocumentRAG] Indexação concluída: ${indexed} documentos, ${errors} erros`);
        } catch (error) {
            console.error('[DocumentRAG] Erro durante indexação:', error);
        }

        return { indexed, errors };
    }

    /**
     * Busca documentos relevantes
     */
    async retrieve(query: string, topK: number = TOP_K_RESULTS): Promise<Document[]> {
        await this.initialize();

        console.log(`[DocumentRAG] Buscando documentos para query: "${query}"`);
        const results = await this.vectorStore.search(query, topK);
        console.log(`[DocumentRAG] Encontrados ${results.length} documentos relevantes`);

        if (results.length > 0 && results[0]) {
            const topResult = results[0];
            const distance = topResult.distance !== null ? topResult.distance.toFixed(4) : 'N/A';
            console.log(`[DocumentRAG] Top resultado - Distância: ${distance}, Fonte: ${topResult.metadata.source}`);
        }

        return results.map(r => ({ content: r.content, metadata: r.metadata }));
    }

    /**
     * Formata documentos como contexto para o LLM
     */
    private formatContext(documents: Document[]): string {
        if (documents.length === 0) return '';

        const parts = documents.map((doc, index) => {
            const source = doc.metadata.title || doc.metadata.source;
            return `### Documento ${index + 1}: ${source}\n\n${doc.content}`;
        });

        return parts.join('\n\n---\n\n');
    }

    /**
     * Formata o prompt para o LLM usando templates especializados
     */
    private formatPrompt(context: string, question: string): string {
        const queryType = detectQueryType(question);
        return formatPrompt(context, question, queryType);
    }

    async generate(query: string, context: string): Promise<string> {
        const prompt = this.formatPrompt(context, query);

        console.log(`[DocumentRAG] Prompt length: ${prompt.length} chars`);
        console.log(`[DocumentRAG] Context preview: ${context.substring(0, 500)}...`);
        console.log(`[DocumentRAG] Full prompt: ${prompt}`);

        try {
            const response = await this.withTimeout(
                this.ollama.generate({
                    model: this.llmModel,
                    prompt,
                    options: {
                        temperature: this.options.temperature,
                        top_p: this.options.topP,
                        num_predict: this.options.numPredict,
                    },
                }),
                60000 // 60 segundos de timeout para geração
            );

            console.log(`[DocumentRAG] LLM Response received: "${response.response?.substring(0, 200)}..."`);

            if (!response.response || response.response.trim() === '') {
                return 'Não encontrei a informação nos documentos disponíveis.';
            }

            return response.response;
        } catch (error) {
            console.error('[DocumentRAG] Erro ao gerar resposta:', error);
            return `Erro ao gerar resposta. Verifique se o Ollama está rodando.`;
        }
    }

    /**
     * Gera resposta em streaming
     */
    async *generateStream(query: string, context: string): AsyncGenerator<string> {
        const prompt = this.formatPrompt(context, query);

        try {
            const stream = await this.withTimeout(
                this.ollama.generate({
                    model: this.llmModel,
                    prompt,
                    stream: true,
                    options: {
                        temperature: this.options.temperature,
                        top_p: this.options.topP,
                        num_predict: this.options.numPredict,
                    },
                }),
                60000 // 60 segundos de timeout
            );

            for await (const chunk of stream) {
                yield chunk.response;
            }
        } catch (error) {
            console.error('[DocumentRAG] Erro no streaming:', error);
            yield `Erro ao gerar resposta. Verifique se o Ollama está rodando.`;
        }
    }

    /**
     * Gera resposta em streaming com contexto fornecido diretamente
     * Usado para consultas de turmas onde o contexto vem das APIs em tempo real
     */
    async *generateStreamWithContext(query: string, context: string): AsyncGenerator<string> {
        await this.initialize();

        const prompt = this.formatPrompt(context, query);
        console.log(`[DocumentRAG] Gerando resposta com contexto direto (${context.length} chars)`);

        try {
            const stream = await this.withTimeout(
                this.ollama.generate({
                    model: this.llmModel,
                    prompt,
                    stream: true,
                    options: {
                        temperature: this.options.temperature,
                        top_p: this.options.topP,
                        num_predict: this.options.numPredict,
                    },
                }),
                60000 // 60 segundos de timeout
            );

            let buffer = '';
            const minChunkSize = 50; // Mínimo de caracteres antes de enviar chunk

            for await (const chunk of stream) {
                buffer += chunk.response;

                // Enviar chunk quando atingir tamanho mínimo ou encontrar quebra de linha/pontuação
                if (buffer.length >= minChunkSize ||
                    buffer.includes('\n') ||
                    buffer.includes('.') ||
                    buffer.includes('!') ||
                    buffer.includes('?') ||
                    buffer.includes(':') ||
                    buffer.includes(';')) {

                    // Se terminou com pontuação, enviar o chunk completo
                    if (buffer.includes('\n') || buffer.includes('.') || buffer.includes('!') || buffer.includes('?') || buffer.includes(':') || buffer.includes(';')) {
                        yield buffer;
                        buffer = '';
                    } else if (buffer.length >= minChunkSize) {
                        // Encontrar último espaço para não cortar palavras
                        const lastSpaceIndex = buffer.lastIndexOf(' ');
                        if (lastSpaceIndex > minChunkSize / 2) {
                            yield buffer.substring(0, lastSpaceIndex + 1);
                            buffer = buffer.substring(lastSpaceIndex + 1);
                        } else {
                            yield buffer;
                            buffer = '';
                        }
                    }
                }
            }

            // Enviar qualquer conteúdo restante no buffer
            if (buffer.trim()) {
                yield buffer;
            }
        } catch (error) {
            console.error('[DocumentRAG] Erro no streaming com contexto:', error);
            yield `Erro ao gerar resposta. Verifique se o Ollama está rodando.`;
        }
    }

    /**
     * Pipeline completo de RAG
     */
    async query(question: string): Promise<RAGResponse> {
        console.log(`[DocumentRAG] Processing query: "${question}"`);
        await this.initialize();

        // 1. Buscar documentos relevantes
        const documents = await this.retrieve(question);

        if (documents.length === 0) {
            return {
                answer: 'Não encontrei documentos relevantes para sua pergunta. Verifique se há documentos indexados.',
                sources: [],
                query: question,
            };
        }

        // 2. Formatar contexto
        const context = this.formatContext(documents);
        console.log(`[DocumentRAG] Context length: ${context.length} chars`);
        console.log(`[DocumentRAG] Number of documents: ${documents.length}`);

        // 3. Gerar resposta
        const answer = await this.generate(question, context);

        // 4. Preparar fontes
        const sources: RAGSource[] = documents.map((doc) => ({
            source: doc.metadata.title || doc.metadata.source,
            endpoint: doc.metadata.source,
            success: true,
        }));

        return {
            answer,
            sources,
            query: question,
        };
    }

    /**
     * Pipeline RAG com streaming
     */
    async *queryStream(question: string): AsyncGenerator<string> {
        await this.initialize();

        // 1. Buscar documentos relevantes
        const documents = await this.retrieve(question);

        if (documents.length === 0) {
            yield 'Não encontrei documentos relevantes para sua pergunta. Verifique se há documentos indexados.';
            return;
        }

        // 2. Formatar contexto
        const context = this.formatContext(documents);

        // 3. Gerar resposta em streaming
        yield* this.generateStream(question, context);
    }

    /**
     * Retorna apenas as fontes para uma query
     */
    async getSourcesForQuery(question: string): Promise<RAGSource[]> {
        await this.initialize();

        const documents = await this.retrieve(question);

        return documents.map((doc) => ({
            source: doc.metadata.title || doc.metadata.source,
            endpoint: doc.metadata.source,
            success: true,
            dataPreview: doc.content.slice(0, 200) + (doc.content.length > 200 ? '...' : ''),
        }));
    }

    /**
     * Verifica status do sistema
     */
    async getStatus(): Promise<Record<string, any>> {
        try {
            const models = await this.withTimeout(this.ollama.list(), 10000);
            const stats = this.vectorStore.getStats();

            return {
                initialized: this.isInitialized,
                documents: stats.totalDocuments,
                ollama: true,
                llmModel: this.llmModel,
                embeddingModel: this.embeddingModel,
                availableModels: models.models.map(m => m.name),
            };
        } catch (error) {
            return {
                initialized: this.isInitialized,
                documents: 0,
                ollama: false,
                error: String(error),
            };
        }
    }

    /**
     * Obtém estatísticas do vector store
     */
    getStats(): any {
        return this.vectorStore.getStats();
    }
}
