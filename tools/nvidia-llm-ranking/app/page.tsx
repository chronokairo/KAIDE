"use client";

import { useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "llm-ranking-theme";

function getContextSize(modelId: string, storedSize?: number | null): string {
  if (storedSize && storedSize > 0) {
    if (storedSize >= 1_000_000) {
      return `${(storedSize / 1_000_000).toFixed(storedSize % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    return `${Math.round(storedSize / 1024)}K`;
  }

  const id = (modelId || "").toLowerCase();
  if (id.includes("llama-4")) return "10M";
  if (id.includes("deepseek-v4") || id.includes("deepseek_v4")) return "1M";
  if (id.includes("gemini-2") || id.includes("gemini-1.5-pro")) return "1M";
  if (id.includes("gemini-1.5-flash")) return "1M";
  if (id.includes("claude")) return "200K";
  if (
    id.includes("llama-3") ||
    id.includes("llama3") ||
    id.includes("gpt-4o") ||
    id.includes("gpt-4-turbo") ||
    id.includes("mistral-large") ||
    id.includes("mistral-nemo") ||
    id.includes("mixtral-8x22") ||
    id.includes("deepseek") ||
    id.includes("qwen") ||
    id.includes("nemotron") ||
    id.includes("phi-4") ||
    id.includes("phi-3.5") ||
    id.includes("phi-3-mini-128") ||
    id.includes("glm-") ||
    id.includes("gemma-3")
  ) {
    return "128K";
  }
  if (id.includes("mixtral") || id.includes("mistral-7") || id.includes("mistral-small")) return "32K";
  if (id.includes("gemma-2")) return "8K";
  if (id.includes("gpt-3.5")) return "16K";
  return "128K";
}

function formatLatency(ms: number | null | undefined): string {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "—";
  return `${Math.round(ms)} ms`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function getCompanyInitials(company: string): string {
  const cleaned = company
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return cleaned || company.slice(0, 2).toUpperCase() || "??";
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

type TopVisionModel = {
  id: string;
  company: string;
  tier: string;
  score: number;
};

type RankingPayload = {
  generated_at: string;
  best_model: RankingModel | null;
  top_vision_models: TopVisionModel[];
  models: RankingModel[];
  models_by_company: {
    company: string;
    best_model: RankingModel | null;
    models: RankingModel[];
  }[];
  possible_models_to_remove: { model: string; reason: string }[];
  disabled_models: string[];
};

type ThemeMode = "light" | "dark";

function getTierClassName(tier: string): string {
  const normalized = tier.toUpperCase();
  return ["S", "A", "B", "C", "DISABLED"].includes(normalized) ? `tier-${normalized}` : "tier-C";
}

function getStatusMeta(model: RankingModel): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  if (model.disabled_by_toggle) return { label: "Desativado", tone: "neutral" };
  if (model.removed) return { label: "Remover", tone: "danger" };
  if (model.quarantined) return { label: "Quarentena", tone: "warning" };
  if (!model.available) return { label: "Instavel", tone: "warning" };
  return { label: "Pronto", tone: "success" };
}

function renderEffortCell(effortCheck: EffortCheck | null | undefined): string {
  if (!effortCheck || !effortCheck.supported) return "Thinking indisponivel";

  const mechanismShort: Record<string, string> = {
    reasoning_effort: "RE",
    chat_template: "CT",
    system_prompt: "SP",
  };

  const mechanism = effortCheck.mechanism ? (mechanismShort[effortCheck.mechanism] ?? effortCheck.mechanism) : "?";
  return `${mechanism} ${effortCheck.passed}/${effortCheck.total}`;
}

export default function HomePage() {
  const [data, setData] = useState<RankingPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkLogs, setBenchmarkLogs] = useState<string>("");
  const [togglingModel, setTogglingModel] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("dark");

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
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
        return;
      }

      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage failures and keep the current in-memory theme.
    }
  }, [theme]);

  useEffect(() => {
    void loadRanking();
  }, []);

  const modelsById = useMemo(() => new Map((data?.models ?? []).map((model) => [model.model, model])), [data?.models]);

  const disabledModels = useMemo(
    () =>
      (data?.disabled_models ?? []).map((id) =>
        modelsById.get(id) ?? {
          model: id,
          company: id.includes("/") ? id.split("/")[0] : "unknown",
          tier: "DISABLED",
          context_size: null,
          available: false,
          latency_ms: null,
          score: -700,
          tool_check_passed: false,
          tool_check_reason: "Disabled by toggle",
          effort_check: null,
          vision_check: null,
          quarantined: false,
          removed: false,
          disabled_by_toggle: true,
        },
      ),
    [data?.disabled_models, modelsById],
  );

  const activeModels = useMemo(
    () =>
      (data?.models ?? [])
        .filter((model) => model.tool_check_passed && !model.disabled_by_toggle)
        .sort((a, b) => b.score - a.score),
    [data?.models],
  );

  const watchlistModels = useMemo(
    () =>
      (data?.possible_models_to_remove ?? []).filter(
        (item, index, list) => list.findIndex((current) => current.model === item.model) === index,
      ),
    [data?.possible_models_to_remove],
  );

  const companiesSortedByWorkingModels = useMemo(
    () =>
      [...(data?.models_by_company ?? [])].sort((a, b) => {
        const aWorking = a.models.filter((model) => model.available && model.tool_check_passed && !model.disabled_by_toggle)
          .length;
        const bWorking = b.models.filter((model) => model.available && model.tool_check_passed && !model.disabled_by_toggle)
          .length;
        if (aWorking !== bWorking) return bWorking - aWorking;
        return a.company.localeCompare(b.company);
      }),
    [data?.models_by_company],
  );

  const visionReadyModels = useMemo(
    () => activeModels.filter((model) => model.vision_check?.supported),
    [activeModels],
  );

  const workingCompanies = useMemo(
    () => companiesSortedByWorkingModels.filter((group) => group.models.some((model) => model.tool_check_passed)).length,
    [companiesSortedByWorkingModels],
  );

  const fastestModel = useMemo(
    () =>
      [...activeModels]
        .filter((model) => typeof model.latency_ms === "number")
        .sort((a, b) => (a.latency_ms ?? Number.POSITIVE_INFINITY) - (b.latency_ms ?? Number.POSITIVE_INFINITY))[0] ??
      null,
    [activeModels],
  );

  const benchmarkLineCount = benchmarkLogs.trim() ? benchmarkLogs.trim().split("\n").length : 0;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span className="eyebrow">Catalogo</span>
            <h2>Empresas</h2>
          </div>
          <span className="metric-chip">{workingCompanies}</span>
        </div>

        <div className="sidebar-stack">
          {companiesSortedByWorkingModels.map((group) => {
            const companyModels = [...group.models]
              .filter((model) => !model.disabled_by_toggle)
              .sort((a, b) => b.score - a.score);
            const activeCount = companyModels.filter((model) => model.available && model.tool_check_passed).length;

            return (
              <section key={group.company} className="company-card">
                <div className="company-card-header">
                  <span className="company-badge">{getCompanyInitials(group.company)}</span>

                  <div className="company-meta">
                    <div className="company-name">{group.company}</div>
                    <div className="company-subtitle">
                      {activeCount} prontos
                      {group.best_model ? ` · best ${group.best_model.tier}` : ""}
                    </div>
                  </div>

                  {group.best_model ? (
                    <span className={`tier-badge ${getTierClassName(group.best_model.tier)}`}>
                      {group.best_model.tier}
                    </span>
                  ) : null}
                </div>

                <div className="company-models">
                  {companyModels.slice(0, 4).map((model) => (
                    <div key={`${group.company}:${model.model}`} className="company-model-row">
                      <div className="company-model-name" title={model.model}>
                        {model.model}
                      </div>
                      <div className="company-model-meta">
                        <span>{getContextSize(model.model, model.context_size)}</span>
                        <span>{model.score.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </aside>

      <main className="main-content">
        <section className="card hero-card">
          <div className="hero-topline">
            <span className="eyebrow">NVIDIA ranking intelligence</span>
            <div className="hero-flags">
              <span className={`status-badge ${running ? "status-info" : "status-neutral"}`}>
                {running ? "Benchmark em execucao" : "Snapshot pronto"}
              </span>
              <span className={`status-badge ${loading ? "status-warning" : "status-success"}`}>
                {loading ? "Atualizando" : "Sincronizado"}
              </span>
            </div>
          </div>

          <div className="hero-header">
            <div className="hero-copy">
              <h1>LLM Ranking Console</h1>
              <p>
                Compare disponibilidade, latencia real, tool calling, vision e thinking em uma dashboard limpa para
                decidir o modelo de producao mais confiavel.
              </p>
            </div>

            <div className="header-actions">
              <button className="btn" disabled={loading || running} onClick={() => void loadRanking()}>
                {loading ? "Atualizando..." : "Atualizar ranking"}
              </button>
              <button className="btn btn-primary" disabled={loading || running} onClick={() => void runBenchmark()}>
                {running ? "Executando benchmark..." : "Rodar benchmark"}
              </button>
              <button
                className="theme-toggle"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                type="button"
              >
                {theme === "dark" ? "Tema claro" : "Tema escuro"}
              </button>
            </div>
          </div>

          <div className="hero-meta-grid">
            <div className="inline-stat">
              <span className="inline-stat-label">Atualizado</span>
              <strong className="inline-stat-value">{formatDate(data?.generated_at)}</strong>
            </div>
            <div className="inline-stat">
              <span className="inline-stat-label">Recomendado</span>
              <strong className="inline-stat-value">{data?.best_model?.model ?? "—"}</strong>
            </div>
            <div className="inline-stat">
              <span className="inline-stat-label">Watchlist</span>
              <strong className="inline-stat-value">{watchlistModels.length}</strong>
            </div>
            <div className="inline-stat">
              <span className="inline-stat-label">Desativados</span>
              <strong className="inline-stat-value">{disabledModels.length}</strong>
            </div>
          </div>
        </section>

        {error ? <div className="message message-error">{error}</div> : null}

        <div className="stats-grid">
          <article className="card stat-card">
            <span className="stat-label">Modelos ativos</span>
            <strong className="stat-value">{activeModels.length}</strong>
            <span className="stat-helper">Tool calling aprovado e toggle ativo.</span>
          </article>

          <article className="card stat-card">
            <span className="stat-label">Vision ready</span>
            <strong className="stat-value">{visionReadyModels.length}</strong>
            <span className="stat-helper">Suporte multimodal confirmado no benchmark.</span>
          </article>

          <article className="card stat-card">
            <span className="stat-label">Empresas</span>
            <strong className="stat-value">{workingCompanies}</strong>
            <span className="stat-helper">Providers com pelo menos um modelo benchmarkado.</span>
          </article>

          <article className="card stat-card">
            <span className="stat-label">Mais rapido</span>
            <strong className="stat-value">{fastestModel ? formatLatency(fastestModel.latency_ms) : "—"}</strong>
            <span className="stat-helper">{fastestModel ? fastestModel.model : "Sem latencia disponivel."}</span>
          </article>
        </div>

        {data?.best_model ? (
          <section className="best-model-card">
            <div className="best-model-main">
              <span className="best-label">Recomendacao atual</span>
              <div className="best-name">{data.best_model.model}</div>
              <div className="best-meta">
                {data.best_model.company} · contexto {getContextSize(data.best_model.model, data.best_model.context_size)} ·
                p50 {formatLatency(data.best_model.latency_ms)}
              </div>
            </div>

            <div className="best-model-aside">
              <span className={`tier-badge ${getTierClassName(data.best_model.tier)}`}>Tier {data.best_model.tier}</span>
              <span className="score-pill">Score {data.best_model.score.toFixed(0)}</span>
            </div>

            <div className="best-tags">
              <span className="capability-pill capability-success">Tool OK</span>
              <span className={`capability-pill ${data.best_model.vision_check?.supported ? "capability-info" : "capability-neutral"}`}>
                {data.best_model.vision_check?.supported ? "Vision" : "Text only"}
              </span>
              <span className="capability-pill capability-neutral">{renderEffortCell(data.best_model.effort_check)}</span>
            </div>
          </section>
        ) : null}

        <div className="insights-grid">
          <section className="card">
            <div className="section-header">
              <div className="section-title-group">
                <h2>Leaders com vision</h2>
                <p>Melhores scores entre modelos com suporte multimodal real.</p>
              </div>
              <span className="section-count">{data?.top_vision_models?.length ?? 0}</span>
            </div>

            {(data?.top_vision_models?.length ?? 0) > 0 ? (
              <div className="vision-grid">
                {data!.top_vision_models.map((model) => {
                  const fullModel = modelsById.get(model.id);
                  return (
                    <article key={`vision:${model.id}`} className="vision-card">
                      <div className="vision-card-header">
                        <span className={`tier-badge ${getTierClassName(model.tier)}`}>{model.tier}</span>
                        <span className="score-pill">#{model.score.toFixed(0)}</span>
                      </div>

                      <div className="vision-model" title={model.id}>
                        {model.id}
                      </div>
                      <div className="vision-meta">{model.company}</div>

                      <div className="capability-list">
                        <span className="capability-pill capability-info">
                          {getContextSize(model.id, fullModel?.context_size)}
                        </span>
                        <span className="capability-pill capability-success">
                          {formatLatency(fullModel?.vision_check?.ms)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Nenhum modelo com vision validado no snapshot atual.</div>
            )}
          </section>

          <section className="logs-container">
            <div className="logs-header">
              <div>
                <div className="logs-title">Benchmark em tempo real</div>
                <div className="logs-subtitle">
                  {running
                    ? "Streaming ativo do benchmark NVIDIA."
                    : benchmarkLineCount > 0
                      ? `${benchmarkLineCount} linhas registradas na ultima execucao.`
                      : "Dispare um benchmark para acompanhar o stream ao vivo."}
                </div>
              </div>
              <span className={`status-badge ${running ? "status-info" : "status-neutral"}`}>
                {running ? "running" : "idle"}
              </span>
            </div>

            <div className="logs-body">
              {benchmarkLogs ? (
                <pre>{benchmarkLogs}</pre>
              ) : (
                <div className="logs-empty">
                  Os logs do benchmark aparecem aqui com stdout e stderr em streaming para facilitar triagem de falhas e
                  latencia.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="card">
          <div className="section-header">
            <div className="section-title-group">
              <h2>Ranking global</h2>
              <p>Somente modelos com tool calling aprovado e sem toggle OFF entram na lista principal.</p>
            </div>
            <span className="section-count">{activeModels.length} modelos</span>
          </div>

          {loading && !data ? (
            <div className="loading-grid">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : activeModels.length > 0 ? (
            <div className="table-wrapper">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Modelo</th>
                    <th>Empresa</th>
                    <th>Contexto</th>
                    <th>Capacidades</th>
                    <th>Latencia</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeModels.map((model, index) => {
                    const statusMeta = getStatusMeta(model);
                    return (
                      <tr key={model.model}>
                        <td className="rank-cell">#{index + 1}</td>
                        <td>
                          <div className="model-primary" title={model.model}>
                            {model.model}
                          </div>
                          <div className="model-secondary">
                            <span className="effort-tag">{renderEffortCell(model.effort_check)}</span>
                          </div>
                        </td>
                        <td>{model.company}</td>
                        <td>{getContextSize(model.model, model.context_size)}</td>
                        <td>
                          <div className="capability-list">
                            <span className="capability-pill capability-success">Tool</span>
                            <span
                              className={`capability-pill ${model.vision_check?.supported ? "capability-info" : "capability-neutral"}`}
                              title={model.vision_check?.reason ?? ""}
                            >
                              {model.vision_check?.supported ? "Vision" : "No vision"}
                            </span>
                            <span className="capability-pill capability-neutral">
                              {model.available ? "Disponivel" : "Instavel"}
                            </span>
                          </div>
                        </td>
                        <td className="latency-cell">{formatLatency(model.latency_ms)}</td>
                        <td className="score-cell">{model.score.toFixed(0)}</td>
                        <td>
                          <span className={`status-badge status-${statusMeta.tone}`}>{statusMeta.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Nenhum modelo pronto para o ranking principal.</div>
          )}
        </section>
      </main>

      <aside className="secondary-sidebar">
        <section className="card side-panel">
          <div className="section-header">
            <div className="section-title-group">
              <h2>Operacao</h2>
              <p>Visao rapida de saude do benchmark.</p>
            </div>
          </div>

          <div className="ops-grid">
            <div className="ops-stat">
              <span className="ops-label">Ativos</span>
              <strong>{activeModels.length}</strong>
            </div>
            <div className="ops-stat">
              <span className="ops-label">Watchlist</span>
              <strong>{watchlistModels.length}</strong>
            </div>
            <div className="ops-stat">
              <span className="ops-label">Desativados</span>
              <strong>{disabledModels.length}</strong>
            </div>
            <div className="ops-stat">
              <span className="ops-label">Vision</span>
              <strong>{visionReadyModels.length}</strong>
            </div>
          </div>
        </section>

        <section className="card side-panel">
          <div className="section-header">
            <div className="section-title-group">
              <h2>Watchlist</h2>
              <p>Modelos marcados para remocao ou triagem.</p>
            </div>
            <span className="section-count">{watchlistModels.length}</span>
          </div>

          {watchlistModels.length > 0 ? (
            <div className="side-list">
              {watchlistModels.map((item) => (
                <article key={`watch:${item.model}`} className="watch-item">
                  <div className="watch-model" title={item.model}>
                    {item.model}
                  </div>
                  <div className="watch-reason">{item.reason}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">Nenhum modelo em watchlist.</div>
          )}
        </section>

        <section className="card side-panel">
          <div className="section-header">
            <div className="section-title-group">
              <h2>Modelos desativados</h2>
              <p>Reative rapidamente modelos com toggle OFF.</p>
            </div>
            <span className="section-count">{disabledModels.length}</span>
          </div>

          {disabledModels.length > 0 ? (
            <div className="side-list">
              {disabledModels.map((model) => (
                <article key={`disabled:${model.model}`} className="disabled-item">
                  <div className="disabled-copy">
                    <div className="watch-model" title={model.model}>
                      {model.model}
                    </div>
                    <div className="watch-reason">Score {model.score.toFixed(0)} · {model.company}</div>
                  </div>

                  <button
                    className="btn btn-sm"
                    disabled={togglingModel === model.model || running}
                    onClick={() => void toggleToolFailedModel(model.model, true)}
                  >
                    {togglingModel === model.model ? "..." : "Reativar"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">Nenhum modelo desativado.</div>
          )}
        </section>
      </aside>
    </div>
  );
}
