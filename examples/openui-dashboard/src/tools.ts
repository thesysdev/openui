/**
 * Shared tool registry — single source of truth for all tools.
 *
 * Consumed by:
 *   - /api/mcp/route.ts  (MCP server, uses Zod inputSchema directly)
 *   - /api/chat/route.ts (OpenAI function-calling, converts to JSON Schema)
 */
import { z } from "zod";

// ── PostHog config ───────────────────────────────────────────────────────────

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? "";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "";
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.posthog.com";

// ── PostHog live query ───────────────────────────────────────────────────────

async function executePostHogQuery(sql: string) {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { error: "POSTHOG_API_KEY and POSTHOG_PROJECT_ID env vars required" };
  }

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
        },
        body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      if (err.includes("504") && attempt < 2) continue;
      console.error("[tools/posthog] API error:", err.substring(0, 300));
      return { error: `PostHog API error ${res.status}` };
    }
    break;
  }

  const data = await res?.json();
  const columns: string[] = data.columns ?? [];
  const rawResults: unknown[][] = data.results ?? [];
  const rows = rawResults.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
    return obj;
  });

  return { columns, rows };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAgo);
  return d.toISOString().slice(0, 10);
}

function generateTimeseries<T>(count: number, fn: (index: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => fn(i));
}

// ── Mock data generators ─────────────────────────────────────────────────────

function getUsageMetrics(args: Record<string, unknown>) {
  const days = Number(args.dateRange ?? args.days ?? 14);
  return {
    totalEvents: 48200 + Math.floor(days * 120),
    totalUsers: 3200 + Math.floor(days * 40),
    totalErrors: 142 + Math.floor(days * 3),
    totalCost: 1250.5 + days * 15,
    data: generateTimeseries(days, (i) => ({
      day: dateOffset(-days + i),
      events: 2800 + Math.floor(Math.random() * 1200),
      users: 180 + Math.floor(Math.random() * 80),
      errors: 5 + Math.floor(Math.random() * 15),
      cost: 70 + Math.random() * 30,
    })),
  };
}

function getTopEndpoints(args: Record<string, unknown>) {
  const limit = Number(args.limit ?? 10);
  const paths = ["/api/users", "/api/events", "/api/auth", "/api/data", "/api/search", "/api/upload", "/api/export", "/api/notify", "/api/billing", "/api/health"];
  return {
    endpoints: Array.from({ length: limit }, (_, i) => ({
      path: paths[i % 10],
      requests: 12000 - i * 900 + Math.floor(Math.random() * 400),
      avgLatency: 45 + i * 12 + Math.floor(Math.random() * 20),
      errorRate: Math.round((0.5 + i * 0.3 + Math.random() * 0.5) * 100) / 100,
    })),
  };
}

function getResourceBreakdown() {
  return {
    resources: [
      { name: "API", events: 22000, users: 1800, cost: 450 },
      { name: "Web App", events: 18000, users: 2400, cost: 380 },
      { name: "Mobile", events: 8200, users: 900, cost: 220 },
      { name: "Webhook", events: 3500, users: 120, cost: 95 },
    ],
  };
}

function getErrorBreakdown() {
  return {
    errors: [
      { category: "TimeoutError", count: 45 },
      { category: "AuthError", count: 32 },
      { category: "RateLimitError", count: 28 },
      { category: "ValidationError", count: 22 },
      { category: "NotFoundError", count: 15 },
    ],
  };
}

function getServerHealth() {
  return {
    cpu: 42 + Math.floor(Math.random() * 20),
    memory: 68 + Math.floor(Math.random() * 15),
    latencyP95: 120 + Math.floor(Math.random() * 60),
    errorRate: Math.round((1.2 + Math.random() * 0.8) * 100) / 100,
    timeseries: generateTimeseries(24, (i) => ({
      time: `${String(i).padStart(2, "0")}:00`,
      cpu: 35 + Math.floor(Math.random() * 30),
      memory: 60 + Math.floor(Math.random() * 20),
      latencyP95: 80 + Math.floor(Math.random() * 80),
    })),
  };
}

