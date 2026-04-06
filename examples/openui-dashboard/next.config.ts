import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless", "@openuidev/react-lang"],
};

export default nextConfig;
