"use client";

import { useMemo, useState } from "react";
import { AgentMode, AgentRunResult } from "@/entities/agent/model/types";
import { sendAgentRequest } from "@/shared/api/agent-client";

export function useAgentConsole() {
  const [prompt, setPrompt] = useState("Set up a FastAPI server with Python");
  const [mode, setMode] = useState<AgentMode>("ubuntu");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentRunResult | null>(null);

  const terminalText = useMemo(() => {
    if (!response) {
      return [
        "AegisOS Terminal Stream",
        "",
        "No execution yet.",
        "Send a prompt from the chat panel to preview or run a plan.",
      ].join("\n");
    }

    const lines: string[] = [];
    lines.push(`mode: ${response.mode}`);
    lines.push(`dryRun: ${response.dryRun}`);
    lines.push(`policyAllowed: ${response.policy.allowed}`);
    lines.push("");
    lines.push("[plan]");
    lines.push(response.plan.summary);

    for (const step of response.plan.steps) {
      lines.push(`- ${step.id}: ${step.description}`);
      lines.push(`  $ ${step.command}`);
    }

    if (!response.policy.allowed) {
      lines.push("");
      lines.push("[policy_denied]");
      for (const check of response.policy.checks) {
        if (!check.allowed) {
          lines.push(`blocked: ${check.command}`);
          lines.push(`reason: ${check.reason ?? "unknown"}`);
        }
      }
      return lines.join("\n");
    }

    if (response.dryRun) {
      lines.push("");
      lines.push("[preview_only]");
      lines.push("Commands were validated but not executed.");
      return lines.join("\n");
    }

    lines.push("");
    lines.push("[execution]");
    for (const result of response.results) {
      lines.push(`$ ${result.command}`);
      lines.push(`exit=${result.code} duration=${result.durationMs}ms`);
      if (result.stdout.trim()) {
        lines.push(result.stdout.trim());
      }
      if (result.stderr.trim()) {
        lines.push(`[stderr] ${result.stderr.trim()}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }, [response]);

  async function runPrompt() {
    setLoading(true);
    setError(null);

    try {
      const result = await sendAgentRequest({
        prompt,
        mode,
        dryRun,
      });
      setResponse(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return {
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
  };
}
