"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { defineComponent } from "@openuidev/react-lang";
import { useEffect, useRef, type ReactNode } from "react";
import { z } from "zod";

import { asArray, buildPie, buildSeries, hasAllProps } from "../helpers";
import { CHART_PALETTE } from "../theme";

const CHART_HEIGHT = 260;
const CHART_MARGIN = { top: 16, right: 16, bottom: 30, left: 44 };

// The x-charts tooltip anchors a Popper to the pointer's viewport coordinates. Inside
// this scrolling chat surface, Popper's default `preventOverflow` modifier detects a
// bad clipping boundary and clamps the tooltip's vertical position to the top of the
// viewport — so on hover it renders far above the bars, detached from the chart.
// Disabling `preventOverflow` lets the tooltip sit at the pointer where it belongs
// (`flip` is kept, so it still flips sides near the right edge).
const CHART_TOOLTIP_SLOT_PROPS = {
  popper: { popperOptions: { modifiers: [{ name: "preventOverflow", enabled: false }] } },
};

// Even correctly anchored, the tooltip is portaled to <body> and won't follow the
// chart when the chat surface scrolls — it would stay at its last pointer position and
// drift away from the bars. A hover tooltip's intent is gone the moment the user
// scrolls, so we dismiss it: on any scroll we send a synthetic pointerleave to the
// chart's SVG surface, which clears the interaction state and closes the tooltip.
// Scroll events don't bubble but do reach `window` in the capture phase, so one window
// listener covers the scrolling chat container.
function ChartFrame({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const dismissTooltip = () => {
      node.querySelector("svg")?.dispatchEvent(
        new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }),
      );
    };
    window.addEventListener("scroll", dismissTooltip, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", dismissTooltip, { capture: true });
  }, []);

  return (
    <Box ref={ref} sx={sx}>
      {children}
    </Box>
  );
}

// ── Virtual sub-components (data-only) ──

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
  description: "A single slice in a PieChart.",
  component: () => null,
});

// ── BarChart ──

export const BarChartComponent = defineComponent({
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
    const labels = asArray(props.labels).map(String);
    const series = buildSeries(props.series);
    if (!series.length) return null;
    const stacked = props.variant === "stacked";

    return (
      <ChartFrame sx={{ width: "100%" }}>
        <BarChart
          slotProps={CHART_TOOLTIP_SLOT_PROPS}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          xAxis={[{ data: labels, scaleType: "band", label: props.xLabel }]}
          yAxis={[{ label: props.yLabel }]}
          series={series.map((s, i) => ({
            data: s.data,
            label: s.label,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
            ...(stacked ? { stack: "total" } : {}),
          }))}
        />
      </ChartFrame>
    );
  },
});

// ── LineChart ──

export const LineChartComponent = defineComponent({
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
    const labels = asArray(props.labels).map(String);
    const series = buildSeries(props.series);
    if (!series.length) return null;

    return (
      <ChartFrame sx={{ width: "100%" }}>
        <LineChart
          slotProps={CHART_TOOLTIP_SLOT_PROPS}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          xAxis={[{ data: labels, scaleType: "point", label: props.xLabel }]}
          yAxis={[{ label: props.yLabel }]}
          series={series.map((s, i) => ({
            data: s.data,
            label: s.label,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
            curve: "monotoneX",
            showMark: false,
          }))}
        />
      </ChartFrame>
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
  description: "Pie or donut chart. slices: Slice[], donut: boolean for a ring chart.",
  component: ({ props }) => {
    const data = buildPie(props.slices);
    if (!data.length) return null;
    const colored = data.map((d, i) => ({ ...d, color: CHART_PALETTE[i % CHART_PALETTE.length] }));

    return (
      <ChartFrame sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <PieChart
          slotProps={CHART_TOOLTIP_SLOT_PROPS}
          height={CHART_HEIGHT}
          series={[
            {
              data: colored,
              innerRadius: props.donut ? 60 : 0,
              paddingAngle: props.donut ? 2 : 0,
              cornerRadius: 3,
            },
          ]}
        />
      </ChartFrame>
    );
  },
});
