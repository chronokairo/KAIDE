import { GitHubNotificationItem, WorkflowDiagnostic } from '../../entities/notification.entity';

// Secondary Port Contract: AI / Rules Diagnostic Engine
export interface IWorkflowDiagnosticEnginePort {
  diagnose(repo: string, workflowName: string, eventTitle: string, branch: string): WorkflowDiagnostic;
  generateFixPrompt(notification: GitHubNotificationItem): string;
  parseRawText(rawText: string): GitHubNotificationItem[];
}
