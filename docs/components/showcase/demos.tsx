import { EXAMPLES_REPO_URL } from "@/lib/examples-catalog";
import { labProjects } from "@/lib/lab-projects";
import { LinkCardGrid, ShowcaseGrid, type ShowcaseItem } from "./cards";

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

const FEATURED_PROJECTS: ShowcaseItem[] = [
  {
    name: "OpenClaw OS",
    tagline: "Agent workspace",
    description:
      "The default workspace for OpenClaw. Agents generate interactive apps and artifacts that stay updated with live data.",
    image: { light: "/nav/openclaw-light.webp", dark: "/nav/openclaw-dark.webp" },
    links: [
      { label: "Website", href: "/openclaw-os" },
      { label: "GitHub", href: "https://github.com/thesysdev/openclaw-os", external: true },
    ],
  },
  {
    name: "AppLess",
    tagline: "Phone OS concept",
    description:
      "An experimental phone with no apps. Ask for what you need and OpenUI streams a native interface for it on iOS and Android.",
    image: { light: "/nav/appless-light.webp", dark: "/nav/appless-dark.webp" },
    links: [{ label: "GitHub", href: "https://github.com/thesysdev/appless", external: true }],
  },
];

export function FeaturedProjects() {
  return <ShowcaseGrid items={FEATURED_PROJECTS} />;
}

export function CommunityProjects() {
  // Community work that was merged into `examples/` already has a card on the Integrations page.
  const projects = labProjects.filter(
    (project) =>
      project.status === "Community" &&
      !project.links.some((link) => link.href.startsWith(EXAMPLES_REPO_URL)),
  );

  return (
    <LinkCardGrid
      items={projects.map((project) => ({
        name: project.name,
        description: project.description,
        tag: project.type,
        links: project.links.map((link) => ({ ...link, external: true })),
      }))}
    />
  );
}
