/**
 * Pure domain entities and types representing native GitHub capabilities.
 *
 * Hexagonal architecture: pure domain, decoupled from GitHub CLI or REST/GraphQL SDKs.
 */

import { extractTaskCodes } from './forge';

export type GitHubPullRequestState = 'OPEN' | 'CLOSED' | 'MERGED';

export type GitHubReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED';

export type GitHubReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

export interface GitHubPullRequest {
  number: number;
  title: string;
  body?: string;
  state: GitHubPullRequestState;
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  headRefOid?: string;
  author: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewDecision?: GitHubReviewDecision | null;
  filesChanged?: string[];
  taskCodes: string[];
}

export interface GitHubBranch {
  name: string;
  targetOid?: string;
  isDefault: boolean;
  taskCodes: string[];
}

export interface GitHubCommit {
  oid: string;
  message: string;
  author: string;
  committedDate: string;
  taskCodes: string[];
}

export interface GitHubCheckRun {
  name: string;
  status: 'completed' | 'in_progress' | 'queued';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | null;
  detailsUrl?: string;
}

export interface GitHubReviewInput {
  pullRequestNumber: number;
  event: GitHubReviewEvent;
  body: string;
}

export interface GitHubAuthStatus {
  authenticated: boolean;
  account: string;
  host: string;
}

export function toGitHubPullRequest(raw: {
  number: number;
  title?: string;
  body?: string;
  state?: string;
  isDraft?: boolean;
  headRefName?: string;
  baseRefName?: string;
  headRefOid?: string;
  author?: { login?: string } | string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewDecision?: string | null;
  files?: Array<{ path?: string }>;
}): GitHubPullRequest {
  const authorName =
    typeof raw.author === 'object' && raw.author !== null
      ? raw.author.login ?? 'unknown'
      : typeof raw.author === 'string'
        ? raw.author
        : 'unknown';

  const filesChanged = raw.files?.map((f) => f.path ?? '').filter(Boolean);
  const title = raw.title ?? '';
  const headRefName = raw.headRefName ?? '';

  return {
    number: raw.number,
    title,
    body: raw.body,
    state: (raw.state?.toUpperCase() as GitHubPullRequestState) || 'OPEN',
    isDraft: Boolean(raw.isDraft),
    headRefName,
    baseRefName: raw.baseRefName ?? '',
    headRefOid: raw.headRefOid,
    author: authorName,
    url: raw.url ?? '',
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
    reviewDecision: (raw.reviewDecision as GitHubReviewDecision) || null,
    filesChanged,
    taskCodes: extractTaskCodes(`${headRefName} ${title}`),
  };
}