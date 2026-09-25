// Base abstraction for AI providers
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object; // JSON Schema
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  costMultiplier: number; // 0 = free, 0.1 = cheap, 1 = standard, 3 = premium
  capabilities: {
    chat: boolean;
    tools: boolean;
    vision: boolean;
    code: boolean;
  };
}

export abstract class AIProvider {
  abstract readonly name: string;
  abstract readonly vendor: string;
  
  abstract isAvailable(): Promise<boolean>;
  abstract getModels(): Promise<ModelInfo[]>;
  abstract chat(request: ChatRequest, modelId: string): Promise<ChatResponse>;
  
  // Optional streaming support
  async *chatStream(request: ChatRequest, modelId: string): AsyncGenerator<Partial<ChatResponse>> {
    // Default implementation falls back to non-streaming
    const response = await this.chat(request, modelId);
    yield response;
  }
}

// Provider registry and factory
export class AIProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private _defaultProvider: string = 'copilot';
  
  register(provider: AIProvider): void {
    this.providers.set(provider.vendor, provider);
  }
  
  get(vendor: string): AIProvider | undefined {
    return this.providers.get(vendor);
  }
  
  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }
  
  setDefault(vendor: string): void {
    if (!this.providers.has(vendor)) {
      throw new Error(`Provider '${vendor}' not registered`);
    }
    this._defaultProvider = vendor;
  }
  
  getDefault(): AIProvider | undefined {
    return this.providers.get(this._defaultProvider);
  }
  
  async getAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];
    for (const provider of this.providers.values()) {
      try {
        if (await provider.isAvailable()) {
          providers.push(provider);
        }
      } catch (error) {
        console.warn(`[AIProviderRegistry] Provider ${provider.vendor} availability check failed:`, error);
      }
    }
    return providers;
  }
  
  async getAllModels(): Promise<Array<ModelInfo & { provider: string }>> {
    const allModels: Array<ModelInfo & { provider: string }> = [];
    
    for (const provider of this.providers.values()) {
      try {
        if (await provider.isAvailable()) {
          const models = await provider.getModels();
          allModels.push(...models.map(m => ({ ...m, provider: provider.vendor })));
        }
      } catch (error) {
        console.warn(`[AIProviderRegistry] Failed to get models from ${provider.vendor}:`, error);
      }
    }
    
    return allModels;
  }
}

// Global registry instance
export const aiProviderRegistry = new AIProviderRegistry();