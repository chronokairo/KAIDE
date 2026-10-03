import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
  GitlabPort,
  GitlabCommitQuery,
  GitlabMergeRequestQuery,
  GitlabPipelineQuery,
} from '@/application/ports/gitlab-port';
import {
  GitlabActivity,
  GitlabApproval,
  GitlabApprovalState,
  GitlabBoardList,
  GitlabBranch,
  GitlabCommitRef,
  GitlabConventionalCommit,
  GitlabMergeRequest,
  GitlabMergeRequestDiff,
  GitlabMergeRequestNote,
  GitlabPipeline,
  GitlabPipelineJob,
  GitlabProjectRef,
} from '@/domain/gitlab';

const execFileAsync = promisify(execFile);

/** The ChronoKairo GitLab group and its canonical project. */
export const CHRONOKAIRO_GITLAB_GROUP = 'chronokairo';
export const CHRONOKAIRO_GITLAB_PROJECT = `${CHRONOKAIRO_GITLAB_GROUP}/ai`;

const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_BUFFER_BYTES = 24 * 1024 * 1024;

/** Backlog task codes, for example `SECP-01` or `TSK-4EC62792`. */
const TASK_CODE_PATTERN = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

/** `type(scope): subject`, with an optional `!` breaking marker. */
const CONVENTIONAL_COMMIT =
  /^(?<type>[a-z]+)(?<breaking>!)?(?:\((?<scope>[^)]+)\))?:\s*(?<subject>.+)$/;

/** Prefixes that are not backlog task codes. */
const NON_TASK_CODE_PREFIXES = new Set(['ADR']);

/**
 * Secondary adapter: real GitLab access through the authenticated `glab` CLI.
 *
 * GitLab capabilities that have no GitHub counterpart and are therefore
 * modelled explicitly: approvals-before-merge, merge gates, CI pipelines and
 * their jobs, conflict detection, diff refs and project boards.
 *
 * Contract enforced by this adapter:
 *  - no seed data. An unreachable or unauthenticated GitLab yields empty
 *    results plus a warning, never simulated data;
 *  - every field comes from a GitLab API response;
 *  - `createMergeRequestNote` is the only write, used to deliver the AI QA
 *    verdict on the forge instead of mirroring it into the business database;
 *  - arguments are passed as an array with `shell: false`.
 */
export class GlabCliGitlabAdapter implements GitlabPort {
  constructor(private readonly options: { projectPath?: string; timeoutMs?: number } = {}) {}

  async getViewer(): Promise<string | null> {
    const result = await this.exec('glab', ['api', 'user']);
    if (!result.ok) return null;
    const parsed = this.parse(result.stdout);
    const username = (parsed as Record<string, any> | null)?.username;
    return typeof username === 'string' && username ? username : null;
  }

