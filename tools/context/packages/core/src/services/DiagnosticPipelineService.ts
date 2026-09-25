import { Logger } from '../utils/Logger';
import { Pipeline, PipelinePhase, AgentTask } from '../pipeline';
import { getEventBus } from '../events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Diagnostic Sub-Pipeline Service
 * 
 * Cria automaticamente sub-pipelines de diagnóstico quando:
 * - Uma fase falha
 * - Taxa de erro excede threshold
 * - Performance se degrada
 * - Recursos são insuficientes
 */

export type DiagnosticReason =
  | 'phase-failure'
  | 'high-error-rate'
  | 'performance-degradation'
  | 'resource-exhaustion'
  | 'manual-request';

export interface DiagnosticPipeline extends Pipeline {
  diagnosticReason: DiagnosticReason;
  parentPipelineId: string;
  parentPhaseId?: string;
  diagnosticSteps: string[];
  findings?: string[];
  recommendations?: string[];
}

export class DiagnosticPipelineService {
  private logger = Logger.getInstance();
  private bus = getEventBus('diagnostic-pipeline');
  private diagnosticPipelines: Map<string, DiagnosticPipeline> = new Map();

  /**
   * Criar sub-pipeline de diagnóstico automático
   */
  async createDiagnosticSubPipeline(
    parentPipeline: Pipeline,
    reason: DiagnosticReason,
    context?: {
      phaseId?: string;
      error?: string;
      errorRate?: number;
      metrics?: Record<string, any>;
    }
  ): Promise<DiagnosticPipeline> {
    const diagnosticId = uuidv4();

    this.logger.info('[DiagnosticPipeline] Creating diagnostic sub-pipeline', {
      diagnosticId,
      parentPipelineId: parentPipeline.id,
      reason,
      context,
    });

    // Gerar fases de diagnóstico baseado na razão
    const diagnosticPhases = this.generateDiagnosticPhases(
      parentPipeline,
      reason,
      context
    );

    const diagnosticPipeline: DiagnosticPipeline = {
      id: diagnosticId,
      projectId: parentPipeline.projectId,
      workspace: parentPipeline.workspace,
      objective: `Diagnostic: ${reason} for ${parentPipeline.objective}`,
      status: 'active',
      currentPhase: 0,
      phases: diagnosticPhases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentPipelineId: parentPipeline.id,
      parentPhaseId: context?.phaseId,
      diagnosticReason: reason,
      diagnosticSteps: diagnosticPhases.map(p => p.name),
    };

    this.diagnosticPipelines.set(diagnosticId, diagnosticPipeline);

    await this.bus.emit('diagnostic:pipeline:created', {
      diagnosticId,
      parentPipelineId: parentPipeline.id,
      reason,
      timestamp: new Date().toISOString(),
    });

    return diagnosticPipeline;
  }

  /**
   * Gerar fases de diagnóstico baseado na razão
   */
  private generateDiagnosticPhases(
    parentPipeline: Pipeline,
    reason: DiagnosticReason,
    context?: any
  ): PipelinePhase[] {
    const phases: PipelinePhase[] = [];

    // Fase 1: Análise de contexto
    phases.push({
      id: uuidv4(),
      name: 'Analyze Context',
      order: 1,
      parallel: false,
      requiresApproval: false,
      status: 'pending',
      agents: ['product-manager'],
      tasks: [
        {
          id: uuidv4(),
          agent: 'product-manager',
          title: 'Analyze Problem Context',
          description: `Analyze the root cause of: ${reason}\n${context?.error ? `Error: ${context.error}` : ''}`,
          status: 'pending',
        },
      ],
    });

    // Fase 2: Diagnóstico específico baseado na razão
    if (reason === 'phase-failure') {
      phases.push({
        id: uuidv4(),
        name: 'Debug Failed Phase',
        order: 2,
        parallel: false,
        requiresApproval: false,
        status: 'pending',
        agents: ['architect', 'troubleshooter'],
        tasks: [
          {
            id: uuidv4(),
            agent: 'troubleshooter',
            title: 'Analyze Phase Failure',
            description: `Diagnose why phase ${context?.phaseId} failed and identify root causes`,
            status: 'pending',
          },
          {
            id: uuidv4(),
            agent: 'architect',
            title: 'Propose Recovery Strategy',
            description: 'Design a recovery strategy or alternative approach',
            status: 'pending',
          },
        ],
      });
    } else if (reason === 'high-error-rate') {
      phases.push({
        id: uuidv4(),
        name: 'Investigate Error Rate',
        order: 2,
        parallel: false,
        requiresApproval: false,
        status: 'pending',
        agents: ['qa', 'troubleshooter'],
        tasks: [
          {
            id: uuidv4(),
            agent: 'qa',
            title: 'Analyze Error Patterns',
            description: `Error rate is ${context?.errorRate || 'high'} - identify patterns and categories`,
            status: 'pending',
          },
          {
            id: uuidv4(),
            agent: 'troubleshooter',
            title: 'Trace Error Sources',
            description: 'Trace errors to their sources and identify commonalities',
            status: 'pending',
          },
        ],
      });
    } else if (reason === 'performance-degradation') {
      phases.push({
        id: uuidv4(),
        name: 'Analyze Performance',
        order: 2,
        parallel: false,
        requiresApproval: false,
        status: 'pending',
        agents: ['architect', 'devops'],
        tasks: [
          {
            id: uuidv4(),
            agent: 'architect',
            title: 'Identify Performance Bottlenecks',
            description: 'Identify performance bottlenecks and inefficiencies',
            status: 'pending',
          },
          {
            id: uuidv4(),
            agent: 'devops',
            title: 'Check Resource Usage',
            description: 'Analyze CPU, memory, and I/O usage patterns',
            status: 'pending',
          },
        ],
      });
    } else if (reason === 'resource-exhaustion') {
      phases.push({
        id: uuidv4(),
        name: 'Optimize Resources',
        order: 2,
        parallel: true,
        requiresApproval: false,
        status: 'pending',
        agents: ['devops', 'architect'],
        tasks: [
          {
            id: uuidv4(),
            agent: 'devops',
            title: 'Increase Resource Limits',
            description: 'Increase CPU, memory, or other resource limits',
            status: 'pending',
          },
          {
            id: uuidv4(),
            agent: 'architect',
            title: 'Optimize Usage',
            description: 'Identify ways to reduce resource consumption',
            status: 'pending',
          },
        ],
      });
    }

    // Fase 3: Gerar recomendações
    phases.push({
      id: uuidv4(),
      name: 'Generate Recommendations',
      order: phases.length + 1,
      parallel: false,
      requiresApproval: false,
      status: 'pending',
      agents: ['architect'],
      tasks: [
        {
          id: uuidv4(),
          agent: 'architect',
          title: 'Propose Solutions',
          description: 'Based on findings, propose concrete solutions and next steps',
          status: 'pending',
        },
      ],
    });

    return phases;
  }

