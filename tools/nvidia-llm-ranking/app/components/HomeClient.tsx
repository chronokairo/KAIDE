// @ts-nocheck
"use client";

import { useEffect, useState } from "react";

// ── Context window size lookup ─────────────────────────────────────────────────
// Used as fallback when context_size is not present in ranking data

function getContextSize(modelId: string, storedSize?: number | null): string {
  // Prefer API/benchmark-sourced value persisted in the ranking JSON
  if (storedSize && storedSize > 0) {
    if (storedSize >= 1_000_000) return `${(storedSize / 1_000_000).toFixed(storedSize % 1_000_000 === 0 ? 0 : 1)}M`;
    return `${Math.round(storedSize / 1024)}K`;
  }
  // Pattern-based fallback
  const id = (modelId || "").toLowerCase();
  if (id.includes("llama-4")) return "10M";
  if (id.includes("deepseek-v4") || id.includes("deepseek_v4")) return "1M";
  if (id.includes("gemini-2") || id.includes("gemini-1.5-pro")) return "1M";
  if (id.includes("gemini-1.5-flash")) return "1M";
  if (id.includes("claude")) return "200K";
  if (
    id.includes("llama-3") || id.includes("llama3") ||
    id.includes("gpt-4o") || id.includes("gpt-4-turbo") ||
    id.includes("mistral-large") || id.includes("mistral-nemo") ||
    id.includes("mixtral-8x22") || id.includes("deepseek") ||
    id.includes("qwen") || id.includes("nemotron") ||
    id.includes("phi-4") || id.includes("phi-3.5") || id.includes("phi-3-mini-128") ||
    id.includes("glm-") || id.includes("gemma-3")
  )
    return "128K";
  if (id.includes("mixtral") || id.includes("mistral-7") || id.includes("mistral-small")) return "32K";
  if (id.includes("gemma-2")) return "8K";
  if (id.includes("gpt-3.5")) return "16K";
  return "128K";
}

type VisionCheck = {
  supported: boolean;
  ms: number | null;
  reason: string | null;
};

type EffortCheck = {
  supported: boolean;
  mechanism: string | null;
  passed: number;
  total: number;
  all_passed: boolean;
  results: Record<string, { ok: boolean; ms: number; error?: string }>;
};

type RankingModel = {
  model: string;
  company: string;
  tier: string;
  context_size: number | null;
  available: boolean;
  latency_ms: number | null;
  score: number;
  tool_check_passed: boolean;
  tool_check_reason: string | null;
  effort_check: EffortCheck | null;
  vision_check: VisionCheck | null;
  quarantined: boolean;
  removed: boolean;
  disabled_by_toggle: boolean;
};

type RankingPayload = {
  generated_at: string;
  best_model: RankingModel | null;
  top_vision_models: { id: string; company: string; tier: string; score: number }[];
  models: RankingModel[];
  models_by_company: {
    company: string;
    best_model: RankingModel | null;
    models: RankingModel[];
  }[];
  possible_models_to_remove: { model: string; reason: string }[];
  disabled_models: string[];
};

