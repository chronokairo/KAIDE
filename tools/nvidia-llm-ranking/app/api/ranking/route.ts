import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const rankingPath = path.resolve(process.cwd(), "data/nvidia-ranking.latest.json");
const togglePath  = path.resolve(process.cwd(), "data/nvidia-tool-toggle.json");

type RawRankingModel = {
  id: string;
  company?: string;
  tier: string;
  availability: number;
  score: number;
  contextSize?: number;
  latencyMs?: { p50?: number | null };
  toolCheck?: { passed?: boolean; reason?: string | null };
  effortCheck?: {
    supported?: boolean;
    mechanism?: string | null;
    passed?: number;
    total?: number;
    allPassed?: boolean;
    results?: Record<string, { ok: boolean; ms: number; error?: string }>;
  };
  visionCheck?: { supported?: boolean; ms?: number; reason?: string | null };
  quarantined?: boolean;
  removed?: boolean;
  disabledByToggle?: boolean;
};
type RawRemovalCandidate = { id: string; reason?: string };
type RawCompanyGroup = {
  company: string;
  recommendedModel?: string | null;
  models?: RawRankingModel[];
};

async function readDisabledSet(): Promise<Set<string>> {
  try {
    const raw = await readFile(togglePath, "utf-8");
    const parsed = JSON.parse(raw) as { disabledModels?: string[] };
    return new Set((parsed.disabledModels ?? []).map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function normalizeModel(m: RawRankingModel, disabledSet: Set<string>) {
  return {
    model: m.id,
    company: m.company ?? "unknown",
    tier: m.tier,
    context_size: m.contextSize ?? null,
    available: m.availability > 0,
    latency_ms: m.latencyMs?.p50 ?? null,
    score: m.score,
    tool_check_passed: Boolean(m.toolCheck?.passed),
    tool_check_reason: m.toolCheck?.reason ?? null,
    effort_check: m.effortCheck
      ? {
          supported: Boolean(m.effortCheck.supported),
          mechanism: m.effortCheck.mechanism ?? null,
          passed: m.effortCheck.passed ?? 0,
          total: m.effortCheck.total ?? 3,
          all_passed: Boolean(m.effortCheck.allPassed),
          results: m.effortCheck.results ?? {},
        }
      : null,
    vision_check: m.visionCheck
      ? {
          supported: Boolean(m.visionCheck.supported),
          ms: m.visionCheck.ms ?? null,
          reason: m.visionCheck.reason ?? null,
        }
      : null,
    quarantined: Boolean(m.quarantined),
    removed: Boolean(m.removed),
    // always reflect the live toggle file, not the stale ranking snapshot
    disabled_by_toggle: disabledSet.has(m.id.trim()),
  };
}

export async function GET() {
  try {
    const [raw, disabledSet] = await Promise.all([
      readFile(rankingPath, "utf-8"),
      readDisabledSet(),
    ]);

    const json = JSON.parse(raw) as {
      generatedAt?: string | null;
      recommendedModel?: string | null;
      topVisionModels?: { id: string; company: string; tier: string; score: number }[];
      models?: RawRankingModel[];
      modelsByCompany?: RawCompanyGroup[];
      possibleModelsToRemove?: RawRemovalCandidate[];
      disabledModels?: string[];
    };

    // Models that were actually benchmarked
    const benchmarkedModels = (json.models ?? []).map((m) => normalizeModel(m, disabledSet));

    // Models only in toggle file (were skipped in benchmark, not in ranking JSON)
    const benchmarkedIds = new Set(benchmarkedModels.map((m) => m.model));
    const toggleOnlyModels = Array.from(disabledSet)
      .filter((id) => !benchmarkedIds.has(id))
      .sort()
      .map((id) => {
        const company = id.includes("/") ? id.split("/")[0] : "unknown";
        return {
          model: id,
          company,
          tier: "DISABLED",
          context_size: null,
          available: false,
          latency_ms: null,
          score: -700,
          tool_check_passed: false,
          tool_check_reason: "Disabled by toggle",
          quarantined: false,
          removed: false,
          disabled_by_toggle: true,
        };
      });

    const allModels = [...benchmarkedModels, ...toggleOnlyModels];
    allModels.sort((a, b) => b.score - a.score);

    const bestModelId = json.recommendedModel;
    const bestModel = benchmarkedModels.find((m) => m.model === bestModelId) ?? null;

    // Rebuild modelsByCompany merging toggle-only entries
    const byCompany = new Map<string, typeof allModels>();
    for (const m of allModels) {
      const list = byCompany.get(m.company) ?? [];
      list.push(m);
      byCompany.set(m.company, list);
    }
    const rankingCompanyOrder = new Map(
      (json.modelsByCompany ?? []).map((g, i) => [g.company, i])
    );
    const modelsByCompany = Array.from(byCompany.entries())
      .sort(([a], [b]) => {
        const ai = rankingCompanyOrder.get(a) ?? 9999;
        const bi = rankingCompanyOrder.get(b) ?? 9999;
        return ai !== bi ? ai - bi : a.localeCompare(b);
      })
      .map(([company, models]) => {
        const rankingGroup = (json.modelsByCompany ?? []).find((g) => g.company === company);
        const best = models.find((m) => m.model === rankingGroup?.recommendedModel) ?? null;
        return { company, best_model: best, models };
      });

    return NextResponse.json({
      generated_at: json.generatedAt ?? new Date(0).toISOString(),
      best_model: bestModel,
      top_vision_models: json.topVisionModels ?? [],
      models: allModels,
      models_by_company: modelsByCompany,
      possible_models_to_remove: (json.possibleModelsToRemove ?? []).map((m) => ({
        model: m.id,
        reason: m.reason ?? "Sem motivo informado",
      })),
      disabled_models: Array.from(disabledSet).sort(),
    });
  } catch {
    return NextResponse.json(
      {
        generated_at: new Date(0).toISOString(),
        best_model: null,
        top_vision_models: [],
        models: [],
        models_by_company: [],
        possible_models_to_remove: [],
        disabled_models: [],
      },
      { status: 200 },
    );
  }
}
