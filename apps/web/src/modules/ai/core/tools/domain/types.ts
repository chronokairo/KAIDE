export type AiUserRole = 'owner' | 'admin' | 'operator' | 'viewer' | 'billing';

export interface AiExecutionContext {
  organizationId: string;
  userId: string;
  userRole: AiUserRole;
  sessionId: string;
  permissions: string[];
}

export interface DomainToolMetadata {
  namespace: string;
  domain: 'finance' | 'crm' | 'contracts' | 'projects' | 'timesheet' | 'bi' | 'core';
  sensitivity: 'public' | 'internal' | 'restricted' | 'confidential';
  contractVersion: string;
}

export interface ActionPolicy {
  requiresHumanApproval: boolean;
  requiredPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AiToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  domain: string;
  executionType: 'READ' | 'ACTION';
  requiredRole?: readonly AiUserRole[];
  metadata: DomainToolMetadata;
  policy?: ActionPolicy;
  handler: (input: TInput, ctx: AiExecutionContext) => Promise<TOutput>;
}

export interface AiToolAuditEvent {
  sessionId: string;
  organizationId: string;
  userId: string;
  toolName: string;
  executionType: 'READ' | 'CAPABILITY_PROPOSAL' | 'ACTION_EXECUTION';
  durationMs: number;
  result: 'success' | 'error' | 'denied';
  humanApproval: boolean | null;
  error: string | null;
  timestamp: string;
}

export interface AiToolResult<TData = unknown> {
  toolName: string;
  definitionVersion: string;
  organizationId: string;
  timestamp: string;
  data: TData;
  audit: AiToolAuditEvent;
}
