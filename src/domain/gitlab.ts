/**
 * Pure domain entities and types representing native GitLab capabilities.
 *
 * Hexagonal architecture: pure domain, decoupled from GitLab CLI or REST API clients.
 */

import { extractTaskCodes } from './forge';

export type GitLabMergeRequestState = 'opened' | 'closed' | 'merged' | 'locked';

export type GitLabPipelineStatus =
  | 'running'
  | 'pending'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual';

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: GitLabMergeRequestState;
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  sha?: string;
  author: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
  approvalsRequired?: number;
  taskCodes: string[];
}

export interface GitLabBranch {
  name: string;
  commitSha?: string;
  isDefault: boolean;
  taskCodes: string[];
}

export interface GitLabCommit {
  id: string;
  shortId: string;
  title: string;
  message: string;
  authorName: string;
  createdAt: string;
  taskCodes: string[];
}

export interface GitLabPipeline {
  id: number;
  status: GitLabPipelineStatus;
  ref: string;
  sha: string;
  webUrl?: string;
}

export interface GitLabMergeRequestChange {
  oldPath: string;
  newPath: string;
  newFile: boolean;
  renamedFile: boolean;
  deletedFile: boolean;
}

export interface GitLabNoteInput {
  mergeRequestIid: number;
  body: string;
}

export interface GitLabAuthStatus {
  authenticated: boolean;
  account: string;
  host: string;
}

export function toGitLabMergeRequest(raw: {
  id?: number | string;
  iid?: number | string;
  title?: string;
  description?: string;
  state?: string;
  draft?: boolean;
  work_in_progress?: boolean;
  source_branch?: string;
  target_branch?: string;
  sha?: string;
  author?: { username?: string; name?: string } | string;
  web_url?: string;
  created_at?: string;
  updated_at?: string;
  approvals_required?: number;
}): GitLabMergeRequest {
  const authorName =
    typeof raw.author === 'object' && raw.author !== null
      ? raw.author.username || raw.author.name || 'unknown'
      : typeof raw.author === 'string'
        ? raw.author
        : 'unknown';

  const iidNumber = Number(raw.iid || raw.id || 0);
  const idNumber = Number(raw.id || raw.iid || 0);
  const title = raw.title ?? '';
  const sourceBranch = raw.source_branch ?? '';

  return {
    id: idNumber,
    iid: iidNumber,
    title,
    description: raw.description,
    state: ((raw.state ?? 'opened').toLowerCase() as GitLabMergeRequestState) || 'opened',
    draft: Boolean(raw.draft || raw.work_in_progress),
    sourceBranch,
    targetBranch: raw.target_branch ?? '',
    sha: raw.sha,
    author: authorName,
    webUrl: raw.web_url ?? '',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    approvalsRequired: raw.approvals_required,
    taskCodes: extractTaskCodes(`${sourceBranch} ${title}`),
  };
}