  async getProject(path = this.projectPath()): Promise<GitlabProjectRef> {
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}`);
    const project = (raw ?? {}) as Record<string, any>;
    return {
      pathWithNamespace: String(project.path_with_namespace ?? path),
      name: String(project.name ?? path.split('/')[1] ?? path),
      defaultBranch: String(project.default_branch ?? 'main'),
      visibility: String(project.visibility ?? 'private'),
    };
  }

  async listBranches(path = this.projectPath()): Promise<GitlabBranch[]> {
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}/repository/branches`);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const branch = entry as Record<string, any>;
      const name = String(branch.name ?? '');
      return {
        name,
        commitSha: String(branch.commit?.id ?? ''),
        taskCodes: extractTaskCodes(name),
        isDefault: name === 'main' || name === 'master',
        isProtected: branch.protected === true,
      };
    });
  }

  async listMergeRequests(
    options: GitlabMergeRequestQuery = {},
    path = this.projectPath()
  ): Promise<GitlabMergeRequest[]> {
    const state = options.state ?? 'opened';
    const limit = options.limit ?? 30;

    const raw = await this.apiGet(
      `projects/${encodeURIComponent(path)}/merge_requests`,
      state === 'all' ? {} : { state }
    );
    if (!Array.isArray(raw)) return [];

    return raw
      .slice(0, limit)
      .map((entry) => this.toMergeRequest(entry as Record<string, any>, path));
  }

  async getMergeRequest(iid: number, path = this.projectPath()): Promise<GitlabMergeRequest | null> {
    const raw = await this.apiGet(
      `projects/${encodeURIComponent(path)}/merge_requests/${iid}`
    );
    if (!raw || typeof raw !== 'object') return null;
    return this.toMergeRequest(raw as Record<string, any>, path);
  }

  async getMergeRequestDiffs(
    iid: number,
    path = this.projectPath()
  ): Promise<GitlabMergeRequestDiff[]> {
    const raw = await this.apiGet(
      `projects/${encodeURIComponent(path)}/merge_requests/${iid}/diffs`,
      { access_raw_diffs: 'true' }
    );
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const diff = entry as Record<string, any>;
      return {
        oldPath: String(diff.old_path ?? ''),
        newPath: String(diff.new_path ?? ''),
        newFile: diff.new_file === true,
        renamedFile: diff.renamed_file === true,
        deletedFile: diff.deleted_file === true,
        diff: typeof diff.diff === 'string' ? diff.diff : undefined,
      };
    });
  }

  async getApprovals(iid: number, path = this.projectPath()): Promise<GitlabApproval[]> {
    const raw = await this.apiGet(
      `projects/${encodeURIComponent(path)}/merge_requests/${iid}/approvals`
    );
    const approvals = (raw as Record<string, any> | null)?.approvals;
    if (!Array.isArray(approvals)) return [];
    return approvals.map((entry) => {
      const approval = entry as Record<string, any>;
      return {
        id: Number(approval.id ?? 0),
        approver: String(approval.user?.username ?? approval.user?.name ?? ''),
        state: approval.state ?? null,
      };
    });
  }

  async getApprovalState(iid: number, path = this.projectPath()): Promise<GitlabApprovalState | null> {
    const raw = await this.apiGet(
      `projects/${encodeURIComponent(path)}/merge_requests/${iid}/approvals`
    );
    const approvals = (raw as Record<string, any> | null);
    if (!approvals) return null;
    return {
      approvalsRequired: Number(approvals.approvals_required ?? 0),
      approvalsLeft: Number(approvals.approvals_left ?? 0),
      approvedBy: Array.isArray(approvals.approved_by) ? approvals.approved_by.length : 0,
      mergeableWhenPipelineSucceeds: approvals.mergeable_when_pipeline_succeeds !== false,
      hasApprovalRules: Boolean(approvals.approvals_required),
    };
  }

  async listPipelines(
    options: GitlabPipelineQuery = {},
    path = this.projectPath()
  ): Promise<GitlabPipeline[]> {
    const query: Record<string, string> = options.ref ? { ref: options.ref } : {};
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}/pipelines`, query);
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, options.limit ?? 20).map((entry) => {
      const pipeline = entry as Record<string, any>;
      return {
        id: Number(pipeline.id ?? 0),
        iid: Number(pipeline.iid ?? 0),
        status: pipeline.status ?? 'created',
        source: String(pipeline.source ?? ''),
        ref: String(pipeline.ref ?? ''),
        sha: String(pipeline.sha ?? ''),
        webUrl: String(pipeline.web_url ?? ''),
        createdAt: String(pipeline.created_at ?? ''),
        updatedAt: String(pipeline.updated_at ?? ''),
      };
    });
  }

  async getPipelineJobs(pipelineId: number, path = this.projectPath()): Promise<GitlabPipelineJob[]> {
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}/pipelines/${pipelineId}/jobs`);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const job = entry as Record<string, any>;
      return {
        id: Number(job.id ?? 0),
        name: String(job.name ?? ''),
        stage: String(job.stage ?? ''),
        status: job.status ?? 'created',
        webUrl: String(job.web_url ?? ''),
      };
    });
  }

  async listCommits(options: GitlabCommitQuery = {}, path = this.projectPath()): Promise<GitlabCommitRef[]> {
    const query: Record<string, string> = options.refName ? { ref_name: options.refName } : {};
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}/repository/commits`, query);
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, options.limit ?? 50).map((entry) => {
      const commit = entry as Record<string, any>;
      return {
        id: String(commit.id ?? ''),
        shortId: String(commit.short_id ?? ''),
        title: String(commit.title ?? ''),
        message: String(commit.message ?? ''),
        authorName: String(commit.author_name ?? ''),
        authorEmail: String(commit.author_email ?? ''),
        committedDate: String(commit.committed_date ?? ''),
      };
    });
  }

  async listBoards(path = this.projectPath()): Promise<GitlabBoardList[]> {
    const raw = await this.apiGet(`projects/${encodeURIComponent(path)}/boards`);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const board = entry as Record<string, any>;
      return {
        id: Number(board.id ?? 0),
        name: String(board.name ?? ''),
      };
    });
  }

  /**
   * Publishes the AI QA verdict as an internal merge request note. Internal
   * notes do not trigger notification emails, which matches the governance
   * requirement that only the human gate reaches the outside world.
   */
  async createMergeRequestNote(
    note: GitlabMergeRequestNote,
    path = this.projectPath()
  ): Promise<void> {
    const result = await this.exec('glab', [
      'api',
      '--method',
      'POST',
      `-f`,
      `body=${note.body}`,
      `projects/${encodeURIComponent(path)}/merge_requests/${note.mergeRequestIid}/notes`,
    ]);
    if (!result.ok) {
      throw new Error(
        `GitLab note submission failed for merge request !${note.mergeRequestIid}: ${result.error}`
      );
    }
  }

  async collectActivity(taskCodes: string[]): Promise<GitlabActivity> {
    const warnings: string[] = [];
    const viewer = await this.guard(() => this.getViewer(), null, warnings, 'viewer');
    const project = await this.guard(() => this.getProject(), null, warnings, 'project');
    const branches = await this.guard(
      () => this.listBranches(),
      [] as GitlabBranch[],
      warnings,
      'branches'
    );
    const mergeRequests = await this.guard(
      () => this.listMergeRequests({ state: 'all', limit: 30 }),
      [] as GitlabMergeRequest[],
      warnings,
      'merge requests'
    );
    const commits = await this.guard(
      () => this.listCommits({ limit: 50 }),
      [] as GitlabCommitRef[],
      warnings,
      'commits'
    );
    const boards = await this.guard(
      () => this.listBoards(),
      [] as GitlabBoardList[],
      warnings,
      'boards'
    );

    const observedCodes = new Set<string>([
      ...branches.flatMap((b) => b.taskCodes),
      ...mergeRequests.flatMap((mr) => mr.taskCodes),
      ...commits.flatMap((c) => extractTaskCodes(c.title)),
    ]);
    for (const code of taskCodes) {
      const upper = code.toUpperCase();
      if (!observedCodes.has(upper)) {
        warnings.push(
          `gitlab: no branch, merge request or commit references task ${upper}. The task has no forge evidence.`
        );
      }
    }

    if (boards.length === 0) {
      warnings.push(
        'gitlab: the project has no board, so backlog status is read from the business database instead.'
      );
    }

    return {
      project: project ?? {
        pathWithNamespace: this.projectPath(),
        name: this.projectPath().split('/')[1] ?? '',
        defaultBranch: 'main',
        visibility: 'private',
      },
      branches,
      mergeRequests,
      commits,
      boards,
      authenticatedAccount: viewer,
      collectedAt: new Date().toISOString(),
      warnings,
    };
  }

  private toMergeRequest(mr: Record<string, any>, path: string): GitlabMergeRequest {
    const sourceBranch = String(mr.source_branch ?? '');
    const title = String(mr.title ?? '');

    return {
      id: Number(mr.id ?? 0),
      iid: Number(mr.iid ?? 0),
      projectPathWithNamespace: String(mr.references?.full ?? path),
      title,
      description: String(mr.description ?? ''),
      state: mr.state ?? 'opened',
      isDraft: Boolean(mr.draft ?? mr.work_in_progress),
      hasConflicts: mr.has_conflicts === true,
      sourceBranch,
      targetBranch: String(mr.target_branch ?? ''),
      sha: String(mr.sha ?? ''),
      author: String(mr.author?.username ?? mr.author?.name ?? ''),
      changesCount: mr.changes_count === undefined ? null : String(mr.changes_count),
      diffRefsSha: mr.diff_refs?.head_sha ?? null,
      labels: Array.isArray(mr.labels) ? mr.labels.map((l: unknown) => String(l)) : [],
      milestone: mr.milestone?.title ?? null,
      taskCodes: extractTaskCodes(`${sourceBranch} ${title}`),
      upvotes: Number(mr.upvotes ?? 0),
      downvotes: Number(mr.downvotes ?? 0),
      approvals: [],
      approvalState: null,
      pipeline: mr.pipeline
        ? {
            id: Number(mr.pipeline.id ?? 0),
            iid: Number(mr.pipeline.iid ?? 0),
            status: mr.pipeline.status ?? 'created',
            source: String(mr.pipeline.source ?? ''),
            ref: String(mr.pipeline.ref ?? ''),
            sha: String(mr.pipeline.sha ?? ''),
            webUrl: String(mr.pipeline.web_url ?? ''),
            createdAt: String(mr.pipeline.created_at ?? ''),
            updatedAt: String(mr.pipeline.updated_at ?? ''),
          }
        : null,
      webUrl: String(mr.web_url ?? ''),
      createdAt: String(mr.created_at ?? ''),
      updatedAt: String(mr.updated_at ?? ''),
      warnings: [],
    };
  }

  /** Calls the GitLab REST API through `glab api`. */
  private async apiGet(endpoint: string, query: Record<string, string> = {}): Promise<unknown> {
    const args = ['api', endpoint];
    for (const [key, value] of Object.entries(query)) {
      args.push('-f', `${key}=${value}`);
    }
    const result = await this.exec('glab', args);
    if (!result.ok) {
      throw new Error(result.error ?? `glab exited with a non-zero status for ${endpoint}`);
    }
    return this.parse(result.stdout);
  }

  private parse(stdout: string): unknown {
    const trimmed = stdout.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  private async guard<T>(
    fn: () => Promise<T>,
    fallback: T,
    warnings: string[],
    what: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      warnings.push(
        `gitlab: could not read ${what} (${detail}). Evidence from this source is absent, not simulated.`
      );
      return fallback;
    }
  }

  private projectPath(): string {
    return this.options.projectPath ?? CHRONOKAIRO_GITLAB_PROJECT;
  }

  private async exec(
    cli: string,
    args: string[]
  ): Promise<{ ok: boolean; stdout: string; stderr: string; error?: string }> {
    try {
      const { stdout, stderr } = await execFileAsync(cli, args, {
        timeout: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
        windowsHide: true,
        shell: false,
      });
      return { ok: true, stdout: String(stdout), stderr: String(stderr) };
    } catch (error) {
      const stderr =
        error && typeof error === 'object' && 'stderr' in error
          ? String((error as { stderr?: string }).stderr ?? '')
          : '';
      return {
        ok: false,
        stdout: '',
        stderr,
        error: stderr.trim() || (error instanceof Error ? error.message : String(error)),
      };
    }
  }
}

/** Extracts backlog task codes from any GitLab text. */
export function extractTaskCodes(text: string): string[] {
  const found = text.toUpperCase().match(TASK_CODE_PATTERN) ?? [];
  return [...new Set(found)].filter((code) => !NON_TASK_CODE_PREFIXES.has(code.split('-')[0]));
}

/** Parses a conventional commit title. Returns null when it is not one. */
export function parseConventionalCommit(raw: string): GitlabConventionalCommit | null {
  const match = CONVENTIONAL_COMMIT.exec(raw.trim());
  if (!match?.groups) return null;
  const { type, scope, subject } = match.groups;
  return {
    type,
    scope,
    subject: subject ?? '',
    breaking: match.groups.breaking === '!',
    references: subject?.match(/\((?:ADR-\d+|[A-Z]+-\d+)\)/g) ?? [],
    raw,
  };
}

export default GlabCliGitlabAdapter;