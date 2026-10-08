import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// sdk/typescript/bin -> raiz do monorepo (sobe 3 níveis).
const repoRoot = path.resolve(here, '..', '..', '..');

const candidates = [
  process.env.KAIDE_BIN,
  path.join(repoRoot, 'kaide-rs', 'target', 'debug', 'kaide'),
  path.join(repoRoot, 'kaide-rs', 'target', 'release', 'kaide'),
].filter(Boolean);

const fromPath = spawnSync('where', ['kaide'], { encoding: 'utf8' });
const bin =
  candidates.find((p) => p && existsSync(p)) ??
  (fromPath.status === 0 ? 'kaide' : undefined);

if (!bin) {
  console.error(
    "[kaide-sdk] binário `kaide` não encontrado. Compile com `cargo build --manifest-path kaide-rs/Cargo.toml -p kaide --bin kaide` ou defina KAIDE_BIN.",
  );
  process.exit(1);
}

const result = spawnSync(bin, process.argv.slice(2), { stdio: 'inherit' });
process.exit(result.status ?? 1);
