import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker standalone build — produces a minimal self-contained
  // server bundle under .next/standalone that can be run with `node server.js`.
  output: "standalone",
};

export default nextConfig;
