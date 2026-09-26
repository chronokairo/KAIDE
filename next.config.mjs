import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  outputFileTracingRoot: projectDirectory,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@chronokairo/platform'],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(projectDirectory, 'src'),
    };
    // O backend RAG legado usa imports ESM Node com extensão .js (resolvidos para .ts).
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
