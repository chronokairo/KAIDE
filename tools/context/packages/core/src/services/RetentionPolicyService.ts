import { Logger } from '../utils/Logger';
import { getEventBus } from '../events';
import { ChatHistoryService } from './ChatHistoryService';
import { SafetyNetIntegrationService } from './SafetyNetIntegrationService';

/**
 * Retention Policy Service
 * 
 * Gerencia limpeza automática de:
 * - Snapshots antigos
 * - Históricos de chat
 * - Backups antigos
 * - Logs de execução
 */

export interface RetentionPolicy {
  snapshotsRetentionDays: number;
  chatHistoryRetentionDays: number;
  backupsRetentionDays: number;
  logsRetentionDays: number;
  maxSnapshotsPerPipeline: number;
  maxChatMessagesPerChannel: number;
}

export interface CleanupResult {
  snapshotsDeleted: number;
  historiesDeleted: number;
  backupsDeleted: number;
  spaceFreedMb: number;
  timestamp: Date;
}

export class RetentionPolicyService {
  private logger = Logger.getInstance();
  private bus = getEventBus('retention-policy');
  private cleanupSchedule: NodeJS.Timer | null = null;
  private isRunning = false;

  private readonly defaultPolicy: RetentionPolicy = {
    snapshotsRetentionDays: 30,
    chatHistoryRetentionDays: 90,
    backupsRetentionDays: 14,
    logsRetentionDays: 30,
    maxSnapshotsPerPipeline: 10,
    maxChatMessagesPerChannel: 10000,
  };

  private policy: RetentionPolicy;

  constructor(
    private chatHistoryService?: ChatHistoryService,
    private safetyNetService?: SafetyNetIntegrationService,
    customPolicy?: Partial<RetentionPolicy>
  ) {
    this.policy = { ...this.defaultPolicy, ...customPolicy };

    this.logger.info('[RetentionPolicy] Service initialized', {
      snapshotsRetentionDays: this.policy.snapshotsRetentionDays,
      chatHistoryRetentionDays: this.policy.chatHistoryRetentionDays,
    });
  }

