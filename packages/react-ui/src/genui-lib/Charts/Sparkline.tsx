"use client";

import { scaleLinear, scalePoint } from "d3-scale";
import { area, line } from "d3-shape";
import { useId, useRef } from "react";
import { useContainerSize } from "../../components/Charts/hooks/core/useContainerSize";
import { miniCurves } from "../../components/Charts/shared/mini/miniChartUtils";
import { useChartPalette } from "../../components/Charts/utils/paletteUtils";

/**
 * At or below this height a LineChart or AreaChart has no room for axes and a
 * legend, so it draws as a sparkline instead: full width, no axes, no legend.
 */
export const SPARKLINE_MAX_HEIGHT = 120;

// Room for the stroke and any curve overshoot at the top and bottom.
const INSET = 3;

type Row = Record<string, string | number>;

export function Sparkline({
  data,
  height,
  variant = "natural",
  kind,
}: {
  data: Row[];
  height: number;
  variant?: "linear" | "natural" | "step";
  kind: "line" | "area";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const gradientId = useId();
  const { width } = useContainerSize(ref, undefined, height);
  const keys = Object.keys(data[0] ?? {}).filter((k) => k !== "category");
  const colors = useChartPalette({
    themePaletteName: kind === "area" ? "areaChartPalette" : "lineChartPalette",
    dataLength: keys.length,
  });

  // Scaled to the series' own range, not anchored at zero, so a small change
  // still reads as a trend.
  const values = data.flatMap((row) => keys.map((k) => Number(row[k])).filter(Number.isFinite));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = scalePoint<number>()
    .domain(data.map((_, i) => i))
    .range([0, width]);
  const y = scaleLinear()
    .domain(min === max ? [min - 1, max + 1] : [min, max])
    .range([height - INSET, INSET]);
  const curve = miniCurves[variant] ?? miniCurves.natural;

  return (
    <div ref={ref} className="openui-genui-sparkline" style={{ width: "100%", height }}>
      {width > 0 && values.length > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
          {keys.map((key, i) => {
            const color = colors[i % colors.length] ?? "currentColor";
            const px = (_: Row, index: number) => x(index) ?? 0;
            const py = (row: Row) => y(Number(row[key]) || 0);
            const lineD = line<Row>().x(px).y(py).curve(curve)(data) ?? "";
            const fillId = `${gradientId}-${i}`;
            return (
              <g key={key}>
                {kind === "area" && (
                  <>
                    <defs>
                      <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path
                      d={area<Row>().x(px).y0(height).y1(py).curve(curve)(data) ?? ""}
                      fill={`url(#${fillId})`}
                    />
                  </>
                )}
                <path
                  d={lineD}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
