import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/dashboard/nodes/route";
import { listNodeSeeds, resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("POST /api/dashboard/nodes", () => {
  it("creates a node seed", async () => {
    resetDashboardStore();
    const before = listNodeSeeds().length;

    const request = new Request("http://localhost/api/dashboard/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Edge Node" }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { node: { id: string; name: string } };

    expect(response.status).toBe(201);
    expect(json.node.id).toContain("NODE-DYN-");
    expect(json.node.name).toBe("Edge Node");
    expect(listNodeSeeds().length).toBe(before + 1);
  });
});
