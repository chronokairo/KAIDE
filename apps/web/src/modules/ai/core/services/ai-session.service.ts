import { supabase } from '@/shared/supabase';

export interface AiConversationEntity {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  status: 'Active' | 'Archived';
  contract_version: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessageEntity {
  id: string;
  organization_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
}

export class AiSessionService {
  async listConversations(organizationId: string, userId: string): Promise<AiConversationEntity[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createConversation(organizationId: string, userId: string, title: string): Promise<AiConversationEntity> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        title,
        status: 'Active',
        contract_version: 'v1',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listMessages(conversationId: string): Promise<AiMessageEntity[]> {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async appendMessage(conversationId: string, organizationId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string): Promise<AiMessageEntity> {
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const aiSessionService = new AiSessionService();
