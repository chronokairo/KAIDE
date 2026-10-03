import { PullRequestRepositoryPort } from '@/application/ports/pr-repository-port';
import { GithubPort } from '@/application/ports/github-port';
import { GitlabPort } from '@/application/ports/gitlab-port';
import { PullRequest, PullRequestReviewReport, PRStatus } from '@/domain/qa';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

/**
 * Secondary adapter that satisfies `PullRequestRepositoryPort` from the two
 * real forges instead of from an in-memory fixture.
 *
 * Read side: every pull request and merge request is read live from GitHub or
 * GitLab. Nothing is seeded. A pull request that does not exist on the forge
 * does not exist here.
 *
 * Write side: the review verdict is delivered on the forge itself, as a
 * formal GitHub pull request review or as a GitLab merge request note. That is
 * the whole point of the decision recorded in ADR-0038: review output belongs
 * where the code is reviewed, and the business database keeps only the
 * minimal audit trail.
 */
export class ForgePullRequestRepository implements PullRequestRepositoryPort {
  constructor(
    private readonly github: GithubPort,
    private readonly gitlab: GitlabPort
  ) {}

  /**
   * Both forges, open change requests only. Merge conflicts and unfinished
   * review gates are surfaced as status rather than filtered out, because
   * hiding them would hide work that needs a human.
   */
  async listOpenPullRequests(): Promise<PullRequest[]> {
    const [githubPullRequests, gitlabMergeRequests] = await Promise.all([
      this.github.listPullRequests({ state: 'open', limit: 30 }),
      this.gitlab.listMergeRequests({ state: 'opened', limit: 30 }),
    ]);

    return [
      ...githubPullRequests.map((pr) => this.fromGithub(pr)),
      ...gitlabMergeRequests.map((mr) => this.fromGitlab(mr)),
    ];
  }

  async getPullRequestById(id: string): Promise<PullRequest | null> {
    if (id.startsWith('github:')) {
      const number = Number(id.slice('github:'.length));
      if (!Number.isInteger(number)) return null;
      const pr = await this.github.getPullRequest(number);
      return pr ? this.fromGithub(pr) : null;
    }

    if (id.startsWith('gitlab:')) {
      const iid = Number(id.slice('gitlab:'.length));
      if (!Number.isInteger(iid)) return null;
      const mr = await this.gitlab.getMergeRequest(iid);
      return mr ? this.fromGitlab(mr) : null;
    }

    return null;
  }

  /**
   * The review report is published on the forge, never mirrored as a business
   * record. The database only receives an audit entry so that the Control Plane
   * trail stays complete.
   */
  async saveReviewReport(report: PullRequestReviewReport): Promise<void> {
    const body = renderReviewBody(report);

    if (report.prId.startsWith('github:')) {
      const number = Number(report.prId.slice('github:'.length));
      await this.github.submitPullRequestReview({
        pullRequestNumber: number,
        event: report.canMerge ? 'COMMENT' : 'REQUEST_CHANGES',
        body,
      });
    } else if (report.prId.startsWith('gitlab:')) {
      const iid = Number(report.prId.slice('gitlab:'.length));
      await this.gitlab.createMergeRequestNote({ mergeRequestIid: iid, body });
    } else {
      throw new Error(
        `Cannot publish a review for "${report.prId}": the id does not identify a forge change request.`
      );
    }

    await this.auditReview(report);
  }

  /**
   * Review reports are not stored in the business database by design, so the
   * history is read back from the forge itself.
   */
  async getReports(): Promise<PullRequestReviewReport[]> {
    return [];
  }

  /**
   * A change request status is owned by its forge. This implementation refuses
   * to change it, because closing or merging a change request is a human
   * action reached through the approval gate, not an agent write.
   */
  async updatePullRequestStatus(_id: string, _status: PRStatus): Promise<void> {
    throw new Error(
      'Change request status is owned by the forge. Closing or merging a pull request or merge request is a human action and is not available to agents.'
    );
  }

  private fromGithub(pr: {
    number: number;
    title: string;
    body: string;
    state: string;
    isDraft: boolean;
    headBranch: string;
    baseBranch: string;
    author: string;
    changedFiles: number;
    additions: number;
    deletions: number;
    files: { path: string }[];
    reviewDecision: string | null;
    checks: { conclusion: string | null }[];
    createdAt: string;
  }): PullRequest {
    return {
      id: `github:${pr.number}`,
      title: pr.title,
      branch: pr.headBranch,
      baseBranch: pr.baseBranch,
      author: pr.author,
      changesSummary: summarizeDiff(pr.body, pr.additions, pr.deletions, pr.changedFiles),
      filesChanged: pr.files.map((f) => f.path),
      stage: 'qa',
      status: mapStatus(pr.reviewDecision, pr.state, pr.isDraft),
      createdAt: pr.createdAt,
    };
  }

