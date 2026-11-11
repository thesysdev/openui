import type { ShowcaseItem } from "@/components/showcase/cards";
import { SITE_NAV_LINKS } from "@/lib/site-nav-links";

/** Official demos and playgrounds on the Demos page. */

export const PLAYGROUND: ShowcaseItem[] = [
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

export const FEATURED_PROJECTS: ShowcaseItem[] = [
  {
    name: "Sales Dashboard",
    tagline: "Live sales data",
    description:
      "Describe a sales view and get a live dashboard over a Postgres database, with KPIs, charts and tables that load fresh numbers every time. Ask in the chat to change it.",
    image: {
      light: "/nav/sales-dashboard-light.webp",
      dark: "/nav/sales-dashboard-dark.webp",
    },
    links: [
      { label: "Open demo", href: SITE_NAV_LINKS.salesDashboard.href },
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui-sales-dashboard",
        external: true,
      },
    ],
  },
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
    name: "The HN Times",
    tagline: "HN as a newspaper",
    description:
      "Swap the host on any Hacker News link and get the thread as a newspaper page, with quotes checked against the comments and a map of the discussion.",
    image: { light: "/nav/hntimes-light.webp", dark: "/nav/hntimes-dark.webp" },
    links: [
      { label: "Open demo", href: SITE_NAV_LINKS.hnTimes.href, external: true },
      { label: "GitHub", href: "https://github.com/thesysdev/hntimes", external: true },
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
];
