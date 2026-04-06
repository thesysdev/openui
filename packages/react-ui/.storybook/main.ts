import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-onboarding",
    "@storybook/core-events",
    "@storybook/blocks",
  ],
  framework: "@storybook/react-vite",
  features: {},
  previewHead: (head) => `
  ${head}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css">
  <link
      href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,100..900;1,100..900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Figtree:ital,wght@0,300..900;1,300..900&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Manrope:wght@200..800&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Playfair:ital,opsz,wght@0,5..1200,300..900;1,5..1200,300..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  `,
  previewBody: (body) => `
    ${body}
    <style>
      body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #1B1C1D;
      }
    </style>
  `,
  viteFinal: async (config) => {
    return mergeConfig(config, {
      server: {
        allowedHosts: [".trycloudflare.com", "127.0.0.1", "localhost"],
      },
      base: "/ui/",
      resolve: {
        alias: {
          "@openuidev/react-headless": path.resolve(__dirname, "../../react-headless/src/index.ts"),
          "@openuidev/react-lang": path.resolve(__dirname, "../../react-lang/src/index.ts"),
          "@openuidev/lang-core": path.resolve(__dirname, "../../lang-core/src/index.ts"),
        },
      },
      optimizeDeps: {
        exclude: ["@openuidev/react-headless", "@openuidev/react-lang", "@openuidev/lang-core"],
        include: ["react", "react-dom"],
      },
      build: {
        commonjsOptions: {
          include: [/@openuidev\/react-headless/, /node_modules/],
        },
      },
    });
  },
};
export default config;