function getCustomerSegments() {
  return {
    segments: [
      { segment: "Enterprise", customers: 120, revenue: 450000 },
      { segment: "Pro", customers: 850, revenue: 280000 },
      { segment: "Starter", customers: 3200, revenue: 96000 },
      { segment: "Free", customers: 12000, revenue: 0 },
    ],
  };
}

function getSalesSummary(args: Record<string, unknown>) {
  const days = Number(args.dateRange ?? args.days ?? 14);
  return {
    revenue: 842000,
    orders: 3420,
    avgOrderValue: 246,
    trend: generateTimeseries(days, (i) => ({
      period: dateOffset(-days + i),
      revenue: 50000 + Math.floor(Math.random() * 20000),
      orders: 200 + Math.floor(Math.random() * 80),
    })),
  };
}

function getExperimentResults() {
  return {
    variants: [
      { variant: "Control", conversionRate: 3.2, users: 5200 },
      { variant: "Variant A", conversionRate: 4.1, users: 5150 },
      { variant: "Variant B", conversionRate: 3.8, users: 5100 },
    ],
  };
}

function getTicketSummary() {
  return {
    totalOpen: 47,
    totalClosed: 183,
    avgResolutionHours: 18.5,
    byPriority: [
      { priority: "Critical", count: 5 },
      { priority: "High", count: 12 },
      { priority: "Medium", count: 18 },
      { priority: "Low", count: 12 },
    ],
    recentTickets: [
      { id: "T-1042", title: "Login timeout on mobile", priority: "High", status: "Open" },
      { id: "T-1041", title: "Export CSV broken", priority: "Medium", status: "In Progress" },
      { id: "T-1040", title: "Dashboard loading slow", priority: "Low", status: "Open" },
      { id: "T-1039", title: "Payment webhook failing", priority: "Critical", status: "Open" },
      { id: "T-1038", title: "Search not returning results", priority: "High", status: "Closed" },
    ],
  };
}

function getGeoUsage() {
  return {
    regions: [
      { region: "North America", users: 4200, events: 18000 },
      { region: "Europe", users: 3100, events: 14000 },
      { region: "Asia Pacific", users: 1800, events: 8000 },
      { region: "Latin America", users: 600, events: 2800 },
      { region: "Africa", users: 200, events: 900 },
    ],
  };
}

function getFunnelMetrics() {
  return {
    steps: [
      { step: "Visit", users: 10000 },
      { step: "Sign Up", users: 3200 },
      { step: "Activate", users: 1800 },
      { step: "Subscribe", users: 450 },
      { step: "Retain (30d)", users: 320 },
    ],
  };
}

function getInventoryStatus() {
  return {
    items: [
      { sku: "WDG-001", name: "Widget Pro", category: "Electronics", stock: 142, reorderPoint: 50, status: "In Stock" },
      { sku: "WDG-002", name: "Widget Lite", category: "Electronics", stock: 23, reorderPoint: 30, status: "Low Stock" },
      { sku: "GAD-001", name: "Gadget X", category: "Accessories", stock: 0, reorderPoint: 20, status: "Out of Stock" },
      { sku: "GAD-002", name: "Gadget Y", category: "Accessories", stock: 89, reorderPoint: 25, status: "In Stock" },
      { sku: "SRV-001", name: "Server Rack", category: "Infrastructure", stock: 12, reorderPoint: 5, status: "In Stock" },
    ],
  };
}

// ── Issue tracker mock data (stateful per-process for testing mutations) ─────

let mockTickets: Array<Record<string, unknown>> = [
  { id: "T-1001", title: "Fix login timeout", priority: "high", status: "open", created: "2026-03-27" },
  { id: "T-1002", title: "Update dashboard layout", priority: "medium", status: "open", created: "2026-03-27" },
  { id: "T-1003", title: "Add export button", priority: "low", status: "closed", created: "2026-03-26" },
];
let nextTicketId = 1004;

function listTickets(args: Record<string, unknown>) {
  const status = args.status as string | undefined;
  const filtered = status ? mockTickets.filter(t => t.status === status) : mockTickets;
  return {
    columns: ["id", "title", "priority", "status", "created"],
    rows: filtered,
    total: filtered.length,
  };
}

