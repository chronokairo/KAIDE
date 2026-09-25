import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/dashboard/policy/rules/route";
import { createPolicyRule, listPolicyRules, resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("GET /api/dashboard/policy/rules", () => {
  it("returns policy rule list", async () => {
    resetDashboardStore();
    createPolicyRule("Test Rule");
    const response = await GET();
    const json = (await response.json()) as { rules: Array<{ id: string }> };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.rules)).toBe(true);
    expect(json.rules.length).toBeGreaterThan(0);
  });
});

describe("POST /api/dashboard/policy/rules", () => {
  it("creates a policy rule", async () => {
    resetDashboardStore();
    const before = listPolicyRules().length;

    const request = new Request("http://localhost/api/dashboard/policy/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Block Unknown Egress" }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { rule: { id: string; title: string } };

    expect(response.status).toBe(201);
    expect(json.rule.id).toContain("RULE-");
    expect(json.rule.title).toBe("Block Unknown Egress");
    expect(listPolicyRules().length).toBe(before + 1);
  });
});
