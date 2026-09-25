/**
 * AI Provider Interface
 * 
 * Abstração para diferentes provedores de IA (Claude, OpenAI, etc)
 * Permite trocar entre modelos sem alterar a lógica de negócio
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  timeout?: number;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  throwOnError?: boolean;
}

export interface AICompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | string;
  model: string;
  timestamp: Date;
}

export interface AIReasoningResult extends AICompletionResult {
  reasoning: string;
  thinkingTime: number;
  confidenceScore: number;
}

/**
 * Base AI Provider Interface
 * Todos os provedores devem implementar esses métodos
 */
export interface IAIProvider {
  /**
   * Configuração do provedor
   */
  getConfig(): AIModelConfig;

  /**
   * Completamento simples (chat)
   */
  complete(
    prompt: string,
    messages?: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /**
   * Reasoning/Extended Thinking
   */
  reasonAbout(
    problem: string,
    context?: Record<string, any>,
    options?: AICompletionOptions
  ): Promise<AIReasoningResult>;

  /**
   * Code generation
   */
  generateCode(
    description: string,
    language: string,
    context?: string,
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /**
   * Code analysis
   */
  analyzeCode(
    code: string,
    language: string,
    analysisType?: 'security' | 'performance' | 'quality' | 'all',
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /**
   * Problem decomposition
   */
  decomposeProblem(
    problem: string,
    context?: string,
    options?: AICompletionOptions
  ): Promise<{
    steps: Array<{
      order: number;
      title: string;
      description: string;
      dependencies: number[];
      estimatedTokens: number;
    }>;
    totalTokens: number;
  }>;

  /**
   * Chat streaming (para UI em tempo real)
   */
  streamComplete(
    prompt: string,
    messages?: AIMessage[],
    onChunk?: (chunk: string) => void,
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get remaining credits/quota
   */
  getQuota(): Promise<{ remaining: number; limit: number; resetAt?: Date }>;
}

/**
 * Extended AI Provider com tool/function calling
 */
export interface IAIProviderWithTools extends IAIProvider {
  defineTool(
    name: string,
    description: string,
    parameters: Record<string, any>,
    handler: (args: any) => Promise<any>
  ): void;

  callWithTools(
    prompt: string,
    messages?: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult & { toolCalls?: Array<{ name: string; args: any }> }>;
}

/**
 * Factory para criar instâncias de provedores
 */
export class AIProviderFactory {
  private static providers: Map<string, () => IAIProvider> = new Map();

  static register(name: string, creator: () => IAIProvider): void {
    this.providers.set(name.toLowerCase(), creator);
  }

  static create(providerName: string, config: AIModelConfig): IAIProvider {
    const creator = this.providers.get(providerName.toLowerCase());
    if (!creator) {
      throw new Error(`AI Provider not found: ${providerName}`);
    }
    const provider = creator();
    provider.setConfig?.(config);
    return provider;
  }

  static listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Decorator para adicionar configuração a um provider
 */
export function ConfigureAIProvider(config: Partial<AIModelConfig>) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      private config: AIModelConfig;

      constructor(...args: any[]) {
        super(...args);
        this.config = { model: 'unknown', ...config };
      }

      getConfig() {
        return this.config;
      }

      setConfig(newConfig: Partial<AIModelConfig>) {
        this.config = { ...this.config, ...newConfig };
      }
    };
  };
}

/**
 * Error types para tratamento específico
 */
export class AIProviderError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(message: string, public resetAt?: Date) {
    super('RATE_LIMIT', message, 429, true);
  }
}

export class AIAuthError extends AIProviderError {
  constructor(message: string) {
    super('AUTH_ERROR', message, 401, false);
  }
}

export class AIModelError extends AIProviderError {
  constructor(message: string) {
    super('MODEL_ERROR', message, 400, false);
  }
}

/**
 * Mock Provider para testes
 */
export class MockAIProvider implements IAIProvider {
  private config: AIModelConfig;

  constructor(config: AIModelConfig = { model: 'mock' }) {
    this.config = config;
  }

  getConfig(): AIModelConfig {
    return this.config;
  }

  async complete(prompt: string): Promise<AICompletionResult> {
    return {
      content: `Mock response to: ${prompt}`,
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      stopReason: 'end_turn',
      model: 'mock',
      timestamp: new Date(),
    };
  }

  async reasonAbout(problem: string): Promise<AIReasoningResult> {
    return {
      content: `Solution to: ${problem}`,
      reasoning: 'Mock reasoning process',
      thinkingTime: 100,
      confidenceScore: 0.8,
      usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
      stopReason: 'end_turn',
      model: 'mock',
      timestamp: new Date(),
    };
  }

  async generateCode(description: string, language: string): Promise<AICompletionResult> {
    return {
      content: `// Generated ${language} code for: ${description}\n// console.log('hello');`,
      usage: { promptTokens: 15, completionTokens: 8, totalTokens: 23 },
      stopReason: 'end_turn',
      model: 'mock',
      timestamp: new Date(),
    };
  }

  async analyzeCode(code: string): Promise<AICompletionResult> {
    return {
      content: 'Code analysis: This code looks fine.',
      usage: { promptTokens: 25, completionTokens: 12, totalTokens: 37 },
      stopReason: 'end_turn',
      model: 'mock',
      timestamp: new Date(),
    };
  }

  async decomposeProblem(problem: string): Promise<any> {
    return {
      steps: [
        { order: 1, title: 'Understand', description: 'Understand the problem', dependencies: [], estimatedTokens: 50 },
        { order: 2, title: 'Plan', description: 'Create a plan', dependencies: [1], estimatedTokens: 100 },
        { order: 3, title: 'Execute', description: 'Execute the plan', dependencies: [2], estimatedTokens: 200 },
      ],
      totalTokens: 350,
    };
  }

  async streamComplete(prompt: string, messages?: AIMessage[], onChunk?: (chunk: string) => void): Promise<AICompletionResult> {
    if (onChunk) {
      onChunk('Mock ');
      onChunk('streaming ');
      onChunk('response');
    }
    return this.complete(prompt, messages);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getQuota(): Promise<{ remaining: number; limit: number }> {
    return { remaining: 1000, limit: 10000 };
  }
}
