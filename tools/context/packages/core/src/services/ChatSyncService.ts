import { Logger } from '../utils/Logger';
import { ChatService } from './ChatService';
import { ChatHistoryService } from './ChatHistoryService';
import { getEventBus } from '../events';
import { ChatMessage } from '../database';

/**
 * Chat Sync Service
 * 
 * Sincroniza automaticamente histórico de chat entre:
 * - ChatService (arquivos JSONL em disco)
 * - ChatHistoryService (banco SQLite)
 * 
 * Garante consistência de dados em ambos os formatos
 */

export interface SyncStatus {
  channel: string;
  lastSyncTime: Date;
  status: 'success' | 'failure' | 'in-progress';
  messagesFromJSONL: number;
  messagesToSQLite: number;
  messagesFromSQLite: number;
  error?: string;
}

export class ChatSyncService {
  private logger = Logger.getInstance();
  private bus = getEventBus('chat-sync');
  private syncStatuses: Map<string, SyncStatus> = new Map();
  private activeSyncs: Map<string, Promise<void>> = new Map();

  constructor(
    private chatService: ChatService,
    private chatHistoryService: ChatHistoryService
  ) {}

  /**
   * Sincronizar canal específico: JSONL → SQLite
   */
  async syncFromJSONLtoSQLite(
    channel: string,
    pipelineId?: string
  ): Promise<SyncStatus> {
    const syncKey = `${channel}:jsonl-to-sqlite`;

    // Evitar múltiplas sincronizações simultâneas
    if (this.activeSyncs.has(syncKey)) {
      this.logger.debug('[ChatSync] Sync already in progress', { channel });
      return this.syncStatuses.get(channel) || {
        channel,
        lastSyncTime: new Date(),
        status: 'in-progress',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
      };
    }

    const syncPromise = this.performSyncJSONLtoSQLite(channel, pipelineId);
    this.activeSyncs.set(syncKey, syncPromise);

    try {
      await syncPromise;
    } finally {
      this.activeSyncs.delete(syncKey);
    }

    return (
      this.syncStatuses.get(channel) || {
        channel,
        lastSyncTime: new Date(),
        status: 'failure',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
      }
    );
  }

  /**
   * Sincronizar canal específico: SQLite → JSONL
   */
  async syncFromSQLitetoJSONL(
    channel: string,
    pipelineId?: string
  ): Promise<SyncStatus> {
    const syncKey = `${channel}:sqlite-to-jsonl`;

    if (this.activeSyncs.has(syncKey)) {
      this.logger.debug('[ChatSync] Sync already in progress', { channel });
      return this.syncStatuses.get(channel) || {
        channel,
        lastSyncTime: new Date(),
        status: 'in-progress',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
      };
    }

    const syncPromise = this.performSyncSQLitetoJSONL(channel, pipelineId);
    this.activeSyncs.set(syncKey, syncPromise);

    try {
      await syncPromise;
    } finally {
      this.activeSyncs.delete(syncKey);
    }

    return (
      this.syncStatuses.get(channel) || {
        channel,
        lastSyncTime: new Date(),
        status: 'failure',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
      }
    );
  }

  /**
   * Sincronização bidirecional (resolver conflitos)
   */
  async bidirectionalSync(channel: string, pipelineId?: string): Promise<SyncStatus> {
    try {
      this.logger.info('[ChatSync] Starting bidirectional sync', { channel });

      // 1. Obter mensagens do JSONL
      const jsonlMessages = this.chatService.getHistory();

      // 2. Obter histórico do SQLite
      const sqliteHistories = await this.chatHistoryService.listHistories({
        channel,
        pipelineId,
      });

      let sqliteMessages: ChatMessage[] = [];
      if (sqliteHistories.length > 0) {
        sqliteMessages = sqliteHistories[0].messages || [];
      }

      // 3. Mesclar com estratégia: mais recente vence
      const merged = this.mergeMessages(jsonlMessages, sqliteMessages);

      // 4. Salvar de volta em ambos os locais
      this.chatService.clear();
      for (const msg of merged) {
        this.chatService.send(msg);
      }

      const history = await this.chatHistoryService.saveHistory({
        channel,
        pipelineId,
        messages: merged,
        workspace: '',
      });

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'success',
        messagesFromJSONL: jsonlMessages.length,
        messagesToSQLite: merged.length,
        messagesFromSQLite: sqliteMessages.length,
      };

      this.syncStatuses.set(channel, status);

      this.logger.info('[ChatSync] Bidirectional sync completed', {
        channel,
        totalMessages: merged.length,
      });

      await this.bus.emit('chat:sync:completed', {
        channel,
        pipelineId,
        totalMessages: merged.length,
        timestamp: new Date().toISOString(),
      });

      return status;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'failure',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
        error: errorMsg,
      };

