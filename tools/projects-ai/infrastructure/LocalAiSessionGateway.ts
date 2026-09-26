import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AiChatSessionDTO, AiChatSessionSaveInput, AiScheduledJobDTO, AiScheduleFrequency, AiSessionContextDTO, AiSessionMessageDTO, IAiSessionGateway } from '../../core/application/ports/out/IGateways';

const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SESSION_FILE_PREFIX = 'session-';
const MAX_MESSAGES = 200;
const MAX_CONTENT = 20000;
const FREQUENCIES: AiScheduleFrequency[] = ['once', 'hourly', 'daily', 'weekly', 'monthly'];

export class LocalAiSessionGateway implements IAiSessionGateway {
  private readonly directory: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.directory = env.CHRONOKAIRO_SESSIONS_DIR || path.join(os.homedir(), '.chronokairo', 'sessions');
  }

  private filePath(repoFullName: string) {
    if (!REPOSITORY_PATTERN.test(repoFullName)) throw new Error('Repositório inválido para sessão.');
    return path.join(this.directory, `${repoFullName.replace('/', '--')}.json`);
  }

  get(repoFullName: string): AiSessionContextDTO | null {
    const filePath = this.filePath(repoFullName);
    if (!existsSync(filePath)) return null;
    try {
      const value = JSON.parse(readFileSync(filePath, 'utf8')) as { repoFullName: string; branch: string; focus: string | null; updatedAt: string };
      const updatedAt = new Date(value.updatedAt);
      if (value.repoFullName !== repoFullName || !value.branch || Number.isNaN(updatedAt.getTime())) return null;
      return { repoFullName, branch: value.branch, focus: typeof value.focus === 'string' ? value.focus : null, updatedAt };
    } catch {
      return null;
    }
  }

  save(input: { repoFullName: string; branch: string; focus: string | null }): AiSessionContextDTO {
    const filePath = this.filePath(input.repoFullName);
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const value = { repoFullName: input.repoFullName, branch: input.branch, focus: input.focus, updatedAt: new Date().toISOString() };
    writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    chmodSync(filePath, 0o600);
    return { ...value, updatedAt: new Date(value.updatedAt) };
  }

  // ---- Sessões de conversa (o "sessions" melhorado) ----

  private sessionFilePath(id: string) {
    if (!SESSION_ID_PATTERN.test(id)) throw new Error('Identificador de sessão inválido.');
    return path.join(this.directory, `${SESSION_FILE_PREFIX}${id}.json`);
  }

  private sanitizeMessages(messages: unknown): AiSessionMessageDTO[] {
    if (!Array.isArray(messages)) return [];
    return messages
      .filter((message): message is { role: unknown; content: unknown } => Boolean(message) && typeof message === 'object')
      .map((message) => ({
        role: (message as { role: unknown }).role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: typeof (message as { content: unknown }).content === 'string' ? ((message as { content: string }).content).slice(0, MAX_CONTENT) : '',
      }))
      .slice(-MAX_MESSAGES);
  }

  private deriveTitle(messages: AiSessionMessageDTO[], fallback = 'Novo chat') {
    const firstUser = messages.find((message) => message.role === 'user' && message.content.trim());
    const raw = firstUser?.content.trim() || fallback;
    return raw.replace(/\s+/g, ' ').slice(0, 80);
  }

  private sanitizeJob(value: unknown): AiScheduledJobDTO | null {
    if (!value || typeof value !== 'object') return null;
    const job = value as Record<string, unknown>;
    const name = typeof job.name === 'string' ? job.name.trim().slice(0, 120) : '';
    const prompt = typeof job.prompt === 'string' ? job.prompt.trim().slice(0, MAX_CONTENT) : '';
    if (!name || !prompt) return null;
    const frequency: AiScheduleFrequency = FREQUENCIES.includes(job.frequency as AiScheduleFrequency) ? (job.frequency as AiScheduleFrequency) : 'once';
    const nextRunRaw = job.nextRunAt ? new Date(String(job.nextRunAt)) : null;
    return { name, prompt, frequency, nextRunAt: nextRunRaw && !Number.isNaN(nextRunRaw.getTime()) ? nextRunRaw : null };
  }

  private parseSession(raw: string, id: string): AiChatSessionDTO | null {
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      const createdAt = new Date(String(value.createdAt));
      const updatedAt = new Date(String(value.updatedAt));
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return null;
      const scheduledRaw = value.scheduledAt ? new Date(String(value.scheduledAt)) : null;
      const messages = this.sanitizeMessages(value.messages);
      return {
        id: typeof value.id === 'string' && SESSION_ID_PATTERN.test(value.id) ? value.id : id,
        title: typeof value.title === 'string' && value.title.trim() ? value.title.slice(0, 80) : this.deriveTitle(messages),
        messages,
        repoFullName: typeof value.repoFullName === 'string' && REPOSITORY_PATTERN.test(value.repoFullName) ? value.repoFullName : null,
        branch: typeof value.branch === 'string' && value.branch ? value.branch : null,
        focus: typeof value.focus === 'string' ? value.focus : null,
        pinned: value.pinned === true,
        scheduledAt: scheduledRaw && !Number.isNaN(scheduledRaw.getTime()) ? scheduledRaw : null,
        job: this.sanitizeJob(value.job),
        createdAt,
        updatedAt,
      };
    } catch {
      return null;
    }
  }

  listSessions(): AiChatSessionDTO[] {
    if (!existsSync(this.directory)) return [];
    const sessions: AiChatSessionDTO[] = [];
    for (const entry of readdirSync(this.directory)) {
      if (!entry.startsWith(SESSION_FILE_PREFIX) || !entry.endsWith('.json')) continue;
      const id = entry.slice(SESSION_FILE_PREFIX.length, -'.json'.length);
      const parsed = this.parseSession(readFileSync(path.join(this.directory, entry), 'utf8'), id);
      if (parsed) sessions.push(parsed);
    }
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getSession(id: string): AiChatSessionDTO | null {
    const filePath = this.sessionFilePath(id);
    if (!existsSync(filePath)) return null;
    return this.parseSession(readFileSync(filePath, 'utf8'), id);
  }

  saveSession(input: AiChatSessionSaveInput): AiChatSessionDTO {
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const id = input.id && SESSION_ID_PATTERN.test(input.id) ? input.id : randomUUID();
    const existing = input.id ? this.getSession(id) : null;
    const now = new Date();
    const messages = input.messages !== undefined ? this.sanitizeMessages(input.messages) : existing?.messages ?? [];
    const repoFullName = input.repoFullName !== undefined
      ? (input.repoFullName && REPOSITORY_PATTERN.test(input.repoFullName) ? input.repoFullName : null)
      : existing?.repoFullName ?? null;
    const scheduledAt = input.scheduledAt !== undefined ? input.scheduledAt : existing?.scheduledAt ?? null;
    const job = input.job !== undefined ? this.sanitizeJob(input.job) : existing?.job ?? null;
    const session: AiChatSessionDTO = {
      id,
      title: (input.title && input.title.trim() ? input.title : existing?.title) || this.deriveTitle(messages),
      messages,
      repoFullName,
      branch: input.branch !== undefined ? (input.branch || null) : existing?.branch ?? null,
      focus: input.focus !== undefined ? (input.focus || null) : existing?.focus ?? null,
      pinned: input.pinned !== undefined ? input.pinned : existing?.pinned ?? false,
      scheduledAt: scheduledAt && !Number.isNaN(new Date(scheduledAt).getTime()) ? new Date(scheduledAt) : null,
      job,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const serialized = {
      ...session,
      title: session.title.slice(0, 80),
      scheduledAt: session.scheduledAt ? session.scheduledAt.toISOString() : null,
      job: session.job ? { ...session.job, nextRunAt: session.job.nextRunAt ? session.job.nextRunAt.toISOString() : null } : null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
    const filePath = this.sessionFilePath(id);
    writeFileSync(filePath, `${JSON.stringify(serialized, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    chmodSync(filePath, 0o600);
    return session;
  }

  deleteSession(id: string): void {
    const filePath = this.sessionFilePath(id);
    if (existsSync(filePath)) unlinkSync(filePath);
  }
}