export default function HomePage() {
  const [data, setData] = useState<RankingPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkLogs, setBenchmarkLogs] = useState<string>("");
  const [togglingModel, setTogglingModel] = useState<string | null>(null);

  function renderEffortCell(ec: EffortCheck | null | undefined): string {
    if (!ec || !ec.supported) return "—";
    const mechShort: Record<string, string> = {
      reasoning_effort: "RE",
      chat_template: "CT",
      system_prompt: "SP",
    };
    const short = ec.mechanism ? (mechShort[ec.mechanism] ?? ec.mechanism) : "?";
    const levels = ["low", "medium", "high"]
      .map((l) => (ec.results?.[l]?.ok ? "✓" : "✗"))
      .join(" ");
    return `${short} ${ec.passed}/${ec.total} [${levels}]`;
  }

  async function loadRanking() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ranking", { cache: "no-store" });
      if (!res.ok) throw new Error(`Falha ao carregar ranking (${res.status})`);
      const json = (await res.json()) as RankingPayload;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function runBenchmark() {
    setRunning(true);
    setError(null);
    setBenchmarkLogs("");
    try {
      const res = await fetch("/api/ranking/run", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Falha no benchmark (${res.status})`);
      }

      if (!res.body) throw new Error("Sem stream de benchmark.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let exitCode = 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const event = JSON.parse(trimmed) as {
            type: "start" | "log" | "done";
            message?: string;
            stream?: "stdout" | "stderr";
            code?: number;
          };

          if (event.type === "done") {
            exitCode = event.code ?? 1;
            continue;
          }

          const prefix = event.stream === "stderr" ? "[erro] " : "";
          const message = event.message ?? "";
          setBenchmarkLogs((prev) => `${prev}${prefix}${message}\n`);
        }
      }

      if (exitCode !== 0) {
        throw new Error("Benchmark finalizado com erro.");
      }
      await loadRanking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setRunning(false);
    }
  }

  async function toggleToolFailedModel(model: string, enabled: boolean) {
    setTogglingModel(model);
    setError(null);
    try {
      const res = await fetch("/api/ranking/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, enabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Falha ao atualizar toggle.");
      }
      await loadRanking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setTogglingModel(null);
    }
  }

  useEffect(() => {
    void loadRanking();
  }, []);

  // Use disabled_models (toggle file) as source of truth — guarantees full list
  const disabledModelIds = data?.disabled_models ?? [];
  const modelsById = new Map((data?.models ?? []).map((m) => [m.model, m]));
  const disabledModels = disabledModelIds.map((id) => modelsById.get(id) ?? {
    model: id,
    company: id.includes("/") ? id.split("/")[0] : "unknown",
    tier: "DISABLED",
    available: false,
    latency_ms: null,
    score: -700,
    tool_check_passed: false,
    tool_check_reason: "Disabled by toggle",
    quarantined: false,
    removed: false,
    disabled_by_toggle: true,
  } as RankingModel);
  const companiesSortedByWorkingModels = [...(data?.models_by_company ?? [])].sort((a, b) => {
    const aWorking = a.models.filter((m) => m.available && m.tool_check_passed && !m.disabled_by_toggle).length;
    const bWorking = b.models.filter((m) => m.available && m.tool_check_passed && !m.disabled_by_toggle).length;
    if (aWorking !== bWorking) return bWorking - aWorking;
    return a.company.localeCompare(b.company);
  });

  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>Empresas</h3>
        {companiesSortedByWorkingModels.map((group) => {
          const workingCount = group.models.filter(
            (m) => m.available && m.tool_check_passed && !m.disabled_by_toggle,
          ).length;
          return (
            <details key={group.company} className="dropdown" open>
              <summary>
                {group.company}{" "}
                <span className="muted">
                  ({workingCount} funcionando{group.best_model ? ` · best: ${group.best_model.model}` : ""})
                </span>
              </summary>
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Score</th>
                    <th>Tier</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {group.models.map((item) => (
                    <tr key={`${group.company}:${item.model}`}>
                      <td>{item.model}</td>
                      <td>{item.score.toFixed(0)}</td>
                      <td>{item.tier}</td>
                      <td>{getContextSize(item.model, item.context_size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
      </aside>

      <main>
        <h1>NVIDIA Model Ranking</h1>
        <p className="muted">App Next.js independente para recomendar automaticamente o melhor modelo.</p>

        <div className="actions">
          <button disabled={loading || running} onClick={loadRanking}>
            {loading ? "Atualizando..." : "Atualizar ranking"}
          </button>
          <button disabled={loading || running} onClick={runBenchmark}>
            {running ? "Executando benchmark..." : "Rodar benchmark NVIDIA"}
          </button>
        </div>

        {error ? <p>{error}</p> : null}

        {benchmarkLogs ? (
          <div className="card">
            <strong>Benchmark em tempo real</strong>
            <pre className="logs">{benchmarkLogs}</pre>
          </div>
        ) : null}

        {data?.best_model ? (
          <div className="card">
            <strong>Melhor modelo agora:</strong>{" "}
            <span className="ok">
              {data.best_model.model} (Tier {data.best_model.tier}, score {data.best_model.score.toFixed(3)})
            </span>
            <div className="muted">Atualizado em {new Date(data.generated_at).toLocaleString("pt-BR")}</div>
          </div>
        ) : null}

        {(data?.top_vision_models?.length ?? 0) > 0 ? (
          <div className="card">
            <strong>Top modelos com Vision ({data!.top_vision_models.length})</strong>
            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Empresa</th>
                  <th>Tier</th>
                  <th>Score</th>
                  <th>Context</th>
                </tr>
              </thead>
              <tbody>
                {data!.top_vision_models.map((m) => (
                  <tr key={`vision:${m.id}`}>
                    <td>{m.id}</td>
                    <td>{m.company}</td>
                    <td>{m.tier}</td>
                    <td>{m.score.toFixed(0)}</td>
                    <td>{getContextSize(m.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Modelo</th>
                <th>Tier</th>
                <th>Context</th>
                <th>Disponivel</th>
                <th>Tool test</th>
                <th>Vision</th>
                <th>Thinking</th>
                <th>Latencia (ms)</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.models ?? []).filter((m) => m.tool_check_passed && !m.disabled_by_toggle).map((item) => (
                <tr key={item.model}>
                  <td>{item.company}</td>
                  <td>{item.model}</td>
                  <td>{item.tier}</td>
                  <td>{getContextSize(item.model, item.context_size)}</td>
                  <td>{item.available ? "Sim" : "Nao"}</td>
                  <td>{item.tool_check_passed ? "OK" : "Falhou"}</td>
                  <td title={item.vision_check?.reason ?? ""}>{item.vision_check?.supported ? "✓" : "—"}</td>
                  <td title={item.effort_check?.mechanism ?? ""}>{renderEffortCell(item.effort_check)}</td>
                  <td>{item.latency_ms ?? "-"}</td>
                  <td>{item.score.toFixed(3)}</td>
                  <td>{item.removed ? "Remover" : item.quarantined ? "Quarentena" : "Ativo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <aside className="secondary-sidebar">
        <h3>Desativados ({disabledModelIds.length})</h3>
        {disabledModels.length > 0 ? (
          <table className="compact-table">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>ON/OFF</th>
              </tr>
            </thead>
            <tbody>
              {disabledModels.map((item) => (
                <tr key={`disabled:${item.model}`}>
                  <td>{item.model}</td>
                  <td>
                    <button
                      disabled={togglingModel === item.model || running}
                      onClick={() => void toggleToolFailedModel(item.model, true)}
                    >
                      OFF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Nenhum modelo desativado.</p>
        )}
      </aside>
    </div>
  );
}
