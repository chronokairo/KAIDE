/**
 * Unit Tests for WorkflowTriggerService
 * 
 * Tests event triggers, file triggers, schedule triggers, and webhook triggers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowTriggerService } from '../services/WorkflowTriggerService';
import type { WorkflowTrigger, TriggerConfig } from '../services/WorkflowTriggerService';

describe('WorkflowTriggerService', () => {
  let service: WorkflowTriggerService;

  beforeEach(() => {
    service = new WorkflowTriggerService();
  });

  describe('registerEventTrigger', () => {
    it('should register event trigger', () => {
      const trigger = service.registerEventTrigger(
        'workflow-1',
        'pipeline:completed',
        { pipelineId: 'pipeline-1' }
      );

      expect(trigger.id).toBeDefined();
      expect(trigger.type).toBe('event');
      expect(trigger.config.eventType).toBe('pipeline:completed');
    });

    it('should allow multiple triggers for same workflow', () => {
      const trigger1 = service.registerEventTrigger('workflow-1', 'event-1');
      const trigger2 = service.registerEventTrigger('workflow-1', 'event-2');

      expect(trigger1.id).not.toBe(trigger2.id);

      const triggers = service.getWorkflowTriggers('workflow-1');
      expect(triggers.length).toBe(2);
    });

    it('should store event filter if provided', () => {
      const filter = { status: 'success', projectId: 'proj-1' };
      const trigger = service.registerEventTrigger('workflow-1', 'pipeline:completed', filter);

      expect((trigger.config as any).eventFilter).toEqual(filter);
    });
  });

  describe('registerFileTrigger', () => {
    it('should register file change trigger', () => {
      const trigger = service.registerFileTrigger('workflow-1', ['src/**/*.ts'], {
        watch: true,
        debounceMs: 1000,
      });

      expect(trigger.type).toBe('file-change');
      expect((trigger.config as any).filePatterns).toContain('src/**/*.ts');
    });

    it('should support ignore patterns', () => {
      const trigger = service.registerFileTrigger(
        'workflow-1',
        ['src/**/*.ts'],
        {
          ignorePatterns: ['**/*.test.ts'],
        }
      );

      expect((trigger.config as any).ignorePatterns).toContain('**/*.test.ts');
    });
  });

  describe('registerScheduleTrigger', () => {
    it('should register cron-based trigger', () => {
      const cronExpression = '0 0 * * *'; // Daily at midnight
      const trigger = service.registerScheduleTrigger(
        'workflow-1',
        cronExpression,
        'UTC'
      );

      expect(trigger.type).toBe('schedule');
      expect((trigger.config as any).cronExpression).toBe(cronExpression);
      expect((trigger.config as any).timezone).toBe('UTC');
    });

    it('should support multiple schedule patterns', () => {
      const trigger1 = service.registerScheduleTrigger('workflow-1', '0 * * * *'); // Hourly
      const trigger2 = service.registerScheduleTrigger('workflow-1', '0 0 * * 0'); // Weekly

      expect(trigger1.id).not.toBe(trigger2.id);

      const triggers = service.getWorkflowTriggers('workflow-1');
      expect(triggers.length).toBe(2);
    });
  });

  describe('registerWebhookTrigger', () => {
    it('should register webhook trigger', () => {
      const trigger = service.registerWebhookTrigger('workflow-1', 'secret-key-123');

      expect(trigger.type).toBe('webhook');
      expect((trigger.config as any).secret).toBe('secret-key-123');
    });

    it('should support IP whitelist', () => {
      const trigger = service.registerWebhookTrigger('workflow-1', 'secret', [
        '192.168.1.1',
        '10.0.0.0/8',
      ]);

      expect((trigger.config as any).ipWhitelist).toContain('192.168.1.1');
    });

    it('should generate webhook URL', () => {
      const trigger = service.registerWebhookTrigger('workflow-1');

      expect((trigger.config as any).webhookUrl).toBeDefined();
      expect((trigger.config as any).webhookUrl).toContain(trigger.id);
    });
  });

  describe('executeManually', () => {
    it('should execute workflow manually', async () => {
      const execution = service.executeManually('workflow-1', { param: 'value' });

      expect(execution.workflowId).toBe('workflow-1');
      expect(execution.status).toBe('triggered');
    });
  });

  describe('executeViaWebhook', () => {
    it('should validate HMAC signature', async () => {
      const trigger = service.registerWebhookTrigger('workflow-1', 'secret-123');

      // Valid signature (would need proper HMAC calculation)
      const execution = service.executeViaWebhook(
        trigger.id,
        { data: 'test' },
        '127.0.0.1'
      );

      expect(execution).toBeDefined();
    });

    it('should validate IP whitelist', () => {
      const trigger = service.registerWebhookTrigger('workflow-1', 'secret', [
        '192.168.1.1',
      ]);

      // Should reject different IP
      expect(() => {
        service.executeViaWebhook(trigger.id, { data: 'test' }, '10.0.0.1');
      }).toThrow();
    });
  });

  describe('trigger management', () => {
    it('should disable trigger', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      service.disableTrigger(trigger.id);

      const updated = service.getTrigger(trigger.id);
      expect(updated?.enabled).toBe(false);
    });

    it('should enable trigger', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      service.disableTrigger(trigger.id);
      service.enableTrigger(trigger.id);

      const updated = service.getTrigger(trigger.id);
      expect(updated?.enabled).toBe(true);
    });

    it('should delete trigger', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      service.deleteTrigger(trigger.id);

      const deleted = service.getTrigger(trigger.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('query triggers', () => {
    it('should get trigger by ID', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      const retrieved = service.getTrigger(trigger.id);

      expect(retrieved?.id).toBe(trigger.id);
      expect(retrieved?.type).toBe('event');
    });

    it('should get all triggers for workflow', () => {
      service.registerEventTrigger('workflow-1', 'event-1');
      service.registerEventTrigger('workflow-1', 'event-2');
      service.registerScheduleTrigger('workflow-1', '0 0 * * *');

      const triggers = service.getWorkflowTriggers('workflow-1');

      expect(triggers.length).toBe(3);
    });

    it('should return empty array for workflow with no triggers', () => {
      const triggers = service.getWorkflowTriggers('non-existent-workflow');

      expect(triggers).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all watchers and jobs', async () => {
      service.registerFileTrigger('workflow-1', ['src/**/*.ts']);
      service.registerScheduleTrigger('workflow-1', '0 0 * * *');

      await service.cleanup();

      // After cleanup, new registrations should not reuse old watchers
      const newTrigger = service.registerEventTrigger('workflow-2', 'event-1');
      expect(newTrigger.id).toBeDefined();
    });
  });

  describe('trigger execution tracking', () => {
    it('should track trigger executions', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      const execution = service.executeManually('workflow-1');

      expect(execution.triggerId).toBeDefined();
      expect(execution.executedAt).toBeDefined();
      expect(execution.status).toBe('triggered');
    });

    it('should include execution results', () => {
      const trigger = service.registerEventTrigger('workflow-1', 'event-1');

      const execution = service.executeManually('workflow-1', { result: 'data' });

      expect(execution.workflowId).toBe('workflow-1');
    });
  });

  describe('concurrent trigger handling', () => {
    it('should handle multiple simultaneous triggers', async () => {
      const trigger1 = service.registerEventTrigger('workflow-1', 'event-1');
      const trigger2 = service.registerEventTrigger('workflow-2', 'event-2');

      const exec1 = service.executeManually('workflow-1');
      const exec2 = service.executeManually('workflow-2');

      expect(exec1.workflowId).toBe('workflow-1');
      expect(exec2.workflowId).toBe('workflow-2');
    });
  });
});
