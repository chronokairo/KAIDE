/**
 * @layer features/rag
 * @description Motor de RAG (Retrieval Augmented Generation)
 * Combina consulta à base Supabase (ops_documents) com geração via Ollama
 */

import { Ollama } from 'ollama';
import type { RAGResponse, RAGSource, LLMOptions } from './types.js';
import { DEFAULT_LLM_OPTIONS } from './types.js';
import { formatPrompt, detectQueryType } from './prompt.js';
import { formatApiData } from './prompt.js';
import { getSupabase, PROD_ORGANIZATION_ID } from '../../shared/lib/supabase.js';

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
  /**
   * Consulta a base de conhecimento Supabase (ops_documents, isolada por organização)
   */
  async retrieve(query: string): Promise<any[]> {
    const supabase = getSupabase();
    const organizationId = process.env.CONTROL_PLANE_ORGANIZATION_ID || PROD_ORGANIZATION_ID;
    const terms = query
      .split(/\s+/)
      .map((t) => t.replace(/[%_,]/g, '').trim())
      .filter((t) => t.length > 2)
      .slice(0, 4);
    if (!terms.length) return [];

    const orFilter = terms
      .map((t) => `title.ilike.%${t}%,content.ilike.%${t}%`)
      .join(',');

    const { data, error } = await supabase
      .from('ops_documents')
      .select('id, title, content, category')
      .eq('organization_id', organizationId)
      .or(orFilter)
      .limit(10);

    if (error || !data?.length) return [];

    return (data as Array<{ id: string; title: string | null; content: string | null; category: string | null }>).map(
      (row) => ({
        source: 'supabase:ops_documents',
        endpoint: `ops_documents/${row.id}`,
        data: {
          title: row.title,
          category: row.category,
          excerpt: (row.content || '').slice(0, 2000),
        },
        success: true,
      })
    );
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
    // 1. Consultar a base de conhecimento
    const apiResults = await this.retrieve(question);

    if (!apiResults.length) {
      return {
        answer: 'Não foi possível obter dados na base de conhecimento. Verifique se o Supabase está acessível.',
        sources: [],
        query: question,
      };
    }

    // 2. Formatar contexto
    const context = this.formatContext(apiResults);

    if (!context) {
      return {
        answer: 'Não encontrei informações relevantes para sua pergunta na base de conhecimento.',
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
    // 1. Consultar a base de conhecimento
    const apiResults = await this.retrieve(question);

    if (!apiResults.length) {
      yield 'Não foi possível obter dados na base de conhecimento. Verifique se o Supabase está acessível.';
      return;
    }

    // 2. Formatar contexto
    const context = this.formatContext(apiResults);

    if (!context) {
      yield 'Não encontrei informações relevantes para sua pergunta na base de conhecimento.';
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
   * Verifica o status de conexão com a base Supabase e o LLM
   */
  async getApiStatus(): Promise<Record<string, boolean>> {
    const supabase = getSupabase();

    try {
      const { error } = await supabase.from('ops_documents').select('id').limit(1);
      const llmAvailable = await this.checkLLMModel();

      return {
        supabase: !error,
        fromCache: false,
        ollama: llmAvailable,
      };
    } catch (error) {
      return {
        supabase: false,
        fromCache: false,
        ollama: false
      };
    }
  }
}
