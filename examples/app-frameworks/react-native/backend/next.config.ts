import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // This example has no eslint setup; don't fail `next build` on the missing binary.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
