import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/containers/route";
import { resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("GET /api/dashboard/containers", () => {
  it("returns dashboard container payload", async () => {
    resetDashboardStore();
    const response = await GET(new Request("http://localhost/api/dashboard/containers"));
    const json = (await response.json()) as {
      nodes: unknown[];
      telemetryRows: unknown[];
      totalTelemetryRows: number;
      page: number;
      pageSize: number;
      healthy: boolean;
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.nodes)).toBe(true);
    expect(Array.isArray(json.telemetryRows)).toBe(true);
    expect(typeof json.totalTelemetryRows).toBe("number");
    expect(json.page).toBe(1);
    expect(json.pageSize).toBe(5);
    expect(typeof json.healthy).toBe("boolean");
  });

  it("supports state filter and page size query", async () => {
    resetDashboardStore();
    const response = await GET(
      new Request("http://localhost/api/dashboard/containers?page=1&pageSize=1&state=active"),
    );

    const json = (await response.json()) as {
      telemetryRows: Array<{ state: string }>;
      pageSize: number;
    };

    expect(response.status).toBe(200);
    expect(json.pageSize).toBe(1);
    expect(json.telemetryRows.length).toBeLessThanOrEqual(1);
    if (json.telemetryRows.length > 0) {
      expect(json.telemetryRows[0].state).toBe("active");
    }
  });
});
