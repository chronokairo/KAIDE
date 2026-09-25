import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ContainerDashboardData,
  ContainerNode,
  NetworkTopologyData,
  PolicyAction,
  PolicyDashboardData,
  PolicySummary,
  TelemetryRow,
} from "@/entities/dashboard/model/types";
import { findNodeSeedById, listNodeSeeds, listPolicyRules } from "@/shared/lib/dashboard/store";

const AUDIT_FILE = path.join(process.cwd(), "logs", "audit.log");
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;

function normalizePage(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

function normalizePageSize(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.floor(Math.min(50, value));
}

function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function makeBars(seed: number): number[] {
  const bars: number[] = [];
  for (let index = 0; index < 7; index += 1) {
    bars.push(Math.min(100, Math.max(0, seed + index * 5)));
  }
  return bars;
}

interface ContainerDashboardQuery {
  page?: number;
  pageSize?: number;
  state?: TelemetryRow["state"] | "all";
}

export function getContainerDashboardData(nowMs = Date.now(), query: ContainerDashboardQuery = {}): ContainerDashboardData {
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const seeds = listNodeSeeds();

  // Build nodes from real store data
  const nodes: ContainerNode[] = seeds.map((seed, index) => {
    const active = seed.enabled;
    const bars = makeBars(index * 15);
    
    return {
      name: seed.name,
      id: seed.id,
      status: active ? "RUNNING" : "INACTIVE",
      cpu: active ? 25 + (index * 10) : 0,
      ram: active ? `${8 + index * 2} / 16 GB` : "-- / 16 GB",
      bars: active ? bars : [0, 0, 0, 0, 0, 0, 0],
      active,
    };
  });

  // Build telemetry rows from nodes
  const telemetryRows: TelemetryRow[] = nodes.map((node, index) => ({
    node: `${node.name.toLowerCase()}.sys.aegis`,
    hash: `${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`,
    ip: `192.168.1.${104 + index}`,
    uptime: node.active ? `${5 + index}d 12h 34m` : "--",
    processes: node.active ? `${12 + index * 3} active` : "Offline",
    load: node.active ? `${(node.cpu / 50).toFixed(2)} / ${(node.cpu / 60).toFixed(2)} / ${(node.cpu / 65).toFixed(2)}` : "--",
    state: !node.active ? "error" : node.cpu > 70 ? "warning" : "active",
  }));

  // Apply state filter
  const filteredRows = query.state && query.state !== "all"
    ? telemetryRows.filter((row) => row.state === query.state)
    : telemetryRows;

  // Apply pagination
  const pagedRows = paginateRows(filteredRows, page, pageSize);
  const healthy = telemetryRows.every((row) => row.state !== "error");

  return {
    nodes,
    telemetryRows: pagedRows,
    totalClusters: Math.max(nodes.length * 4, 12),
    totalTelemetryRows: filteredRows.length,
    page,
    pageSize,
    healthy,
  };
}

export function getContainerNodeDetails(nodeId: string, nowMs = Date.now()): {
  node: ContainerNode;
  telemetry: TelemetryRow;
} | null {
  const seed = findNodeSeedById(nodeId);
  if (!seed) {
    return null;
  }

  const data = getContainerDashboardData(nowMs);
  const node = data.nodes.find((item) => item.id === nodeId);
  const telemetry = data.telemetryRows.find((item) => item.node.startsWith(seed.name.toLowerCase()));

  if (!node || !telemetry) {
    return null;
  }

  return { node, telemetry };
}

interface ParsedAuditEntry {
  timestamp: string;
  checks: Array<{ command: string; allowed: boolean }>;
}

function toPolicyAction(entry: ParsedAuditEntry): PolicyAction[] {
  return entry.checks.map((check) => ({
    timestamp: entry.timestamp,
    command: check.command,
    source: "agent_runtime",
    status: check.allowed ? "Safe" : "Blocked",
    tone: check.allowed ? "safe" : "blocked",
  }));
}

export function parseAuditLogLines(lines: string[]): PolicyAction[] {
  const actions: PolicyAction[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as {
        timestamp?: string;
        payload?: {
          policy?: {
            checks?: Array<{ command?: string; allowed?: boolean }>;
          };
        };
      };

      const checks = parsed.payload?.policy?.checks;
      if (!checks || checks.length === 0) {
        continue;
      }

      const normalizedChecks = checks
        .filter((check) => typeof check.command === "string")
        .map((check) => ({
          command: check.command as string,
          allowed: Boolean(check.allowed),
        }));

      actions.push(
        ...toPolicyAction({
          timestamp: parsed.timestamp ?? new Date().toISOString(),
          checks: normalizedChecks,
        }),
      );
    } catch {
      continue;
    }
  }

  return actions.reverse().slice(0, 20);
}

