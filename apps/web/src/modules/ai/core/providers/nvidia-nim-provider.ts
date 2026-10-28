import type { ILlmProvider, LlmStreamChunk } from './llm-provider';
import { getNvidiaNimConfig } from '@/modules/ai/core/services/nvidia-nim-config.service';

export interface NvidiaNimProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  organizationId?: string;
}

export class NvidiaNimLlmProvider implements ILlmProvider {
  name = 'nvidia-nim';
  private config: Required<NvidiaNimProviderConfig>;
  private initialized = false;

  constructor(config?: NvidiaNimProviderConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.NEXT_PUBLIC_NVIDIA_NIM_API_KEY || process.env.NVIDIA_NIM_API_KEY || '',
      baseUrl: (config?.baseUrl || process.env.NEXT_PUBLIC_NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, ''),
      model: config?.model || process.env.NEXT_PUBLIC_NVIDIA_NIM_MODEL || 'meta/llama-3.3-70b-instruct',
      temperature: config?.temperature ?? 0.6,
      maxTokens: config?.maxTokens ?? 2048,
      systemPrompt: config?.systemPrompt || 'Você é o assistente inteligente Chronokairo ERP potencializado por NVIDIA NIM.',
      organizationId: config?.organizationId || '',
    };
  }

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window);
  }

  private get proxyUrl(): string {
    return '/api/ai/proxy';
  }

  async initializeFromOrg(): Promise<void> {
    if (this.initialized) return;
    if (this.config.organizationId && typeof window !== 'undefined') {
      const orgConfig = await getNvidiaNimConfig(this.config.organizationId);
      if (orgConfig) {
        if (orgConfig.api_key) this.config.apiKey = orgConfig.api_key;
        if (orgConfig.base_url) this.config.baseUrl = orgConfig.base_url.replace(/\/+$/, '');
        if (orgConfig.model) this.config.model = orgConfig.model;
      }
    }
    this.initialized = true;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.isBrowser) {
      const { supabase } = await import('@/shared/supabase');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      return { Authorization: `Bearer ${token}` };
    }
    return { Authorization: `Bearer ${this.config.apiKey}` };
  }

  private getTargetUrl(): string {
    if (this.isBrowser) return this.proxyUrl;
    return `${this.config.baseUrl}/chat/completions`;
  }

  private buildMessages(prompt: string, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }) {
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    const systemPrompt = context?.systemPrompt || this.config.systemPrompt;
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (context?.messages && context.messages.length > 0) {
      messages.push(...context.messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })));
    }

    messages.push({ role: 'user', content: prompt });
    return messages;
  }

  private validateApiKey(): void {
    if (!this.isBrowser && (!this.config.apiKey || this.config.apiKey === 'demo-mock' || this.config.apiKey.startsWith('demo-'))) {
      throw new Error(
        'NVIDIA NIM API Key não configurada. ' +
        'Configure em Configurações > Integrações > NVIDIA NIM.'
      );
    }
  }

  private handleApiError(status: number, errorText: string): Error {
    switch (status) {
      case 401:
        return new Error('NVIDIA NIM: API Key inválida ou expirada. Verifique em Configurações > Integrações > NVIDIA NIM.');
      case 403:
        return new Error('NVIDIA NIM: Acesso negado. A API Key não tem permissão para este modelo.');
      case 404:
        return new Error(`NVIDIA NIM: Modelo "${this.config.model}" não encontrado. Verifique nas configurações.`);
      case 429:
        return new Error('NVIDIA NIM: Limite de taxa excedido. Aguarde alguns instantes e tente novamente.');
      case 500: case 502: case 503:
        return new Error('NVIDIA NIM: Servidor indisponível no momento. Tente novamente.');
      default:
        return new Error(`NVIDIA NIM API error (${status}): ${errorText}`);
    }
  }

  private handleNetworkError(error: unknown): Error {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return new Error(
        'Não foi possível conectar ao servidor NVIDIA NIM. ' +
        'Verifique sua conexão e tente novamente. Se persistir, verifique a API key em Configurações > Integrações > NVIDIA NIM.'
      );
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Error('Requisição cancelada pelo usuário.');
    }
    return error instanceof Error
      ? new Error(`NVIDIA NIM: Erro de conexão — ${error.message}`)
      : new Error('NVIDIA NIM: Erro de conexão desconhecido.');
  }

  async generateResponse(
    prompt: string,
    context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }
  ): Promise<string> {
    await this.initializeFromOrg();
    this.validateApiKey();

    const messages = this.buildMessages(prompt, context);
    const targetUrl = this.getTargetUrl();
    const headers = await this.getAuthHeaders();

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        }),
      });
    } catch (error) {
      throw this.handleNetworkError(error);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw this.handleApiError(response.status, errorText);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async streamResponse(
    prompt: string,
    onChunk: (chunk: LlmStreamChunk) => void,
    context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }
  ): Promise<void> {
    await this.initializeFromOrg();
    this.validateApiKey();

    const messages = this.buildMessages(prompt, context);
    const targetUrl = this.getTargetUrl();
    const headers = await this.getAuthHeaders();

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true,
        }),
      });
    } catch (error) {
      const networkError = this.handleNetworkError(error);
      onChunk({ type: 'error', content: networkError.message });
      throw networkError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = this.handleApiError(response.status, errorText);
      onChunk({ type: 'error', content: error.message });
      throw error;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const error = new Error('NVIDIA NIM: ReadableStream não suportado no ambiente.');
      onChunk({ type: 'error', content: error.message });
      throw error;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          onChunk({ type: 'completed' });
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk({ type: 'text_delta', content: delta });
            }
          } catch {
            // Chunk incompleto ou malformado ignorado
          }
        }
      }
    }

    onChunk({ type: 'completed' });
  }
}

export function createNvidiaNimProvider(config?: NvidiaNimProviderConfig): NvidiaNimLlmProvider {
  return new NvidiaNimLlmProvider(config);
}
