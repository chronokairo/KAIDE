import { DataSource } from 'typeorm';
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

/**
 * Auto-Sync Service
 * 
 * Gerencia sincronização automática de contexto entre:
 * - Diretório do projeto (workspace)
 * - Banco de dados (SQLite)
 * - VS Code (mediante EventBus)
 * 
 * Monitora mudanças em arquivos e sincroniza automaticamente
 * com debounce para evitar múltiplas sincronizações simultâneas.
 */

export interface AutoSyncConfig {
  projectPath: string;
  workspaceId: string;
  projectId: string;
  debounceMs?: number;
  watchPatterns?: string[];
  ignorePatterns?: string[];
}

export interface SyncEvent {
  type: 'file-changed' | 'sync-started' | 'sync-completed' | 'sync-error';
  projectId: string;
  workspaceId: string;
  timestamp: Date;
  data?: any;
}

export class AutoSyncService extends EventEmitter {
  private logger = Logger.getInstance();
  private isRunning: boolean = false;
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;
  private watchPatterns: string[];
  private ignorePatterns: string[];
  private config: AutoSyncConfig;
  private syncSchedule: NodeJS.Timer | null = null;
  private lastSyncTime: number = 0;
  private syncInProgress: boolean = false;

  constructor(
    private db?: DataSource,
    config?: Partial<AutoSyncConfig>
  ) {
    super();

    this.config = {
      projectPath: config?.projectPath || process.cwd(),
      workspaceId: config?.workspaceId || 'default',
      projectId: config?.projectId || 'default',
      debounceMs: config?.debounceMs || 1000,
    };

    this.debounceMs = this.config.debounceMs!;
    this.watchPatterns = config?.watchPatterns || ['**/*.ts', '**/*.tsx', '**/*.md', '**/*.json'];
    this.ignorePatterns = config?.ignorePatterns || [
      '**/node_modules/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/dist/**',
      '**/.anamnesic/**',
    ];

    this.logger.info('[AutoSync] Service initialized', {
      projectPath: this.config.projectPath,
      workspaceId: this.config.workspaceId,
    });
  }

  /**
   * Iniciar serviço de sincronização automática
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[AutoSync] Service already running');
      return;
    }

    try {
      this.logger.info('[AutoSync] Starting auto-sync service', {
        projectPath: this.config.projectPath,
      });

      this.isRunning = true;

      // Iniciar file watcher
      this.startFileWatcher();

      // Iniciar scheduled sync a cada 5 minutos
      this.startScheduledSync();

      // Emitir evento de inicialização
      this.emit('started', {
        type: 'sync-started',
        projectId: this.config.projectId,
        workspaceId: this.config.workspaceId,
        timestamp: new Date(),
      } as SyncEvent);

      this.logger.info('[AutoSync] Service started successfully');
    } catch (error) {
      this.logger.error('[AutoSync] Failed to start service', { error });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Parar serviço de sincronização automática
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('[AutoSync] Stopping auto-sync service');

      this.isRunning = false;

      // Fechar file watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }

      // Parar scheduled sync
      if (this.syncSchedule) {
        clearInterval(this.syncSchedule);
        this.syncSchedule = null;
      }

      // Limpar debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      this.emit('stopped', {
        type: 'sync-completed',
        projectId: this.config.projectId,
        workspaceId: this.config.workspaceId,
        timestamp: new Date(),
      } as SyncEvent);

      this.logger.info('[AutoSync] Service stopped');
    } catch (error) {
      this.logger.error('[AutoSync] Error stopping service', { error });
      throw error;
    }
  }

  /**
   * Verificar se o serviço está rodando
   */
  async isRunning(): Promise<boolean> {
    return this.isRunning;
  }

  /**
   * Executar sincronização manual
   */
  async sync(): Promise<boolean> {
    if (this.syncInProgress) {
      this.logger.debug('[AutoSync] Sync already in progress, skipping');
      return false;
    }

    try {
      this.syncInProgress = true;
      this.lastSyncTime = Date.now();

      this.logger.info('[AutoSync] Starting manual sync', {
        projectPath: this.config.projectPath,
      });

      // Aqui seria chamado o serviço de sincronização real
      // Por enquanto, apenas emitir evento
      this.emit('syncing', {
        type: 'sync-started',
        projectId: this.config.projectId,
        workspaceId: this.config.workspaceId,
        timestamp: new Date(),
      } as SyncEvent);

      // Simular delay de sincronização
      await new Promise(resolve => setTimeout(resolve, 500));

      this.emit('synced', {
        type: 'sync-completed',
        projectId: this.config.projectId,
        workspaceId: this.config.workspaceId,
        timestamp: new Date(),
      } as SyncEvent);

      this.logger.info('[AutoSync] Sync completed successfully');
      return true;
    } catch (error) {
      this.logger.error('[AutoSync] Sync failed', { error });
      this.emit('error', {
        type: 'sync-error',
        projectId: this.config.projectId,
        workspaceId: this.config.workspaceId,
        timestamp: new Date(),
        data: { error: String(error) },
      } as SyncEvent);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Iniciar file watcher para detectar mudanças
   */
  private startFileWatcher(): void {
    try {
      this.watcher = chokidar.watch(this.watchPatterns, {
        cwd: this.config.projectPath,
        ignored: this.ignorePatterns,
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100,
        },
      });

      // Eventos de mudança de arquivo
      this.watcher
        .on('add', (file) => this.onFileChanged(file, 'add'))
        .on('change', (file) => this.onFileChanged(file, 'change'))
        .on('unlink', (file) => this.onFileChanged(file, 'unlink'))
        .on('error', (error) => {
          this.logger.error('[AutoSync] File watcher error', { error });
        });

      this.logger.debug('[AutoSync] File watcher started');
    } catch (error) {
      this.logger.error('[AutoSync] Failed to start file watcher', { error });
      throw error;
    }
  }

  /**
   * Handler para mudanças em arquivos (com debounce)
   */
  private onFileChanged(file: string, type: string): void {
    this.logger.debug('[AutoSync] File changed', { file, type });

    // Emitir evento de mudança
    this.emit('file-changed', {
      type: 'file-changed',
      projectId: this.config.projectId,
      workspaceId: this.config.workspaceId,
      timestamp: new Date(),
      data: { file, changeType: type },
    } as SyncEvent);

    // Debounce: aguardar antes de sincronizar
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.sync().catch(error => {
        this.logger.error('[AutoSync] Auto-sync after file change failed', { error });
      });
    }, this.debounceMs);
  }

  /**
   * Iniciar scheduled sync periódico (a cada 5 minutos)
   */
  private startScheduledSync(): void {
    // Sync a cada 5 minutos
    const syncIntervalMs = 5 * 60 * 1000;

    this.syncSchedule = setInterval(() => {
      if (!this.syncInProgress) {
        this.sync().catch(error => {
          this.logger.error('[AutoSync] Scheduled sync failed', { error });
        });
      }
    }, syncIntervalMs);

    this.logger.debug('[AutoSync] Scheduled sync started', { intervalMs: syncIntervalMs });
  }

  /**
   * Obter status do serviço
   */
  getStatus(): {
    isRunning: boolean;
    lastSyncTime: number;
    syncInProgress: boolean;
    projectPath: string;
    workspaceId: string;
  } {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      projectPath: this.config.projectPath,
      workspaceId: this.config.workspaceId,
    };
  }
}
