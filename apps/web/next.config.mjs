import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  outputFileTracingRoot: projectDirectory,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack(config, { isServer }) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(projectDirectory, 'src'),
    };
    // O backend RAG legado usa imports ESM Node com extensão .js (resolvidos para .ts).
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    // Prevent client bundle from trying to resolve Node builtins used by CLI adapters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        util: false,
        fs: false,
        path: false,
      };
      config.externals = config.externals || [];
      config.externals.push({
        'node:child_process': 'commonjs node:child_process',
        'node:util': 'commonjs node:util',
      });
    }
    return config;
  },
};

export default nextConfig;
