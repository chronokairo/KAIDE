/**
 * Pure domain rules shared by the GitHub and GitLab integrations.
 *
 * Both forges describe change requests, branches and commits, so the rules
 * that bind them to the backlog live here once and are reused by both
 * adapters. Nothing in this file performs I/O: it is pure domain, which is
 * what keeps the parsing rules testable and prevents them from drifting apart
 * between the two forges.
 */

/**
 * Backlog task codes as they appear in branch names, change request titles
 * and commit subjects, for example `SECP-01`, `TSK-4EC62792`, `AUDIO-ASO-01`.
 */
const TASK_CODE_PATTERN = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

/** `type(scope): subject`, with an optional `!` breaking marker. */
const CONVENTIONAL_COMMIT_PATTERN =
  /^(?<type>[a-z]+)(?<breaking>!)?(?:\((?<scope>[^)]+)\))?:\s*(?<subject>.+)$/;

/**
 * Prefixes that appear in this code base but are not backlog task codes.
 * Without this filter the evidence index would fill up with ADR references.
 */
const NON_TASK_CODE_PREFIXES = new Set(['ADR']);

/**
 * A conventional commit, parsed from a GitHub or GitLab commit subject. The
 * repository follows `type(scope): subject`, for example
 * `feat(finance): implement real finance jobs (ADR-0037)`.
 */
export interface ConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
  references: string[];
  raw: string;
}

/**
 * Extracts the backlog task codes referenced by a piece of forge text.
 *
 * Duplicates are collapsed and ADR references are dropped, so the result is
 * always a set of real task links.
 */
export function extractTaskCodes(text: string): string[] {
  const found = text.toUpperCase().match(TASK_CODE_PATTERN) ?? [];
  return [...new Set(found)].filter((code) => !NON_TASK_CODE_PREFIXES.has(code.split('-')[0]));
}

/** Parses a conventional commit subject. Returns null when it is not one. */
export function parseConventionalCommit(raw: string): ConventionalCommit | null {
  const match = CONVENTIONAL_COMMIT_PATTERN.exec(raw.trim());
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

/** Truncates long text from a forge payload so evidence stays readable. */
export function excerpt(value: unknown, maxLength = 400): string {
  const text = typeof value === 'string' ? value : '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/** First line of a multi-line commit message. */
export function firstLine(message: unknown): string {
  const text = typeof message === 'string' ? message : '';
  return text.split('\n')[0];
}