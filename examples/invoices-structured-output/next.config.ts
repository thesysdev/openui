import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openuidev/structured-output"],
  serverExternalPackages: ["openai"],
};

export default nextConfig;
