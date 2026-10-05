import clsx from "clsx";
import React from "react";
import { useTheme } from "../../../ThemeProvider";

import type { HorizontalBarRow } from "../../hooks/cartesian/useHorizontalBarChartOrchestrator";
import { roundedBarPath } from "../../shared/cartesian/roundedBarPath";
import { entranceProps } from "../../utils/entranceUtils";
import { LINE_PADDING } from "./horizontalBarGeometry";

/** Per-row entrance stagger (ms), matching the vertical `BarSeries`. */
const ROW_STAGGER_MS = 30;

/** Internal decorative-line color by theme mode — openui's horizontal look:
 *  a faint light line on light surfaces, a faint dark line on dark ones. */
const INTERNAL_LINE_LIGHT = "rgba(255, 255, 255, 0.3)";
const INTERNAL_LINE_DARK = "rgba(0, 0, 0, 0.3)";

interface HorizontalBarSeriesProps {
  /** Render-ready rows from `useHorizontalBarChartOrchestrator` — one per
   *  category, each carrying its `rowTop`, `groupHeight`, and laid-out `bars`
   *  (x/y/width/height/color/radii/showLine already computed). This painter
   *  recomputes NO geometry. */
  rows: HorizontalBarRow[];
  /** Measured category-label band height (px) — the label sits at `row.rowTop`
   *  with this height; `bar.y` already includes it. From the orchestrator
   *  (`labelHeight`); NOT carried on the row. */
  labelHeight: number;
  /** Row-SVG width (px) — the `<foreignObject>` label spans it so the CSS
   *  ellipsis has the full row to truncate against. From the orchestrator
   *  (`chartWidth`). */
  chartWidth: number;
  /** The hovered category, or `null` when nothing is hovered. Non-hovered rows
   *  dim to 0.4. */
  hoveredCategory: string | null;
  /** Gate the entrance/width tween. Combined with `!isPrinting` below. */
  isAnimationActive: boolean;
  /** Printing snaps to the settled frame (no entrance animation). */
  isPrinting: boolean;
  /** Owning chart's class prefix (`${CHART_CLASS_PREFIX}-horizontal-bar-chart`) — drives the
   *  label / bar / internal-line / animated class names, so Task 6's scss owns
   *  the look (incl. the `--animated` grow keyframe). */
  classPrefix: string;
}

/**
 * Pure SVG painter for the HORIZONTAL BarChart's category rows. Consumes the
 * orchestrator's `rows` and paints, per row: a `<foreignObject>` category label
 * once above the bar group, then each bar as a rounded `<path>` with an optional
 * centered 1px internal `<line>`. Owns NO geometry (the orchestrator +
 * `horizontalBarGeometry` do) and NO layout state — it only maps rows → SVG,
 * applies the hover dim, and emits the entrance-animation hooks (class +
 * `animationDelay`) that the scss animates. Mirrors the vertical `BarSeries`.
 *
 * Hooks are unconditional (`useTheme` at the top); wrapped in `React.memo` so it
 * repaints only when its props change (e.g. hover, scroll size), not on every
 * parent render.
 */
export const HorizontalBarSeries: React.FC<HorizontalBarSeriesProps> = React.memo(
  function HorizontalBarSeries({
    rows,
    labelHeight,
    chartWidth,
    hoveredCategory,
    isAnimationActive,
    isPrinting,
    classPrefix,
  }) {
    // Theme-mode-aware internal-line color — light surfaces get the faint white
    // line, dark surfaces the faint black one (openui's horizontal look). Read
    // the same way the heatmap orchestrator reads it.
    const { mode } = useTheme();
    const internalLineColor = mode === "dark" ? INTERNAL_LINE_DARK : INTERNAL_LINE_LIGHT;

    // Printing always snaps to the settled frame; streaming defaults off.
    const animate = isAnimationActive && !isPrinting;

    return (
      <g className={`${classPrefix}-bars`}>
        {rows.map((row, rowIndex) => {
          // Hover dim: the hovered category (or all rows when nothing is
          // hovered) stay opaque; everything else drops to 0.4.
          const opacity = hoveredCategory === null || row.category === hoveredCategory ? 1 : 0.4;

          // Per-row entrance stagger — the whole row's bars grow together.
          const { className: animatedClass, animationDelay } = entranceProps(
            animate,
            `${classPrefix}-bar--animated`,
            rowIndex * ROW_STAGGER_MS,
          );
          const animatedStyle = animationDelay ? { animationDelay } : undefined;

          return (
            <g key={row.key} className={`${classPrefix}-row`}>
              {/* Category label, once per row, above the bar group. A
                  foreignObject spans the full row width so the `-category-label`
                  div can ellipsis-truncate in CSS (openui does the same). It is
                  non-interactive so it never eats the row's hover. */}
              <foreignObject
                x={0}
                y={row.rowTop}
                width={Math.max(0, chartWidth)}
                height={labelHeight}
                style={{ pointerEvents: "none" }}
                xmlns="http://www.w3.org/1999/xhtml"
              >
                <div className={`${classPrefix}-category-label`}>{row.category}</div>
              </foreignObject>

              {row.bars.map((bar) => (
                <g key={bar.key}>
                  <path
                    className={clsx(
                      `${classPrefix}-bar`,
                      animatedClass,
                      bar.isNegative && `${classPrefix}-bar--negative`,
                    )}
                    d={roundedBarPath(bar.x, bar.y, bar.width, bar.height, bar.radii)}
                    fill={bar.color}
                    opacity={opacity}
                    style={animatedStyle}
                  />
                  {bar.showLine && (
                    <line
                      className={clsx(
                        `${classPrefix}-internal-line`,
                        animatedClass,
                        bar.isNegative && `${classPrefix}-bar--negative`,
                      )}
                      x1={bar.x + LINE_PADDING}
                      x2={bar.x + bar.width - LINE_PADDING}
                      y1={bar.y + bar.height / 2}
                      y2={bar.y + bar.height / 2}
                      stroke={internalLineColor}
                      strokeWidth={1}
                      strokeLinecap="round"
                      opacity={opacity}
                      style={animatedStyle}
                    />
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </g>
    );
  },
);

HorizontalBarSeries.displayName = "HorizontalBarSeries";
