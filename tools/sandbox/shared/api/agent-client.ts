import { AgentRequest, AgentRunResult } from "@/entities/agent/model/types";

export async function sendAgentRequest(payload: AgentRequest): Promise<AgentRunResult> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as AgentRunResult | { error: string };
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to call /api/agent");
  }

  return data;
}
