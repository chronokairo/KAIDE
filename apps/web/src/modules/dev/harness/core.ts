import { invokeHarness, invokeRuntime } from './transport';
import type {
  HarnessOverview,
  HarnessSkill,
  HarnessSyncStatus,
  HarnessNodeIdentity,
  LocalRepoStatus,
  OfflineMutation,
  CachedEntity,
} from './types';

export const coreClient = {
  overview: async () => invokeRuntime<HarnessOverview>('get_harness_overview'),
  skills: async (workspace?: string) => invokeRuntime<HarnessSkill[]>('get_harness_skills', { workspace }),
  getSkills: async (workspace?: string) => invokeRuntime<HarnessSkill[]>('get_harness_skills', { workspace }),
  nodeIdentity: async () => invokeHarness<HarnessNodeIdentity>('get_harness_node_identity'),
  syncStatus: async () => invokeHarness<HarnessSyncStatus>('get_harness_sync_status'),
  enqueueOfflineMutation: async (mutation: OfflineMutation) =>
    invokeHarness<string>('enqueue_offline_mutation', { mutation }),
  getPendingOfflineMutations: async (tenantId: string) =>
    invokeHarness<OfflineMutation[]>('get_pending_offline_mutations', { tenantId }),
  updateOfflineMutationStatus: async (id: string, status: string, error?: string) =>
    invokeHarness<void>('update_offline_mutation_status', { id, status, error }),
  cacheErpEntities: async (entities: CachedEntity[]) =>
    invokeHarness<void>('cache_erp_entities', { entities }),
  getCachedErpEntities: async (tenantId: string, entityType: string) =>
    invokeHarness<CachedEntity[]>('get_cached_erp_entities', { tenantId, entityType }),
  quorum: async () => invokeHarness<any>('get_harness_quorum'),
  quorumOpenCount: async () => invokeHarness<number>('get_harness_quorum_open_count'),
  addWorkspaceFolder: async (path: string) => invokeHarness<any>('add_harness_workspace_folder', { path }),
  automations: async (workspace?: string) => invokeRuntime<any[]>('get_harness_automations', { workspace }),
  gitScan: async (workspace?: string) => invokeRuntime<any>('get_harness_git_scan', { workspace }),
  gitRepoStatus: async (path: string) => invokeRuntime<LocalRepoStatus>('get_harness_git_status', { path }),
  cloneRepo: async (url: string, destination: string, branch?: string) =>
    invokeHarness<any>('clone_harness_repo', { url, destination, branch }),
  readFile: async (path: string) => invokeRuntime<string>('read_harness_file', { path }),
  writeFile: async (path: string, content: string) => invokeRuntime<any>('write_harness_file', { path, content }),
  executeDevTool: async (tool: string, args: Record<string, unknown>, workspace?: string) =>
    invokeHarness<any>('execute_dev_tool', { tool, args, workspace }),
};
