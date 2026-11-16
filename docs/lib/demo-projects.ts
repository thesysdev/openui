import type { ShowcaseItem } from "@/components/showcase/cards";
import { SITE_NAV_LINKS } from "@/lib/site-nav-links";

/** Official demos and playgrounds on the Demos page. */

export const PLAYGROUND: ShowcaseItem[] = [
  {
    name: "Compare",
    demoId: "compare",
    tagline: "Side by side",
    description:
      "See the same answers rendered as Markdown, with OpenUI OSS, and with OpenUI Cloud, side by side.",
    image: { light: "/nav/compare-light.webp", dark: "/nav/compare-dark.webp" },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.compare.href }],
  },
  {
    name: "OpenUI vs JSON",
    demoId: "vs-json",
    tagline: "Tokens",
    description:
      "Generate UI from a prompt and watch OpenUI Lang stream against JSON, with up to 67% fewer tokens.",
    image: { light: "/nav/vsjson-light.webp", dark: "/nav/vsjson-dark.webp" },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.openuiVsJson.href }],
  },
];

export const FEATURED_PROJECTS: ShowcaseItem[] = [
  {
    name: "Sales Dashboard",
    demoId: "sales-dashboard",
    templateRepo: "thesysdev/openui-sales-dashboard",
    tagline: "Live sales data",
    description: "Turn sales data into a live dashboard with charts, tables and KPIs.",
    image: {
      light: "/nav/sales-dashboard-light.webp",
      dark: "/nav/sales-dashboard-dark.webp",
    },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.salesDashboard.href }],
  },
  {
    name: "Open Intelligent UI",
    demoId: "intelligent-ui",
    templateRepo: "thesysdev/open-intelligent-ui",
    tagline: "Interactive answers",
    description: "Ask a question. Get maps, charts and tools you can use.",
    // The final frame of the homepage KALLAX demo (public/homepage/agents).
    image: {
      light: "/nav/open-intelligent-ui-light.png",
      dark: "/nav/open-intelligent-ui-dark.png",
    },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.openIntelligentUi.href, external: true }],
  },
  {
    name: "AppLess",
    demoId: "appless",
    tagline: "Phone OS concept",
    description: "Explore a phone interface generated from your requests.",
    image: { light: "/nav/appless-light.webp", dark: "/nav/appless-dark.webp" },
    links: [
      { label: "Website", href: SITE_NAV_LINKS.appless.href },
      { label: "GitHub", href: "https://github.com/thesysdev/appless", external: true },
    ],
  },
  {
    name: "F1 Dashboard",
    demoId: "f1-dashboard",
    templateRepo: "thesysdev/openui-f1-dashboard",
    tagline: "Live race data",
    description: "Explore races, drivers and lap times with live F1 data.",
    image: { light: "/nav/f1-dashboard-light.webp", dark: "/nav/f1-dashboard-dark.webp" },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.f1Dashboard.href }],
  },
  {
    name: "Trip Planner",
    demoId: "trip-planner",
    templateRepo: "thesysdev/openui-trip-planner",
    tagline: "Travel agent",
    description: "Plan a trip with maps, itineraries and hotel options.",
    image: { light: "/nav/trip-planner-light.webp", dark: "/nav/trip-planner-dark.webp" },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.tripPlanner.href }],
  },
  {
    name: "The HN Times",
    demoId: "hntimes",
    tagline: "HN as a newspaper",
    description:
      "Read Hacker News discussions as a newspaper, with checked quotes and a discussion map.",
    image: { light: "/nav/hntimes-light.webp", dark: "/nav/hntimes-dark.webp" },
    links: [
      { label: "Try demo", href: SITE_NAV_LINKS.hnTimes.href, external: true },
      { label: "GitHub", href: "https://github.com/thesysdev/hntimes", external: true },
    ],
  },
  {
    name: "OpenUI Chat",
    demoId: "chat",
    tagline: "Chat assistant",
    description: "Try an assistant that answers with interactive UI.",
    image: { light: "/nav/chat-light.webp", dark: "/nav/chat-dark.webp" },
    links: [{ label: "Try demo", href: SITE_NAV_LINKS.chat.href }],
  },
];
