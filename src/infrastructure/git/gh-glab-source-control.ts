import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { SourceControlPort } from '@/application/ports/source-control-port';
import {
  ForgeActivity,
  ForgeAuthStatus,
  ForgeBranch,
  ForgeChangeRequest,
  ForgeCommit,
  ForgeProvider,
  ForgeReviewVerdict,
  ConventionalCommit,
  TaskForgeEvidence,
} from '@/domain/source-control';

const execFileAsync = promisify(execFile);

/**
 * The ChronoKairo organization on GitHub and group on GitLab.
 *
 * Both hosts mirror the same projects, so the Control Plane can cite a single
 * piece of work from either side without duplicating the agent pipeline.
 */
export const CHRONOKAIRO_ORG = 'chronokairo';
export const CHRONOKAIRO_GITLAB_GROUP = 'chronokairo';

/** Canonical project slug on both forges. */
export const DEFAULT_REPO = `${CHRONOKAIRO_ORG}/ai`;

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Matches backlog codes inside arbitrary forge text: branch names, commit
 * subjects and pull request titles.
 *
 * Supported shapes seen in production data:
 *   SECP-01, TSK-4EC62792, AUDIO-ASO-01
 */
const TASK_CODE_PATTERN = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

/**
 * Conventional commit parser. The repository already follows
 * `type(scope): subject`, optionally followed by a `!` and parenthetical
 * references such as `(ADR-0037)`.
 */
const CONVENTIONAL_COMMIT =
  /^(?<type>[a-z]+)(?<breaking>!)?(?:\((?<scope>[^)]+)\))?:\s*(?<subject>.+)$/;

/**
 * Secondary adapter: real GitHub and GitLab access through the `gh` and
 * `glab` command line clients.
 *
 * Design notes:
 *  - arguments are passed as an array to `execFile`, never through a shell,
 *    so repository names and refs cannot inject commands;
 *  - every call is bounded by a timeout and never throws: a missing CLI or an
 *    expired login degrades into a warning on the activity report instead of
 *    breaking the job;
 *  - the returned evidence is what the Coder job attaches to a status
 *    proposal, so every field must be traceable to a forge API response.
 */
export class GhGlabSourceControlAdapter implements SourceControlPort {
  constructor(
    private readonly options: {
      githubRepo?: string;
      gitlabRepo?: string;
      timeoutMs?: number;
    } = {}
  ) {}

  async getAuthStatus(): Promise<ForgeAuthStatus[]> {
    return Promise.all([
      this.authStatusFor('github'),
      this.authStatusFor('gitlab'),
    ]);
  }

  async listBranches(provider: ForgeProvider, limit = 50): Promise<ForgeBranch[]> {
    if (provider === 'github') {
      const raw = await this.run('gh', [
        'api',
        `repos/${this.githubRepo()}/branches`,
        '--paginate',
        `--jq`,
        '.[].name',
      ]);
      const names = this.lines(raw);
      return names.slice(0, limit).map((name) => this.toBranch('github', name));
    }

    const raw = await this.run('glab', [
      'api',
      `projects/${encodeURIComponent(this.gitlabRepo())}/repository/branches`,
      '--paginate',
    ]);
    const parsed = this.json(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, limit).map((branch) => this.toBranch('gitlab', branch.name));
  }

