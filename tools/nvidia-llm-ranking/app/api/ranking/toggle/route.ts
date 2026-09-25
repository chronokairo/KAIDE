import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const dataDir = path.resolve(process.cwd(), "data");
const togglePath = path.resolve(dataDir, "nvidia-tool-toggle.json");

type ToggleFile = { disabledModels: string[] };

async function readToggleFile(): Promise<ToggleFile> {
  try {
    const raw = await readFile(togglePath, "utf-8");
    const parsed = JSON.parse(raw) as ToggleFile;
    return { disabledModels: Array.isArray(parsed?.disabledModels) ? parsed.disabledModels : [] };
  } catch {
    return { disabledModels: [] };
  }
}

function normalizeModelId(model: string): string {
  return model.trim();
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { model?: string; enabled?: boolean }
    | null;
  const model = body?.model?.trim();
  const enabled = body?.enabled;

  if (!model || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const normalized = normalizeModelId(model);
  const current = await readToggleFile();
  const set = new Set(current.disabledModels.map(normalizeModelId).filter(Boolean));

  if (enabled) set.delete(normalized);
  else set.add(normalized);

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    togglePath,
    JSON.stringify({ disabledModels: Array.from(set).sort() }, null, 2),
    "utf-8",
  );

  return NextResponse.json({
    ok: true,
    model: normalized,
    enabled,
    disabled_models: Array.from(set).sort(),
  });
}
