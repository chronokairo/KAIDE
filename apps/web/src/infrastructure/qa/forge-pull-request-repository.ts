import { getSupabaseAdmin } from '@/infrastructure/persistence/supabase-admin';
import { PullRequestRepositoryPort } from '@/application/ports/pr-repository-port';
import { GitHubPort } from '@/application/ports/github-port';
import { GhCliGitHubAdapter } from '@/infrastructure/git/gh-cli-github-adapter';
import { PullRequest, PullRequestReviewReport } from '@/domain/qa';
import { PROD_ORGANIZATION_ID } from '@/shared/supabase';

export interface ForgePullRequestRepositoryOptions {
  github?: GitHubPort;
  initialPrs?: PullRequest[];
}

/**
 * Secondary adapter: Forge-backed Pull Request repository.
 * Reads real pull requests directly from the GitHub forge via the GitHubPort CLI adapter.
 * Saves audit records of adversarial reviews to Supabase prod and synchronizes review status.
 */
export class ForgePullRequestRepository implements PullRequestRepositoryPort {
  private readonly github: GitHubPort;
  private readonly reports = new Map<string, PullRequestReviewReport>();
  private readonly statusOverrides = new Map<string, PullRequest['status']>();
  private readonly initialPrs: PullRequest[];

  constructor(options: ForgePullRequestRepositoryOptions = {}) {
    this.github = options.github ?? new GhCliGitHubAdapter();
    this.initialPrs = options.initialPrs ?? [];
  }

  async listOpenPullRequests(): Promise<PullRequest[]> {
    let prs: PullRequest[] = [];

    try {
      const ghPrs = await this.github.listPullRequests('open');
      prs = ghPrs.map((pr) => {
        const id = `PR-${pr.number}`;
        const override = this.statusOverrides.get(id);

        let status: PullRequest['status'] = 'open';
        if (override) {
          status = override;
        } else if (pr.reviewDecision === 'APPROVED') {
          status = 'approved';
        } else if (pr.reviewDecision === 'CHANGES_REQUESTED') {
          status = 'changes_requested';
        }

        return {
          id,
          title: pr.title,
          branch: pr.headRefName,
          baseBranch: pr.baseRefName,
          author: pr.author,
          changesSummary: pr.body || `Pull Request #${pr.number} on ${pr.headRefName}`,
          filesChanged: pr.filesChanged ?? [],
          stage: 'qa',
          status,
          createdAt: pr.createdAt || new Date().toISOString(),
        };
      });
    } catch {
      // In case GitHub CLI is unavailable or unconfigured, fallback is empty
      prs = [];
    }

    // Merge with any injected PRs (e.g. for deterministic testing or offline staging)
    for (const init of this.initialPrs) {
      if (!prs.some((p) => p.id === init.id)) {
        const override = this.statusOverrides.get(init.id);
        prs.push({
          ...init,
          status: override ?? init.status,
        });
      }
    }

    return prs;
  }

  async getPullRequestById(id: string): Promise<PullRequest | null> {
    const list = await this.listOpenPullRequests();
    const found = list.find((p) => p.id === id);
    if (found) return found;

    // Try parsing number directly (e.g. PR-104 -> 104)
    const match = id.match(/\d+/);
    if (match) {
      const prNumber = parseInt(match[0], 10);
      try {
        const pr = await this.github.getPullRequest(prNumber);
        if (pr) {
          const override = this.statusOverrides.get(id);
          return {
            id: `PR-${pr.number}`,
            title: pr.title,
            branch: pr.headRefName,
            baseBranch: pr.baseRefName,
            author: pr.author,
            changesSummary: pr.body || `Pull Request #${pr.number}`,
            filesChanged: pr.filesChanged ?? [],
            stage: 'qa',
            status: override ?? (pr.reviewDecision === 'APPROVED' ? 'approved' : 'open'),
            createdAt: pr.createdAt || new Date().toISOString(),
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  async saveReviewReport(report: PullRequestReviewReport): Promise<void> {
    this.reports.set(report.prId, { ...report });

    try {
      await getSupabaseAdmin().from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        action: 'QA_PULL_REQUEST_REVIEW_RECORDED',
        target: `pull_requests/${report.prId}`,
        success: report.overallVerdict === 'PASS',
        details: {
          prId: report.prId,
          prTitle: report.prTitle,
          overallVerdict: report.overallVerdict,
          overallScore: report.overallScore,
          canMerge: report.canMerge,
          blockers: report.blockers,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking telemetry
    }
  }

  async getReports(): Promise<PullRequestReviewReport[]> {
    return Array.from(this.reports.values());
  }

  async updatePullRequestStatus(id: string, status: PullRequest['status']): Promise<void> {
    this.statusOverrides.set(id, status);

    const match = id.match(/\d+/);
    if (match) {
      const prNumber = parseInt(match[0], 10);
      try {
        if (status === 'approved') {
          await this.github.submitPullRequestReview({
            pullRequestNumber: prNumber,
            event: 'APPROVE',
            body: 'Automated adversarial QA audit passed all 4 dimensions (Unit, Integration, Security, Tenant/RBAC).',
          });
        } else if (status === 'changes_requested') {
          await this.github.submitPullRequestReview({
            pullRequestNumber: prNumber,
            event: 'REQUEST_CHANGES',
            body: 'Automated adversarial QA audit failed security/tenant RBAC validation.',
          });
        }
      } catch {
        // Fallback gracefully if repo does not allow self-review or CLI write is disabled
      }
    }
  }
}

export const defaultPullRequestRepository = new ForgePullRequestRepository();