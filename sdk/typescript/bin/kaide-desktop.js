import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(here, '..', '..', '..', 'apps', 'desktop');
const mode = process.argv[2] === 'build' ? 'build' : 'dev';

// O @tauri-apps/cli vive em apps/web (devDependencies). Executa o Tauri
// com cwd em apps/desktop, onde está o tauri.conf.json.
const result = spawnSync(
  'npm',
  ['--prefix', path.resolve(desktopDir, '..', 'web'), 'exec', '--', 'tauri', mode],
  { stdio: 'inherit', cwd: desktopDir },
);
process.exit(result.status ?? 1);
