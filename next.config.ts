// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 既存の設定があればそのまま残す
  transpilePackages: ["recharts"],   // ← これを追加
};

export default nextConfig;
