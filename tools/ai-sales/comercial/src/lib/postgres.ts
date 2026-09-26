import { Pool } from 'pg';

declare global {
  var __annaPgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    host: process.env.POSTGRES_HOST ?? '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT ?? '5432'),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'postgres',
  });
}

export const pool = global.__annaPgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.__annaPgPool = pool;
}

let schemaPromise: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS anna_calendar_chunks (
          id          SERIAL PRIMARY KEY,
          year        INTEGER NOT NULL,
          chunk_index INTEGER NOT NULL,
          content     TEXT NOT NULL,
          embedding   DOUBLE PRECISION[] DEFAULT NULL,
          pdf_url     TEXT DEFAULT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (year, chunk_index)
        );

        CREATE INDEX IF NOT EXISTS anna_calendar_chunks_year_idx
          ON anna_calendar_chunks(year);

        CREATE TABLE IF NOT EXISTS anna_conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          model_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE anna_conversations
          ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT NULL;

        CREATE TABLE IF NOT EXISTS anna_conversation_messages (
          id BIGSERIAL PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES anna_conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS anna_conversations_updated_at_idx
          ON anna_conversations(updated_at DESC);

        ALTER TABLE anna_conversation_messages
          ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

        CREATE INDEX IF NOT EXISTS anna_conversations_updated_at_idx
          ON anna_conversations(updated_at DESC);

        CREATE INDEX IF NOT EXISTS anna_conversation_messages_conversation_id_idx
          ON anna_conversation_messages(conversation_id, created_at, id);

        CREATE TABLE IF NOT EXISTS anna_candidatos (
          id BIGSERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          cpf TEXT NOT NULL UNIQUE,
          data_nascimento DATE NOT NULL,
          consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS anna_candidatos_cpf_idx
          ON anna_candidatos(cpf);

        CREATE INDEX IF NOT EXISTS anna_candidatos_email_idx
          ON anna_candidatos(email);
      `)
      .then(() => undefined);
  }

  return schemaPromise;
}