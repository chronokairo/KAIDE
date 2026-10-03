/**
 * Driven port for native GitHub operations.
 *
 * Implemented in infrastructure by invoking the authenticated `gh` CLI.
 * Covers read operations for branches, commits, pull requests, files, and checks,
 * as well as authorized write operations for pull request reviews.
 */

import {
  GitHubAuthStatus,
  GitHubBranch,
  GitHubCheckRun,
  GitHubCommit,
  GitHubPullRequest,
  GitHubReviewInput,
} from '@/domain/github';

export interface GitHubPort {
  getAuthStatus(): Promise<GitHubAuthStatus>;
  listBranches(limit?: number): Promise<GitHubBranch[]>;
  listPullRequests(state?: 'open' | 'closed' | 'all', limit?: number): Promise<GitHubPullRequest[]>;
  getPullRequest(number: number): Promise<GitHubPullRequest | null>;
  listPullRequestFiles(number: number): Promise<string[]>;
  listPullRequestChecks(number: number): Promise<GitHubCheckRun[]>;
  listCommits(limit?: number): Promise<GitHubCommit[]>;
  submitPullRequestReview(input: GitHubReviewInput): Promise<void>;
}