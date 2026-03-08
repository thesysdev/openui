import { scaleLinear } from "d3-scale";
import { pointer } from "d3-selection";
import React, { useCallback, useMemo, useRef, useState } from "react";

import type {
  D3ScatterChartData,
  HoveredScatterPoint,
  ScatterPoint,
} from "../../D3ScatterChart/types";
import type { LegendItem } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import { CHART_MARGIN_TOP, DEFAULT_CHART_HEIGHT } from "../../utils/constants";
import { getDistributedColors, getPalette, type PaletteName } from "../../utils/paletteUtils";
import { numberTickFormatter } from "../../utils/styleUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";
import { useContainerSize } from "../core/useContainerSize";
import { useLegendHeight } from "../core/useLegendHeight";
import { usePrintContext } from "../core/usePrintContext";

const SNAP_RADIUS = 30;
const X_AXIS_HEIGHT = 28;

export interface UseScatterChartOrchestratorParams {
  data: D3ScatterChartData;
  chartThemeName: PaletteName;
  customPalette?: string[];
  showLegend: boolean;
  showYAxis: boolean;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  onClick?: (
    point: ScatterPoint,
    datasetName: string,
    datasetIndex: number,
    pointIndex: number,
  ) => void;
}

export function useScatterChartOrchestrator({
  data,
  chartThemeName,
  customPalette,
  showLegend,
  showYAxis,
  height,
  width,
  fitLegendInHeight,
  onClick,
}: UseScatterChartOrchestratorParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<HoveredScatterPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const isPrinting = usePrintContext();
  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    width,
    height,
  );
  const legendHeight = useLegendHeight(legendRef, showLegend);
  const context = useCanvasContextForLabelSize();

  const shouldFitLegend = fitLegendInHeight ?? height !== undefined;

  // --- Colors ---
  const datasetNames = useMemo(() => data.map((ds) => ds.name), [data]);
  const palette = useMemo(() => {
    if (customPalette) return customPalette;
    return getPalette(chartThemeName).colors;
  }, [chartThemeName, customPalette]);

  const distributedColors = useMemo(
    () => getDistributedColors(palette, datasetNames.length),
    [palette, datasetNames.length],
  );

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    datasetNames.forEach((name, i) => {
      map[name] = distributedColors[i] ?? "#000";
    });
    return map;
  }, [datasetNames, distributedColors]);

  // --- Hidden series ---
  const toggleSeries = useCallback(
    (name: string) => {
      setHiddenSeries((prev) => {
        const next = new Set(prev);
        if (next.has(name)) {
          next.delete(name);
        } else {
          if (next.size >= datasetNames.length - 1) return prev;
          next.add(name);
        }
        return next;
      });
    },
    [datasetNames.length],
  );

  const visibleDatasets = useMemo(
    () => data.filter((ds) => !hiddenSeries.has(ds.name)),
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

  // --- Y-axis width ---
  const yAxisWidth = useMemo(() => {
    if (!showYAxis) return 0;
    const tempScale = scaleLinear().domain([yMin, yMax]).nice();
    const ticks = tempScale.ticks();
    let maxWidth = 0;
    for (const tick of ticks) {
      const w = context.measureText(numberTickFormatter(tick)).width;
      if (w > maxWidth) maxWidth = w;
    }
    return Math.max(20, Math.min(200, Math.ceil(maxWidth) + 10));
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
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGGElement>) => {
      const [mx, my] = pointer(event.nativeEvent, event.currentTarget);
      let minDist = Infinity;
      let closest: HoveredScatterPoint | null = null;

      for (let dsIdx = 0; dsIdx < visibleDatasets.length; dsIdx++) {
        const ds = visibleDatasets[dsIdx]!;
        const originalIdx = data.indexOf(ds);
        for (let ptIdx = 0; ptIdx < ds.data.length; ptIdx++) {
          const pt = ds.data[ptIdx]!;
          const px = xScale(pt.x);
          const py = yScale(pt.y);
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closest = {
              datasetIndex: originalIdx,
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

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [visibleDatasets, data, xScale, yScale],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    setMousePos(null);
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<SVGGElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      const syntheticEvent = {
        nativeEvent: touch,
        currentTarget: event.currentTarget,
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as unknown as React.MouseEvent<SVGGElement>;
      handleMouseMove(syntheticEvent);
    },
    [handleMouseMove],
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

  // --- Tooltip ---
  const tooltipPayload = useMemo(() => {
    if (!hoveredPoint) return null;
    const color = colorMap[hoveredPoint.datasetName] ?? "#000";
    return {
      label: hoveredPoint.datasetName,
      items: [
        { name: "X", value: hoveredPoint.point.x, color },
        { name: "Y", value: hoveredPoint.point.y, color },
      ],
    };
  }, [hoveredPoint, colorMap]);

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
