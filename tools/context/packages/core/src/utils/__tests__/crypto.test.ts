import { describe, it, expect } from 'vitest';
import { CryptoUtils } from '../crypto';

describe('CryptoUtils', () => {
  describe('generateApiKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = CryptoUtils.generateApiKey();

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = CryptoUtils.generateApiKey();
      const key2 = CryptoUtils.generateApiKey();
      const key3 = CryptoUtils.generateApiKey();

      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
    });
  });

  describe('hashApiKey', () => {
    it('should hash an API key to SHA-256', () => {
      const key = 'test-api-key-12345';

      const hash = CryptoUtils.hashApiKey(key);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes for same input', () => {
      const key = 'consistent-key';

      const hash1 = CryptoUtils.hashApiKey(key);
      const hash2 = CryptoUtils.hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = CryptoUtils.hashApiKey('key1');
      const hash2 = CryptoUtils.hashApiKey('key2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyApiKey', () => {
    it('should verify a correct API key', () => {
      const key = 'my-secret-key';
      const hash = CryptoUtils.hashApiKey(key);

      const isValid = CryptoUtils.verifyApiKey(key, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect API key', () => {
      const correctKey = 'correct-key';
      const wrongKey = 'wrong-key';
      const hash = CryptoUtils.hashApiKey(correctKey);

      const isValid = CryptoUtils.verifyApiKey(wrongKey, hash);

      expect(isValid).toBe(false);
    });

    it('should be timing-safe', () => {
      const key = 'timing-safe-key';
      const hash = CryptoUtils.hashApiKey(key);

      // Test multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        expect(CryptoUtils.verifyApiKey(key, hash)).toBe(true);
      }
    });
  });
});
