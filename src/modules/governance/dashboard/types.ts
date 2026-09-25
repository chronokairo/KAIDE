export type TabType = 
  | 'runtime'       // Plan-Act-Verify Execution & Interactive Agent Runs
  | 'gateway'       // Sessions, Multi-Channel Gateway & Routing (REST/WS/RPC)
  | 'models'        // Model Gateway & Router (Capabilities, Latency, Fallbacks)
  | 'tools'         // Tool Gateway & MCP Server Hub (L0-L4 Risk Matrix)
  | 'policy'        // Deterministic Policy Engine & Permission Broker
  | 'approvals'     // Pending High-Risk Approval Queue
  | 'speclock'      // Spec-Locked Execution & AST Contract Guard
  | 'transactions'  // Transactional Workspace Mutation & Rollback
  | 'verification'  // Multi-Stage Verification Pipeline (Build/Test/Lint/Diff)
  | 'audit'         // Structured Audit Log & Replayable Event Stream
  | 'config';       // Control Plane Config & SecretRef Manager

export type AgentState = 
  | 'INITIALIZED'
  | 'CONTEXT_BUILD'
  | 'PLANNING'
  | 'ACTION_SELECTION'
  | 'POLICY_CHECK'
  | 'APPROVAL_REQUIRED'
  | 'WAITING'
  | 'EXECUTE'
  | 'VERIFY'
  | 'REPAIR'
  | 'COMPLETE'
  | 'ERROR';

export type RiskLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface PlanStep {
  id: string;
  order: number;
  objective: string;
  intendedMutations: string[];
  validationStrategy: string;
  expectedOutcome: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'repaired';
}

export interface SpecLockSymbol {
  name: string;
  kind: 'function' | 'struct' | 'trait' | 'interface' | 'endpoint';
  parameters: Record<string, string>;
  returns: string;
  status: 'locked' | 'matched' | 'drift_detected';
  file: string;
}

export interface SpecLock {
  id: string;
  name: string;
  workspaceId: string;
  targetFiles: string[];
  symbols: SpecLockSymbol[];
  createdAt: string;
  enforced: boolean;
}

export interface MutationOperation {
  id: string;
  path: string;
  type: 'create' | 'modify' | 'delete' | 'patch';
  diff: string;
  specLockCompliant: boolean;
  status: 'staged' | 'committed' | 'rolled_back';
}

export interface MutationTransaction {
  id: string;
  workspaceId: string;
  snapshotId: string;
  runId: string;
  operations: MutationOperation[];
  status: 'active' | 'validating' | 'committed' | 'rolled_back';
  timestamp: string;
}

export interface VerificationStage {
  id: string;
  name: string;
  type: 'spec_check' | 'format' | 'compile' | 'lint' | 'test' | 'diff_analysis' | 'security_scan';
  command: string;
  exitCode?: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  durationMs?: number;
  diagnostics?: string;
}

export interface VerificationPipeline {
  id: string;
  runId: string;
  stages: VerificationStage[];
  status: 'idle' | 'running' | 'passed' | 'failed';
  repairAttempt: number;
  maxRepairCycles: number;
}

export interface ModelCapability {
  id: string;
  name: string;
  provider: 'nvidia_nim' | 'ollama' | 'openrouter' | 'anthropic' | 'openai' | 'local_llamacpp';
  contextLength: number;
  maxOutputTokens: number;
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  structuredOutput: boolean;
  latencyMs: number;
  costPer1kTokens: number;
  reliabilityScore: number;
  status: 'online' | 'degraded' | 'offline';
  localAvailable: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'fs' | 'shell' | 'git' | 'mcp' | 'network' | 'database' | 'system';
  description: string;
  risk: RiskLevel;
  permissions: string[];
  source: 'native' | 'mcp_server' | 'internal_rpc';
  mcpServerName?: string;
  enabled: boolean;
  inputSchema: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  matchIdentity: string;
  matchTool: string;
  matchRisk: RiskLevel[];
  action: 'ALLOW' | 'REQUIRE_APPROVAL' | 'DENY';
  enabled: boolean;
  order: number;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  agentName: string;
  toolId: string;
  risk: RiskLevel;
  arguments: Record<string, any>;
  justification: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  targetResource: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: string;
  identity: string;
  sessionId: string;
  agentId: string;
  tool?: string;
  resource?: string;
  result: 'ALLOWED' | 'DENIED' | 'APPROVED' | 'SUCCESS' | 'FAILURE' | 'REPAIR';
  details: Record<string, any>;
}

export interface AgentRunBudget {
  maxModelCalls: number;
  modelCallsUsed: number;
  maxToolCalls: number;
  toolCallsUsed: number;
  maxRepairCycles: number;
  repairCyclesUsed: number;
  maxChangedFiles: number;
  changedFilesCount: number;
  maxRuntimeSeconds: number;
  runtimeSecondsUsed: number;
  tokenBudget: number;
  tokensUsed: number;
}

export interface AgentRun {
  id: string;
  sessionId: string;
  agentId: string;
  task: string;
  state: AgentState;
  modelId: string;
  plan: PlanStep[];
  currentStepIndex: number;
  budget: AgentRunBudget;
  verification: VerificationPipeline;
  transactionId?: string;
  approvals: ApprovalRequest[];
  createdAt: string;
  completedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  defaultModel: string;
  fallbackModel: string;
  systemPrompt: string;
  assignedTools: string[];
  permissions: string[];
  isolationBackend: 'local_sandbox' | 'docker_isolated' | 'host_restricted';
}

export interface Session {
  id: string;
  title: string;
  workspacePath: string;
  identity: string;
  createdAt: string;
  activeRunId?: string;
  runs: AgentRun[];
}

export interface ControlPlaneHealth {
  gatewayStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  activeSessions: number;
  activeAgentRuns: number;
  pendingApprovals: number;
  activeTransactions: number;
  connectedMcpServers: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  invariantStatus: 'ALL_PASS' | 'VIOLATION_DETECTED';
}
