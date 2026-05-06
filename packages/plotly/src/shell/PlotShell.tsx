"use client";
import type { ActionPlan } from "@openuidev/react-lang";
import { useIsStreaming, useTriggerAction } from "@openuidev/react-lang";
import type {
  Config,
  Data,
  Layout,
  PlotMouseEvent,
  PlotRelayoutEvent,
  PlotSelectionEvent,
} from "plotly.js";
import React from "react";
import { ChartSkeleton, NoDataNotice } from "./skeleton";
import { defaultConfig, lightTemplate } from "./template";

// Single React.lazy Plot component shared by every chart in the library.
// Dynamic imports of plotly.js-dist-min and react-plotly.js stay dynamic at
// build time — neither module is touched at SSR / module-load time, only when
// React actually mounts the lazy component on the client. This is essential
// because plotly.js-dist-min references `self` at top level and would crash
// any Node SSR pass that statically imports it.
const Plot = React.lazy(async () => {
  const [{ default: Plotly }, { default: createPlotlyComponent }] = await Promise.all([
    import("plotly.js-dist-min"),
    import("react-plotly.js/factory"),
  ]);
  return { default: createPlotlyComponent(Plotly) };
});

export interface PlotShellProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
  /** Optional openui-lang ActionPlan fired on plotly_click. */
  onClick?: ActionPlan;
  /** Optional openui-lang ActionPlan fired on plotly_selected (lasso/box select). */
  onSelected?: ActionPlan;
  /** Optional openui-lang ActionPlan fired on plotly_relayout (zoom/pan). */
  onRelayout?: ActionPlan;
  /** Bumped on each render to force Plotly's diff path; built-in default is fine. */
  revision?: number;
}

const HASH_SAMPLE_LIMIT = 6;

// Cheap content hash to bump datarevision so Plotly always diffs even if
// the parent passes the same array reference (defensive for streaming edits).
function quickHash(data: Data[], layout?: Partial<Layout>): number {
  let h = 0;
  const str =
    JSON.stringify(
      data.map((trace) => {
        const t = trace as Record<string, unknown>;
        return {
          type: t["type"],
          // sample the first few values of x/y/values rather than the full arrays
          x: Array.isArray(t["x"]) ? (t["x"] as unknown[]).slice(0, HASH_SAMPLE_LIMIT) : undefined,
          y: Array.isArray(t["y"]) ? (t["y"] as unknown[]).slice(0, HASH_SAMPLE_LIMIT) : undefined,
          values: Array.isArray(t["values"])
            ? (t["values"] as unknown[]).slice(0, HASH_SAMPLE_LIMIT)
            : undefined,
        };
      }),
    ) + (layout ? JSON.stringify(layout.title ?? "") : "");
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Extract the small, stable subset of Plotly's event payload that's useful in
// an Action context. Plotly's full payload is huge and unstable across versions.
function extractPoints(e: PlotMouseEvent | PlotSelectionEvent): Record<string, unknown> {
  const points = (e?.points ?? []).slice(0, 50).map((p) => {
    const point = p as unknown as {
      x?: unknown;
      y?: unknown;
      label?: unknown;
      value?: unknown;
      pointIndex?: number;
      pointNumber?: number;
      curveNumber?: number;
      customdata?: unknown;
    };
    return {
      x: point.x,
      y: point.y,
      label: point.label,
      value: point.value,
      pointIndex: point.pointIndex ?? point.pointNumber,
      curveNumber: point.curveNumber,
      customdata: point.customdata,
    };
  });
  return { points };
}

export function PlotShell({
  data,
  layout,
  config,
  height = 320,
  onClick,
  onSelected,
  onRelayout,
  revision,
}: PlotShellProps) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();

  const hasData = Array.isArray(data) && data.length > 0;

  // No data + still streaming → loading skeleton (data may arrive any moment).
  // No data + stream finished → "No data" notice (data is never coming; usually
  // an unresolved variable in the LLM's openui-lang).
  if (!hasData) {
    return isStreaming ? (
      <ChartSkeleton height={height} />
    ) : (
      <NoDataNotice height={Math.min(height, 160)} />
    );
  }

  const merged: Partial<Layout> = {
    ...lightTemplate,
    ...layout,
    // Keep nested overrides composable
    xaxis: { ...lightTemplate.xaxis, ...(layout?.xaxis ?? {}) },
    yaxis: { ...lightTemplate.yaxis, ...(layout?.yaxis ?? {}) },
    legend: { ...lightTemplate.legend, ...(layout?.legend ?? {}) },
    hoverlabel: { ...lightTemplate.hoverlabel, ...(layout?.hoverlabel ?? {}) },
    title: {
      ...(lightTemplate.title ?? {}),
      ...(typeof layout?.title === "string" ? { text: layout.title } : (layout?.title ?? {})),
    },
    datarevision: revision ?? quickHash(data, layout),
    autosize: true,
  };

  const mergedConfig: Partial<Config> = { ...defaultConfig, ...config };

  return (
    <div className="openui-plotly-mount" style={{ width: "100%" }}>
      <React.Suspense fallback={<ChartSkeleton height={height} />}>
        <Plot
          data={data}
          layout={merged}
          config={mergedConfig}
          style={{ width: "100%", height }}
          useResizeHandler
          onClick={
            onClick
              ? (e) =>
                  triggerAction("plotly_click", undefined, {
                    type: "plotly_click",
                    params: extractPoints(e),
                  })
              : undefined
          }
          onSelected={
            onSelected
              ? (e) =>
                  triggerAction("plotly_selected", undefined, {
                    type: "plotly_selected",
                    params: e ? extractPoints(e) : { points: [] },
                  })
              : undefined
          }
          onRelayout={
            onRelayout
              ? (e: PlotRelayoutEvent) =>
                  triggerAction("plotly_relayout", undefined, {
                    type: "plotly_relayout",
                    params: e as Record<string, unknown>,
                  })
              : undefined
          }
        />
      </React.Suspense>
    </div>
  );
}
