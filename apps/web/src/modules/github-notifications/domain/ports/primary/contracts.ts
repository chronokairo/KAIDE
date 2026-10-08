import { GitHubNotificationItem, WorkflowDiagnostic, NotificationFilterState } from '../../entities/notification.entity';

// Inbound DTOs (Request / Command Contracts)
export interface SyncGitHubApiCommand {
  token: string;
}

export interface ImportRawTextCommand {
  rawText: string;
}

export interface ToggleUnreadCommand {
  id: string;
}

export interface FilterNotificationsQuery {
  notifications: GitHubNotificationItem[];
  filters: NotificationFilterState;
}

export interface GenerateAiFixPromptRequest {
  notification: GitHubNotificationItem;
}

// Outbound DTOs (Response / Result Contracts)
export interface SyncResult {
  items: GitHubNotificationItem[];
  syncedCount: number;
}

export interface ImportResult {
  importedItems: GitHubNotificationItem[];
  count: number;
}

export interface DiagnosticResult {
  diagnostic: WorkflowDiagnostic;
  aiPrompt: string;
}

export interface BatchTriageSummary {
  totalFailures: number;
  affectedRepositoriesCount: number;
  categorizedGroups: {
    category: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    repos: string[];
    affectedWorkflows: string[];
  }[];
  consolidatedAiPrompt: string;
}

// Primary Port Interface (Driving Contract)
export interface INotificationUseCase {
  getNotifications(): Promise<GitHubNotificationItem[]>;
  saveNotifications(items: GitHubNotificationItem[]): Promise<void>;
  filterNotifications(query: FilterNotificationsQuery): GitHubNotificationItem[];
  importRawText(command: ImportRawTextCommand): Promise<ImportResult>;
  syncWithGitHubApi(command: SyncGitHubApiCommand): Promise<SyncResult>;
  diagnoseNotification(notification: GitHubNotificationItem): DiagnosticResult;
  generateAiFixPrompt(request: GenerateAiFixPromptRequest): string;
  generateBatchTriageSummary(notifications: GitHubNotificationItem[]): BatchTriageSummary;
  toggleUnread(command: ToggleUnreadCommand): Promise<GitHubNotificationItem[]>;
  markAllAsRead(): Promise<GitHubNotificationItem[]>;
  resetToInitial(): Promise<GitHubNotificationItem[]>;
  getSavedToken(): string;
  saveToken(token: string): void;
}
