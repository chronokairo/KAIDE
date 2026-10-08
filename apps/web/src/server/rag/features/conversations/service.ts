/**
 * @layer features/conversations
 * @description Serviço para gerenciamento de conversas
 */

import { ConversationDatabase, Conversation, Message } from '../../shared/lib/database.js';

export class ConversationService {
    static async getAllConversations(): Promise<Conversation[]> {
        return await ConversationDatabase.getAllConversations();
    }

    static async getConversation(id: string): Promise<Conversation | null> {
        return await ConversationDatabase.getConversation(id);
    }

    static async createConversation(id: string, title: string): Promise<void> {
        await ConversationDatabase.createConversation(id, title);
    }

    static async updateConversation(id: string, title: string): Promise<void> {
        await ConversationDatabase.updateConversation(id, title);
    }

    static async deleteConversation(id: string): Promise<void> {
        await ConversationDatabase.deleteConversation(id);
    }

    static async addMessage(conversationId: string, message: Message): Promise<void> {
        await ConversationDatabase.addMessage(conversationId, message);
    }

    static async updateMessage(messageId: string, content: string, isStreaming: boolean, sources?: any[], charts?: any[]): Promise<void> {
        await ConversationDatabase.updateMessage(messageId, content, isStreaming, sources, charts);
    }
}