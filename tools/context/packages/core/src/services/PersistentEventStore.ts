import { DataSource, Repository } from 'typeorm';
import { Entity, PrimaryColumn, Column } from 'typeorm';
import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Entity para persistência de eventos no banco de dados
 */
@Entity('events')
export class EventEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  type!: string;

  @Column('varchar', { nullable: true })
  sourceId?: string;

  @Column('json', { nullable: true })
  data?: any;

  @Column('datetime')
  timestamp!: Date;

  @Column('varchar', { nullable: true })
  projectId?: string;

  @Column('varchar', { nullable: true })
  workspaceId?: string;
}

/**
 * Persistent Event Store
 * 
 * Armazena todos os eventos em banco de dados para:
 * - Reconstrução de estado após restart
 * - Auditoria completa
 * - Replay de eventos
 * - Análise de padrões
 */
export class PersistentEventStore {
  private logger = Logger.getInstance();
  private eventRepository: Repository<EventEntity> | null = null;
  private maxRetries = 3;

  constructor(private db?: DataSource) {
    if (db) {
      this.eventRepository = db.getRepository(EventEntity);
    }
  }

  /**
   * Salvar evento no armazenamento persistente
   */
  async saveEvent(event: {
    type: string;
    sourceId?: string;
    data?: any;
    timestamp: Date;
    projectId?: string;
    workspaceId?: string;
  }): Promise<string> {
    if (!this.eventRepository) {
      this.logger.debug('[EventStore] Repository not initialized, event not persisted');
      return '';
    }

    try {
      const eventId = uuidv4();
      const eventEntity = new EventEntity();

      eventEntity.id = eventId;
      eventEntity.type = event.type;
      eventEntity.sourceId = event.sourceId;
      eventEntity.data = event.data;
      eventEntity.timestamp = event.timestamp;
      eventEntity.projectId = event.projectId;
      eventEntity.workspaceId = event.workspaceId;

      await this.eventRepository.save(eventEntity);

      this.logger.debug('[EventStore] Event saved', {
        eventId,
        type: event.type,
        sourceId: event.sourceId,
      });

      return eventId;
    } catch (error) {
      this.logger.error('[EventStore] Failed to save event', {
        error,
        eventType: event.type,
      });
      return '';
    }
  }

