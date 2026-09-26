import { ANNA } from '@/index';
import type { Message } from '@ciesa/anna-shared';

/** Sugestões estáticas exibidas antes de a IA gerar as próprias. */
export const SUGGESTED = [
  'Quero me matricular em Direito',
  'Quero transferir meu curso para o CIESA',
  'Sou portador de diploma e quero fazer pós',
];

export const PLACEHOLDERS = [
  'Quero me matricular em Administracao no turno noturno',
  'Meu nome e Ana, quero iniciar minha inscricao em Direito',
  'Sou transferido de outra IES e quero continuar meu curso',
  'Tenho diploma e quero entrar em uma pos-graduacao',
];

export const DEFAULT_PLACEHOLDER = 'Pergunte qualquer coisa sobre sua vida acadêmica...';

export const GREETING_MESSAGE: Message = {
  id: 0,
  role: 'anna',
  content: ANNA.greeting,
};
