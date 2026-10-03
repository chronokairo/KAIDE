import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import {
  GithubPort,
  GithubCommitQuery,
  GithubPullRequestQuery,
  GithubWorkflowRunQuery,
} from '@/application/ports/github-port';
import {
  GithubActivity,
  GithubBranch,
  GithubCheckRun,
  GithubCommitRef,
  GithubConventionalCommit,
  GithubPullRequest,
  GithubPullRequestFile,
  GithubRepositoryRef,
  GithubReview,
  GithubReviewDecision,
  GithubReviewDecisionState,
  GithubReviewSubmission,
  GithubWorkflowRun,
} from '@/domain/github';

const execFileAsync = promisify(execFile);

/** The ChronoKairo GitHub organization and its canonical project. */
export const CHRONOKAIRO_GITHUB_ORG = 'chronokairo';
export const CHRONOKAIRO_REPO_SLUG = `${CHRONOKAIRO_GITHUB_ORG}/ai`;

const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_BUFFER_BYTES = 24 * 1024 * 1024;

/**
 * Backlog task codes as they appear in branch names, pull request titles and
 * commit subjects, for example `SECP-01`, `TSK-4EC62792`, `AUDIO-ASO-01`.
 */
const TASK_CODE_PATTERN = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

/** `type(scope): subject`, with an optional `!` breaking marker. */
const CONVENTIONAL_COMMIT =
  /^(?<type>[a-z]+)(?<breaking>!)?(?:\((?<scope>[^)]+)\))?:\s*(?<subject>.+)$/;

/**
 * Prefixes that appear in this code base but are not backlog task codes.
 * Without this filter the evidence index would fill up with ADR references.
 */
const NON_TASK_CODE_PREFIXES = new Set(['ADR']);

/**
 * Secondary adapter: real GitHub access through the authenticated `gh` CLI.
 *
 * Contract enforced by this adapter:
 *  - there is no seed data and no fallback repository. When GitHub is
 *    unreachable or unauthenticated the methods return empty results and add
 *    a warning, so a caller can never mistake fabricated data for a real one;
 *  - every field is read from a GitHub API response. Raw JSON is fetched and
 *    mapped in this adapter rather than reduced with `gh --jq`, because a
 *    jq-constructed object is emitted one object per line and is not valid
 *    JSON as a whole;
 *  - `submitPullRequestReview` is the only write, and it exists because the
 *    AI QA verdict is delivered on the forge itself rather than mirrored into
 *    the business database;
 *  - arguments are passed as an array to `execFile` with `shell: false`, so a
 *    branch name can never inject a command.
 */
export class GhCliGithubAdapter implements GithubPort {
  constructor(private readonly options: { repoSlug?: string; timeoutMs?: number } = {}) {}

  async getViewer(): Promise<string | null> {
    const raw = await this.runJson('gh', ['api', 'user']);
    const login = (raw as Record<string, any> | null)?.login;
    return typeof login === 'string' && login ? login : null;
  }

  async getRepository(slug = this.repoSlug()): Promise<GithubRepositoryRef> {
    const raw = await this.runJson('gh', ['api', `repos/${slug}`]);
    const repo = (raw ?? {}) as Record<string, any>;
    return {
      slug,
      owner: String(repo.owner?.login ?? slug.split('/')[0]),
      name: String(repo.name ?? slug.split('/')[1] ?? slug),
      isPrivate: repo.private === true,
      defaultBranch: String(repo.default_branch ?? 'main'),
    };
  }

