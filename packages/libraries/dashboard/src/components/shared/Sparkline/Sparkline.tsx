"use client";

import { useId } from "react";
import { MUTED_COLOR } from "../../../shared/colors";

export type SparklineProps = {
  values: (number | null)[];
  previous?: (number | null)[];
  color?: string;
  showPrevious?: boolean;
};

/* ---------- Sparkline ---------- */

export function Sparkline({
  values,
  previous,
  color = "var(--openui-dashboard-series-1)",
  showPrevious = false,
}: SparklineProps) {
  const id = `openui-dashboard-spark-${useId().replace(/:/g, "")}`;
  const points = values.filter((value): value is number => value !== null);
  if (points.length < 2) return null;
  const all =
    showPrevious && previous
      ? [...points, ...previous.filter((v): v is number => v !== null)]
      : points;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const width = 120;
  const height = 44;
  const pad = 3;
  const path = (series: (number | null)[]) => {
    const step = (width - pad * 2) / Math.max(1, series.length - 1);
    return series
      .map((value, i) => {
        if (value === null) return null;
        const x = pad + i * step;
        const y =
          max === min ? height / 2 : pad + (1 - (value - min) / (max - min)) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  };
  const line = path(values);
  const last = line.split(" ").at(-1)?.split(",") ?? ["0", "0"];
  return (
    <svg className="openui-dashboard-kpi-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor={color}
            style={{ stopOpacity: "calc(var(--openui-dashboard-area-wash) * 2)" }}
          />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <pattern
          id={`${id}-dots`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle
            cx="1.8"
            cy="1.8"
            r="0.8"
            fill={color}
            style={{ opacity: "var(--openui-dashboard-area-dot)" }}
          />
        </pattern>
        <linearGradient id={`${id}-fade`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      {showPrevious && previous ? (
        <polyline
          points={path(previous)}
          fill="none"
          stroke={MUTED_COLOR}
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      ) : null}
      <polygon
        points={`${pad},${height} ${line} ${last[0]},${height}`}
        fill={`url(#${id}-dots)`}
        mask={`url(#${id}-mask)`}
      />
      <polygon points={`${pad},${height} ${line} ${last[0]},${height}`} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.75"
        fill={color}
        stroke="var(--openui-dashboard-surface)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
