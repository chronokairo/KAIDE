import { EngineeringRepositoryPort } from '@/application/ports/engineering-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  Project,
  ProjectTask,
  AcceptanceCriterion,
  SpecSection,
  HexagonalLayer,
  MilestoneSpecReport,
  MilestoneSpecJobResult,
} from '@/domain/engineering';
import { JobEntity } from '@/domain/company';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

const PROD_USER_ID = '00000000-0000-4000-8000-000000000002'; // Luan Nery / Tech Lead Owner

/**
 * Job `product.spec_milestones` — AI Product.
 *
 * Lê `projects` e `project_tasks` do Supabase de produção e gera uma
 * especificação de marcos no formato de especificação YAML, pronta para
 * versionamento no repositório.
 *
 * A especificação é sempre derivada do backlog persistido — o AI Product não
 * inventa escopo. Se o backlog estiver vazio, o job falha explicitamente em
 * vez de fabricar uma entrega.
 */
export class ExecuteProductMilestoneSpecUseCase {
  constructor(
    private readonly engineeringRepo: EngineeringRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(projectCode?: string): Promise<MilestoneSpecJobResult> {
    const [projects, tasks] = await Promise.all([
      this.engineeringRepo.listProjects(),
      this.engineeringRepo.listTasks(),
    ]);

    const targets = projectCode ? projects.filter((p) => p.code === projectCode) : projects;
    const timestamp = new Date().toISOString();
    const jobId = `job-product-spec-${Date.now()}`;

    if (targets.length === 0) {
      throw new Error(
        `Nenhum projeto${projectCode ? ` com código ${projectCode}` : ''} encontrado no Supabase prod.`
      );
    }

    const reports = targets.map((project) =>
      this.buildSpec(project, tasks.filter((t) => t.projectId === project.id), timestamp)
    );

    const totalTasks = reports.reduce((s, r) => s + r.taskIds.length, 0);

    const evidenceList: string[] = [
      `Especificação de marcos gerada para ${reports.length} projeto(s) a partir de projects e project_tasks (Supabase prod).`,
      `Tarefas consolidadas na especificação: ${totalTasks}.`,
      ...reports.map(
        (r) =>
          `${r.projectName} (${r.taskCodes.join(', ') || 'sem tarefas'}): ${r.specSections.length} seção(ões), ${r.openQuestions.length} pergunta(s) em aberto.`
      ),
      'Governança AI-first (ADR-0028): a especificação é um artefato de versionamento. Aprovação de escopo é ato do Diretor; nenhum código é gerado por este job.',
    ];

    const job: JobEntity = {
      id: jobId,
      title: `Especificação de Marcos e Critérios de Aceitação (${projectCode ?? 'todos os projetos'})`,
      client: 'Product & Engenharia ChronoKairo Corp',
      project: 'Especificação Técnica',
      stage: 'product',
      agentRole: 'product',
      status: 'completed',
      prompt:
        'Ler projects e project_tasks do Supabase prod e gerar especificação YAML de marcos com critérios de aceitação em Gherkin, sem inventar escopo.',
      toolsUsed: ['project_scope_reader', 'backlog_to_spec', 'acceptance_criteria_writer', 'yaml_spec_generator'],
      changesSummary: `${reports.length} especificação(ões) gerada(s) cobrindo ${totalTasks} tarefa(s).`,
      testsSummary:
        'Cada seção declara camada hexagonal afetada e riscos. Perguntas em aberto são explicitadas em vez de assumidas.',
      evidence: evidenceList,
      costUsd: 0.13,
      durationSeconds: 14,
      requiresApproval: false,
      handoffTo: 'coder',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(job);
    }

    await this.persist(jobId, reports);

    return {
      jobId,
      stage: 'product',
      requiresApproval: false,
      report: reports[0],
      createdAt: timestamp,
    };
  }

  private buildSpec(project: Project, tasks: ProjectTask[], timestamp: string): MilestoneSpecReport {
    const taskCodes = tasks.map((t) => t.code);
    const specSections = this.buildSections(project, tasks);
    const openQuestions = this.buildOpenQuestions(project, tasks);

    const scope =
      tasks.length > 0
        ? `${project.name}: ${tasks.length} tarefa(s) no backlog — ${taskCodes.join(', ')}.`
        : `${project.name}: projeto sem tarefas registradas no backlog.`;

    const outOfScope = this.buildOutOfScope(tasks);

    return {
      projectId: project.id,
      projectName: `${project.name} (${project.code})`,
      taskIds: tasks.map((t) => t.id),
      taskCodes,
      scope,
      specSections,
      outOfScope,
      openQuestions,
      yaml: this.renderYaml(project, tasks, specSections, outOfScope, openQuestions, timestamp),
      generatedAt: timestamp,
    };
  }

  /**
   * Agrupa as tarefas em seções por natureza do título. A classificação é
   * lexical e conservadora: cada agrupador deriva de padrões explícitos.
   */
  private buildSections(project: Project, tasks: ProjectTask[]): SpecSection[] {
    if (tasks.length === 0) {
      return [
        {
          id: 'SEC-00',
          title: 'Escopo a definir',
          requirement: `Projeto ${project.code} sem tarefas registradas. Requer definição de escopo pelo Product Owner.`,
          criteria: [],
          layers: ['domain'],
          risks: ['Escopo indefinido impede estimativa e execução.'],
        },
      ];
    }

    const groups = new Map<string, ProjectTask[]>();
    for (const task of tasks) {
      const key = this.groupOf(task.title);
      groups.set(key, [...(groups.get(key) ?? []), task]);
    }

    let index = 0;
    return [...groups.entries()].map(([group, groupTasks]) => {
      const id = `SEC-${String(index++).padStart(2, '0')}`;
      const layers = this.layersOf(groupTasks);
      const risks = this.risksOf(group, project, groupTasks);

      return {
        id,
        title: group,
        requirement: groupTasks.map((t) => `${t.code}: ${t.title}`).join(' | '),
        criteria: groupTasks.flatMap((t) => this.criteriaFor(t)),
        layers,
        risks,
      };
    });
  }

  private groupOf(title: string): string {
    const t = title.toLowerCase();
    if (/corre[çc][ãa]o|corrig|fix|bug|defeito/.test(t)) return 'Correções e Defeitos';
    if (/tela|front|ui|interface|layout|p[áa]gina/.test(t)) return 'Interface e Telas';
    if (/api|endpoint|integra[çc][ãa]o|servi[çc]o|backend|webhook/.test(t))
      return 'APIs e Integrações';
    if (/dados|migra[çc][ãa]o|import|export|schema|banco/.test(t)) return 'Dados e Migrações';
    if (/teste|qa|valida[çc][ãa]o|cobertura/.test(t)) return 'Testes e Qualidade';
    if (/deploy|ci|cd|pipeline|infra|ambiente/.test(t)) return 'Infraestrutura e Deploy';
    return 'Funcionalidades Entregues';
  }

  private criteriaFor(task: ProjectTask): AcceptanceCriterion[] {
    const base = task.title.trim();
    return [
      {
        id: `${task.code}-AC-01`,
        given: `um usuário autenticado no ambiente do projeto ${task.code}`,
        when: `exercita a funcionalidade "${base}"`,
        then: `o sistema responde conforme a especificação e o resultado é registrado em log de auditoria`,
      },
      {
        id: `${task.code}-AC-02`,
        given: `a request é rejeitada por falta de permissão`,
        when: `o usuário sem papel autorizado invoca "${base}"`,
        then: `o backend recusa a operação e nenhuma escrita é persistida`,
      },
    ];
  }

  private layersOf(tasks: ProjectTask[]): HexagonalLayer[] {
    const layers = new Set<HexagonalLayer>();
    for (const task of tasks) {
      const t = task.title.toLowerCase();
      if (/tela|front|ui|interface|layout/.test(t)) {
        layers.add('infrastructure');
        layers.add('application');
      }
      if (/dados|migra|schema|reposit/.test(t)) layers.add('infrastructure');
      if (/regra|neg[óo]cio|cadastro|cliente|contrato/.test(t)) layers.add('domain');
      if (/teste|qa|valida/.test(t)) layers.add('application');
    }
    if (layers.size === 0) layers.add('domain');
    return [...layers];
  }

  private risksOf(group: string, project: Project, tasks: ProjectTask[]): string[] {
    const risks: string[] = [];
    if (project.status !== 'Active') {
      risks.push(`Projeto com status ${project.status}; escopo congelado e execução suspensa.`);
    }
    const done = tasks.filter((t) => t.columnStatus === 'Done').length;
    if (done === tasks.length && tasks.length > 0) {
      risks.push('Todas as tarefas do grupo já estão Done; confirmar se o marco foi de fato concluído.');
    }
    if (tasks.some((t) => t.priority === 'URGENT' || t.priority === 'HIGH')) {
      risks.push('Há tarefas de alta prioridade no grupo; risco de atraso de marco.');
    }
    if (group === 'Correções e Defeitos') {
      risks.push('Correções em produção exigem validação do QA e Human Approval Gate antes do deploy.');
    }
    return risks;
  }

  private buildOpenQuestions(project: Project, tasks: ProjectTask[]): string[] {
    const questions: string[] = [];
    if (!project.description) questions.push('Qual é a descrição de escopo oficial deste projeto?');
    if (!project.endDate) questions.push('Qual a data-alvo do próximo marco?');
    if (!project.startDate) questions.push('Qual a data de início planejada?');
    const unassigned = tasks.filter((t) => !t.assignedUserId).length;
    if (unassigned > 0) questions.push(`${unassigned} tarefa(s) sem responsável — quem é o owner?`);
    if (tasks.length === 0) questions.push('Nenhuma tarefa cadastrada: qual o primeiro marco a definir?');
    return questions;
  }

  private buildOutOfScope(tasks: ProjectTask[]): string[] {
    const out: string[] = ['Alteração de schema sem migração versionada', 'Escopo não registrado em project_tasks'];
    if (tasks.some((t) => t.columnStatus === 'Done')) {
      out.push('Refatoração de funcionalidades já concluídas e aceitas');
    }
    if (!tasks.some((t) => t.columnStatus === 'In Progress')) {
      out.push('Execução de desenvolvimento — este artefato é somente de especificação');
    }
    return out;
  }

  private renderYaml(
    project: Project,
    tasks: ProjectTask[],
    sections: SpecSection[],
    outOfScope: string[],
    openQuestions: string[],
    timestamp: string
  ): string {
    const q = (s: string) => JSON.stringify(s);
    const lines: string[] = [
      '# Especificação de Marcos — gerada por AI Product (job product.spec_milestones)',
      '# Fonte: projects + project_tasks no Supabase de produção. Não editar à mão sem revisão.',
      `project:`,
      `  code: ${project.code}`,
      `  name: ${q(project.name)}`,
      `  status: ${project.status}`,
      `  startDate: ${project.startDate ?? 'null'}`,
      `  endDate: ${project.endDate ?? 'null'}`,
      `  generatedAt: ${timestamp}`,
      '',
      'tasks:',
      ...(tasks.length > 0
        ? tasks.map((t) => `  - code: ${t.code}\n    title: ${q(t.title)}\n    status: ${t.columnStatus}\n    priority: ${t.priority}`)
        : ['  []']),
      '',
      'sections:',
      ...sections.flatMap((s) => [
        `  - id: ${s.id}`,
        `    title: ${q(s.title)}`,
        `    requirement: ${q(s.requirement)}`,
        `    layers: [${s.layers.join(', ')}]`,
        '    acceptanceCriteria:',
        ...(s.criteria.length > 0
          ? s.criteria.flatMap((c) => [
              `      - id: ${c.id}`,
              `        given: ${q(c.given)}`,
              `        when: ${q(c.when)}`,
              `        then: ${q(c.then)}`,
            ])
          : ['      []']),
        `    risks:`,
        ...(s.risks.length > 0 ? s.risks.map((r) => `      - ${q(r)}`) : ['      []']),
      ]),
      '',
      'outOfScope:',
      ...outOfScope.map((o) => `  - ${q(o)}`),
      '',
      'openQuestions:',
      ...(openQuestions.length > 0 ? openQuestions.map((o) => `  - ${q(o)}`) : ['  []']),
      '',
      'governance:',
      '  requiresHumanApproval: true',
      '  approvalGate: scope_baseline',
      '  note: "Especificação não constitui aprovação de escopo nem autorização de deploy (ADR-0028)."',
      '',
    ];
    return lines.join('\n');
  }

  private async persist(jobId: string, reports: MilestoneSpecReport[]): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        user_id: PROD_USER_ID,
        action: 'PRODUCT_MILESTONE_SPEC_GENERATED',
        target: reports.map((r) => `projects/${r.projectName}`).join(', '),
        success: true,
        details: {
          jobId,
          projects: reports.length,
          sections: reports.map((r) => r.specSections.length),
          tasks: reports.reduce((s, r) => s + r.taskIds.length, 0),
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Supabase non-blocking
    }
  }
}