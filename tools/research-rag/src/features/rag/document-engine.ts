/**
 * @layer features/rag
 * @description Motor de RAG baseado em Documentos e Vector Store
 */

import { Ollama } from 'ollama';
import { DocumentLoader } from '../documents/loader.js';
import { VectorStore, type EmbeddingFunction } from '../documents/vector-store.js';
import type { Document } from '../documents/types.js';
import type { RAGResponse, RAGSource, LLMOptions } from './types.js';
import { formatPrompt, detectQueryType } from './prompt.js';
import { DEFAULT_LLM_OPTIONS } from './types.js';
import { GlmOcrService } from '../ocr/glm-ocr.js';
import { createLLMProvider, type LLMProvider, type LLMProviderType } from './llm-provider.js';
import { LLM_MODEL, OLLAMA_HOST, LMSTUDIO_HOST, LLM_PROVIDER as LLM_PROVIDER_ENV } from '../../shared/config/index.js';
import { HeuristicReranker, type Reranker } from './reranker.js';
import { ConversationDatabase } from '../../shared/lib/database.js';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
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
    private llmProvider: LLMProvider;
    private llmModel: string;
    private embeddingModel: string;
    private options: LLMOptions;
    private loader: DocumentLoader;
    private vectorStore: VectorStore;
    private reranker: Reranker;
    private customPrompts: any = {};
    private isInitialized: boolean = false;

    constructor(options: LLMOptions = DEFAULT_LLM_OPTIONS) {
        this.ollama = new Ollama({ host: OLLAMA_HOST });
        const providerType = LLM_PROVIDER_ENV as LLMProviderType;
        const providerHost = providerType === 'lmstudio' ? LMSTUDIO_HOST : OLLAMA_HOST;
        this.llmProvider = createLLMProvider(providerType, LLM_MODEL, providerHost);
        this.llmModel = LLM_MODEL;
        this.embeddingModel = EMBEDDING_MODEL;
        this.options = options;
        this.loader = new DocumentLoader();
        this.vectorStore = new VectorStore(CHROMA_PERSIST_DIR);
        this.reranker = new HeuristicReranker();
    }

    /**
     * Configura OCR no loader se a chave de API estiver disponível
     */
    private configureOcr(): void {
      const ocr = new GlmOcrService();
      if (ocr.isConfigured) {
        this.loader.setOcrService(ocr);
        console.log('[DocumentRAG] GLM-OCR configurado para processamento de imagens');
      } else {
        console.log('[DocumentRAG] GLM-OCR não configurado (ZHIPU_API_KEY ausente)');
      }
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

        // Carregar modelo e prompts das configurações
        const settings = await ConversationDatabase.getSettings();
        if (settings.prompts) {
            this.customPrompts = settings.prompts;
        }

        if (settings.llmModel && settings.llmModel !== this.llmModel) {
            this.llmModel = settings.llmModel;
            console.log(`[DocumentRAG] Usando modelo: ${this.llmModel}`);
            
            // Recriar provider com novo modelo
            const providerType = LLM_PROVIDER_ENV as LLMProviderType;
            const providerHost = providerType === 'lmstudio' ? LMSTUDIO_HOST : OLLAMA_HOST;
            this.llmProvider = createLLMProvider(providerType, this.llmModel, providerHost);
        }

    // Tentar carregar dados persistidos
    const loaded = await this.vectorStore.loadFromDisk();
    if (loaded) {
      console.log('[DocumentRAG] Dados carregados do cache, indexação não necessária');

      // Configurar OCR
      this.configureOcr();

      // Ainda precisa configurar embedding function para buscas
      const embeddingFn = new OllamaEmbedding(this.embeddingModel, OLLAMA_HOST);
      this.vectorStore.setEmbeddingFunction(embeddingFn);

      this.isInitialized = true;
      console.log('[DocumentRAG] Sistema inicializado com sucesso (usando cache)');
      return;
    }

    // Se não tem cache, inicializar normalmente

    // Configurar OCR se disponível
    this.configureOcr();

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
        // Verificar LLM provider
        const llmOk = await this.llmProvider.checkModel();
        if (!llmOk) {
            console.error('[DocumentRAG] LLM provider indisponível:', this.llmProvider.getProviderName());
        }

        // Embeddings sempre via Ollama (independente do provider LLM)
        try {
            const response = await this.withTimeout(this.ollama.list(), 10000);
            const models = response.models.map(m => m.name);
            const hasEmbedding = models.some(m => m.includes(this.embeddingModel.split(':')[0]));
            if (!hasEmbedding) {
                console.log(`[DocumentRAG] Baixando modelo de embeddings: ${this.embeddingModel}...`);
                await this.withTimeout(this.ollama.pull({ model: this.embeddingModel }), 300000);
            }
        } catch (error) {
            console.error('[DocumentRAG] Erro ao verificar modelo de embeddings:', error);
            return false;
        }

        return llmOk;
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
            const allDocs = await this.loader.loadAllDocuments();

            try {
                await this.vectorStore.addDocuments(allDocs);
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
     * Busca documentos relevantes (Híbrida: Vetorial + Palavras-chave + Reranking)
     */
    async retrieve(query: string, topK: number = TOP_K_RESULTS): Promise<Document[]> {
        await this.initialize();

        console.log(`[DocumentRAG] Buscando documentos (híbrido) para query: "${query}"`);
        // Recuperar um pouco mais para o reranker ter o que trabalhar
        const initialResults = await this.vectorStore.hybridSearch(query, topK * 2);
        
        if (initialResults.length === 0) return [];

        // Converter SearchResult para Document
        const initialDocs = initialResults.map(r => ({ content: r.content, metadata: r.metadata }));

        // Reranking
        console.log(`[DocumentRAG] Aplicando reranking em ${initialDocs.length} documentos`);
        const rerankedDocs = await this.reranker.rerank(query, initialDocs);

        console.log(`[DocumentRAG] Reranking concluído. Retornando top ${topK}`);
        return rerankedDocs.slice(0, topK);
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
        return formatPrompt(context, question, queryType, this.customPrompts);
    }

    async generate(query: string, context: string): Promise<string> {
        const prompt = this.formatPrompt(context, query);

        console.log(`[DocumentRAG] Prompt length: ${prompt.length} chars`);
        console.log(`[DocumentRAG] Context preview: ${context.substring(0, 500)}...`);
        console.log(`[DocumentRAG] Provider: ${this.llmProvider.getProviderName()}`);

        try {
            const answer = await this.llmProvider.generate(prompt, {
                temperature: this.options.temperature,
                topP: this.options.topP,
                numPredict: this.options.numPredict,
            });

            console.log(`[DocumentRAG] LLM Response received: "${answer?.substring(0, 200)}..."`);

            if (!answer || answer.trim() === '') {
                return 'Não encontrei a informação nos documentos disponíveis.';
            }

            return answer;
        } catch (error) {
            console.error('[DocumentRAG] Erro ao gerar resposta:', error);
            return `Erro ao gerar resposta. Verifique se o ${this.llmProvider.getProviderName()} está rodando.`;
        }
    }

    /**
     * Gera resposta em streaming
     */
    async *generateStream(query: string, context: string): AsyncGenerator<string> {
        const prompt = this.formatPrompt(context, query);

        try {
            yield* this.llmProvider.generateStream(prompt, {
                temperature: this.options.temperature,
                topP: this.options.topP,
                numPredict: this.options.numPredict,
            });
        } catch (error) {
            console.error('[DocumentRAG] Erro no streaming:', error);
            yield `Erro ao gerar resposta. Verifique se o ${this.llmProvider.getProviderName()} está rodando.`;
        }
    }

    /**
     * Gera resposta em streaming com contexto fornecido diretamente
     * Usado para consultas de turmas onde o contexto vem das APIs em tempo real
     */
    async *generateStreamWithContext(query: string, context: string): AsyncGenerator<string> {
        await this.initialize();

        const prompt = this.formatPrompt(context, query);
        console.log(`[DocumentRAG] Gerando resposta com contexto direto (${context.length} chars), provider: ${this.llmProvider.getProviderName()}`);

        try {
            const stream = this.llmProvider.generateStream(prompt, {
                temperature: this.options.temperature,
                topP: this.options.topP,
                numPredict: this.options.numPredict,
            });

            let buffer = '';
            const minChunkSize = 50; // Mínimo de caracteres antes de enviar chunk

            for await (const chunk of stream) {
                buffer += chunk;

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
            yield `Erro ao gerar resposta. Verifique se o ${this.llmProvider.getProviderName()} está rodando.`;
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
        const stats = this.vectorStore.getStats();
        const providerOk = await this.llmProvider.checkModel().catch(() => false);

        try {
            const models = await this.withTimeout(this.ollama.list(), 10000);
            return {
                initialized: this.isInitialized,
                documents: stats.totalDocuments,
                llmProvider: this.llmProvider.getProviderName(),
                llmAvailable: providerOk,
                llmModel: this.llmModel,
                embeddingModel: this.embeddingModel,
                availableModels: models.models.map(m => m.name),
            };
        } catch {
            return {
                initialized: this.isInitialized,
                documents: stats.totalDocuments,
                llmProvider: this.llmProvider.getProviderName(),
                llmAvailable: providerOk,
                llmModel: this.llmModel,
                embeddingModel: this.embeddingModel,
                availableModels: [],
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
