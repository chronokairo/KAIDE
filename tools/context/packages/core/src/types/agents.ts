/**
 * Advanced Agent System Types
 */

export type AgentCapability = 
  | 'code-generation'
  | 'advanced-code-generation'
  | 'code-analysis'
  | 'security-analysis'
  | 'reasoning'
  | 'adaptive-reasoning'
  | 'deep-reasoning'
  | 'execution'
  | 'long-running-execution'
  | 'learning'
  | 'multi-step-reasoning'
  | 'multi-step-problem-solving'
  | 'vulnerability-discovery'
  | 'attack-simulation'
  | 'exploit-chain-analysis'
  | 'restriction-evasion-testing'
  | 'refactoring'
  | 'auto-debugging'
  | 'autonomous-development'
  | 'continuous-autonomous-operation'
  | 'complex-workflow-planning'
  | 'contextual-decision-making'
  | 'dynamic-behavior-adaptation'
  | 'multimodal-analysis'
  | 'diagram-interpretation'
  | 'interdisciplinary-synthesis'
  | 'complex-system-analysis'
  | 'hidden-pattern-discovery'
  | 'auto-task-decomposition'
  | 'iterative-self-optimization'
  | 'long-context-processing'
  | 'advanced-context-memory'
  | 'benchmark-optimization'
  | 'defensive-security-application'
  | 'technical-inconsistency-detection'
  | 'advanced-scientific-analysis';

export type TaskType =
  | 'simple'
  | 'workflow'
  | 'scheduled'
  | 'security-analysis'
  | 'code-generation'
  | 'advanced-code-generation'
  | 'auto-debugging'
  | 'code-refactoring'
  | 'vulnerability-scan'
  | 'attack-simulation'
  | 'multi-step-problem-solving'
  | 'long-running-workflow'
  | 'multimodal-analysis'
  | 'scientific-analysis';

export interface AgentConfig {
  maxConcurrentTasks?: number;
  timeoutMs?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  model?: string; // e.g., 'claude-3-opus', 'gpt-4'
  temperature?: number;
  systemPrompt?: string;
  customTools?: string[];
  securityLevel?: 'low' | 'medium' | 'high';
  reasoningDepth?: 'standard' | 'extended';
  contextWindowBudget?: number;
  autonomyMode?: 'supervised' | 'continuous';
}

export interface ReasoningStep {
  number: number;
  thinking: string;
  decision: string;
  confidence?: number;
  alternatives?: string[];
}

export interface ReasoningContext {
  reasoning: string;
  steps: ReasoningStep[];
  uncertainties: string[];
  confidence: number;
  alternativeApproaches: string[];
  tokensUsed?: number;
  totalTokens?: number;
}

export interface TaskInput {
  description: string;
  context?: Record<string, any>;
  requirements?: string[];
  constraints?: string[];
  expectedOutput?: string;
  deadline?: Date;
}

export interface TaskOutput {
  result: any;
  status: 'success' | 'partial' | 'failed';
  iterations: number;
  reasoning?: ReasoningContext;
  artifacts?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
}

export interface SecurityFinding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string;
  remediation: string[];
  cwe?: string;
  cvss?: number;
}

export interface AttackSimulation {
  id: string;
  target: string;
  attackVector: string;
  steps: Array<{
    step: number;
    description: string;
    method: string;
    result: string;
  }>;
  successRate: number;
  findings: SecurityFinding[];
  recommendations: string[];
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  averageTaskDuration: number;
  averageTokensPerTask: number;
  lastActivityAt: Date;
  uptime: number;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutedAt: Date;
}

export interface PlatformMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  systemHealthScore: number; // 0-100
  avgResponseTime: number;
}
