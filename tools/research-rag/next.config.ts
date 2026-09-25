import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['ollama', 'systeminformation', 'lowdb'],
}

export default nextConfig
