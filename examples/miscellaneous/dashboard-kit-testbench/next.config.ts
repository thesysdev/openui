import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  experimental: {
    turbopackMinify: false,
  },
};

export default nextConfig;
