import { line } from "d3-shape";
import { useEffectiveAnimation } from "../hooks/core/useEffectiveAnimation";
import { MiniChartFrame } from "../shared/mini/MiniChartFrame";
import { type MiniChartPoint, miniCurves, miniLineGeometry } from "../shared/mini/miniChartUtils";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { useChartPalette } from "../utils/paletteUtils";
import type { MiniLineChartProps } from "./types";

const CLASS = `${CHART_CLASS_PREFIX}-mini-line-chart`;

/**
 * A compact, axis-free line sparkline — react-ui's Recharts `MiniLineChart`:
 * the most recent values that fit, one series, no dots.
 */
export function MiniLineChart({
  data,
  customPalette,
  variant = "natural",
  strokeWidth = 2,
  isAnimationActive = false,
  onLineClick,
  size = "100%",
  className,
  lineColor,
}: MiniLineChartProps) {
  const animate = useEffectiveAnimation(isAnimationActive);
  const [color = ""] = useChartPalette({
    customPalette: customPalette ?? (lineColor ? [lineColor] : undefined),
    themePaletteName: "lineChartPalette",
    dataLength: 1,
  });
  const curve = miniCurves[variant] ?? miniCurves.natural;
  const animated = animate ? ` ${CHART_CLASS_PREFIX}-mini-chart-mark--animated` : "";

  return (
    <MiniChartFrame chart="line" size={size} className={className} onClick={onLineClick}>
      {(width, height) => {
        const { points, x, y } = miniLineGeometry(data, width, height);
        const lineD =
          line<MiniChartPoint>()
            .x((_, i) => x(i))
            .y((p) => y(p.value))
            .curve(curve)(points) ?? "";
        return (
          <path
            className={`${CLASS}-line${animated}`}
            d={lineD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      }}
    </MiniChartFrame>
  );
}
