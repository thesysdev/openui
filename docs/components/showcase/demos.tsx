import { DEMO_CONVERSATIONS } from "@/app/chat/_components/demo-conversations";
import { LinkCardGrid, ShowcaseGrid, type LinkCardItem, type ShowcaseItem } from "./cards";

const FEATURED_DEMOS: ShowcaseItem[] = [
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
    links: [{ label: "Open demo", href: "/demos/openui-vs-json" }],
  },
];

const DEVELOPER_TOOLS: LinkCardItem[] = [
  {
    name: "Debug",
    tag: "Live tool",
    description:
      "Paste OpenUI Lang, pick any published lang-core version, and replay it as a simulated LLM stream to see what renders.",
    links: [{ label: "Open Debug", href: "/debug" }],
  },
  {
    name: "Inspect",
    tag: "Package",
    description:
      "Add the Inspect panel to your app to watch OpenUI streams, parse errors, and events in real time.",
    links: [{ label: "Read the guide", href: "/docs/openui-lang/developer-tools#inspect" }],
  },
];

export function FeaturedDemos() {
  return <ShowcaseGrid items={FEATURED_DEMOS} />;
}

/** Curated OpenUI Chat conversations, read from the same list the chat replays. */
export function ChatDemos() {
  return (
    <LinkCardGrid
      items={DEMO_CONVERSATIONS.map((conversation) => ({
        name: conversation.title,
        description: conversation.description,
        links: [{ label: "Open conversation", href: `/chat/demo/${conversation.slug}` }],
      }))}
    />
  );
}

export function DeveloperTools() {
  return <LinkCardGrid items={DEVELOPER_TOOLS} />;
}
