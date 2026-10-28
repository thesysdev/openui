// Centralized destinations for the main navigation and Resources menu.
// Update these links when the dedicated project pages merge.
export const SITE_NAV_LINKS = {
  openui: { href: "/" },
  gateway: { href: "/cloud/gateway" },
  observability: { href: "/cloud/observability" },
  gettingStarted: { href: "/docs/getting-started" },
  cookbooks: { href: "/cookbooks/conversational-analytics" },
  apiReference: { href: "/docs/api-reference" },
  demos: { href: "/demos", newTab: false },
  documentation: { href: "/docs", newTab: false },
  /* Absolute, not /demo/...: these demos are proxied from openui.com only, so a
     relative link on a preview deployment would land on the preview's own
     vercel.app host instead of the demo. */
  openIntelligentUi: { href: "https://www.openui.com/demo/intelligent-ui" },
  f1Dashboard: { href: "https://www.openui.com/demo/f1-dashboard" },
  tripPlanner: { href: "https://www.openui.com/demo/trip-planner/planner" },
  aiDashboards: { href: "/demo/github" },
  oui1: { href: "/oui-1" },
  openClawOs: { href: "/openclaw-os" },
  appless: { href: "/appless" },
  community: { href: "/lab" },
  compare: { href: "/compare" },
  openuiVsJson: { href: "/openui-vs-json" },
  debug: { href: "/docs/openui-lang/developer-tools#debug" },
  inspect: { href: "/docs/openui-lang/developer-tools#inspect" },
  benchmarks: { href: "/benchmarks" },
  pricing: { href: "/pricing" },
  blog: { href: "/blog" },
  integrations: { href: "/integrations" },
} as const;
