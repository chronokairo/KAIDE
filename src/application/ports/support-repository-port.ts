import {
  ConversationThread,
  FaqEntry,
  SupportIncident,
  SupportTicket,
} from '@/domain/support';

/**
 * Driven port for the Support, Incidents & Knowledge Base Repository.
 *
 * Provides access to real support tickets, incidents, and historical conversations
 * to enable automated triage, recurrence analysis, and proactive FAQ generation.
 */
export interface SupportRepositoryPort {
  listTickets(): Promise<SupportTicket[]>;
  listIncidents(): Promise<SupportIncident[]>;
  listConversations(): Promise<ConversationThread[]>;
  saveFaqEntry?(entry: FaqEntry): Promise<void>;
}