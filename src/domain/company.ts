/**
 * Entidades e regras de domínio da Empresa Virtual de Agentes da ChronoKairo.
 * Arquitetura Hexagonal: Domínio Puro (sem dependências de frameworks ou React).
 */

export type AgentRole =
  | 'human_director'
  | 'commercial'
  | 'analyst'
  | 'product'
  | 'coder'
  | 'qa'
  | 'devops'
  | 'support'
  | 'finance';

export type AgentStatus = 'idle' | 'working' | 'waiting_approval' | 'handoff' | 'offline';

export interface AgentEntity {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  department: string;
  status: AgentStatus;
  currentTask: string;
  currentJobId?: string;
  tokensProcessed: number;
  costUsd: number;
  lastActivity: string;
  activeTools: string[];
  coordinates: [number, number, number];
  color: string;
  accentColor: string;
}

export type JobStatus = 'queued' | 'in_progress' | 'waiting_approval' | 'completed' | 'rejected' | 'failed';

export interface ApprovalGate {
  id: string;
  jobId: string;
  type: 'production_deploy' | 'payment_release' | 'scope_baseline' | 'outbound_contact';
  title: string;
  details: string;
  requestedBy: AgentRole;
  requestedAt: string;
  evidence: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface JobEntity {
  id: string;
  title: string;
  client: string;
  project: string;
  stage: AgentRole;
  agentRole: AgentRole;
  status: JobStatus;
  prompt: string;
  toolsUsed: string[];
  changesSummary: string;
  testsSummary: string;
  evidence: string[];
  costUsd: number;
  durationSeconds: number;
  requiresApproval: boolean;
  approvalGate?: ApprovalGate;
  handoffTo?: AgentRole;
  createdAt: string;
}

export interface CompanyTelemetry {
  totalJobsCompleted: number;
  totalCostUsd: number;
  activeAgentsCount: number;
  pendingApprovalsCount: number;
  averageCycleTimeMinutes: number;
  handoffsInFlight: number;
}
