"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { TrendChart as TrendChartView } from "../components/charts/TrendChart";
import { FILL_MAX_HEIGHT } from "../components/charts/utils/constants";
import {
  eventSchema,
  formatSchema,
  passed,
  seriesSchema,
  type Band,
  type Target,
} from "../core/schemas";
import { Pending } from "./Pending";

export const TrendChart = defineComponent({
  name: "TrendChart",
  description:
    'Line or area chart over time with a crosshair tooltip, an end label, and events. Up to 4 series in a fixed color order; mark context series (the comparison) "muted" and the story\'s series "primary". partial true draws an in-progress last point dotted; band shades a benchmark range; target draws a goal line. Use it instead of LineChart and AreaChart: TrendChart(sales.labels, [{name: "This period", values: sales.totalSales, emphasis: "primary"}, {name: sales.comparisonLabel, values: sales.comparison, emphasis: "muted"}], "currency", "area", sales.events, true).',
  props: z.object({
    labels: z.array(z.string()).default([]),
    series: z.array(seriesSchema).default([]),
    format: formatSchema.optional(),
    variant: z.enum(["area", "line"]).optional(),
    events: z.array(eventSchema).optional(),
    partial: z.boolean().optional(),
    band: passed("A tool's band: {label, from, to}").optional(),
    target: passed("A tool's target: {label, value}").optional(),
  }),
  component: ({ props }) => {
    const labels = props.labels ?? [];
    // A series whose values have not arrived (a mid-stream or misnamed field)
    // is dropped, not drawn: the chart reads every series' values.
    const series = (props.series ?? []).filter((s) => Array.isArray(s?.values));
    if (labels.length === 0 || !series.some((s) => s.values.length > 0)) {
      return <Pending kind="trend" />;
    }
    return (
      <TrendChartView
        labels={labels}
        series={series}
        format={props.format}
        variant={props.variant}
        events={props.events}
        partial={props.partial}
        band={props.band as Band | undefined}
        target={props.target as Target | undefined}
        fill
        maxHeight={FILL_MAX_HEIGHT}
      />
    );
  },
});
