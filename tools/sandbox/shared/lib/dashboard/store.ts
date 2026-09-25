import { DashboardPolicyRule } from "@/entities/dashboard/model/types";

interface NodeSeed {
  name: string;
  id: string;
  enabled: boolean;
}

interface DashboardStore {
  nodeSeeds: NodeSeed[];
  policyRules: DashboardPolicyRule[];
  nextNode: number;
  nextRule: number;
}

const DEFAULT_NODE_SEEDS: NodeSeed[] = [
  { id: "NODE-ALPHA-01", name: "Alpha", enabled: true },
  { id: "NODE-BETA-02", name: "Beta", enabled: true },
  { id: "NODE-GAMMA-03", name: "Gamma", enabled: true },
];

const DEFAULT_POLICY_RULES: DashboardPolicyRule[] = [
  { id: "RULE-001", title: "Block Privilege Escalation", severity: "critical", enabled: true, pattern: "sudo\\s+su|su\\s+-" },
  { id: "RULE-002", title: "Block Fork Bomb Variants", severity: "critical", enabled: true, pattern: ":\\(\\)" },
  { id: "RULE-003", title: "Block Privileged Containers", severity: "high", enabled: true, pattern: "docker\\s+run\\s+.*--privileged" },
];

const store: DashboardStore = {
  nodeSeeds: DEFAULT_NODE_SEEDS.map((n) => ({ ...n })),
  policyRules: DEFAULT_POLICY_RULES.map((r) => ({ ...r })),
  nextNode: DEFAULT_NODE_SEEDS.length + 1,
  nextRule: DEFAULT_POLICY_RULES.length + 1,
};

function makeNodeId(index: number): string {
  return `NODE-DYN-${String(index).padStart(2, "0")}`;
}

function makeRuleId(index: number): string {
  return `RULE-${String(index).padStart(3, "0")}`;
}

export function listNodeSeeds(): NodeSeed[] {
  return [...store.nodeSeeds];
}

export function createNodeSeed(name?: string): NodeSeed {
  const index = store.nextNode;
  store.nextNode += 1;

  const node: NodeSeed = {
    name: name?.trim() || `Node-${index}`,
    id: makeNodeId(index),
    enabled: true,
  };

  store.nodeSeeds.push(node);
  return node;
}

export function getEnabledBlocklistPatterns(): RegExp[] {
  return store.policyRules
    .filter((rule) => rule.enabled && rule.pattern)
    .map((rule) => {
      try {
        return new RegExp(rule.pattern as string, "i");
      } catch {
        return null;
      }
    })
    .filter((regex): regex is RegExp => regex !== null);
}

export function listPolicyRules(): DashboardPolicyRule[] {
  return [...store.policyRules];
}

export function findPolicyRuleById(id: string): DashboardPolicyRule | undefined {
  return store.policyRules.find((rule) => rule.id === id);
}

export function findNodeSeedById(id: string): NodeSeed | undefined {
  return store.nodeSeeds.find((seed) => seed.id === id);
}

export function setNodeEnabled(id: string, enabled: boolean): NodeSeed | null {
  const node = store.nodeSeeds.find((seed) => seed.id === id);
  if (!node) {
    return null;
  }

  node.enabled = enabled;
  return node;
}

export function initializeAllNodeSeeds(): number {
  let initialized = 0;

  for (const node of store.nodeSeeds) {
    if (!node.enabled) {
      node.enabled = true;
      initialized += 1;
    }
  }

  return initialized;
}

export function createPolicyRule(title?: string): DashboardPolicyRule {
  const index = store.nextRule;
  store.nextRule += 1;

  const rule: DashboardPolicyRule = {
    id: makeRuleId(index),
    title: title?.trim() || `Custom Rule ${index}`,
    severity: "medium",
    enabled: true,
  };

  store.policyRules.push(rule);
  return rule;
}

export function setPolicyRuleEnabled(id: string, enabled: boolean): DashboardPolicyRule | null {
  const rule = store.policyRules.find((item) => item.id === id);
  if (!rule) {
    return null;
  }

  rule.enabled = enabled;
  return rule;
}

export function resetDashboardStore(): void {
  store.nodeSeeds = DEFAULT_NODE_SEEDS.map((n) => ({ ...n }));
  store.policyRules = DEFAULT_POLICY_RULES.map((r) => ({ ...r }));
  store.nextNode = DEFAULT_NODE_SEEDS.length + 1;
  store.nextRule = DEFAULT_POLICY_RULES.length + 1;
}
