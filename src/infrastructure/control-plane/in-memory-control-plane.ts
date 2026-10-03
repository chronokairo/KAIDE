import { CompanyControlPlanePort, CompanyStateSnapshot } from '@/application/ports/company-control-plane-port';
import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { PullRequestRepositoryPort } from '@/application/ports/pr-repository-port';
import { AgentEntity, JobEntity, CompanyTelemetry } from '@/domain/company';
import { defaultLeadRepository } from '@/infrastructure/crm/in-memory-lead-repository';
import { defaultPullRequestRepository } from '@/infrastructure/qa/in-memory-pr-repository';
import { ExecuteCommercialFollowupUseCase } from '@/application/use-cases/execute-commercial-followup';
import { ExecuteQaPrReviewUseCase } from '@/application/use-cases/execute-qa-pr-review';

export class InMemoryCompanyControlPlaneAdapter implements CompanyControlPlanePort {
  private snapshot: CompanyStateSnapshot;
  private listeners: Set<(snapshot: CompanyStateSnapshot) => void> = new Set();

  constructor(
    private readonly leadRepository: LeadRepositoryPort = defaultLeadRepository,
    private readonly prRepository: PullRequestRepositoryPort = defaultPullRequestRepository
  ) {
    const agents: AgentEntity[] = [
      {
        id: 'agent-human',
        role: 'human_director',
        name: 'Sócio / Diretor Técnico',
        title: 'Humano Orquestrador & Aprovador',
        department: 'Diretoria & Supervisão',
        status: 'working',
        currentTask: 'Supervisão do Control Plane e aprovação de gates críticos',
        tokensProcessed: 0,
        costUsd: 0,
        lastActivity: 'Ativo agora',
        activeTools: ['control_plane', 'approval_gate', 'git_merge', 'banking_auth'],
        coordinates: [0, 0.4, 0],
        color: '#38bdf8',
        accentColor: '#0284c7',
      },
      {
        id: 'agent-commercial',
        role: 'commercial',
        name: 'AI Comercial',
        title: 'SDR & Qualificação de Leads',
        department: 'Comercial & CRM',
        status: 'idle',
        currentTask: 'Monitorando pipeline de leads e SLA de follow-up',
        tokensProcessed: 142500,
        costUsd: 0.28,
        lastActivity: 'Há 2 min',
        activeTools: ['crm_search', 'company_due_diligence', 'meeting_notes_extractor', 'followup_composer'],
        coordinates: [-8, 0.4, 6],
        color: '#10b981',
        accentColor: '#059669',
      },
      {
        id: 'agent-analyst',
        role: 'analyst',
        name: 'AI Analista',
        title: 'Engenharia de Requisitos & Escopo',
        department: 'Engenharia de Requisitos',
        status: 'working',
        currentTask: 'Estruturando REQ-001 até REQ-008 para módulo de ASO',
        currentJobId: 'job-003',
        tokensProcessed: 320100,
        costUsd: 0.64,
        lastActivity: 'Há 5 min',
        activeTools: ['knowledge_base_rag', 'yaml_spec_generator', 'risk_estimator'],
        coordinates: [-10, 0.4, -2],
        color: '#6366f1',
        accentColor: '#4f46e5',
      },
      {
        id: 'agent-product',
        role: 'product',
        name: 'AI Product',
        title: 'Design System & Especificações',
        department: 'Produto & Design',
        status: 'idle',
        currentTask: 'Aguardando entrega de requisitos para fechamento de spec',
        tokensProcessed: 89000,
        costUsd: 0.18,
        lastActivity: 'Há 18 min',
        activeTools: ['platform_ui_inspector', 'flowchart_generator', 'ux_spec'],
        coordinates: [-6, 0.4, -8],
        color: '#ec4899',
        accentColor: '#db2777',
      },
      {
        id: 'agent-coder',
        role: 'coder',
        name: 'AI Coder',
        title: 'Engenharia & Implementação Hexagonal',
        department: 'Desenvolvimento de Software',
        status: 'working',
        currentTask: 'Implementando adaptadores de telemetria e testes unitários',
        currentJobId: 'job-004',
        tokensProcessed: 840200,
        costUsd: 1.68,
        lastActivity: 'Há 30s',
        activeTools: ['ckc_cli', 'git_patch', 'vitest_runner', 'linter_ast'],
        coordinates: [0, 0.4, -9],
        color: '#f59e0b',
        accentColor: '#d97706',
      },
      {
        id: 'agent-qa',
        role: 'qa',
        name: 'AI QA',
        title: 'Testes Adversariais & Segurança',
        department: 'Qualidade & Auditoria',
        status: 'idle',
        currentTask: 'Pronto para revisão adversarial de PRs e auditoria de segurança',
        tokensProcessed: 412000,
        costUsd: 0.82,
        lastActivity: 'Há 1 min',
        activeTools: ['fuzz_tester', 'rbac_verifier', 'security_scanner', 'evidence_collector', 'git_diff_analyzer'],
        coordinates: [6, 0.4, -8],
        color: '#ef4444',
        accentColor: '#dc2626',
      },
      {
        id: 'agent-devops',
        role: 'devops',
        name: 'AI DevOps',
        title: 'CI/CD & Infraestrutura Cloud',
        department: 'Operações & Cloud',
        status: 'waiting_approval',
        currentTask: 'Deploy Staging concluído com sucesso. Aguardando aprovação humana para Produção.',
        currentJobId: 'job-001',
        tokensProcessed: 195400,
        costUsd: 0.39,
        lastActivity: 'Há 4 min',
        activeTools: ['docker_builder', 'k8s_deployer', 'healthcheck_probe', 'rollback_manager'],
        coordinates: [10, 0.4, -2],
        color: '#8b5cf6',
        accentColor: '#7c3aed',
      },
      {
        id: 'agent-support',
        role: 'support',
        name: 'AI Support',
        title: 'Pós-Entrega & Resolução de Incidentes',
        department: 'Suporte & SLA',
        status: 'idle',
        currentTask: 'Todos os sistemas operando normalmente (SLA 99.98%)',
        tokensProcessed: 54000,
        costUsd: 0.11,
        lastActivity: 'Há 45 min',
        activeTools: ['ticket_classifier', 'incident_runbook', 'client_chat'],
        coordinates: [8, 0.4, 6],
        color: '#06b6d4',
        accentColor: '#0891b2',
      },
      {
        id: 'agent-finance',
        role: 'finance',
        name: 'AI Finance / Ops',
        title: 'Controladoria & Conciliação',
        department: 'Finanças & Compliance',
        status: 'working',
        currentTask: 'Conciliando faturas e calculando custo computacional por cliente',
        currentJobId: 'job-005',
        tokensProcessed: 120800,
        costUsd: 0.24,
        lastActivity: 'Há 8 min',
        activeTools: ['billing_reconciliation', 'cash_flow_analyzer', 'dre_reporter'],
        coordinates: [0, 0.4, 8],
        color: '#eab308',
        accentColor: '#ca8a04',
      },
    ];

    const jobs: JobEntity[] = [
      {
        id: 'job-001',
        title: 'Deploy em Produção v1.2.0 (Módulo ASO)',
        client: 'WorkMed Medicina Ocupacional',
        project: 'WorkMed Core',
        stage: 'devops',
        agentRole: 'devops',
        status: 'waiting_approval',
        prompt: 'Promover artefato testado do ambiente STAGING para PRODUCTION após aprovação humana.',
        toolsUsed: ['docker_builder', 'vitest_runner', 'security_scanner', 'k8s_deployer'],
        changesSummary: '4 arquivos modificados, 38 novos testes adicionados, 0 lints pendentes.',
        testsSummary: '52 testes unitários PASS, 14 testes E2E PASS, RBAC audit PASS.',
        evidence: [
          'Relatório Vitest: 66/66 aprovados (100%)',
          'Trivy Security Scan: 0 vulnerabilidades altas/críticas',
          'Isolamento Multitenant testado com 5 tenants sintéticos',
          'Deploy Staging validado em https://staging.workmed.chronokairo.com/health (200 OK)',
          'Plano de rollback automatizado registrado em snapshot-rb-1029',
        ],
        costUsd: 1.42,
        durationSeconds: 312,
        requiresApproval: true,
        approvalGate: {
          id: 'appr-001',
          jobId: 'job-001',
          type: 'production_deploy',
          title: 'Aprovação de Deploy em Produção',
          details: 'O agente DevOps preparou a release v1.2.0. Por política do Control Plane (ADR-0028), agentes nunca realizam deploy em produção sem autorização humana explícita.',
          requestedBy: 'devops',
          requestedAt: 'Há 4 minutos',
          evidence: [
            'STAGING verificado e estável',
            'Relatório QA Adversarial aprovado',
            'Plano de rollback testado',
          ],
          status: 'pending',
        },
        createdAt: 'Hoje às 11:45',
      },
      {
        id: 'job-004',
        title: 'Refactor Hexagonal Ports & Control Plane Hook',
        client: 'Interno',
        project: 'ChronoKairo AI',
        stage: 'coder',
        agentRole: 'coder',
        status: 'in_progress',
        prompt: 'Implementar adapter Three.js puro consumindo porta de telemetria hexagonal.',
        toolsUsed: ['ckc_cli', 'vitest_runner', 'linter_ast'],
        changesSummary: 'src/domain/company.ts e src/infrastructure/ui/CompanyScene3D.tsx criados.',
        testsSummary: 'Typecheck OK, npm run build limpo.',
        evidence: ['TypeScript zero errors', 'Three.js runtime ativo'],
        costUsd: 1.68,
        durationSeconds: 480,
        requiresApproval: false,
        createdAt: 'Hoje às 11:30',
      },
    ];

    const telemetry: CompanyTelemetry = {
      totalJobsCompleted: 142,
      totalCostUsd: 14.86,
      activeAgentsCount: 6,
      pendingApprovalsCount: 1,
      averageCycleTimeMinutes: 14.2,
      handoffsInFlight: 2,
    };

    this.snapshot = { agents, jobs, telemetry };
  }

