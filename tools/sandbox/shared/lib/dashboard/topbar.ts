import { getContainerDashboardData, getPolicyDashboardData } from "@/shared/lib/dashboard/data";
import { listPolicyRules } from "@/shared/lib/dashboard/store";

export interface DashboardNotificationItem {
  id: string;
  level: "info" | "warning" | "critical";
  message: string;
}

export async function getDashboardNotifications(): Promise<DashboardNotificationItem[]> {
  const containers = getContainerDashboardData(Date.now(), { page: 1, pageSize: 50, state: "all" });
  const policy = await getPolicyDashboardData({ page: 1, pageSize: 50, tone: "all" });

  const items: DashboardNotificationItem[] = [];
  const errorRows = containers.telemetryRows.filter((row) => row.state === "error").length;
  const warningRows = containers.telemetryRows.filter((row) => row.state === "warning").length;

  if (errorRows > 0) {
    items.push({
      id: "nodes-error",
      level: "critical",
      message: `${errorRows} node(s) are offline or unreachable`,
    });
  }

  if (warningRows > 0) {
    items.push({
      id: "nodes-warning",
      level: "warning",
      message: `${warningRows} node(s) under warning load`,
    });
  }

  if (policy.summary.blockedViolations > 0) {
    items.push({
      id: "policy-blocked",
      level: "warning",
      message: `${policy.summary.blockedViolations} blocked actions detected`,
    });
  }

  if (items.length === 0) {
    items.push({
      id: "all-clear",
      level: "info",
      message: "No active alerts",
    });
  }

  return items;
}

interface SearchResult {
  nodes: Array<{ id: string; name: string; status: string }>;
  rules: Array<{ id: string; title: string; severity: string }>;
  actions: Array<{ timestamp: string; command: string; status: string }>;
}

export async function searchDashboardResources(query: string): Promise<SearchResult> {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      nodes: [],
      rules: [],
      actions: [],
    };
  }

  const containers = getContainerDashboardData(Date.now(), { page: 1, pageSize: 50, state: "all" });
  const rules = listPolicyRules();
  const policy = await getPolicyDashboardData({ page: 1, pageSize: 50, tone: "all" });

  return {
    nodes: containers.nodes
      .filter((node) =>
        node.id.toLowerCase().includes(normalized) ||
        node.name.toLowerCase().includes(normalized) ||
        node.status.toLowerCase().includes(normalized),
      )
      .slice(0, 5)
      .map((node) => ({ id: node.id, name: node.name, status: node.status })),
    rules: rules
      .filter((rule) =>
        rule.id.toLowerCase().includes(normalized) ||
        rule.title.toLowerCase().includes(normalized) ||
        rule.severity.toLowerCase().includes(normalized),
      )
      .slice(0, 5)
      .map((rule) => ({ id: rule.id, title: rule.title, severity: rule.severity })),
    actions: policy.actions
      .filter((action) =>
        action.command.toLowerCase().includes(normalized) ||
        action.status.toLowerCase().includes(normalized),
      )
      .slice(0, 5)
      .map((action) => ({ timestamp: action.timestamp, command: action.command, status: action.status })),
  };
}

export function getDashboardSettings() {
  return {
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      dockerSandbox: process.env.USE_DOCKER_SANDBOX !== "false",
    },
    policy: {
      totalRules: listPolicyRules().length,
      enabledRules: listPolicyRules().filter((rule) => rule.enabled).length,
    },
  };
}
