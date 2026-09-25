// ─── Kairos provider configuration ───────────────────────────────────────────
// Shared read/write access to ~/.kairos.json — the single source of truth for
// provider API keys, selected provider and other Kairos-specific settings.
//
// All surfaces (VS Code, App, CLI) must use this module so that configuring
// a provider in one surface is immediately visible in the others.
//
// Migration: on first read we auto-migrate providerApiKeys + selectedProvider
// from ~/.code.json (the legacy Claude Code config) when ~/.kairos.json does
// not yet exist.
//
// Node.js only — never import this from renderer/webview code.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface KairosConfig {
  /** Active provider id (e.g. "groq", "nvidia", "github-copilot"). */
  selectedProvider?: string;
  /**
   * Provider API keys keyed by provider id (e.g. { groq: "gsk_..." }).
   * Passed as env vars to the kairos CLI subprocess.
   */
  providerApiKeys?: Record<string, string>;
  /** Any other fields written by surfaces are preserved as-is. */
  [key: string]: unknown;
}

const KAIROS_CONFIG = '.kairos.json';
const LEGACY_CONFIG = '.code.json';

function configPath(): string {
  return path.join(os.homedir(), KAIROS_CONFIG);
}

function legacyConfigPath(): string {
  return path.join(os.homedir(), LEGACY_CONFIG);
}

/** Read and parse ~/.kairos.json. Returns {} on missing/malformed file. */
export function readKairosConfig(): KairosConfig {
  const p = configPath();

  // Auto-migrate from ~/.code.json on first use.
  if (!fs.existsSync(p)) {
    const legacy = legacyConfigPath();
    if (fs.existsSync(legacy)) {
      try {
        const raw = JSON.parse(fs.readFileSync(legacy, 'utf8')) as KairosConfig;
        const migrated: KairosConfig = {};
        if (raw.selectedProvider) migrated.selectedProvider = raw.selectedProvider;
        if (raw.providerApiKeys) migrated.providerApiKeys = raw.providerApiKeys;
        fs.writeFileSync(p, JSON.stringify(migrated, null, 2), 'utf8');
        return migrated;
      } catch {
        // Migration is best-effort.
      }
    }
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as KairosConfig;
  } catch {
    return {};
  }
}

/** Merge-write a partial config into ~/.kairos.json. Thread-unsafe but fine for interactive use. */
export function writeKairosConfig(patch: Partial<KairosConfig>): void {
  try {
    const current = readKairosConfig();
    const next = { ...current, ...patch };
    // Deep-merge providerApiKeys instead of replacing.
    if (patch.providerApiKeys && current.providerApiKeys) {
      next.providerApiKeys = { ...current.providerApiKeys, ...patch.providerApiKeys };
    }
    fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8');
  } catch {
    // Best-effort.
  }
}

/** Convenience: read just the provider API keys map. */
export function readProviderApiKeys(): Record<string, string> {
  return readKairosConfig().providerApiKeys ?? {};
}

/**
 * Save a single provider API key to ~/.kairos.json.
 * @param provider  Provider id, e.g. "groq", "openai", "nvidia"
 * @param apiKey    The API key value (pass empty string to remove)
 */
export function writeProviderApiKey(provider: string, apiKey: string): void {
  const keys = readProviderApiKeys();
  if (apiKey) {
    keys[provider] = apiKey;
  } else {
    delete keys[provider];
  }
  writeKairosConfig({ providerApiKeys: keys });
}

/**
 * Splits a "provider/model" string, persists `selectedProvider` in
 * ~/.kairos.json, and returns the bare model id for passing to --model.
 *
 * Returns the original string unchanged if there is no "/" prefix.
 */
export function syncSelectedProvider(modelSetting: string | undefined): string | undefined {
  if (!modelSetting?.trim()) return undefined;
  const trimmed = modelSetting.trim();
  const slash = trimmed.indexOf('/');
  if (slash <= 0) return trimmed;

  const provider = trimmed.slice(0, slash);
  const bareModel = trimmed.slice(slash + 1);

  const current = readKairosConfig();
  if (current.selectedProvider !== provider) {
    writeKairosConfig({ selectedProvider: provider });
  }
  return bareModel;
}
