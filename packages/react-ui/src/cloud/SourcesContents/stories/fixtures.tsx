import type { DataSources } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import type { SourceDescription } from "../types";

// ── Sample data, shaped like a retail dashboard ──

export const dailyRows = [
  { day: "2026-11-10", revenue: 12840.5, orders: 212 },
  { day: "2026-11-11", revenue: 13912, orders: 231 },
  { day: "2026-11-12", revenue: 11407.25, orders: 190 },
  { day: "2026-11-13", revenue: 14650.75, orders: 244 },
  { day: "2026-11-14", revenue: 15201, orders: 251 },
  { day: "2026-11-15", revenue: 16388.5, orders: 270 },
  { day: "2026-11-16", revenue: 15890, orders: 262 },
];
export const channelRows = [
  { sessionDefaultChannelGroup: "Organic Search", sessions: 21410 },
  { sessionDefaultChannelGroup: "Direct", sessions: 12904 },
  { sessionDefaultChannelGroup: "Paid Social", sessions: 8622 },
  { sessionDefaultChannelGroup: "Email", sessions: 5318 },
];
export const targetRows = [
  { region: "North", revenue: 62410, target: 58000 },
  { region: "South", revenue: 48960, target: 52000 },
  { region: "West", revenue: 73550, target: 70000 },
];

const REVENUE_SQL =
  "SELECT sum(total) AS revenue FROM orders WHERE status = 'paid' AND created_at >= date_trunc('quarter', now())";
const DAILY_SQL =
  "SELECT date(created_at) AS day, sum(total) AS revenue, count(*) AS orders FROM orders WHERE status = 'paid' GROUP BY 1 ORDER BY 1";
const SIGNUPS_HOGQL =
  "SELECT count() AS signups FROM events WHERE event = 'user_signed_up' AND timestamp > now() - INTERVAL 7 DAY";

const query = (toolName: string, args: unknown, data: unknown) => ({
  toolName,
  args,
  loading: false,
  data,
});
/** A prop's sources: what it reads, as written. */
const prop = (
  expr: string,
  queries: string[] = [],
  via: string[] = [],
  components: string[] = [],
) => ({
  queries,
  via,
  state: [],
  expr,
  components,
});

/** What `useArtifactProvenance().sources` holds for the sample dashboard. */
export const sources: DataSources = {
  queries: {
    revenueQ: query("postgres_query", { sql: REVENUE_SQL }, { rows: [{ revenue: 184920 }] }),
    dailyQ: query("postgres_query", { sql: DAILY_SQL }, { rows: dailyRows }),
    signupsQ: query("posthog_query", { hogql: SIGNUPS_HOGQL }, { rows: [{ signups: 2318 }] }),
    channelsQ: query(
      "ga4_report",
      { dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"] },
      { rows: channelRows },
    ),
    targetQ: query("revenue_vs_target", {}, { rows: targetRows }),
  },
  state: {},
  formulas: { now: "@First(revenueQ.rows)", grossMargin: "(revenue - cogs) / revenue" },
  components: {
    revenue: {
      queries: ["revenueQ"],
      via: ["now"],
      state: [],
      props: {
        title: prop('"Revenue this quarter"'),
        value: prop("now.revenue", ["revenueQ"], ["now"]),
      },
    },
    signups: {
      queries: ["signupsQ"],
      via: [],
      state: [],
      props: {
        title: prop('"Weekly signups"'),
        value: prop("@First(signupsQ.rows).signups", ["signupsQ"]),
      },
    },
    margin: {
      queries: [],
      via: ["grossMargin"],
      state: [],
      props: { title: prop('"Gross margin"'), value: prop("grossMargin", [], ["grossMargin"]) },
    },
    goal: {
      queries: [],
      via: [],
      state: [],
      props: { title: prop('"Goal"'), value: prop("250000") },
    },
    daily: {
      queries: ["dailyQ"],
      via: [],
      state: [],
      props: { title: prop('"Daily revenue"'), rows: prop("dailyQ.rows", ["dailyQ"]) },
    },
    channels: {
      queries: ["channelsQ"],
      via: [],
      state: [],
      props: { title: prop('"Sessions by channel"'), rows: prop("channelsQ.rows", ["channelsQ"]) },
    },
    target: {
      queries: ["targetQ"],
      via: [],
      state: [],
      props: { title: prop('"Revenue vs target"'), rows: prop("targetQ.rows", ["targetQ"]) },
    },
    kpiRow: {
      queries: [],
      via: [],
      state: [],
      props: { children: prop("[revenue, signups]", [], [], ["revenue", "signups"]) },
    },
  },
};

/**
 * How the sample app names its tools. It knows them, so it says which product each one reads and
 * shows the query text it sent; the dialog itself never guesses either.
 */
/** The table a sample query reads: what follows its `FROM`. */
const tableOf = (text: unknown) => /\bFROM\s+([\w.]+)/i.exec(String(text ?? ""))?.[1];

export const describeSource = (toolName: string, args: unknown): SourceDescription | undefined => {
  const values = (args ?? {}) as Record<string, unknown>;
  switch (toolName) {
    case "postgres_query":
      return {
        kind: "Postgres",
        table: tableOf(values["sql"]),
        codeLabel: "SQL",
        code: String(values["sql"] ?? ""),
      };
    case "posthog_query":
      return {
        kind: "PostHog",
        table: tableOf(values["hogql"]),
        codeLabel: "HogQL",
        code: String(values["hogql"] ?? ""),
      };
    case "ga4_report":
      return { kind: "GA4", codeLabel: "Report" };
    case "revenue_vs_target":
      return {
        kind: "Script",
        codeLabel: "Script",
        code: "revenue_vs_target()\n\nreads:\n  postgres_query  revenue by region\n  read_file       regional_targets.csv",
      };
    default:
      return undefined;
  }
};

// ── A small live dashboard: a component library and a program with real queries ──

const Board = defineComponent({
  name: "Board",
  props: z.object({ children: z.array(z.any()) }),
  description: "A grid of tiles.",
  component: ({ props, renderNode }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
        padding: 20,
      }}
    >
      {renderNode(props.children)}
    </div>
  ),
});

