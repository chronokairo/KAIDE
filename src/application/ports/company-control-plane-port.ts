import { AgentEntity, JobEntity, CompanyTelemetry } from '@/domain/company';

export interface CompanyStateSnapshot {
  agents: AgentEntity[];
  jobs: JobEntity[];
  telemetry: CompanyTelemetry;
}

/**
 * Observation and human decisions; job submission belongs to the execution port.
 * The optional dispatch command exists only for the primary UI dock.
 */
export interface CompanyMonitorPort {
  getSnapshot(): Promise<CompanyStateSnapshot>;
  approveJob(approvalId: string, rationale?: string): Promise<void>;
  rejectJob(approvalId: string, reason: string): Promise<void>;
  dispatchJob?(jobName: string): Promise<JobEntity>;
  subscribe(
    callback: (snapshot: CompanyStateSnapshot) => void,
    onError?: (error: Error) => void
  ): () => void;
}

/**
 * Primary driven port for the Virtual Agent Company Control Plane.
 *
 * Coordinates execution, state persistence, telemetry, and Human Approval Gates
 * across all 9 agent roles in adherence to ADR-0028 and ADR-0038.
 */
export interface CompanyControlPlanePort extends CompanyMonitorPort {
  getSnapshot(): Promise<CompanyStateSnapshot>;
  approveJob(approvalId: string, rationale?: string): Promise<void>;
  rejectJob(approvalId: string, reason: string): Promise<void>;
  submitJob(job: JobEntity): Promise<void>;
  executeJob?(jobName: string, params?: Record<string, any>): Promise<JobEntity>;
  registerPendingSprintSync?(approvalId: string, proposals: any[]): void;
  subscribe(callback: (snapshot: CompanyStateSnapshot) => void): () => void;
}
