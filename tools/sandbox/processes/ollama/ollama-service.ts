export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  createdAt: Date;
}

export interface StructuredPlan {
  description: string;
  steps: Array<{
    command: string;
    description: string;
  }>;
}

export class OllamaService {
  private config: OllamaConfig;
  private isConnected = false;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'llama3.2',
      timeout: config?.timeout || 30000,
    };
  }

  async generateResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const defaultSystemPrompt = `You are AegisOS, an AI agent that helps users with software development tasks.
You operate in a sandboxed container environment.
Always provide structured, safe commands that can be executed in a Linux container.
Never suggest destructive commands like 'rm -rf /' or commands that require root access.`;

    const allMessages: LLMMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [{ role: 'system', content: defaultSystemPrompt }, ...messages];

    try {
      // Ensure connection
      if (!this.isConnected) {
        await this.ensureConnected();
      }

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: allMessages,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.message?.content || '',
        model: data.model || this.config.model,
        createdAt: new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        if (error.message.includes('fetch')) {
          throw new Error(
            `Failed to connect to Ollama at ${this.config.baseUrl}. Make sure Ollama is running.`
          );
        }
      }
      throw error;
    }
  }

  async generateStructuredPlan(userRequest: string): Promise<StructuredPlan> {
    const prompt = `Based on the following user request, create a structured execution plan with specific shell commands.

User request: ${userRequest}

Respond in the following JSON format only (no additional text):
{
  "description": "Brief description of what will be done",
  "steps": [
    {"command": "exact shell command", "description": "what this step does"}
  ]
}

Ensure all commands are safe and can run in a sandboxed Ubuntu container.`;

    const response = await this.generateResponse([
      { role: 'user', content: prompt },
    ]);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const plan: StructuredPlan = JSON.parse(jsonMatch[0]);
      
      // Validate plan structure
      if (!plan.description || !Array.isArray(plan.steps)) {
        throw new Error('Invalid plan structure');
      }

      return plan;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM response as structured plan: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async chat(message: string, conversationHistory?: LLMMessage[]): Promise<string> {
    const messages: LLMMessage[] = conversationHistory || [];
    messages.push({ role: 'user', content: message });

    const response = await this.generateResponse(messages);
    return response.content;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      this.isConnected = response.ok;
      return response.ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  private async ensureConnected(): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const available = await this.isAvailable();
        if (available) {
          this.isConnected = true;
          return;
        }
      } catch (error) {
        lastError = error as Error;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw new Error(
      `Failed to connect to Ollama after ${maxRetries} retries: ${
        lastError?.message || 'Unknown error'
      }`
    );
  }
}