  /**
   * Obter sub-pipeline de diagnóstico
   */
  getDiagnosticPipeline(diagnosticId: string): DiagnosticPipeline | undefined {
    return this.diagnosticPipelines.get(diagnosticId);
  }

  /**
   * Listar sub-pipelines de diagnóstico de um pipeline pai
   */
  getChildDiagnosticPipelines(parentPipelineId: string): DiagnosticPipeline[] {
    const children: DiagnosticPipeline[] = [];

    for (const [, pipeline] of this.diagnosticPipelines) {
      if (pipeline.parentPipelineId === parentPipelineId) {
        children.push(pipeline);
      }
    }

    return children;
  }

  /**
   * Atualizar estado de diagnóstico
   */
  async updateDiagnosticStatus(
    diagnosticId: string,
    findings: string[],
    recommendations: string[]
  ): Promise<void> {
    const diagnostic = this.diagnosticPipelines.get(diagnosticId);

    if (!diagnostic) {
      throw new Error(`Diagnostic pipeline not found: ${diagnosticId}`);
    }

    diagnostic.findings = findings;
    diagnostic.recommendations = recommendations;
    diagnostic.status = 'completed';
    diagnostic.completedAt = new Date().toISOString();

    this.logger.info('[DiagnosticPipeline] Diagnostic completed', {
      diagnosticId,
      findingsCount: findings.length,
      recommendationsCount: recommendations.length,
    });

    await this.bus.emit('diagnostic:pipeline:completed', {
      diagnosticId,
      parentPipelineId: diagnostic.parentPipelineId,
      findings,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Aplicar recomendação e retomar pipeline pai
   */
  async applyRecommendationAndResume(
    diagnosticId: string,
    recommendationIndex: number
  ): Promise<void> {
    const diagnostic = this.diagnosticPipelines.get(diagnosticId);

    if (!diagnostic || !diagnostic.recommendations) {
      throw new Error('Diagnostic or recommendations not found');
    }

    const recommendation = diagnostic.recommendations[recommendationIndex];

    this.logger.info('[DiagnosticPipeline] Applying recommendation', {
      diagnosticId,
      recommendation,
      parentPipelineId: diagnostic.parentPipelineId,
    });

    await this.bus.emit('diagnostic:recommendation:applied', {
      diagnosticId,
      parentPipelineId: diagnostic.parentPipelineId,
      recommendation,
      timestamp: new Date().toISOString(),
    });

    // TODO: Resumir pipeline pai na fase apropriada
  }

  /**
   * Obter relatório de diagnóstico
   */
  getDiagnosticReport(diagnosticId: string): {
    reason: DiagnosticReason;
    findings: string[];
    recommendations: string[];
    summary: string;
  } | null {
    const diagnostic = this.diagnosticPipelines.get(diagnosticId);

    if (!diagnostic) {
      return null;
    }

    return {
      reason: diagnostic.diagnosticReason,
      findings: diagnostic.findings || [],
      recommendations: diagnostic.recommendations || [],
      summary: `Diagnostic for ${diagnostic.diagnosticReason}: ${diagnostic.findings?.length || 0} findings, ${diagnostic.recommendations?.length || 0} recommendations`,
    };
  }
}
