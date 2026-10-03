-- Control Plane da Empresa Virtual de Agentes (ADR-0028/0032)
-- Tabelas: cp_jobs, cp_job_events (append-only), cp_approval_gates,
-- cp_lead_state (estado do pipeline por lead do CRM real) e
-- cp_email_outreach (e-mails Resend SALVOS — dados, não cache).
-- NÃO cria CRM paralelo: os leads continuam na tabela `leads` existente e as
-- atividades na `crm_activities` existente; cp_lead_state apenas complementa
-- o estado do pipeline do Control Plane (1:1 com leads).
-- Idempotente e puramente aditiva: CREATE ... IF NOT EXISTS — não altera
-- dados nem tabelas existentes. RLS habilitado sem policies públicas:
-- acesso exclusivamente server-side com service role (bypass RLS).

-- ─── updated_at ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cp_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── cp_jobs ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cp_jobs (
  id uuid PRIMARY KEY,
  organization_id text NOT NULL,
  type text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_by text,
  result jsonb,
  error text,
  cost_usd numeric NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cp_jobs_idempotency UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS cp_jobs_org_idx ON cp_jobs (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS cp_jobs_set_updated_at ON cp_jobs;
CREATE TRIGGER cp_jobs_set_updated_at
  BEFORE UPDATE ON cp_jobs
  FOR EACH ROW EXECUTE FUNCTION cp_set_updated_at();

-- ─── cp_job_events (append-only) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cp_job_events (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES cp_jobs(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cp_job_events_job_idx ON cp_job_events (job_id, created_at ASC);

-- Event log é append-only: UPDATE e DELETE são rejeitados no banco.
CREATE OR REPLACE FUNCTION cp_job_events_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'cp_job_events é append-only (operação % proibida)', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS cp_job_events_block_update ON cp_job_events;
CREATE TRIGGER cp_job_events_block_update
  BEFORE UPDATE OR DELETE ON cp_job_events
  FOR EACH ROW EXECUTE FUNCTION cp_job_events_append_only();

-- ─── cp_lead_state (1:1 com leads — estado do pipeline do Control Plane) ──────
-- Fonte da verdade do pipeline APÓS o Control Plane tocar o lead; antes disso,
-- o status é derivado do status de negócio em `leads` + atividades de e-mail.

CREATE TABLE IF NOT EXISTS cp_lead_state (
  lead_id uuid PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  organization_id text NOT NULL,
  status text NOT NULL,
  score integer,
  score_rationale jsonb,
  research jsonb,
  approach_draft text,
  follow_up_draft text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cp_lead_state_org_idx ON cp_lead_state (organization_id);

DROP TRIGGER IF EXISTS cp_lead_state_set_updated_at ON cp_lead_state;
CREATE TRIGGER cp_lead_state_set_updated_at
  BEFORE UPDATE ON cp_lead_state
  FOR EACH ROW EXECUTE FUNCTION cp_set_updated_at();

-- ─── cp_email_outreach (e-mails Resend salvos — dados, não cache) ────────────
-- Upsert por (organization_id, resend_id). lead_id é SET NULL se o lead for
-- removido — o registro de envio (evidência) permanece.

CREATE TABLE IF NOT EXISTS cp_email_outreach (
  id uuid PRIMARY KEY,
  organization_id text NOT NULL,
  resend_id text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  sent_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cp_email_outreach_org_resend UNIQUE (organization_id, resend_id)
);

CREATE INDEX IF NOT EXISTS cp_email_outreach_org_idx
  ON cp_email_outreach (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS cp_email_outreach_set_updated_at ON cp_email_outreach;
CREATE TRIGGER cp_email_outreach_set_updated_at
  BEFORE UPDATE ON cp_email_outreach
  FOR EACH ROW EXECUTE FUNCTION cp_set_updated_at();

-- ─── cp_approval_gates ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cp_approval_gates (
  id uuid PRIMARY KEY,
  organization_id text NOT NULL,
  job_id uuid NOT NULL REFERENCES cp_jobs(id) ON DELETE CASCADE,
  lead_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  details text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution text
);

CREATE INDEX IF NOT EXISTS cp_approval_gates_org_status_idx
  ON cp_approval_gates (organization_id, status, requested_at DESC);

-- ─── RLS: habilitado sem policies públicas (somente service role) ─────────────

ALTER TABLE cp_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_lead_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_email_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_approval_gates ENABLE ROW LEVEL SECURITY;
