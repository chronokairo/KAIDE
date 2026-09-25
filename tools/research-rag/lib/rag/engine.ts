/**
 * RAG Engine (Retrieval Augmented Generation)
 * Combines API queries with Ollama generation
 */

import { Ollama } from 'ollama';
import type { RAGResponse, RAGSource, LLMOptions } from './types';
import { DEFAULT_LLM_OPTIONS } from './types';
import { formatPrompt, detectQueryType } from './prompt';
import { formatApiData } from './prompt';

// Configurações
const LLM_MODEL = process.env.LLM_MODEL || 'gemma3:1b';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const TOP_K_RESULTS = parseInt(process.env.TOP_K_RESULTS || '5', 10);

export class RAGEngine {
  private ollama: Ollama;
  private llmModel: string;
  private options: LLMOptions;

  constructor(options: LLMOptions = DEFAULT_LLM_OPTIONS) {
    this.ollama = new Ollama({ host: OLLAMA_HOST });
    this.llmModel = LLM_MODEL;
    this.options = options;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Verifica se o modelo LLM está disponível
   */
  async checkLLMModel(): Promise<boolean> {
    try {
      const response = await this.withTimeout(this.ollama.list(), 10000);
      const hasModel = response.models.some(m => m.name.includes(this.llmModel.split(':')[0]));

      if (!hasModel) {
        console.log(`[RAGEngine] Modelo ${this.llmModel} não encontrado. Baixando...`);
        await this.withTimeout(this.ollama.pull({ model: this.llmModel }), 300000);
      }

      return true;
    } catch (error) {
      console.error('[RAGEngine] Erro ao verificar modelo LLM:', error);
      return false;
    }
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
        60000
      );

      return response.response;
    } catch (error) {
      console.error('[RAGEngine] Erro ao gerar resposta:', error);
      return `Erro ao gerar resposta: ${error}. Verifique se o Ollama está rodando.`;
    }
  }

  /**
   * Gera resposta em streaming
   */
  async *generateStream(query: string, context: string): AsyncGenerator<string> {
    const queryType = detectQueryType(query);
    const prompt = formatPrompt(context, query, queryType);

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
        60000
      );

      for await (const chunk of stream) {
        yield chunk.response;
      }
    } catch (error) {
      console.error('[RAGEngine] Erro no streaming:', error);
      yield `Erro ao gerar resposta: ${error}. Verifique se o Ollama está rodando.`;
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
