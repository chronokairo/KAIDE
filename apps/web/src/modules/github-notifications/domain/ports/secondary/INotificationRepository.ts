import { GitHubNotificationItem } from '../../entities/notification.entity';

// Secondary Port Contract: Persistence / Storage
export interface INotificationRepository {
  getAll(): Promise<GitHubNotificationItem[]>;
  saveAll(items: GitHubNotificationItem[]): Promise<void>;
  getToken(): string;
  saveToken(token: string): void;
  getInitialDataset(): GitHubNotificationItem[];
}
