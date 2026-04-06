export interface Starter {
  label: string;
  prompt: string;
  icon: string;
}

export const STARTERS: Starter[] = [
  { label: "Usage Overview", prompt: "Build a usage overview dashboard with KPI cards (events, users, errors, cost) and a daily trend chart with a date range selector", icon: "📊" },
  { label: "Server Health", prompt: "Create a server monitoring dashboard that auto-refreshes every 30 seconds showing CPU, memory, latency P95 and a 24-hour trend chart", icon: "🖥️" },
  { label: "Top Endpoints", prompt: "Build a dashboard showing the top 10 API endpoints by request count alongside an error breakdown pie chart", icon: "🔥" },
  { label: "Geo & Funnel", prompt: "Create a dashboard with a geographic usage table by region and a conversion funnel bar chart", icon: "🌍" },
  { label: "Full Analytics", prompt: "Build a full analytics dashboard with usage KPIs, top endpoints, error breakdown, geo usage, funnel metrics, and A/B experiment results", icon: "📈" },
];
