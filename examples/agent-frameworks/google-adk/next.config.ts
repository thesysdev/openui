import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    turbopackMinify: false,
  },
  // @google/adk is a Node.js library; keep it out of the client/server bundle
  // so it loads from node_modules at runtime in the Node.js API route.
  serverExternalPackages: ["@google/adk"],
};

export default nextConfig;
