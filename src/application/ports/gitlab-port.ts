import {
  GitlabActivity,
  GitlabApproval,
  GitlabApprovalState,
  GitlabBoardList,
  GitlabBranch,
  GitlabCommitRef,
  GitlabMergeRequest,
  GitlabMergeRequestDiff,
  GitlabMergeRequestNote,
  GitlabPipeline,
  GitlabPipelineJob,
  GitlabProjectRef,
} from '@/domain/gitlab';

/**
 * Driven port for GitLab, implemented by the `glab` CLI adapter.
 *
 * Capability split: merge requests, CI pipelines, approvals-before-merge,
 * merge gates, conflict detection and project boards are GitLab concepts that
 * have no GitHub counterpart, so they stay here rather than being forced into
 * a shared shape. GitHub capabilities live in `GithubPort`.
 */
export interface GitlabPort {
  /** Identity reported as evidence. Never secrets. */
  getViewer(): Promise<string | null>;

  getProject(path?: string): Promise<GitlabProjectRef>;

  listBranches(path?: string): Promise<GitlabBranch[]>;

  listMergeRequests(options?: GitlabMergeRequestQuery): Promise<GitlabMergeRequest[]>;

  getMergeRequest(iid: number, path?: string): Promise<GitlabMergeRequest | null>;

  /** The actual diff, which is the evidence a review needs. */
  getMergeRequestDiffs(iid: number, path?: string): Promise<GitlabMergeRequestDiff[]>;

  getApprovals(iid: number, path?: string): Promise<GitlabApproval[]>;

  getApprovalState(iid: number, path?: string): Promise<GitlabApprovalState | null>;

  listPipelines(options?: GitlabPipelineQuery): Promise<GitlabPipeline[]>;

  getPipelineJobs(pipelineId: number, path?: string): Promise<GitlabPipelineJob[]>;

  listCommits(options?: GitlabCommitQuery): Promise<GitlabCommitRef[]>;

  /**
   * Forge-native backlog. Empty when the project has no board; the Coder job
   * then reads status from the business database instead.
   */
  listBoards(path?: string): Promise<GitlabBoardList[]>;

  /**
   * Publishes an internal note on a merge request. This is the write path used
   * to deliver the AI QA verdict, and it is the only mutation the port allows.
   */
  createMergeRequestNote(note: GitlabMergeRequestNote, path?: string): Promise<void>;

  /** Aggregates every GitLab capability into a single evidence bundle. */
  collectActivity(taskCodes: string[]): Promise<GitlabActivity>;
}

export interface GitlabMergeRequestQuery {
  state?: 'opened' | 'closed' | 'locked' | 'merged' | 'all';
  limit?: number;
  includeApprovals?: boolean;
  includePipeline?: boolean;
}

export interface GitlabPipelineQuery {
  ref?: string;
  limit?: number;
}

export interface GitlabCommitQuery {
  refName?: string;
  limit?: number;
}