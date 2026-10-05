import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    turbopackMinify: false,
  },
};

export default withEve(nextConfig);
