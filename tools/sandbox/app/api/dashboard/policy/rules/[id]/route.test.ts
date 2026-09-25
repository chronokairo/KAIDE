import { describe, expect, it } from "vitest";
import { PATCH } from "@/app/api/dashboard/policy/rules/[id]/route";
import { createPolicyRule, findPolicyRuleById, resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("PATCH /api/dashboard/policy/rules/[id]", () => {
  it("toggles policy rule state", async () => {
    resetDashboardStore();
    const rule = createPolicyRule("Test Rule");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }),
      { params: Promise.resolve({ id: rule.id }) },
    );

    const json = (await response.json()) as { rule: { id: string; enabled: boolean } };

    expect(response.status).toBe(200);
    expect(json.rule.id).toBe(rule.id);
    expect(json.rule.enabled).toBe(false);
    expect(findPolicyRuleById(rule.id)?.enabled).toBe(false);
  });
});
