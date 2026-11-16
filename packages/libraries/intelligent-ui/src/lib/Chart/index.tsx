"use client";

import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { defaultLightTheme, useIntelligentTheme } from "../../components/ThemeProvider";
import { ChartSchema, type ChartProps } from "./schema";

export * from "./schema";

type Row = Record<string, string | number>;

const rowsOf = (data: unknown): Row[] =>
  Array.isArray(data) ? (data as Row[]).filter((r) => r && typeof r === "object") : [];

/** The category key, defaulting to the first non-numeric column. */
const categoryOf = (rows: Row[], x?: string): string => {
  if (x) return x;
  const first = rows[0] ?? {};
  return (
    Object.keys(first).find((k) => typeof first[k] === "string") ?? Object.keys(first)[0] ?? ""
  );
};

/** Value keys, defaulting to every numeric column that is not the category. */
const seriesOf = (rows: Row[], category: string, series?: string[]): string[] => {
  if (series?.length) return series;
  const first = rows[0] ?? {};
  return Object.keys(first).filter((k) => k !== category && typeof first[k] === "number");
};

/** Narrow each row to the category plus the chosen series, so unrelated columns are not plotted. */
const narrow = (rows: Row[], category: string, series: string[]): Row[] =>
  rows.map((row) => {
    const out: Row = { [category]: row[category] ?? "" };
    for (const key of series) out[key] = typeof row[key] === "number" ? (row[key] as number) : 0;
    return out;
  });

const CHART_KEYS = [
  "intelligentChart1",
  "intelligentChart2",
  "intelligentChart3",
  "intelligentChart4",
  "intelligentChart5",
  "intelligentChart6",
] as const;

/**
 * The theme's chart colours for `count` series, in order: series 1 gets chart colour 1, as in the
 * original Intelligent UI app, repeating after six. react-components spreads a palette out from
 * its middle (`getDistributedColors`): for an even count above 2 it starts one along, so the list
 * is turned back one place to land each colour on its own series.
 */
function seriesColours(theme: ReturnType<typeof useIntelligentTheme>, count: number): string[] {
  const source = theme?.theme ?? defaultLightTheme;
  const colours = CHART_KEYS.map((key) => source[key] ?? defaultLightTheme[key] ?? "#0285ff");
  const ordered = Array.from(
    { length: Math.max(count, 1) },
    (_, i) => colours[i % colours.length]!,
  );
  if (ordered.length > 2 && ordered.length % 2 === 0) ordered.unshift(ordered.pop()!);
  return ordered;
}

export const Chart = defineComponent({
  name: "Chart",
  props: ChartSchema,
  description:
    'Rows of data; x is the category key (a number key for scatter), series the value keys (default: every number key). format applies to pie and donut only: "percent" shows each slice as a share of the total, "number" its value. stacked stacks bar and area series. height sets the plot height in px; pie and donut ignore it and size themselves.',
  component: function ChartComponent({ props }: { props: ChartProps }) {
    const theme = useIntelligentTheme();
    const rows = rowsOf(props.data);
    const category = categoryOf(rows, props.x);
    const series = seriesOf(rows, category, props.series);
    const height = typeof props.height === "number" ? props.height : undefined;

    if (!rows.length || !category) return null;

    // 1D: one slice per row, valued by the first series key. No height: PieChart gives it to the
    // box but not the pie, so a short one lets the pie spill over the content below.
    if (props.type === "pie" || props.type === "donut") {
      return (
        <PieChart
          data={rows}
          categoryKey={category}
          dataKey={series[0] ?? ""}
          variant={props.type}
          format={props.format === "percent" ? "percentage" : "number"}
          customPalette={seriesColours(theme, rows.length)}
          isAnimationActive={false}
        />
      );
    }

    if (props.type === "scatter") {
      // ScatterChart takes DATASETS ({ name, data: [{x, y}] }), not flat rows:
      // one dataset per series, each point pairing the category value with that
      // series' value. The category is numeric for scatter.
      const datasets = series.map((key) => ({
        name: key,
        data: rows.map((row) => ({ x: Number(row[category] ?? 0), y: Number(row[key] ?? 0) })),
      }));
      return (
        <ScatterChart
          data={datasets}
          xAxisDataKey="x"
          yAxisDataKey="y"
          height={height}
          customPalette={seriesColours(theme, datasets.length)}
          isAnimationActive={false}
        />
      );
    }

    const data = narrow(rows, category, series);
    const common = {
      data,
      categoryKey: category,
      height,
      customPalette: seriesColours(theme, series.length),
      isAnimationActive: false,
    } as const;

    if (props.type === "line") return <LineChart {...common} />;
    // AreaChart stacks unless told not to; like a bar chart, this one stacks only when asked.
    if (props.type === "area") return <AreaChart {...common} stacked={props.stacked === true} />;
    return <BarChart {...common} variant={props.stacked ? "stacked" : "grouped"} />;
  },
});
