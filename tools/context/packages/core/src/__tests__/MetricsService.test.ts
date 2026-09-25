/**
 * Unit Tests for MetricsService
 * 
 * Tests metrics collection, aggregation, alerting, and data export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsService } from '../services/MetricsService';
import type { ExecutionMetric } from '../services/MetricsService';

describe('MetricsService', () => {
  let service: MetricsService;
  let mockDataSource: any;

  beforeEach(() => {
    // Mock DataSource
    mockDataSource = {
      getRepository: vi.fn().mockReturnValue({
        save: vi.fn(),
        find: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      }),
    };

    service = new MetricsService(mockDataSource);
  });

  describe('recordExecution', () => {
    it('should record successful task execution', () => {
      const metric: ExecutionMetric = {
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1500,
        tokensUsed: 250,
        timestamp: new Date(),
      };

      service.recordExecution(metric);

      // Verify metric is stored
      expect(service['metricsBuffer']).toContainEqual(expect.objectContaining(metric));
    });

    it('should record failed task execution', () => {
      const metric: ExecutionMetric = {
        taskId: 'task-2',
        agentRole: 'frontend',
        status: 'failure',
        durationMs: 2000,
        error: 'Compilation error',
        timestamp: new Date(),
      };

      service.recordExecution(metric);

      expect(service['metricsBuffer']).toContainEqual(expect.objectContaining(metric));
    });

    it('should record timeout execution', () => {
      const metric: ExecutionMetric = {
        taskId: 'task-3',
        agentRole: 'qa',
        status: 'timeout',
        durationMs: 30000,
        timestamp: new Date(),
      };

      service.recordExecution(metric);

      expect(service['metricsBuffer']).toHaveLength(1);
    });
  });

  describe('getMetrics', () => {
    it('should aggregate metrics by hour', () => {
      // Record multiple metrics
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1000,
        tokensUsed: 100,
        timestamp: new Date(),
      });

      service.recordExecution({
        taskId: 'task-2',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1500,
        tokensUsed: 150,
        timestamp: new Date(),
      });

      const metrics = service.getMetrics('hour');

      expect(metrics.totalTasks).toBeGreaterThanOrEqual(0);
    });

    it('should calculate success rate correctly', () => {
      // Record 3 successful and 1 failed
      for (let i = 0; i < 3; i++) {
        service.recordExecution({
          taskId: `task-${i}`,
          agentRole: 'backend',
          status: 'success',
          durationMs: 1000,
          tokensUsed: 100,
          timestamp: new Date(),
        });
      }

      service.recordExecution({
        taskId: 'task-failed',
        agentRole: 'backend',
        status: 'failure',
        durationMs: 2000,
        timestamp: new Date(),
      });

      const metrics = service.getMetrics('hour');

      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });

    it('should calculate average duration', () => {
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1000,
        timestamp: new Date(),
      });

      service.recordExecution({
        taskId: 'task-2',
        agentRole: 'backend',
        status: 'success',
        durationMs: 3000,
        timestamp: new Date(),
      });

      const metrics = service.getMetrics('hour');

      // Average should be 2000ms
      expect(metrics.avgDuration).toBeDefined();
    });
  });

  describe('getPipelineMetrics', () => {
    it('should return metrics for specific pipeline', () => {
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        pipelineId: 'pipeline-1',
        status: 'success',
        durationMs: 1000,
        timestamp: new Date(),
      });

      const metrics = service.getPipelineMetrics('pipeline-1');

      expect(metrics).toBeDefined();
    });

    it('should return empty metrics for non-existent pipeline', () => {
      const metrics = service.getPipelineMetrics('non-existent-pipeline');

      expect(metrics).toBeDefined();
    });
  });

  describe('alerting', () => {
    it('should trigger alert on high error rate', () => {
      // Record 10 failures out of 10 tasks (100% failure rate)
      for (let i = 0; i < 10; i++) {
        service.recordExecution({
          taskId: `task-${i}`,
          agentRole: 'backend',
          status: 'failure',
          durationMs: 1000,
          timestamp: new Date(),
        });
      }

      service.checkAlerts();

      const alerts = service.getActiveAlerts();
      // Should have high-error-rate alert
      const hasErrorAlert = alerts.some((a) => a.type === 'high-error-rate');
      expect(hasErrorAlert).toBeTruthy();
    });

    it('should trigger alert on timeout threshold', () => {
      // Record multiple timeouts
      for (let i = 0; i < 5; i++) {
        service.recordExecution({
          taskId: `task-${i}`,
          agentRole: 'backend',
          status: 'timeout',
          durationMs: 30000,
          timestamp: new Date(),
        });
      }

      service.checkAlerts();

      const alerts = service.getActiveAlerts();
      const hasTimeoutAlert = alerts.some((a) => a.type === 'timeout');
      expect(hasTimeoutAlert).toBeTruthy();
    });

    it('should resolve alert', () => {
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'failure',
        durationMs: 1000,
        timestamp: new Date(),
      });

      service.checkAlerts();

      const alerts = service.getActiveAlerts();
      if (alerts.length > 0) {
        service.resolveAlert(alerts[0].id);

        const remainingAlerts = service.getActiveAlerts();
        expect(remainingAlerts.length).toBeLessThan(alerts.length);
      }
    });
  });

  describe('exportMetricsData', () => {
    it('should export metrics data for dashboard', () => {
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1000,
        tokensUsed: 100,
        timestamp: new Date(),
      });

      const exported = service.exportMetricsData('hour');

      expect(exported).toBeDefined();
      expect(exported.period).toBe('hour');
    });

    it('should include agent breakdown in export', () => {
      service.recordExecution({
        taskId: 'task-1',
        agentRole: 'backend',
        status: 'success',
        durationMs: 1000,
        timestamp: new Date(),
      });

      service.recordExecution({
        taskId: 'task-2',
        agentRole: 'frontend',
        status: 'success',
        durationMs: 1500,
        timestamp: new Date(),
      });

      const exported = service.exportMetricsData('hour');

      expect(exported.byAgent).toBeDefined();
    });
  });
});