  /**
   * Recuperar eventos por tipo com filtros
   */
  async getEventsByType(
    type: string,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
      projectId?: string;
      workspaceId?: string;
    }
  ): Promise<EventEntity[]> {
    if (!this.eventRepository) {
      return [];
    }

    try {
      let query = this.eventRepository.createQueryBuilder('event').where('event.type = :type', { type });

      if (options?.fromDate) {
        query = query.andWhere('event.timestamp >= :fromDate', {
          fromDate: options.fromDate,
        });
      }

      if (options?.toDate) {
        query = query.andWhere('event.timestamp <= :toDate', {
          toDate: options.toDate,
        });
      }

      if (options?.projectId) {
        query = query.andWhere('event.projectId = :projectId', {
          projectId: options.projectId,
        });
      }

      if (options?.workspaceId) {
        query = query.andWhere('event.workspaceId = :workspaceId', {
          workspaceId: options.workspaceId,
        });
      }

      query = query.orderBy('event.timestamp', 'DESC');

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error('[EventStore] Failed to get events by type', {
        error,
        type,
      });
      return [];
    }
  }

  /**
   * Recuperar eventos recentes
   */
  async getRecentEvents(
    limit: number = 100,
    options?: {
      type?: string;
      projectId?: string;
      workspaceId?: string;
    }
  ): Promise<EventEntity[]> {
    if (!this.eventRepository) {
      return [];
    }

    try {
      let query = this.eventRepository.createQueryBuilder('event');

      if (options?.type) {
        query = query.where('event.type LIKE :type', {
          type: `${options.type}%`,
        });
      }

      if (options?.projectId) {
        query = query.andWhere('event.projectId = :projectId', {
          projectId: options.projectId,
        });
      }

      if (options?.workspaceId) {
        query = query.andWhere('event.workspaceId = :workspaceId', {
          workspaceId: options.workspaceId,
        });
      }

      return await query.orderBy('event.timestamp', 'DESC').limit(limit).getMany();
    } catch (error) {
      this.logger.error('[EventStore] Failed to get recent events', { error });
      return [];
    }
  }

  /**
   * Recuperar eventos dentro de um intervalo de tempo
   */
  async getEventsByTimeRange(
    fromDate: Date,
    toDate: Date,
    options?: {
      projectId?: string;
      workspaceId?: string;
      typePrefix?: string;
    }
  ): Promise<EventEntity[]> {
    if (!this.eventRepository) {
      return [];
    }

    try {
      let query = this.eventRepository
        .createQueryBuilder('event')
        .where('event.timestamp >= :fromDate', { fromDate })
        .andWhere('event.timestamp <= :toDate', { toDate });

      if (options?.projectId) {
        query = query.andWhere('event.projectId = :projectId', {
          projectId: options.projectId,
        });
      }

      if (options?.workspaceId) {
        query = query.andWhere('event.workspaceId = :workspaceId', {
          workspaceId: options.workspaceId,
        });
      }

      if (options?.typePrefix) {
        query = query.andWhere('event.type LIKE :type', {
          type: `${options.typePrefix}%`,
        });
      }

      return await query.orderBy('event.timestamp', 'DESC').getMany();
    } catch (error) {
      this.logger.error('[EventStore] Failed to get events by time range', {
        error,
        fromDate,
        toDate,
      });
      return [];
    }
  }

  /**
   * Limpar eventos antigos (retention policy)
   */
  async cleanupOldEvents(daysOld: number = 30): Promise<number> {
    if (!this.eventRepository) {
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.eventRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute();

      const deleted = result.affected || 0;

      this.logger.info('[EventStore] Old events cleaned up', {
        deleted,
        daysOld,
        cutoffDate,
      });

      return deleted;
    } catch (error) {
      this.logger.error('[EventStore] Failed to cleanup old events', {
        error,
        daysOld,
      });
      return 0;
    }
  }

  /**
   * Obter contagem de eventos
   */
  async getEventCount(options?: {
    type?: string;
    projectId?: string;
    workspaceId?: string;
  }): Promise<number> {
    if (!this.eventRepository) {
      return 0;
    }

    try {
      let query = this.eventRepository.createQueryBuilder('event');

      if (options?.type) {
        query = query.where('event.type = :type', { type: options.type });
      }

      if (options?.projectId) {
        query = query.andWhere('event.projectId = :projectId', {
          projectId: options.projectId,
        });
      }

      if (options?.workspaceId) {
        query = query.andWhere('event.workspaceId = :workspaceId', {
          workspaceId: options.workspaceId,
        });
      }

      return await query.getCount();
    } catch (error) {
      this.logger.error('[EventStore] Failed to get event count', { error });
      return 0;
    }
  }

  /**
   * Exportar eventos para arquivo JSON
   */
  async exportToJson(filePath: string, options?: {
    type?: string;
    projectId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<boolean> {
    try {
      const events = await this.getRecentEvents(10000, {
        type: options?.type,
        projectId: options?.projectId,
      });

      const fs = await import('fs').then(m => m.promises);
      await fs.writeFile(filePath, JSON.stringify(events, null, 2));

      this.logger.info('[EventStore] Events exported to JSON', {
        filePath,
        count: events.length,
      });

      return true;
    } catch (error) {
      this.logger.error('[EventStore] Failed to export events', {
        error,
        filePath,
      });
      return false;
    }
  }

  /**
   * Inicializar tabela de eventos se não existir
   */
  async initialize(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const schemaBuilder = this.db.createSchemaBuilder();
      const hasTable = await schemaBuilder.hasTable('events');

      if (!hasTable) {
        this.logger.info('[EventStore] Creating events table');
        // TypeORM criará a tabela automaticamente
        await this.db.synchronize();
      }
    } catch (error) {
      this.logger.error('[EventStore] Failed to initialize', { error });
      throw error;
    }
  }
}