  async listChangeRequests(provider: ForgeProvider, limit = 30): Promise<ForgeChangeRequest[]> {
    if (provider === 'github') {
      const raw = await this.run('gh', [
        'pr',
        'list',
        '--repo',
        this.githubRepo(),
        '--state',
        'all',
        '--limit',
        String(limit),
        '--json',
        'number,title,state,headRefName,baseRefName,author,isDraft,reviewDecision,url,updatedAt',
      ]);
      const parsed = this.json(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((pr) => ({
        provider: 'github' as const,
        id: `gh-${pr.number}`,
        number: pr.number,
        title: pr.title ?? '',
        state: this.mapGhState(pr.state, pr.isDraft),
        headBranch: pr.headRefName ?? '',
        baseBranch: pr.baseRefName ?? '',
        author: pr.author?.login ?? 'unknown',
        isDraft: Boolean(pr.isDraft),
        reviewVerdict: this.mapGhReview(pr.reviewDecision),
        taskCodes: this.extractTaskCodes(`${pr.headRefName ?? ''} ${pr.title ?? ''}`),
        url: pr.url ?? '',
        updatedAt: pr.updatedAt ?? '',
      }));
    }

    const raw = await this.run('glab', [
      'mr',
      'list',
      '--repo',
      this.gitlabRepo(),
      '--all',
      '--per-page',
      String(limit),
      '--output',
      'json',
    ]);
    const parsed = this.json(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((mr) => ({
      provider: 'gitlab' as const,
      id: `gl-${mr.iid ?? mr.id}`,
      number: Number(mr.iid ?? mr.id ?? 0),
      title: mr.title ?? '',
      state: this.mapGlState(mr.state),
      headBranch: mr.source_branch ?? '',
      baseBranch: mr.target_branch ?? '',
      author: mr.author?.username ?? mr.author?.name ?? 'unknown',
      isDraft: Boolean(mr.draft ?? mr.work_in_progress),
      reviewVerdict: mr.approvals_required === 0 ? 'approved' : 'pending',
      taskCodes: this.extractTaskCodes(`${mr.source_branch ?? ''} ${mr.title ?? ''}`),
      url: mr.web_url ?? '',
      updatedAt: mr.updated_at ?? '',
    }));
  }

  async listCommits(provider: ForgeProvider, limit = 50): Promise<ForgeCommit[]> {
    if (provider === 'github') {
      const raw = await this.run('gh', [
        'api',
        `repos/${this.githubRepo()}/commits`,
        `--jq`,
        '.[].sha',
        '-F',
        `per_page=${limit}`,
      ]);
      return this.lines(raw)
        .slice(0, limit)
        .map((sha) => this.toCommit('github', { sha }));
    }

    const raw = await this.run('glab', [
      'api',
      `projects/${encodeURIComponent(this.gitlabRepo())}/repository/commits`,
      `--paginate`,
    ]);
    const parsed = this.json(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, limit).map((commit) => this.toCommit('gitlab', commit));
  }

  /**
   * Aggregates both forges and binds every artifact to the requested backlog
   * task codes. A task is considered linked only when a branch, change request
   * or commit mentions its code.
   */
  async collectActivity(taskCodes: string[]): Promise<ForgeActivity> {
    const warnings: string[] = [];
    const providers: ForgeProvider[] = ['github', 'gitlab'];

    const results = await Promise.all(
      providers.map(async (provider) => {
        const [branches, changeRequests, commits] = await Promise.all([
          this.safe(() => this.listBranches(provider), [] as ForgeBranch[], warnings, provider, 'branches'),
          this.safe(() => this.listChangeRequests(provider), [] as ForgeChangeRequest[], warnings, provider, 'change requests'),
          this.safe(() => this.listCommits(provider), [] as ForgeCommit[], warnings, provider, 'commits'),
        ]);
        return { provider, branches, changeRequests, commits };
      })
    );

    const branches = results.flatMap((r) => r.branches);
    const changeRequests = results.flatMap((r) => r.changeRequests);
    const commits = results.flatMap((r) => r.commits);
    const authStatus = await this.safe(
      () => this.getAuthStatus(),
      [] as ForgeAuthStatus[],
      warnings,
      'forges',
      'authentication status'
    );

    const taskEvidence: Record<string, TaskForgeEvidence> = {};
    for (const code of taskCodes) {
      const upper = code.toUpperCase();
      const relatedBranches = branches.filter((b) => b.taskCodes.includes(upper));
      const relatedChanges = changeRequests.filter((c) => c.taskCodes.includes(upper));
      const relatedCommits = commits.filter((c) => c.taskCodes.includes(upper));
      const conventionalCommits = relatedCommits
        .map((c) => this.parseConventionalCommit(c.subject))
        .filter((c): c is ConventionalCommit => c !== null);

      taskEvidence[upper] = {
        taskCode: upper,
        branches: relatedBranches.map((b) => `${b.provider}:${b.name}`),
        changeRequests: relatedChanges,
        commits: relatedCommits,
        conventionalCommits,
        isLinked:
          relatedBranches.length > 0 || relatedChanges.length > 0 || relatedCommits.length > 0,
      };
    }

    return {
      providers,
      branches,
      changeRequests,
      commits,
      authStatus,
      taskEvidence,
      collectedAt: new Date().toISOString(),
      warnings,
    };
  }

  private async authStatusFor(provider: ForgeProvider): Promise<ForgeAuthStatus> {
    const cli = provider === 'github' ? 'gh' : 'glab';
    const args = provider === 'github' ? ['auth', 'status'] : ['auth', 'status'];
    const result = await this.exec(cli, args);

    if (!result.ok) {
      return { provider, authenticated: false, account: '', host: provider === 'github' ? 'github.com' : 'gitlab.com' };
    }

    const text = result.stdout;
    const account =
      provider === 'github'
        ? (text.match(/account\s+(\S+)/)?.[1] ?? '')
        : (text.match(/as\s+(\S+)/)?.[1] ?? '');

    return {
      provider,
      authenticated: true,
      account,
      host: provider === 'github' ? 'github.com' : 'gitlab.com',
    };
  }

  private toBranch(provider: ForgeProvider, name: string): ForgeBranch {
    return {
      provider,
      name,
      headSha: '',
      taskCodes: this.extractTaskCodes(name),
      isDefault: name === 'main' || name === 'master',
    };
  }

  private toCommit(provider: ForgeProvider, commit: Record<string, any>): ForgeCommit {
    const subject: string =
      commit.commit?.message?.split('\n')[0] ?? commit.title ?? commit.message ?? '';
    return {
      provider,
      sha: commit.sha ?? commit.id ?? '',
      subject,
      author:
        commit.author?.login ??
        commit.author_name ??
        commit.author?.name ??
        commit.committer_name ??
        'unknown',
      committedAt: commit.commit?.author?.date ?? commit.created_at ?? commit.committed_date ?? '',
      taskCodes: this.extractTaskCodes(subject),
    };
  }

  private mapGhState(state: string, isDraft: boolean): ForgeChangeRequest['state'] {
    if (isDraft) return 'draft';
    if (state === 'MERGED') return 'merged';
    if (state === 'CLOSED') return 'closed';
    return 'open';
  }

  private mapGhReview(decision?: string): ForgeReviewVerdict {
    if (decision === 'APPROVED') return 'approved';
    if (decision === 'CHANGES_REQUESTED') return 'changes_requested';
    if (decision === 'REVIEW_REQUIRED') return 'pending';
    return 'none';
  }

  private mapGlState(state: string): ForgeChangeRequest['state'] {
    const normalized = (state ?? '').toLowerCase();
    if (normalized === 'merged') return 'merged';
    if (normalized === 'closed') return 'closed';
    return 'open';
  }

  /** Extracts backlog codes such as `SECP-01` from any forge text. */
  extractTaskCodes(text: string): string[] {
    const found = text.toUpperCase().match(TASK_CODE_PATTERN) ?? [];
    return [...new Set(found)].filter((code) => !RESERVED_CODES.has(code));
  }

  parseConventionalCommit(subject: string): ConventionalCommit | null {
    const match = CONVENTIONAL_COMMIT.exec(subject.trim());
    if (!match?.groups) return null;
    const { type, scope, subject: parsedSubject } = match.groups;
    return {
      type,
      scope,
      subject: parsedSubject ?? '',
      breaking: match.groups.breaking === '!',
      references: parsedSubject?.match(/\((?:ADR-\d+|[A-Z]+-\d+)\)/g) ?? [],
      raw: subject,
    };
  }

  private async safe<T>(
    fn: () => Promise<T>,
    fallback: T,
    warnings: string[],
    provider: string,
    what: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      warnings.push(`${provider}: could not read ${what} (${detail}). Evidence from this source is partial.`);
      return fallback;
    }
  }

  private githubRepo(): string {
    return this.options.githubRepo ?? DEFAULT_REPO;
  }

  private gitlabRepo(): string {
    return this.options.gitlabRepo ?? `${CHRONOKAIRO_GITLAB_GROUP}/ai`;
  }

  /** Runs a CLI and returns stdout, or an empty string on any failure. */
  private async run(cli: string, args: string[]): Promise<string> {
    const result = await this.exec(cli, args);
    return result.stdout;
  }

  private async exec(
    cli: string,
    args: string[]
  ): Promise<{ ok: boolean; stdout: string; stderr: string; error?: string }> {
    try {
      const { stdout, stderr } = await execFileAsync(cli, args, {
        timeout: this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxBuffer: 8 * 1024 * 1024,
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

  private lines(raw: string): string[] {
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  private json(raw: string): unknown {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
}

/**
 * Prefixes that appear in the code base but are not backlog task codes.
 * Keeping them out prevents the evidence index from filling up with noise.
 */
const RESERVED_CODES = new Set(['ADR-0037', 'ADR-0036', 'ADR-0035']);

export default GhGlabSourceControlAdapter;