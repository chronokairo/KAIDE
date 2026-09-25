import { describe, it, expect, beforeEach } from 'vitest';
import { config } from '@/shared/lib/config';

describe('Configuration', () => {
  it('should load default configuration', () => {
    const port = config.get('port');
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThan(0);
  });

  it('should validate configuration', () => {
    const validation = config.validate();
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should detect environment correctly', () => {
    const isDev = config.isDevelopment() || config.isProduction() || config.isTest();
    expect(isDev).toBe(true);
  });

  it('should return all configuration', () => {
    const all = config.getAll();
    expect(all.port).toBeDefined();
    expect(all.ollamaBaseUrl).toBeDefined();
    expect(all.defaultContainerMode).toBeDefined();
  });
});
