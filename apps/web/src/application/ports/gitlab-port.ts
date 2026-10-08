/**
 * Driven port for native GitLab operations.
 *
 * Implemented in infrastructure by invoking the authenticated `glab` CLI.
 * Covers read operations for branches, commits, merge requests, changes, and pipelines,
 * as well as authorized write operations for merge request notes.
 */

import {
  GitLabAuthStatus,
  GitLabBranch,
  GitLabCommit,
  GitLabMergeRequest,
  GitLabMergeRequestChange,
  GitLabNoteInput,
  GitLabPipeline,
} from '@/domain/gitlab';

export interface GitLabPort {
  getAuthStatus(): Promise<GitLabAuthStatus>;
  listBranches(limit?: number): Promise<GitLabBranch[]>;
  listMergeRequests(
    state?: 'opened' | 'closed' | 'merged' | 'all',
    limit?: number
  ): Promise<GitLabMergeRequest[]>;
  getMergeRequest(iid: number): Promise<GitLabMergeRequest | null>;
  listMergeRequestChanges(iid: number): Promise<GitLabMergeRequestChange[]>;
  getLatestPipeline(ref?: string): Promise<GitLabPipeline | null>;
  listCommits(limit?: number): Promise<GitLabCommit[]>;
  createMergeRequestNote(input: GitLabNoteInput): Promise<void>;
}