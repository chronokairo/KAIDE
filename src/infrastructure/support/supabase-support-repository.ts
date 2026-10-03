import { SupportRepositoryPort } from '@/application/ports/support-repository-port';
import {
  ConversationThread,
  ConversationMessage,
  MessageRole,
  FaqEntry,
} from '@/domain/support';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Production secondary adapter for the Support Repository backed by Supabase.
 *
 * Connected directly to official production database (`chronokairo-prod`).
 * Queries `ai_conversations` and `ai_messages` to reconstruct user interactions.
 * Proposed FAQ entries are recorded in `audit_logs` for human curation and publication.
 */
export class SupabaseSupportRepository implements SupportRepositoryPort {
  async listConversations(): Promise<ConversationThread[]> {
    const { data: conversations, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (error || !conversations) {
      console.warn('[SupabaseSupportRepository] Failed to query conversations:', error?.message);
      return [];
    }

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return [];

    const { data: messages, error: msgError } = await supabaseAdmin
      .from('ai_messages')
      .select('*')
      .eq('organization_id', PROD_ORGANIZATION_ID)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.warn('[SupabaseSupportRepository] Failed to query messages:', msgError.message);
      return [];
    }

    const byConversation = new Map<string, ConversationMessage[]>();
    for (const row of messages || []) {
      const list = byConversation.get(row.conversation_id) ?? [];
      list.push({
        id: row.id,
        conversationId: row.conversation_id,
        role: (row.role || 'user') as MessageRole,
        content: row.content || '',
        createdAt: row.created_at || '',
        toolCalls: row.tool_calls || undefined,
        toolResults: row.tool_results || undefined,
      });
      byConversation.set(row.conversation_id, list);
    }

    return conversations.map((c) => ({
      id: c.id,
      title: c.title || 'Untitled conversation',
      status: c.status || 'active',
      contractVersion: c.contract_version || undefined,
      createdAt: c.created_at || '',
      messages: byConversation.get(c.id) ?? [],
    }));
  }

  async saveFaqEntry(entry: FaqEntry): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: PROD_ORGANIZATION_ID,
      action: 'SUPPORT_FAQ_PROPOSED',
      target: `faq/${entry.id}`,
      success: true,
      details: {
        question: entry.question,
        category: entry.category,
        occurrenceCount: entry.occurrenceCount,
        confidence: entry.confidence,
        sourceConversationIds: entry.sourceConversationIds,
        status: entry.status,
      },
      created_at: new Date().toISOString(),
    });
  }
}