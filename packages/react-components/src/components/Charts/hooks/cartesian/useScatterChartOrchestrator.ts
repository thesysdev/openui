import { scaleLinear } from "d3-scale";
import { pointer } from "d3-selection";
import React, { useCallback, useMemo, useRef, useState } from "react";

import type { ChartColorPalette } from "../../../ThemeProvider";
import type { HoveredScatterPoint, ScatterChartData, ScatterPoint } from "../../ScatterChart/types";
import type { LegendItem } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { CHART_MARGIN_TOP, DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { useChartPalette } from "../../utils/paletteUtils";
import { measureYAxisWidth } from "../../utils/styleUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useChartShell } from "../core/useChartShell";
import { useSeriesVisibility } from "../core/useSeriesVisibility";

const SNAP_RADIUS = 30;
const X_AXIS_HEIGHT = 28;

export interface VisibleDataset {
  dataset: ScatterChartData[number];
  originalIndex: number;
}

export interface UseScatterChartOrchestratorParams {
  data: ScatterChartData;
  themePaletteName: keyof ChartColorPalette;
  customPalette?: string[];
  showLegend: boolean;
  showYAxis: boolean;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  onClick?: (
    point: ScatterPoint,
    datasetName: string,
    datasetIndex: number,
    pointIndex: number,
  ) => void;
}

export function useScatterChartOrchestrator({
  data,
  themePaletteName,
  customPalette,
  showLegend,
  showYAxis,
  height,
  width,
  fitLegendInHeight,
  xAxisLabel,
  yAxisLabel,
  onClick,
}: UseScatterChartOrchestratorParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredScatterPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

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
  const context = useCanvasContextForLabelSize(containerRef);

  // --- Colors (via shared useChartPalette — respects ThemeProvider overrides) ---
  const datasetNames = useMemo(() => data.map((ds) => ds.name), [data]);

  const distributedColors = useChartPalette({
    customPalette,
    themePaletteName,
    dataLength: datasetNames.length,
  });

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    datasetNames.forEach((name, i) => {
      map[name] = distributedColors[i] ?? "#000";
    });
    return map;
  }, [datasetNames, distributedColors]);

  // --- Hidden series (via shared useSeriesVisibility) ---
  const { hiddenSeries, toggleSeries } = useSeriesVisibility(datasetNames);

  const visibleDatasets: VisibleDataset[] = useMemo(
    () =>
      data
        .map((dataset, originalIndex) => ({ dataset, originalIndex }))
        .filter(({ dataset }) => !hiddenSeries.has(dataset.name)),
    [data, hiddenSeries],
  );

  // --- Scales (domain from ALL datasets for stability) ---
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const ds of data) {
      for (const pt of ds.data) {
        if (pt.x < xMin) xMin = pt.x;
        if (pt.x > xMax) xMax = pt.x;
        if (pt.y < yMin) yMin = pt.y;
        if (pt.y > yMax) yMax = pt.y;
      }
    }
    if (!isFinite(xMin)) {
      xMin = 0;
      xMax = 100;
      yMin = 0;
      yMax = 100;
    }
    return { xMin, xMax, yMin, yMax };
  }, [data]);

  // --- Y-axis width (via shared measureYAxisWidth utility) ---
  const yAxisWidth = useMemo(() => {
    if (!showYAxis) return 0;
    const tempScale = scaleLinear().domain([yMin, yMax]).nice();
    const ticks = tempScale.ticks();
    return measureYAxisWidth(ticks, context);
  }, [showYAxis, yMin, yMax, context]);

  // --- Dimensions ---
  const effectiveHeight = containerHeight || (typeof height === "number" ? height : 0);
  const totalHeight = effectiveHeight || DEFAULT_CHART_HEIGHT;
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const chartInnerHeight = totalHeight - CHART_MARGIN_TOP - X_AXIS_HEIGHT - legendDeduction;
  const chartAreaWidth = Math.max(0, (containerWidth || 0) - yAxisWidth);

  const totalSvgWidth = containerWidth || 0;
  const totalSvgHeight = CHART_MARGIN_TOP + Math.max(0, chartInnerHeight) + X_AXIS_HEIGHT;

  // --- Scales ---
  const xScale = useMemo(
    () => scaleLinear().domain([xMin, xMax]).range([0, chartAreaWidth]).nice(),
    [xMin, xMax, chartAreaWidth],
  );

  const yScale = useMemo(
    () => scaleLinear().domain([yMin, yMax]).range([chartInnerHeight, 0]).nice(),
    [yMin, yMax, chartInnerHeight],
  );

  // --- Hover (2D nearest-point) ---
  const findNearestPoint = useCallback(
    (clientX: number, clientY: number, currentTarget: SVGGElement) => {
      const [mx, my] = pointer({ clientX, clientY }, currentTarget);
      let minDist = Infinity;
      let closest: HoveredScatterPoint | null = null;

      for (const { dataset: ds, originalIndex } of visibleDatasets) {
        for (let ptIdx = 0; ptIdx < ds.data.length; ptIdx++) {
          const pt = ds.data[ptIdx]!;
          const px = xScale(pt.x);
          const py = yScale(pt.y);
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closest = {
              datasetIndex: originalIndex,
              pointIndex: ptIdx,
              point: pt,
              datasetName: ds.name,
            };
          }
        }
      }

      if (closest && minDist <= SNAP_RADIUS) {
        setHoveredPoint(closest);
      } else {
        setHoveredPoint(null);
      }

      setMousePos({ x: clientX, y: clientY });
    },
    [visibleDatasets, xScale, yScale],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGGElement>) => {
      findNearestPoint(event.clientX, event.clientY, event.currentTarget);
    },
    [findNearestPoint],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    setMousePos(null);
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<SVGGElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      findNearestPoint(touch.clientX, touch.clientY, event.currentTarget);
    },
    [findNearestPoint],
  );

  const handleTouchEnd = useCallback(() => {
    setHoveredPoint(null);
    setMousePos(null);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGGElement>) => {
      if (!onClick || !hoveredPoint) return;
      event.stopPropagation();
      onClick(
        hoveredPoint.point,
        hoveredPoint.datasetName,
        hoveredPoint.datasetIndex,
        hoveredPoint.pointIndex,
      );
    },
    [onClick, hoveredPoint],
  );

  // --- Tooltip (uses xAxisLabel/yAxisLabel for item names) ---
  const tooltipPayload = useMemo(() => {
    if (!hoveredPoint) return null;
    const color = colorMap[hoveredPoint.datasetName] ?? "#000";
    return {
      label: hoveredPoint.datasetName,
      items: [
        { name: xAxisLabel ?? "X", value: hoveredPoint.point.x, color },
        { name: yAxisLabel ?? "Y", value: hoveredPoint.point.y, color },
      ],
    };
  }, [hoveredPoint, colorMap, xAxisLabel, yAxisLabel]);

  // --- Legend ---
  const legendItems: LegendItem[] = useMemo(
    () =>
      datasetNames.map((name) => ({
        key: name,
        label: name,
        color: colorMap[name] ?? "#000",
      })),
    [datasetNames, colorMap],
  );

  // --- Container style ---
  const containerStyle = useMemo(() => buildContainerStyle({}, width, height), [width, height]);

  return {
    refs: { containerRef, legendRef },
    isPrinting,
    isEmpty,
    data: { visibleDatasets, datasetNames, colorMap },
    dimensions: {
      containerWidth,
      effectiveYAxisWidth: yAxisWidth,
      chartAreaWidth,
      chartInnerHeight: Math.max(0, chartInnerHeight),
      totalSvgWidth,
      totalSvgHeight,
      xAxisHeight: X_AXIS_HEIGHT,
      CHART_MARGIN_TOP,
    },
    scales: { xScale, yScale },
    hover: {
      hoveredPoint,
      mousePos,
      handleMouseMove,
      handleMouseLeave,
      handleTouchMove,
      handleTouchEnd,
      handleClick,
    },
    legend: {
      legendItems,
      hiddenSeries,
      toggleSeries,
      isLegendExpanded,
      setIsLegendExpanded,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
