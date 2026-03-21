import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-headless", "@openuidev/react-lang"],
};

export default nextConfig;
