import { existsSync } from 'node:fs';
import path from 'node:path';

export const KAIDE_VERSION = '0.1.0';

/**
 * Resolve o caminho do binário `kaide` (workspace `kaide-rs/`, crate `kaide`).
 * Ordem: `KAIDE_BIN` → `kaide-rs/target/debug/kaide` →
 * `kaide-rs/target/release/kaide` → fallback `'kaide'` (PATH).
 */
export function resolveKaideBin(repoRoot: string): string {
  const candidates = [
    process.env.KAIDE_BIN,
    path.join(repoRoot, 'kaide-rs', 'target', 'debug', 'kaide'),
    path.join(repoRoot, 'kaide-rs', 'target', 'release', 'kaide'),
  ].filter((p): p is string => typeof p === 'string' && p.length > 0);

  return candidates.find((p) => existsSync(p)) ?? 'kaide';
}
