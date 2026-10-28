import type { AiChatGateway, AiChatMessage, AiProvider, AiThinkingLevel, AiToolDefinition, AiToolResponse, AiUsageDTO } from '../../core/application/ports/out/IGateways';

export class NativeAiChatGateway implements AiChatGateway {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  private readonly modelCache = new Map<AiProvider, { expiresAt: number; models: string[] }>();

  // Reexecuta a chamada em erros transitórios (rede ou 5xx), com backoff exponencial.
  private async fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (response.status >= 500 && response.status < 600 && attempt < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Falha de rede ao contatar o provider de IA.');
  }

  private parseUsage(raw: unknown): AiUsageDTO | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const usage = raw as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    if (usage.prompt_tokens === undefined && usage.completion_tokens === undefined && usage.total_tokens === undefined) return undefined;
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    return { promptTokens, completionTokens, totalTokens: usage.total_tokens ?? promptTokens + completionTokens };
  }

  async listModels(provider: AiProvider) {
    const cached = this.modelCache.get(provider);
    if (cached && cached.expiresAt > Date.now()) return cached.models;
    const isNvidia = provider === 'nvidia-nim';
    const token = isNvidia ? this.env.NVIDIA_NIM_TOKEN : this.env.OPENROUTER_API_KEY;
    if (!token) return [];
    const endpoint = isNvidia ? 'https://integrate.api.nvidia.com/v1/models' : 'https://openrouter.ai/api/v1/models';
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`Não foi possível carregar os modelos de ${isNvidia ? 'NVIDIA NIM' : 'OpenRouter'}.`);
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    const models = (payload.data || []).map((model) => model.id).filter((id): id is string => Boolean(id)).sort();
    this.modelCache.set(provider, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, models });
    return models;
  }

  async chat(provider: AiProvider, messages: AiChatMessage[], options: { model?: string; thinking?: AiThinkingLevel } = {}) {
    const isNvidia = provider === 'nvidia-nim';
    const token = isNvidia ? this.env.NVIDIA_NIM_TOKEN : this.env.OPENROUTER_API_KEY;
    if (!token) throw new Error(`Token do provider ${isNvidia ? 'NVIDIA NIM' : 'OpenRouter'} não configurado.`);
    const endpoint = isNvidia ? 'https://integrate.api.nvidia.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const model = options.model || (isNvidia ? (this.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct') : (this.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'));
    const thinking = options.thinking || 'off';
    const body = { model, messages, temperature: thinking === 'off' ? 0.2 : 0.1, max_tokens: thinking === 'high' ? 2400 : 1200, ...(isNvidia ? { chat_template_kwargs: { enable_thinking: thinking !== 'off' } } : thinking !== 'off' ? { reasoning: { effort: thinking } } : {}) };
    const response = await this.fetchWithRetry(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(isNvidia ? {} : { 'HTTP-Referer': 'https://chronokairo.com.br', 'X-Title': 'Chronokairo Projects' }) }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`Falha no provider de IA (${response.status}).`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('O provider de IA não retornou conteúdo.');
    return { provider, model, content };
  }

  async *streamChat(provider: AiProvider, messages: AiChatMessage[], options: { model?: string; thinking?: AiThinkingLevel } = {}): AsyncGenerator<string> {
    const isNvidia = provider === 'nvidia-nim';
    const token = isNvidia ? this.env.NVIDIA_NIM_TOKEN : this.env.OPENROUTER_API_KEY;
    if (!token) throw new Error(`Token do provider ${isNvidia ? 'NVIDIA NIM' : 'OpenRouter'} não configurado.`);
    const endpoint = isNvidia ? 'https://integrate.api.nvidia.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const model = options.model || (isNvidia ? (this.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct') : (this.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'));
    const thinking = options.thinking || 'off';
    const body = { model, messages, stream: true, temperature: thinking === 'off' ? 0.2 : 0.1, max_tokens: thinking === 'high' ? 2400 : 1200 };
    const response = await this.fetchWithRetry(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(isNvidia ? {} : { 'HTTP-Referer': 'https://chronokairo.com.br', 'X-Title': 'Chronokairo Projects' }) }, body: JSON.stringify(body) });
    if (!response.ok || !response.body) throw new Error(`Falha no provider de IA (${response.status}).`);
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch { /* ignora chunks parciais/keep-alive */ }
      }
    }
  }

  async chatWithTools(provider: AiProvider, messages: Array<Record<string, unknown>>, tools: AiToolDefinition[], options: { model?: string; thinking?: AiThinkingLevel } = {}): Promise<AiToolResponse> {
    const isNvidia = provider === 'nvidia-nim';
    const token = isNvidia ? this.env.NVIDIA_NIM_TOKEN : this.env.OPENROUTER_API_KEY;
    if (!token) throw new Error(`Token do provider ${isNvidia ? 'NVIDIA NIM' : 'OpenRouter'} não configurado.`);
    const endpoint = isNvidia ? 'https://integrate.api.nvidia.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const model = options.model || (isNvidia ? (this.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct') : (this.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'));
    const thinking = options.thinking || 'off';
    const providerTools = tools.map(({ name, description, parameters }) => ({ type: 'function', function: { name, description, parameters } }));
    const body = { model, messages, tools: providerTools, tool_choice: 'auto', temperature: thinking === 'off' ? 0.2 : 0.1, max_tokens: thinking === 'high' ? 2400 : 1200, ...(isNvidia ? { chat_template_kwargs: { enable_thinking: thinking !== 'off' } } : thinking !== 'off' ? { reasoning: { effort: thinking } } : {}) };
    const response = await this.fetchWithRetry(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(isNvidia ? {} : { 'HTTP-Referer': 'https://chronokairo.com.br', 'X-Title': 'Chronokairo Projects' }) }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`Falha no provider de IA (${response.status}).`);
    const payload = await response.json() as { usage?: unknown; choices?: Array<{ message?: { content?: string | null; role?: string; reasoning?: string | null; reasoning_content?: string | null; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> } }> };
    const message = payload.choices?.[0]?.message;
    if (!message) throw new Error('O provider de IA não retornou uma mensagem.');
    const toolCalls = (message.tool_calls || []).map((call) => {
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(call.function?.arguments || '{}') as Record<string, unknown>; } catch { throw new Error(`Argumentos inválidos na tool ${call.function?.name || 'desconhecida'}.`); }
      return { id: call.id || crypto.randomUUID(), name: call.function?.name || '', arguments: args };
    });
    const reasoning = message.reasoning || message.reasoning_content || null;
    return { provider, model, content: message.content || null, toolCalls, assistantMessage: { role: 'assistant', content: message.content || null, ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}) }, usage: this.parseUsage(payload.usage), reasoning };
  }
}
