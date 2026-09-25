import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/nodes/[id]/actions/route";
import { createNodeSeed, resetDashboardStore, setNodeEnabled } from "@/shared/lib/dashboard/store";

describe("GET /api/dashboard/nodes/[id]/actions", () => {
  it("returns action profile for online node", async () => {
    resetDashboardStore();
    const node = createNodeSeed("Test Node");
    setNodeEnabled(node.id, true);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: node.id }),
    });

    const json = (await response.json()) as {
      nodeId: string;
      actions: Array<{ id: string; enabled: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(json.nodeId).toBe(node.id);
    expect(json.actions.length).toBeGreaterThan(0);
    expect(json.actions.some((action) => action.id === "set-offline")).toBe(true);
  });

  it("returns reduced action profile for offline node", async () => {
    resetDashboardStore();
    const node = createNodeSeed("Test Node");
    setNodeEnabled(node.id, false);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: node.id }),
    });

    const json = (await response.json()) as {
      nodeId: string;
      actions: Array<{ id: string; enabled: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(json.nodeId).toBe(node.id);
    expect(json.actions.some((action) => action.id === "set-online")).toBe(true);
  });
});
