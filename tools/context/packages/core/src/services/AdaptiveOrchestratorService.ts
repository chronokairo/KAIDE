import crypto from 'crypto';
import type { AgentCapability } from '../types/agents';

export type ReasoningMode = 'standard' | 'extended';

export interface OrchestratorRequest {
  objective: string;
  constraints?: string[];
  availableModalities?: Array<'text' | 'image'>;
  contextBudgetTokens?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  deadlineMinutes?: number;
}

export interface PlanStep {
  id: string;
  title: string;
  goal: string;
  dependsOn: string[];
  capabilities: AgentCapability[];
  reasoningMode: ReasoningMode;
  timeoutMs: number;
  requiresCheckpoint: boolean;
}

export interface OrchestratorPlan {
  id: string;
  objective: string;
  complexityScore: number;
  reasoningMode: ReasoningMode;
  steps: PlanStep[];
  safetyNotes: string[];
  createdAt: string;
}

export interface OrchestratorPolicy {
  mode: 'defensive' | 'controlled-red-team';
  allowVulnerabilityDiscovery: boolean;
  allowAttackSimulation: boolean;
  allowExploitChaining: boolean;
  allowRestrictionEvasionTesting: boolean;
  requiresHumanApprovalForSensitiveOps: boolean;
  approvedTestScope?: string[];
}

export interface PolicyEvaluation {
  plan: OrchestratorPlan;
  blockedCapabilities: AgentCapability[];
  warnings: string[];
}

export interface ContinuousOperationState {
  runId: string;
  planId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  checkpointEverySteps: number;
  maxRuntimeMs: number;
  startedAt: string;
  lastHeartbeatAt: string;
  completedSteps: string[];
  notes: string[];
}

export interface StepExecutionFeedback {
  success: boolean;
  stepId: string;
  note?: string;
}

const DEFAULT_POLICY: OrchestratorPolicy = {
  mode: 'defensive',
  allowVulnerabilityDiscovery: false,
  allowAttackSimulation: false,
  allowExploitChaining: false,
  allowRestrictionEvasionTesting: false,
  requiresHumanApprovalForSensitiveOps: true,
};

const SENSITIVE_CAPABILITIES: AgentCapability[] = [
  'vulnerability-discovery',
  'attack-simulation',
  'exploit-chain-analysis',
  'restriction-evasion-testing',
];

export class AdaptiveOrchestratorService {
  buildPlan(input: OrchestratorRequest): OrchestratorPlan {
    const complexityScore = this.estimateComplexity(input);
    const reasoningMode: ReasoningMode = complexityScore >= 70 ? 'extended' : 'standard';

    const steps: PlanStep[] = [];
    const discoveryId = crypto.randomUUID();
    const decompositionId = crypto.randomUUID();
    const executionId = crypto.randomUUID();
    const validationId = crypto.randomUUID();
    const optimizationId = crypto.randomUUID();

    steps.push({
      id: discoveryId,
      title: 'Context Discovery',
      goal: 'Collect requirements, constraints and technical context before acting.',
      dependsOn: [],
      capabilities: [
        'adaptive-reasoning',
        'long-context-processing',
        'advanced-context-memory',
        'contextual-decision-making',
      ],
      reasoningMode,
      timeoutMs: this.timeoutForStep(complexityScore, 1),
      requiresCheckpoint: false,
    });

    steps.push({
      id: decompositionId,
      title: 'Task Decomposition',
      goal: 'Break the objective into executable multi-step work packages.',
      dependsOn: [discoveryId],
      capabilities: [
        'deep-reasoning',
        'multi-step-problem-solving',
        'auto-task-decomposition',
        'complex-workflow-planning',
      ],
      reasoningMode,
      timeoutMs: this.timeoutForStep(complexityScore, 2),
      requiresCheckpoint: true,
    });

    const executionCapabilities: AgentCapability[] = [
      'advanced-code-generation',
      'auto-debugging',
      'refactoring',
      'autonomous-development',
      'technical-inconsistency-detection',
      'iterative-self-optimization',
    ];

    if ((input.availableModalities || ['text']).includes('image')) {
      executionCapabilities.push('multimodal-analysis', 'diagram-interpretation');
    }

    if (this.isSecurityObjective(input.objective)) {
      executionCapabilities.push(
        'defensive-security-application',
        'security-analysis',
        'complex-system-analysis',
        'hidden-pattern-discovery'
      );
      // Sensitive capabilities are intentionally added and later filtered by policy.
      executionCapabilities.push(
        'vulnerability-discovery',
        'attack-simulation',
        'exploit-chain-analysis',
        'restriction-evasion-testing'
      );
    }

    steps.push({
      id: executionId,
      title: 'Execution and Diagnostics',
      goal: 'Execute implementation, debug failures and adapt behavior dynamically.',
      dependsOn: [decompositionId],
      capabilities: executionCapabilities,
      reasoningMode,
      timeoutMs: this.timeoutForStep(complexityScore, 3),
      requiresCheckpoint: true,
    });

    steps.push({
      id: validationId,
      title: 'Validation and Benchmarking',
      goal: 'Validate outcomes, benchmark technical quality and detect inconsistencies.',
      dependsOn: [executionId],
      capabilities: [
        'benchmark-optimization',
        'technical-inconsistency-detection',
        'complex-system-analysis',
      ],
      reasoningMode,
      timeoutMs: this.timeoutForStep(complexityScore, 4),
      requiresCheckpoint: true,
    });

    steps.push({
      id: optimizationId,
      title: 'Continuous Improvement',
      goal: 'Iterate and self-optimize with contextual feedback loops.',
      dependsOn: [validationId],
      capabilities: [
        'continuous-autonomous-operation',
        'dynamic-behavior-adaptation',
        'iterative-self-optimization',
        'interdisciplinary-synthesis',
        'advanced-scientific-analysis',
      ],
      reasoningMode,
      timeoutMs: this.timeoutForStep(complexityScore, 5),
      requiresCheckpoint: true,
    });

    const notes = [
      'Offensive security operations remain disabled by default and require controlled policy override.',
      'Long-running operations use checkpoints to support pause/resume without losing context.',
    ];

    return {
      id: crypto.randomUUID(),
      objective: input.objective,
      complexityScore,
      reasoningMode,
      steps,
      safetyNotes: notes,
      createdAt: new Date().toISOString(),
    };
  }

