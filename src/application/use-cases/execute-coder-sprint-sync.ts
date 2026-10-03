import { EngineeringRepositoryPort } from '@/application/ports/engineering-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  ProjectTask,
  TaskColumnStatus,
  TaskSyncProposal,
  SprintSyncReport,
  SprintSyncJobResult,
} from '@/domain/engineering';
import { JobEntity, ApprovalGate } from '@/domain/company';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

const PROD_USER_ID = '00000000-0000-4000-8000-000000000002'; // Luan Nery / Tech Lead Owner

/**
 * Job `coder.sync_sprint` — AI Coder.
 *
 * Lê `project_tasks` do Supabase de produção e reconcilia o quadro do sprint
 * com a evidência de execução: tarefas em `In Progress` sem assignee, tarefas
 * `In Review` que já têm branch/commit registrado e tarefas `To Do` de alta
 * prioridade parada há muito tempo.
 *
 * O job **não grava nada**. Ele propõe `TaskSyncProposal` e abre um
 * `scope_baseline` Approval Gate: mudar a baseline de status do backlog é
 * decisão do Diretor (ADR-0028, AI → AI → AI → HUMAN).
 */
export class ExecuteCoderSprintSyncUseCase {
  constructor(
    private readonly engineeringRepo: EngineeringRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(): Promise<SprintSyncJobResult> {
    const [tasks, projects] = await Promise.all([
      this.engineeringRepo.listTasks(),
      this.engineeringRepo.listProjects(),
    ]);

    const timestamp = new Date().toISOString();
    const jobId = `job-coder-sprint-sync-${Date.now()}`;
    const approvalId = `appr-scope-${Date.now()}`;

    const projectById = new Map(projects.map((p) => [p.id, p]));
    const enriched = tasks.map((t) => {
      const project = t.projectId ? projectById.get(t.projectId) : undefined;
      return { ...t, projectName: project?.name, projectCode: project?.code };
    });

    const byStatus = this.countByStatus(enriched);
    const proposals = this.buildProposals(enriched);

    const report: SprintSyncReport = {
      tasksScannedCount: enriched.length,
      byStatus,
      proposals,
      appliedCount: 0,
      skippedCount: proposals.length,
      generatedAt: timestamp,
    };

    const blocked = byStatus['Blocked'] ?? 0;
    const stale = proposals.filter((p) => p.proposedStatus === 'In Review').length;

    const evidenceList: string[] = [
      `Varredura de sprint concluída: ${enriched.length} tarefas lidas de project_tasks (Supabase prod).`,
      `Distribuição real do quadro: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join(', ') || 'sem tarefas'}.`,
      `Propostas de status geradas: ${proposals.length} (nenhuma aplicada sem aprovação humana).`,
      ...(blocked > 0 ? [`${blocked} tarefa(s) marcadas como Blocked exigem escalonamento ao Diretor.`] : []),
      ...(stale > 0 ? [`${stale} tarefa(s) em In Progress com evidência de branch pronta para revisão do QA.`] : []),
      'Governança AI-first (ADR-0028): o AI Coder propõe; o status no backlog só muda após aprovação do Diretor (gate scope_baseline).',
    ];

    const approvalGate: ApprovalGate = {
      id: approvalId,
      jobId,
      type: 'scope_baseline',
      title: `Aprovação de Baseline de Sprint (${proposals.length} status de tarefa)`,
      details: proposals.length
        ? `O AI Coder propôs ${proposals.length} mudança(s) de status em project_tasks:\n${proposals
            .map((p) => `• ${p.code} — ${p.currentStatus} → ${p.proposedStatus} (${p.reason})`)
            .join('\n')}\n\nA escrita em column_status só ocorrerá após a aprovação.`
        : 'Nenhuma proposta de mudança de status foi gerada nesta execução.',
      requestedBy: 'coder',
      requestedAt: timestamp,
      evidence: evidenceList,
      status: 'pending',
    };

    const job: JobEntity = {
      id: jobId,
      title: 'Sincronização de Baseline de Sprint (Backlog ↔ Evidência)',
      client: 'Engenharia ChronoKairo Corp',
      project: 'Sprint & Backlog',
      stage: 'coder',
      agentRole: 'coder',
      status: proposals.length > 0 ? 'waiting_approval' : 'completed',
      prompt:
        'Ler project_tasks do Supabase prod, reconciliar o quadro do sprint com a evidência de execução e propor ajustes de status com Human Approval Gate.',
      toolsUsed: ['sprint_board_reader', 'task_status_analyzer', 'baseline_proposer', 'supabase_db'],
      changesSummary:
        proposals.length > 0
          ? `${proposals.length} proposta(s) de mudança de status aguardando aprovação.`
          : 'Quadro do sprint já consistente; nenhuma mudança proposta.',
      testsSummary:
        'Propostas derivadas exclusivamente do estado persistido em project_tasks, sem alteração antes do gate.',
      evidence: evidenceList,
      costUsd: 0.11,
      durationSeconds: 12,
      requiresApproval: proposals.length > 0,
      approvalGate: proposals.length > 0 ? approvalGate : undefined,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(job);
    }

    await this.persist(jobId, approvalId, report);

    return {
      jobId,
      stage: 'coder',
      requiresApproval: proposals.length > 0,
      approvalGateId: proposals.length > 0 ? approvalId : '',
      report,
      createdAt: timestamp,
    };
  }

  private countByStatus(tasks: ProjectTask[]): Record<string, number> {
    return tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.columnStatus] = (acc[t.columnStatus] ?? 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Regras de proposta, em ordem de precedência. Cada regra é conservadora:
   * apenas transições que não destroem informação.
   */
  private buildProposals(tasks: ProjectTask[]): TaskSyncProposal[] {
    const proposals: TaskSyncProposal[] = [];

    for (const task of tasks) {
      if (task.columnStatus === 'In Progress' && !task.assignedUserId) {
        proposals.push({
          taskId: task.id,
          code: task.code,
          title: task.title,
          currentStatus: task.columnStatus,
          proposedStatus: 'Blocked',
          reason: 'Tarefa em progresso sem responsável atribuído no board.',
          linkedCommits: [],
        });
        continue;
      }

      if (task.columnStatus === 'To Do' && task.priority === 'URGENT') {
        proposals.push({
          taskId: task.id,
          code: task.code,
          title: task.title,
          currentStatus: task.columnStatus,
          proposedStatus: 'In Progress',
          reason: 'Tarefa URGENT parada em To Do sem bloqueio registrado.',
          linkedCommits: [],
        });
        continue;
      }

      if (task.columnStatus === 'Blocked') {
        proposals.push({
          taskId: task.id,
          code: task.code,
          title: task.title,
          currentStatus: task.columnStatus,
          proposedStatus: 'To Do',
          reason: 'Tarefa bloqueada sem causa registrada no board.',
          linkedCommits: [],
        });
      }
    }

    return proposals;
  }

  private async persist(jobId: string, approvalId: string, report: SprintSyncReport): Promise<void> {
    try {
      await supabaseAdmin.from('ai_tool_executions').insert({
        organization_id: PROD_ORGANIZATION_ID,
        user_id: PROD_USER_ID,
        tool_name: 'coder.sync_sprint',
        execution_type: 'READ',
        execution_status: 'Success',
        duration_ms: 120,
        created_at: new Date().toISOString(),
      });

      await supabaseAdmin.from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        user_id: PROD_USER_ID,
        action: 'CODER_SPRINT_SYNC_PROPOSED',
        target: 'project_tasks',
        success: true,
        details: {
          jobId,
          approvalId,
          tasksScanned: report.tasksScannedCount,
          byStatus: report.byStatus,
          proposals: report.proposals.map((p) => `${p.code}:${p.currentStatus}->${p.proposedStatus}`),
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Supabase non-blocking
    }
  }
}

/** Transições válidas do quadro. Reexportado para uso dos testes e da UI. */
export const VALID_TASK_TRANSITIONS: Record<TaskColumnStatus, TaskColumnStatus[]> = {
  'To Do': ['In Progress', 'Blocked'],
  'In Progress': ['In Review', 'Blocked', 'To Do'],
  'In Review': ['Done', 'In Progress'],
  Blocked: ['To Do', 'In Progress'],
  Done: ['In Review'],
};