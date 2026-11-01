"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { defineComponent } from "@openuidev/react-lang";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { asArray, formatDate, formatNumber, isDateLike, isElement } from "../format";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const color = (index: number) => COLORS[index % COLORS.length];

export const Series = defineComponent({
  name: "Series",
  props: z.object({
    category: z.string(),
    values: z.array(z.number()),
  }),
  description: "One named series for BarChart, LineChart, or AreaChart. values match labels.",
  component: () => null,
});

/**
 * Rows for recharts, one per label. Series are keyed s0, s1, … since their names can contain
 * dots (`next.js`), which recharts reads as paths; the chart config maps keys back to names.
 */
function cartesianData(labels: unknown, series: unknown) {
  const names: string[] = [];
  const columns: unknown[][] = [];
  for (const node of asArray(series)) {
    if (!isElement(node)) continue;
    names.push(String(node.props.category ?? `Series ${names.length + 1}`));
    columns.push(asArray(node.props.values));
  }
  const rows = asArray(labels).map((label, row) => {
    const point: Record<string, string | number> = { label: String(label ?? "") };
    columns.forEach((values, index) => {
      point[`s${index}`] = Number(values[row]) || 0;
    });
    return point;
  });
  const config: ChartConfig = {};
  names.forEach((name, index) => (config[`s${index}`] = { label: name, color: color(index) }));
  return { rows, keys: names.map((_, index) => `s${index}`), config };
}

const tickLabel = (value: unknown) =>
  isDateLike(value) ? formatDate(value, true) : String(value ?? "");
const tickNumber = (value: unknown) => formatNumber(Number(value), "compact");

const cartesianProps = z.object({
  labels: z.array(z.string()),
  series: z.array(Series.ref),
});

type Kind = "bar" | "line" | "area";

function CartesianChart({
  kind,
  labels,
  series,
  stacked,
  horizontal,
}: {
  kind: Kind;
  labels: unknown;
  series: unknown;
  stacked?: boolean;
  horizontal?: boolean;
}) {
  const { rows, keys, config } = cartesianData(labels, series);
  if (!rows.length || !keys.length) return null;
  const legend = keys.length > 1 && <ChartLegend content={<ChartLegendContent />} />;
  const tooltip = (
    <ChartTooltip
      cursor={kind === "bar" ? { fill: "var(--muted)" } : true}
      content={<ChartTooltipContent labelFormatter={(label) => tickLabel(label)} />}
    />
  );
  const grid = <CartesianGrid vertical={horizontal} horizontal={!horizontal} />;
  const height = horizontal ? Math.max(200, rows.length * 36 + 40) : 260;
  const className = "aspect-auto w-full";

  if (kind === "bar" && horizontal) {
    return (
      <ChartContainer config={config} className={className} style={{ height }}>
        <RechartsBarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          {grid}
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={120}
            tickFormatter={tickLabel}
          />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={tickNumber} />
          {tooltip}
          {legend}
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color(index)}
              radius={4}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    );
  }

  // Recharts finds its axes among the chart's direct children, so no fragment around them.
  const xAxis = (
    <XAxis
      dataKey="label"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={24}
      tickFormatter={tickLabel}
    />
  );
  const yAxis = <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={tickNumber} />;

  if (kind === "bar") {
    return (
      <ChartContainer config={config} className={className} style={{ height }}>
        <RechartsBarChart data={rows}>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          {legend}
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color(index)}
              radius={4}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    );
  }

  if (kind === "line") {
    return (
      <ChartContainer config={config} className={className} style={{ height }}>
        <RechartsLineChart data={rows}>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          {legend}
          {keys.map((key, index) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={color(index)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </RechartsLineChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className={className} style={{ height }}>
      <RechartsAreaChart data={rows}>
        {grid}
        {xAxis}
        {yAxis}
        {tooltip}
        {legend}
        {keys.map((key, index) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={color(index)}
            fill={color(index)}
            fillOpacity={0.2}
            strokeWidth={2}
            stackId={stacked ? "stack" : undefined}
            isAnimationActive={false}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  );
}

export const BarChart = defineComponent({
  name: "BarChart",
  props: cartesianProps.extend({
    variant: z.enum(["grouped", "stacked"]).optional(),
    orientation: z.enum(["vertical", "horizontal"]).optional(),
  }),
  description:
    'Bars comparing values across categories. orientation "horizontal" suits ranked lists with long labels, such as top packages.',
  component: ({ props }) => (
    <CartesianChart
      kind="bar"
      labels={props.labels}
      series={props.series}
      stacked={props.variant === "stacked"}
      horizontal={props.orientation === "horizontal"}
    />
  ),
});

export const LineChart = defineComponent({
  name: "LineChart",
  props: cartesianProps,
  description: "Lines over time; best for trends and comparing a few series.",
  component: ({ props }) => (
    <CartesianChart kind="line" labels={props.labels} series={props.series} />
  ),
});

export const AreaChart = defineComponent({
  name: "AreaChart",
  props: cartesianProps.extend({ variant: z.enum(["overlap", "stacked"]).optional() }),
  description: "Filled areas over time; good for volume, such as downloads or commits.",
  component: ({ props }) => (
    <CartesianChart
      kind="area"
      labels={props.labels}
      series={props.series}
      stacked={props.variant === "stacked"}
    />
  ),
});

export const PieChart = defineComponent({
  name: "PieChart",
  props: z.object({
    labels: z.array(z.string()),
    values: z.array(z.number()),
    donut: z.boolean().optional(),
  }),
  description: "Share of a whole, for a few categories. values match labels.",
  component: ({ props }) => {
    const labels = asArray(props.labels).map(String);
    const values = asArray(props.values).map((value) => Number(value) || 0);
    const rows = labels
      .map((label, index) => ({ key: `s${index}`, label, value: values[index] ?? 0 }))
      .filter((row) => row.value > 0);
    if (!rows.length) return null;
    const config: ChartConfig = {};
    rows.forEach((row, index) => (config[row.key] = { label: row.label, color: color(index) }));
    return (
      <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
        <RechartsPieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie
            data={rows}
            dataKey="value"
            nameKey="key"
            innerRadius={props.donut === false ? 0 : "55%"}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {rows.map((row, index) => (
              <Cell key={row.key} fill={color(index)} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="key" />} />
        </RechartsPieChart>
      </ChartContainer>
    );
  },
});
