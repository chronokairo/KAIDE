/**
 * Entidades e tipos de domínio do Módulo de Engenharia, Backlog & Sprints
 * (AI Coder e AI Product).
 *
 * Mapeiam, em forma pura, as tabelas reais do Supabase de produção:
 * project_tasks, projects, employees e audit_logs.
 *
 * Arquitetura Hexagonal: Domínio Puro (sem Supabase, Next, React ou SDKs).
 */

export type TaskColumnStatus = 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';

export type TaskPriority = 'LOW' | 'MED' | 'HIGH' | 'URGENT';

export interface ProjectTask {
  id: string;
  code: string;
  title: string;
  columnStatus: TaskColumnStatus;
  priority: TaskPriority;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  assignedUserId?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  customerId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Mudança de status proposta pelo AI Coder ao sincronizar o banco com o
 * resultado da revisão do AI QA. Sempre passa por Human Approval Gate antes de
 * ser gravada (ADR-0028): o agente propõe, o humano decide.
 */
export interface TaskSyncProposal {
  taskId: string;
  code: string;
  title: string;
  currentStatus: TaskColumnStatus;
  proposedStatus: TaskColumnStatus;
  reason: string;
  linkedBranch?: string;
  linkedCommits: string[];
  blockedBy?: string;
}

export interface SprintSyncReport {
  tasksScannedCount: number;
  byStatus: Record<string, number>;
  proposals: TaskSyncProposal[];
  appliedCount: number;
  skippedCount: number;
  generatedAt: string;
}

export interface AcceptanceCriterion {
  id: string;
  given: string;
  when: string;
  then: string;
}

export type HexagonalLayer = 'domain' | 'application' | 'infrastructure';

export interface SpecSection {
  id: string;
  title: string;
  requirement: string;
  criteria: AcceptanceCriterion[];
  layers: HexagonalLayer[];
  risks: string[];
}

export interface MilestoneSpecReport {
  projectId: string;
  projectName: string;
  taskIds: string[];
  taskCodes: string[];
  scope: string;
  specSections: SpecSection[];
  outOfScope: string[];
  openQuestions: string[];
  /** Especificação técnica em YAML pronta para versionamento no repositório. */
  yaml: string;
  generatedAt: string;
}

export interface SprintSyncJobResult {
  jobId: string;
  stage: 'coder';
  requiresApproval: boolean;
  approvalGateId: string;
  report: SprintSyncReport;
  createdAt: string;
}

export interface MilestoneSpecJobResult {
  jobId: string;
  stage: 'product';
  requiresApproval: false;
  report: MilestoneSpecReport;
  createdAt: string;
}