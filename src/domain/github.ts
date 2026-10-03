/**
 * GitHub-native domain entities.
 *
 * These types mirror GitHub's own vocabulary on purpose. Nothing here is
 * normalized against GitLab: the AI QA and AI Coder roles consume the real
 * shape GitHub returns so that no field has to be invented or flattened.
 *
 * Target: the `chronokairo` GitHub organization, project `chronokairo/ai`.
 *
 * Hexagonal architecture: pure domain, no SDK, no process, no I/O.
 */

export interface GithubRepositoryRef {
  /** Always `owner/name`, for example `chronokairo/ai`. */
  slug: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface GithubUser {
  login: string;
  name: string | null;
}

export interface GithubCommitRef {
  sha: string;
  subject: string;
  author: string;
  committedAt: string;
}

/**
 * A branch as GitHub reports it. `headSha` is the commit the branch points at,
 * which is what makes the branch evidence verifiable.
 */
export interface GithubBranch {
  name: string;
  headSha: string;
  /** Backlog codes found in the branch name, used to bind work to a task. */
  taskCodes: string[];
  isDefault: boolean;
  /** True when the branch is protected by a branch protection rule. */
  isProtected: boolean;
  aheadBy?: number;
  behindBy?: number;
}

export interface GithubPullRequestFile {
  path: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed';
  additions: number;
  deletions: number;
  changes: number;
  /** File-level patch, when GitHub returns it. Truncated for large diffs. */
  patch?: string;
}

export type GithubReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED';

export interface GithubReview {
  author: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submittedAt: string;
  bodyExcerpt: string;
}

/** A single CI check as reported by the status rollup. */
export interface GithubCheckRun {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
  startedAt?: string;
  completedAt?: string;
  url?: string;
}

/** GitHub's own pull request requester state. */
export type GithubReviewDecisionState = 'open' | 'draft' | 'approved' | 'changes_requested' | 'merged' | 'closed';

export interface GithubPullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  state: GithubReviewDecisionState;
  isDraft: boolean;
  headBranch: string;
  headSha: string;
  baseBranch: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: GithubCommitRef[];
  files: GithubPullRequestFile[];
  reviews: GithubReview[];
  reviewDecision: GithubReviewDecision | null;
  mergeable: boolean | null;
  mergeableState: string | null;
  checks: GithubCheckRun[];
  labels: string[];
  milestone: string | null;
  taskCodes: string[];
  url: string;
  createdAt: string;
  updatedAt: string;
  /** Set when `files` or `checks` could not be fetched; the report is partial. */
  warnings: string[];
}

/** Payload written back to a pull request as a formal review. */
export interface GithubReviewSubmission {
  pullRequestNumber: number;
  event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';
  body: string;
}

/**
 * Conventional commit, parsed from GitHub's commit message. The repository
 * follows `type(scope): subject`, for example
 * `feat(finance): implement real finance jobs (ADR-0037)`.
 */
export interface GithubConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
  references: string[];
  raw: string;
}

/** Result of a CI workflow run, which AI QA treats as the test evidence. */
export interface GithubWorkflowRun {
  id: string;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  event: string;
  headBranch: string;
  headSha: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

/** Aggregated view the Coder job uses as evidence for a status proposal. */
export interface GithubActivity {
  repository: GithubRepositoryRef;
  branches: GithubBranch[];
  pullRequests: GithubPullRequest[];
  commits: GithubCommitRef[];
  workflowRuns: GithubWorkflowRun[];
  authenticatedAccount: string | null;
  collectedAt: string;
  warnings: string[];
}