import type { ScaleBand, ScaleQuantize } from "d3-scale";
import React, { useCallback } from "react";

import type { HoveredHeatmapCell } from "../../hooks/cartesian/useHeatmapChartOrchestrator";
import { heatmapCellValue } from "../../hooks/cartesian/useHeatmapChartOrchestrator";
import { useCanvasContextForLabelSize } from "../../hooks/core/useCanvasContextForLabelSize";
import { useHydrated } from "../../hooks/core/useHydrated";
import { getColorLuminance, LUMINANCE_TEXT_PIVOT } from "../../utils/colorLuminance";
import { CHART_CLASS_PREFIX } from "../../utils/constants";
import { entranceProps } from "../../utils/entranceUtils";
import { parseLineHeight } from "../../utils/labelWrap";
import { numberTickFormatter } from "../../utils/styleUtils";

// Entrance stagger: a left-to-right column wave, capped so wide (streamed)
// datasets don't push late columns into seconds of delay.
const STAGGER_MS = 15;
const STAGGER_CAP_MS = 300;

// Breathing room a label needs inside its cell before it auto-hides.
const LABEL_PAD_X = 6;
const LABEL_PAD_Y = 2;

// In-cell label colors are picked per cell against the bucket color (WCAG
// pivot), not themed: theme text tokens don't know what they'd sit on.
const LABEL_ON_LIGHT = "rgba(20, 24, 28, 0.85)";
const LABEL_ON_DARK = "rgba(255, 255, 255, 0.92)";

interface HeatmapCellsProps<T extends Record<string, string | number>> {
  data: T[];
  catKey: string;
  /** Per-column React keys, duplicate labels already disambiguated. */
  columnKeys: string[];
  visibleRowKeys: string[];
  xScale: ScaleBand<string>;
  yScale: ScaleBand<string>;
  colorScale: ScaleQuantize<string>;
  cellGap: number;
  cellRadius: number;
  showCellLabels: boolean;
  animate: boolean;
  onCellMouseMove: (event: React.MouseEvent, cell: HoveredHeatmapCell) => void;
  onCellMouseLeave: () => void;
  onClick?: (row: T, columnIndex: number, rowKey: string) => void;
}

/**
 * The cell grid. One <rect> per (column, visible row); fill = the quantized
 * value color; non-numeric/missing values get the muted --empty modifier
 * (dimmed via fill-opacity, NOT opacity — the entrance keyframe's forwards
 * fill holds opacity and would override an opacity dim forever). Hover
 * highlight is pure CSS (:hover stroke); these handlers only feed the
 * tooltip/click state.
 *
 * Cell labels (opt-in) are hydration-gated: the canvas measurer is an SSR
 * stub returning zero widths, which would pass every fit check and hydrate
 * labels the server never rendered. Each label auto-hides when its formatted
 * value doesn't fit its cell, and picks dark/light text against its own
 * bucket color — that auto-degradation is what makes the boolean safe to
 * enable blindly (an LLM will).
 */
export function HeatmapCells<T extends Record<string, string | number>>({
  data,
  catKey,
  columnKeys,
  visibleRowKeys,
  xScale,
  yScale,
  colorScale,
  cellGap,
  cellRadius,
  showCellLabels,
  animate,
  onCellMouseMove,
  onCellMouseLeave,
  onClick,
}: HeatmapCellsProps<T>) {
  const hydrated = useHydrated();
  const context = useCanvasContextForLabelSize();

  const handleClick = useCallback(
    (row: T, columnIndex: number, rowKey: string) => {
      onClick?.(row, columnIndex, rowKey);
    },
    [onClick],
  );

  // Never let the gap eat more than half the band — at extreme density a
  // fixed gap would otherwise zero every cell out (blank plot, intact axes).
  const gapX = Math.min(cellGap, xScale.bandwidth() / 2);
  const gapY = Math.min(cellGap, yScale.bandwidth() / 2);
  const cellWidth = Math.max(0, xScale.bandwidth() - gapX);
  const cellHeight = Math.max(0, yScale.bandwidth() - gapY);

  const labelsActive = showCellLabels && hydrated;
  const labelLineHeight = labelsActive ? parseLineHeight(context.font) : 0;

  const renderCellLabel = (
    value: number,
    x: number,
    y: number,
    animationDelay: string | undefined,
  ) => {
    const text = numberTickFormatter(value);
    if (
      context.measureText(text).width > cellWidth - LABEL_PAD_X ||
      labelLineHeight > cellHeight - LABEL_PAD_Y
    ) {
      return null;
    }
    const luminance = getColorLuminance(colorScale(value));
    const fill =
      luminance !== null && luminance > LUMINANCE_TEXT_PIVOT ? LABEL_ON_LIGHT : LABEL_ON_DARK;
    return (
      <text
        x={x + cellWidth / 2}
        y={y + cellHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className={`${CHART_CLASS_PREFIX}-heatmap-chart-cell-label${
          animate ? ` ${CHART_CLASS_PREFIX}-heatmap-chart-cell-label--animated` : ""
        }`}
        style={{ fill, animationDelay }}
      >
        {text}
      </text>
    );
  };

  return (
    <g>
      {data.map((row, columnIndex) => {
        const columnLabel = String(row[catKey]);
        const x = (xScale(columnLabel) ?? 0) + gapX / 2;
        const { className: cellAnimatedClass, animationDelay } = entranceProps(
          animate,
          `${CHART_CLASS_PREFIX}-heatmap-chart-cell--animated`,
          Math.min(columnIndex * STAGGER_MS, STAGGER_CAP_MS),
        );

        return (
          // Keyed per-column group so removing/inserting a middle column
          // reconciles by identity instead of remounting every later column
          // (which would replay entrances). Matches BarSeries' grouped shape.
          // Keys come pre-deduplicated — LLMs re-emit duplicate labels.
          <g key={columnKeys[columnIndex] ?? columnIndex}>
            {visibleRowKeys.map((rowKey) => {
              const y = (yScale(rowKey) ?? 0) + gapY / 2;
              const value = heatmapCellValue(row[rowKey]);

              const modifiers = [
                value === null ? `${CHART_CLASS_PREFIX}-heatmap-chart-cell--empty` : "",
                cellAnimatedClass,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <React.Fragment key={rowKey}>
                  <rect
                    className={`${CHART_CLASS_PREFIX}-heatmap-chart-cell ${modifiers}`.trim()}
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    rx={cellRadius}
                    fill={value === null ? undefined : colorScale(value)}
                    style={{
                      animationDelay,
                      cursor: onClick ? "pointer" : undefined,
                    }}
                    onMouseMove={(event) =>
                      onCellMouseMove(event, {
                        rowKey,
                        columnIndex,
                        columnLabel,
                        value,
                      })
                    }
                    onMouseLeave={onCellMouseLeave}
                    onClick={() => handleClick(row, columnIndex, rowKey)}
                  />
                  {labelsActive && value !== null && renderCellLabel(value, x, y, animationDelay)}
                </React.Fragment>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
