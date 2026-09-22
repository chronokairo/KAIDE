import type { ILlmProvider, LlmStreamChunk } from './llm-provider';

export interface OllamaProviderConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class OllamaLlmProvider implements ILlmProvider {
  name = 'ollama';
  private config: OllamaProviderConfig;

  constructor(config: OllamaProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2048,
      ...config,
    };
  }

  async generateResponse(prompt: string, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }): Promise<string> {
    const messages = this.buildMessages(prompt, context);

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async streamResponse(prompt: string, onChunk: (chunk: LlmStreamChunk) => void, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }): Promise<void> {
    const messages = this.buildMessages(prompt, context);

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      onChunk({ type: 'error', content: `Ollama API error: ${response.status} - ${error}` });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onChunk({ type: 'error', content: 'No response body' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                onChunk({ type: 'text_delta', content: json.message.content });
              }
              if (json.done) {
                onChunk({ type: 'completed' });
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          if (json.message?.content) {
            onChunk({ type: 'text_delta', content: json.message.content });
          }
          if (json.done) {
            onChunk({ type: 'completed' });
          }
        } catch {
          // Skip invalid JSON
        }
      }

      onChunk({ type: 'completed' });
    } catch (error) {
      onChunk({ type: 'error', content: error instanceof Error ? error.message : 'Stream error' });
    } finally {
      reader.releaseLock();
    }
  }

  private buildMessages(prompt: string, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // System prompt
    const systemPrompt = context?.systemPrompt || this.config.systemPrompt;
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Conversation history
    if (context?.messages) {
      messages.push(...context.messages);
    }

    // Current user prompt
    messages.push({ role: 'user', content: prompt });

    return messages;
  }
}

export function createOllamaProvider(config?: Partial<OllamaProviderConfig>): OllamaLlmProvider {
  return new OllamaLlmProvider({
    baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
    model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.2',
    ...config,
  });
}
