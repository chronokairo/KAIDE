import { GitLabPort } from '@/application/ports/gitlab-port';
import { CliRunnerPort } from '@/application/ports/cli-runner-port';
import { defaultCliRunner } from '@/infrastructure/cli/node-cli-runner';
import {
  GitLabAuthStatus,
  GitLabBranch,
  GitLabCommit,
  GitLabMergeRequest,
  GitLabMergeRequestChange,
  GitLabNoteInput,
  GitLabPipeline,
  toGitLabMergeRequest,
} from '@/domain/gitlab';
import { extractTaskCodes } from '@/domain/forge';
import { safeJsonParse } from './forge-utils';

export const DEFAULT_GITLAB_REPO = 'chronokairo/ai';

export interface GlabCliGitLabAdapterOptions {
  repo?: string;
  cliRunner?: CliRunnerPort;
  timeoutMs?: number;
}

export class GlabCliGitLabAdapter implements GitLabPort {
  private readonly repo: string;
  private readonly runner: CliRunnerPort;
  private readonly timeoutMs?: number;

  constructor(options: GlabCliGitLabAdapterOptions = {}) {
    this.repo = options.repo ?? DEFAULT_GITLAB_REPO;
    this.runner = options.cliRunner ?? defaultCliRunner;
    this.timeoutMs = options.timeoutMs;
  }

  private encodedRepo(): string {
    return encodeURIComponent(this.repo);
  }

  async getAuthStatus(): Promise<GitLabAuthStatus> {
    const res = await this.runner.exec('glab', ['auth', 'status'], {
      timeoutMs: this.timeoutMs,
    });

    if (!res.ok && !res.stdout.includes('Logged in to')) {
      return {
        authenticated: false,
        account: '',
        host: 'gitlab.com',
      };
    }

    const text = `${res.stdout}\n${res.stderr}`;
    const accountMatch = text.match(/as\s+([A-Za-z0-9_-]+)/i);

    return {
      authenticated: true,
      account: accountMatch?.[1] ?? '',
      host: 'gitlab.com',
    };
  }

  async listBranches(limit = 50): Promise<GitLabBranch[]> {
    const res = await this.runner.exec(
      'glab',
      [
        'api',
        `projects/${this.encodedRepo()}/repository/branches`,
        '--paginate',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, limit).map((b) => ({
      name: b.name ?? '',
      commitSha: b.commit?.id ?? '',
      isDefault: Boolean(b.default),
      taskCodes: extractTaskCodes(b.name ?? ''),
    }));
  }

  async listMergeRequests(
    state: 'opened' | 'closed' | 'merged' | 'all' = 'all',
    limit = 30
  ): Promise<GitLabMergeRequest[]> {
    const args = [
      'mr',
      'list',
      '--repo',
      this.repo,
      '--per-page',
      String(limit),
      '--output',
      'json',
    ];

    if (state === 'all') {
      args.push('--all');
    } else if (state === 'opened') {
      args.push('--opened');
    } else if (state === 'closed') {
      args.push('--closed');
    } else if (state === 'merged') {
      args.push('--merged');
    }

    const res = await this.runner.exec('glab', args, { timeoutMs: this.timeoutMs });
    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => toGitLabMergeRequest(item));
  }

  async getMergeRequest(iid: number): Promise<GitLabMergeRequest | null> {
    const res = await this.runner.exec(
      'glab',
      ['mr', 'view', String(iid), '--repo', this.repo, '--output', 'json'],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return null;

    const parsed = safeJsonParse<any>(res.stdout);
    if (!parsed || (!parsed.id && !parsed.iid)) return null;

    return toGitLabMergeRequest(parsed);
  }

  async listMergeRequestChanges(iid: number): Promise<GitLabMergeRequestChange[]> {
    const res = await this.runner.exec(
      'glab',
      ['api', `projects/${this.encodedRepo()}/merge_requests/${iid}/changes`],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<{ changes?: any[] }>(res.stdout);
    if (!parsed?.changes || !Array.isArray(parsed.changes)) return [];

    return parsed.changes.map((c) => ({
      oldPath: c.old_path ?? '',
      newPath: c.new_path ?? '',
      newFile: Boolean(c.new_file),
      renamedFile: Boolean(c.renamed_file),
      deletedFile: Boolean(c.deleted_file),
    }));
  }

  async getLatestPipeline(ref?: string): Promise<GitLabPipeline | null> {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const res = await this.runner.exec(
      'glab',
      ['api', `projects/${this.encodedRepo()}/pipelines/latest${query}`],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return null;

    const parsed = safeJsonParse<any>(res.stdout);
    if (!parsed || !parsed.id) return null;

    return {
      id: parsed.id,
      status: parsed.status,
      ref: parsed.ref,
      sha: parsed.sha,
      webUrl: parsed.web_url,
    };
  }

  async listCommits(limit = 50): Promise<GitLabCommit[]> {
    const res = await this.runner.exec(
      'glab',
      [
        'api',
        `projects/${this.encodedRepo()}/repository/commits`,
        '--paginate',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, limit).map((commit) => {
      const title = commit.title ?? commit.message?.split('\n')[0] ?? '';
      return {
        id: commit.id ?? '',
        shortId: commit.short_id ?? (commit.id ? commit.id.slice(0, 8) : ''),
        title,
        message: commit.message ?? title,
        authorName: commit.author_name ?? commit.committer_name ?? 'unknown',
        createdAt: commit.created_at ?? commit.committed_date ?? '',
        taskCodes: extractTaskCodes(title),
      };
    });
  }

  async createMergeRequestNote(input: GitLabNoteInput): Promise<void> {
    const res = await this.runner.exec(
      'glab',
      [
        'mr',
        'note',
        String(input.mergeRequestIid),
        '--repo',
        this.repo,
        '--message',
        input.body,
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) {
      throw new Error(
        `Failed to create GitLab MR note on MR !${input.mergeRequestIid}: ${res.error || res.stderr}`
      );
    }
  }
}