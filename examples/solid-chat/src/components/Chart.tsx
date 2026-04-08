import type { ECharts } from "echarts";
import * as echarts from "echarts";
import { createEffect, onCleanup, onMount } from "solid-js";

interface ChartProps {
  title: string;
  type: "bar" | "line" | "pie" | "doughnut";
  labels: string[];
  values: number[];
  datasetLabel?: string;
}

export function Chart(props: { props: ChartProps }) {
  let chartEl: HTMLDivElement | undefined;
  let chart: ECharts | undefined;

  function buildOption() {
    const label = props.props.datasetLabel || "Value";
    if (props.props.type === "pie" || props.props.type === "doughnut") {
      return {
        color: ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: props.props.type === "doughnut" ? ["45%", "70%"] : "70%",
            label: { color: "#334155" },
            data: props.props.labels.map((name, i) => ({
              name,
              value: props.props.values[i] ?? 0,
            })),
          },
        ],
      };
    }

    return {
      color: ["#2563eb", "#22c55e", "#8b5cf6"],
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: props.props.labels,
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
      },
      yAxis: {
        type: "value",
        name: label,
        axisLabel: { color: "#475569" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
      },
      series: [
        {
          type: props.props.type,
          data: props.props.values,
          smooth: props.props.type === "line",
          areaStyle: props.props.type === "line" ? { opacity: 0.12 } : undefined,
        },
      ],
      grid: { left: 56, right: 20, top: 24, bottom: 28, containLabel: true },
    };
  }

  onMount(() => {
    if (!chartEl) return;
    chart = echarts.init(chartEl);
    chart.setOption(buildOption());
    const resize = () => chart?.resize();
    window.addEventListener("resize", resize);
    onCleanup(() => {
      window.removeEventListener("resize", resize);
      chart?.dispose();
    });
  });

  createEffect(() => {
    if (!chart) return;
    chart.setOption(buildOption(), true);
  });

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <div style={{ "font-size": "13px", "font-weight": 600, color: "#27272a" }}>
        {props.props.title} ({props.props.type})
      </div>
      <div
        ref={chartEl}
        style={{
          height: "300px",
          width: "100%",
          "min-width": "0",
          "border-radius": "12px",
          background: "rgba(248,250,252,0.8)",
          border: "1px solid rgba(148,163,184,0.2)",
          padding: "6px",
          "box-sizing": "border-box",
        }}
      />
    </div>
  );
}
