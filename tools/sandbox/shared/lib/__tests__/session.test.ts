import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sessionManager } from '@/shared/lib/session';

describe('SessionManager', () => {
  beforeEach(() => {
    sessionManager['sessions'].clear();
  });

  afterEach(() => {
    sessionManager['sessions'].clear();
  });

  it('should create a session', () => {
    const session = sessionManager.createSession('user123');
    expect(session.id).toBeDefined();
    expect(session.userId).toBe('user123');
    expect(session.createdAt).toBeInstanceOf(Date);
  });

  it('should get a valid session', () => {
    const session = sessionManager.createSession('user123');
    const retrieved = sessionManager.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe('user123');
  });

  it('should return null for invalid session', () => {
    const retrieved = sessionManager.getSession('invalid-session');
    expect(retrieved).toBeNull();
  });

  it('should delete a session', () => {
    const session = sessionManager.createSession('user123');
    const deleted = sessionManager.deleteSession(session.id);
    expect(deleted).toBe(true);

    const retrieved = sessionManager.getSession(session.id);
    expect(retrieved).toBeNull();
  });

  it('should get active sessions', () => {
    sessionManager.createSession('user1');
    sessionManager.createSession('user2');

    const sessions = sessionManager.getActiveSessions();
    expect(sessions.length).toBe(2);
  });

  it('should get user sessions', () => {
    sessionManager.createSession('user1');
    sessionManager.createSession('user1');
    sessionManager.createSession('user2');

    const user1Sessions = sessionManager.getUserSessions('user1');
    expect(user1Sessions.length).toBe(2);
  });
});