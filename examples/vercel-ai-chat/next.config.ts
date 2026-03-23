import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-lang"],
};

export default nextConfig;
