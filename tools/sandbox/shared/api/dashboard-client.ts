import { ContainerDashboardData, DashboardPolicyRule, NetworkTopologyData, PolicyDashboardData } from "@/entities/dashboard/model/types";

interface NodeInspectionResult {
  node: {
    id: string;
    name: string;
    status: string;
    cpu: number;
    ram: string;
  };
  telemetry: {
    node: string;
    ip: string;
    uptime: string;
    load: string;
    processes: string;
  };
}

interface NodeActionResult {
  nodeId: string;
  actions: Array<{
    id: string;
    label: string;
    type: "read" | "write";
    enabled: boolean;
  }>;
}

interface DashboardSearchResult {
  nodes: Array<{ id: string; name: string; status: string }>;
  rules: Array<{ id: string; title: string; severity: string }>;
  actions: Array<{ timestamp: string; command: string; status: string }>;
}

interface DashboardNotificationResult {
  items: Array<{ id: string; level: "info" | "warning" | "critical"; message: string }>;
}

interface DashboardSettingsResult {
  runtime: {
    nodeVersion: string;
    platform: string;
    dockerSandbox: boolean;
  };
  policy: {
    totalRules: number;
    enabledRules: number;
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as T | { error: string };

  if (!res.ok || (typeof data === "object" && data !== null && "error" in data)) {
    throw new Error("error" in (data as { error: string }) ? (data as { error: string }).error : `Failed to call ${url}`);
  }

  return data as T;
}

interface ContainerDashboardQuery {
  page?: number;
  pageSize?: number;
  state?: "active" | "warning" | "error" | "all";
}

interface PolicyDashboardQuery {
  page?: number;
  pageSize?: number;
  tone?: "safe" | "blocked" | "all";
}

function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function getContainerDashboard(query: ContainerDashboardQuery = {}): Promise<ContainerDashboardData> {
  return getJson<ContainerDashboardData>(
    withQuery("/api/dashboard/containers", {
      page: query.page,
      pageSize: query.pageSize,
      state: query.state,
    }),
  );
}

export function getPolicyDashboard(query: PolicyDashboardQuery = {}): Promise<PolicyDashboardData> {
  return getJson<PolicyDashboardData>(
    withQuery("/api/dashboard/policy", {
      page: query.page,
      pageSize: query.pageSize,
      tone: query.tone,
    }),
  );
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as T | { error: string };

  if (!res.ok || (typeof data === "object" && data !== null && "error" in data)) {
    throw new Error("error" in (data as { error: string }) ? (data as { error: string }).error : `Failed to call ${url}`);
  }

  return data as T;
}

export async function createDashboardNode(name?: string): Promise<void> {
  await postJson<{ node: { id: string } }>("/api/dashboard/nodes", { name });
}

export async function initializeDashboardNodes(): Promise<{ initialized: number; totalNodes: number }> {
  return postJson<{ initialized: number; totalNodes: number }>("/api/dashboard/nodes/initialize", {});
}

export async function createDashboardPolicyRule(title?: string): Promise<void> {
  await postJson<{ rule: { id: string } }>("/api/dashboard/policy/rules", { title });
}

export async function getDashboardPolicyRules(): Promise<DashboardPolicyRule[]> {
  const result = await getJson<{ rules: DashboardPolicyRule[] }>("/api/dashboard/policy/rules");
  return result.rules;
}

export async function setDashboardPolicyRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
  const res = await fetch(`/api/dashboard/policy/rules/${encodeURIComponent(ruleId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });

  const data = (await res.json()) as { rule?: { id: string }; error?: string };

  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Failed to update policy rule state");
  }
}

export function inspectDashboardNode(nodeId: string): Promise<NodeInspectionResult> {
  return getJson<NodeInspectionResult>(`/api/dashboard/nodes/${encodeURIComponent(nodeId)}`);
}

export function getDashboardNodeActions(nodeId: string): Promise<NodeActionResult> {
  return getJson<NodeActionResult>(`/api/dashboard/nodes/${encodeURIComponent(nodeId)}/actions`);
}

export async function setDashboardNodeEnabled(nodeId: string, enabled: boolean): Promise<void> {
  const res = await fetch(`/api/dashboard/nodes/${encodeURIComponent(nodeId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });

  const data = (await res.json()) as { node?: { id: string }; error?: string };

  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Failed to update node state");
  }
}

export function searchDashboard(query: string): Promise<DashboardSearchResult> {
  return getJson<DashboardSearchResult>(`/api/dashboard/search?q=${encodeURIComponent(query)}`);
}

export async function getDashboardNotifications(): Promise<DashboardNotificationResult["items"]> {
  const result = await getJson<DashboardNotificationResult>("/api/dashboard/notifications");
  return result.items;
}

export function getDashboardSettings(): Promise<DashboardSettingsResult> {
  return getJson<DashboardSettingsResult>("/api/dashboard/settings");
}

export function getNetworkTopology(): Promise<NetworkTopologyData> {
  return getJson<NetworkTopologyData>("/api/dashboard/network");
}
