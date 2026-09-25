import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/dashboard/nodes/initialize/route";
import { createNodeSeed, findNodeSeedById, resetDashboardStore, setNodeEnabled } from "@/shared/lib/dashboard/store";

describe("POST /api/dashboard/nodes/initialize", () => {
  it("initializes offline nodes", async () => {
    resetDashboardStore();
    const node = createNodeSeed("Test Node");
    setNodeEnabled(node.id, false);

    const response = await POST();
    const json = (await response.json()) as { initialized: number; totalNodes: number };

    expect(response.status).toBe(200);
    expect(json.initialized).toBeGreaterThanOrEqual(1);
    expect(json.totalNodes).toBeGreaterThanOrEqual(1);
    expect(findNodeSeedById(node.id)?.enabled).toBe(true);
  });
});
