"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { buildAxisLayout } from "../helpers/buildTrace";
import { PlotShell } from "../shell/PlotShell";

const CandlestickSchema = z.object({
  x: z.array(z.union([z.string(), z.number()])),
  open: z.array(z.number()),
  high: z.array(z.number()),
  low: z.array(z.number()),
  close: z.array(z.number()),
  upColor: z.string().optional(),
  downColor: z.string().optional(),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  showRangeSlider: z.boolean().optional(),
  height: z.number().positive().optional(),
});

export const Candlestick = defineComponent({
  name: "Candlestick",
  props: CandlestickSchema,
  description:
    "OHLC candlestick chart. Pass parallel arrays: `x` (timestamps or labels), `open`, `high`, `low`, `close`. Up days fill green, down days red — override with `upColor`/`downColor`. `showRangeSlider=true` adds a Plotly range slider below the chart.",
  component: ({ props }) => {
    if (!props.x?.length) return null;
    const trace = {
      type: "candlestick",
      x: props.x as Array<string | number>,
      open: props.open,
      high: props.high,
      low: props.low,
      close: props.close,
      increasing: {
        line: { color: props.upColor ?? "#16a34a" },
        fillcolor: props.upColor ?? "#16a34a",
      },
      decreasing: {
        line: { color: props.downColor ?? "#dc2626" },
        fillcolor: props.downColor ?? "#dc2626",
      },
    } as unknown as Data;
    const layout: Partial<Layout> = {
      ...(buildAxisLayout(props) as Partial<Layout>),
      xaxis: { rangeslider: { visible: props.showRangeSlider ?? false } },
      showlegend: false,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
