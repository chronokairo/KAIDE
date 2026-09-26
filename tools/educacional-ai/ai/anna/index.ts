/**
 * src/ai/anna/index.ts
 *
 * Constantes e re-exports públicos da Anna.
 * createAnnaFrontendRouter vive em @/ai/router — importe de lá.
 */

export const ANNA = {
  source:       'Anna',
  greeting:     'Olá! Como posso ajudar?',
  pendingText:  'Processando...',
  errorPrefix:  'Erro',
} as const;

/** Re-export para retrocompatibilidade — prefira importar de @/ai/router diretamente. */
export { createAnnaFrontendRouter } from '@/ai/router';
export type { AnnaRouteResult as AnnaIntentRoute } from '@/ai/router';