  async getSnapshot(): Promise<CompanyStateSnapshot> {
    return Promise.resolve(this.snapshot);
  }

  async submitJob(job: JobEntity): Promise<void> {
    const existingIndex = this.snapshot.jobs.findIndex((j) => j.id === job.id);
    if (existingIndex >= 0) {
      this.snapshot.jobs[existingIndex] = job;
    } else {
      this.snapshot.jobs.unshift(job);
    }

    // Update corresponding agent status
    const agent = this.snapshot.agents.find((a) => a.role === job.agentRole);
    if (agent) {
      agent.status = job.status === 'waiting_approval' ? 'waiting_approval' : job.status === 'in_progress' ? 'working' : 'idle';
      agent.currentJobId = job.id;
      if (job.status === 'waiting_approval') {
        agent.currentTask = `${job.title} — Aguardando aprovação humana.`;
      } else {
        agent.currentTask = job.title;
      }
      agent.costUsd += job.costUsd;
    }

    if (job.status === 'waiting_approval') {
      this.snapshot.telemetry.pendingApprovalsCount += 1;
    }

    this.notify();
  }

  async executeJob(jobName: string, _params?: Record<string, any>): Promise<JobEntity> {
    if (jobName === 'commercial.followup') {
      const useCase = new ExecuteCommercialFollowupUseCase(this.leadRepository, this);
      const result = await useCase.execute();
      const job = this.snapshot.jobs.find((j) => j.id === result.jobId);
      if (!job) {
        throw new Error(`Job ${result.jobId} não encontrado após execução de commercial.followup`);
      }
      return job;
    }

    if (jobName === 'qa.review_pr') {
      const useCase = new ExecuteQaPrReviewUseCase(this.prRepository, this);
      const result = await useCase.execute();
      const job = this.snapshot.jobs.find((j) => j.id === result.jobId);
      if (!job) {
        throw new Error(`Job ${result.jobId} não encontrado após execução de qa.review_pr`);
      }
      return job;
    }

    throw new Error(`Job '${jobName}' não reconhecido pelo Control Plane.`);
  }

