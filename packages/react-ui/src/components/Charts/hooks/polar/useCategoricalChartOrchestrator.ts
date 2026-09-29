import { useEffect, useMemo, useRef } from "react";

import type { ChartColorPalette } from "../../../ThemeProvider";
import {
  indexToKey,
  keyToIndex,
  stackedItemsFromSlices,
  useLegendBridge,
  useLegendPublisher,
  useResolvedLegendKey,
} from "../../shared/core/legend";
import type { TooltipItem } from "../../shared/core/PortalTooltip/ChartTooltip";
import type { ChartData } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { formatPercentage } from "../../utils/polarUtils";
import { useCategoricalChartData } from "../core/useCategoricalChartData";
import { useChartShell } from "../core/useChartShell";
import { usePerElementHover } from "../core/usePerElementHover";

export interface UseCategoricalChartOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  format?: "number" | "percentage";
  showLegend: boolean;
  isSemiCircular: boolean;
  maxChartSize: number;
  minChartSize: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  legendKey?: string;
}

export function useCategoricalChartOrchestrator<T extends ChartData>({
  data,
  categoryKey,
  dataKey,
  themePaletteName,
  customPalette,
  format = "number",
  showLegend,
  isSemiCircular,
  maxChartSize,
  minChartSize,
  height,
  width,
  fitLegendInHeight,
  legendKey,
}: UseCategoricalChartOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const {
    isPrinting,
    containerWidth,
    containerHeight,
    isEmpty,
    legendHeight,
    shouldFitLegend,
    isLegendExpanded,
    setIsLegendExpanded,
  } = useChartShell({
    data,
    showLegend,
    containerRef,
    legendRef,
    width,
    height,
    fitLegendInHeight,
  });

  const { slices, total, hiddenSlices, toggleSlice, legendItems, chartStyle, sortedData } =
    useCategoricalChartData({
      data,
      categoryKey,
      dataKey,
      themePaletteName,
      customPalette,
      format,
    });

  // Dimensions
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const availableHeight = (containerHeight || 300) - legendDeduction;
  const availableWidth = containerWidth || 300;

  const chartSize = Math.max(
    minChartSize,
    Math.min(maxChartSize, availableWidth, isSemiCircular ? availableHeight * 2 : availableHeight),
  );

  const svgWidth = chartSize;
  const svgHeight = isSemiCircular ? chartSize / 2 + 10 : chartSize;
  const centerX = svgWidth / 2;
  const centerY = isSemiCircular ? svgHeight - 10 : svgHeight / 2;

  // Hover
  const {
    hovered: hoveredIndex,
    mousePos,
    handleMouseMove,
    handleMouseLeave,
  } = usePerElementHover();

  // ---- Legend store bridge (only active when a key resolves + a provider exists) ----
  // The effective key is the explicit `legendKey` prop, else the nearest
  // provider's `legendKey` default. Resolved once here so the hover-sync
  // effect below can depend on the key that is actually in force.
  const resolvedLegendKey = useResolvedLegendKey(legendKey);
  const bridge = useLegendBridge(resolvedLegendKey);

  // Effective hidden set: store-backed when keyed, else local hiddenSlices.
  const effectiveHidden = bridge ? bridge.hiddenKeys : hiddenSlices;

  // Publish legend items (memoized by slices so the publish effect doesn't loop).
  // Carry `format` so a detached legend inherits the chart's value format.
  const stackedItems = useMemo(() => stackedItemsFromSlices(slices), [slices]);
  useLegendPublisher(legendKey, stackedItems, format);

  // Visible slices
  const visibleSlices = useMemo(
    () => slices.filter((s) => !effectiveHidden.has(s.label)),
    [slices, effectiveHidden],
  );

  // Keep the latest visibleSlices in a ref so the slice-hover → legend sync
  // effect can read it without depending on its identity (see effect below).
  const visibleSlicesRef = useRef(visibleSlices);
  visibleSlicesRef.current = visibleSlices;

  // Percentages must re-normalize over the VISIBLE set so the tooltip matches
  // the (d3.pie-renormalized) wedge. In local mode this equals `total`; in
  // remote mode `total` stays the grand total (toggles route to the store, not
  // the local hiddenSlices set), so we recompute from visibleSlices here.
  const visibleTotal = useMemo(
    () => visibleSlices.reduce((sum, s) => sum + s.value, 0),
    [visibleSlices],
  );

  // The original rows aligned 1:1 with visibleSlices — the parts map slices
  // and onClick(row, index) through this parallel-arrays contract, so the
  // filter lives HERE next to its invariant (the charts used to re-derive it
  // inline, unmemoized, far from where visibleSlices is built).
  const catKey = String(categoryKey);
  const visibleRows = useMemo(
    () => sortedData.filter((row) => !effectiveHidden.has(String(row[catKey]))),
    [sortedData, effectiveHidden, catKey],
  );

  // Slice hover → store activeKey (so a remote legend row highlights in sync).
  // This must fire ONLY on a LOCAL hover change — never on a `visibleSlices`
  // identity change. A routine data re-render produces a fresh visibleSlices
  // while hoveredIndex stays null; if that re-ran the effect it would call
  // setActive(null) and wipe a highlight the detached legend just set. So we
  // read visibleSlices through a ref and depend only on
  // [hoveredIndex, resolvedLegendKey]. Deps intentionally exclude `bridge` (a
  // fresh object each render — listing it would re-run this effect every
  // render); `resolvedLegendKey` is the stable proxy for "the active bridge
  // changed".
  useEffect(() => {
    if (!bridge) return;
    bridge.setActive(
      hoveredIndex != null ? indexToKey(visibleSlicesRef.current, hoveredIndex) : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `bridge` excluded on purpose, see comment above
  }, [hoveredIndex, resolvedLegendKey]);

  // Effective highlight index: local mouse hover wins; else legend-driven activeKey.
  const effectiveHoveredIndex =
    hoveredIndex ?? (bridge ? keyToIndex(visibleSlices, bridge.activeKey) : null);

  // Tooltip
  const tooltipPayload = useMemo(() => {
    if (hoveredIndex === null) return null;
    const slice = visibleSlices[hoveredIndex];
    if (!slice) return null;

    const items: TooltipItem[] = [
      {
        name: slice.label,
        value: format === "percentage" ? formatPercentage(slice.value, visibleTotal) : slice.value,
        color: slice.color,
      },
    ];

    return { label: slice.label, items };
  }, [hoveredIndex, visibleSlices, format, visibleTotal]);

  // Container style
  const containerStyle = useMemo(
    () => buildContainerStyle(chartStyle, width, height),
    [chartStyle, width, height],
  );

  return {
    refs: { containerRef, legendRef },
    isEmpty,
    data: {
      slices,
      visibleSlices,
      visibleRows,
      total,
      hiddenSlices,
      toggleSlice,
      sortedData,
      catKey,
      valKey: String(dataKey),
      legendItems,
    },
    dimensions: {
      containerWidth,
      availableWidth,
      availableHeight,
      chartSize,
      svgWidth,
      svgHeight,
      centerX,
      centerY,
    },
    isPrinting,
    hover: {
      hoveredIndex: effectiveHoveredIndex,
      mousePos,
      handleMouseMove,
      handleMouseLeave,
    },
    usesRemoteLegend: bridge != null,
    legend: { isLegendExpanded, setIsLegendExpanded },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
