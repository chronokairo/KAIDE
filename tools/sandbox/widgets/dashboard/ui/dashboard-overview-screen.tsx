  "use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Server } from "lucide-react";
import { ContainerDashboardData, PolicyDashboardData } from "@/entities/dashboard/model/types";
import { getContainerDashboard, getDashboardPolicyRules, getPolicyDashboard } from "@/shared/api/dashboard-client";

interface DashboardPayload {
  containers: ContainerDashboardData;
  policy: PolicyDashboardData;
  enabledRulesCount: number;
}

const REFRESH_INTERVAL_MS = 30_000;

export function DashboardOverviewScreen() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [containers, policy, rules] = await Promise.all([
        getContainerDashboard(),
        getPolicyDashboard(),
        getDashboardPolicyRules(),
      ]);

      setData({ containers, policy, enabledRulesCount: rules.filter((r) => r.enabled).length });
      setError(null);
      setLastRefreshed(new Date());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <section className="aegis-v2-view">
        <p>Loading dashboard overview...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="aegis-v2-view">
        <p>{error ?? "No dashboard overview data available."}</p>
      </section>
    );
  }

  const runningNodes = data.containers.nodes.filter((node) => node.active).length;
  const warningNodes = data.containers.nodes.filter((node) => node.status === "WARNING").length;
  const avgCpu =
    runningNodes > 0
      ? Math.round(
          data.containers.nodes
            .filter((node) => node.active)
            .reduce((sum, node) => sum + node.cpu, 0) / runningNodes,
        )
      : 0;

  return (
    <section className="aegis-v2-view">
      <header className="aegis-v2-view-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>
            Live posture across orchestration, telemetry, and policy controls.
            {lastRefreshed ? (
              <span style={{ marginLeft: "0.5rem", opacity: 0.6, fontSize: "0.75rem" }}>
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            ) : null}
          </p>
        </div>
        <button className="cm-btn" onClick={() => void load()} disabled={loading} title="Refresh dashboard">
          <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="aegis-v2-panels two-col">
        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Server size={14} /> Cluster Health
            </h3>
          </header>
          <div className="aegis-v2-stats">
            <div>
              <span>Total Nodes</span>
              <strong>{data.containers.nodes.length}</strong>
            </div>
            <div>
              <span>Running Nodes</span>
              <strong>{runningNodes}</strong>
            </div>
            <div>
              <span>Warning Nodes</span>
              <strong>{warningNodes}</strong>
            </div>
            <div>
              <span>System Health</span>
              <strong>{data.containers.healthy ? "Optimal" : "Degraded"}</strong>
            </div>
            <div>
              <span>Avg CPU</span>
              <strong className={avgCpu > 70 ? "warn" : undefined}>{runningNodes > 0 ? `${avgCpu}%` : "--"}</strong>
            </div>
          </div>
        </article>

        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Activity size={14} /> Policy Health
            </h3>
          </header>
          <div className="aegis-v2-stats">
            <div>
              <span>Allowed Actions</span>
              <strong>{data.policy.summary.allowedActions.toLocaleString()}</strong>
            </div>
            <div>
              <span>Blocked Violations</span>
              <strong>{data.policy.summary.blockedViolations}</strong>
            </div>
            <div>
              <span>Critical Rules</span>
              <strong>{data.policy.summary.criticalRules}</strong>
            </div>
            <div>
              <span>Policy Health</span>
              <strong>{data.policy.summary.policyHealth}</strong>
            </div>
            <div>
              <span>Enabled Rules</span>
              <strong>{data.enabledRulesCount}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="aegis-v2-panels" style={{ marginTop: "1rem" }}>
        <article className="aegis-v2-panel">
          <header>
            <h3>
              <CheckCircle2 size={14} /> Latest Validation Events
            </h3>
          </header>
          <table className="cm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Command</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.policy.actions.slice(0, 6).map((action) => (
                <tr key={`${action.timestamp}-${action.command}`}>
                  <td>{action.timestamp}</td>
                  <td>{action.command}</td>
                  <td className={action.tone === "safe" ? "ok" : "warn"}>{action.status}</td>
                </tr>
              ))}
              {data.policy.actions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No validation events captured yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      </div>

      {!data.containers.healthy ? (
        <p style={{ marginTop: "0.85rem", color: "#f5b33c" }}>
          <AlertTriangle size={14} style={{ verticalAlign: "text-bottom" }} /> One or more nodes are degraded.
        </p>
      ) : null}
    </section>
  );
}
