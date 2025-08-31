/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },    // ← Lint エラーで落とさない
  typescript: { ignoreBuildErrors: true }, // ← TS 型エラーで落とさない
};
export default nextConfig;
