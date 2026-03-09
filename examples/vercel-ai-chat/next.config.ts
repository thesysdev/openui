import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: [
    "@openuidev/react-ui",
    "@openuidev/react-headless",
    "@openuidev/lang-react",
  ],
};

export default nextConfig;
