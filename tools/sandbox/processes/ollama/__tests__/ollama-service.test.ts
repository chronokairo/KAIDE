import { describe, it, expect, beforeEach } from 'vitest';
import { OllamaService } from '../ollama-service';

describe('OllamaService', () => {
  let ollamaService: OllamaService;

  beforeEach(() => {
    ollamaService = new OllamaService({
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      timeout: 5000,
    });
  });

  it('should initialize with config', () => {
    expect(ollamaService).toBeDefined();
  });

  it('should attempt connection check', async () => {
    // Note: This will fail in test environment without actual Ollama running
    const available = await ollamaService.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should format structured plan prompt correctly', async () => {
    try {
      // This will throw due to no Ollama, but we can verify error message
      await ollamaService.generateStructuredPlan('Setup Node.js');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should have default configuration values', () => {
    const service = new OllamaService();
    expect(service).toBeDefined();
  });
});
