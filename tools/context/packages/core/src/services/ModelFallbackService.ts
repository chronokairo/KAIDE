import { Logger } from '../utils/Logger';
import { AIProvider, ModelConfig } from '../providers/AIProvider';
import { getEventBus } from '../events';

/**
 * Model Fallback Service
 * 
 * Gerencia tentativas automáticas com diferentes modelos
 * quando um modelo falha. Suporta:
 * - Fallback chain customizável
 * - Retry com backoff exponencial
 * - Logging de falhas
 * - Métricas de sucesso/falha
 */

export interface FallbackStrategy {
  primaryModel: string;
  fallbackModels: string[];
  maxRetries?: number;
  retryDelayMs?: number;
  exponentialBackoff?: boolean;
}

export interface ModelExecutionResult {
  success: boolean;
  model: string;
  output?: string;
  error?: string;
  retriesUsed: number;
  totalDuration: number;
  timestamp: Date;
}

export class ModelFallbackService {
  private logger = Logger.getInstance();
  private bus = getEventBus('model-fallback');
  private executionHistory: Map<string, ModelExecutionResult[]> = new Map();
  private modelStats: Map<string, {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    avgResponseTime: number;
  }> = new Map();

  constructor(private aiProvider: AIProvider) {
    this.initializeModelStats();
  }

  /**
   * Executar com estratégia de fallback
   */
  async executeWithFallback(
    messages: Array<{ role: string; content: string }>,
    strategy: FallbackStrategy,
    options?: { streaming?: boolean; signal?: AbortSignal }
  ): Promise<ModelExecutionResult> {
    const startTime = Date.now();
    const models = [strategy.primaryModel, ...strategy.fallbackModels];
    const maxRetries = strategy.maxRetries || 2;
    const retryDelayMs = strategy.retryDelayMs || 1000;
    const useExponentialBackoff = strategy.exponentialBackoff !== false;

    let lastError: Error | null = null;

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const model = models[modelIndex];
      let retryCount = 0;

      while (retryCount <= maxRetries) {
        try {
          this.logger.info('[ModelFallback] Attempting execution', {
            model,
            attempt: retryCount + 1,
            modelIndex: modelIndex + 1,
            totalModels: models.length,
          });

          // Calcular delay com backoff exponencial se necessário
          if (retryCount > 0) {
            const delay = useExponentialBackoff
              ? retryDelayMs * Math.pow(2, retryCount - 1)
              : retryDelayMs;

            this.logger.debug('[ModelFallback] Waiting before retry', {
              delayMs: delay,
              retryCount,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Tentar execução com modelo atual
          const response = await this.aiProvider.chat(messages, {
            model,
            streaming: options?.streaming,
            signal: options?.signal,
          });

          const duration = Date.now() - startTime;
          const result: ModelExecutionResult = {
            success: true,
            model,
            output: typeof response === 'string' ? response : String(response),
            retriesUsed: retryCount,
            totalDuration: duration,
            timestamp: new Date(),
          };

          // Registrar sucesso
          this.recordSuccess(model, duration);

          await this.bus.emit('model:fallback:success', {
            model,
            retriesUsed: retryCount,
            duration,
            timestamp: new Date().toISOString(),
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          this.logger.warn('[ModelFallback] Model attempt failed', {
            model,
            attempt: retryCount + 1,
            error: lastError.message,
          });

          retryCount++;

          // Se atingiu max retries neste modelo, tentar próximo
          if (retryCount > maxRetries) {
            break;
          }
        }
      }

      // Se não for o último modelo, tentar próximo
      if (modelIndex < models.length - 1) {
        this.logger.info('[ModelFallback] Switching to fallback model', {
          failedModel: model,
          nextModel: models[modelIndex + 1],
        });
      }
    }

    // Todos os modelos falharam
    const duration = Date.now() - startTime;
    const result: ModelExecutionResult = {
      success: false,
      model: models[models.length - 1],
      error: lastError?.message || 'Unknown error',
      retriesUsed: 0,
      totalDuration: duration,
      timestamp: new Date(),
    };

    await this.bus.emit('model:fallback:exhausted', {
      models,
      error: lastError?.message,
      duration,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Executar com retry automático para modelo único
   */
  async executeWithRetry(
    messages: Array<{ role: string; content: string }>,
    model: string,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<ModelExecutionResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = delayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await this.aiProvider.chat(messages, { model });

        const duration = Date.now() - startTime;
        this.recordSuccess(model, duration);

        return {
          success: true,
          model,
          output: typeof response === 'string' ? response : String(response),
          retriesUsed: attempt,
          totalDuration: duration,
          timestamp: new Date(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn('[ModelFallback] Retry attempt failed', {
          model,
          attempt: attempt + 1,
          error: lastError.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    this.recordFailure(model, duration);

    return {
      success: false,
      model,
      error: lastError?.message || 'Unknown error',
      retriesUsed: maxRetries,
      totalDuration: duration,
      timestamp: new Date(),
    };
  }

  /**
   * Registrar sucesso de um modelo
   */
  private recordSuccess(model: string, duration: number): void {
    if (!this.modelStats.has(model)) {
      this.modelStats.set(model, {
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
      });
    }

    const stats = this.modelStats.get(model)!;
    stats.totalAttempts++;
    stats.successCount++;

    // Atualizar tempo médio
    stats.avgResponseTime = (stats.avgResponseTime + duration) / 2;
  }

  /**
   * Registrar falha de um modelo
   */
  private recordFailure(model: string, duration: number): void {
    if (!this.modelStats.has(model)) {
      this.modelStats.set(model, {
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
      });
    }

    const stats = this.modelStats.get(model)!;
    stats.totalAttempts++;
    stats.failureCount++;

    // Atualizar tempo médio
    stats.avgResponseTime = (stats.avgResponseTime + duration) / 2;
  }

  /**
   * Inicializar estatísticas de modelos
   */
  private initializeModelStats(): void {
    const models = [
      'gpt-5.4-mini',
      'gpt-4-turbo',
      'gpt-4',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
    ];

    models.forEach(model => {
      this.modelStats.set(model, {
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
      });
    });
  }

  /**
   * Obter estatísticas de um modelo
   */
  getModelStats(model: string): any {
    return this.modelStats.get(model) || {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      avgResponseTime: 0,
    };
  }

  /**
   * Obter taxa de sucesso de um modelo
   */
  getSuccessRate(model: string): number {
    const stats = this.getModelStats(model);
    if (stats.totalAttempts === 0) return 0;
    return (stats.successCount / stats.totalAttempts) * 100;
  }

  /**
   * Recomendação de estratégia de fallback baseada em histórico
   */
  recommendFallbackStrategy(primaryModel: string): FallbackStrategy {
    const allModels = Array.from(this.modelStats.keys());
    const otherModels = allModels.filter(m => m !== primaryModel);

    // Ordenar por taxa de sucesso
    otherModels.sort((a, b) => {
      const rateA = this.getSuccessRate(a);
      const rateB = this.getSuccessRate(b);
      return rateB - rateA;
    });

    return {
      primaryModel,
      fallbackModels: otherModels.slice(0, 3),
      maxRetries: 2,
      retryDelayMs: 500,
      exponentialBackoff: true,
    };
  }

  /**
   * Resetar estatísticas
   */
  resetStats(): void {
    this.modelStats.clear();
    this.executionHistory.clear();
    this.initializeModelStats();
  }
}
