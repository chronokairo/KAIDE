import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

// Caminho para o banco de dados - usar diretório do projeto, não relativo ao arquivo
const dbPath = path.join(process.cwd(), 'data/conversations.json');

// Criar diretório se não existir
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Criar arquivo se não existir
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ conversations: [] }, null, 2));
}

// Tipo da estrutura do banco de dados
interface Data {
    conversations: Conversation[];
}

// Inicializar lowdb
const db = await JSONFilePreset<Data>(dbPath, { conversations: [] });

// Ler o banco de dados
await db.read();

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: Message[];
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    sources?: any[];
    charts?: any[];
}

export class ConversationDatabase {
    static async createConversation(id: string, title: string): Promise<void> {
        await db.read();
        const now = new Date();
        const conversation: Conversation = {
            id,
            title,
            createdAt: now,
            updatedAt: now,
            messages: []
        };
        db.data.conversations.push(conversation);
        await db.write();
    }

    static async updateConversation(id: string, title: string): Promise<void> {
        await db.read();
        const conversation = db.data.conversations.find((c: Conversation) => c.id === id);
        if (conversation) {
            conversation.title = title;
            conversation.updatedAt = new Date();
            await db.write();
        }
    }

    static async deleteConversation(id: string): Promise<void> {
        await db.read();
        db.data.conversations = db.data.conversations.filter((c: Conversation) => c.id !== id);
        await db.write();
    }

    static async getConversation(id: string): Promise<Conversation | null> {
        await db.read();
        const conversation = db.data.conversations.find((c: Conversation) => c.id === id);
        if (!conversation) return null;
        
        // Converter strings de data para objetos Date
        return {
            ...conversation,
            createdAt: new Date(conversation.createdAt),
            updatedAt: new Date(conversation.updatedAt),
            messages: conversation.messages.map((m: Message) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }))
        };
    }

    static async getAllConversations(): Promise<Conversation[]> {
        await db.read();
        // Converter strings de data para objetos Date e ordenar
        return db.data.conversations
            .map((c: Conversation) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
                messages: c.messages.map((m: Message) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }))
            }))
            .sort((a: Conversation, b: Conversation) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    static async addMessage(conversationId: string, message: Message): Promise<void> {
        await db.read();
        const conversation = db.data.conversations.find((c: Conversation) => c.id === conversationId);
        if (conversation) {
            conversation.messages.push(message);
            conversation.updatedAt = new Date();
            await db.write();
        }
    }

    static async updateMessage(messageId: string, content: string, isStreaming: boolean, sources?: any[], charts?: any[]): Promise<void> {
        await db.read();
        for (const conversation of db.data.conversations) {
            const message = conversation.messages.find((m: Message) => m.id === messageId);
            if (message) {
                message.content = content;
                message.isStreaming = isStreaming;
                if (sources !== undefined) message.sources = sources;
                if (charts !== undefined) message.charts = charts;
                conversation.updatedAt = new Date();
                await db.write();
                break;
            }
        }
    }
}