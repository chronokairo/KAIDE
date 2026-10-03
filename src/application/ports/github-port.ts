import {
  GithubActivity,
  GithubBranch,
  GithubCommitRef,
  GithubPullRequest,
  GithubPullRequestFile,
  GithubCheckRun,
  GithubReview,
  GithubReviewSubmission,
  GithubRepositoryRef,
  GithubWorkflowRun,
} from '@/domain/github';

/**
 * Driven port for GitHub, implemented by the `gh` CLI adapter.
 *
 * Capability split: this port only exposes what GitHub itself offers. GitLab
 * capabilities live in `GitlabPort`. Neither port reaches into the other, and
 * neither performs writes other than the explicit review submission, which is
 * always routed through the human approval gate first.
 */
export interface GithubPort {
  /** Identity and repository coordinates reported as evidence. Never secrets. */
  getViewer(): Promise<string | null>;

  getRepository(slug?: string): Promise<GithubRepositoryRef>;

  listBranches(slug?: string): Promise<GithubBranch[]>;

  listPullRequests(options?: GithubPullRequestQuery): Promise<GithubPullRequest[]>;

  getPullRequest(number: number, slug?: string): Promise<GithubPullRequest | null>;

  listPullRequestFiles(number: number, slug?: string): Promise<GithubPullRequestFile[]>;

  listPullRequestReviews(number: number, slug?: string): Promise<GithubReview[]>;

  listCheckRuns(ref: string, slug?: string): Promise<GithubCheckRun[]>;

  listWorkflowRuns(options?: GithubWorkflowRunQuery): Promise<GithubWorkflowRun[]>;

  listCommits(options?: GithubCommitQuery): Promise<GithubCommitRef[]>;

  /**
   * Publishes a formal pull request review. This is the write path used to
   * deliver the AI QA verdict, and it is the only mutation the port allows.
   */
  submitPullRequestReview(submission: GithubReviewSubmission, slug?: string): Promise<void>;

  /** Aggregates every GitHub capability into a single evidence bundle. */
  collectActivity(taskCodes: string[]): Promise<GithubActivity>;
}

export interface GithubPullRequestQuery {
  state?: 'open' | 'closed' | 'merged' | 'all';
  limit?: number;
  includeFiles?: boolean;
  includeReviews?: boolean;
  includeChecks?: boolean;
}

export interface GithubWorkflowRunQuery {
  branch?: string;
  limit?: number;
}

export interface GithubCommitQuery {
  branch?: string;
  limit?: number;
}