  async approveJob(approvalId: string, rationale?: string): Promise<void> {
    const job = this.snapshot.jobs.find((j) => j.approvalGate?.id === approvalId);
    if (!job || !job.approvalGate) return;

    job.approvalGate.status = 'approved';
    job.status = 'completed';
    job.evidence.push(
      `Aprovado pelo Diretor Técnico às ${new Date().toLocaleTimeString('pt-BR')}: ${rationale || 'Autorizado pelo Diretor'}`
    );

    // Handle specific gate types
    if (job.approvalGate.type === 'outbound_contact') {
      const drafts = await this.leadRepository.getDraftsByJobId?.(job.id) || [];
      const dispatchTime = new Date().toISOString();
      for (const draft of drafts) {
        await this.leadRepository.updateDraftStatus(draft.id, 'dispatched', dispatchTime);
        await this.leadRepository.updateLeadStatus(draft.leadId, 'in_dialogue', 'Follow-up transmitido com autorização do Diretor.');
      }

      job.evidence.push(
        `Disparo Externo Concluído: Mensagens transmitidas com sucesso aos destinatários autorizados às ${new Date().toLocaleTimeString('pt-BR')}.`
      );

      const commAgent = this.snapshot.agents.find((a) => a.role === 'commercial');
      if (commAgent) {
        commAgent.status = 'working';
        commAgent.currentTask = 'Despachando mensagens de follow-up aprovadas aos destinatários...';
        this.notify();

        setTimeout(() => {
          commAgent.status = 'idle';
          commAgent.currentTask = 'Follow-up de leads despachado com sucesso. Monitorando respostas.';
          this.notify();
        }, 2000);
      }
    } else if (job.approvalGate.type === 'production_deploy') {
      const devopsAgent = this.snapshot.agents.find((a) => a.role === 'devops');
      if (devopsAgent) {
        devopsAgent.status = 'working';
        devopsAgent.currentTask = 'Deploy em Produção executado com sucesso! Monitorando telemetria em tempo real.';
        this.notify();

        setTimeout(() => {
          devopsAgent.status = 'idle';
          devopsAgent.currentTask = 'Infraestrutura saudável e operando normalmente em Produção.';
          this.notify();
        }, 3000);
      }
    }

    this.snapshot.telemetry.pendingApprovalsCount = Math.max(0, this.snapshot.telemetry.pendingApprovalsCount - 1);
    this.snapshot.telemetry.totalJobsCompleted += 1;
    this.notify();
  }

