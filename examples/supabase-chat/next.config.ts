import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless"],
};

export default nextConfig;
