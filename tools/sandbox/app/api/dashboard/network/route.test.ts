import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/network/route";

describe("GET /api/dashboard/network", () => {
  it("returns network topology payload", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      nodes: Array<{ id: string; ip: string; role: string; state: string }>;
      links: Array<{ source: string; target: string; latencyMs: number; state: string }>;
      gatewayIp: string;
      totalBandwidthBps: number;
      averageLatencyMs: number;
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.nodes)).toBe(true);
    expect(json.nodes.length).toBeGreaterThan(0);
    expect(Array.isArray(json.links)).toBe(true);
    expect(typeof json.gatewayIp).toBe("string");
    expect(typeof json.totalBandwidthBps).toBe("number");
    expect(typeof json.averageLatencyMs).toBe("number");
  });

  it("nodes have required fields", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      nodes: Array<{ id: string; ip: string; role: string; state: string }>;
    };

    for (const node of json.nodes) {
      expect(typeof node.id).toBe("string");
      expect(typeof node.ip).toBe("string");
      expect(["primary", "replica", "gateway"]).toContain(node.role);
      expect(["active", "warning", "error"]).toContain(node.state);
    }
  });
});
