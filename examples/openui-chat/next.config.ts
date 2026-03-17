import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  output: 'standalone',
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless", "@openuidev/react-lang"],
};

export default nextConfig;
