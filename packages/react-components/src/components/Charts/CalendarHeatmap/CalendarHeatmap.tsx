"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { useId, useMemo } from "react";
import { useEffectiveAnimation } from "../hooks";
import { useCalendarHeatmapOrchestrator } from "../hooks/cartesian/useCalendarHeatmapOrchestrator";
import { ChartShell } from "../shared/core/ChartShell";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { calendarHeatmapStyles, names } from "./calendarHeatmap.styles";
import { CalendarCells } from "./parts/CalendarCells";
import { CalendarLegend } from "./parts/CalendarLegend";
import { CalendarPatternDefs, calendarPatternId } from "./parts/CalendarPatternDefs";
import { CalendarSeparatorLabels, CalendarSeparators } from "./parts/CalendarSeparators";
import { MonthAxis } from "./parts/MonthAxis";
import { useDelayedHover } from "./parts/useDelayedHover";
import { WeekdayAxis } from "./parts/WeekdayAxis";
import type { CalendarHeatmapProps } from "./types";

/** `` (q, year) => `Q1 2026` `` — the default quarter-label formatter. */
const defaultQuarterLabel = (quarter: number, year: number) => `Q${quarter} ${year}`;

export function CalendarHeatmap(props: CalendarHeatmapProps) {
  const styles = calendarHeatmapStyles;
  const {
    data,
    range,
    thresholds,
    levelColors,
    levelStyles,
    layout = "fluid",
    binSize,
    gap = 3,
    weekStartDay = 0,
    hideGhostCells = true,
    weekdayTickFilter = "odd",
    weekdayLabelFormat = "full",
    showMonthLabels = true,
    columnSeparators,
    legendVariant = "swatches",
    legendLabels,
    valueLabel = "Contributions",
    formatTooltipLabel,
    tooltipDelay,
    rowOpacity,
    isAnimationActive = false,
    animationDuration = 1600,
    width,
    height,
    customPalette,
    onClick,
    className,
  } = props;

  const showLegend = legendVariant !== "none";

  const orch = useCalendarHeatmapOrchestrator({
    data: data ?? [],
    // No calendarHeatmapPalette token on react-ui's ChartColorPalette yet (same
    // gap as heatmap/funnel/scatter) — the catch-all default palette is the token.
    themePaletteName: "defaultChartPalette",
    customPalette,
    levelColors,
    levelStyles,
    thresholds,
    range,
    layout,
    binSize,
    gap,
    weekStartDay,
    hideGhostCells,
    weekdayTickFilter,
    weekdayLabelFormat,
    showMonthLabels,
    columnSeparators,
    showLegend,
    valueLabel,
    formatTooltipLabel,
    width,
    height,
  });

  const animate = useEffectiveAnimation(isAnimationActive);

  // Namespace the pattern ids so several calendars on one page never collide.
  const patternBaseId = useId().replace(/:/g, "");

  const {
    separators,
    dimensions: {
      svgWidth,
      svgHeight,
      gutterLeft,
      gutterTop,
      pitchX,
      pitchY,
      cellW,
      cellH,
      plotHeight,
      monthLabelY,
      weekdayLabelX,
    },
  } = orch;

  // Per-level fill: the level CSS var, or a pattern ref when that level sets one.
  const levelFills = useMemo(
    () =>
      orch.levelStyles.map((style, level) =>
        style?.pattern
          ? `url(#${calendarPatternId(patternBaseId, level)})`
          : `var(--_openui-calendar-heatmap-cell-level-${level}-fill)`,
      ),
    [orch.levelStyles, patternBaseId],
  );

  // Hovering a legend level highlights it and clears any cell hover/tooltip.
  const handleLevelEnter = (level: number) => {
    orch.hover.setHoveredLevel(level);
    orch.hover.handleMouseLeave();
  };
  const handleLevelLeave = () => orch.hover.setHoveredLevel(null);

  // Delay the tooltip's show/hide edges (grace period smooths cell-to-cell hops).
  const activeTooltip = useMemo(
    () =>
      orch.tooltip.tooltipPayload && orch.hover.mousePos
        ? {
            ...orch.tooltip.tooltipPayload,
            viewportPosition: orch.hover.mousePos,
          }
        : null,
    [orch.tooltip.tooltipPayload, orch.hover.mousePos],
  );
  const shownTooltip = useDelayedHover(activeTooltip, tooltipDelay);

  const labelFormat = columnSeparators?.labelFormat ?? defaultQuarterLabel;

  return (
    <ChartShell
      containerRef={orch.refs.containerRef}
      className={clsx(
        styles.root,
        names.root,
        names.layout[layout],
        names.legendVariant[legendVariant],
        isAnimationActive && names.isAnimationActive.true,
        className,
      )}
      style={
        {
          "--_openui-calendar-heatmap-root-width": orch.style.containerStyle["width"],
          "--_openui-calendar-heatmap-root-height": orch.style.containerStyle["height"],
          "--_openui-calendar-heatmap-cell-level-0-fill": orch.levelColors[0],
          "--_openui-calendar-heatmap-cell-level-1-fill": orch.levelColors[1],
          "--_openui-calendar-heatmap-cell-level-2-fill": orch.levelColors[2],
          "--_openui-calendar-heatmap-cell-level-3-fill": orch.levelColors[3],
          "--_openui-calendar-heatmap-cell-level-4-fill": orch.levelColors[4],
        } as CSSProperties
      }
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <div
            className={clsx(styles.plot, names.plot)}
            style={
              {
                "--_openui-calendar-heatmap-plot-position": "relative",
                "--_openui-calendar-heatmap-plot-width": `${svgWidth}px`,
              } as CSSProperties
            }
          >
            <svg
              className={clsx(styles.svg, names.svg)}
              width={svgWidth}
              height={svgHeight}
              style={{ "--_openui-calendar-heatmap-svg-overflow": "visible" } as CSSProperties}
              role="img"
              aria-label="Calendar heatmap chart"
            >
              <CalendarPatternDefs
                baseId={patternBaseId}
                levelStyles={orch.levelStyles}
                levelColors={orch.levelColors}
              />

              {showMonthLabels && (
                <g className={names.group} transform={`translate(${gutterLeft}, 0)`}>
                  <MonthAxis
                    labels={orch.monthLabels}
                    pitchX={pitchX}
                    xOffsets={separators.offsets}
                    y={monthLabelY}
                  />
                </g>
              )}

              <g className={names.group} transform={`translate(0, ${gutterTop})`}>
                <WeekdayAxis ticks={orch.weekdayTicks} pitchY={pitchY} x={weekdayLabelX} />
              </g>

              <g
                className={names.group}
                transform={`translate(${gutterLeft}, ${gutterTop})`}
                onMouseLeave={orch.hover.handleMouseLeave}
              >
                <CalendarCells
                  cells={orch.cells}
                  highlightedLevel={orch.hover.hoveredLevel}
                  pitchX={pitchX}
                  pitchY={pitchY}
                  cellW={cellW}
                  cellH={cellH}
                  gap={gap}
                  levelFills={levelFills}
                  xOffsets={separators.offsets}
                  rowOpacity={rowOpacity}
                  animate={animate}
                  animationDuration={animationDuration}
                  onCellMouseMove={orch.hover.handleCellMouseMove}
                  onCellMouseLeave={orch.hover.handleMouseLeave}
                  onClick={onClick}
                />
                <CalendarSeparators
                  columns={separators.columns}
                  offsets={separators.offsets}
                  pitchX={pitchX}
                  spacing={separators.spacing}
                  gap={gap}
                  plotHeight={plotHeight}
                  stroke={columnSeparators?.stroke}
                  dashed={columnSeparators?.dashed}
                />
              </g>
            </svg>

            <CalendarSeparatorLabels
              labels={separators.labels}
              offsets={separators.offsets}
              pitchX={pitchX}
              gutterLeft={gutterLeft}
              format={labelFormat}
            />
          </div>

          {showLegend && (
            <CalendarLegend
              ref={orch.refs.legendRef}
              variant={legendVariant === "gradient" ? "gradient" : "swatches"}
              levelColors={orch.levelColors}
              levelStyles={orch.levelStyles}
              patternBaseId={patternBaseId}
              labels={{
                less: legendLabels?.less ?? "Less",
                more: legendLabels?.more ?? "More",
              }}
              highlightedLevel={orch.hover.highlightedLevel}
              onLevelEnter={handleLevelEnter}
              onLevelLeave={handleLevelLeave}
            />
          )}

          {shownTooltip && (
            <ChartTooltip
              label={shownTooltip.label}
              items={shownTooltip.items}
              viewportPosition={shownTooltip.viewportPosition}
            />
          )}
        </>
      )}
    </ChartShell>
  );
}
