// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ← これで “workspace root を誤認” 警告を抑止
  turbopack: { root: __dirname },
}

export default nextConfig