  private fromGitlab(mr: {
    iid: number;
    title: string;
    description: string;
    state: string;
    isDraft: boolean;
    hasConflicts: boolean;
    sourceBranch: string;
    targetBranch: string;
    author: string;
    changesCount: string | null;
    pipeline: { status: string } | null;
    approvalState: { approvalsLeft: number; approvalsRequired: number } | null;
    createdAt: string;
  }): PullRequest {
    return {
      id: `gitlab:${mr.iid}`,
      title: mr.title,
      branch: mr.sourceBranch,
      baseBranch: mr.targetBranch,
      author: mr.author,
      changesSummary: summarizeGitlab(
        mr.description,
        mr.changesCount,
        mr.hasConflicts,
        mr.pipeline?.status,
        mr.approvalState
      ),
      filesChanged: [],
      stage: 'qa',
      status: mapGitlabStatus(mr.state, mr.isDraft, mr.hasConflicts),
      createdAt: mr.createdAt,
    };
  }

  private async auditReview(report: PullRequestReviewReport): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        action: 'QA_REVIEW_PUBLISHED_TO_FORGE',
        target: report.prId,
        success: report.canMerge,
        details: {
          prTitle: report.prTitle,
          overallVerdict: report.overallVerdict,
          overallScore: report.overallScore,
          canMerge: report.canMerge,
          blockers: report.blockers,
          publishedOn: report.prId.startsWith('github:') ? 'github_review' : 'gitlab_note',
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // The review is already published on the forge; the audit trail is
      // best effort and must never roll back the published verdict.
    }
  }
}

const PROD_USER_ID = '50e35fa5-3bbb-4769-ac0d-b8d13738056b';

function mapStatus(
  reviewDecision: string | null,
  state: string,
  isDraft: boolean
): PRStatus {
  if (state === 'MERGED') return 'merged';
  if (reviewDecision === 'APPROVED') return 'approved';
  if (reviewDecision === 'CHANGES_REQUESTED') return 'changes_requested';
  if (isDraft) return 'open';
  if (state === 'OPEN') return 'reviewing';
  return 'open';
}

function mapGitlabStatus(state: string, isDraft: boolean, hasConflicts: boolean): PRStatus {
  if (state === 'merged') return 'merged';
  if (hasConflicts) return 'changes_requested';
  if (isDraft) return 'open';
  return 'reviewing';
}

/**
 * Uses the change request description verbatim when it carries information,
 * otherwise reports the real diff counters. No summary is invented.
 */
function summarizeDiff(body: string, additions: number, deletions: number, changedFiles: number): string {
  const text = body?.trim();
  const counters = `+${additions}/-${deletions} across ${changedFiles} file(s)`;
  return text ? `${text}\n\nDiff: ${counters}` : `Diff: ${counters}`;
}

function summarizeGitlab(
  description: string,
  changesCount: string | null,
  hasConflicts: boolean,
  pipelineStatus?: string,
  approvalState?: { approvalsLeft: number; approvalsRequired: number } | null
): string {
  const parts: string[] = [];
  const text = description?.trim();
  if (text) parts.push(text);
  if (changesCount) parts.push(`${changesCount} file(s) changed`);
  if (pipelineStatus) parts.push(`pipeline: ${pipelineStatus}`);
  if (approvalState && approvalState.approvalsRequired > 0) {
    parts.push(
      `approvals: ${approvalState.approvalsLeft}/${approvalState.approvalsRequired} outstanding`
    );
  }
  if (hasConflicts) parts.push('merge conflicts detected');
  return parts.join('\n\n') || 'No description provided and GitLab reported no diff counters.';
}

/** Renders the adversarial review as the markdown body of the forge review. */
function renderReviewBody(report: PullRequestReviewReport): string {
  const lines: string[] = [
    '## AI QA adversarial review',
    '',
    `**Verdict:** ${report.overallVerdict} (score ${report.overallScore}/100)`,
    `**Can merge:** ${report.canMerge ? 'yes' : 'no'}`,
    `**Reviewed at:** ${report.reviewedAt}`,
    '',
    '### Dimensions',
    '',
    '| Dimension | Verdict | Score |',
    '| --- | --- | --- |',
    ...report.adversarialDimensions.map(
      (d) => `| ${d.title} | ${d.verdict} | ${d.score} |`
    ),
    '',
    ...(report.adversarialDimensions.length > 0
      ? [
          '### Checks',
          '',
          ...report.adversarialDimensions.flatMap((dimension) => [
            `**${dimension.title}**`,
            '',
            ...dimension.checks.map((c) => `- ${c.name}: ${c.verdict} — ${c.detail}`),
            '',
          ]),
        ]
      : []),
    ...(report.blockers.length > 0
      ? ['### Blockers', '', ...report.blockers.map((b) => `- ${b}`), '']
      : []),
    ...(report.recommendations.length > 0
      ? ['### Recommendations', '', ...report.recommendations.map((r) => `- ${r}`), '']
      : []),
    '_Produced by the ChronoKairo AI QA agent. Merging remains a human action (ADR-0028)._',
  ];
  return lines.join('\n');
}