import { ConversationThread, FaqEntry } from '@/domain/support';

/**
 * Driven port for the Support & Knowledge Base Repository.
 *
 * The AI Support agent analyzes past conversations to identify recurring questions
 * and proposes draft FAQ entries. Publishing articles remains a human curation task.
 */
export interface SupportRepositoryPort {
  listConversations(): Promise<ConversationThread[]>;
  saveFaqEntry?(entry: FaqEntry): Promise<void>;
}