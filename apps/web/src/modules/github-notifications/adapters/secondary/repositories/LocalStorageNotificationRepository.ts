import { INotificationRepository } from '../../../domain/ports/secondary/INotificationRepository';
import { GitHubNotificationItem } from '../../../domain/entities/notification.entity';
import { INITIAL_NOTIFICATIONS } from '../../../data/initial-notifications';

export class LocalStorageNotificationRepository implements INotificationRepository {
  private readonly storageKey = 'chronokairo_github_notifications';
  private readonly tokenKey = 'chronokairo_github_pat';

  public getInitialDataset(): GitHubNotificationItem[] {
    return INITIAL_NOTIFICATIONS;
  }

  public async getAll(): Promise<GitHubNotificationItem[]> {
    if (typeof window === 'undefined') return this.getInitialDataset();
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        await this.saveAll(this.getInitialDataset());
        return this.getInitialDataset();
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.getInitialDataset();
    } catch (err) {
      console.error('[LocalStorageNotificationRepository] Failed to load:', err);
      return this.getInitialDataset();
    }
  }

  public async saveAll(items: GitHubNotificationItem[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (err) {
      console.error('[LocalStorageNotificationRepository] Failed to save:', err);
    }
  }

  public getToken(): string {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(this.tokenKey) || '';
    } catch {
      return '';
    }
  }

  public saveToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.tokenKey, token.trim());
    } catch {}
  }
}
