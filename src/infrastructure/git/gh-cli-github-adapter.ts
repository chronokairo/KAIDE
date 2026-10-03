import { GitHubPort } from '@/application/ports/github-port';
import { CliRunnerPort } from '@/application/ports/cli-runner-port';
import { defaultCliRunner } from '@/infrastructure/cli/node-cli-runner';
import {
  GitHubAuthStatus,
  GitHubBranch,
  GitHubCheckRun,
  GitHubCommit,
  GitHubPullRequest,
  GitHubReviewInput,
  toGitHubPullRequest,
} from '@/domain/github';
import { extractTaskCodes } from '@/domain/forge';
import { parseLines, safeJsonParse } from './forge-utils';

export const DEFAULT_GITHUB_REPO = 'chronokairo/ai';

export interface GhCliGitHubAdapterOptions {
  repo?: string;
  cliRunner?: CliRunnerPort;
  timeoutMs?: number;
}

export class GhCliGitHubAdapter implements GitHubPort {
  private readonly repo: string;
  private readonly runner: CliRunnerPort;
  private readonly timeoutMs?: number;

  constructor(options: GhCliGitHubAdapterOptions = {}) {
    this.repo = options.repo ?? DEFAULT_GITHUB_REPO;
    this.runner = options.cliRunner ?? defaultCliRunner;
    this.timeoutMs = options.timeoutMs;
  }

  async getAuthStatus(): Promise<GitHubAuthStatus> {
    const res = await this.runner.exec('gh', ['auth', 'status'], {
      timeoutMs: this.timeoutMs,
    });

    if (!res.ok && !res.stdout.includes('Logged in to')) {
      return {
        authenticated: false,
        account: '',
        host: 'github.com',
      };
    }

    const text = `${res.stdout}\n${res.stderr}`;
    const accountMatch = text.match(/account\s+([A-Za-z0-9_-]+)/i);

    return {
      authenticated: true,
      account: accountMatch?.[1] ?? '',
      host: 'github.com',
    };
  }

  async listBranches(limit = 50): Promise<GitHubBranch[]> {
    const res = await this.runner.exec(
      'gh',
      [
        'api',
        `repos/${this.repo}/branches`,
        '--paginate',
        '--jq',
        '.[].name',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const names = parseLines(res.stdout).slice(0, limit);
    return names.map((name) => ({
      name,
      isDefault: name === 'main' || name === 'master',
      taskCodes: extractTaskCodes(name),
    }));
  }

  async listPullRequests(
    state: 'open' | 'closed' | 'all' = 'all',
    limit = 30
  ): Promise<GitHubPullRequest[]> {
    const res = await this.runner.exec(
      'gh',
      [
        'pr',
        'list',
        '--repo',
        this.repo,
        '--state',
        state,
        '--limit',
        String(limit),
        '--json',
        'number,title,body,state,isDraft,headRefName,baseRefName,headRefOid,author,url,createdAt,updatedAt,reviewDecision,files',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => toGitHubPullRequest(item));
  }

  async getPullRequest(number: number): Promise<GitHubPullRequest | null> {
    const res = await this.runner.exec(
      'gh',
      [
        'pr',
        'view',
        String(number),
        '--repo',
        this.repo,
        '--json',
        'number,title,body,state,isDraft,headRefName,baseRefName,headRefOid,author,url,createdAt,updatedAt,reviewDecision,files',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return null;

    const parsed = safeJsonParse<any>(res.stdout);
    if (!parsed || !parsed.number) return null;

    return toGitHubPullRequest(parsed);
  }

  async listPullRequestFiles(number: number): Promise<string[]> {
    const res = await this.runner.exec(
      'gh',
      [
        'pr',
        'view',
        String(number),
        '--repo',
        this.repo,
        '--json',
        'files',
        '--jq',
        '.files[].path',
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];
    return parseLines(res.stdout);
  }

  async listPullRequestChecks(number: number): Promise<GitHubCheckRun[]> {
    const res = await this.runner.exec(
      'gh',
      ['pr', 'checks', String(number), '--repo', this.repo, '--json', 'name,state,bucket,description,link'],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((check) => {
      const state = (check.state ?? check.bucket ?? '').toLowerCase();
      let status: GitHubCheckRun['status'] = 'completed';
      let conclusion: GitHubCheckRun['conclusion'] = 'success';

      if (state.includes('pending') || state.includes('progress')) {
        status = 'in_progress';
        conclusion = null;
      } else if (state.includes('fail')) {
        conclusion = 'failure';
      } else if (state.includes('cancel')) {
        conclusion = 'cancelled';
      }

      return {
        name: check.name ?? 'check',
        status,
        conclusion,
        detailsUrl: check.link,
      };
    });
  }

  async listCommits(limit = 50): Promise<GitHubCommit[]> {
    const res = await this.runner.exec(
      'gh',
      [
        'api',
        `repos/${this.repo}/commits?per_page=${limit}`,
      ],
      { timeoutMs: this.timeoutMs }
    );

    if (!res.ok) return [];

    const parsed = safeJsonParse<any[]>(res.stdout);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, limit).map((commit) => {
      const message =
        commit.commit?.message?.split('\n')[0] ?? commit.message ?? '';
      return {
        oid: commit.sha ?? '',
        message,
        author: commit.author?.login ?? commit.commit?.author?.name ?? 'unknown',
        committedDate: commit.commit?.author?.date ?? '',
        taskCodes: extractTaskCodes(message),
      };
    });
  }

  async submitPullRequestReview(input: GitHubReviewInput): Promise<void> {
    const flag =
      input.event === 'APPROVE'
        ? '--approve'
        : input.event === 'REQUEST_CHANGES'
          ? '--request-changes'
          : '--comment';

    const args = [
      'pr',
      'review',
      String(input.pullRequestNumber),
      '--repo',
      this.repo,
      flag,
    ];

    if (input.body) {
      args.push('--body', input.body);
    }

    const res = await this.runner.exec('gh', args, {
      timeoutMs: this.timeoutMs,
    });

    if (!res.ok) {
      throw new Error(
        `Failed to submit GitHub PR review on PR #${input.pullRequestNumber}: ${res.error || res.stderr}`
      );
    }
  }
}