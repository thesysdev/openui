import type { DataSourceQuery, DataSources } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import type { DataSourcesComponent, ScriptCall, SourceDescription } from "../types";

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
const regionRows = [
  { region: "North", revenue: 62410 },
  { region: "South", revenue: 48960 },
  { region: "West", revenue: 73550 },
];
const targetFileRows = [
  { region: "North", target: 58000 },
  { region: "South", target: 52000 },
  { region: "West", target: 70000 },
];

const REVENUE_SQL =
  "SELECT sum(total) AS revenue FROM orders WHERE status = 'paid' AND created_at >= date_trunc('quarter', now())";
const DAILY_SQL =
  "SELECT date(created_at) AS day, sum(total) AS revenue, count(*) AS orders FROM orders WHERE status = 'paid' GROUP BY 1 ORDER BY 1";
const SIGNUPS_HOGQL =
  "SELECT count() AS signups FROM events WHERE event = 'user_signed_up' AND timestamp > now() - INTERVAL 7 DAY";

export const queries: DataSourceQuery[] = [
  {
    statementId: "revenueQ",
    toolName: "postgres_query",
    args: { sql: REVENUE_SQL },
    loading: false,
    data: { rows: [{ revenue: 184920 }] },
  },
  {
    statementId: "dailyQ",
    toolName: "postgres_query",
    args: { sql: DAILY_SQL },
    loading: false,
    data: { rows: dailyRows },
  },
  {
    statementId: "channelsQ",
    toolName: "ga4_report",
    args: { dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"] },
    loading: false,
    data: { rows: channelRows },
  },
  {
    statementId: "signupsQ",
    toolName: "posthog_query",
    args: { hogql: SIGNUPS_HOGQL },
    loading: false,
    data: { rows: [{ signups: 2318 }] },
  },
  {
    statementId: "targetQ",
    toolName: "revenue_vs_target",
    args: {},
    loading: false,
    data: { rows: targetRows },
  },
];

export const components: DataSourcesComponent[] = [
  {
    id: "revenue",
    label: "Revenue this quarter",
    description: "Paid orders since Oct 1",
    typeName: "Kpi",
    queries: ["revenueQ"],
  },
  { id: "signups", label: "Weekly signups", typeName: "Kpi", queries: ["signupsQ"] },
  { id: "margin", label: "Gross margin", typeName: "Kpi", queries: [] },
  {
    id: "daily",
    label: "Daily revenue",
    description: "Revenue per day",
    typeName: "Bars",
    queries: ["dailyQ"],
  },
  { id: "dailyTable", label: "Daily orders", typeName: "Table", queries: ["dailyQ"] },
  { id: "channels", label: "Sessions by channel", typeName: "Bars", queries: ["channelsQ"] },
  { id: "target", label: "Revenue vs target", typeName: "Table", queries: ["targetQ"] },
];

const pick = (ids: string[]) => queries.filter((query) => ids.includes(query.statementId));

/** `useDataSources` for each sample component. */
export const sourcesFor: Record<string, DataSources> = {
  revenue: {
    queries: pick(["revenueQ"]),
    via: ["now"],
    state: {},
    formulas: { now: "@First(revenueQ.rows)" },
    props: { value: { queries: ["revenueQ"], via: ["now"], state: {}, expr: "now.revenue" } },
  },
  signups: {
    queries: pick(["signupsQ"]),
    via: [],
    state: {},
    formulas: {},
    props: { value: { queries: ["signupsQ"], via: [], state: {}, expr: "signupsQ.rows" } },
  },
  margin: {
    queries: [],
    via: ["grossMargin"],
    state: {},
    formulas: { grossMargin: "(revenue - cogs) / revenue" },
    props: { value: { queries: [], via: ["grossMargin"], state: {}, expr: "grossMargin" } },
  },
  daily: { queries: pick(["dailyQ"]), via: [], state: {}, formulas: {} },
  channels: { queries: pick(["channelsQ"]), via: [], state: {}, formulas: {} },
  target: { queries: pick(["targetQ"]), via: [], state: {}, formulas: {} },
  both: { queries: pick(["revenueQ", "channelsQ"]), via: [], state: {}, formulas: {} },
};

/** How an app names its tools: product names, and which tools are scripts. */
export const describeSource = (toolName: string): SourceDescription | undefined => {
  switch (toolName) {
    case "postgres_query":
      return { kind: "Postgres", detail: "Retail prod" };
    case "posthog_query":
      return { kind: "PostHog", detail: "Product analytics" };
    case "ga4_report":
      return { kind: "GA4", title: "Sessions by channel" };
    case "revenue_vs_target":
      return { kind: "Script" };
    case "read_file":
      return { kind: "File" };
    default:
      return undefined;
  }
};

export const scriptInputs = (toolName: string): ScriptCall[] | undefined =>
  toolName === "revenue_vs_target"
    ? [
        {
          name: "postgres_query",
          args: { sql: "SELECT region, sum(total) AS revenue FROM orders GROUP BY region" },
        },
        { name: "read_file", args: { file: "regional_targets.csv" } },
      ]
    : undefined;

export const runCall = async (call: ScriptCall) =>
  call.name === "read_file" ? { rows: targetFileRows } : { rows: regionRows };

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

export const dashboardLibrary = createLibrary({
  root: "Board",
  components: [Board, Kpi, Bars, Table],
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
    return sql.includes("GROUP BY 1") ? { rows: dailyRows } : { rows: [{ revenue: 184920 }] };
  }
  return results[request.name] ?? { rows: [] };
}
