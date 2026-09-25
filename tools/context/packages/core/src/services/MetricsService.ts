import { Logger } from '../utils/Logger';
import { DataSource, Repository } from 'typeorm';
import { getEventBus } from '../events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Metrics & Monitoring Service
 * 
 * Coleta, armazena e expõe métricas de:
 * - Execução de tasks (sucesso, falha, duração)
 * - Performance de agentes
 * - Taxa de erro e alertas
 * - Uso de recursos
 * - Throughput de pipelines
 */

export interface ExecutionMetric {
  id: string;
  taskId: string;
  pipelineId: string;
  agentRole: string;
  status: 'success' | 'failure' | 'timeout';
  duration: number;
  tokensUsed: number;
  timestamp: Date;
  error?: string;
}

export interface MetricsSnapshot {
  timestamp: Date;
  period: 'hour' | 'day' | 'week';
  totalTasks: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  avgTokensUsed: number;
  successRate: number;
  errorRate: number;
  byAgent: Record<string, AgentMetrics>;
}

export interface AgentMetrics {
  totalTasks: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  successRate: number;
  avgTokensPerTask: number;
}

export interface Alert {
  id: string;
  type: 'high-error-rate' | 'timeout' | 'quota-exceeded' | 'performance-degradation';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

export class MetricsService {
  private logger = Logger.getInstance();
  private bus = getEventBus('metrics');
  private metrics: ExecutionMetric[] = [];
  private alerts: Alert[] = [];
  private metricsWindow: number = 24 * 60 * 60 * 1000; // 24 horas
  private readonly MAX_METRICS_STORED = 10000;

  // Thresholds para alertas
  private thresholds = {
    errorRateWarning: 10, // %
    errorRateCritical: 25, // %
    avgDurationWarning: 120000, // 2 minutos
    avgDurationCritical: 300000, // 5 minutos
  };

  constructor(private db?: DataSource) {}

