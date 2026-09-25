// Export all provider classes and interfaces
export * from './AIProvider';
export * from './ai-provider';
export * from './OllamaProvider';

// Re-export the global registry
export { aiProviderRegistry } from './AIProvider';

// Provider setup utilities
import { OllamaProvider } from './OllamaProvider';
import { aiProviderRegistry } from './AIProvider';
import { AIProviderFactory, MockAIProvider } from './ai-provider';

/**
 * Initialize and register all available providers.
 * Only free, local providers are supported out of the box (Ollama + Mock).
 * Commercial providers (Claude, OpenAI) and editor-bound providers (Copilot)
 * were removed to keep the core dependency-free and runnable in plain Node.
 */
export async function initializeProviders(options: {
  ollamaBaseUrl?: string;
} = {}): Promise<void> {
  aiProviderRegistry.register(new MockAIProvider());

  const ollama = new OllamaProvider(options.ollamaBaseUrl);
  aiProviderRegistry.register(ollama);
}

/**
 * Get provider based on preference and availability.
 */
export async function getAIProvider(preference?: 'best' | 'free' | 'local') {
  const providers = await aiProviderRegistry.getAvailableProviders();

  switch (preference) {
    case 'local':
      return providers.find((p) => p.vendor === 'ollama') || new MockAIProvider();

    case 'best':
    case 'free':
    default:
      return (
        providers.find((p) => p.vendor === 'ollama') ||
        providers.find((p) => p.vendor === 'mock') ||
        new MockAIProvider()
      );
  }
}

/**
 * Get the best available free provider (no API keys required).
 */
export async function getBestFreeProvider() {
  const providers = await aiProviderRegistry.getAvailableProviders();
  const ollama = providers.find((p) => p.vendor === 'ollama');
  return ollama || new MockAIProvider();
}
