import { area, line } from "d3-shape";
import { useId } from "react";
import { useEffectiveAnimation } from "../hooks/core/useEffectiveAnimation";
import { MiniChartFrame } from "../shared/mini/MiniChartFrame";
import {
  MINI_POINT_RADIUS,
  type MiniChartPoint,
  miniCurves,
  miniLineGeometry,
} from "../shared/mini/miniChartUtils";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { useChartPalette } from "../utils/paletteUtils";
import type { MiniAreaChartProps } from "./types";

const CLASS = `${CHART_CLASS_PREFIX}-mini-area-chart`;

/**
 * A compact, axis-free area sparkline: the most recent values that fit, one series, a gradient fill under a 1.5px
 * line.
 */
export function MiniAreaChart({
  data,
  customPalette,
  variant = "natural",
  opacity = 0.5,
  isAnimationActive = false,
  onAreaClick,
  size = "100%",
  className,
  areaColor,
  useGradient = true,
}: MiniAreaChartProps) {
  const animate = useEffectiveAnimation(isAnimationActive);
  const [color = ""] = useChartPalette({
    customPalette: customPalette ?? (areaColor ? [areaColor] : undefined),
    themePaletteName: "areaChartPalette",
    dataLength: 1,
  });
  const gradientId = `${CLASS}-gradient-${useId().replace(/:/g, "")}`;
  const curve = miniCurves[variant] ?? miniCurves.natural;
  const animated = animate ? ` ${CHART_CLASS_PREFIX}-mini-chart-mark--animated` : "";

  return (
    <MiniChartFrame chart="area" size={size} className={className} onClick={onAreaClick}>
      {(width, height) => {
        const { points, x, y } = miniLineGeometry(data, width, height);
        const areaD =
          area<MiniChartPoint>()
            .x((_, i) => x(i))
            .y0(y(0))
            .y1((p) => y(p.value))
            .curve(curve)(points) ?? "";
        const lineD =
          line<MiniChartPoint>()
            .x((_, i) => x(i))
            .y((p) => y(p.value))
            .curve(curve)(points) ?? "";
        return (
          <>
            {useGradient && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
            <path
              className={`${CLASS}-area${animated}`}
              d={areaD}
              fill={useGradient ? `url(#${gradientId})` : color}
              fillOpacity={useGradient ? 1 : opacity}
            />
            <path
              className={`${CLASS}-line${animated}`}
              d={lineD}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            {/* A single value has no area to draw: it's marked with a dot. */}
            {points.length === 1 && (
              <circle
                className={`${CLASS}-point${animated}`}
                cx={x(0)}
                cy={y(points[0]!.value)}
                r={MINI_POINT_RADIUS}
                fill={useGradient ? `url(#${gradientId})` : color}
                fillOpacity={useGradient ? 1 : opacity}
                stroke={color}
                strokeWidth={1.5}
              />
            )}
          </>
        );
      }}
    </MiniChartFrame>
  );
}
