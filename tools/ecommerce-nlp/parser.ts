/**
 * Parser de mensagens
 * Analisa e interpreta mensagens de entrada
 */

export interface ParsedMessage {
  original: string;
  sanitized: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
}

export function parseMessage(message: string): ParsedMessage {
  // TODO: Implementar parsing inteligente
  return {
    original: message,
    sanitized: message.toLowerCase().trim(),
    intent: 'unknown',
    entities: {},
    confidence: 0,
  };
}

export function extractEntities(message: string): Record<string, any> {
  // TODO: Extrair entidades (números, datas, etc)
  return {};
}

export function sanitizeMessage(message: string): string {
  return message.toLowerCase().trim().replace(/[^\w\s]/g, '');
}