  async rejectJob(approvalId: string, reason: string): Promise<void> {
    const job = this.snapshot.jobs.find((j) => j.approvalGate?.id === approvalId);
    if (!job || !job.approvalGate) return;

    job.approvalGate.status = 'rejected';
    job.status = 'rejected';
    job.evidence.push(`Rejeitado pelo Diretor Técnico às ${new Date().toLocaleTimeString('pt-BR')}: ${reason}`);

    if (job.approvalGate.type === 'outbound_contact') {
      const drafts = await this.leadRepository.getDraftsByJobId?.(job.id) || [];
      for (const draft of drafts) {
        await this.leadRepository.updateDraftStatus(draft.id, 'rejected');
      }
      const commAgent = this.snapshot.agents.find((a) => a.role === 'commercial');
      if (commAgent) {
        commAgent.status = 'idle';
        commAgent.currentTask = `Envio de follow-up rejeitado pelo Diretor: "${reason}". Mensagens canceladas.`;
      }
    } else if (job.approvalGate.type === 'production_deploy') {
      const devopsAgent = this.snapshot.agents.find((a) => a.role === 'devops');
      if (devopsAgent) {
        devopsAgent.status = 'idle';
        devopsAgent.currentTask = `Deploy rejeitado pelo Diretor Técnico: "${reason}". Rollback assegurado.`;
      }
    }

    this.snapshot.telemetry.pendingApprovalsCount = Math.max(0, this.snapshot.telemetry.pendingApprovalsCount - 1);
    this.notify();
  }

  subscribe(callback: (snapshot: CompanyStateSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.snapshot);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.snapshot });
    }
  }
}

export const defaultCompanyControlPlane = new InMemoryCompanyControlPlaneAdapter();
