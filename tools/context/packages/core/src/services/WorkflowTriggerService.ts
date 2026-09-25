import { Logger } from '../utils/Logger';
import { getEventBus } from '../events';
import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow Trigger Service
 * 
 * Permite disparar workflows baseado em:
 * - Eventos do EventBus
 * - Mudanças em arquivos (file watcher)
 * - Agendamento via cron
 * - Requisições HTTP
 */

export type TriggerType = 'event' | 'file-change' | 'schedule' | 'manual' | 'webhook';

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  triggerType: TriggerType;
  enabled: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  config: TriggerConfig;
}

export type TriggerConfig =
  | EventTriggerConfig
  | FileTriggerConfig
  | ScheduleTriggerConfig
  | WebhookTriggerConfig;

export interface EventTriggerConfig {
  type: 'event';
  eventType: string;
  eventFilter?: Record<string, any>;
}

export interface FileTriggerConfig {
  type: 'file-change';
  filePatterns: string[];
  ignorePatterns?: string[];
  changeTypes?: ('add' | 'change' | 'unlink')[];
}

export interface ScheduleTriggerConfig {
  type: 'schedule';
  cronExpression: string;
  timezone?: string;
}

export interface WebhookTriggerConfig {
  type: 'webhook';
  secret?: string;
  ipWhitelist?: string[];
}

export interface TriggerExecution {
  id: string;
  triggerId: string;
  workflowId: string;
  executedAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  error?: string;
}

export class WorkflowTriggerService extends EventEmitter {
  private logger = Logger.getInstance();
  private bus = getEventBus('workflow-triggers');
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private executions: Map<string, TriggerExecution> = new Map();
  private fileWatchers: Map<string, chokidar.FSWatcher> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Registrar trigger de evento
   */
  registerEventTrigger(
    workflowId: string,
    eventType: string,
    eventFilter?: Record<string, any>
  ): WorkflowTrigger {
    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      triggerType: 'event',
      enabled: true,
      createdAt: new Date(),
      config: {
        type: 'event',
        eventType,
        eventFilter,
      },
    };

    this.triggers.set(trigger.id, trigger);

    // Subscribir ao evento
    this.bus.on(eventType, (event) => {
      if (this.matchesFilter(event, eventFilter)) {
        this.executeWorkflow(trigger, { event }).catch(err => {
          this.logger.error('[WorkflowTrigger] Failed to execute workflow', {
            error: err,
            triggerId: trigger.id,
          });
        });
      }
    });

    this.logger.info('[WorkflowTrigger] Event trigger registered', {
      triggerId: trigger.id,
      workflowId,
      eventType,
    });

