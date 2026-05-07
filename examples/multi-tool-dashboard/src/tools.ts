/**
 * Shared tool registry — single source of truth for all tools.
 *
 * Data sources:
 *   - Stripe         (revenue — balance, charges, MRR)
 *   - PostHog        (product analytics — trends, funnels, events)
 *   - GitHub/Octokit (engineering velocity — repos, commits, activity)
 *   - Google Calendar (meetings & schedule via gws CLI)
 *
 * Consumed by:
 *   - /api/mcp/route.ts  (MCP server, uses Zod inputSchema directly)
 *   - /api/chat/route.ts (OpenAI function-calling, via toOpenAITool())
 */
import { z } from "zod";
import { ToolDef } from "./lib/tool-def";
import { stripeGet } from "./lib/stripe-bridge";
import { posthogQuery } from "./lib/posthog-bridge";
import { getMyRepos, getRecentActivity, getCommitActivity, getContributors } from "./lib/github-octokit";
import { runGws } from "./lib/gws-bridge";

// ── Tool registry ───────────────────────────────────────────────────────────

export { ToolDef } from "./lib/tool-def";

export const tools: ToolDef[] = [

  // ── Stripe tools (revenue & financials) ─────────────────────────────────────

  new ToolDef({
    name: "get_stripe_balance",
    description: "Get the current Stripe account balance — available and pending amounts by currency. Use this for cash-on-hand and treasury dashboards.",
    inputSchema: z.object({}),
    outputSchema: z.object({ available: z.unknown(), pending: z.unknown() }),
    execute: async () => stripeGet("/balance"),
  }),

  new ToolDef({
    name: "get_stripe_charges",
    description: "Get recent Stripe charges (payments). Use this for revenue activity, recent transactions, and payment volume.",
    inputSchema: z.object({
      limit: z.coerce.number().optional().describe("Number of charges to return (default 10, max 100)"),
      created_gte: z.string().optional().describe("Only charges created after this Unix timestamp or ISO date"),
    }),
    outputSchema: z.object({ data: z.unknown() }),
    execute: async (args) => {
      const params: Record<string, string> = { limit: String(args.limit ?? 10) };
      if (args.created_gte) params["created[gte]"] = args.created_gte as string;
      return stripeGet("/charges", params);
    },
  }),

  new ToolDef({
    name: "get_stripe_revenue",
    description: "Get Stripe balance transactions over a time period — net revenue, fees, refunds. Use this for MRR, revenue trends, and investor updates.",
    inputSchema: z.object({
      limit: z.coerce.number().optional().describe("Number of transactions to return (default 20, max 100)"),
      type: z.string().optional().describe("Filter by type: 'charge', 'refund', 'payout', 'adjustment' (default: all)"),
      created_gte: z.string().optional().describe("Only transactions after this Unix timestamp"),
    }),
    outputSchema: z.object({ data: z.unknown() }),
    execute: async (args) => {
      const params: Record<string, string> = { limit: String(args.limit ?? 20) };
      if (args.type) params.type = args.type as string;
      if (args.created_gte) params["created[gte]"] = args.created_gte as string;
      return stripeGet("/balance_transactions", params);
    },
  }),

  new ToolDef({
    name: "get_stripe_subscriptions",
    description: "Get active Stripe subscriptions — MRR calculation, plan distribution, churn risk. Use this for recurring revenue dashboards.",
    inputSchema: z.object({
      status: z.string().optional().describe("Filter: 'active' (default), 'past_due', 'canceled', 'all'"),
      limit: z.coerce.number().optional().describe("Number of subscriptions (default 20, max 100)"),
    }),
    outputSchema: z.object({ data: z.unknown() }),
    execute: async (args) => {
      const params: Record<string, string> = { limit: String(args.limit ?? 20) };
      const status = (args.status as string) ?? "active";
      if (status !== "all") params.status = status;
      return stripeGet("/subscriptions", params);
    },
  }),

  // ── PostHog tools (product analytics) ───────────────────────────────────────

  new ToolDef({
    name: "get_product_trends",
    description: "Get product analytics trends from PostHog — pageviews, DAU, or any event over time. Use this for usage dashboards, growth metrics, and investor updates.",
    inputSchema: z.object({
      event: z.string().optional().describe("Event name to trend (default '$pageview'). Use '$pageview' for page views, '$autocapture' for interactions, or any custom event."),
      math: z.string().optional().describe("Aggregation: 'total' (default), 'dau' for daily active users, 'weekly_active', 'monthly_active'"),
      dateFrom: z.string().optional().describe("Start date: '-7d', '-30d', '-90d', or ISO date (default '-30d')"),
      interval: z.string().optional().describe("Granularity: 'day' (default), 'hour', 'week', 'month'"),
    }),
    outputSchema: z.object({ results: z.unknown() }),
    execute: async (args) => {
      return posthogQuery({
        kind: "TrendsQuery",
        series: [{ event: args.event ?? "$pageview", math: args.math ?? "total" }],
        dateRange: { date_from: args.dateFrom ?? "-30d" },
        interval: args.interval ?? "day",
      });
    },
  }),

  new ToolDef({
    name: "get_top_events",
    description: "Get the most common events from PostHog over a time period. Use this to understand what users are doing in the product.",
    inputSchema: z.object({
      days: z.coerce.number().optional().describe("Lookback period in days (default 7)"),
      limit: z.coerce.number().optional().describe("Number of top events to return (default 10)"),
    }),
    outputSchema: z.object({
      rows: z.array(z.object({ event: z.string(), count: z.number() })),
    }),
    execute: async (args) => {
      const days = args.days ?? 7;
      const limit = args.limit ?? 10;
      const raw = await posthogQuery({
        kind: "HogQLQuery",
        query: `SELECT event, count() as count FROM events WHERE timestamp > now() - interval ${days} day GROUP BY event ORDER BY count DESC LIMIT ${limit}`,
      }) as { results?: unknown[][]; columns?: string[]; error?: string };

      if (raw.error || !raw.results) return { rows: [], error: raw.error };

      const rows = raw.results.map((r) => ({
        event: String(r[0] ?? ""),
        count: Number(r[1] ?? 0),
      }));
      return { rows };
    },
  }),

  new ToolDef({
    name: "get_conversion_funnel",
    description: "Get conversion funnel analytics from PostHog. Provide an ordered list of event names representing funnel steps.",
    inputSchema: z.object({
      steps: z.array(z.string()).describe("Ordered event names for funnel steps, e.g. ['$pageview', 'sign_up', 'purchase']"),
      dateFrom: z.string().optional().describe("Start date: '-7d', '-30d', '-90d' (default '-30d')"),
    }),
    outputSchema: z.object({ results: z.unknown() }),
    execute: async (args) => {
      return posthogQuery({
        kind: "FunnelsQuery",
        series: (args.steps as string[]).map((e: string) => ({ event: e, name: e })),
        dateRange: { date_from: args.dateFrom ?? "-30d" },
      });
    },
  }),

  new ToolDef({
    name: "posthog_query",
    description: "Run a custom HogQL (SQL) query against PostHog data. Use this for any analytics question not covered by other tools. Tables: events, persons, sessions.",
    inputSchema: z.object({
      query: z.string().describe("HogQL SQL query, e.g. \"SELECT count() FROM events WHERE timestamp > now() - interval 7 day\""),
    }),
    outputSchema: z.object({ results: z.unknown() }),
    execute: async (args) => {
      return posthogQuery({
        kind: "HogQLQuery",
        query: args.query,
      });
    },
  }),

  // ── GitHub tools (engineering velocity via Octokit) ─────────────────────────

  new ToolDef({
    name: "get_my_repos",
    description: "List the authenticated user's GitHub repositories (including private) sorted by most recently pushed. Use this for deploy status and engineering portfolio overview.",
    inputSchema: z.object({
      perPage: z.coerce.number().optional().describe("Number of repos to return (default 10, max 100)"),
    }),
    outputSchema: z.object({
      repos: z.array(z.object({
        name: z.string(),
        full_name: z.string(),
        description: z.string(),
        language: z.string(),
        stars: z.number(),
        forks: z.number(),
        open_issues: z.number(),
        updated_at: z.string(),
        is_private: z.boolean(),
      })),
    }),
    execute: async (args) => getMyRepos(Number(args.perPage ?? 10)),
  }),

  new ToolDef({
    name: "get_recent_activity",
    description: "Get the authenticated user's recent GitHub activity — pushes, PRs, issues, reviews. Returns event rows and a summary with counts. Use this for engineering velocity.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      rows: z.array(z.object({ type: z.string(), repo: z.string(), date: z.string() })),
      summary: z.object({ total: z.number(), push: z.number(), pr: z.number(), issues: z.number(), reviews: z.number() }),
    }),
    execute: async () => getRecentActivity(),
  }),

  new ToolDef({
    name: "get_commit_activity",
    description: "Get weekly commit counts for a specific repo over the past year (52 weeks). Use this for deploy cadence and engineering velocity charts.",
    inputSchema: z.object({
      owner: z.string().describe("Repository owner (username or org)"),
      repo: z.string().describe("Repository name"),
    }),
    outputSchema: z.object({
      rows: z.array(z.object({ week: z.string(), total: z.number() })),
    }),
    execute: async (args) => getCommitActivity(String(args.owner), String(args.repo)),
  }),

  new ToolDef({
    name: "get_contributors",
    description: "Get contributor stats for a specific repo — login and total commits. Use this for team velocity.",
    inputSchema: z.object({
      owner: z.string().describe("Repository owner (username or org)"),
      repo: z.string().describe("Repository name"),
    }),
    outputSchema: z.object({
      rows: z.array(z.object({ login: z.string(), total_commits: z.number() })),
    }),
    execute: async (args) => getContributors(String(args.owner), String(args.repo)),
  }),

  // ── Google Calendar tools (via gws CLI) ─────────────────────────────────────

  new ToolDef({
    name: "get_my_agenda",
    description: "Get the authenticated user's upcoming calendar events. Use this for daily briefings, meeting schedules, and time management.",
    inputSchema: z.object({
      today: z.boolean().optional().describe("Only show today's events (default false — shows upcoming)"),
      days: z.coerce.number().optional().describe("Number of days ahead to show (e.g. 3, 7)"),
    }),
    outputSchema: z.object({ events: z.unknown() }),
    execute: async (args) => {
      const cliArgs = ["calendar", "+agenda"];
      if (args.today) cliArgs.push("--today");
      else if (args.days) cliArgs.push("--days", String(args.days));
      return { events: await runGws(cliArgs) };
    },
  }),

  new ToolDef({
    name: "get_calendar_events",
    description: "List calendar events for a date range from the primary calendar. Use this for weekly overviews and scheduling dashboards.",
    inputSchema: z.object({
      timeMin: z.string().optional().describe("Start of date range in ISO 8601 (e.g. 2026-04-09T00:00:00Z). Defaults to now."),
      timeMax: z.string().optional().describe("End of date range in ISO 8601 (e.g. 2026-04-16T00:00:00Z)"),
      maxResults: z.coerce.number().optional().describe("Maximum events to return (default 20)"),
    }),
    outputSchema: z.object({ events: z.unknown() }),
    execute: async (args) => {
      const params: Record<string, unknown> = {
        calendarId: "primary",
        singleEvents: true,
        orderBy: "startTime",
        maxResults: args.maxResults ?? 20,
      };
      if (args.timeMin) params.timeMin = args.timeMin;
      else params.timeMin = new Date().toISOString();
      if (args.timeMax) params.timeMax = args.timeMax;

      return { events: await runGws(["calendar", "events", "list", "--params", JSON.stringify(params)]) };
    },
  }),
];
