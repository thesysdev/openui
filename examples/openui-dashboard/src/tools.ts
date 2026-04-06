/**
 * Shared tool registry — single source of truth for all tools.
 *
 * Consumed by:
 *   - /api/mcp/route.ts  (MCP server, uses Zod inputSchema directly)
 *   - /api/chat/route.ts (OpenAI function-calling, via toOpenAITool())
 */
import { z } from "zod";
import { ToolDef } from "./lib/tool-def";

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

function getExperimentResults() {
  return {
    variants: [
      { variant: "Control", conversionRate: 3.2, users: 5200 },
      { variant: "Variant A", conversionRate: 4.1, users: 5150 },
      { variant: "Variant B", conversionRate: 3.8, users: 5100 },
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

// ── Tool registry ───────────────────────────────────────────────────────────

export { ToolDef } from "./lib/tool-def";

export const tools: ToolDef[] = [
  new ToolDef({
    name: "get_usage_metrics",
    description: "Get usage metrics for the specified date range",
    inputSchema: z.object({
      dateRange: z.string().optional(),
      days: z.string().optional(),
      resource: z.string().optional(),
    }),
    outputSchema: z.object({
      totalEvents: z.number(),
      totalUsers: z.number(),
      totalErrors: z.number(),
      totalCost: z.number(),
      data: z.array(
        z.object({
          day: z.string(),
          events: z.number(),
          users: z.number(),
          errors: z.number(),
          cost: z.number(),
        }),
      ),
    }),
    execute: async (args) => getUsageMetrics(args),
  }),
  new ToolDef({
    name: "get_top_endpoints",
    description: "Get top API endpoints by request count",
    inputSchema: z.object({ limit: z.number().optional(), dateRange: z.string().optional() }),
    outputSchema: z.object({
      endpoints: z.array(
        z.object({
          path: z.string(),
          requests: z.number(),
          avgLatency: z.number(),
          errorRate: z.number(),
        }),
      ),
    }),
    execute: async (args) => getTopEndpoints(args),
  }),
  new ToolDef({
    name: "get_resource_breakdown",
    description: "Get resource usage breakdown by type",
    inputSchema: z.object({}),
    outputSchema: z.object({
      resources: z.array(
        z.object({ name: z.string(), events: z.number(), users: z.number(), cost: z.number() }),
      ),
    }),
    execute: async () => getResourceBreakdown(),
  }),
  new ToolDef({
    name: "get_error_breakdown",
    description: "Get error breakdown by category",
    inputSchema: z.object({}),
    outputSchema: z.object({
      errors: z.array(z.object({ category: z.string(), count: z.number() })),
    }),
    execute: async () => getErrorBreakdown(),
  }),
  new ToolDef({
    name: "get_server_health",
    description: "Get current server health metrics (CPU, memory, latency)",
    inputSchema: z.object({}),
    outputSchema: z.object({
      cpu: z.number(),
      memory: z.number(),
      latencyP95: z.number(),
      errorRate: z.number(),
      timeseries: z.array(
        z.object({ time: z.string(), cpu: z.number(), memory: z.number(), latencyP95: z.number() }),
      ),
    }),
    execute: async () => getServerHealth(),
  }),
  new ToolDef({
    name: "get_experiment_results",
    description: "Get A/B experiment results with conversion rates",
    inputSchema: z.object({}),
    outputSchema: z.object({
      variants: z.array(
        z.object({ variant: z.string(), conversionRate: z.number(), users: z.number() }),
      ),
    }),
    execute: async () => getExperimentResults(),
  }),
  new ToolDef({
    name: "get_geo_usage",
    description: "Get geographic usage breakdown by region",
    inputSchema: z.object({}),
    outputSchema: z.object({
      regions: z.array(z.object({ region: z.string(), users: z.number(), events: z.number() })),
    }),
    execute: async () => getGeoUsage(),
  }),
  new ToolDef({
    name: "get_funnel_metrics",
    description: "Get conversion funnel metrics",
    inputSchema: z.object({}),
    outputSchema: z.object({ steps: z.array(z.object({ step: z.string(), users: z.number() })) }),
    execute: async () => getFunnelMetrics(),
  }),
];