    return trigger;
  }

  /**
   * Registrar trigger de mudança de arquivo
   */
  registerFileTrigger(
    workflowId: string,
    filePatterns: string[],
    options?: {
      ignorePatterns?: string[];
      changeTypes?: ('add' | 'change' | 'unlink')[];
    }
  ): WorkflowTrigger {
    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      triggerType: 'file-change',
      enabled: true,
      createdAt: new Date(),
      config: {
        type: 'file-change',
        filePatterns,
        ignorePatterns: options?.ignorePatterns,
        changeTypes: options?.changeTypes || ['add', 'change', 'unlink'],
      },
    };

    this.triggers.set(trigger.id, trigger);

    // Iniciar file watcher
    const watcher = chokidar.watch(filePatterns, {
      ignored: options?.ignorePatterns || [],
      ignoreInitial: true,
      persistent: true,
    });

    const changeTypes = (options?.changeTypes || ['add', 'change', 'unlink']) as Array<
      'add' | 'change' | 'unlink'
    >;

    changeTypes.forEach(changeType => {
      watcher.on(changeType, (path) => {
        this.executeWorkflow(trigger, { filePath: path, changeType }).catch(err => {
          this.logger.error('[WorkflowTrigger] Failed to execute workflow', {
            error: err,
            triggerId: trigger.id,
          });
        });
      });
    });

    this.fileWatchers.set(trigger.id, watcher);

    this.logger.info('[WorkflowTrigger] File trigger registered', {
      triggerId: trigger.id,
      workflowId,
      filePatterns,
    });

    return trigger;
  }

  /**
   * Registrar trigger de agendamento (cron)
   */
  registerScheduleTrigger(
    workflowId: string,
    cronExpression: string,
    timezone?: string
  ): WorkflowTrigger {
    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      triggerType: 'schedule',
      enabled: true,
      createdAt: new Date(),
      config: {
        type: 'schedule',
        cronExpression,
        timezone,
      },
    };

    this.triggers.set(trigger.id, trigger);

    // Agendar job cron
    try {
      const job = cron.schedule(
        cronExpression,
        () => {
          this.executeWorkflow(trigger, { scheduledTime: new Date() }).catch(err => {
            this.logger.error('[WorkflowTrigger] Failed to execute scheduled workflow', {
              error: err,
              triggerId: trigger.id,
            });
          });
        },
        {
          timezone,
        }
      );

      this.cronJobs.set(trigger.id, job);

      this.logger.info('[WorkflowTrigger] Schedule trigger registered', {
        triggerId: trigger.id,
        workflowId,
        cronExpression,
        timezone,
      });
    } catch (error) {
      this.logger.error('[WorkflowTrigger] Invalid cron expression', {
        error,
        cronExpression,
      });
      throw error;
    }

    return trigger;
  }

  /**
   * Registrar trigger de webhook
   */
  registerWebhookTrigger(
    workflowId: string,
    secret?: string,
    ipWhitelist?: string[]
  ): WorkflowTrigger {
    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      triggerType: 'webhook',
      enabled: true,
      createdAt: new Date(),
      config: {
        type: 'webhook',
        secret,
        ipWhitelist,
      },
    };

    this.triggers.set(trigger.id, trigger);

    this.logger.info('[WorkflowTrigger] Webhook trigger registered', {
      triggerId: trigger.id,
      workflowId,
      hasSecret: !!secret,
    });

    return trigger;
  }

  /**
   * Executar workflow via webhook
   */
  async executeViaWebhook(
    triggerId: string,
    payload: any,
    ipAddress?: string
  ): Promise<TriggerExecution> {
    const trigger = this.triggers.get(triggerId);

    if (!trigger) {
      throw new Error(`Trigger not found: ${triggerId}`);
    }

    if (trigger.triggerType !== 'webhook') {
      throw new Error(`Trigger is not a webhook trigger`);
    }

    const config = trigger.config as WebhookTriggerConfig;

    // Validar IP se whitelist configurado
    if (config.ipWhitelist && ipAddress && !config.ipWhitelist.includes(ipAddress)) {
      throw new Error(`IP address not whitelisted: ${ipAddress}`);
    }

    return this.executeWorkflow(trigger, { payload, ipAddress });
  }

  /**
   * Executar workflow manualmente
   */
  async executeManually(workflowId: string, params?: any): Promise<TriggerExecution> {
    // Criar trigger temporal para execução manual
    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      triggerType: 'manual',
      enabled: true,
      createdAt: new Date(),
      config: {
        type: 'event' as any, // Dummy config
      },
    };

    return this.executeWorkflow(trigger, { manualParams: params });
  }

  /**
   * Executar workflow
   */
  private async executeWorkflow(
    trigger: WorkflowTrigger,
    context?: any
  ): Promise<TriggerExecution> {
    const execution: TriggerExecution = {
      id: uuidv4(),
      triggerId: trigger.id,
      workflowId: trigger.workflowId,
      executedAt: new Date(),
      status: 'pending',
    };

    this.executions.set(execution.id, execution);
    trigger.lastTriggeredAt = new Date();

    this.logger.info('[WorkflowTrigger] Executing workflow', {
      executionId: execution.id,
      workflowId: trigger.workflowId,
      triggerType: trigger.triggerType,
    });

    try {
      execution.status = 'running';

      // Emitir evento de execução
      await this.bus.emit('workflow:triggered', {
        executionId: execution.id,
        workflowId: trigger.workflowId,
        triggerId: trigger.id,
        triggerType: trigger.triggerType,
        context,
        timestamp: new Date().toISOString(),
      });

      // TODO: Chamar executor real do workflow

      execution.status = 'completed';

      this.logger.info('[WorkflowTrigger] Workflow executed', {
        executionId: execution.id,
        workflowId: trigger.workflowId,
      });
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);

      this.logger.error('[WorkflowTrigger] Workflow execution failed', {
        executionId: execution.id,
        error: execution.error,
      });

      await this.bus.emit('workflow:trigger:failed', {
        executionId: execution.id,
        error: execution.error,
        timestamp: new Date().toISOString(),
      });
    }

    return execution;
  }

  /**
   * Verificar se evento corresponde ao filtro
   */
  private matchesFilter(event: any, filter?: Record<string, any>): boolean {
    if (!filter) {
      return true;
    }

    for (const [key, value] of Object.entries(filter)) {
      if (event.data?.[key] !== value && event[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Desabilitar trigger
   */
  disableTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;

      // Parar watchers/jobs se aplicável
      if (trigger.triggerType === 'file-change') {
        const watcher = this.fileWatchers.get(triggerId);
        if (watcher) {
          watcher.close();
          this.fileWatchers.delete(triggerId);
        }
      } else if (trigger.triggerType === 'schedule') {
        const job = this.cronJobs.get(triggerId);
        if (job) {
          job.stop();
          this.cronJobs.delete(triggerId);
        }
      }
    }
  }

  /**
   * Habilitar trigger
   */
  enableTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = true;
      // TODO: Reinicializar watchers/jobs se necessário
    }
  }

  /**
   * Obter trigger
   */
  getTrigger(triggerId: string): WorkflowTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Listar triggers de um workflow
   */
  getWorkflowTriggers(workflowId: string): WorkflowTrigger[] {
    const results: WorkflowTrigger[] = [];

    for (const [, trigger] of this.triggers) {
      if (trigger.workflowId === workflowId) {
        results.push(trigger);
      }
    }

    return results;
  }

  /**
   * Deletar trigger
   */
  deleteTrigger(triggerId: string): void {
    this.disableTrigger(triggerId);
    this.triggers.delete(triggerId);
  }

  /**
   * Limpar resources
   */
  async cleanup(): Promise<void> {
    // Fechar todos os watchers
    for (const [, watcher] of this.fileWatchers) {
      await watcher.close();
    }
    this.fileWatchers.clear();

    // Parar todos os cron jobs
    for (const [, job] of this.cronJobs) {
      job.stop();
    }
    this.cronJobs.clear();
  }
}
