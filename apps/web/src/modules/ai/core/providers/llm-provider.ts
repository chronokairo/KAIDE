import { NvidiaNimLlmProvider, createNvidiaNimProvider, type NvidiaNimProviderConfig } from './nvidia-nim-provider';

export type { NvidiaNimProviderConfig };

export interface LlmStreamChunk {
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'capability_request' | 'completed' | 'error';
  content?: string;
  data?: any;
}

export interface ILlmProvider {
  name: string;
  generateResponse(prompt: string, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }): Promise<string>;
  streamResponse?(prompt: string, onChunk: (chunk: LlmStreamChunk) => void, context?: { systemPrompt?: string; messages?: Array<{ role: string; content: string }> }): Promise<void>;
}

export class MockLlmProvider implements ILlmProvider {
  name = 'mock';
  async generateResponse(prompt: string): Promise<string> {
    return `[NVIDIA NIM Mock] ${prompt}`;
  }
  async streamResponse(prompt: string, onChunk: (chunk: LlmStreamChunk) => void): Promise<void> {
    onChunk({ type: 'text_delta', content: `[NVIDIA NIM Mock] ${prompt}` });
    onChunk({ type: 'completed' });
  }
}

export const mockLlmProvider = new MockLlmProvider();

let _defaultProvider: ILlmProvider | null = null;

export function getDefaultLlmProvider(config?: NvidiaNimProviderConfig): ILlmProvider {
  if (_defaultProvider) return _defaultProvider;

  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'nvidia-nim';

  switch (provider) {
    case 'nvidia-nim':
      _defaultProvider = createNvidiaNimProvider(config);
      break;
    case 'mock':
    default:
      _defaultProvider = createNvidiaNimProvider(config);
      break;
  }

  return _defaultProvider;
}

export function setDefaultLlmProvider(provider: ILlmProvider): void {
  _defaultProvider = provider;
}
