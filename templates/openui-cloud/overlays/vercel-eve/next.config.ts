import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Next 16.3 + Vercel's adapter skips next-server.js.nft.json when standalone
  // is on; Vercel ignores standalone anyway. Keep it for Docker / self-host.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    turbopackMinify: false,
  },
};

export default withEve(nextConfig);
