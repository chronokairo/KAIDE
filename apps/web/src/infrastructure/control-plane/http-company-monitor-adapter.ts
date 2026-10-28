// Adapter primário da UI (ADR-0028/0032): consome a API HTTP do Control Plane.
// A cena Three.js é somente acompanhamento — leitura por padrão; a única ação
// é aprovar/rejeitar gates (POST resolve). Nenhum fetch em componentes JSX.
// Arquitetura Hexagonal: Infrastructure/UI — implementa CompanyControlPlanePort.

import type {
  CompanyMonitorPort,
  CompanyStateSnapshot,
} from '@/application/ports/company-control-plane-port';
import type {
  AgentEntity,
  AgentRole,
  AgentStatus,
  ApprovalGate,
  CompanyTelemetry,
  JobEntity,
  JobStatus,
} from '@/domain/company';
import type {
  ApprovalGateRecord,
  ControlPlaneJobType,
  JobRecord,
} from '@/domain/control-plane';

const POLL_INTERVAL_MS = 5_000;

const JOB_TITLES: Record<ControlPlaneJobType, string> = {
  'commercial.daily': 'Varredura comercial diária',
  'commercial.followup': 'Follow-up de leads',
  'analyst.discover': 'Discovery de demanda',
  'coder.implement': 'Implementação',
  'qa.review_pr': 'Revisão adversarial de PR',
  'devops.deploy': 'Deploy DEV → STAGING',
  'support.triage': 'Triagem de chamados',
  'finance.nightly': 'Fechamento noturno',
  'coder.maintenance': 'Manutenção de código',
};

/** Roster estático de agentes — config legítima (papéis da empresa virtual). */
const AGENT_ROSTER: Array<
  Pick<
    AgentEntity,
    'id' | 'role' | 'name' | 'title' | 'department' | 'coordinates' | 'color' | 'accentColor' | 'activeTools'
  >
> = [
  {
    id: 'agent-human',
    role: 'human_director',
    name: 'Sócio / Diretor Técnico',
    title: 'Humano Orquestrador & Aprovador',
    department: 'Diretoria & Supervisão',
    coordinates: [0, 0.4, 0],
    color: '#38bdf8',
    accentColor: '#0284c7',
    activeTools: ['control_plane', 'approval_gate'],
  },
  {
    id: 'agent-commercial',
    role: 'commercial',
    name: 'AI Comercial',
    title: 'SDR & Qualificação de Leads',
    department: 'Comercial & CRM',
    coordinates: [-8, 0.4, 6],
    color: '#10b981',
    accentColor: '#059669',
    activeTools: ['crm_search', 'company_due_diligence'],
  },
  {
    id: 'agent-analyst',
    role: 'analyst',
    name: 'AI Analista',
    title: 'Engenharia de Requisitos & Escopo',
    department: 'Engenharia de Requisitos',
    coordinates: [-10, 0.4, -2],
    color: '#6366f1',
    accentColor: '#4f46e5',
    activeTools: ['knowledge_base_rag', 'yaml_spec_generator'],
  },
  {
    id: 'agent-product',
    role: 'product',
    name: 'AI Product',
    title: 'Design System & Especificações',
    department: 'Produto & Design',
    coordinates: [-6, 0.4, -8],
    color: '#ec4899',
    accentColor: '#db2777',
    activeTools: ['platform_ui_inspector', 'ux_spec'],
  },
  {
    id: 'agent-coder',
    role: 'coder',
    name: 'AI Coder',
    title: 'Engenharia & Implementação Hexagonal',
    department: 'Desenvolvimento de Software',
    coordinates: [0, 0.4, -9],
    color: '#f59e0b',
    accentColor: '#d97706',
    activeTools: ['ckc_cli', 'git_patch', 'vitest_runner'],
  },
  {
    id: 'agent-qa',
    role: 'qa',
    name: 'AI QA',
    title: 'Testes Adversariais & Segurança',
    department: 'Qualidade & Auditoria',
    coordinates: [6, 0.4, -8],
    color: '#ef4444',
    accentColor: '#dc2626',
    activeTools: ['fuzz_tester', 'rbac_verifier', 'security_scanner'],
  },
  {
    id: 'agent-devops',
    role: 'devops',
    name: 'AI DevOps',
    title: 'CI/CD & Infraestrutura Cloud',
    department: 'Operações & Cloud',
    coordinates: [10, 0.4, -2],
    color: '#a855f7',
    accentColor: '#9333ea',
    activeTools: ['docker', 'supabase_cli', 'pipeline_runner'],
  },
  {
    id: 'agent-support',
    role: 'support',
    name: 'AI Support',
    title: 'Suporte Pós-Entrega',
    department: 'Suporte & Sla',
    coordinates: [8, 0.4, 6],
    color: '#22d3ee',
    accentColor: '#0891b2',
    activeTools: ['ticket_classifier', 'known_issues_kb'],
  },
  {
    id: 'agent-finance',
    role: 'finance',
    name: 'AI Finance/Ops',
    title: 'Cobrança, Fluxo & DRE',
    department: 'Financeiro & Operações',
    coordinates: [4, 0.4, 10],
    color: '#facc15',
    accentColor: '#ca8a04',
    activeTools: ['billing', 'conciliation', 'dre_report'],
  },
];

