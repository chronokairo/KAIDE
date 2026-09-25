"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Boxes,
  Grid2x2,
  HelpCircle,
  Network,
  Plus,
  Search,
  Settings,
  Shield,
  TerminalSquare,
  Timer,
} from "lucide-react";
import { AgentConsole } from "@/features/agent-console/ui/agent-console";
import {
  getDashboardNotifications,
  getDashboardSettings,
  initializeDashboardNodes,
  searchDashboard,
} from "@/shared/api/dashboard-client";
import { ContainerManagerScreen } from "@/widgets/container-manager/ui/container-manager-screen";
import { DashboardOverviewScreen } from "@/widgets/dashboard/ui/dashboard-overview-screen";
import { NetworkOverviewScreen } from "@/widgets/dashboard/ui/network-overview-screen";
import { PolicySafetyScreen } from "@/widgets/policy-safety/ui/policy-safety-screen";

type Screen = "dashboard" | "containers" | "network" | "security" | "logs";

export function DashboardShell() {
  const [activeScreen, setActiveScreen] = useState<Screen>("containers");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSummary, setSearchSummary] = useState<string | null>(null);

  async function handleInitializeAllNodes() {
    setInitializing(true);
    setStatusMessage(null);

    try {
      const result = await initializeDashboardNodes();
      setStatusMessage(`Initialized ${result.initialized} nodes.`);
    } catch (caught) {
      setStatusMessage(caught instanceof Error ? caught.message : "Failed to initialize nodes.");
    } finally {
      setInitializing(false);
    }
  }

  async function handleSearchSubmit() {
    const query = searchQuery.trim();
    if (!query) {
      setSearchSummary("Type a query to search nodes, rules, and actions.");
      return;
    }

    try {
      const result = await searchDashboard(query);
      setSearchSummary(
        `Found ${result.nodes.length} node(s), ${result.rules.length} rule(s), ${result.actions.length} action(s).`,
      );
    } catch (caught) {
      setSearchSummary(caught instanceof Error ? caught.message : "Search failed.");
    }
  }

  async function handleNotificationsClick() {
    try {
      const items = await getDashboardNotifications();
      setStatusMessage(items.map((item) => item.message).join(" | "));
    } catch (caught) {
      setStatusMessage(caught instanceof Error ? caught.message : "Failed to load notifications.");
    }
  }

  async function handleSettingsClick() {
    try {
      const settings = await getDashboardSettings();
      setStatusMessage(
        `Node ${settings.runtime.nodeVersion} on ${settings.runtime.platform} | rules ${settings.policy.enabledRules}/${settings.policy.totalRules}`,
      );
    } catch (caught) {
      setStatusMessage(caught instanceof Error ? caught.message : "Failed to load settings.");
    }
  }

  const screen = useMemo(() => {
    if (activeScreen === "dashboard") {
      return <DashboardOverviewScreen />;
    }

    if (activeScreen === "network") {
      return <NetworkOverviewScreen />;
    }

    if (activeScreen === "security") {
      return <PolicySafetyScreen />;
    }

    if (activeScreen === "logs") {
      return <AgentConsole />;
    }

    return <ContainerManagerScreen />;
  }, [activeScreen]);

  return (
    <div className="aegis-v2-shell">
      <header className="aegis-v2-topbar">
        <div className="aegis-v2-topbar-left">
          <span className="aegis-v2-logo">AegisOS</span>
          <div className="aegis-v2-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search system resources..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearchSubmit();
                }
              }}
            />
            <button type="button" onClick={handleSearchSubmit} aria-label="Run search">Go</button>
            <span>CTRL+K</span>
          </div>
        </div>

        <div className="aegis-v2-topbar-right">
          <div className="aegis-v2-top-icons">
            <button type="button" aria-label="Terminal" onClick={() => setActiveScreen("logs")}>
              <TerminalSquare size={16} />
            </button>
            <button type="button" aria-label="Notifications" onClick={handleNotificationsClick}>
              <Bell size={16} />
              <i />
            </button>
            <button type="button" aria-label="Settings" onClick={handleSettingsClick}>
              <Settings size={16} />
            </button>
          </div>

          <div className="aegis-v2-user">
            <div>
              <p>Administrator</p>
              <span>ROOT_NODE_01</span>
            </div>
            <div className="aegis-v2-avatar" />
          </div>
        </div>
      </header>

      <aside className="aegis-v2-sidebar">
        <div className="aegis-v2-sidebar-brand">
          <div>
            <div className="aegis-v2-status-dot" />
            <h2>Aegis Sentinel</h2>
            <p>v4.2.0-stable</p>
          </div>
        </div>

        <nav className="aegis-v2-sidebar-nav">
          <button
            type="button"
            onClick={() => setActiveScreen("dashboard")}
            className={activeScreen === "dashboard" ? "active" : ""}
          >
            <Grid2x2 size={15} /> Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("containers")}
            className={activeScreen === "containers" ? "active" : ""}
          >
            <Boxes size={15} /> Containers
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("network")}
            className={activeScreen === "network" ? "active" : ""}
          >
            <Network size={15} /> Network
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("security")}
            className={activeScreen === "security" ? "active" : ""}
          >
            <Shield size={15} /> Security
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen("logs")}
            className={activeScreen === "logs" ? "active" : ""}
          >
            <TerminalSquare size={15} /> Logs
          </button>
        </nav>

        <div className="aegis-v2-sidebar-footer">
          <button type="button" onClick={handleInitializeAllNodes} disabled={initializing}>
            <Plus size={14} /> {initializing ? "Initializing..." : "Initialize All Nodes"}
          </button>
          {statusMessage ? <p style={{ margin: "0.45rem 0 0", color: "#9fb7dd", fontSize: "0.62rem" }}>{statusMessage}</p> : null}
          {searchSummary ? <p style={{ margin: "0.35rem 0 0", color: "#7db6ff", fontSize: "0.62rem" }}>{searchSummary}</p> : null}
          <div>
            <span>
              <HelpCircle size={12} /> Support
            </span>
            <span>
              <Timer size={12} /> Uptime
            </span>
          </div>
        </div>
      </aside>

      <main className="aegis-v2-main">{screen}</main>
    </div>
  );
}