      this.syncStatuses.set(channel, status);

      this.logger.error('[ChatSync] Sync failed', { error, channel });

      await this.bus.emit('chat:sync:error', {
        channel,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });

      return status;
    }
  }

  /**
   * Implementação interna: JSONL → SQLite
   */
  private async performSyncJSONLtoSQLite(
    channel: string,
    pipelineId?: string
  ): Promise<void> {
    try {
      const jsonlMessages = this.chatService.getHistory();

      await this.chatHistoryService.saveHistory({
        channel,
        pipelineId,
        messages: jsonlMessages,
        workspace: '',
      });

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'success',
        messagesFromJSONL: jsonlMessages.length,
        messagesToSQLite: jsonlMessages.length,
        messagesFromSQLite: 0,
      };

      this.syncStatuses.set(channel, status);

      this.logger.info('[ChatSync] JSONL → SQLite sync completed', {
        channel,
        messagesCount: jsonlMessages.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'failure',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
        error: errorMsg,
      };

      this.syncStatuses.set(channel, status);

      this.logger.error('[ChatSync] JSONL → SQLite sync failed', { error, channel });

      throw error;
    }
  }

  /**
   * Implementação interna: SQLite → JSONL
   */
  private async performSyncSQLitetoJSONL(
    channel: string,
    pipelineId?: string
  ): Promise<void> {
    try {
      const histories = await this.chatHistoryService.listHistories({
        channel,
        pipelineId,
      });

      if (histories.length === 0) {
        throw new Error('No history found in SQLite');
      }

      const messages = histories[0].messages || [];

      // Limpar JSONL e reescrever com mensagens do SQLite
      this.chatService.clear();
      for (const msg of messages) {
        this.chatService.send(msg);
      }

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'success',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: messages.length,
      };

      this.syncStatuses.set(channel, status);

      this.logger.info('[ChatSync] SQLite → JSONL sync completed', {
        channel,
        messagesCount: messages.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const status: SyncStatus = {
        channel,
        lastSyncTime: new Date(),
        status: 'failure',
        messagesFromJSONL: 0,
        messagesToSQLite: 0,
        messagesFromSQLite: 0,
        error: errorMsg,
      };

      this.syncStatuses.set(channel, status);

      this.logger.error('[ChatSync] SQLite → JSONL sync failed', { error, channel });

      throw error;
    }
  }

  /**
   * Mesclar mensagens de JSONL e SQLite, resolvendo conflitos
   */
  private mergeMessages(
    jsonlMessages: ChatMessage[],
    sqliteMessages: ChatMessage[]
  ): ChatMessage[] {
    const merged = new Map<string, ChatMessage>();

    // Adicionar mensagens do JSONL
    for (const msg of jsonlMessages) {
      merged.set(msg.id, msg);
    }

    // Adicionar/atualizar mensagens do SQLite
    for (const msg of sqliteMessages) {
      const existing = merged.get(msg.id);
      if (!existing) {
        merged.set(msg.id, msg);
      } else {
        // Resolver conflito: mais recente vence
        const existingTime = new Date(existing.timestamp).getTime();
        const newTime = new Date(msg.timestamp).getTime();

        if (newTime > existingTime) {
          merged.set(msg.id, msg);
        }
      }
    }

    // Retornar ordenado por timestamp
    return Array.from(merged.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Obter status de sincronização
   */
  getSyncStatus(channel: string): SyncStatus | undefined {
    return this.syncStatuses.get(channel);
  }

  /**
   * Listar todos os status de sincronização
   */
  getAllSyncStatuses(): SyncStatus[] {
    return Array.from(this.syncStatuses.values());
  }

  /**
   * Resetar status de sincronização
   */
  resetSyncStatus(channel: string): void {
    this.syncStatuses.delete(channel);
  }
}
