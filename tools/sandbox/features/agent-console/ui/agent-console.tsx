"use client";

import { FormEvent } from "react";
import { Activity, Play, Shield } from "lucide-react";
import { AgentMode } from "@/entities/agent/model/types";
import { useAgentConsole } from "@/features/agent-console/model/use-agent-console";

export function AgentConsole() {
  const {
    prompt,
    setPrompt,
    mode,
    setMode,
    dryRun,
    setDryRun,
    loading,
    error,
    response,
    terminalText,
    runPrompt,
  } = useAgentConsole();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runPrompt();
  }

  return (
    <section className="aegis-v2-view">
      <header className="aegis-v2-view-header">
        <div>
          <h1>Agent Runtime Console</h1>
          <p>Plan, validate, and execute prompts under policy constraints.</p>
        </div>
        <div className="aegis-v2-view-actions">
          <span className="cm-chip">
            <Activity size={12} /> Runtime: Live
          </span>
          <span className="cm-chip">
            <Shield size={12} /> Policy: {response?.policy.allowed ? "Allowed" : "Restricted"}
          </span>
        </div>
      </header>

      <div className="aegis-v2-panels two-col">
        <article className="aegis-v2-panel">
          <header>
            <h3>Prompt Input</h3>
          </header>
          <form onSubmit={handleSubmit} className="aegis-v2-form">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              required
              placeholder="Describe the task for the agent..."
            />

            <div className="aegis-v2-form-row">
              <select value={mode} onChange={(event) => setMode(event.target.value as AgentMode)}>
                <option value="debian">Debian (safe)</option>
                <option value="ubuntu">Ubuntu (dev)</option>
                <option value="nixos">NixOS (declarative)</option>
              </select>

              <label>
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
                Dry run
              </label>

              <button type="submit" className="cm-button" disabled={loading}>
                <Play size={14} /> {loading ? "Running..." : "Run Agent"}
              </button>
            </div>

            {error ? <p className="aegis-v2-error">{error}</p> : null}
          </form>
        </article>

        <article className="aegis-v2-panel">
          <header>
            <h3>Terminal Stream</h3>
          </header>
          <pre className="aegis-v2-terminal">{terminalText}</pre>
        </article>
      </div>
    </section>
  );
}
