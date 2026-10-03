import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const apiDir = path.join(rootDir, 'src', 'app', 'api');
const tempDir = path.join(rootDir, 'src', 'app', '_api_temp');

console.log('[Tauri Build] Preparando export estático do Next.js...');

let renamed = false;

function restore() {
  if (renamed && fs.existsSync(tempDir)) {
    console.log('[Tauri Build] Restaurando src/app/api...');
    fs.renameSync(tempDir, apiDir);
    renamed = false;
  }
}

// Garante restauração mesmo em caso de SIGINT ou SIGTERM
process.on('SIGINT', () => {
  restore();
  process.exit(1);
});
process.on('SIGTERM', () => {
  restore();
  process.exit(1);
});

try {
  if (fs.existsSync(apiDir)) {
    console.log('[Tauri Build] Isolando temporariamente rotas de API para static export...');
    fs.renameSync(apiDir, tempDir);
    renamed = true;
  }

  console.log('[Tauri Build] Executando next build...');
  execSync('npx cross-env TAURI_BUILD=true next build --webpack', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, TAURI_BUILD: 'true' },
  });

  console.log('[Tauri Build] Static export concluído com sucesso em out/!');
} catch (error) {
  console.error('[Tauri Build] Erro durante o build estático:', error);
  process.exitCode = 1;
} finally {
  restore();
}
