export type AgentMode = "debian" | "ubuntu" | "nixos";

export interface AgentStep {
  id: string;
  description: string;
  command: string;
}

export interface AgentPlan {
  summary: string;
  mode: AgentMode;
  steps: AgentStep[];
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export interface CommandResult {
  command: string;
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface AgentRunResult {
  mode: AgentMode;
  prompt: string;
  plan: AgentPlan;
  policy: {
    allowed: boolean;
    checks: Array<PolicyResult & { command: string }>;
  };
  dryRun: boolean;
  results: CommandResult[];
}

export interface AgentRequest {
  prompt: string;
  mode?: AgentMode;
  dryRun?: boolean;
}
