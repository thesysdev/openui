import { withAui } from "@assistant-ui/next";
import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  // With THESYS_BASE_URL set, such as a local stack, the browser reaches it through this app's
  // origin, so it needs no CORS setup. The page tells the browser to do so.
  async rewrites() {
    const base = process.env.THESYS_BASE_URL?.replace(/\/+$/, "");
    return base ? [{ source: "/v1/:path*", destination: `${base}/v1/:path*` }] : [];
  },
};

// withAui compiles the "use generative" toolkit (src/lib/toolkit.tsx) into a server build with
// each tool's `execute` and a browser build with its `render`.
export default withAui(config);
