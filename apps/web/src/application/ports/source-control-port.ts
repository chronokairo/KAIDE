import {
  ForgeBranch,
  ForgeChangeRequest,
  ForgeCommit,
  ForgeAuthStatus,
  ForgeActivity,
} from '@/domain/source-control';

/**
 * Driven port for source control and forge integrations.
 *
 * The only production implementation shells out to the authenticated `gh` and
 * `glab` CLIs, scoped to the Chronokairo organization and group. Keeping this
 * behind a port means the Control Plane never depends on a forge SDK, and
 * tests can supply fixtures without touching the network.
 *
 * Read-only by contract. Merging, closing and reviewing are human actions
 * reached through the approval gate, never through this port.
 */
export interface SourceControlPort {
  getAuthStatus(): Promise<ForgeAuthStatus[]>;
  listBranches(provider: ForgeProviderLike, limit?: number): Promise<ForgeBranch[]>;
  listChangeRequests(provider: ForgeProviderLike, limit?: number): Promise<ForgeChangeRequest[]>;
  listCommits(provider: ForgeProviderLike, limit?: number): Promise<ForgeCommit[]>;
  /** Aggregates every forge and binds artifacts to backlog task codes. */
  collectActivity(taskCodes: string[]): Promise<ForgeActivity>;
}

type ForgeProviderLike = 'github' | 'gitlab';