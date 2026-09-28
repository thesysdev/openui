import clsx from "clsx";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Separator } from "../../Separator";
import { useTheme } from "../../ThemeProvider";

import { useChartShell } from "../hooks/core/useChartShell";
import { ChartShell } from "../shared/core/ChartShell";
import { DefaultLegend } from "../shared/core/DefaultLegend/DefaultLegend";
import type { StackedLegendItem } from "../shared/core/legend";
import { ChartTooltip } from "../shared/core/PortalTooltip/ChartTooltip";
import { StackedLegend } from "../shared/core/StackedLegend";
import type { LegendItem } from "../types";
import { CHART_CLASS_PREFIX } from "../utils/constants";
import { resolvePalette } from "../utils/paletteUtils";
import { numberTickFormatter } from "../utils/styleUtils";
import { segmentShare, segmentValue } from "./parts/segmentedBarGeometry";
import type { SegmentedBarData, SegmentedBarProps } from "./types";

const CLASS_PREFIX = `${CHART_CLASS_PREFIX}-segmented-bar`;

/**
 * A thin div-based stacked progress bar — a faithful visual port of react-ui's
 * `SingleStackedBar`. One horizontal track split into segments sized by SHARE
 * OF TOTAL (value / Σ), a `StackedLegend` by default. Hovering a segment (or a
 * legend row) highlights it, dims the rest, and shows a value/percentage
 * tooltip. Adapted to viz conventions: no named-palette `theme` prop (colors
 * come from the react-ui `ThemeProvider` via `resolvePalette`), no in-track
 * labels, no legend visibility toggle (openui only hover-highlights).
 */
export function SegmentedBar<T extends SegmentedBarData>({
  data,
  categoryKey,
  dataKey,
  customPalette,
  legend = true,
  legendVariant = "stacked",
  isAnimationActive = false,
  className,
  style,
}: SegmentedBarProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  const { isPrinting, isEmpty, containerWidth } = useChartShell({
    data,
    showLegend: legend,
    containerRef,
    legendRef,
  });

  // Entrance/width tween gate: printing always snaps to the settled frame.
  const animate = isAnimationActive && !isPrinting;

  const { theme } = useTheme();

  // Ordered ramp, one hue per segment by INPUT order — matches openui's
  // `themePaletteName: 'barChartPalette'`.
  const ramp = useMemo(
    () => resolvePalette(theme, "barChartPalette", customPalette),
    [theme, customPalette],
  );

  // Segments sized by share of the total (value / Σ), computed inline like
  // openui. Keys disambiguate duplicate categories (LLMs re-emit them).
  const segments = useMemo(() => {
    if (!data || data.length === 0) return [];
    const catKey = String(categoryKey);
    const valKey = String(dataKey);
    const values = data.map((row) => segmentValue(row[valKey]));
    const total = values.reduce((sum, v) => sum + v, 0);
    return data.map((row, index) => {
      const share = segmentShare(values[index] ?? 0, total);
      return {
        key: `${String(row[catKey])}-${index}`,
        label: String(row[catKey]),
        value: values[index] ?? 0,
        share,
        percentage: share * 100,
        color: ramp[index % ramp.length] ?? "#000000",
      };
    });
  }, [data, categoryKey, dataKey, ramp]);

  const stackedLegendItems = useMemo<StackedLegendItem[]>(
    () =>
      segments.map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        value: s.value,
      })),
    [segments],
  );

  const legendItems = useMemo<LegendItem[]>(
    () =>
      segments.map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        percentage: s.percentage,
      })),
    [segments],
  );

  // Position the tooltip at the top-center of a segment, in VIEWPORT coords
  // (viz's ChartTooltip positions a virtual element by raw client rect).
  const positionTooltipOver = useCallback((index: number) => {
    const segmentEl = containerRef.current?.querySelectorAll(`.${CLASS_PREFIX}-segment`)?.[
      index
    ] as HTMLElement | undefined;
    if (!segmentEl) return;
    const rect = segmentEl.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleSegmentEnter = useCallback(
    (index: number, e: React.MouseEvent<HTMLDivElement>) => {
      const segment = segments[index];
      if (!segment) return;
      setActiveIndex(index);
      setHoveredKey(segment.key);
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
    },
    [segments],
  );

  const clearHover = useCallback(() => {
    setActiveIndex(null);
    setHoveredKey(null);
    setTooltipPosition(null);
  }, []);

  // Legend-row hover ↔ segment: highlight the matching segment (dim the rest)
  // and float the tooltip over it — the key↔index map.
  const handleLegendHover = useCallback(
    (key: string | null) => {
      if (key === null) {
        clearHover();
        return;
      }
      const index = segments.findIndex((s) => s.key === key);
      if (index < 0) return;
      setActiveIndex(index);
      setHoveredKey(key);
      positionTooltipOver(index);
    },
    [segments, clearHover, positionTooltipOver],
  );

  const activeSegment = activeIndex !== null ? segments[activeIndex] : undefined;

  return (
    <ChartShell
      containerRef={containerRef}
      classPrefix={CLASS_PREFIX}
      className={clsx(className, {
        [`${CLASS_PREFIX}-container--gap`]: legend && legendVariant === "default",
      })}
      style={style ?? {}}
      isEmpty={isEmpty}
    >
      {() => (
        <>
          <div className={CLASS_PREFIX} role="img" aria-label="Segmented bar">
            {segments.map((segment, index) => {
              const isActive = activeIndex === null || activeIndex === index;
              return (
                <div
                  key={segment.key}
                  className={clsx(`${CLASS_PREFIX}-segment`, {
                    [`${CLASS_PREFIX}-segment--animated`]: animate,
                  })}
                  style={{
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => handleSegmentEnter(index, e)}
                  onMouseLeave={clearHover}
                >
                  <div className={`${CLASS_PREFIX}-segment-line`} />
                </div>
              );
            })}
          </div>

          {activeSegment && tooltipPosition && (
            <ChartTooltip
              label={activeSegment.label}
              items={[
                {
                  name: "Value",
                  value: numberTickFormatter(activeSegment.value),
                  color: activeSegment.color,
                },
                {
                  name: "Percentage",
                  value: `${activeSegment.percentage.toFixed(1)}%`,
                  color: activeSegment.color,
                },
              ]}
              viewportPosition={tooltipPosition}
              placement="top"
            />
          )}

          {legend && legendVariant === "default" && (
            <>
              <Separator />
              <DefaultLegend
                ref={legendRef}
                items={legendItems}
                isExpanded={isLegendExpanded}
                setIsExpanded={setIsLegendExpanded}
                containerWidth={containerWidth}
                style={{ paddingTop: 0 }}
              />
            </>
          )}

          {legend && legendVariant === "stacked" && (
            // Wrapper carries `legendRef` so `useChartShell`'s (required) legend
            // measurement is attached in this mode too — the `default` variant
            // attaches it via `DefaultLegend`. `StackedLegend` keeps its own
            // class (and its `margin-top`), so the layout is unchanged.
            <div ref={legendRef}>
              <StackedLegend
                items={stackedLegendItems}
                activeKey={hoveredKey}
                onItemHover={handleLegendHover}
                layout="showMore"
                separator
                showTitle={false}
                containerWidth={containerWidth}
                className={`${CLASS_PREFIX}-stacked-legend`}
              />
            </div>
          )}
        </>
      )}
    </ChartShell>
  );
}
