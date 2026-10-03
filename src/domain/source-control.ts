/**
 * Pure domain entities for source control and forge integration.
 *
 * The ChronoKairo organization and group are mirrored on GitHub and GitLab.
 * Both remotes point to the same project:
 *
 *   origin  -> https://github.com/chronokairo/ai.git
 *   gitlab  -> https://gitlab.com/chronokairo/ai.git
 *
 * The AI Coder and AI QA roles read this data through the authenticated
 * `gh` and `glab` command line clients so that every sprint status proposal
 * is backed by a real branch, commit, pull request or merge request instead
 * of by the agent's own claims.
 *
 * Hexagonal architecture: pure domain, no SDK, no process, no I/O.
 */

export type ForgeProvider = 'github' | 'gitlab';

export type ForgeChangeState = 'open' | 'merged' | 'closed' | 'draft';

export type ForgeReviewVerdict = 'approved' | 'changes_requested' | 'pending' | 'none';

/**
 * A branch that carries work in flight on a forge.
 *
 * `taskCodes` holds the backlog codes found in the branch name, which is how
 * a task in `project_tasks` gets bound to a real line of work.
 */
export interface ForgeBranch {
  provider: ForgeProvider;
  name: string;
  headSha: string;
  /** Backlog codes extracted from the branch name, e.g. `SECP-01`. */
  taskCodes: string[];
  isDefault: boolean;
}

/**
 * A pull request (GitHub) or merge request (GitLab), normalized so that the
 * domain never has to branch on the forge.
 */
export interface ForgeChangeRequest {
  provider: ForgeProvider;
  id: string;
  number: number;
  title: string;
  state: ForgeChangeState;
  headBranch: string;
  baseBranch: string;
  author: string;
  isDraft: boolean;
  reviewVerdict: ForgeReviewVerdict;
  taskCodes: string[];
  url: string;
  updatedAt: string;
}

export interface ForgeCommit {
  provider: ForgeProvider;
  sha: string;
  subject: string;
  author: string;
  committedAt: string;
  taskCodes: string[];
}

/**
 * Normalized commit convention. The fork already uses conventional commits
 * with a scoped package prefix, for example:
 *
 *   feat(finance): implement real finance jobs with Supabase prod data (ADR-0037)
 *
 * The Coder job parses it so the change log in the Control Plane stays
 * machine-readable.
 */
export interface ConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
  references: string[];
  raw: string;
}

/** Credentials and identity of the CLIs, reported as evidence. Never secrets. */
export interface ForgeAuthStatus {
  provider: ForgeProvider;
  authenticated: boolean;
  account: string;
  host: string;
}

/** Everything the Control Plane needs to cite as proof for a status change. */
export interface ForgeActivity {
  providers: ForgeProvider[];
  branches: ForgeBranch[];
  changeRequests: ForgeChangeRequest[];
  commits: ForgeCommit[];
  authStatus: ForgeAuthStatus[];
  /** Task code -> evidence that justifies the proposal. */
  taskEvidence: Record<string, TaskForgeEvidence>;
  collectedAt: string;
  /** Set when one or both CLIs were unavailable; evidence is then partial. */
  warnings: string[];
}

/**
 * Real, verifiable evidence bound to a single backlog task. This is the
 * artifact that turns an agent opinion into an auditable fact.
 */
export interface TaskForgeEvidence {
  taskCode: string;
  branches: string[];
  changeRequests: ForgeChangeRequest[];
  commits: ForgeCommit[];
  conventionalCommits: ConventionalCommit[];
  /** True when the task code is referenced by at least one forge artifact. */
  isLinked: boolean;
}

/** Job result shape for the source control adapter contract. */
export interface ForgeLinkageReport {
  activity: ForgeActivity;
  linkedTaskCodes: string[];
  unlinkedTaskCodes: string[];
  totalBranches: number;
  totalChangeRequests: number;
  totalCommits: number;
  generatedAt: string;
}