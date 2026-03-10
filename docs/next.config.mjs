import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ["@takumi-rs/image-response"],
  transpilePackages: ["@openuidev/react-ui", "@openuidev/react-lang"],
  turbopack: {
    root: dirname(dirname(__dirname)),
  },

  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/introduction",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
};

export default withMDX(config);
