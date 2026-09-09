import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ["@takumi-rs/image-response"],
  images: {
    /* Dense product screenshots contain small UI text and one-pixel rules.
       Keep the default for general imagery, but allow the illustration pair
       components to request a sharper responsive derivative. */
    qualities: [75, 95],
  },
  turbopack: {
    root: dirname(dirname(__dirname)),
  },

  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // /cloud was the OpenUI Cloud product page; its pitch now lives on the
      // home page, and the managed products have pages of their own. Temporary
      // while the marketing restructure settles — make it permanent once the
      // home page has actually absorbed the cloud sections.
      {
        source: "/cloud",
        destination: "/",
        permanent: false,
      },
      {
        source: "/AGENTS.md",
        destination: "/",
        permanent: true,
      },
      {
        source: "/skills.md",
        destination: "https://github.com/thesysdev/skills/blob/main/skills/openui/SKILL.md",
        permanent: false,
      },
      {
        source: "/components/blocks/accordian",
        destination: "/components/blocks/accordion",
        permanent: true,
      },
      {
        source: "/docs/design-system/blocks/accordian",
        destination: "/docs/design-system/blocks/accordion",
        permanent: true,
      },
      {
        source: "/docs/overview",
        destination: "/docs",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/how-it-works",
        destination: "/docs/openui-lang/architecture",
        permanent: true,
      },
      {
        source: "/docs/agent",
        destination: "/docs/agent/getting-started/introduction",
        permanent: true,
      },
      ...["assistant-ui", "copilotkit"].map((integration) => ({
        source: `/docs/agent/${integration}`,
        destination: `/docs/build-agents/${integration}`,
        permanent: true,
      })),
      {
        source: "/docs/agent/build-your-own-ui",
        destination: "/docs/build-agents/custom-chat-ui",
        permanent: true,
      },
      {
        source: "/docs/agent/vercel-ai-sdk",
        destination: "/docs/agent/agent-runtimes/vercel-ai-sdk",
        permanent: true,
      },
      {
        source: "/docs/agent/langchain",
        destination: "/docs/agent/agent-runtimes/langgraph-platform",
        permanent: true,
      },
      {
        source: "/docs/agent/harnesses/:path*",
        destination: "/docs/agent/agent-runtimes/:path*",
        permanent: true,
      },
      {
        source: "/docs/integrations",
        destination: "/docs/build-agents",
        permanent: true,
      },
      ...["assistant-ui", "copilotkit"].map((integration) => ({
        source: `/docs/integrations/${integration}`,
        destination: `/docs/build-agents/${integration}`,
        permanent: true,
      })),
      {
        source: "/docs/integrations/build-your-own-ui",
        destination: "/docs/build-agents/custom-chat-ui",
        permanent: true,
      },
      {
        source: "/docs/integrations/vercel-ai-sdk",
        destination: "/docs/agent/agent-runtimes/vercel-ai-sdk",
        permanent: true,
      },
      {
        source: "/docs/integrations/langchain",
        destination: "/docs/agent/agent-runtimes/langgraph-platform",
        permanent: true,
      },
      {
        source: "/docs/integrations/harnesses/:path*",
        destination: "/docs/agent/agent-runtimes/:path*",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/agent-frameworks/vercel-ai-sdk",
        destination: "/docs/agent/agent-runtimes/vercel-ai-sdk",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/agent-frameworks/langchain",
        destination: "/docs/agent/agent-runtimes/langgraph-platform",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/agent-frameworks/langgraph-platform",
        destination: "/docs/agent/agent-runtimes/langgraph-platform",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/agent-frameworks/vercel-eve",
        destination: "/docs/agent/agent-runtimes/vercel-eve",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/harnesses/pi",
        destination: "/docs/agent/agent-runtimes/pi",
        permanent: true,
      },
      {
        source: "/docs/openui-lang/examples/app-frameworks/react-native",
        destination: "/docs/openui-lang",
        permanent: true,
      },
      {
        source: "/docs/agent/getting-started/openui-cloud",
        destination: "/docs/agent/getting-started/quickstart",
        permanent: true,
      },
      {
        source: "/docs/agent/agent-interface",
        destination: "/docs/agent/getting-started/introduction",
        permanent: true,
      },
      {
        source: "/docs/agent/agent-interface/:path*",
        destination: "/docs/agent/:path*",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/get-started",
        destination: "/docs/gateway/generate-openui-lang",
        permanent: true,
      },
      {
        source: "/docs/gateway/quickstart",
        destination: "/docs/gateway/generate-openui-lang",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/how-it-works",
        destination: "/docs/gateway",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/production-readiness",
        destination: "/docs/gateway/reliability",
        permanent: true,
      },
      {
        source: "/docs/gateway/reliability/error-correction",
        destination: "/docs/gateway/reliability",
        permanent: true,
      },
      {
        source: "/docs/gateway/reliability/provider-fallbacks",
        destination: "/docs/gateway/reliability",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/models-and-byok",
        destination: "/docs/gateway/models",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/api/chat-completions",
        destination: "/docs/gateway/api/chat-completions",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/api/responses",
        destination: "/docs/gateway/api/responses",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/api/conversations",
        destination: "/docs/gateway/api/conversations",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud",
        destination: "/docs/gateway",
        permanent: true,
      },
      {
        source: "/docs/openui-cloud/:path*",
        destination: "/docs/gateway",
        permanent: true,
      },
      {
        source: "/docs/add-ons",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/add-ons",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/ecosystem",
        destination: "/lab",
        permanent: false,
      },
      {
        source: "/registry",
        destination: "/lab",
        permanent: false,
      },
      // Nav rename: Playground -> Demos, Projects -> Lab. Keep the old
      // paths working for external links and search results.
      // Product rename: Paste → Debug. Keep the old path working.
      {
        source: "/paste",
        destination: "/debug",
        permanent: true,
      },
      {
        source: "/playground",
        destination: "/demos",
        permanent: true,
      },
      {
        source: "/projects",
        destination: "/lab",
        permanent: true,
      },
      {
        source: "/showcase",
        destination: "/lab",
        permanent: true,
      },
      {
        source: "/blog/should-chat-be-the-new-homepage-for-saas",
        destination: "/blog/beyond-the-chatbar",
        permanent: true,
      },
      // Preserve the founder-shared singular spelling while keeping one
      // canonical benchmark namespace for search engines and agents.
      {
        source: "/benchmark/framework",
        destination: "/benchmarks/framework",
        permanent: true,
      },
      {
        source: "/benchmark/language",
        destination: "/benchmarks/language",
        permanent: true,
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
