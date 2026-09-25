import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatService } from '../chat';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('fs');
vi.mock('os');

describe('ChatService', () => {
  const mockChatDir = '/home/user/.anamnesic/chat';
  const mockChatFile = path.join(mockChatDir, 'default.jsonl');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/home/user');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);
    vi.mocked(fs.appendFileSync).mockReturnValue(undefined);
    vi.mocked(fs.renameSync).mockReturnValue(undefined);
  });

  describe('constructor', () => {
    it('should create chat service with default channel', () => {
      const service = new ChatService();
      expect(service.getFilePath()).toContain('default.jsonl');
    });

    it('should create chat service with custom channel', () => {
      const service = new ChatService('project-123');
      expect(service.getFilePath()).toContain('project-123.jsonl');
    });

    it('should create file if not exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      new ChatService();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.jsonl'),
        '',
        'utf-8'
      );
    });

    it('should sanitize channel name', () => {
      const service = new ChatService('project/with/slashes');
      expect(service.getFilePath()).toContain('project_with_slashes.jsonl');
    });
  });

  describe('send', () => {
    it('should send message and generate id and timestamp', () => {
      const service = new ChatService();
      
      const message = service.send({
        sender: 'user',
        content: 'Hello world',
        type: 'request',
      });

      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.sender).toBe('user');
      expect(message.content).toBe('Hello world');
      expect(message.type).toBe('request');
    });

    it('should append message to file', () => {
      const service = new ChatService();
      
      service.send({
        sender: 'agent',
        content: 'Response',
        type: 'response',
      });

      expect(fs.appendFileSync).toHaveBeenCalled();
      const appendCall = vi.mocked(fs.appendFileSync).mock.calls[0];
      expect(appendCall[0]).toContain('.jsonl');
      expect(appendCall[1]).toContain('"sender":"agent"');
      expect(appendCall[1]).toContain('"content":"Response"');
    });

    it('should include optional fields', () => {
      const service = new ChatService();
      
      const message = service.send({
        sender: 'programmer',
        senderLabel: 'John Doe',
        content: 'Test message',
        type: 'request',
        projectId: 'proj-123',
        replyTo: 'msg-456',
        mentions: ['@backend', '@qa'],
      });

      expect(message.senderLabel).toBe('John Doe');
      expect(message.projectId).toBe('proj-123');
      expect(message.replyTo).toBe('msg-456');
      expect(message.mentions).toEqual(['@backend', '@qa']);
    });
  });

  describe('getHistory', () => {
    it('should return empty array for empty file', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('');
      
      const service = new ChatService();
      const history = service.getHistory();

      expect(history).toEqual([]);
    });

    it('should return all messages', () => {
      const messages = [
        { id: '1', timestamp: '2024-01-01', sender: 'user', content: 'Hi', type: 'request' },
        { id: '2', timestamp: '2024-01-02', sender: 'agent', content: 'Hello', type: 'response' },
      ];
      
      vi.mocked(fs.readFileSync).mockReturnValue(
        messages.map(m => JSON.stringify(m)).join('\n')
      );

      const service = new ChatService();
      const history = service.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('1');
      expect(history[1].id).toBe('2');
    });

    it('should limit messages when specified', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        timestamp: new Date().toISOString(),
        sender: 'user',
        content: `Message ${i}`,
        type: 'request' as const,
      }));

      vi.mocked(fs.readFileSync).mockReturnValue(
        messages.map(m => JSON.stringify(m)).join('\n')
      );

      const service = new ChatService();
      const history = service.getHistory(5);

      expect(history).toHaveLength(5);
      expect(history[0].id).toBe('5');
      expect(history[4].id).toBe('9');
    });

    it('should skip empty lines', () => {
      const content = [
        '{"id":"1","sender":"user","content":"Hi","type":"request"}',
        '',
        '{"id":"2","sender":"agent","content":"Hello","type":"response"}',
        '',
      ].join('\n');

      vi.mocked(fs.readFileSync).mockReturnValue(content);

      const service = new ChatService();
      const history = service.getHistory();

      expect(history).toHaveLength(2);
    });

    it('should handle corrupted lines gracefully', () => {
      const content = [
        '{"id":"1","sender":"user","content":"Hi","type":"request"}',
        'invalid json{',
        '{"id":"2","sender":"agent","content":"Hello","type":"response"}',
      ].join('\n');

      vi.mocked(fs.readFileSync).mockReturnValue(content);

      const service = new ChatService();
      const history = service.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('1');
      expect(history[1].id).toBe('2');
    });

    it('should return empty array if file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const service = new ChatService();
      const history = service.getHistory();

      expect(history).toEqual([]);
    });
  });

  describe('getUnread', () => {
    it('should return unread programmer messages', () => {
      const messages = [
        { id: '1', sender: 'programmer', type: 'request', content: 'Msg1', timestamp: '' },
        { id: '2', sender: 'programmer', type: 'request', content: 'Msg2', timestamp: '' },
        { id: '3', sender: 'agent', type: 'response', content: 'Msg3', timestamp: '' },
        { id: '4', sender: 'programmer', type: 'request', content: 'Msg4', timestamp: '' },
      ];

      const jsonlContent = messages.map(m => JSON.stringify(m)).join('\n');
      // Message '2' is already recorded as read in the .read.json sidecar file
      vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathLike | number) => {
        if (String(filePath).endsWith('.read.json')) return '["2"]';
        return jsonlContent;
      });

      const service = new ChatService();
      const unread = service.getUnread();

      expect(unread).toHaveLength(2);
      expect(unread[0].id).toBe('1');
      expect(unread[1].id).toBe('4');
    });
  });

  describe('markRead', () => {
    it('should mark specific message as read', () => {
      const messages = [
        { id: '1', sender: 'programmer', type: 'request', content: 'Msg1', timestamp: '' },
        { id: '2', sender: 'programmer', type: 'request', content: 'Msg2', timestamp: '' },
      ];

      vi.mocked(fs.readFileSync).mockReturnValue(
        messages.map(m => JSON.stringify(m)).join('\n')
      );

      const service = new ChatService();
      service.markRead('1');

      // The implementation writes a JSON array of read IDs to a .tmp file then renames it
      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const tmpWrite = writeCalls.find(c => String(c[0]).endsWith('.tmp'));
      expect(tmpWrite).toBeDefined();
      const writtenIds = JSON.parse(tmpWrite![1] as string) as string[];
      expect(writtenIds).toContain('1');
      expect(writtenIds).not.toContain('2');
      expect(fs.renameSync).toHaveBeenCalled();
    });
  });

  describe('markAllRead', () => {
    it('should mark all programmer messages as read', () => {
      const messages = [
        { id: '1', sender: 'programmer', type: 'request', content: 'Msg1', timestamp: '' },
        { id: '2', sender: 'agent', type: 'response', content: 'Msg2', timestamp: '' },
        { id: '3', sender: 'programmer', type: 'request', content: 'Msg3', timestamp: '' },
      ];

      vi.mocked(fs.readFileSync).mockReturnValue(
        messages.map(m => JSON.stringify(m)).join('\n')
      );

      const service = new ChatService();
      service.markAllRead();

      // The implementation writes a JSON array of read IDs to a .tmp file then renames it
      const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const tmpWrite = writeCalls.find(c => String(c[0]).endsWith('.tmp'));
      expect(tmpWrite).toBeDefined();
      const writtenIds = JSON.parse(tmpWrite![1] as string) as string[];
      expect(writtenIds).toContain('1'); // programmer message
      expect(writtenIds).not.toContain('2'); // agent message — not added to read list
      expect(writtenIds).toContain('3'); // programmer message
      expect(fs.renameSync).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear chat history', () => {
      const service = new ChatService();
      service.clear();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.jsonl'),
        '',
        'utf-8'
      );
    });
  });

  describe('watch', () => {
    it('should setup file watcher', () => {
      vi.mocked(fs.watchFile).mockReturnValue(undefined as any);
      
      const service = new ChatService();
      const callback = vi.fn();

      service.watch(callback);

      expect(fs.watchFile).toHaveBeenCalledWith(
        expect.stringContaining('.jsonl'),
        expect.objectContaining({ interval: 500 }),
        expect.any(Function)
      );
    });

    it('should return function to stop watching', () => {
      vi.mocked(fs.watchFile).mockReturnValue(undefined as any);
      vi.mocked(fs.unwatchFile).mockReturnValue(undefined);

      const service = new ChatService();
      const stopWatch = service.watch(vi.fn());

      stopWatch();

      expect(fs.unwatchFile).toHaveBeenCalledWith(
        expect.stringContaining('.jsonl')
      );
    });
  });
});
