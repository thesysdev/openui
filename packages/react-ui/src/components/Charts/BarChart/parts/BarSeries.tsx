import type { ScaleBand, ScaleLinear } from "d3-scale";
import { scaleBand } from "d3-scale";
import React, { useMemo } from "react";
import type { StackedData } from "../../hooks";
import { roundedBarPath } from "../../shared/cartesian/roundedBarPath";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { entranceProps } from "../../utils/entranceUtils";
import type { BarChartVariant } from "../types";
import { verticalBarRadii } from "./verticalBarRadii";

const DEFAULT_MAX_BAR_WIDTH = 16;
const MIN_BAR_HEIGHT_FOR_LINE = 8;
const LINE_PADDING = 6;

interface BarSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
  variant: BarChartVariant;
  stackedData: StackedData | null;
  categoryKey: string;
  colors: Record<string, string>;
  barRadius: number;
  maxBarWidth?: number;
  internalLine?: boolean;
  internalLineColor?: string;
  internalLineWidth?: number;
  isAnimationActive?: boolean;
}

/**
 * Computes capped bar width and centering offset within a band.
 * When bandwidth exceeds maxBarWidth, the bar is capped and centered.
 */
function getBarLayout(bandwidth: number, maxBarWidth: number) {
  const cappedWidth = Math.min(bandwidth, maxBarWidth);
  const offset = (bandwidth - cappedWidth) / 2;
  return { barWidth: cappedWidth, offset };
}

