import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const serverOnlyEmpty = path.join(path.dirname(require.resolve('server-only')), 'empty.js');

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Test runner executes backend modules; production still enforces server-only.
      'server-only': serverOnlyEmpty,
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
  },
});
