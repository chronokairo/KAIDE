"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Network, RefreshCw, Wifi } from "lucide-react";
import { NetworkTopologyData } from "@/entities/dashboard/model/types";
import { getNetworkTopology } from "@/shared/api/dashboard-client";

const REFRESH_INTERVAL_MS = 30_000;

function formatBandwidth(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export function NetworkOverviewScreen() {
  const [data, setData] = useState<NetworkTopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await getNetworkTopology();
      setData(nextData);
      setError(null);
      setLastRefreshed(new Date());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load network topology");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !data) {
    return (
      <section className="aegis-v2-view">
        <p>Loading network topology...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="aegis-v2-view">
        <p>{error ?? "No network data available."}</p>
      </section>
    );
  }

  const activeNodes = data.nodes.filter((n) => n.state === "active").length;
  const warningNodes = data.nodes.filter((n) => n.state === "warning").length;
  const downNodes = data.nodes.filter((n) => n.state === "error").length;
  const upLinks = data.links.filter((l) => l.state === "up").length;
  const degradedLinks = data.links.filter((l) => l.state === "degraded").length;

  return (
    <section className="aegis-v2-view">
      <header className="aegis-v2-view-header">
        <div>
          <h1>Network Overview</h1>
          <p>
            Live topology, link health, and bandwidth from active nodes.
            {lastRefreshed ? (
              <span style={{ marginLeft: "0.5rem", opacity: 0.6, fontSize: "0.75rem" }}>
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            ) : null}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="cm-btn" onClick={() => void load()} disabled={loading} title="Refresh topology">
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="aegis-v2-panels">
        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Wifi size={14} /> Node Summary
            </h3>
          </header>
          <div className="aegis-v2-stats">
            <div>
              <span>Active</span>
              <strong className="ok">{activeNodes}</strong>
            </div>
            <div>
              <span>Warning</span>
              <strong className={warningNodes > 0 ? "warn" : undefined}>{warningNodes}</strong>
            </div>
            <div>
              <span>Offline</span>
              <strong className={downNodes > 0 ? "warn" : undefined}>{downNodes}</strong>
            </div>
            <div>
              <span>Gateway IP</span>
              <strong>{data.gatewayIp}</strong>
            </div>
          </div>
        </article>

        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Activity size={14} /> Link Health
            </h3>
          </header>
          <div className="aegis-v2-stats">
            <div>
              <span>Up Links</span>
              <strong className="ok">{upLinks}</strong>
            </div>
            <div>
              <span>Degraded</span>
              <strong className={degradedLinks > 0 ? "warn" : undefined}>{degradedLinks}</strong>
            </div>
            <div>
              <span>Avg Latency</span>
              <strong>{data.averageLatencyMs} ms</strong>
            </div>
            <div>
              <span>Total Bandwidth</span>
              <strong>{formatBandwidth(data.totalBandwidthBps)}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="aegis-v2-panels" style={{ marginTop: "1rem" }}>
        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Network size={14} /> Node Topology
            </h3>
          </header>
          <table className="cm-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>IP</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((node) => (
                <tr key={node.id}>
                  <td>{node.name}</td>
                  <td>{node.ip}</td>
                  <td>{node.role}</td>
                  <td className={node.state === "active" ? "ok" : node.state === "warning" ? "warn" : "muted"}>
                    {node.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="aegis-v2-panel">
          <header>
            <h3>
              <Activity size={14} /> Inter-Node Links
            </h3>
          </header>
          <table className="cm-table">
            <thead>
              <tr>
                <th>Source → Target</th>
                <th>Latency</th>
                <th>Bandwidth</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {data.links.map((link) => (
                <tr key={`${link.source}-${link.target}`}>
                  <td>
                    {data.nodes.find((n) => n.id === link.source)?.name ?? link.source}
                    {" → "}
                    {data.nodes.find((n) => n.id === link.target)?.name ?? link.target}
                  </td>
                  <td>{link.state === "down" ? "--" : `${link.latencyMs} ms`}</td>
                  <td>{link.state === "down" ? "--" : formatBandwidth(link.bandwidthBps)}</td>
                  <td className={link.state === "up" ? "ok" : link.state === "degraded" ? "warn" : "muted"}>
                    {link.state}
                  </td>
                </tr>
              ))}
              {data.links.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No inter-node links found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
