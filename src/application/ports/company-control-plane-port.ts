import { AgentEntity, JobEntity, CompanyTelemetry } from '@/domain/company';

export interface CompanyStateSnapshot {
  agents: AgentEntity[];
  jobs: JobEntity[];
  telemetry: CompanyTelemetry;
}

export interface CompanyControlPlanePort {
  getSnapshot(): Promise<CompanyStateSnapshot>;
  approveJob(approvalId: string, rationale?: string): Promise<void>;
  rejectJob(approvalId: string, reason: string): Promise<void>;
  subscribe(callback: (snapshot: CompanyStateSnapshot) => void): () => void;
}