export function buildPolicySummary(actions: PolicyAction[]): PolicySummary {
  const blockedViolations = actions.filter((action) => action.tone === "blocked").length;
  const allowedActions = actions.filter((action) => action.tone === "safe").length;
  const total = blockedViolations + allowedActions;
  const policyHealth = total === 0 ? "100.0%" : `${((allowedActions / total) * 100).toFixed(1)}%`;
  const criticalRules = listPolicyRules().filter((rule) => rule.enabled && rule.severity === "critical").length;

  return {
    criticalRules,
    allowedActions,
    blockedViolations,
    policyHealth,
  };
}

interface PolicyDashboardQuery {
  page?: number;
  pageSize?: number;
  tone?: PolicyAction["tone"] | "all";
}

export function paginatePolicyActions(
  actions: PolicyAction[],
  query: PolicyDashboardQuery = {},
): { actions: PolicyAction[]; totalActions: number; page: number; pageSize: number } {
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);
  const filtered = query.tone && query.tone !== "all"
    ? actions.filter((action) => action.tone === query.tone)
    : actions;

  return {
    actions: paginateRows(filtered, page, pageSize),
    totalActions: filtered.length,
    page,
    pageSize,
  };
}

export async function getPolicyDashboardData(query: PolicyDashboardQuery = {}): Promise<PolicyDashboardData> {
  try {
    const content = await readFile(AUDIT_FILE, "utf8");
    const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
    const actions = parseAuditLogLines(lines);
    const paged = paginatePolicyActions(actions, query);

    return {
      actions: paged.actions,
      summary: buildPolicySummary(actions),
      totalActions: paged.totalActions,
      page: paged.page,
      pageSize: paged.pageSize,
    };
  } catch {
    const actions: PolicyAction[] = [];
    const paged = paginatePolicyActions(actions, query);
    return {
      actions: paged.actions,
      summary: buildPolicySummary(actions),
      totalActions: paged.totalActions,
      page: paged.page,
      pageSize: paged.pageSize,
    };
  }
}

export function getNetworkTopologyData(nowMs = Date.now()): NetworkTopologyData {
  const seeds = listNodeSeeds();
  
  const networkNodes = seeds.map((seed, index) => ({
    id: seed.id,
    name: seed.name,
    ip: `192.168.1.${104 + index}`,
    role: (index === 0 ? "primary" : index === seeds.length - 1 ? "gateway" : "replica") as "primary" | "replica" | "gateway",
    state: (!seed.enabled ? "error" : "active") as "active" | "warning" | "error",
  }));

  const links = seeds
    .slice(0, -1)
    .map((seed, index) => {
      const target = seeds[index + 1];
      if (!target) return null;

      const latencyMs = 5 + index * 2;
      const bandwidthBps = seed.enabled && target.enabled ? 1_000_000 : 0;
      const linkState = !seed.enabled || !target.enabled ? "down" : "up";

      return {
        source: seed.id,
        target: target.id,
        latencyMs,
        bandwidthBps,
        state: linkState as "up" | "degraded" | "down",
      };
    })
    .filter((link): link is NonNullable<typeof link> => link !== null);

  const activeLinks = links.filter((link) => link.state !== "down");
  const totalBandwidthBps = activeLinks.reduce((sum, link) => sum + link.bandwidthBps, 0);
  const averageLatencyMs = activeLinks.length > 0
    ? Math.round(activeLinks.reduce((sum, link) => sum + link.latencyMs, 0) / activeLinks.length)
    : 0;

  const gateway = networkNodes.find((node) => node.role === "gateway");

  return {
    nodes: networkNodes,
    links,
    gatewayIp: gateway?.ip ?? "192.168.1.1",
    totalBandwidthBps,
    averageLatencyMs,
  };
}
