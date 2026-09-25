import { AIProvider, ChatMessage, ChatRequest, ChatResponse, ModelInfo, ToolCall } from './AIProvider';

interface OllamaModelInfo {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 encoded images
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  tools?: any[];
  stream?: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
    tool_calls?: any[];
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Provider implementation for Ollama local models
 * Requires Ollama to be running locally on port 11434
 */
export class OllamaProvider extends AIProvider {
  readonly name = 'Ollama Local';
  readonly vendor = 'ollama';
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:11434') {
    super();
    this.baseUrl = baseUrl;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: { models: OllamaModelInfo[] } = await response.json();
      
      return data.models.map(model => {
        // Parse model capabilities from name/family
        const isCodeModel = /code|codellama|starcoder|phind|deepseek/i.test(model.name);
        const isLargeModel = /70b|72b|65b/i.test(model.name);
        const isMediumModel = /13b|14b|15b|20b|30b|34b/i.test(model.name);
        
        // Cost is always 0 for local models
        let costMultiplier = 0;
        
        // Estimate context length based on model family
        let contextLength = 4096; // default
        if (/llama.*3/i.test(model.name)) {
          contextLength = 128000; // Llama 3 models have longer context
        } else if (/gemma/i.test(model.name)) {
          contextLength = 8192;
        } else if (/mistral|mixtral/i.test(model.name)) {
          contextLength = 32768;
        } else if (/qwen|palm/i.test(model.name)) {
          contextLength = 32768;
        }
        
        return {
          id: model.name,
          name: `${model.name}`,
          description: `Local Ollama model - ${model.details?.family || 'Unknown family'} (${this.formatSize(model.size)})`,
          contextLength,
          costMultiplier,
          capabilities: {
            chat: true,
            tools: false, // Most Ollama models don't support tools yet
            vision: /vision|llava|minicpm/i.test(model.name),
            code: isCodeModel
          }
        };
      });
    } catch (error) {
      console.error('[OllamaProvider] Failed to get models:', error);
      return [];
    }
  }
  
  async chat(request: ChatRequest, modelId: string): Promise<ChatResponse> {
    try {
      // Convert our format to Ollama format
      const messages: OllamaChatMessage[] = request.messages
        .filter(msg => msg.role !== 'tool') // Ollama doesn't handle tool messages directly
        .map(msg => ({
          role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      const ollamaRequest: OllamaChatRequest = {
        model: modelId,
        messages,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000
        }
      };
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ollamaRequest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: OllamaChatResponse = await response.json();
      
      const chatMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content
      };
      
      return {
        message: chatMessage,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      };
    } catch (error) {
      console.error('[OllamaProvider] Chat request failed:', error);
      throw new Error(`Ollama chat failed: ${error}`);
    }
  }
  
  async *chatStream(request: ChatRequest, modelId: string): AsyncGenerator<Partial<ChatResponse>> {
    try {
      // Convert our format to Ollama format
      const messages: OllamaChatMessage[] = request.messages
        .filter(msg => msg.role !== 'tool')
        .map(msg => ({
          role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      const ollamaRequest: OllamaChatRequest = {
        model: modelId,
        messages,
        stream: true,
        options: {
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000
        }
      };
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ollamaRequest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      const decoder = new TextDecoder();
      let content = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data: OllamaChatResponse = JSON.parse(line);
              
              if (data.message?.content) {
                content += data.message.content;
                yield {
                  message: {
                    role: 'assistant',
                    content
                  }
                };
              }
              
              if (data.done) {
                // Final message with usage stats
                yield {
                  message: {
                    role: 'assistant',
                    content
                  },
                  usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                  }
                };
                return;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn('[OllamaProvider] Failed to parse streaming line:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[OllamaProvider] Streaming chat failed:', error);
      throw new Error(`Ollama streaming failed: ${error}`);
    }
  }
  
  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });
      
      return response.ok;
    } catch (error) {
      console.error('[OllamaProvider] Failed to pull model:', error);
      return false;
    }
  }
  
  /**
   * Delete a model from local storage
   */
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });
      
      return response.ok;
    } catch (error) {
      console.error('[OllamaProvider] Failed to delete model:', error);
      return false;
    }
  }
  
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}