import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Native CSS Modules in UI tests do not need the application Tailwind plugin.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Test runner executes backend modules; production still enforces server-only.
      // npm workspaces hoist node_modules to the monorepo root (ADR-0042).
      'server-only': fileURLToPath(new URL('../../node_modules/server-only/empty.js', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
  },
});
