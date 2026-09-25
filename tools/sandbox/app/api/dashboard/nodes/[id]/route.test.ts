import { describe, expect, it } from "vitest";
import { GET, PATCH } from "@/app/api/dashboard/nodes/[id]/route";
import { createNodeSeed, findNodeSeedById, resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("/api/dashboard/nodes/[id]", () => {
  it("inspects an existing node", async () => {
    resetDashboardStore();
    const node = createNodeSeed("Test Node");
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: node.id }),
    });

    const json = (await response.json()) as { node: { id: string }; telemetry: { ip: string } };

    expect(response.status).toBe(200);
    expect(json.node.id).toBe(node.id);
    expect(typeof json.telemetry.ip).toBe("string");
  });

  it("toggles node enabled state", async () => {
    resetDashboardStore();
    const node = createNodeSeed("Test Node");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }),
      { params: Promise.resolve({ id: node.id }) },
    );

    const json = (await response.json()) as { node: { id: string; enabled: boolean } };

    expect(response.status).toBe(200);
    expect(json.node.enabled).toBe(false);
    expect(findNodeSeedById(node.id)?.enabled).toBe(false);
  });
});
