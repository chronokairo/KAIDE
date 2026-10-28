/**
 * Pure domain entities and utilities for multi-forge source control integration.
 *
 * Chronokairo mirrors its codebases across both GitHub and GitLab:
 *   - GitHub: https://github.com/chronokairo/kaide.git
 *   - GitLab: https://gitlab.com/chronokairo/kaide.git
 *
 * This domain model unifies task code extraction, conventional commit parsing,
 * and forge-agnostic change request abstractions across both remotes.
 *
 * Hexagonal architecture: pure domain, decoupled from SDKs, child processes, and I/O.
 */

export type ForgeProvider = 'github' | 'gitlab';

export type ForgeChangeState = 'open' | 'merged' | 'closed' | 'draft';

export type ForgeReviewVerdict = 'approved' | 'changes_requested' | 'pending' | 'none';

/**
 * Backlog task code pattern matching standard identifiers such as:
 * SECP-01, TSK-4EC62792, AUDIO-ASO-01
 */
export const TASK_CODE_PATTERN = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

/**
 * Prefixes and identifiers that match the pattern syntax but represent documentation
 * or system artifacts rather than backlog tasks.
 */
export const RESERVED_CODES = new Set([
  'ADR-0038',
  'ADR-0037',
  'ADR-0036',
  'ADR-0035',
  'ADR-0034',
  'ADR-0033',
  'ADR-0032',
  'ADR-0031',
  'ADR-0030',
  'ADR-0029',
  'ADR-0028',
  'ADR-0027',
]);

/**
 * Extracts unique backlog task codes from arbitrary text (branch names, PR titles, commits).
 */
export function extractTaskCodes(text: string): string[] {
  if (!text) return [];
  const found = text.toUpperCase().match(TASK_CODE_PATTERN) ?? [];
  return [...new Set(found)].filter((code) => !RESERVED_CODES.has(code));
}

/**
 * Conventional commit structure.
 * Example: `feat(finance): implement real finance jobs with Supabase prod data (ADR-0037)`
 */
export interface ConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
  references: string[];
  raw: string;
}

const CONVENTIONAL_COMMIT_REGEX =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<subject>.+)$/;

/**
 * Parses a commit subject line into a structured ConventionalCommit, or returns null.
 */
export function parseConventionalCommit(subject: string): ConventionalCommit | null {
  if (!subject) return null;
  const match = CONVENTIONAL_COMMIT_REGEX.exec(subject.trim());
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

/**
 * Represents a branch on a forge repository.
 */
export interface ForgeBranch {
  provider: ForgeProvider;
  name: string;
  headSha: string;
  taskCodes: string[];
  isDefault: boolean;
}

/**
 * Represents a normalized Pull Request (GitHub) or Merge Request (GitLab).
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

/**
 * Represents a commit on a forge repository.
 */
export interface ForgeCommit {
  provider: ForgeProvider;
  sha: string;
  subject: string;
  author: string;
  committedAt: string;
  taskCodes: string[];
}

/**
 * Authentication and identity status for a forge CLI client.
 */
export interface ForgeAuthStatus {
  provider: ForgeProvider;
  authenticated: boolean;
  account: string;
  host: string;
}

/**
 * Verifiable evidence gathered for a specific backlog task code.
 */
export interface TaskForgeEvidence {
  taskCode: string;
  branches: string[];
  changeRequests: ForgeChangeRequest[];
  commits: ForgeCommit[];
  conventionalCommits: ConventionalCommit[];
  isLinked: boolean;
}

/**
 * Aggregated activity across both remotes for the Control Plane.
 */
export interface ForgeActivity {
  providers: ForgeProvider[];
  branches: ForgeBranch[];
  changeRequests: ForgeChangeRequest[];
  commits: ForgeCommit[];
  authStatus: ForgeAuthStatus[];
  taskEvidence: Record<string, TaskForgeEvidence>;
  collectedAt: string;
  warnings: string[];
}

/**
 * Comprehensive linkage report for sprint synchronization.
 */
export interface ForgeLinkageReport {
  activity: ForgeActivity;
  linkedTaskCodes: string[];
  unlinkedTaskCodes: string[];
  totalBranches: number;
  totalChangeRequests: number;
  totalCommits: number;
  generatedAt: string;
}