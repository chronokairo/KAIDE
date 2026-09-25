import { beforeEach, describe, expect, it } from "vitest";
import {
  createNodeSeed,
  createPolicyRule,
  findPolicyRuleById,
  initializeAllNodeSeeds,
  listNodeSeeds,
  listPolicyRules,
  resetDashboardStore,
  setNodeEnabled,
  setPolicyRuleEnabled,
} from "@/shared/lib/dashboard/store";

describe("dashboard store", () => {
  beforeEach(() => {
    resetDashboardStore();
  });

  it("creates nodes and increases node list", () => {
    const initial = listNodeSeeds().length;
    const created = createNodeSeed("Integration Node");

    expect(created.id).toContain("NODE-DYN-");
    expect(created.name).toBe("Integration Node");
    expect(listNodeSeeds().length).toBe(initial + 1);
  });

  it("creates policy rules and keeps them enabled", () => {
    const initial = listPolicyRules().length;
    const created = createPolicyRule("Block External SSH");

    expect(created.id).toContain("RULE-");
    expect(created.enabled).toBe(true);
    expect(created.title).toBe("Block External SSH");
    expect(listPolicyRules().length).toBe(initial + 1);
  });

  it("toggles policy rule enabled state", () => {
    const rule = createPolicyRule("Test Rule");
    const updated = setPolicyRuleEnabled(rule.id, false);

    expect(updated?.enabled).toBe(false);
    expect(findPolicyRuleById(rule.id)?.enabled).toBe(false);
  });

  it("initializes all nodes when requested", () => {
    const node = createNodeSeed("Test Node");
    setNodeEnabled(node.id, false);
    const changed = initializeAllNodeSeeds();

    expect(changed).toBeGreaterThanOrEqual(1);
    expect(listNodeSeeds().every((node) => node.enabled)).toBe(true);
  });

  it("does not reinitialize when all nodes already online", () => {
    initializeAllNodeSeeds();
    const changed = initializeAllNodeSeeds();

    expect(changed).toBe(0);
  });
});
