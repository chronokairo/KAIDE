import type { AuditPort } from '../ports/audit-port';
import type { CompanyResearchPort } from '../ports/company-research-port';
import type { CrmPort } from '../ports/crm-port';
import type { EmailOutreachPort } from '../ports/email-outreach-port';
import type { JobStorePort } from '../ports/control-plane-store-port';
import {
  buildPeriodicIdempotencyKey,
  canRetryJob,
  isTerminalJobStatus,
  type ControlPlaneJobType,
  type JobEventRecord,
  type JobEventType,
  type JobRecord,
} from '../../domain/control-plane';
import { JobTypeNotImplementedError } from '../../domain/errors';
import { runCommercialDailyJob } from './commercial-daily';
import { runCommercialFollowupJob } from './commercial-followup';

export interface JobHandlerContext {
  readonly job: JobRecord;
  readonly organizationId: string;
  readonly store: JobStorePort;
  readonly crm: CrmPort;
  readonly research: CompanyResearchPort;
  readonly audit: AuditPort;
  /** Resend — ausente/desconfigurado degrada para envio manual pós-aprovação. */
  readonly emailOutreach?: EmailOutreachPort;
  readonly now: () => Date;
  emit(type: JobEventType, payload: Record<string, unknown>): Promise<void>;
}

export interface JobHandlerResult {
  result: Record<string, unknown>;
  costUsd?: number;
}

export type JobHandler = (ctx: JobHandlerContext) => Promise<JobHandlerResult>;

const JOB_HANDLERS: Partial<Record<ControlPlaneJobType, JobHandler>> = {
  'commercial.daily': runCommercialDailyJob,
  'commercial.followup': runCommercialFollowupJob,
};

export interface RunJobByTypeInput {
  readonly type: ControlPlaneJobType;
  readonly organizationId: string;
  readonly requestedBy?: string;
  readonly idempotencyKey?: string;
}

export interface RunJobByTypeOutcome {
  readonly job: JobRecord;
  readonly events: readonly JobEventRecord[];
  readonly alreadyRan: boolean;
}

export interface RunJobByTypeDeps {
  readonly store: JobStorePort;
  readonly crm: CrmPort;
  readonly research: CompanyResearchPort;
  readonly audit: AuditPort;
  readonly emailOutreach?: EmailOutreachPort;
  readonly now?: () => Date;
}

export async function runJobByType(
  deps: RunJobByTypeDeps,
  input: RunJobByTypeInput,
): Promise<RunJobByTypeOutcome> {
  const handler = JOB_HANDLERS[input.type];
  if (!handler) {
    throw new JobTypeNotImplementedError(input.type);
  }

  const now = deps.now ?? (() => new Date());
  const { store, crm, research, audit } = deps;
  const organizationId = input.organizationId;
  const idempotencyKey =
    input.idempotencyKey ?? buildPeriodicIdempotencyKey(input.type, now());

  const existing = await store.getJobByIdempotencyKey(organizationId, idempotencyKey);
  if (existing) {
    const events = await store.listJobEvents(existing.id);
    const settled =
      isTerminalJobStatus(existing.status) ||
      existing.status === 'in_progress' ||
      !canRetryJob(existing);
    if (settled) {
      return { job: existing, events, alreadyRan: true };
    }
  }

  let job: JobRecord;
  if (existing) {
    job = await store.updateJob(existing.id, {
      status: 'queued',
      attempts: existing.attempts + 1,
      error: undefined,
    });
  } else {
    const created = await store.createJob({
      organizationId,
      type: input.type,
      idempotencyKey,
      requestedBy: input.requestedBy ?? 'automation',
      status: 'queued',
      attempts: 1,
      input: {},
    });
    job = created.job;
    await store.appendJobEvent({
      jobId: job.id,
      organizationId,
      type: 'job.created',
      payload: { type: job.type, idempotencyKey: job.idempotencyKey },
    });
    await audit.record({
      organizationId,
      actorId: input.requestedBy ?? 'automation',
      action: 'control_plane.job.created',
      metadata: { resource: `job:${job.id}`, type: job.type, idempotencyKey },
    });
  }

  job = await store.updateJob(job.id, {
    status: 'in_progress',
    startedAt: now().toISOString(),
  });
  await store.appendJobEvent({
    jobId: job.id,
    organizationId,
    type: 'job.started',
    payload: { attempt: job.attempts },
  });
  await audit.record({
    organizationId,
    actorId: input.requestedBy ?? 'automation',
    action: 'control_plane.job.started',
    metadata: { resource: `job:${job.id}`, attempt: job.attempts },
  });

  const ctx: JobHandlerContext = {
    job,
    organizationId,
    store,
    crm,
    research,
    audit,
    emailOutreach: deps.emailOutreach,
    now,
    async emit(type, payload) {
      await store.appendJobEvent({ jobId: job.id, organizationId, type, payload });
    },
  };

  try {
    const { result, costUsd } = await handler(ctx);
    job = await store.updateJob(job.id, {
      status: 'completed',
      result,
      costUsd: costUsd ?? 0,
      completedAt: now().toISOString(),
      error: undefined,
    });
    await ctx.emit('job.completed', { result });
    await audit.record({
      organizationId,
      actorId: input.requestedBy ?? 'automation',
      action: 'control_plane.job.completed',
      metadata: { resource: `job:${job.id}`, type: job.type },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    job = await store.updateJob(job.id, {
      status: 'failed',
      error: message,
      completedAt: now().toISOString(),
    });
    await ctx.emit('job.failed', { error: message });
    await audit.record({
      organizationId,
      actorId: input.requestedBy ?? 'automation',
      action: 'control_plane.job.failed',
      metadata: { resource: `job:${job.id}`, type: job.type, error: message },
    });
  }

  const events = await store.listJobEvents(job.id);
  return { job, events, alreadyRan: false };
}
