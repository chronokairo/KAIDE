import { SourceControlPort } from '@/application/ports/source-control-port';
import { GitHubPort } from '@/application/ports/github-port';
import { GitLabPort } from '@/application/ports/gitlab-port';
import { GhCliGitHubAdapter } from './gh-cli-github-adapter';
import { GlabCliGitLabAdapter } from './glab-cli-gitlab-adapter';
import {
  ConventionalCommit,
  ForgeActivity,
  ForgeAuthStatus,
  ForgeBranch,
  ForgeChangeRequest,
  ForgeCommit,
  ForgeProvider,
  parseConventionalCommit,
  TaskForgeEvidence,
} from '@/domain/forge';
import { safeFetch } from './forge-utils';

export interface ForgeSourceControlAdapterOptions {
  github?: GitHubPort;
  gitlab?: GitLabPort;
}

/**
 * Unified multi-forge secondary adapter implementing SourceControlPort.
 * Composes specialized GitHubPort and GitLabPort implementations without duplicating logic.
 */
export class ForgeSourceControlAdapter implements SourceControlPort {
  private readonly github: GitHubPort;
  private readonly gitlab: GitLabPort;

  constructor(options: ForgeSourceControlAdapterOptions = {}) {
    this.github = options.github ?? new GhCliGitHubAdapter();
    this.gitlab = options.gitlab ?? new GlabCliGitLabAdapter();
  }

  async getAuthStatus(): Promise<ForgeAuthStatus[]> {
    const [ghAuth, glAuth] = await Promise.all([
      this.github.getAuthStatus(),
      this.gitlab.getAuthStatus(),
    ]);

    return [
      {
        provider: 'github',
        authenticated: ghAuth.authenticated,
        account: ghAuth.account,
        host: ghAuth.host,
      },
      {
        provider: 'gitlab',
        authenticated: glAuth.authenticated,
        account: glAuth.account,
        host: glAuth.host,
      },
    ];
  }

  async listBranches(provider: 'github' | 'gitlab', limit = 50): Promise<ForgeBranch[]> {
    if (provider === 'github') {
      const branches = await this.github.listBranches(limit);
      return branches.map((b) => ({
        provider: 'github',
        name: b.name,
        headSha: b.targetOid ?? '',
        taskCodes: b.taskCodes,
        isDefault: b.isDefault,
      }));
    }

    const branches = await this.gitlab.listBranches(limit);
    return branches.map((b) => ({
      provider: 'gitlab',
      name: b.name,
      headSha: b.commitSha ?? '',
      taskCodes: b.taskCodes,
      isDefault: b.isDefault,
    }));
  }

  async listChangeRequests(
    provider: 'github' | 'gitlab',
    limit = 30
  ): Promise<ForgeChangeRequest[]> {
    if (provider === 'github') {
      const prs = await this.github.listPullRequests('all', limit);
      return prs.map((pr) => {
        let state: ForgeChangeRequest['state'] = 'open';
        if (pr.isDraft) state = 'draft';
        else if (pr.state === 'MERGED') state = 'merged';
        else if (pr.state === 'CLOSED') state = 'closed';

        let reviewVerdict: ForgeChangeRequest['reviewVerdict'] = 'none';
        if (pr.reviewDecision === 'APPROVED') reviewVerdict = 'approved';
        else if (pr.reviewDecision === 'CHANGES_REQUESTED') reviewVerdict = 'changes_requested';
        else if (pr.reviewDecision === 'REVIEW_REQUIRED') reviewVerdict = 'pending';

        return {
          provider: 'github',
          id: `gh-${pr.number}`,
          number: pr.number,
          title: pr.title,
          state,
          headBranch: pr.headRefName,
          baseBranch: pr.baseRefName,
          author: pr.author,
          isDraft: pr.isDraft,
          reviewVerdict,
          taskCodes: pr.taskCodes,
          url: pr.url,
          updatedAt: pr.updatedAt,
        };
      });
    }

    const mrs = await this.gitlab.listMergeRequests('all', limit);
    return mrs.map((mr) => {
      let state: ForgeChangeRequest['state'] = 'open';
      if (mr.draft) state = 'draft';
      else if (mr.state === 'merged') state = 'merged';
      else if (mr.state === 'closed') state = 'closed';

      return {
        provider: 'gitlab',
        id: `gl-${mr.iid}`,
        number: mr.iid,
        title: mr.title,
        state,
        headBranch: mr.sourceBranch,
        baseBranch: mr.targetBranch,
        author: mr.author,
        isDraft: mr.draft,
        reviewVerdict: mr.approvalsRequired === 0 ? 'approved' : 'pending',
        taskCodes: mr.taskCodes,
        url: mr.webUrl,
        updatedAt: mr.updatedAt,
      };
    });
  }

  async listCommits(provider: 'github' | 'gitlab', limit = 50): Promise<ForgeCommit[]> {
    if (provider === 'github') {
      const commits = await this.github.listCommits(limit);
      return commits.map((c) => ({
        provider: 'github',
        sha: c.oid,
        subject: c.message,
        author: c.author,
        committedAt: c.committedDate,
        taskCodes: c.taskCodes,
      }));
    }

    const commits = await this.gitlab.listCommits(limit);
    return commits.map((c) => ({
      provider: 'gitlab',
      sha: c.id,
      subject: c.title,
      author: c.authorName,
      committedAt: c.createdAt,
      taskCodes: c.taskCodes,
    }));
  }

  async collectActivity(taskCodes: string[]): Promise<ForgeActivity> {
    const warnings: string[] = [];
    const providers: ForgeProvider[] = ['github', 'gitlab'];

    const results = await Promise.all(
      providers.map(async (provider) => {
        const [branches, changeRequests, commits] = await Promise.all([
          safeFetch(
            () => this.listBranches(provider),
            [] as ForgeBranch[],
            warnings,
            `${provider} branches`
          ),
          safeFetch(
            () => this.listChangeRequests(provider),
            [] as ForgeChangeRequest[],
            warnings,
            `${provider} change requests`
          ),
          safeFetch(
            () => this.listCommits(provider),
            [] as ForgeCommit[],
            warnings,
            `${provider} commits`
          ),
        ]);
        return { provider, branches, changeRequests, commits };
      })
    );

    const branches = results.flatMap((r) => r.branches);
    const changeRequests = results.flatMap((r) => r.changeRequests);
    const commits = results.flatMap((r) => r.commits);
    const authStatus = await safeFetch(
      () => this.getAuthStatus(),
      [] as ForgeAuthStatus[],
      warnings,
      'forge authentication'
    );

    const taskEvidence: Record<string, TaskForgeEvidence> = {};
    for (const code of taskCodes) {
      const upper = code.toUpperCase();
      const relatedBranches = branches.filter((b) => b.taskCodes.includes(upper));
      const relatedChanges = changeRequests.filter((c) => c.taskCodes.includes(upper));
      const relatedCommits = commits.filter((c) => c.taskCodes.includes(upper));
      const conventionalCommits = relatedCommits
        .map((c) => parseConventionalCommit(c.subject))
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
}
