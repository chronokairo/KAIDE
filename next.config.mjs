import path from 'path';
import { fileURLToPath } from 'url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  outputFileTracingRoot: projectDirectory,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(projectDirectory, 'src'),
    };
    return config;
  },
};

export default nextConfig;
