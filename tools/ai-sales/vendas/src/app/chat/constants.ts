import type { Message } from '@ciesa/anna-shared';

export const VENDAS_NAME = 'Anna Vendas';

export const VENDAS_GREETING =
  'Olá! Sou a **Anna Vendas**, assistente de vendas do CIESA.\n\n' +
  'Posso ajudar com:\n' +
  '- 🎯 Identificar leads prontos para comprar\n' +
  '- 📊 Recomendar produtos personalizados\n' +
  '- 📝 Criar propostas comerciais\n' +
  '- 📧 Enviar e-mail de proposta\n' +
  '- 👀 Monitorar abertura e follow-up\n\n' +
  'Como posso ajudar hoje?';

export const SUGGESTED = [
  'Quero ver leads prontos para comprar',
  'Recomende produtos para um lead',
  'Criar proposta personalizada',
  'Enviar follow-up para lead',
];

export const PLACEHOLDERS = [
  'Buscar leads prontos para comprar',
  'Criar proposta para lead',
  'Recomendar produtos para lead',
  'Monitorar proposta enviada',
];

export const DEFAULT_PLACEHOLDER = 'Pergunte sobre vendas, leads ou propostas...';

export const GREETING_MESSAGE: Message = {
  id: 0,
  role: 'anna',
  content: VENDAS_GREETING.replace(/\*\*/g, ''),
};
