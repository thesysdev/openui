import { useId, useMemo } from "react";
import { useEffectiveAnimation } from "../hooks";
import { useCalendarHeatmapOrchestrator } from "../hooks/cartesian/useCalendarHeatmapOrchestrator";
import { ChartShell } from "../shared/core/ChartShell";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { CalendarCells } from "./parts/CalendarCells";
import { CalendarLegend } from "./parts/CalendarLegend";
import { CalendarPatternDefs, calendarPatternId } from "./parts/CalendarPatternDefs";
import { CalendarSeparatorLabels, CalendarSeparators } from "./parts/CalendarSeparators";
import { MonthAxis } from "./parts/MonthAxis";
import { useDelayedHover } from "./parts/useDelayedHover";
import { WeekdayAxis } from "./parts/WeekdayAxis";
import type { CalendarHeatmapProps } from "./types";

const CLASS_PREFIX = `${CHART_CLASS_PREFIX}-calendar-heatmap`;

/** `` (q, year) => `Q1 2026` `` — the default quarter-label formatter. */
const defaultQuarterLabel = (quarter: number, year: number) => `Q${quarter} ${year}`;

export function CalendarHeatmap(props: CalendarHeatmapProps) {
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
          : `var(--${CLASS_PREFIX}-level-${level})`,
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
      classPrefix={CLASS_PREFIX}
      className={className}
      style={orch.style.containerStyle}
      isEmpty={orch.isEmpty}
    >
      {() => (
        <>
          <div className={`${CLASS_PREFIX}-plot`} style={{ position: "relative", width: svgWidth }}>
            <svg
              width={svgWidth}
              height={svgHeight}
              style={{ overflow: "visible" }}
              role="img"
              aria-label="Calendar heatmap chart"
            >
              <CalendarPatternDefs
                baseId={patternBaseId}
                levelStyles={orch.levelStyles}
                levelColors={orch.levelColors}
              />

              {showMonthLabels && (
                <g transform={`translate(${gutterLeft}, 0)`}>
                  <MonthAxis
                    labels={orch.monthLabels}
                    pitchX={pitchX}
                    xOffsets={separators.offsets}
                    y={monthLabelY}
                    classPrefix={CLASS_PREFIX}
                  />
                </g>
              )}

              <g transform={`translate(0, ${gutterTop})`}>
                <WeekdayAxis
                  ticks={orch.weekdayTicks}
                  pitchY={pitchY}
                  x={weekdayLabelX}
                  classPrefix={CLASS_PREFIX}
                />
              </g>

              <g
                transform={`translate(${gutterLeft}, ${gutterTop})`}
                onMouseLeave={orch.hover.handleMouseLeave}
                // Grid dim is LEGEND-hover scoped (bklit parity): hovering a
                // cell only lights up its legend swatch, never re-shades the
                // grid — so this reads `hoveredLevel`, not `highlightedLevel`.
                {...{
                  [`data-${CHART_CLASS_PREFIX}-highlight-level`]:
                    orch.hover.hoveredLevel ?? undefined,
                }}
              >
                <CalendarCells
                  cells={orch.cells}
                  classPrefix={CLASS_PREFIX}
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
                  classPrefix={CLASS_PREFIX}
                />
              </g>
            </svg>

            <CalendarSeparatorLabels
              labels={separators.labels}
              offsets={separators.offsets}
              pitchX={pitchX}
              gutterLeft={gutterLeft}
              format={labelFormat}
              classPrefix={CLASS_PREFIX}
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
              classPrefix={CLASS_PREFIX}
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
