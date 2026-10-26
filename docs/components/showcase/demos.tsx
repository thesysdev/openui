import { EXAMPLES_REPO_URL } from "@/lib/examples-catalog";
import { labProjects } from "@/lib/lab-projects";
import { SITE_NAV_LINKS } from "@/lib/site-nav-links";
import { LinkCardGrid, ShowcaseGrid, type ShowcaseItem } from "./cards";

const PLAYGROUND: ShowcaseItem[] = [
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
    tagline: "Tokens",
    description:
      "Generate UI from a prompt and watch OpenUI Lang stream against JSON, with up to 67% fewer tokens.",
    image: { light: "/nav/vsjson-light.webp", dark: "/nav/vsjson-dark.webp" },
    links: [{ label: "Open demo", href: "/openui-vs-json" }],
  },
];

export function Playground() {
  return <ShowcaseGrid items={PLAYGROUND} clickable />;
}

const FEATURED_PROJECTS: ShowcaseItem[] = [
  {
    name: "Open Intelligent UI",
    tagline: "Interactive answers",
    description:
      "An open-source recreation of ChatGPT’s Intelligent UI experience, with maps, photographs, and editable itineraries rendered with OpenUI.",
    // The final frame of the homepage KALLAX demo (public/homepage/agents).
    image: {
      light: "/nav/open-intelligent-ui-light.png",
      dark: "/nav/open-intelligent-ui-dark.png",
    },
    links: [
      { label: "Open demo", href: SITE_NAV_LINKS.openIntelligentUi.href, external: true },
      { label: "GitHub", href: "https://github.com/thesysdev/open-intelligent-ui", external: true },
    ],
  },
  {
    name: "F1 Dashboard",
    tagline: "Live race data",
    description:
      "Ask about any race, driver or team and get charts, tables and timing from OpenF1, next to live standings dashboards.",
    image: { light: "/nav/f1-dashboard-light.webp", dark: "/nav/f1-dashboard-dark.webp" },
    links: [
      { label: "Open demo", href: SITE_NAV_LINKS.f1Dashboard.href },
      { label: "GitHub", href: "https://github.com/thesysdev/openui-f1-dashboard", external: true },
    ],
  },
  {
    name: "Trip Planner",
    tagline: "Travel agent",
    description:
      "Plan a trip as visual spreads, a day-by-day itinerary on a map, a moodboard and a journal, with live hotel prices from trivago.",
    image: { light: "/nav/trip-planner-light.webp", dark: "/nav/trip-planner-dark.webp" },
    links: [
      { label: "Open demo", href: SITE_NAV_LINKS.tripPlanner.href },
      { label: "GitHub", href: "https://github.com/thesysdev/openui-trip-planner", external: true },
    ],
  },
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
    name: "AppLess",
    tagline: "Phone OS concept",
    description:
      "An experimental phone with no apps. Ask for what you need and OpenUI streams a native interface for it on iOS and Android.",
    image: { light: "/nav/appless-light.webp", dark: "/nav/appless-dark.webp" },
    links: [
      { label: "Website", href: SITE_NAV_LINKS.appless.href },
      { label: "GitHub", href: "https://github.com/thesysdev/appless", external: true },
    ],
  },
];

export function FeaturedProjects() {
  return <ShowcaseGrid items={FEATURED_PROJECTS} clickable />;
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
      clickable
      items={projects.map((project) => ({
        name: project.name,
        description: project.description,
        tag: project.type,
        links: project.links.map((link) => ({ ...link, external: true })),
      }))}
    />
  );
}
