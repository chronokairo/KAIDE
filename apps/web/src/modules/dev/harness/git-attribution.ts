import { invokeRuntime } from './transport';

export interface GitUserInfo {
  name: string;
  email: string;
}

export interface AttributionPolicy {
  policy?: Record<string, unknown>;
  co_authored_by?: boolean;
  include_human?: boolean;
  agent_name?: string;
  agent_email?: string;
  trailer_format?: string;
  [key: string]: any;
}

export const gitAttributionClient = {
  getAttributionPolicy: async (workspace?: string) =>
    invokeRuntime<AttributionPolicy>('get_attribution_policy', { workspace }).then((r) => r.data ?? { policy: {} }),
  getGitUserInfo: async (workspace?: string) =>
    invokeRuntime<GitUserInfo>('get_git_user_info', { workspace }).then((r) => r.data ?? { name: '', email: '' }),
  formatCommitAttribution: async (message: string, workspace?: string) =>
    invokeRuntime<string>('format_commit_attribution', { message, workspace }).then((r) => r.data ?? message),
};
