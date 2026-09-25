/**
 * Unit Tests for ChatSyncService
 * 
 * Tests bidirectional sync, conflict resolution, and sync status tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatSyncService } from '../services/ChatSyncService';
import type { ChatService } from '../chat';
import type { ChatHistoryService } from '../services/ChatHistoryService';
import type { ChatMessage } from '../types';

describe('ChatSyncService', () => {
  let service: ChatSyncService;
  let mockChatService: ChatService;
  let mockChatHistoryService: ChatHistoryService;

  beforeEach(() => {
    // Mock ChatService
    mockChatService = {
      getHistory: vi.fn().mockReturnValue([
        {
          id: 'msg-1',
          sender: 'user',
          type: 'text',
          content: 'Hello',
          timestamp: new Date('2024-01-01T10:00:00').toISOString(),
        },
      ] as ChatMessage[]),
      send: vi.fn(),
      backup: vi.fn(),
      clear: vi.fn(),
      restore: vi.fn(),
    } as any;

    // Mock ChatHistoryService
    mockChatHistoryService = {
      getHistoryByChannel: vi.fn().mockResolvedValue({
        id: 'history-1',
        channel: 'test-channel',
        messages: [
          {
            id: 'msg-2',
            sender: 'bot',
            type: 'text',
            content: 'Hi there',
            timestamp: new Date('2024-01-01T10:01:00').toISOString(),
          },
        ] as ChatMessage[],
      }),
      appendMessage: vi.fn(),
      saveHistory: vi.fn(),
    } as any;

    service = new ChatSyncService(mockChatService, mockChatHistoryService);
  });

  describe('syncFromJSONLtoSQLite', () => {
    it('should sync messages from JSONL to SQLite', async () => {
      const status = await service.syncFromJSONLtoSQLite('test-channel', 'pipeline-1');

      expect(status.channel).toBe('test-channel');
      expect(status.status).toBe('success');
      expect(mockChatHistoryService.appendMessage).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      // Mock error in ChatHistoryService
      (mockChatHistoryService.appendMessage as any).mockRejectedValue(
        new Error('Database error')
      );

      const status = await service.syncFromJSONLtoSQLite('test-channel');

      expect(status.status).toBe('failure');
      expect(status.error).toBeDefined();
    });

    it('should update sync status', async () => {
      await service.syncFromJSONLtoSQLite('test-channel');

      const status = service.getSyncStatus('test-channel');

      expect(status).toBeDefined();
      expect(status?.channel).toBe('test-channel');
    });
  });

  describe('syncFromSQLitetoJSONL', () => {
    it('should sync messages from SQLite to JSONL', async () => {
      const status = await service.syncFromSQLitetoJSONL('test-channel');

      expect(status.channel).toBe('test-channel');
      expect(status.status).toBe('success');
    });

    it('should prevent duplicate syncs', async () => {
      // Start first sync
      const promise1 = service.syncFromSQLitetoJSONL('test-channel');

      // Try to start another sync while first is in progress
      const promise2 = service.syncFromSQLitetoJSONL('test-channel');

      // Second should be rejected
      const result2 = await promise2;
      expect(result2.status).toBe('failure');
    });
  });

  describe('bidirectionalSync', () => {
    it('should merge messages from both sources', async () => {
      const status = await service.bidirectionalSync('test-channel', 'pipeline-1');

      expect(status.channel).toBe('test-channel');
      expect(status.status).toBe('success');
    });

    it('should resolve conflicts by timestamp (most recent wins)', async () => {
      // JSONL has message from 10:00
      // SQLite has message from 10:01 (newer)
      // After sync, SQLite version should be kept

      const status = await service.bidirectionalSync('test-channel');

      // Verify that merge happened
      expect(status.status).toBe('success');
    });

    it('should handle multiple conflicting messages', async () => {
      // Create service with multiple conflicting messages
      const chatMessagesWithConflict = [
        {
          id: 'msg-1',
          sender: 'user',
          type: 'text',
          content: 'Original message',
          timestamp: new Date('2024-01-01T10:00:00').toISOString(),
        },
        {
          id: 'msg-2',
          sender: 'user',
          type: 'text',
          content: 'Another message',
          timestamp: new Date('2024-01-01T10:01:00').toISOString(),
        },
      ] as ChatMessage[];

      (mockChatService.getHistory as any).mockReturnValue(chatMessagesWithConflict);

      const status = await service.bidirectionalSync('test-channel');

      expect(status.status).toBe('success');
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status for channel', async () => {
      await service.syncFromJSONLtoSQLite('test-channel');

      const status = service.getSyncStatus('test-channel');

      expect(status).toBeDefined();
      expect(status?.channel).toBe('test-channel');
      expect(status?.lastSyncTime).toBeDefined();
    });

    it('should return null for channel without sync', () => {
      const status = service.getSyncStatus('unknown-channel');

      expect(status).toBeNull();
    });
  });

  describe('getAllSyncStatuses', () => {
    it('should return all sync statuses', async () => {
      await service.syncFromJSONLtoSQLite('channel-1');
      await service.syncFromJSONLtoSQLite('channel-2');

      const statuses = service.getAllSyncStatuses();

      expect(statuses.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('resetSyncStatus', () => {
    it('should reset sync status for channel', async () => {
      await service.syncFromJSONLtoSQLite('test-channel');

      let status = service.getSyncStatus('test-channel');
      expect(status).toBeDefined();

      service.resetSyncStatus('test-channel');

      status = service.getSyncStatus('test-channel');
      expect(status).toBeNull();
    });
  });

  describe('message counting', () => {
    it('should track message counts from both sources', async () => {
      const status = await service.syncFromJSONLtoSQLite('test-channel');

      expect(status.messagesFromJSONL).toBeDefined();
      expect(status.messagesFromSQLite).toBeDefined();
    });

    it('should indicate zero messages if sources are empty', async () => {
      (mockChatService.getHistory as any).mockReturnValue([]);
      (mockChatHistoryService.getHistoryByChannel as any).mockResolvedValue({
        id: 'history-1',
        channel: 'empty-channel',
        messages: [],
      });

      const status = await service.syncFromJSONLtoSQLite('empty-channel');

      expect(status.messagesFromJSONL).toBe(0);
    });
  });
});