  /**
   * Registrar execução de uma tarefa
   */
  async recordExecution(metric: Omit<ExecutionMetric, 'id' | 'timestamp'>): Promise<void> {
    const executionMetric: ExecutionMetric = {
      ...metric,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.metrics.push(executionMetric);

    // Manter tamanho máximo do array
    if (this.metrics.length > this.MAX_METRICS_STORED) {
      this.metrics.shift();
    }

    // Verificar alertas após registrar métrica
    this.checkAlerts();

    this.logger.debug('[Metrics] Execution recorded', {
      taskId: metric.taskId,
      status: metric.status,
      duration: metric.duration,
    });
  }

  /**
   * Obter métricas do período (última hora, dia, semana)
   */
  getMetrics(period: 'hour' | 'day' | 'week' = 'day'): MetricsSnapshot {
    const now = Date.now();
    let windowMs = 24 * 60 * 60 * 1000; // dia por padrão

    if (period === 'hour') {
      windowMs = 60 * 60 * 1000;
    } else if (period === 'week') {
      windowMs = 7 * 24 * 60 * 60 * 1000;
    }

    const cutoffTime = now - windowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);

    // Calcular agregações
    const totalTasks = recentMetrics.length;
    const successCount = recentMetrics.filter(m => m.status === 'success').length;
    const failureCount = recentMetrics.filter(m => m.status === 'failure').length;

    const durations = recentMetrics.map(m => m.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const tokens = recentMetrics.map(m => m.tokensUsed);
    const avgTokensUsed = tokens.length > 0
      ? tokens.reduce((a, b) => a + b, 0) / tokens.length
      : 0;

    const successRate = totalTasks > 0 ? (successCount / totalTasks) * 100 : 0;
    const errorRate = totalTasks > 0 ? (failureCount / totalTasks) * 100 : 0;

    // Métricas por agente
    const byAgent: Record<string, AgentMetrics> = {};

    for (const metric of recentMetrics) {
      if (!byAgent[metric.agentRole]) {
        byAgent[metric.agentRole] = {
          totalTasks: 0,
          successCount: 0,
          failureCount: 0,
          avgDuration: 0,
          successRate: 0,
          avgTokensPerTask: 0,
        };
      }

      const agent = byAgent[metric.agentRole];
      agent.totalTasks++;

      if (metric.status === 'success') {
        agent.successCount++;
      } else if (metric.status === 'failure') {
        agent.failureCount++;
      }

      agent.avgDuration =
        (agent.avgDuration * (agent.totalTasks - 1) + metric.duration) / agent.totalTasks;
      agent.avgTokensPerTask =
        (agent.avgTokensPerTask * (agent.totalTasks - 1) + metric.tokensUsed) /
        agent.totalTasks;
      agent.successRate =
        agent.totalTasks > 0 ? (agent.successCount / agent.totalTasks) * 100 : 0;
    }

    return {
      timestamp: new Date(),
      period,
      totalTasks,
      successCount,
      failureCount,
      avgDuration,
      avgTokensUsed,
      successRate,
      errorRate,
      byAgent,
    };
  }

  /**
   * Obter métricas por pipeline
   */
  getPipelineMetrics(pipelineId: string): MetricsSnapshot {
    const now = Date.now();
    const cutoffTime = now - this.metricsWindow;

    const pipelineMetrics = this.metrics.filter(
      m => m.pipelineId === pipelineId && m.timestamp.getTime() > cutoffTime
    );

    // Similar ao getMetrics, mas filtrado por pipeline
    const totalTasks = pipelineMetrics.length;
    const successCount = pipelineMetrics.filter(m => m.status === 'success').length;
    const failureCount = pipelineMetrics.filter(m => m.status === 'failure').length;

    const durations = pipelineMetrics.map(m => m.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const tokens = pipelineMetrics.map(m => m.tokensUsed);
    const avgTokensUsed = tokens.length > 0
      ? tokens.reduce((a, b) => a + b, 0) / tokens.length
      : 0;

    const successRate = totalTasks > 0 ? (successCount / totalTasks) * 100 : 0;
    const errorRate = totalTasks > 0 ? (failureCount / totalTasks) * 100 : 0;

    const byAgent: Record<string, AgentMetrics> = {};

    for (const metric of pipelineMetrics) {
      if (!byAgent[metric.agentRole]) {
        byAgent[metric.agentRole] = {
          totalTasks: 0,
          successCount: 0,
          failureCount: 0,
          avgDuration: 0,
          successRate: 0,
          avgTokensPerTask: 0,
        };
      }

      const agent = byAgent[metric.agentRole];
      agent.totalTasks++;
      if (metric.status === 'success') agent.successCount++;
      if (metric.status === 'failure') agent.failureCount++;

      agent.avgDuration =
        (agent.avgDuration * (agent.totalTasks - 1) + metric.duration) / agent.totalTasks;
      agent.avgTokensPerTask =
        (agent.avgTokensPerTask * (agent.totalTasks - 1) + metric.tokensUsed) /
        agent.totalTasks;
      agent.successRate =
        agent.totalTasks > 0 ? (agent.successCount / agent.totalTasks) * 100 : 0;
    }

    return {
      timestamp: new Date(),
      period: 'day',
      totalTasks,
      successCount,
      failureCount,
      avgDuration,
      avgTokensUsed,
      successRate,
      errorRate,
      byAgent,
    };
  }

  /**
   * Verificar thresholds e criar alertas se necessário
   */
  private checkAlerts(): void {
    const metrics = this.getMetrics('hour');

    // Verificar taxa de erro
    if (metrics.errorRate > this.thresholds.errorRateCritical) {
      this.createAlert({
        type: 'high-error-rate',
        severity: 'critical',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}% (threshold: ${this.thresholds.errorRateCritical}%)`,
        threshold: this.thresholds.errorRateCritical,
        currentValue: metrics.errorRate,
      });
    } else if (metrics.errorRate > this.thresholds.errorRateWarning) {
      this.createAlert({
        type: 'high-error-rate',
        severity: 'warning',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}% (threshold: ${this.thresholds.errorRateWarning}%)`,
        threshold: this.thresholds.errorRateWarning,
        currentValue: metrics.errorRate,
      });
    }

    // Verificar duração média
    if (metrics.avgDuration > this.thresholds.avgDurationCritical) {
      this.createAlert({
        type: 'performance-degradation',
        severity: 'critical',
        message: `Average duration is ${metrics.avgDuration.toFixed(0)}ms (threshold: ${this.thresholds.avgDurationCritical}ms)`,
        threshold: this.thresholds.avgDurationCritical,
        currentValue: metrics.avgDuration,
      });
    }
  }

  /**
   * Criar alerta
   */
  private createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    // Verificar se alerta similar já existe
    const existing = this.alerts.find(
      a => a.type === alert.type && !a.resolved && a.severity === alert.severity
    );

    if (!existing) {
      const newAlert: Alert = {
        ...alert,
        id: uuidv4(),
        timestamp: new Date(),
        resolved: false,
      };

      this.alerts.push(newAlert);

      this.logger.warn('[Metrics] Alert created', {
        alertId: newAlert.id,
        type: newAlert.type,
        severity: newAlert.severity,
      });

      this.bus.emit('alert:created', newAlert).catch(err => {
        this.logger.error('[Metrics] Failed to emit alert event', { error: err });
      });
    }
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;

      this.logger.info('[Metrics] Alert resolved', { alertId });

      this.bus.emit('alert:resolved', { alertId, timestamp: new Date().toISOString() }).catch(err => {
        this.logger.error('[Metrics] Failed to emit alert resolution event', { error: err });
      });
    }
  }

  /**
   * Exportar métricas para formato de dashboard
   */
  exportMetricsData(period: 'hour' | 'day' | 'week' = 'day'): {
    metrics: MetricsSnapshot;
    alerts: Alert[];
    trend: { hour: MetricsSnapshot; day: MetricsSnapshot; week: MetricsSnapshot };
  } {
    return {
      metrics: this.getMetrics(period),
      alerts: this.getActiveAlerts(),
      trend: {
        hour: this.getMetrics('hour'),
        day: this.getMetrics('day'),
        week: this.getMetrics('week'),
      },
    };
  }

  /**
   * Resetar métricas
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.logger.info('[Metrics] Metrics reset');
  }
}
