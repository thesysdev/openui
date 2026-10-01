// OpenUI's LineChart and BarChart in the F1 look: a short title inside the chart's tinted panel,
// 3px lines, chunkier bars, and each series in its team colour when its name is a driver code,
// a driver or a team ("VER", "Norris", "Ferrari", "NOR − LEC"). Same positional arguments as
// OpenUI's charts, with title after yLabel: LineChart(labels, series, variant, xLabel, yLabel, title).
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { BarChartCondensed, LineChartCondensed } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod/v4";
import { findDriver, findTeam } from "./f1-genui";
import { teamColour } from "./f1-assets";
import "./f1-charts.css";

type Shape = Record<string, z.ZodType>;
type Props = Record<string, unknown>;
type Point = Record<string, string | number>;

// For series that aren't a driver or team: Hot Red, Carbon, Bright Blue, Shift Green, Sector Purple, Warning.
const FALLBACK = ["#E10600", "#15151E", "#0076CC", "#1A8930", "#5300A6", "#E66700"];

/** A team colour for "VER", "Norris", "Ferrari" or "NOR − LEC" (its first name), else undefined. */
function seriesColour(name: string) {
  const first = name.split(/\s*[−–-]\s*|\s+vs\.?\s+/i)[0] ?? name;
  const team = findDriver(first)?.team ?? findTeam(first);
  return team ? teamColour(team) : undefined;
}

// Mix toward white, so a second car from the same team reads as its teammate.
function lighten(hex: string, amount: number) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${c.map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function palette(names: string[]) {
  const used = new Map<string, number>();
  let fallback = 0;
  return names.map((name) => {
    const team = seriesColour(name);
    if (!team) return FALLBACK[fallback++ % FALLBACK.length];
    const n = used.get(team) ?? 0;
    used.set(team, n + 1);
    return n ? lighten(team, 0.45) : team;
  });
}

// OpenUI's charts spread a palette from its middle (1 series takes the centre, 2 take the
// neighbours either side). Lay the colours out so that spread lands on them in series order.
function forSpread(colours: string[]) {
  const n = colours.length;
  if (n === 0) return colours;
  const out = Array<string>(n * 2 + 3).fill(colours[0]);
  const mid = Math.floor(out.length / 2);
  const at = (i: number) => (n === 2 ? mid + (i === 0 ? -1 : 1) : mid + (i - Math.floor((n - 1) / 2)));
  colours.forEach((c, i) => (out[at(i)] = c));
  return out;
}

type SeriesNode = { props?: { category?: unknown; values?: unknown } };

/** labels + [Series(name, values)] → rows of { category, [name]: value }, as OpenUI builds them. */
function chartData(labels: unknown, series: unknown) {
  const lbls = (Array.isArray(labels) ? labels : []).map(String);
  const nodes = (Array.isArray(series) ? series : [series]).filter(
    (s): s is SeriesNode => !!s && typeof s === "object" && !Array.isArray(s) && "props" in s,
  );
  const named = nodes
    .map((s) => ({ name: s.props?.category, values: s.props?.values }))
    .filter((s): s is { name: string; values: unknown[] } => typeof s.name === "string" && Array.isArray(s.values));
  const data: Point[] = lbls.map((category, i) => {
    const point: Point = { category };
    for (const s of named) if (i < s.values.length && typeof s.values[i] === "number") point[s.name] = s.values[i] as number;
    return point;
  });
  return { data, names: named.map((s) => s.name) };
}

function titled(name: "LineChart" | "BarChart", description: string) {
  const base = openuiLibrary.components[name];
  // Reuse OpenUI's own schema and slot `title` in before `height`. Arguments are positional in
  // OpenUI Lang, so key order is call order: the title comes right after yLabel, ahead of the
  // optional height.
  const { height, ...shape } = (base.props as unknown as z.ZodObject<Shape>).shape;
  const Base = base.component as (p: ComponentRenderProps<Props>) => React.ReactNode;
  return defineComponent({
    name,
    props: z.object({ ...shape, title: z.string().optional(), height }),
    description,
    component: (renderProps: ComponentRenderProps<Props>) => {
      const p = renderProps.props;
      const title = p.title as string | undefined;
      const { data, names } = chartData(p.labels, p.series);
      const common = {
        data,
        categoryKey: "category" as const,
        customPalette: forSpread(palette(names)),
        xAxisLabel: p.xLabel as string | undefined,
        yAxisLabel: p.yLabel as string | undefined,
        height: p.height as number | undefined,
        // No draw-in animation: the chart appears once its block settles, with the gate's fade.
        isAnimationActive: false,
      };
      // Rows-as-arrays and other shapes OpenUI accepts fall back to its own renderer.
      const chart = !names.length || !data.length ? (
        <Base {...renderProps} />
      ) : name === "LineChart" ? (
        <LineChartCondensed {...common} variant={p.variant as "linear" | "natural" | "step" | undefined} strokeWidth={3} />
      ) : (
        <BarChartCondensed {...common} variant={p.variant as "grouped" | "stacked" | undefined} maxBarWidth={28} radius={2} />
      );
      return (
        <figure className="f1-chart">
          {title && <figcaption className="f1-chart-title">{title}</figcaption>}
          {chart}
        </figure>
      );
    },
  });
}

export const LineChart = titled(
  "LineChart",
  'Lines over categories; use for trends and continuous data over time. Name each Series with a driver code or team so it takes the team colour. title: a short name for the chart, e.g. "Hamilton lap times, Baku".',
);

export const BarChart = titled(
  "BarChart",
  'Vertical bars; use for comparing values across categories with one or more series. Name each Series with a driver code or team so it takes the team colour. title: a short name for the chart, e.g. "Pit stop times, Baku".',
);
