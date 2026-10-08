export type NotificationStatus = 'failed' | 'success' | 'cancelled' | 'in_progress' | 'queued';
export type NotificationReason = 'ci_activity' | 'mention' | 'review_requested' | 'subscribed' | 'manual' | 'security_alert';
export type DiagnosticCategory =
  | 'permissions'
  | 'deprecated_action'
  | 'secrets'
  | 'runtime_version'
  | 'codeql_build'
  | 'dependency_vulnerability'
  | 'timeout_network'
  | 'general';

export interface WorkflowDiagnostic {
  category: DiagnosticCategory;
  categoryLabel: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  rootCause: string;
  suggestedFix: string;
  affectedFile?: string;
  patchCode?: string;
  cliRerunCmd?: string;
  relevantDocsUrl?: string;
}

export interface GitHubNotificationItem {
  id: string;
  repo: string;
  workflowName: string;
  runNumber?: number;
  status: NotificationStatus;
  reason: NotificationReason;
  branch: string;
  eventTitle: string;
  timeAgo: string;
  timestamp: string;
  actor: string;
  unread: boolean;
  htmlUrl?: string;
  workflowPath?: string;
  errorSummary?: string;
  diagnostic?: WorkflowDiagnostic;
}

export interface NotificationFilterState {
  search: string;
  repo: string;
  status: 'all' | 'failed' | 'unread' | 'ci_only';
  reason: string;
}
