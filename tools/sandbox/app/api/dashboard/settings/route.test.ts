import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/settings/route";

describe("GET /api/dashboard/settings", () => {
  it("returns runtime and policy settings", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      runtime: { nodeVersion: string; platform: string; dockerSandbox: boolean };
      policy: { totalRules: number; enabledRules: number };
    };

    expect(response.status).toBe(200);
    expect(typeof json.runtime.nodeVersion).toBe("string");
    expect(typeof json.runtime.platform).toBe("string");
    expect(typeof json.runtime.dockerSandbox).toBe("boolean");
    expect(typeof json.policy.totalRules).toBe("number");
  });
});
