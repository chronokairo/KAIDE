/**
 * @layer features/rag
 * @description Motor de RAG (Retrieval Augmented Generation)
 * Combina consulta às APIs do servidor com geração via LLM provider
 */

import type { RAGResponse, RAGSource, LLMOptions } from './types.js';
import { DEFAULT_LLM_OPTIONS } from './types.js';
import { formatPrompt, detectQueryType } from './prompt.js';
import { formatApiData } from './prompt.js';
import { createLLMProvider, type LLMProvider, type LLMProviderType } from './llm-provider.js';
import { LLM_MODEL, OLLAMA_HOST, LMSTUDIO_HOST, LLM_PROVIDER as LLM_PROVIDER_ENV } from '../../shared/config/index.js';

const TOP_K_RESULTS = parseInt(process.env.TOP_K_RESULTS || '5', 10);

export class RAGEngine {
  private llmProvider: LLMProvider;
  private options: LLMOptions;

  constructor(options: LLMOptions = DEFAULT_LLM_OPTIONS) {
    const providerType = LLM_PROVIDER_ENV as LLMProviderType;
    const providerHost = providerType === 'lmstudio' ? LMSTUDIO_HOST : OLLAMA_HOST;
    this.llmProvider = createLLMProvider(providerType, LLM_MODEL, providerHost);
    this.options = options;
  }

  /**
   * Verifica se o modelo LLM está disponível
   */
  async checkLLMModel(): Promise<boolean> {
    return this.llmProvider.checkModel();
  }

  /**
   * Formata os resultados das APIs como contexto
   */
  private formatContext(apiResults: any[]): string {
    const contextParts: string[] = [];

    for (const result of apiResults) {
      if (result.success && result.data) {
        const formatted = formatApiData(
          result.data,
          result.source,
          result.endpoint
        );
        if (formatted) {
          contextParts.push(formatted);
        }
      }
    }

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Consulta as APIs relevantes para a query
   */
  async retrieve(query: string): Promise<any[]> {
    return [];
  }

  /**
   * Gera resposta usando o LLM com o contexto fornecido
   */
  async generate(query: string, context: string): Promise<string> {
    const queryType = detectQueryType(query);
    const prompt = formatPrompt(context, query, queryType);

    try {
      return await this.llmProvider.generate(prompt, {
        temperature: this.options.temperature,
        topP: this.options.topP,
        numPredict: this.options.numPredict,
      });
    } catch (error) {
      console.error('[RAGEngine] Erro ao gerar resposta:', error);
      return `Erro ao gerar resposta: ${error}. Verifique se o ${this.llmProvider.getProviderName()} está rodando.`;
    }
  }

  /**
   * Gera resposta em streaming
   */
  async *generateStream(query: string, context: string): AsyncGenerator<string> {
    const queryType = detectQueryType(query);
    const prompt = formatPrompt(context, query, queryType);

    try {
      yield* this.llmProvider.generateStream(prompt, {
        temperature: this.options.temperature,
        topP: this.options.topP,
        numPredict: this.options.numPredict,
      });
    } catch (error) {
      console.error('[RAGEngine] Erro no streaming:', error);
      yield `Erro ao gerar resposta: ${error}. Verifique se o ${this.llmProvider.getProviderName()} está rodando.`;
    }
  }

  /**
   * Pipeline completo de RAG: retrieve + generate
   */
  async query(question: string): Promise<RAGResponse> {
    // 1. Consultar APIs relevantes
    const apiResults = await this.retrieve(question);

    if (!apiResults.length) {
      return {
        answer: 'Não foi possível obter dados das APIs. Verifique se o servidor está online.',
        sources: [],
        query: question,
      };
    }

    // 2. Formatar contexto
    const context = this.formatContext(apiResults);

    if (!context) {
      return {
        answer: 'Não encontrei informações relevantes para sua pergunta nas APIs disponíveis.',
        sources: [],
        query: question,
      };
    }

    // 3. Gerar resposta
    const answer = await this.generate(question, context);

    // 4. Preparar fontes
    const sources: RAGSource[] = apiResults.map((result) => ({
      source: result.source,
      endpoint: result.endpoint,
      success: result.success,
    }));

    return {
      answer,
      sources,
      query: question,
    };
  }

  /**
   * Pipeline RAG com streaming da resposta
   */
  async *queryStream(question: string): AsyncGenerator<string> {
    // 1. Consultar APIs relevantes
    const apiResults = await this.retrieve(question);

    if (!apiResults.length) {
      yield 'Não foi possível obter dados das APIs. Verifique se o servidor está online.';
      return;
    }

    // 2. Formatar contexto
    const context = this.formatContext(apiResults);

    if (!context) {
      yield 'Não encontrei informações relevantes para sua pergunta nas APIs disponíveis.';
      return;
    }

    // 3. Gerar resposta em streaming
    yield* this.generateStream(question, context);
  }

  /**
   * Retorna apenas as fontes para uma query (sem gerar resposta)
   */
  async getSourcesForQuery(question: string): Promise<RAGSource[]> {
    const apiResults = await this.retrieve(question);

    return apiResults.map((result) => ({
      source: result.source,
      endpoint: result.endpoint,
      success: result.success,
      dataPreview: result.data
        ? String(result.data).slice(0, 200) + (String(result.data).length > 200 ? '...' : '')
        : undefined,
    }));
  }

  /**
   * Verifica o status de conexão com as APIs e LLM
   */
  async getApiStatus(): Promise<Record<string, boolean>> {
    try {
      const llmAvailable = await this.checkLLMModel();
      return { ollama: llmAvailable };
    } catch (error) {
      return { ollama: false };
    }
  }
}
