"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Shield, ShieldCheck } from "lucide-react";
import { DashboardPolicyRule, PolicyDashboardData } from "@/entities/dashboard/model/types";
import {
  createDashboardPolicyRule,
  getDashboardPolicyRules,
  getPolicyDashboard,
  setDashboardPolicyRuleEnabled,
} from "@/shared/api/dashboard-client";

export function PolicySafetyScreen() {
  const [data, setData] = useState<PolicyDashboardData | null>(null);
  const [rules, setRules] = useState<DashboardPolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toneFilter, setToneFilter] = useState<"all" | "safe" | "blocked">("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);

  async function loadData() {
    try {
      const [nextData, nextRules] = await Promise.all([
        getPolicyDashboard({ page, pageSize, tone: toneFilter }),
        getDashboardPolicyRules(),
      ]);
      setData(nextData);
      setRules(nextRules);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load policy data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [page, pageSize, toneFilter]);

  async function handleAddPolicy() {
    setActionLoading(true);
    try {
      await createDashboardPolicyRule();
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create policy rule");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRule(ruleId: string, enabled: boolean) {
    setActionLoading(true);
    try {
      await setDashboardPolicyRuleEnabled(ruleId, enabled);
      await loadData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update policy rule");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="aegis-v2-view">
        <p>Loading policy actions...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="aegis-v2-view">
        <p>{error ?? "No policy data available."}</p>
      </section>
    );
  }

  return (
    <section className="aegis-v2-view">
      <header className="aegis-v2-view-header">
        <div>
          <h1>Policy &amp; Safety</h1>
          <p>Real-time validation and deterministic execution controls.</p>
        </div>
        <div className="aegis-v2-view-actions">
          <span className="cm-chip">
            <ShieldCheck size={12} /> Shield: Enforced
          </span>
          <button type="button" className="cm-button ghost" onClick={handleAddPolicy} disabled={actionLoading}>
            <Shield size={14} /> {actionLoading ? "Adding..." : "Add Policy"}
          </button>
        </div>
      </header>

      <div className="aegis-v2-panels two-col">
        <article className="aegis-v2-panel">
          <header>
            <h3>Action Validation Stream</h3>
          </header>
          <table className="cm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Command</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map((item) => (
                <tr key={`${item.timestamp}-${item.command}`}>
                  <td>{item.timestamp}</td>
                  <td>{item.command}</td>
                  <td>{item.source}</td>
                  <td className={item.tone === "safe" ? "ok" : "warn"}>{item.status}</td>
                </tr>
              ))}
              {data.actions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No actions for selected filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <footer className="cm-table-footer">
            <span>Showing {data.actions.length} of {data.totalActions} actions</span>
            <div>
              <select
                value={toneFilter}
                onChange={(event) => {
                  setPage(1);
                  setToneFilter(event.target.value as "all" | "safe" | "blocked");
                }}
              >
                <option value="all">All actions</option>
                <option value="safe">Safe</option>
                <option value="blocked">Blocked</option>
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
                disabled={page * pageSize >= data.totalActions}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </article>

        <article className="aegis-v2-panel">
          <header>
            <h3>
              <AlertTriangle size={14} /> Security Summary
            </h3>
          </header>
          <div className="aegis-v2-stats">
            <div>
              <span>Critical Rules</span>
              <strong>{data.summary.criticalRules}</strong>
            </div>
            <div>
              <span>Allowed Actions</span>
              <strong>{data.summary.allowedActions.toLocaleString()}</strong>
            </div>
            <div>
              <span>Blocked Violations</span>
              <strong>{data.summary.blockedViolations}</strong>
            </div>
            <div>
              <span>Policy Health</span>
              <strong>{data.summary.policyHealth}</strong>
            </div>
          </div>

          <table className="cm-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Severity</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.title}</td>
                  <td>{rule.severity}</td>
                  <td>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        disabled={actionLoading}
                        onChange={(event) => void handleToggleRule(rule.id, event.target.checked)}
                      />
                      {rule.enabled ? "enabled" : "disabled"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
