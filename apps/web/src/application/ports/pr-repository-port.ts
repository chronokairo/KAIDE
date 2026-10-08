import { PullRequest, PullRequestReviewReport } from '@/domain/qa';

export interface PullRequestRepositoryPort {
  listOpenPullRequests(): Promise<PullRequest[]>;
  getPullRequestById(id: string): Promise<PullRequest | null>;
  saveReviewReport(report: PullRequestReviewReport): Promise<void>;
  getReports(): Promise<PullRequestReviewReport[]>;
  updatePullRequestStatus(id: string, status: PullRequest['status']): Promise<void>;
}
