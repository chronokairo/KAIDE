import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: string;
  senderLabel?: string;
  content: string;
  /** Optional: which project this relates to */
  projectId?: string;
  /** Message type for filtering */
  type: 'request' | 'response' | 'info' | 'error' | 'code';
  /** If this is a response, which message ID it replies to */
  replyTo?: string;
  /** Whether external AIs have seen this message */
  read?: boolean;
  /** @mentions in this message (agent roles to trigger) */
  mentions?: string[];
}

function getChatDir(): string {
  const dir = path.join(os.homedir(), '.anamnesic', 'chat');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getChatFile(channel: string): string {
  const safe = channel.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getChatDir(), `${safe}.jsonl`);
}

function getBackupFile(channel: string): string {
  const safe = channel.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getChatDir(), `${safe}.backup.jsonl`);
}

function getReadFile(channel: string): string {
  const safe = channel.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getChatDir(), `${safe}.read.json`);
}

export class ChatService {
  private filePath: string;
  private backupPath: string;
  private readPath: string;

  constructor(channel: string = 'default') {
    this.filePath = getChatFile(channel);
    this.backupPath = getBackupFile(channel);
    this.readPath = getReadFile(channel);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '', 'utf-8');
    }
  }

  send(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const full: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(this.filePath, JSON.stringify(full) + '\n', 'utf-8');
    return full;
  }

  getHistory(limit?: number): ChatMessage[] {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = fs.readFileSync(this.filePath, 'utf-8').trim();
    if (!raw) return [];
    const lines = raw.split('\n');
    const msgs: ChatMessage[] = [];
    lines.forEach((l, i) => {
      if (!l.trim()) return;
      try {
        msgs.push(JSON.parse(l) as ChatMessage);
      } catch (err) {
        console.error(`[Anamnesic] Chat line ${i + 1} parse error: ${(err as Error).message} — content: ${l.substring(0, 80)}`);
      }
    });
    return limit ? msgs.slice(-limit) : msgs;
  }

  backup(): void {
    if (fs.existsSync(this.filePath)) {
      fs.copyFileSync(this.filePath, this.backupPath);
    }
  }

  restore(): void {
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.filePath);
    }
  }

  getUnread(): ChatMessage[] {
    const readIds = this.getReadIds();
    return this.getHistory().filter(m =>
      m.sender === 'programmer' && m.type === 'request' && !readIds.has(m.id)
    );
  }

  markRead(messageId: string): void {
    const readIds = this.getReadIds();
    readIds.add(messageId);
    this.writeReadIds(readIds);
  }

  markAllRead(): void {
    const readIds = this.getReadIds();
    const msgs = this.getHistory();
    for (const m of msgs) {
      if (m.sender === 'programmer' && !readIds.has(m.id)) {
        readIds.add(m.id);
      }
    }
    this.writeReadIds(readIds);
  }

  private getReadIds(): Set<string> {
    try {
      if (fs.existsSync(this.readPath)) {
        const data = JSON.parse(fs.readFileSync(this.readPath, 'utf-8'));
        return new Set(Array.isArray(data) ? data : []);
      }
    } catch {
      // corrupt file — start fresh
    }
    return new Set();
  }

  private writeReadIds(ids: Set<string>): void {
    const tmp = this.readPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify([...ids]), 'utf-8');
    fs.renameSync(tmp, this.readPath);
  }

  clear(): void {
    fs.writeFileSync(this.filePath, '', 'utf-8');
    try { fs.unlinkSync(this.readPath); } catch { }
  }

  addMessageDirectly(message: ChatMessage): void {
    fs.appendFileSync(this.filePath, JSON.stringify(message) + '\n', 'utf-8');
  }

  /** Watch for new messages (returns close function) */
  watch(callback: (msgs: ChatMessage[]) => void): () => void {
    let lastSize = 0;
    try { lastSize = fs.statSync(this.filePath).size; } catch { }

    const watcher = fs.watchFile(this.filePath, { interval: 500 }, (curr) => {
      if (curr.size > lastSize) {
        lastSize = curr.size;
        callback(this.getHistory());
      }
    });

    return () => fs.unwatchFile(this.filePath);
  }

  getFilePath(): string {
    return this.filePath;
  }
}