function roleFromJobType(type: ControlPlaneJobType): AgentRole {
  const prefix = type.split('.')[0];
  return (prefix === 'human' ? 'human_director' : prefix) as AgentRole;
}

function mapGate(gate: ApprovalGateRecord): ApprovalGate {
  return {
    id: gate.id,
    jobId: gate.jobId,
    type: gate.type,
    title: gate.title,
    details: gate.details,
    requestedBy: (gate.requestedBy === 'human_director'
      ? 'human_director'
      : gate.requestedBy) as AgentRole,
    requestedAt: gate.requestedAt,
    evidence: gate.evidence,
    status: gate.status,
  };
}

function mapJob(job: JobRecord, pendingGates: ApprovalGateRecord[]): JobEntity {
  const gate = pendingGates.find((g) => g.jobId === job.id);
  const status: JobStatus =
    gate && job.status !== 'failed'
      ? 'waiting_approval'
      : job.status === 'in_progress'
        ? 'in_progress'
        : job.status === 'queued'
          ? 'queued'
          : job.status === 'failed'
            ? 'failed'
            : 'completed';
  const durationSeconds =
    job.startedAt && job.completedAt
      ? Math.max(
          0,
          Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
        )
      : 0;
  const summary = (job.result?.summary as string | undefined) ?? job.error ?? '';

  return {
    id: job.id,
    title: JOB_TITLES[job.type] ?? job.type,
    client: '—',
    project: 'Operação Chronokairo',
    stage: roleFromJobType(job.type),
    agentRole: roleFromJobType(job.type),
    status,
    prompt: JSON.stringify(job.input ?? {}),
    toolsUsed: [],
    changesSummary: summary,
    testsSummary: '',
    evidence: gate?.evidence ?? [],
    costUsd: job.costUsd,
    durationSeconds,
    requiresApproval: Boolean(gate),
    approvalGate: gate ? mapGate(gate) : undefined,
    createdAt: job.createdAt,
  };
}

function buildAgents(jobs: JobRecord[], pendingGates: ApprovalGateRecord[]): AgentEntity[] {
  return AGENT_ROSTER.map((agent) => {
    const roleJobs = jobs.filter((j) => roleFromJobType(j.type) === agent.role);
    const activeJob = roleJobs.find((j) => j.status === 'in_progress');
    const pendingGate = pendingGates.find((g) => g.requestedBy === agent.role);
    const latest = roleJobs.reduce<string | null>(
      (acc, j) => (acc && acc > j.updatedAt ? acc : j.updatedAt),
      null
    );

    let status: AgentStatus = 'idle';
    if (pendingGate) {
      status = 'waiting_approval';
    } else if (activeJob) {
      status = 'working';
    }

    return {
      ...agent,
      status,
      currentTask: pendingGate
        ? `Aguardando aprovação humana: ${pendingGate.title}`
        : activeJob
          ? `Executando: ${JOB_TITLES[activeJob.type] ?? activeJob.type}`
          : 'Aguardando jobs do Control Plane',
      currentJobId: activeJob?.id,
      tokensProcessed: 0,
      costUsd: roleJobs.reduce((sum, j) => sum + (j.costUsd ?? 0), 0),
      lastActivity: latest ?? '—',
    };
  });
}

