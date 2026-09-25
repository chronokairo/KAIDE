// @chronokairo/sdk/node — Node.js-only exports (filesystem, process, crypto).
// Do NOT import this from renderer/webview code.

// ─── Provider configuration (~/.kairos.json) ─────────────────────────────────
export type { KairosConfig } from './src/entities/provider/providerConfig.js'
export {
  readKairosConfig,
  writeKairosConfig,
  readProviderApiKeys,
  writeProviderApiKey,
  syncSelectedProvider,
} from './src/entities/provider/providerConfig.js'
