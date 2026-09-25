import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/policy/route";

describe("GET /api/dashboard/policy", () => {
  it("returns policy payload", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/policy?page=1&pageSize=2&tone=all"));
    const json = (await response.json()) as {
      actions: unknown[];
      totalActions: number;
      page: number;
      pageSize: number;
      summary: {
        criticalRules: number;
        policyHealth: string;
      };
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.actions)).toBe(true);
    expect(typeof json.totalActions).toBe("number");
    expect(json.page).toBe(1);
    expect(json.pageSize).toBe(2);
    expect(typeof json.summary.criticalRules).toBe("number");
    expect(typeof json.summary.policyHealth).toBe("string");
  });
});
