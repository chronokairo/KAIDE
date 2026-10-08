import { GitHubNotificationItem } from '../../entities/notification.entity';

// Secondary Port Contract: External GitHub API Client
export interface IGitHubApiClientPort {
  fetchNotifications(token: string): Promise<GitHubNotificationItem[]>;
}
