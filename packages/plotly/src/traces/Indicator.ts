"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const IndicatorSchema = z.object({
  value: z.number(),
  reference: z.number().optional(),
  mode: z
    .enum(["number", "delta", "gauge", "number+delta", "number+gauge", "gauge+number+delta"])
    .optional(),
  title: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  decimals: z.number().int().min(0).optional(),
  rangeMin: z.number().optional(),
  rangeMax: z.number().optional(),
  threshold: z.number().optional(),
  height: z.number().positive().optional(),
});

export const Indicator = defineComponent({
  name: "Indicator",
  props: IndicatorSchema,
  description:
    "Big-number / delta / gauge indicator. `mode`: 'number' (default) | 'delta' | 'gauge' | combinations like 'number+delta'. For deltas, pass `reference` (the previous value). For gauges, pass `rangeMin`/`rangeMax` (default 0..value*2) and optional `threshold`.",
  component: ({ props }) => {
    const mode = props.mode ?? "number";
    const usesGauge = mode.includes("gauge");
    const usesDelta = mode.includes("delta");
    const trace = {
      type: "indicator",
      mode,
      value: props.value,
      title: props.title ? { text: props.title, font: { size: 13 } } : undefined,
      number: {
        prefix: props.prefix,
        suffix: props.suffix,
        valueformat: props.decimals !== undefined ? `,.${props.decimals}f` : ",",
        font: { size: 36 },
      },
      delta: usesDelta
        ? {
            reference: props.reference,
            relative: false,
            valueformat: ",.1f",
          }
        : undefined,
      gauge: usesGauge
        ? {
            axis: {
              range: [props.rangeMin ?? 0, props.rangeMax ?? props.value * 2],
            },
            bar: { color: "#4c78a8" },
            threshold:
              props.threshold !== undefined
                ? { line: { color: "#dc2626", width: 3 }, value: props.threshold }
                : undefined,
          }
        : undefined,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      margin: { t: 24, b: 16, l: 24, r: 24 },
    };
    return React.createElement(PlotShell, {
      data: [trace],
      layout,
      height: props.height ?? (usesGauge ? 240 : 160),
    });
  },
});
