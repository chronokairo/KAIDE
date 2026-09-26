import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

/* ── JSON fallback (sem PostgreSQL) ──────────────────────────── */
const DATA_DIR = path.join(process.cwd(), '.anna-data');
const CONV_FILE = path.join(DATA_DIR, 'conversations.json');

interface JsonConv {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ id: number; role: 'user' | 'assistant'; content: string; createdAt: string }>;
  suggestions?: ConversationSuggestions | null;
}

export interface ConversationSuggestions {
  items: string[];
  /** Numero de mensagens da IA no momento da geracao (invalida ao chegar nova msg) */
  assistantCount: number;
}

function jsonRead(): JsonConv[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONV_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CONV_FILE, 'utf-8')) as JsonConv[]; }
  catch { return []; }
}

function jsonWrite(data: JsonConv[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONV_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const USE_POSTGRES = !!process.env.POSTGRES_HOST;

/* ── PostgreSQL imports (only when configured) ───────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ensureSchema: (() => Promise<any>) | null = null;

if (USE_POSTGRES) {
  const pg = require('./postgres') as { pool: typeof import('./postgres').pool; ensureSchema: typeof import('./postgres').ensureSchema };
  pool = pg.pool;
  ensureSchema = pg.ensureSchema;
}

export interface StoredConversation {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface StoredConversationMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

function buildTitle(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Nova conversa';
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
}

/** Strip markdown/LaTeX formatting to produce a plain-text preview. */
function buildPreview(text: string): string {
  return text
    // Remove display LaTeX delimiters and their content
    .replace(/\$\$[\s\S]*?\$\$/g, '[fórmula]')
    .replace(/\\\[[\s\S]*?\\\]/g, '[fórmula]')
    // Remove inline LaTeX
    .replace(/\\\([\s\S]*?\\\)/g, '[fórmula]')
    .replace(/\$[^\$\n]+\$/g, '[fórmula]')
    // Strip markdown bold/italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    // Strip headings
    .replace(/^#+\s+/gm, '')
    // Strip bullet/numbered lists markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Strip inline code and code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // Strip blockquote markers
    .replace(/^>+\s*/gm, '')
    // Strip horizontal rules
    .replace(/^[-*]{3,}$/gm, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export async function listConversations(): Promise<StoredConversation[]> {
  if (!USE_POSTGRES) {
    const all = jsonRead();
    return all.map((c) => {
      const lastMsg = c.messages[c.messages.length - 1];
      const plain = buildPreview(lastMsg?.content ?? '');
      return {
        id: c.id,
        title: c.title,
        providerId: c.providerId,
        modelId: c.modelId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        preview: plain.length > 160 ? `${plain.slice(0, 157)}...` : plain,
      };
    });
  }

  await ensureSchema!();

  const result = await pool.query(`
    WITH last_messages AS (
      SELECT DISTINCT ON (m.conversation_id)
        m.conversation_id,
        m.content,
        m.created_at
      FROM anna_conversation_messages m
      ORDER BY m.conversation_id, m.created_at DESC, m.id DESC
    )
    SELECT
      c.id,
      c.title,
      c.provider_id AS "providerId",
      c.model_id AS "modelId",
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      COALESCE(lm.content, '') AS preview
    FROM anna_conversations c
    LEFT JOIN last_messages lm ON lm.conversation_id = c.id
    ORDER BY c.updated_at DESC
  `);

  return result.rows.map((row: Record<string, unknown>) => {
    const plain = buildPreview(row.preview as string);
    return {
      ...row,
      preview: plain.length > 160 ? `${plain.slice(0, 157)}...` : plain,
    };
  }) as StoredConversation[];
}

export async function getConversation(conversationId: string) {
  if (!USE_POSTGRES) {
    const all = jsonRead();
    const conv = all.find((c) => c.id === conversationId);
    if (!conv) return null;
    return {
      id: conv.id,
      title: conv.title,
      providerId: conv.providerId,
      modelId: conv.modelId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: conv.messages as StoredConversationMessage[],
      suggestions: conv.suggestions ?? null,
    };
  }

  await ensureSchema!();

  const conversationResult = await pool.query(
    `
      SELECT
        id,
        title,
        provider_id AS "providerId",
        model_id AS "modelId",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        suggestions
      FROM anna_conversations
      WHERE id = $1
    `,
    [conversationId],
  );

  if (conversationResult.rowCount === 0) {
    return null;
  }

  const messagesResult = await pool.query(
    `
      SELECT
        id,
        role,
        content,
        created_at AS "createdAt"
      FROM anna_conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [conversationId],
  );

  const row = conversationResult.rows[0] as Omit<StoredConversation, 'preview'> & {
    suggestions?: ConversationSuggestions | null;
  };

  return {
    ...row,
    suggestions: row.suggestions ?? null,
    messages: messagesResult.rows as StoredConversationMessage[],
  };
}

/** Salva as sugestoes geradas pela IA junto da conversa. */
export async function saveConversationSuggestions(
  conversationId: string,
  suggestions: ConversationSuggestions,
): Promise<boolean> {
  if (!USE_POSTGRES) {
    const all = jsonRead();
    const idx = all.findIndex((c) => c.id === conversationId);
    if (idx < 0) return false;
    all[idx].suggestions = suggestions;
    jsonWrite(all);
    return true;
  }

  await ensureSchema!();
  const result = await pool.query(
    `UPDATE anna_conversations SET suggestions = $2 WHERE id = $1`,
    [conversationId, JSON.stringify(suggestions)],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function appendConversationTurn(input: {
  conversationId?: string;
  providerId: string;
  modelId: string;
  userContent: string;
  assistantContent: string;
}) {
  const conversationId = input.conversationId || randomUUID();
  const title = buildTitle(input.userContent);
  const now = new Date().toISOString();

  if (!USE_POSTGRES) {
    const all = jsonRead();
    const idx = all.findIndex((c) => c.id === conversationId);
    const nextMsgId = idx >= 0
      ? (all[idx].messages[all[idx].messages.length - 1]?.id ?? 0) + 1
      : 1;

    const newMessages = [
      { id: nextMsgId, role: 'user' as const, content: input.userContent, createdAt: now },
      { id: nextMsgId + 1, role: 'assistant' as const, content: input.assistantContent, createdAt: now },
    ];

    if (idx >= 0) {
      all[idx].messages.push(...newMessages);
      all[idx].updatedAt = now;
      all[idx].providerId = input.providerId;
      all[idx].modelId = input.modelId;
    } else {
      all.unshift({
        id: conversationId,
        title,
        providerId: input.providerId,
        modelId: input.modelId,
        createdAt: now,
        updatedAt: now,
        messages: newMessages,
      });
    }

    // Keep newest first
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    jsonWrite(all);
    return { conversationId };
  }

  await ensureSchema!();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO anna_conversations (id, title, provider_id, model_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET
          title = COALESCE(NULLIF(anna_conversations.title, ''), EXCLUDED.title),
          provider_id = EXCLUDED.provider_id,
          model_id = EXCLUDED.model_id,
          updated_at = NOW()
      `,
      [conversationId, title, input.providerId, input.modelId],
    );

    await client.query(
      `
        INSERT INTO anna_conversation_messages (conversation_id, role, content)
        VALUES ($1, 'user', $2), ($1, 'assistant', $3)
      `,
      [conversationId, input.userContent, input.assistantContent],
    );

    await client.query(
      `UPDATE anna_conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    await client.query('COMMIT');
    return { conversationId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}