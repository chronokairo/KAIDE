import { invokeRuntime } from './transport';
import type { DryRunResult, PatchResult } from './types';

export const patchClient = {
  applyPatchDryRun: async (patch: string, workspace?: string) =>
    invokeRuntime<DryRunResult>('apply_patch_dry_run', { patch, workspace }),
  applyPatchCommit: async (patch: string, workspace?: string) =>
    invokeRuntime<PatchResult>('apply_patch_commit', { patch, workspace }),
  applyPatchCommitWithBackup: async (patch: string, workspace?: string) =>
    invokeRuntime<PatchResult>('apply_patch_commit_with_backup', { patch, workspace }),
  applyPatchWithBackup: async (patch: string, workspace?: string) =>
    invokeRuntime<PatchResult>('apply_patch_commit_with_backup', { patch, workspace }),
  revertPatch: async (patchId: number, workspace?: string) =>
    invokeRuntime<PatchResult>('revert_patch', { patchId, workspace }),
};