  enforcePolicy(plan: OrchestratorPlan, policy?: Partial<OrchestratorPolicy>): PolicyEvaluation {
    const merged = { ...DEFAULT_POLICY, ...(policy || {}) };
    const blocked = new Set<AgentCapability>();
    const warnings: string[] = [];

    const sanitizeCapability = (capability: AgentCapability): AgentCapability | null => {
      if (capability === 'vulnerability-discovery' && !merged.allowVulnerabilityDiscovery) {
        blocked.add(capability);
        return null;
      }
      if (capability === 'attack-simulation' && !merged.allowAttackSimulation) {
        blocked.add(capability);
        return null;
      }
      if (capability === 'exploit-chain-analysis' && !merged.allowExploitChaining) {
        blocked.add(capability);
        return null;
      }
      if (capability === 'restriction-evasion-testing' && !merged.allowRestrictionEvasionTesting) {
        blocked.add(capability);
        return null;
      }
      return capability;
    };

    const sanitizedSteps = plan.steps.map((step) => ({
      ...step,
      capabilities: step.capabilities
        .map(sanitizeCapability)
        .filter((c): c is AgentCapability => c !== null),
    }));

    if (merged.mode === 'defensive' && blocked.size > 0) {
      warnings.push('Sensitive offensive capabilities were removed by defensive policy.');
    }

    if (merged.requiresHumanApprovalForSensitiveOps) {
      warnings.push('Human approval is required before enabling sensitive capabilities.');
    }

    if (merged.mode === 'controlled-red-team' && (!merged.approvedTestScope || merged.approvedTestScope.length === 0)) {
      warnings.push('Controlled red-team mode requires an explicit approved test scope.');
    }

    return {
      plan: {
        ...plan,
        steps: sanitizedSteps,
        safetyNotes: [...plan.safetyNotes, ...warnings],
      },
      blockedCapabilities: Array.from(blocked),
      warnings,
    };
  }

  startContinuousOperation(
    plan: OrchestratorPlan,
    opts?: { checkpointEverySteps?: number; maxRuntimeMs?: number }
  ): ContinuousOperationState {
    const now = new Date().toISOString();
    return {
      runId: crypto.randomUUID(),
      planId: plan.id,
      status: 'running',
      currentStep: 0,
      checkpointEverySteps: opts?.checkpointEverySteps ?? 1,
      maxRuntimeMs: opts?.maxRuntimeMs ?? 8 * 60 * 60 * 1000,
      startedAt: now,
      lastHeartbeatAt: now,
      completedSteps: [],
      notes: ['Continuous operation started.'],
    };
  }

  applyStepFeedback(
    state: ContinuousOperationState,
    feedback: StepExecutionFeedback
  ): ContinuousOperationState {
    const next: ContinuousOperationState = {
      ...state,
      lastHeartbeatAt: new Date().toISOString(),
      notes: [...state.notes],
    };

    if (!feedback.success) {
      next.status = 'failed';
      next.notes.push(feedback.note || `Step failed: ${feedback.stepId}`);
      return next;
    }

    if (!next.completedSteps.includes(feedback.stepId)) {
      next.completedSteps.push(feedback.stepId);
      next.currentStep += 1;
    }

    if (feedback.note) {
      next.notes.push(feedback.note);
    }

    if (next.currentStep > 0 && next.currentStep % Math.max(1, next.checkpointEverySteps) === 0) {
      next.notes.push(`Checkpoint reached at step ${next.currentStep}.`);
    }

    return next;
  }

  private timeoutForStep(complexity: number, position: number): number {
    const base = 60_000;
    const multiplier = 1 + complexity / 100;
    return Math.round(base * multiplier * position);
  }

  private estimateComplexity(input: OrchestratorRequest): number {
    const objectiveWeight = Math.min(input.objective.length / 8, 30);
    const constraintsWeight = Math.min((input.constraints?.length || 0) * 6, 24);
    const modalitiesWeight = (input.availableModalities?.length || 1) > 1 ? 12 : 4;
    const contextWeight = input.contextBudgetTokens && input.contextBudgetTokens > 8000 ? 16 : 8;
    const urgencyWeight = this.priorityWeight(input.priority || 'normal');
    const deadlineWeight = input.deadlineMinutes && input.deadlineMinutes < 120 ? 10 : 4;

    return Math.min(100, Math.round(
      objectiveWeight + constraintsWeight + modalitiesWeight + contextWeight + urgencyWeight + deadlineWeight
    ));
  }

  private priorityWeight(priority: NonNullable<OrchestratorRequest['priority']>): number {
    if (priority === 'critical') return 18;
    if (priority === 'high') return 12;
    if (priority === 'normal') return 6;
    return 2;
  }

  private isSecurityObjective(objective: string): boolean {
    const securityTerms = [
      'security',
      'vulnerability',
      'threat',
      'attack',
      'exploit',
      'cve',
      'hardening',
      'pentest',
    ];
    const lower = objective.toLowerCase();
    return securityTerms.some((term) => lower.includes(term));
  }

  static getSensitiveCapabilities(): AgentCapability[] {
    return [...SENSITIVE_CAPABILITIES];
  }
}
