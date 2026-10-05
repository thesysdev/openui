import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  // Ship the OpenF1 snapshot (gitignored) with the server functions when deployed.
  outputFileTracingIncludes: { "/api/**": ["./data/**"] },
};

export default config;
