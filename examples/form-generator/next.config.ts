import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@openuidev/react-headless", "@openuidev/react-lang"],
};

export default nextConfig;
