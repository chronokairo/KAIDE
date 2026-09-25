"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Circle,
  Container,
  Cpu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Server,
  Unplug,
} from "lucide-react";
import { ContainerDashboardData } from "@/entities/dashboard/model/types";
import {
  createDashboardNode,
  getDashboardNodeActions,
  getContainerDashboard,
  inspectDashboardNode,
  setDashboardNodeEnabled,
} from "@/shared/api/dashboard-client";

const NODE_COLORS = ["var(--cm-green)", "var(--cm-amber)", "var(--cm-muted)"];

export function ContainerManagerScreen() {
  const [data, setData] = useState<ContainerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(3);
  const [stateFilter, setStateFilter] = useState<"all" | "active" | "warning" | "error">("all");
  const [inspection, setInspection] = useState<{
    node: { id: string; name: string; status: string; cpu: number; ram: string };
    telemetry: { node: string; ip: string; uptime: string; load: string; processes: string };
  } | null>(null);
  const [nodeActions, setNodeActions] = useState<{
    nodeId: string;
    actions: Array<{ id: string; label: string; type: "read" | "write"; enabled: boolean }>;
  } | null>(null);

  async function loadData() {
    try {
      const nextData = await getContainerDashboard({
        page,
        pageSize,
        state: stateFilter,
      });
      setData(nextData);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load containers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [page, pageSize, stateFilter]);

  async function handleCreateNode() {
    setActionLoading(true);
    try {
      await createDashboardNode();
      setPage(1);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create node");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleInspect(nodeId: string) {
    setActionLoading(true);
    try {
      const details = await inspectDashboardNode(nodeId);
      setInspection(details);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to inspect node");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleNode(nodeId: string, enabled: boolean) {
    setActionLoading(true);
    try {
      await setDashboardNodeEnabled(nodeId, enabled);
      await loadData();
      if (inspection?.node.id === nodeId && !enabled) {
        setInspection(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update node state");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMore(nodeId: string) {
    setActionLoading(true);
    try {
      const actions = await getDashboardNodeActions(nodeId);
      setNodeActions(actions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load node actions");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="container-screen">
        <p>Loading container telemetry...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="container-screen">
        <p>{error ?? "No container data available."}</p>
      </section>
    );
  }

  return (
    <section className="container-screen">
      <header className="cm-header">
        <div>
          <h1>Container Manager</h1>
          <p>Orchestrate and monitor high-performance virtual environments.</p>
        </div>
        <div className="cm-actions">
          <span className="cm-chip">
            <Circle size={8} fill="currentColor" /> System Health: {data.healthy ? "Optimal" : "Degraded"}
          </span>
          <button type="button" className="cm-button ghost" onClick={handleCreateNode} disabled={actionLoading}>
            <Plus size={14} /> {actionLoading ? "Creating..." : "New Node"}
          </button>
        </div>
      </header>

      <div className="cm-node-grid">
        {data.nodes.map((node, nodeIndex) => (
          <article key={node.id} className="cm-card">
            <div className="cm-card-top">
              <div>
                <h2>
                  <Container size={16} /> {node.name}
                </h2>
                <p>
                  <Circle size={7} fill={node.active ? "currentColor" : "transparent"} />
                  {node.id} | {node.status}
                </p>
              </div>
              <div className="cm-card-icons">
                <MoreHorizontal size={14} />
                <button type="button" aria-label={`Refresh ${node.id}`} onClick={() => void loadData()}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="cm-metrics">
              <div>
                <span>CPU Usage</span>
                <strong>{node.cpu}%</strong>
              </div>
              <div className="cm-bars">
                {node.bars.map((value, index) => (
                  <i
                    key={`${node.id}-${index}`}
                    style={{ height: `${value}%`, backgroundColor: value > 0 ? NODE_COLORS[nodeIndex % NODE_COLORS.length] : "#182545" }}
                  />
                ))}
              </div>
              <div>
                <span>RAM Load</span>
                <strong>{node.ram}</strong>
              </div>
            </div>

            <div className="cm-footer">
              <label>
                <input type="checkbox" defaultChecked={node.active} disabled={!node.active} />
                <span>Network Bridge</span>
              </label>
              <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                <button type="button" className="cm-link-btn" onClick={() => void handleInspect(node.id)} disabled={!node.active || actionLoading}>
                  Inspect
                </button>
                <button
                  type="button"
                  className="cm-link-btn"
                  onClick={() => void handleToggleNode(node.id, !node.active)}
                  disabled={actionLoading}
                >
                  {node.active ? "Offline" : "Online"}
                </button>
                <button type="button" className="cm-link-btn" onClick={() => void handleMore(node.id)} disabled={actionLoading}>
                  More
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {nodeActions ? (
        <section className="cm-table-wrap" style={{ marginBottom: "1rem" }}>
          <header>
            <h3>
              <MoreHorizontal size={15} /> Node Actions: {nodeActions.nodeId}
            </h3>
          </header>
          <table className="cm-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Type</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {nodeActions.actions.map((action) => (
                <tr key={`${nodeActions.nodeId}-${action.id}`}>
                  <td>{action.label}</td>
                  <td>{action.type}</td>
                  <td>{action.enabled ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {inspection ? (
        <section className="cm-table-wrap" style={{ marginBottom: "1rem" }}>
          <header>
            <h3>
              <Activity size={15} /> Node Inspection: {inspection.node.name}
            </h3>
          </header>
          <table className="cm-table">
            <tbody>
              <tr>
                <td>ID</td>
                <td>{inspection.node.id}</td>
                <td>Status</td>
                <td>{inspection.node.status}</td>
              </tr>
              <tr>
                <td>IP</td>
                <td>{inspection.telemetry.ip}</td>
                <td>Uptime</td>
                <td>{inspection.telemetry.uptime}</td>
              </tr>
              <tr>
                <td>CPU</td>
                <td>{inspection.node.cpu}%</td>
                <td>Load</td>
                <td>{inspection.telemetry.load}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="cm-table-wrap">
        <header>
          <h3>
            <Server size={15} /> Active Node Telemetry
          </h3>
          <div className="cm-legend">
            <span className="ok">Active</span>
            <span className="warn">Warning</span>
            <span className="err">Error</span>
          </div>
        </header>

        <table className="cm-table">
          <thead>
            <tr>
              <th>Node Identifier</th>
              <th>IP Address</th>
              <th>Uptime</th>
              <th>Active Processes</th>
              <th>Load Avg</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.telemetryRows.map((row) => (
              <tr key={row.node}>
                <td>
                  <strong>{row.node}</strong>
                  <small>{row.hash}</small>
                </td>
                <td>{row.ip}</td>
                <td>{row.uptime}</td>
                <td className={row.state === "active" ? "ok" : row.state === "warning" ? "warn" : "muted"}>
                  {row.processes}
                </td>
                <td>{row.load}</td>
                <td>
                  {row.state === "error" ? <Unplug size={14} /> : <Activity size={14} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="cm-table-footer">
          <span>
            Showing {data.telemetryRows.length} of {data.totalTelemetryRows} rows
          </span>
          <div>
            <select
              value={stateFilter}
              onChange={(event) => {
                setPage(1);
                setStateFilter(event.target.value as "all" | "active" | "warning" | "error");
              }}
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => setPage((current) => current + 1)}
              disabled={page * pageSize >= data.totalTelemetryRows}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>

      <div className="cm-bg-grid" aria-hidden="true" />
      <div className="cm-corner" aria-hidden="true">
        <Cpu size={64} />
      </div>
    </section>
  );
}
