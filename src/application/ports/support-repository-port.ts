import { ConversationThread } from '@/domain/support';
import { FaqEntry } from '@/domain/support';

/**
 * Porta Secundária (Driven Port) do Repositório de Suporte.
 *
 * O AI Support apenas lê o histórico de conversas e propõe entradas de FAQ.
 * A curadoria e a publicação dos artigos são ações humanas.
 */
export interface SupportRepositoryPort {
  listConversations(): Promise<ConversationThread[]>;
  saveFaqEntry?(entry: FaqEntry): Promise<void>;
}