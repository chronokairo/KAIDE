export interface ContainerNode {
  name: string;
  id: string;
  status: "RUNNING" | "WARNING" | "INACTIVE";
  cpu: number;
  ram: string;
  bars: number[];
  active: boolean;
}

export interface TelemetryRow {
  node: string;
  hash: string;
  ip: string;
  uptime: string;
  processes: string;
  load: string;
  state: "active" | "warning" | "error";
}

export interface ContainerDashboardData {
  nodes: ContainerNode[];
  telemetryRows: TelemetryRow[];
  totalClusters: number;
  totalTelemetryRows: number;
  page: number;
  pageSize: number;
  healthy: boolean;
}

export interface PolicyAction {
  timestamp: string;
  command: string;
  source: string;
  status: "Safe" | "Blocked";
  tone: "safe" | "blocked";
}

export interface PolicySummary {
  criticalRules: number;
  allowedActions: number;
  blockedViolations: number;
  policyHealth: string;
}

export interface DashboardPolicyRule {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  /** Optional regex pattern; if set and rule is enabled, matching commands are blocked at runtime. */
  pattern?: string;
}

export interface PolicyDashboardData {
  actions: PolicyAction[];
  summary: PolicySummary;
  totalActions: number;
  page: number;
  pageSize: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  /** Simulated RTT in ms */
  latencyMs: number;
  /** bytes/sec estimate */
  bandwidthBps: number;
  state: "up" | "degraded" | "down";
}

export interface NetworkTopologyData {
  nodes: Array<{
    id: string;
    name: string;
    ip: string;
    role: "primary" | "replica" | "gateway";
    state: "active" | "warning" | "error";
  }>;
  links: NetworkLink[];
  gatewayIp: string;
  totalBandwidthBps: number;
  averageLatencyMs: number;
}
