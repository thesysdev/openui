import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@openuidev/react-ui",
    "@openuidev/react-headless",
    "@openuidev/react-lang",
    "@openuidev/react-email",
  ],
};

export default nextConfig;
