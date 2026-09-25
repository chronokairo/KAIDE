export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
  };
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  createSession(userId: string, metadata?: { ipAddress?: string; userAgent?: string }): Session {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const session: Session = {
      id,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.sessionTimeout),
      metadata: metadata || {},
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastActivity = new Date();
    return session;
  }

  refreshSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    session.lastActivity = new Date();
    session.expiresAt = new Date(Date.now() + this.sessionTimeout);
    return session;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && new Date() <= s.expiresAt
    );
  }
}

export const sessionManager = new SessionManager();