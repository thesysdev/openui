import { ShowcaseGrid, type ShowcaseItem } from "./cards";

const DEMOS: ShowcaseItem[] = [
  {
    name: "OpenUI Chat",
    tagline: "Chat assistant",
    description:
      "A ChatGPT-like assistant powered by OpenUI Cloud. Start a live conversation or replay a curated one.",
    image: { light: "/nav/chat-light.webp", dark: "/nav/chat-dark.webp" },
    links: [{ label: "Open demo", href: "/chat" }],
  },
  {
    name: "AI Dashboards",
    tagline: "Live GitHub data",
    description:
      "Enter a GitHub username and ask questions about their activity. Each answer is an interactive dashboard.",
    image: { light: "/nav/dashboard-light.webp", dark: "/nav/dashboard-dark.webp" },
    links: [{ label: "Open demo", href: "/demo/github" }],
  },
  {
    name: "Compare",
    tagline: "Side by side",
    description:
      "See the same answers rendered as Markdown, with OpenUI OSS, and with OpenUI Cloud, side by side.",
    image: { light: "/nav/compare-light.webp", dark: "/nav/compare-dark.webp" },
    links: [{ label: "Open demo", href: "/compare" }],
  },
  {
    name: "OpenUI vs JSON",
    tagline: "Playground",
    description:
      "Generate UI from a prompt and watch OpenUI Lang stream against JSON, with up to 67% fewer tokens.",
    image: { light: "/nav/vsjson-light.webp", dark: "/nav/vsjson-dark.webp" },
    links: [{ label: "Open demo", href: "/openui-vs-json" }],
  },
];

export function Demos() {
  return <ShowcaseGrid items={DEMOS} />;
}
