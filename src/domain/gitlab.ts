/**
 * GitLab-native domain entities.
 *
 * These types mirror GitLab's own vocabulary: merge requests, pipelines,
 * approvals, approvals-before-merge and project boards. They are deliberately
 * not identical to the GitHub types, because the two forges expose genuinely
 * different capabilities and flattening them would lose information.
 *
 * Target: the `chronokairo` GitLab group, project `chronokairo/ai`.
 *
 * Hexagonal architecture: pure domain, no SDK, no process, no I/O.
 */

export interface GitlabProjectRef {
  /** Always `group/name`, for example `chronokairo/ai`. */
  pathWithNamespace: string;
  name: string;
  defaultBranch: string;
  visibility: string;
}

export interface GitlabUser {
  username: string;
  name: string;
}

export interface GitlabCommitRef {
  id: string;
  shortId: string;
  title: string;
  message: string;
  authorName: string;
  authorEmail: string;
  committedDate: string;
}

export interface GitlabBranch {
  name: string;
  commitSha: string;
  taskCodes: string[];
  isDefault: boolean;
  isProtected: boolean;
}

export interface GitlabMergeRequestDiff {
  oldPath: string;
  newPath: string;
  newFile: boolean;
  renamedFile: boolean;
  deletedFile: boolean;
  diff?: string;
}

export interface GitlabApproval {
  id: number;
  approver: string;
  state: 'approved' | 'unapproved' | null;
}

export interface GitlabApprovalState {
  approvalsRequired: number;
  approvalsLeft: number;
  approvedBy: number;
  /** GitLab's own merge gate; when false the MR must not be merged. */
  mergeableWhenPipelineSucceeds: boolean;
  hasApprovalRules: boolean;
}

/** GitLab CI pipeline, the native equivalent of a GitHub Actions workflow run. */
export interface GitlabPipeline {
  id: number;
  iid: number;
  status: 'created' | 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
  source: string;
  ref: string;
  sha: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitlabPipelineJob {
  id: number;
  name: string;
  stage: string;
  status: GitlabPipeline['status'];
  webUrl: string;
}

export type GitlabMrState = 'opened' | 'closed' | 'locked' | 'merged';

export interface GitlabMergeRequest {
  id: number;
  iid: number;
  projectPathWithNamespace: string;
  title: string;
  description: string;
  state: GitlabMrState;
  isDraft: boolean;
  hasConflicts: boolean;
  sourceBranch: string;
  targetBranch: string;
  sha: string;
  author: string;
  changesCount: string | null;
  diffRefsSha: string | null;
  labels: string[];
  milestone: string | null;
  taskCodes: string[];
  upvotes: number;
  downvotes: number;
  approvals: GitlabApproval[];
  approvalState: GitlabApprovalState | null;
  pipeline: GitlabPipeline | null;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
  warnings: string[];
}

/** Payload written back to a merge request as an internal note. */
export interface GitlabMergeRequestNote {
  mergeRequestIid: number;
  body: string;
}

export interface GitlabConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
  references: string[];
  raw: string;
}

/** GitLab project board: the forge-native backlog, when one exists. */
export interface GitlabBoardListColumn {
  id: number;
  label: string;
  position: number;
}

export interface GitlabBoardList {
  id: number;
  name: string;
  columns?: GitlabBoardListColumn[];
  lists?: { id: number; label: string; position: number }[];
}

/** Aggregated view the Coder job uses as evidence for a status proposal. */
export interface GitlabActivity {
  project: GitlabProjectRef;
  branches: GitlabBranch[];
  mergeRequests: GitlabMergeRequest[];
  commits: GitlabCommitRef[];
  boards: GitlabBoardList[];
  authenticatedAccount: string | null;
  collectedAt: string;
  warnings: string[];
}