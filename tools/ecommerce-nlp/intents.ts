/**
 * Detecção de intenções
 * Identifica a intenção do usuário baseado em palavras-chave
 */

export enum Intent {
  FAZER_PEDIDO = 'fazer_pedido',
  RASTREAR = 'rastrear',
  PRECO = 'preco',
  SAUDACAO = 'saudacao',
  DESPEDIDA = 'despedida',
  MENU = 'menu',
  ATENDENTE = 'atendente',
  UNKNOWN = 'unknown',
}

export function detectIntent(message: string): Intent {
  // TODO: Implementar detecção de intenção
  const lower = message.toLowerCase();
  
  if (lower.match(/ped|compr|compra|encomen/)) return Intent.FAZER_PEDIDO;
  if (lower.match(/rastr|entrega|onde|status/)) return Intent.RASTREAR;
  if (lower.match(/preço|valor|custa|tabela/)) return Intent.PRECO;
  if (lower.match(/oi|olá|opa|e aí/)) return Intent.SAUDACAO;
  if (lower.match(/tchau|adeus|até/)) return Intent.DESPEDIDA;
  if (lower.match(/menu|opções|ajuda/)) return Intent.MENU;
  if (lower.match(/atendente|falar|humano/)) return Intent.ATENDENTE;
  
  return Intent.UNKNOWN;
}

export function getIntentConfidence(message: string, intent: Intent): number {
  // TODO: Calcular confiança da intenção
  return 0.5;
}
