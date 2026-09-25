import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless"],
  experimental: {
    turbopackMinify: false,
  },
};

export default nextConfig;