  /**
   * Iniciar scheduler automático de limpeza
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[RetentionPolicy] Cleanup already running');
      return;
    }

    this.isRunning = true;

    // Executar limpeza a cada 24 horas
    const cleanupIntervalMs = 24 * 60 * 60 * 1000;

    // Executar limpeza inicial após 1 hora
    setTimeout(() => {
      this.executeCleanup().catch(err => {
        this.logger.error('[RetentionPolicy] Initial cleanup failed', { error: err });
      });
    }, 60 * 60 * 1000);

    // Agendar limpeza periódica
    this.cleanupSchedule = setInterval(() => {
      this.executeCleanup().catch(err => {
        this.logger.error('[RetentionPolicy] Scheduled cleanup failed', { error: err });
      });
    }, cleanupIntervalMs);

    this.logger.info('[RetentionPolicy] Cleanup scheduler started', {
      intervalHours: 24,
    });

    await this.bus.emit('retention:policy:started', {
      policy: this.policy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Parar scheduler automático
   */
  async stop(): Promise<void> {
    if (this.cleanupSchedule) {
      clearInterval(this.cleanupSchedule);
      this.cleanupSchedule = null;
    }

    this.isRunning = false;

    this.logger.info('[RetentionPolicy] Cleanup scheduler stopped');

    await this.bus.emit('retention:policy:stopped', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Executar limpeza completa
   */
  async executeCleanup(): Promise<CleanupResult> {
    const startTime = Date.now();

    this.logger.info('[RetentionPolicy] Starting cleanup execution');

    let snapshotsDeleted = 0;
    let historiesDeleted = 0;
    let backupsDeleted = 0;

    // Limpar snapshots antigos
    if (this.safetyNetService) {
      try {
        snapshotsDeleted = await this.cleanupSnapshots();
      } catch (error) {
        this.logger.error('[RetentionPolicy] Failed to cleanup snapshots', { error });
      }
    }

    // Limpar históricos de chat antigos
    if (this.chatHistoryService) {
      try {
        historiesDeleted = await this.cleanupChatHistories();
      } catch (error) {
        this.logger.error('[RetentionPolicy] Failed to cleanup chat histories', { error });
      }
    }

    // Limpar backups antigos
    if (this.chatHistoryService) {
      try {
        backupsDeleted = await this.cleanupBackups();
      } catch (error) {
        this.logger.error('[RetentionPolicy] Failed to cleanup backups', { error });
      }
    }

    const duration = Date.now() - startTime;

    const result: CleanupResult = {
      snapshotsDeleted,
      historiesDeleted,
      backupsDeleted,
      spaceFreedMb: (snapshotsDeleted + historiesDeleted + backupsDeleted) * 0.5, // Aproximação
      timestamp: new Date(),
    };

    this.logger.info('[RetentionPolicy] Cleanup completed', {
      ...result,
      durationMs: duration,
    });

    await this.bus.emit('retention:policy:cleanup:completed', {
      ...result,
      durationMs: duration,
    });

    return result;
  }

  /**
   * Limpar snapshots antigos
   */
  private async cleanupSnapshots(): Promise<number> {
    if (!this.safetyNetService) {
      return 0;
    }

    try {
      // Deletar snapshots com mais de X dias
      // Esta é uma operação customizada por pipeline
      // Para simplificar, aqui apenas reportamos que seria feita

      this.logger.debug('[RetentionPolicy] Snapshots cleanup simulated', {
        retentionDays: this.policy.snapshotsRetentionDays,
      });

      return 0; // TODO: implementar real cleanup baseado em pipeline
    } catch (error) {
      this.logger.error('[RetentionPolicy] Snapshots cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Limpar históricos de chat antigos
   */
  private async cleanupChatHistories(): Promise<number> {
    if (!this.chatHistoryService) {
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.policy.chatHistoryRetentionDays);

      // Obter históricos antigos
      const oldHistories = await this.chatHistoryService.listHistories({
        toDate: cutoffDate,
        limit: 1000,
      });

      let deleted = 0;

      // Deletar históricos antigos
      for (const history of oldHistories) {
        try {
          await this.chatHistoryService.deleteHistory(history.id);
          deleted++;
        } catch (err) {
          this.logger.warn('[RetentionPolicy] Failed to delete history', {
            historyId: history.id,
            error: err,
          });
        }
      }

      this.logger.info('[RetentionPolicy] Chat histories cleaned up', {
        deleted,
        retentionDays: this.policy.chatHistoryRetentionDays,
      });

      return deleted;
    } catch (error) {
      this.logger.error('[RetentionPolicy] Chat history cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Limpar backups antigos
   */
  private async cleanupBackups(): Promise<number> {
    if (!this.chatHistoryService) {
      return 0;
    }

    try {
      const deleted = this.chatHistoryService.cleanupOldBackups(
        this.policy.backupsRetentionDays
      );

      this.logger.info('[RetentionPolicy] Backups cleaned up', {
        deleted,
        retentionDays: this.policy.backupsRetentionDays,
      });

      return deleted;
    } catch (error) {
      this.logger.error('[RetentionPolicy] Backup cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Atualizar política de retenção
   */
  updatePolicy(newPolicy: Partial<RetentionPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };

    this.logger.info('[RetentionPolicy] Policy updated', { policy: this.policy });

    this.bus.emit('retention:policy:updated', {
      policy: this.policy,
      timestamp: new Date().toISOString(),
    }).catch(err => {
      this.logger.error('[RetentionPolicy] Failed to emit policy update', { error: err });
    });
  }

  /**
   * Obter política atual
   */
  getPolicy(): RetentionPolicy {
    return { ...this.policy };
  }

  /**
   * Executar limpeza manual
   */
  async runManualCleanup(): Promise<CleanupResult> {
    this.logger.info('[RetentionPolicy] Manual cleanup triggered');
    return this.executeCleanup();
  }

  /**
   * Obter status do scheduler
   */
  getStatus(): {
    isRunning: boolean;
    policy: RetentionPolicy;
  } {
    return {
      isRunning: this.isRunning,
      policy: this.policy,
    };
  }
}
