import { useTheme } from "../../ThemeProvider";
import { useEffectiveAnimation } from "../hooks/core/useEffectiveAnimation";
import { roundedBarPath } from "../shared/cartesian/roundedBarPath";
import { MiniChartFrame } from "../shared/mini/MiniChartFrame";
import { MINI_BAR_WIDTH, miniBarGeometry } from "../shared/mini/miniChartUtils";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { useChartPalette } from "../utils/paletteUtils";
import type { MiniBarChartProps } from "./types";

const CLASS = `${CHART_CLASS_PREFIX}-mini-bar-chart`;
// The thin line down each bar's middle, inset from both ends — shown only on
// bars tall enough to hold it (as react-ui's Recharts MiniBarChart).
const INNER_LINE_INSET = 6;
const INNER_LINE_MIN_HEIGHT = 8;

/**
 * Compact, axis-free bars — react-ui's Recharts `MiniBarChart`: the most
 * recent values that fit, 8px bars right-aligned, rounded outer corners, and
 * a thin inner line.
 */
export function MiniBarChart({
  data,
  customPalette,
  radius = 1,
  isAnimationActive = false,
  onBarsClick,
  size = "100%",
  className,
  barColor,
}: MiniBarChartProps) {
  const animate = useEffectiveAnimation(isAnimationActive);
  const [color = ""] = useChartPalette({
    customPalette: customPalette ?? (barColor ? [barColor] : undefined),
    themePaletteName: "barChartPalette",
    dataLength: 1,
  });
  const { mode } = useTheme();
  const innerLineColor = mode === "light" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
  const animated = animate ? ` ${CHART_CLASS_PREFIX}-mini-chart-mark--animated` : "";

  return (
    <MiniChartFrame chart="bar" size={size} className={className} onClick={onBarsClick}>
      {(width, height) =>
        miniBarGeometry(data, width, height).map((bar, i) =>
          bar.height > 0 ? (
            <g key={i} className={`${CLASS}-bar-group${animated}`}>
              <path
                className={`${CLASS}-bar`}
                d={roundedBarPath(
                  bar.x,
                  bar.y,
                  MINI_BAR_WIDTH,
                  bar.height,
                  bar.negative ? [0, 0, radius, radius] : [radius, radius, 0, 0],
                )}
                fill={color}
              />
              {bar.height >= INNER_LINE_MIN_HEIGHT && (
                <line
                  className={`${CLASS}-inner-line`}
                  x1={bar.x + MINI_BAR_WIDTH / 2}
                  y1={bar.y + INNER_LINE_INSET}
                  x2={bar.x + MINI_BAR_WIDTH / 2}
                  y2={bar.y + bar.height - INNER_LINE_INSET}
                  stroke={innerLineColor}
                  strokeWidth={1}
                  strokeLinecap="round"
                />
              )}
            </g>
          ) : null,
        )
      }
    </MiniChartFrame>
  );
}
