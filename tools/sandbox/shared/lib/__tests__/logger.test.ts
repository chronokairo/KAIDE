import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger } from '@/shared/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clear();
    logger.setLevel('debug');
  });

  afterEach(() => {
    logger.setLevel('info');
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { context: 'test' });
    const logs = logger.getLogs({ level: 'debug' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should log info messages', () => {
    logger.info('Info message');
    const logs = logger.getLogs({ level: 'info' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');
    const logs = logger.getLogs({ level: 'warn' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    const logs = logger.getLogs({ level: 'error' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should set log level', () => {
    logger.setLevel('error');
    logger.debug('This should not appear');
    const logs = logger.getLogs({ level: 'debug' });
    expect(logs.length).toBe(0);
  });

  it('should retrieve logs with filters', () => {
    logger.info('Message 1');
    logger.info('Message 2');
    logger.warn('Warning 1');

    const infoLogs = logger.getLogs({ level: 'info' });
    expect(infoLogs.length).toBeGreaterThanOrEqual(2);

    const allLogs = logger.getLogs();
    expect(allLogs.length).toBeGreaterThanOrEqual(3);
  });
});