function buildTelemetry(jobs: JobRecord[], pendingGates: ApprovalGateRecord[]): CompanyTelemetry {
  const completed = jobs.filter((j) => j.status === 'completed');
  const durations = completed
    .filter((j) => j.startedAt && j.completedAt)
    .map(
      (j) =>
        (new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime()) / 60_000
    );
  return {
    totalJobsCompleted: completed.length,
    totalCostUsd: jobs.reduce((sum, j) => sum + (j.costUsd ?? 0), 0),
    activeAgentsCount: new Set(jobs.filter((j) => j.status === 'in_progress').map((j) => roleFromJobType(j.type))).size,
    pendingApprovalsCount: pendingGates.length,
    averageCycleTimeMinutes:
      durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : 0,
    handoffsInFlight: 0,
  };
}

export class HttpCompanyMonitorAdapter implements CompanyMonitorPort {
  private listeners = new Set<(snapshot: CompanyStateSnapshot) => void>();
  private errorListeners = new Set<(error: Error) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private fetching = false;

  async getSnapshot(): Promise<CompanyStateSnapshot> {
    const [jobsResponse, approvalsResponse] = await Promise.all([
      fetch('/api/control-plane/jobs', { cache: 'no-store' }),
      fetch('/api/control-plane/approvals?status=pending', { cache: 'no-store' }),
    ]);
    if (!jobsResponse.ok || !approvalsResponse.ok) {
      throw new Error(
        `Control Plane indisponível (jobs: ${jobsResponse.status}, approvals: ${approvalsResponse.status})`
      );
    }
    const { jobs } = (await jobsResponse.json()) as { jobs: JobRecord[] };
    const { approvals } = (await approvalsResponse.json()) as {
      approvals: ApprovalGateRecord[];
    };
    return {
      agents: buildAgents(jobs, approvals),
      jobs: jobs.map((j) => mapJob(j, approvals)),
      telemetry: buildTelemetry(jobs, approvals),
    };
  }

  async approveJob(approvalId: string, rationale?: string): Promise<void> {
    const response = await fetch(`/api/control-plane/approvals/${encodeURIComponent(approvalId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', resolvedBy: 'director', rationale }),
    });
    if (!response.ok) {
      throw new Error(`Falha ao aprovar gate: ${response.status}`);
    }
    await this.refresh();
  }

  async dispatchJob(jobName: string): Promise<JobEntity> {
    const response = await fetch('/api/control-plane/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: jobName, requestedBy: 'director' }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      job?: JobRecord;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? `Falha ao disparar job: ${response.status}`);
    }
    if (!payload.job) {
      throw new Error('Resposta do Control Plane sem job.');
    }
    const snapshot = await this.getSnapshot();
    return snapshot.jobs.find((job) => job.id === payload.job!.id) ?? mapJob(payload.job, []);
  }

  async rejectJob(approvalId: string, reason: string): Promise<void> {
    const response = await fetch(`/api/control-plane/approvals/${encodeURIComponent(approvalId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'rejected', resolvedBy: 'director', rationale: reason }),
    });
    if (!response.ok) {
      throw new Error(`Falha ao rejeitar gate: ${response.status}`);
    }
    await this.refresh();
  }

  subscribe(callback: (snapshot: CompanyStateSnapshot) => void, onError?: (error: Error) => void): () => void {
    this.listeners.add(callback);
    if (onError) this.errorListeners.add(onError);
    if (!this.timer) {
      this.timer = setInterval(() => void this.refresh(), POLL_INTERVAL_MS);
    }
    void this.refresh();
    return () => {
      this.listeners.delete(callback);
      if (onError) this.errorListeners.delete(onError);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }

  private async refresh(): Promise<void> {
    if (this.fetching) return;
    this.fetching = true;
    try {
      const snapshot = await this.getSnapshot();
      for (const listener of this.listeners) {
        listener(snapshot);
      }
    } catch (error) {
      const failure = error instanceof Error ? error : new Error('Não foi possível consultar o Control Plane.');
      for (const listener of this.errorListeners) listener(failure);
    } finally {
      this.fetching = false;
    }
  }
}

export const httpCompanyMonitor = new HttpCompanyMonitorAdapter();
