import { invokeRuntime } from './transport';

export interface GitInfo {
  repoRoot: string;
  branch: string;
  isRepo: boolean;
  remotes: Array<{ name: string; url: string }>;
  status: string;
}

export interface GitInfoCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface FsmonitorOverride {
  enabled: boolean;
  reason?: string;
}

export const gitInfoClient = {
  collectGitInfo: async (workspace?: string) =>
    invokeRuntime<GitInfo>('collect_git_info', { workspace }).then((r) => r.data ?? {
      repoRoot: '',
      branch: '',
      isRepo: false,
      remotes: [],
      status: '',
    }),
  detectFsmonitor: async (workspace?: string) =>
    invokeRuntime<FsmonitorOverride>('detect_fsmonitor', { workspace }).then((r) => r.data ?? { enabled: false }),
  getDefaultBranch: async (workspace?: string) =>
    invokeRuntime<string>('get_default_branch', { workspace }).then((r) => r.data ?? 'main'),
};