export const BarSeries: React.FC<BarSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  stackedData,
  categoryKey,
  colors,
  barRadius,
  maxBarWidth = DEFAULT_MAX_BAR_WIDTH,
  internalLine = false,
  internalLineColor = "rgba(255, 255, 255, 0.3)",
  internalLineWidth = 1,
  isAnimationActive,
}) => {
  const bandwidth = xScale.bandwidth();

  const innerScale = useMemo(() => {
    if (variant !== "grouped") return null;
    return scaleBand<string>().domain(dataKeys).range([0, xScale.bandwidth()]).padding(0.05);
  }, [variant, dataKeys, xScale]);

  // For grouped: cap individual bar within its inner band
  // For stacked: cap the single bar within the full band
  const groupedBarLayout = useMemo(() => {
    if (variant !== "grouped" || !innerScale) return null;
    return getBarLayout(innerScale.bandwidth(), maxBarWidth);
  }, [variant, innerScale, maxBarWidth]);

  const stackedBarLayout = useMemo(() => {
    if (variant !== "stacked") return null;
    return getBarLayout(bandwidth, maxBarWidth);
  }, [variant, bandwidth, maxBarWidth]);

  if (variant === "stacked" && stackedData && stackedBarLayout) {
    const { barWidth, offset } = stackedBarLayout;

    // Per category, the series index of the OUTERMOST rendered segment in each
    // sign direction — the topmost positive (rounds its top corners) and the
    // bottommost negative (rounds its bottom corners). Only these round; inner
    // segments stay square, matching react-ui. d3 normalises every point to
    // `[y0, y1]` with y0 <= y1, so a segment's sign comes from `point[0] < 0`
    // (never the height) and a zero-height segment (point[0] === point[1]) is
    // skipped so it never claims the rounding.
    const lastPositiveSeries: number[] = new Array(data.length).fill(-1);
    const lastNegativeSeries: number[] = new Array(data.length).fill(-1);
    stackedData.forEach((series, seriesIndex) => {
      (series as unknown as [number, number][]).forEach((point, i) => {
        if (point[0] === point[1]) return; // zero-height segment: not rendered
        if (point[0] < 0) lastNegativeSeries[i] = seriesIndex;
        else lastPositiveSeries[i] = seriesIndex;
      });
    });

    return (
      <g className={`${CHART_CLASS_PREFIX}-bar-chart-bars`}>
        {stackedData.map((series, seriesIndex) => {
          const color = colors[series.key] ?? "#000";
          return (
            <g key={series.key}>
              {(series as unknown as [number, number][]).map((point, i) => {
                const category = String(data[i]![categoryKey]);
                const bandX = xScale(category) ?? 0;
                const barX = bandX + offset;
                // Diverging stacks put negative segments below zero with
                // point[0] as the more-negative end — anchor at whichever
                // scaled end is higher on screen.
                const y0 = yScale(point[0]);
                const y1 = yScale(point[1]);
                const barY = Math.min(y0, y1);
                const barHeight = Math.abs(y0 - y1);
                const isNegative = point[0] < 0;
                // Only the outermost segment of this segment's sign group
                // rounds its outer corners.
                const rounded = isNegative
                  ? seriesIndex === lastNegativeSeries[i]
                  : seriesIndex === lastPositiveSeries[i];
                const { className: animatedClass, animationDelay } = entranceProps(
                  isAnimationActive,
                  `${CHART_CLASS_PREFIX}-bar-chart-bar--animated`,
                  i * 30,
                );
                const animatedSuffix = animatedClass ? ` ${animatedClass}` : "";

                return (
                  <g key={i}>
                    <path
                      className={`${CHART_CLASS_PREFIX}-bar-chart-bar${isNegative ? ` ${CHART_CLASS_PREFIX}-bar-chart-bar--negative` : ""}${animatedSuffix}`}
                      d={roundedBarPath(
                        barX,
                        barY,
                        barWidth,
                        barHeight,
                        verticalBarRadii(barRadius, isNegative, rounded),
                      )}
                      fill={color}
                      style={animationDelay ? { animationDelay } : undefined}
                    />
                    {internalLine && barHeight >= MIN_BAR_HEIGHT_FOR_LINE && barWidth >= 3 && (
                      <line
                        className={`${CHART_CLASS_PREFIX}-bar-chart-internal-line${isNegative ? ` ${CHART_CLASS_PREFIX}-bar-chart-bar--negative` : ""}${animatedSuffix}`}
                        x1={barX + barWidth / 2}
                        y1={barY + LINE_PADDING}
                        x2={barX + barWidth / 2}
                        y2={barY + barHeight - LINE_PADDING}
                        stroke={internalLineColor}
                        strokeWidth={internalLineWidth}
                        strokeLinecap="round"
                        style={animationDelay ? { animationDelay } : undefined}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  }

  // Grouped variant
  return (
    <g className={`${CHART_CLASS_PREFIX}-bar-chart-bars`}>
      {data.map((row, i) => {
        const category = String(row[categoryKey]);
        const groupX = xScale(category) ?? 0;
        const { className: animatedClass, animationDelay } = entranceProps(
          isAnimationActive,
          `${CHART_CLASS_PREFIX}-bar-chart-bar--animated`,
          i * 30,
        );
        const animatedSuffix = animatedClass ? ` ${animatedClass}` : "";
        return (
          <g key={category}>
            {dataKeys.map((key) => {
              const value = Number(row[key]) || 0;
              const innerBandX = innerScale?.(key) ?? 0;
              const barX = groupX + innerBandX + (groupedBarLayout?.offset ?? 0);
              // Bars grow from the zero line (== the chart bottom only while
              // the domain has no negatives), downward for negative values.
              const zeroY = yScale(0);
              const valueY = yScale(value);
              const barY = Math.min(valueY, zeroY);
              const barHeight = Math.abs(valueY - zeroY);
              const isNegative = value < 0;
              const barWidth = groupedBarLayout?.barWidth ?? innerScale?.bandwidth() ?? bandwidth;
              const color = colors[key] ?? "#000";

              return (
                <g key={key}>
                  <path
                    className={`${CHART_CLASS_PREFIX}-bar-chart-bar${isNegative ? ` ${CHART_CLASS_PREFIX}-bar-chart-bar--negative` : ""}${animatedSuffix}`}
                    d={roundedBarPath(
                      barX,
                      barY,
                      barWidth,
                      barHeight,
                      verticalBarRadii(barRadius, isNegative, true),
                    )}
                    fill={color}
                    style={animationDelay ? { animationDelay } : undefined}
                  />
                  {internalLine && barHeight >= MIN_BAR_HEIGHT_FOR_LINE && barWidth >= 3 && (
                    <line
                      className={`${CHART_CLASS_PREFIX}-bar-chart-internal-line${isNegative ? ` ${CHART_CLASS_PREFIX}-bar-chart-bar--negative` : ""}${animatedSuffix}`}
                      x1={barX + barWidth / 2}
                      y1={barY + LINE_PADDING}
                      x2={barX + barWidth / 2}
                      y2={barY + barHeight - LINE_PADDING}
                      stroke={internalLineColor}
                      strokeWidth={internalLineWidth}
                      strokeLinecap="round"
                      style={animationDelay ? { animationDelay } : undefined}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
