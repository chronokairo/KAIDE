/**
 * Conversation management service
 */

import { ConversationDatabase, Conversation, Message } from './database';

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

    static async setMessageFeedback(messageId: string, feedback: 'positive' | 'negative' | null): Promise<boolean> {
        return await ConversationDatabase.setMessageFeedback(messageId, feedback);
    }

    static async getSettings(): Promise<any> {
        return await ConversationDatabase.getSettings();
    }

    static async updateSettings(settings: any): Promise<void> {
        await ConversationDatabase.updateSettings(settings);
    }
}
