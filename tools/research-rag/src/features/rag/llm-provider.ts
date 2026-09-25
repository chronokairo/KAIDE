/**
 * @layer features/rag
 * @description Abstração de provedor LLM — suporta Ollama e LM Studio (OpenAI-compatível)
 */

import { Ollama } from 'ollama';

export interface LLMGenerateOptions {
  temperature?: number;
  topP?: number;
  numPredict?: number;
}

export interface LLMProvider {
  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
  generateStream(prompt: string, options?: LLMGenerateOptions): AsyncGenerator<string>;
  checkModel(): Promise<boolean>;
  getProviderName(): string;
}

// ---------------------------------------------------------------------------
// Ollama Provider
// ---------------------------------------------------------------------------

export class OllamaProvider implements LLMProvider {
  private ollama: Ollama;
  private model: string;

  constructor(host: string, model: string) {
    this.ollama = new Ollama({ host });
    this.model = model;
  }

  getProviderName(): string {
    return `ollama (${this.model})`;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  async checkModel(): Promise<boolean> {
    try {
      const response = await this.withTimeout(this.ollama.list(), 10000);
      const hasModel = response.models.some(m =>
        m.name.includes(this.model.split(':')[0])
      );

      if (!hasModel) {
        console.log(`[OllamaProvider] Baixando modelo ${this.model}...`);
        await this.withTimeout(this.ollama.pull({ model: this.model }), 300000);
      }

      return true;
    } catch (error) {
      console.error('[OllamaProvider] Erro ao verificar modelo:', error);
      return false;
    }
  }

  async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<string> {
    const response = await this.withTimeout(
      this.ollama.generate({
        model: this.model,
        prompt,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          num_predict: options.numPredict,
        },
      }),
      60000
    );
    return response.response;
  }

  async *generateStream(prompt: string, options: LLMGenerateOptions = {}): AsyncGenerator<string> {
    const stream = await this.withTimeout(
      this.ollama.generate({
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          num_predict: options.numPredict,
        },
      }),
      60000
    );

    for await (const chunk of stream) {
      yield chunk.response;
    }
  }
}

// ---------------------------------------------------------------------------
// LM Studio Provider (OpenAI-compatible API)
// ---------------------------------------------------------------------------

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
    delta?: { content?: string };
    finish_reason?: string;
  }>;
}

export class LMStudioProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(host: string, model: string) {
    this.baseUrl = host.replace(/\/$/, '');
    this.model = model;
  }

  getProviderName(): string {
    return `lmstudio (${this.model})`;
  }

  async checkModel(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn('[LMStudioProvider] Não foi possível listar modelos:', response.status);
        return false;
      }

      const data = await response.json() as { data?: Array<{ id: string }> };
      const models = data.data ?? [];
      const found = models.some(m => m.id.includes(this.model.split(':')[0]));

      if (!found && models.length > 0) {
        console.warn(
          `[LMStudioProvider] Modelo "${this.model}" não encontrado. Modelos disponíveis: ${models.map(m => m.id).join(', ')}`
        );
      }

      return true; // LM Studio define o modelo ativo pela UI, não pelo cliente
    } catch (error) {
      console.error('[LMStudioProvider] Erro ao conectar ao LM Studio:', error);
      return false;
    }
  }

  private buildMessages(prompt: string): OpenAIChatMessage[] {
    return [{ role: 'user', content: prompt }];
  }

  async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildMessages(prompt),
        temperature: options.temperature ?? 0.3,
        top_p: options.topP ?? 0.9,
        max_tokens: options.numPredict ?? 2048,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LM Studio API error ${response.status}: ${text}`);
    }

    const data = await response.json() as OpenAIChatResponse;
    return data.choices[0]?.message?.content ?? '';
  }

  async *generateStream(prompt: string, options: LLMGenerateOptions = {}): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildMessages(prompt),
        temperature: options.temperature ?? 0.3,
        top_p: options.topP ?? 0.9,
        max_tokens: options.numPredict ?? 2048,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`LM Studio API error ${response.status}: ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data) as OpenAIChatResponse;
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // linha incompleta, continuar
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type LLMProviderType = 'ollama' | 'lmstudio';

export function createLLMProvider(
  providerType: LLMProviderType,
  model: string,
  host: string
): LLMProvider {
  if (providerType === 'lmstudio') {
    console.log(`[LLMProvider] Usando LM Studio em ${host}, modelo: ${model}`);
    return new LMStudioProvider(host, model);
  }

  console.log(`[LLMProvider] Usando Ollama em ${host}, modelo: ${model}`);
  return new OllamaProvider(host, model);
}
