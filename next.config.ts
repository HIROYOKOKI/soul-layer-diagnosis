// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  eslint: { ignoreDuringBuilds: true }, // ← これを追加
}

export default nextConfig
