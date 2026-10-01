import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  // Keep the Next.js dev badge out of the sidebar's bottom-left corner.
  devIndicators: { position: "top-right" },
};

export default config;