const tile = {
  border: "1px solid var(--openui-border-default)",
  borderRadius: 12,
  padding: 16,
  background: "var(--openui-background)",
  color: "var(--openui-text-neutral-primary)",
  fontFamily: "Inter, system-ui, sans-serif",
} as const;

const Kpi = defineComponent({
  name: "Kpi",
  props: z.object({ title: z.string(), value: z.any(), hint: z.string().optional() }),
  description: "One number.",
  component: ({ props, bindSource }) => (
    <div style={tile} {...bindSource?.()}>
      <div style={{ fontSize: 13, color: "var(--openui-text-neutral-secondary)" }}>
        {props.title}
      </div>
      <div style={{ marginTop: 8 }}>
        <span
          style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600 }}
          {...bindSource?.("value")}
        >
          {typeof props.value === "number"
            ? props.value < 1
              ? `${(props.value * 100).toFixed(1)}%`
              : props.value.toLocaleString("en-US")
            : String(props.value ?? "—")}
        </span>
      </div>
      {props.hint && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--openui-text-neutral-secondary)" }}>
          {props.hint}
        </div>
      )}
    </div>
  ),
});

const rowsOf = (value: unknown) =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

const Bars = defineComponent({
  name: "Bars",
  props: z.object({ title: z.string(), rows: z.any() }),
  description: "Horizontal bars: the first text field against the first number.",
  component: ({ props }) => {
    const rows = rowsOf(props.rows);
    const keys = Object.keys(rows[0] ?? {});
    const label = keys.find((key) => typeof rows[0]?.[key] === "string") ?? keys[0];
    const value = keys.find((key) => typeof rows[0]?.[key] === "number") ?? keys[1];
    const max = Math.max(1, ...rows.map((row) => Number(row[value ?? ""]) || 0));
    return (
      <div style={{ ...tile, gridColumn: "span 2" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{props.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {rows.map((row, index) => (
            <div key={index} style={{ fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{String(row[label ?? ""])}</span>
                <span>{Number(row[value ?? ""]).toLocaleString("en-US")}</span>
              </div>
              <div
                style={{
                  height: 6,
                  marginTop: 4,
                  borderRadius: 3,
                  background: "var(--openui-highlight)",
                }}
              >
                <div
                  style={{
                    width: `${((Number(row[value ?? ""]) || 0) / max) * 100}%`,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--openui-interactive-accent-default)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

const Table = defineComponent({
  name: "Table",
  props: z.object({ title: z.string(), rows: z.any() }),
  description: "A table of rows.",
  component: ({ props }) => {
    const rows = rowsOf(props.rows);
    const columns = Object.keys(rows[0] ?? {});
    return (
      <div style={{ ...tile, gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{props.title}</div>
        <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    textAlign: "left",
                    padding: "6px 0",
                    color: "var(--openui-text-neutral-secondary)",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td
                    key={column}
                    style={{
                      padding: "6px 0",
                      borderTop: "1px solid var(--openui-border-default)",
                    }}
                  >
                    {String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

const Heading = defineComponent({
  name: "Heading",
  props: z.object({ text: z.string() }),
  description: "A section heading.",
  component: ({ props, bindSource }) => (
    <h3 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 16 }} {...bindSource?.()}>
      {props.text}
    </h3>
  ),
});

const Note = defineComponent({
  name: "Note",
  props: z.object({ text: z.string() }),
  description: "A line of plain text.",
  component: ({ props, bindSource }) => (
    <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 13 }} {...bindSource?.()}>
      {props.text}
    </p>
  ),
});

const Group = defineComponent({
  name: "Group",
  props: z.object({ title: z.string(), children: z.array(z.any()) }),
  description: "A titled row of tiles.",
  component: ({ props, renderNode, bindSource }) => (
    <section style={{ gridColumn: "1 / -1" }} {...bindSource?.()}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{props.title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {renderNode(props.children)}
      </div>
    </section>
  ),
});

export const dashboardLibrary = createLibrary({
  root: "Board",
  components: [Board, Kpi, Bars, Table, Heading, Note, Group],
});

export const dashboardProgram = `root = Board([revenue, signups, margin, channels, daily, target])
revenueQ = Query("postgres_query", {sql: "${REVENUE_SQL}"}, {rows: []})
dailyQ = Query("postgres_query", {sql: "${DAILY_SQL}"}, {rows: []})
signupsQ = Query("posthog_query", {hogql: "${SIGNUPS_HOGQL}"}, {rows: []})
channelsQ = Query("ga4_report", {dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"]}, {rows: []})
targetQ = Query("revenue_vs_target", {}, {rows: []})
now = @First(revenueQ.rows)
revenue = Kpi("Revenue this quarter", now.revenue, "Paid orders since Oct 1")
signups = Kpi("Weekly signups", @First(signupsQ.rows).signups)
margin = Kpi("Gross margin", 0.386)
channels = Bars("Sessions by channel", channelsQ.rows)
daily = Table("Daily revenue", dailyQ.rows)
target = Table("Revenue vs target", targetQ.rows)`;

const COST_SQL =
  "SELECT sum(cost) AS cost FROM order_items WHERE created_at >= date_trunc('quarter', now())";

/**
 * The Full flow dashboard: a heading and a note (not data-bound), a container of KPIs (one a
 * literal, one a margin built by a formula from two queries), a chart and a table.
 */
export const fullFlowProgram = `root = Board([heading, intro, kpis, channels, daily])
heading = Heading("Retail overview")
intro = Note("Paid orders only, refreshed hourly.")
kpis = Group("This quarter", [revenue, signups, margin, goal])
revenueQ = Query("postgres_query", {sql: "${REVENUE_SQL}"}, {rows: []})
costQ = Query("postgres_query", {sql: "${COST_SQL}"}, {rows: []})
dailyQ = Query("postgres_query", {sql: "${DAILY_SQL}"}, {rows: []})
signupsQ = Query("posthog_query", {hogql: "${SIGNUPS_HOGQL}"}, {rows: []})
channelsQ = Query("ga4_report", {dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"]}, {rows: []})
now = @First(revenueQ.rows)
grossMargin = (@First(revenueQ.rows).revenue - @First(costQ.rows).cost) / @First(revenueQ.rows).revenue
revenue = Kpi("Revenue this quarter", now.revenue, "Paid orders since Oct 1")
signups = Kpi("Weekly signups", @First(signupsQ.rows).signups)
margin = Kpi("Gross margin", grossMargin)
goal = Kpi("Goal", 250000)
channels = Bars("Sessions by channel", channelsQ.rows)
daily = Table("Daily revenue", dailyQ.rows)`;

const results: Record<string, unknown> = {
  postgres_query: null,
  posthog_query: { rows: [{ signups: 2318 }] },
  ga4_report: { rows: channelRows },
  revenue_vs_target: { rows: targetRows },
};

/** Runs the sample tools, as an app's interpreter would. */
export async function interpreter(request: { name: string; arguments: Record<string, unknown> }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (request.name === "postgres_query") {
    const sql = String(request.arguments["sql"] ?? "");
    if (sql.includes("GROUP BY 1")) return { rows: dailyRows };
    // 38.6% gross margin over the revenue above.
    if (sql.includes("sum(cost)")) return { rows: [{ cost: 113541 }] };
    return { rows: [{ revenue: 184920 }] };
  }
  return results[request.name] ?? { rows: [] };
}
