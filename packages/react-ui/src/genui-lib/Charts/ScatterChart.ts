"use client";

import { defineComponent } from "@openuidev/lang-react";
import React from "react";
import { z } from "zod";
import { ScatterChart as ScatterChartComponent } from "../../components/Charts";
import { asArray, hasAllProps } from "../helpers";
import { ScatterSeriesSchema } from "./ScatterSeries";

export const ScatterChartSchema = z.object({
  datasets: z.array(ScatterSeriesSchema),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

const unwrap = (node: any) => (node?.type === "element" ? node.props : node);

export const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: ScatterChartSchema,
  description: "X/Y scatter plot; use for correlations, distributions, and clustering",
  component: ({ props }) => {
    if (!hasAllProps(props as Record<string, unknown>, "datasets")) return null;
    const rawDatasets = asArray((props as any).datasets);
    const data = rawDatasets.map((ds: any) => {
      const dsProps = unwrap(ds);
      const rawPoints = asArray(dsProps?.points);
      return {
        name: (dsProps?.name ?? "") as string,
        data: rawPoints.map((pt: any) => {
          const ptProps = unwrap(pt);
          return {
            x: Number(ptProps?.x),
            y: Number(ptProps?.y),
            ...(ptProps?.z != null ? { z: Number(ptProps.z) } : {}),
          };
        }),
      };
    });
    if (!data.length) return null;
    return React.createElement(ScatterChartComponent, {
      data,
      xAxisDataKey: "x",
      yAxisDataKey: "y",
      isAnimationActive: false,
    });
  },
});