function createTicket(args: Record<string, unknown>) {
  const ticket = {
    id: `T-${nextTicketId++}`,
    title: args.title ?? "Untitled",
    priority: args.priority ?? "medium",
    status: "open",
    created: new Date().toISOString().slice(0, 10),
  };
  mockTickets.unshift(ticket);
  return { success: true, ticket };
}

function updateTicket(args: Record<string, unknown>) {
  const ticket = mockTickets.find(t => t.id === args.id);
  if (!ticket) return { success: false, error: `Ticket ${args.id} not found` };
  if (args.title) ticket.title = args.title;
  if (args.priority) ticket.priority = args.priority;
  if (args.status) ticket.status = args.status;
  return { success: true, ticket };
}

// ── Tool registry ───────────────────────────────────────────────────────────

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export const tools: ToolDef[] = [
  {
    name: "posthog_query",
    description: "Run a HogQL SQL query against PostHog analytics",
    inputSchema: { sql: z.string().describe("HogQL SQL query to execute") },
    execute: async (args) => executePostHogQuery(args.sql as string),
  },
  {
    name: "get_usage_metrics",
    description: "Get usage metrics for the specified date range",
    inputSchema: { dateRange: z.string().optional(), days: z.string().optional(), resource: z.string().optional() },
    execute: async (args) => getUsageMetrics(args),
  },
  {
    name: "get_top_endpoints",
    description: "Get top API endpoints by request count",
    inputSchema: { limit: z.number().optional(), dateRange: z.string().optional() },
    execute: async (args) => getTopEndpoints(args),
  },
  {
    name: "get_resource_breakdown",
    description: "Get resource usage breakdown by type",
    inputSchema: {},
    execute: async () => getResourceBreakdown(),
  },
  {
    name: "get_error_breakdown",
    description: "Get error breakdown by category",
    inputSchema: {},
    execute: async () => getErrorBreakdown(),
  },
  {
    name: "get_server_health",
    description: "Get current server health metrics (CPU, memory, latency)",
    inputSchema: {},
    execute: async () => getServerHealth(),
  },
  {
    name: "get_customer_segments",
    description: "Get customer segment breakdown",
    inputSchema: {},
    execute: async () => getCustomerSegments(),
  },
  {
    name: "get_sales_summary",
    description: "Get sales summary with revenue and orders",
    inputSchema: { dateRange: z.string().optional(), days: z.string().optional() },
    execute: async (args) => getSalesSummary(args),
  },
  {
    name: "get_experiment_results",
    description: "Get A/B experiment results with conversion rates",
    inputSchema: {},
    execute: async () => getExperimentResults(),
  },
  {
    name: "get_ticket_summary",
    description: "Get support ticket summary and recent tickets",
    inputSchema: {},
    execute: async () => getTicketSummary(),
  },
  {
    name: "get_geo_usage",
    description: "Get geographic usage breakdown by region",
    inputSchema: {},
    execute: async () => getGeoUsage(),
  },
  {
    name: "get_funnel_metrics",
    description: "Get conversion funnel metrics",
    inputSchema: {},
    execute: async () => getFunnelMetrics(),
  },
  {
    name: "get_inventory_status",
    description: "Get inventory status for all products",
    inputSchema: {},
    execute: async () => getInventoryStatus(),
  },
  {
    name: "list_tickets",
    description: "List all tickets. Optionally filter by status.",
    inputSchema: { status: z.string().optional().describe("Filter by status: open, closed") },
    execute: async (args) => listTickets(args),
  },
  {
    name: "create_ticket",
    description: "Create a new ticket. Returns the created ticket.",
    inputSchema: {
      title: z.string().describe("Ticket title"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Priority level"),
    },
    execute: async (args) => createTicket(args),
  },
  {
    name: "update_ticket",
    description: "Update an existing ticket's status, title, or priority.",
    inputSchema: {
      id: z.string().describe("Ticket ID (e.g. T-1001)"),
      title: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["open", "closed", "in_progress"]).optional(),
    },
    execute: async (args) => updateTicket(args),
  },
];
