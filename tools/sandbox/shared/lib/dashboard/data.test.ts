import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPolicySummary,
  getContainerDashboardData,
  paginatePolicyActions,
  parseAuditLogLines,
} from "@/shared/lib/dashboard/data";
import { resetDashboardStore } from "@/shared/lib/dashboard/store";

describe("dashboard data", () => {
  beforeEach(() => {
    resetDashboardStore();
  });

  it("returns container dashboard payload with runtime-generated nodes", () => {
    const data = getContainerDashboardData(1710000000000);

    expect(data.nodes.length).toBe(3);
    expect(data.telemetryRows.length).toBe(3);
    expect(data.totalClusters).toBeGreaterThan(3);
    expect(data.totalTelemetryRows).toBe(3);
    expect(data.nodes[0].bars.length).toBe(7);
  });

  it("applies container telemetry pagination", () => {
    const data = getContainerDashboardData(1710000000000, { page: 1, pageSize: 1, state: "active" });

    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(1);
    expect(data.telemetryRows.length).toBeLessThanOrEqual(1);
  });

  it("parses policy actions from audit log lines", () => {
    const lines = [
      JSON.stringify({
        timestamp: "2026-04-26T12:00:00.000Z",
        payload: {
          policy: {
            checks: [
              { command: "pwd", allowed: true },
              { command: "rm -rf /", allowed: false },
            ],
          },
        },
      }),
      "not-json",
    ];

    const actions = parseAuditLogLines(lines);

    expect(actions.length).toBe(2);
    expect(actions[0].status).toBe("Blocked");
    expect(actions[1].status).toBe("Safe");
  });

  it("calculates summary from parsed actions", () => {
    const summary = buildPolicySummary([
      {
        timestamp: "2026-01-01T00:00:00.000Z",
        command: "pwd",
        source: "agent_runtime",
        status: "Safe",
        tone: "safe",
      },
      {
        timestamp: "2026-01-01T00:01:00.000Z",
        command: "rm -rf /",
        source: "agent_runtime",
        status: "Blocked",
        tone: "blocked",
      },
    ]);

    expect(summary.allowedActions).toBe(1);
    expect(summary.blockedViolations).toBe(1);
    expect(summary.policyHealth).toBe("50.0%");
    expect(summary.criticalRules).toBe(2);
  });

  it("paginates and filters policy actions", () => {
    const page = paginatePolicyActions(
      [
        { timestamp: "1", command: "pwd", source: "s", status: "Safe", tone: "safe" },
        { timestamp: "2", command: "ls", source: "s", status: "Safe", tone: "safe" },
        { timestamp: "3", command: "rm", source: "s", status: "Blocked", tone: "blocked" },
      ],
      { tone: "safe", page: 1, pageSize: 1 },
    );

    expect(page.totalActions).toBe(2);
    expect(page.actions).toHaveLength(1);
    expect(page.actions[0].tone).toBe("safe");
  });
});
