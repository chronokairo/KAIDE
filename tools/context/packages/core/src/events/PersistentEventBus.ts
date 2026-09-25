import { EventBus, BusEvent, EventType } from './EventBus';
import { PersistentEventStore } from '../services/PersistentEventStore';
import { Logger } from '../utils/Logger';

/**
 * PersistentEventBus - Estende EventBus com armazenamento durável
 * 
 * Automaticamente persiste todos os eventos emitidos no banco de dados
 * enquanto mantém a funcionalidade em memória para performance
 */

export class PersistentEventBus extends EventBus {
  private store: PersistentEventStore;
  private logger = Logger.getInstance();
  private projectId?: string;
  private workspaceId?: string;

  constructor(
    sourceId: string,
    store: PersistentEventStore,
    options?: {
      projectId?: string;
      workspaceId?: string;
    }
  ) {
    super(sourceId);
    this.store = store;
    this.projectId = options?.projectId;
    this.workspaceId = options?.workspaceId;
  }

  /**
   * Override emit para adicionar persistência automática
   */
  async emit(eventType: EventType, data?: any): Promise<void> {
    // Chamar emit original (em memória)
    await super.emit(eventType, data);

    // Persistir evento
    this.store
      .saveEvent({
        type: eventType,
        sourceId: this.getSourceId(),
        data,
        timestamp: new Date(),
        projectId: this.projectId,
        workspaceId: this.workspaceId,
      })
      .catch(error => {
        this.logger.error('[PersistentEventBus] Failed to persist event', {
          error,
          eventType,
          sourceId: this.getSourceId(),
        });
      });
  }

  /**
   * Recuperar eventos persistidos
   */
  async getPersistedEvents(
    eventType?: EventType,
    limit: number = 100
  ): Promise<any[]> {
    if (eventType) {
      const events = await this.store.getEventsByType(eventType, {
        limit,
        projectId: this.projectId,
        workspaceId: this.workspaceId,
      });
      return events.map(e => ({
        type: e.type,
        data: e.data,
        timestamp: e.timestamp,
        sourceId: e.sourceId,
      }));
    } else {
      const events = await this.store.getRecentEvents(limit, {
        projectId: this.projectId,
        workspaceId: this.workspaceId,
      });
      return events.map(e => ({
        type: e.type,
        data: e.data,
        timestamp: e.timestamp,
        sourceId: e.sourceId,
      }));
    }
  }

  /**
   * Recuperar histórico completo de um workspace/projeto
   */
  async getEventHistory(options?: {
    fromDate?: Date;
    toDate?: Date;
    typePrefix?: string;
  }): Promise<any[]> {
    if (!options?.fromDate || !options?.toDate) {
      // Default: últimas 24 horas
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
      options = { ...options, fromDate, toDate };
    }

    const events = await this.store.getEventsByTimeRange(
      options.fromDate!,
      options.toDate!,
      {
        projectId: this.projectId,
        workspaceId: this.workspaceId,
        typePrefix: options.typePrefix,
      }
    );

    return events.map(e => ({
      type: e.type,
      data: e.data,
      timestamp: e.timestamp,
      sourceId: e.sourceId,
    }));
  }

  /**
   * Exportar eventos para arquivo
   */
  async exportEvents(filePath: string): Promise<boolean> {
    return this.store.exportToJson(filePath, {
      projectId: this.projectId,
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias
    });
  }

  /**
   * Obter ID da fonte
   */
  private getSourceId(): string {
    // Acessar sourceId privado usando reflection
    return (this as any).sourceId || 'unknown';
  }
}

// Registry de persistent event buses por workspace
const persistentBusRegistry = new Map<string, PersistentEventBus>();

/**
 * Factory para criar ou obter PersistentEventBus
 */
export function getPersistentEventBus(
  sourceId: string,
  store: PersistentEventStore,
  options?: {
    projectId?: string;
    workspaceId?: string;
  }
): PersistentEventBus {
  const key = `${options?.workspaceId || 'default'}:${sourceId}`;

  if (!persistentBusRegistry.has(key)) {
    persistentBusRegistry.set(
      key,
      new PersistentEventBus(sourceId, store, options)
    );
  }

  return persistentBusRegistry.get(key)!;
}