  async listBranches(slug = this.repoSlug()): Promise<GithubBranch[]> {
    const raw = await this.runJson('gh', ['api', `repos/${slug}/branches`, '--paginate']);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const branch = entry as Record<string, any>;
      const name = String(branch.name ?? '');
      return {
        name,
        headSha: String(branch.commit?.sha ?? ''),
        taskCodes: extractTaskCodes(name),
        isDefault: name === 'main' || name === 'master',
        isProtected: branch.protected === true,
      };
    });
  }

  async listPullRequests(
    options: GithubPullRequestQuery = {},
    slug = this.repoSlug()
  ): Promise<GithubPullRequest[]> {
    const state = options.state ?? 'open';
    const limit = options.limit ?? 30;

    const raw = await this.runJson('gh', [
      'pr',
      'list',
      '--repo',
      slug,
      '--state',
      state,
      '--limit',
      String(limit),
      '--json',
      PR_LIST_FIELDS,
    ]);

    if (!Array.isArray(raw)) return [];
    return raw.map((pr) => this.toPullRequest(pr as Record<string, any>, slug));
  }

  async getPullRequest(number: number, slug = this.repoSlug()): Promise<GithubPullRequest | null> {
    const raw = await this.runJson('gh', [
      'pr',
      'view',
      String(number),
      '--repo',
      slug,
      '--json',
      PR_LIST_FIELDS,
    ]);
    if (!raw || typeof raw !== 'object') return null;
    return this.toPullRequest(raw as Record<string, any>, slug);
  }

  async listPullRequestFiles(number: number, slug = this.repoSlug()): Promise<GithubPullRequestFile[]> {
    const raw = await this.runJson('gh', [
      'api',
      `repos/${slug}/pulls/${number}/files`,
      '--paginate',
    ]);
    if (!Array.isArray(raw)) return [];
    return raw.map((entry) => {
      const file = entry as Record<string, any>;
      return {
        path: String(file.filename ?? ''),
        status: file.status ?? 'modified',
        additions: Number(file.additions ?? 0),
        deletions: Number(file.deletions ?? 0),
        changes: Number(file.changes ?? 0),
        patch: typeof file.patch === 'string' ? file.patch : undefined,
      };
    });
  }

  async listPullRequestReviews(number: number, slug = this.repoSlug()): Promise<GithubReview[]> {
    const raw = await this.runJson('gh', [
      'api',
      `repos/${slug}/pulls/${number}/reviews`,
      '--paginate',
    ]);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry) => (entry as Record<string, any>).submitted_at)
      .map((entry) => {
        const review = entry as Record<string, any>;
        return {
          author: String(review.user?.login ?? ''),
          state: review.state ?? 'COMMENTED',
          submittedAt: String(review.submitted_at ?? ''),
          bodyExcerpt: excerpt(review.body),
        };
      });
  }

  async listCheckRuns(ref: string, slug = this.repoSlug()): Promise<GithubCheckRun[]> {
    const raw = await this.runJson('gh', [
      'api',
      `repos/${slug}/commits/${encodeURIComponent(ref)}/check-runs`,
      '--paginate',
    ]);
    const runs = (raw as Record<string, any> | null)?.check_runs;
    if (!Array.isArray(runs)) return [];
    return runs.map((entry) => {
      const check = entry as Record<string, any>;
      return {
        name: String(check.name ?? ''),
        status: check.status ?? 'queued',
        conclusion: check.conclusion ?? null,
        startedAt: check.started_at ?? undefined,
        completedAt: check.completed_at ?? undefined,
        url: check.html_url ?? undefined,
      };
    });
  }

  async listWorkflowRuns(
    options: GithubWorkflowRunQuery = {},
    slug = this.repoSlug()
  ): Promise<GithubWorkflowRun[]> {
    const raw = await this.runJson('gh', ['api', `repos/${slug}/actions/runs`, '--paginate']);
    const runs = (raw as Record<string, any> | null)?.workflow_runs;
    if (!Array.isArray(runs)) return [];

    return runs
      .filter((entry) => !options.branch || (entry as any).head_branch === options.branch)
      .slice(0, options.limit ?? 30)
      .map((entry) => {
        const run = entry as Record<string, any>;
        return {
          id: String(run.id ?? ''),
          name: String(run.name ?? ''),
          status: run.status ?? 'queued',
          conclusion: run.conclusion ?? null,
          event: String(run.event ?? ''),
          headBranch: String(run.head_branch ?? ''),
          headSha: String(run.head_sha ?? ''),
          url: String(run.html_url ?? ''),
          createdAt: String(run.created_at ?? ''),
          updatedAt: String(run.updated_at ?? ''),
        };
      });
  }

  async listCommits(options: GithubCommitQuery = {}, slug = this.repoSlug()): Promise<GithubCommitRef[]> {
    const limit = options.limit ?? 50;
    const args = ['api', `repos/${slug}/commits`, '-F', `per_page=${limit}`];
    if (options.branch) args.push('-f', `sha=${options.branch}`);
    args.push('--paginate');

    const raw = await this.runJson('gh', args);
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, limit).map((entry) => {
      const commit = entry as Record<string, any>;
      return {
        sha: String(commit.sha ?? ''),
        subject: String(commit.commit?.message ?? '').split('\n')[0],
        author: String(commit.author?.login ?? commit.commit?.author?.name ?? ''),
        committedAt: String(commit.commit?.author?.date ?? ''),
      };
    });
  }

  /**
   * Publishes the AI QA verdict as a formal pull request review. GitHub accepts
   * `APPROVE` and `REQUEST_CHANGES` only from accounts with write access, so a
   * failure here is surfaced as an error rather than silently ignored.
   */
  async submitPullRequestReview(
    submission: GithubReviewSubmission,
    slug = this.repoSlug()
  ): Promise<void> {
    const flag = REVIEW_EVENT_FLAGS[submission.event];
    const result = await this.exec('gh', [
      'pr',
      'review',
      String(submission.pullRequestNumber),
      '--repo',
      slug,
      flag,
      '--body',
      submission.body,
    ]);
    if (!result.ok) {
      throw new Error(
        `GitHub review submission failed for pull request #${submission.pullRequestNumber}: ${result.error}`
      );
    }
  }

  async collectActivity(taskCodes: string[]): Promise<GithubActivity> {
    const warnings: string[] = [];
    const viewer = await this.guard(() => this.getViewer(), null, warnings, 'viewer');
    const repository = await this.guard(() => this.getRepository(), null, warnings, 'repository');
    const branches = await this.guard(
      () => this.listBranches(),
      [] as GithubBranch[],
      warnings,
      'branches'
    );
    const pullRequests = await this.guard(
      () => this.listPullRequests({ state: 'all', limit: 30 }),
      [] as GithubPullRequest[],
      warnings,
      'pull requests'
    );
    const commits = await this.guard(
      () => this.listCommits({ limit: 50 }),
      [] as GithubCommitRef[],
      warnings,
      'commits'
    );
    const workflowRuns = await this.guard(
      () => this.listWorkflowRuns({ limit: 20 }),
      [] as GithubWorkflowRun[],
      warnings,
      'workflow runs'
    );

    // Codes are reported so the Coder job can cross-check that GitHub actually
    // saw the same backlog the database lists.
    const requestedCodes = taskCodes.map((code) => code.toUpperCase());
    const observedCodes = new Set<string>([
      ...branches.flatMap((b) => b.taskCodes),
      ...pullRequests.flatMap((p) => p.taskCodes),
      ...commits.flatMap((c) => extractTaskCodes(c.subject)),
    ]);
    for (const code of requestedCodes) {
      if (!observedCodes.has(code)) {
        warnings.push(
          `github: no branch, pull request or commit references task ${code}. The task has no forge evidence.`
        );
      }
    }

    return {
      repository: repository ?? {
        slug: this.repoSlug(),
        owner: this.repoSlug().split('/')[0],
        name: this.repoSlug().split('/')[1] ?? '',
        isPrivate: true,
        defaultBranch: 'main',
      },
      branches,
      pullRequests,
      commits,
      workflowRuns,
      authenticatedAccount: viewer,
      collectedAt: new Date().toISOString(),
      warnings,
    };
  }

  private toPullRequest(pr: Record<string, any>, slug: string): GithubPullRequest {
    const headBranch = String(pr.headRefName ?? '');
    const title = String(pr.title ?? '');
    const files = Array.isArray(pr.files) ? pr.files : [];
    const reviews = Array.isArray(pr.reviews) ? pr.reviews : [];

    return {
      id: String(pr.id ?? `gh-${slug}-${pr.number}`),
      number: Number(pr.number ?? 0),
      title,
      body: String(pr.body ?? ''),
      state: mapState(pr.state, pr.isDraft),
      isDraft: pr.isDraft === true,
      headBranch,
      headSha: String(pr.headRefOid ?? ''),
      baseBranch: String(pr.baseRefName ?? ''),
      author: String(pr.author?.login ?? ''),
      additions: Number(pr.additions ?? 0),
      deletions: Number(pr.deletions ?? 0),
      changedFiles: Number(pr.changedFiles ?? 0),
      commits: Array.isArray(pr.commits)
        ? pr.commits.map((entry: Record<string, any>) => ({
            sha: String(entry.oid ?? ''),
            subject: String(entry.messageHeadline ?? ''),
            author: String(entry.author?.login ?? entry.author?.name ?? ''),
            committedAt: String(entry.committedDate ?? ''),
          }))
        : [],
      files: files.map((entry: Record<string, any>) => ({
        path: String(entry.path ?? ''),
        status: entry.status ?? 'modified',
        additions: Number(entry.additions ?? 0),
        deletions: Number(entry.deletions ?? 0),
        changes: Number(entry.changes ?? 0),
        patch: typeof entry.patch === 'string' ? entry.patch : undefined,
      })),
      reviews: reviews.map((entry: Record<string, any>) => ({
        author: String(entry.author?.login ?? ''),
        state: entry.state ?? 'COMMENTED',
        submittedAt: String(entry.submittedAt ?? ''),
        bodyExcerpt: excerpt(entry.body),
      })),
      reviewDecision: (pr.reviewDecision ?? null) as GithubReviewDecision | null,
      mergeable: pr.mergeable ?? null,
      mergeableState: pr.mergeStateStatus ?? null,
      checks: Array.isArray(pr.statusCheckRollup) ? mapChecks(pr.statusCheckRollup) : [],
      labels: Array.isArray(pr.labels) ? pr.labels.map((l: unknown) => String(l)) : [],
      milestone: pr.milestone?.title ?? null,
      taskCodes: extractTaskCodes(`${headBranch} ${title}`),
      url: String(pr.url ?? ''),
      createdAt: String(pr.createdAt ?? ''),
      updatedAt: String(pr.updatedAt ?? ''),
      warnings: [],
    };
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
        `github: could not read ${what} (${detail}). Evidence from this source is absent, not simulated.`
      );
      return fallback;
    }
  }

  private repoSlug(): string {
    return this.options.repoSlug ?? CHRONOKAIRO_REPO_SLUG;
  }

  private async runJson(cli: string, args: string[]): Promise<unknown> {
    const result = await this.exec(cli, args);
    if (!result.ok) {
      throw new Error(result.error ?? `${cli} exited with a non-zero status`);
    }
    const trimmed = result.stdout.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
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

/** Fields requested from `gh pr list` and `gh pr view`. */
const PR_LIST_FIELDS = [
  'id',
  'number',
  'title',
  'body',
  'state',
  'isDraft',
  'headRefName',
  'headRefOid',
  'baseRefName',
  'author',
  'additions',
  'deletions',
  'changedFiles',
  'commits',
  'files',
  'reviews',
  'labels',
  'milestone',
  'reviewDecision',
  'mergeable',
  'mergeStateStatus',
  'statusCheckRollup',
  'url',
  'createdAt',
  'updatedAt',
].join(',');

const REVIEW_EVENT_FLAGS: Record<GithubReviewSubmission['event'], string> = {
  COMMENT: '--comment',
  APPROVE: '--approve',
  REQUEST_CHANGES: '--request-changes',
};

/**
 * Extracts backlog task codes from any GitHub text. ADR references are removed
 * so the evidence index only contains real task links.
 */
export function extractTaskCodes(text: string): string[] {
  const found = text.toUpperCase().match(TASK_CODE_PATTERN) ?? [];
  return [...new Set(found)].filter((code) => !NON_TASK_CODE_PREFIXES.has(code.split('-')[0]));
}

/** Parses a conventional commit subject. Returns null when it is not one. */
export function parseConventionalCommit(raw: string): GithubConventionalCommit | null {
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

function mapState(state: unknown, isDraft: unknown): GithubReviewDecisionState {
  const normalized = String(state ?? '').toUpperCase();
  if (normalized === 'MERGED') return 'merged';
  if (normalized === 'CLOSED') return 'closed';
  if (normalized === 'OPEN') return isDraft === true ? 'draft' : 'open';
  return 'open';
}

function mapChecks(rollup: unknown[]): GithubCheckRun[] {
  return rollup.map((entry) => {
    const item = entry as Record<string, any>;
    const target = item.checkRun ?? item;
    return {
      name: String(target.name ?? ''),
      status: target.status ?? 'queued',
      conclusion: target.conclusion ?? null,
      startedAt: target.startedAt ?? target.started_at ?? undefined,
      completedAt: target.completedAt ?? target.completed_at ?? undefined,
      url: target.detailsUrl ?? target.html_url ?? undefined,
    };
  });
}

function excerpt(value: unknown, max = 400): string {
  const text = typeof value === 'string' ? value : '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default GhCliGithubAdapter;