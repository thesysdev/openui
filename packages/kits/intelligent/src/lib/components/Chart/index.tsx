"use client";

import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { ChartSchema, type ChartProps } from "./schema";

export * from "./schema";

type Row = Record<string, string | number>;

const rowsOf = (data: unknown): Row[] => (Array.isArray(data) ? (data as Row[]).filter((r) => r && typeof r === "object") : []);

/** The category key, defaulting to the first non-numeric column. */
const categoryOf = (rows: Row[], x?: string): string => {
  if (x) return x;
  const first = rows[0] ?? {};
  return Object.keys(first).find((k) => typeof first[k] === "string") ?? Object.keys(first)[0] ?? "";
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

export const Chart = defineComponent({
  name: "Chart",
  props: ChartSchema,
  description:
    'Rows of data; x is the category key (a number key for scatter), series the value keys (default: every number key). percent values are like 45; currency is a code like "EUR".',
  component: ({ props }: { props: ChartProps }) => {
    const rows = rowsOf(props.data);
    const category = categoryOf(rows, props.x);
    const series = seriesOf(rows, category, props.series);
    const height = typeof props.height === "number" ? props.height : undefined;

    if (!rows.length || !category) return null;

    // 1D: one slice per row, valued by the first series key.
    if (props.type === "pie" || props.type === "donut") {
      return (
        <PieChart
          data={rows}
          categoryKey={category}
          dataKey={series[0] ?? ""}
          variant={props.type}
          format={props.format === "percent" ? "percentage" : "number"}
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
          isAnimationActive={false}
        />
      );
    }

    const data = narrow(rows, category, series);
    const common = { data, categoryKey: category, height, isAnimationActive: false } as const;

    if (props.type === "line") return <LineChart {...common} />;
    if (props.type === "area") return <AreaChart {...common} />;
    return <BarChart {...common} variant={props.stacked ? "stacked" : "grouped"} />;
  },
});
