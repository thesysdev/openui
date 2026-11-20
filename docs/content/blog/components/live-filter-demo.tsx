"use client";

import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider, openuiLibrary } from "@openuidev/react-ui";

// The spec "the model wrote". No data in it; the runtime resolves the references.
const SPEC = `$days = "7"
root = Stack([filter, chart, tbl])
filter = Select("days", [SelectItem("7", "Last 7 days"), SelectItem("30", "Last 30 days"), SelectItem("90", "Last 90 days")], null, null, $days)
metrics = Query("query_revenue", {days: $days}, {trend: [], rows: []})
chart = LineChart(metrics.trend.day, [Series("North America", metrics.trend.na), Series("Europe", metrics.trend.eu), Series("Asia Pacific", metrics.trend.apac), Series("Latin America", metrics.trend.latam)], "natural")
tbl = Table([Col("Region", metrics.rows.region), Col("Revenue", metrics.rows.revenue)])
`;

// ─── Deterministic mock data ─────────────────────────────────────────────────

const REGIONS = [
  { key: "na", label: "North America", rate: 6.8 },
  { key: "eu", label: "Europe", rate: 4.6 },
  { key: "apac", label: "Asia Pacific", rate: 3.1 },
  { key: "latam", label: "Latin America", rate: 1.2 },
] as const;

const ANCHOR = new Date(2026, 6, 23);

function computeTrend(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(ANCHOR);
    d.setDate(d.getDate() - (days - 1 - i));
    const point: Record<string, string | number> = {
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    REGIONS.forEach((r, ri) => {
      point[r.key] = Math.round(r.rate * 1000 * (1 + 0.3 * Math.sin(i * 0.5 + ri * 1.7)));
    });
    return point;
  });
}

function computeRows(days: number) {
  const trend = computeTrend(days);
  return REGIONS.map((r) => ({
    region: r.label,
    revenue: trend.reduce((sum, p) => sum + (p[r.key] as number), 0),
  }));
}

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

const toolProvider = {
  query_revenue: async (args: Record<string, unknown>) => {
    // ~100ms database round trip, matching the article's figure.
    await new Promise((res) => setTimeout(res, 100));
    const days = Number(args.days) || 7;
    return {
      trend: computeTrend(days),
      rows: computeRows(days).map((r) => ({ region: r.region, revenue: fmt(r.revenue) })),
    };
  },
};

// ─── Pre-played tool-loop conversation (left panel) ──────────────────────────

const LOOP_TURNS = [
  { user: "Show daily revenue by region for the last 7 days.", days: 7 },
  { user: "Change it to 30 days.", days: 30 },
  { user: "Now show 90 days.", days: 90 },
];

// Token figures mirror the article's worked example: ~10k per tool-loop turn
// (8k result rows + 2k prompt, tool call, and answer) and ~3.5k for the one-time
// widget generation.

// ─── Styles ──────────────────────────────────────────────────────────────────

// The demo is always light, matching the post's light diagrams even in dark mode.
const USER_BUBBLE =
  "self-end max-w-[85%] rounded-xl bg-slate-800 px-3 py-2 text-[13px] leading-relaxed text-white";
const ASSISTANT_BUBBLE =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-900";
const TOKEN_NOTE = "text-xs text-slate-500";

function Panel({
  title,
  metric,
  metricClass,
  children,
}: {
  title: string;
  metric: string;
  metricClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-900">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <span className="text-[13px] font-medium">{title}</span>
        <span className={`text-[13px] font-medium tabular-nums ${metricClass}`}>{metric}</span>
      </div>
      {/* Chat text renders at 0.8; the widget card compensates to land at 0.7 overall.
          tabIndex makes the overflowing transcript keyboard-scrollable in Safari. */}
      <div
        tabIndex={0}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
        style={{ zoom: 0.8 }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── The demo ────────────────────────────────────────────────────────────────

export const LiveFilterDemo = () => {
  return (
    // Scoped light theme: the widget's --openui-* tokens stay light even when the site
    // is dark, so the demo matches the post's light diagrams. The explicit cssSelector
    // keeps the override inside the demo; the provider's portal class carries it to the
    // Select menu, which portals to <body>.
    <ThemeProvider mode="light" cssSelector=".openui-demo-light">
      <div className="openui-demo-light not-prose my-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* The Select menu portals to <body>, escaping the widget's zoom. This page's only
            Select is the demo's, so scale the portal to match; min-width is divided back up
            so the menu still spans the trigger. */}
        <style>{`
          .openui-select-content {
            zoom: 0.7;
            min-width: calc(var(--radix-select-trigger-width) / 0.7);
          }
        `}</style>
        {/* Tool-calling loop: the same three date changes, each a full model round trip */}
        <Panel
          title="Tool-calling loop"
          metric={`~${LOOP_TURNS.length * 10}k tokens · ~30s`}
          metricClass="text-red-700"
        >
          {LOOP_TURNS.map((turn, i) => {
            const rows = computeRows(turn.days);
            const total = rows.reduce((s, r) => s + r.revenue, 0);
            return (
              <div key={i} className="flex flex-col gap-3">
                <div className={USER_BUBBLE}>{turn.user}</div>
                <div className="flex flex-col items-start gap-1">
                  <div className={ASSISTANT_BUBBLE}>
                    <p>
                      Over the last {turn.days} days, total revenue was {fmt(total)}. By region:
                    </p>
                    <ul className="mt-1.5 space-y-0.5">
                      {rows.map((r) => (
                        <li key={r.region} className="tabular-nums">
                          {r.region}: {fmt(r.revenue)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className={TOKEN_NOTE}>~10k tokens</span>
                </div>
              </div>
            );
          })}
        </Panel>

        {/* Generative UI: one model call, then the dropdown re-queries for free */}
        <Panel title="Generative UI" metric="~3.5k tokens · ~3s" metricClass="text-emerald-700">
          <div className={USER_BUBBLE}>Show daily revenue by region for the last 7 days.</div>
          <div className="flex flex-col items-start gap-1">
            {/* 0.8 (panel) × 0.875 ≈ 0.7 effective */}
            <div
              className="w-full rounded-xl border border-slate-200 bg-white p-3"
              style={{ zoom: 0.875 }}
            >
              <Renderer
                library={openuiLibrary}
                response={SPEC}
                isStreaming={false}
                toolProvider={toolProvider}
              />
            </div>
            <span className={TOKEN_NOTE}>
              ~3.5k tokens, once · filter changes: 0 tokens, ~100ms each
            </span>
          </div>
        </Panel>
      </div>
    </ThemeProvider>
  );
};
