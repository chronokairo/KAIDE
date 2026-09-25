import crypto from 'crypto';

export class CryptoUtils {
  static generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  static verifyApiKey(apiKey: string, keyHash: string): boolean {
    const hash = this.hashApiKey(apiKey);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(keyHash));
  }
}
