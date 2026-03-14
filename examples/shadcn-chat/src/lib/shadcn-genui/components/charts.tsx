"use client";

import {
  ChartContainer,
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
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadialBar,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  RadarChart as RechartsRadarChart,
  RadialBarChart as RechartsRadialBarChart,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

import { buildChartData, buildSliceData, hasAllProps } from "../helpers";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function buildConfig(keys: string[]): ChartConfig {
  const config: ChartConfig = {};
  keys.forEach((key, i) => {
    config[key] = { label: key, color: COLORS[i % COLORS.length] };
  });
  return config;
}

function getSeriesKeys(data: Record<string, string | number>[]): string[] {
  if (!data.length) return [];
  return Object.keys(data[0]).filter((k) => k !== "category");
}

// ── Virtual sub-components ──

const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

export const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One named data series with values matching labels.",
  component: () => null,
});

const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});

export const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "A single slice in a PieChart or RadialChart.",
  component: () => null,
});

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
});

export const Point = defineComponent({
  name: "Point",
  props: PointSchema,
  description: "A single data point in a ScatterChart series.",
  component: () => null,
});

const ScatterSeriesSchema = z.object({
  category: z.string(),
  points: z.array(Point.ref),
});

export const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: ScatterSeriesSchema,
  description: "Named scatter series with Point references.",
  component: () => null,
});

// ── BarChart ──

export const BarChartCondensed = defineComponent({
  name: "BarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Vertical bar chart. Use for comparing values across categories.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    const keys = getSeriesKeys(data);
    const config = buildConfig(keys);
    const stacked = props.variant === "stacked";

    return (
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsBarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              radius={4}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    );
  },
});

// ── LineChart ──

export const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Line chart for trends over categories.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    const keys = getSeriesKeys(data);
    const config = buildConfig(keys);

    return (
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsLineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </RechartsLineChart>
      </ChartContainer>
    );
  },
});

// ── AreaChart ──

export const AreaChartCondensed = defineComponent({
  name: "AreaChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Area chart for showing volume over categories.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    const keys = getSeriesKeys(data);
    const config = buildConfig(keys);

    return (
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsAreaChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {keys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              stroke={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
              isAnimationActive={false}
            />
          ))}
        </RechartsAreaChart>
      </ChartContainer>
    );
  },
});

// ── PieChart ──

export const PieChartComponent = defineComponent({
  name: "PieChart",
  props: z.object({
    slices: z.array(SliceSchema),
    donut: z.boolean().optional(),
  }),
  description: "Pie or donut chart. slices: Slice[], donut: boolean for ring chart.",
  component: ({ props }) => {
    const data = buildSliceData(props.slices);
    if (!data.length) return null;
    const config = buildConfig(data.map((d) => d.category as string));

    return (
      <ChartContainer
        config={config}
        className="min-h-[200px] w-full mx-auto aspect-square max-h-[250px]"
      >
        <RechartsPieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            innerRadius={props.donut ? "50%" : 0}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ChartContainer>
    );
  },
});

// ── RadarChart ──

export const RadarChartComponent = defineComponent({
  name: "RadarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
  }),
  description: "Radar/spider chart for multi-dimensional comparison.",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "labels", "series")) return null;
    const data = buildChartData(props.labels, props.series);
    if (!data.length) return null;
    const keys = getSeriesKeys(data);
    const config = buildConfig(keys);

    return (
      <ChartContainer
        config={config}
        className="min-h-[200px] w-full mx-auto aspect-square max-h-[250px]"
      >
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <ChartTooltip content={<ChartTooltipContent />} />
          {keys.map((key, i) => (
            <Radar
              key={key}
              dataKey={key}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.3}
              stroke={COLORS[i % COLORS.length]}
              isAnimationActive={false}
            />
          ))}
        </RechartsRadarChart>
      </ChartContainer>
    );
  },
});

// ── RadialChart ──

export const RadialChartComponent = defineComponent({
  name: "RadialChart",
  props: z.object({
    slices: z.array(SliceSchema),
  }),
  description: "Radial bar chart for displaying categorized values in rings.",
  component: ({ props }) => {
    const data = buildSliceData(props.slices);
    if (!data.length) return null;
    const colored = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));
    const config = buildConfig(data.map((d) => d.category as string));

    return (
      <ChartContainer
        config={config}
        className="min-h-[200px] w-full mx-auto aspect-square max-h-[250px]"
      >
        <RechartsRadialBarChart data={colored} innerRadius={30} outerRadius={110}>
          <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
          <RadialBar dataKey="value" isAnimationActive={false} />
        </RechartsRadialBarChart>
      </ChartContainer>
    );
  },
});

// ── ScatterChart ──

export const ScatterChartComponent = defineComponent({
  name: "ScatterChart",
  props: z.object({
    series: z.array(ScatterSeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Scatter plot with named series of Point references.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seriesArr = ((props.series ?? []) as any[]).map((s) => ({
      category: String(s?.props?.category ?? ""),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      points: ((s?.props?.points ?? []) as any[]).map((p: any) => ({
        x: Number(p?.props?.x ?? 0),
        y: Number(p?.props?.y ?? 0),
      })),
    }));
    const config = buildConfig(seriesArr.map((s) => s.category));

    return (
      <ChartContainer config={config} className="min-h-[200px] w-full">
        <RechartsScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name={props.xLabel ?? "x"} />
          <YAxis type="number" dataKey="y" name={props.yLabel ?? "y"} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {seriesArr.map((s, i) => (
            <Scatter
              key={s.category}
              name={s.category}
              data={s.points}
              fill={COLORS[i % COLORS.length]}
              isAnimationActive={false}
            />
          ))}
        </RechartsScatterChart>
      </ChartContainer>
    );
  },
});
