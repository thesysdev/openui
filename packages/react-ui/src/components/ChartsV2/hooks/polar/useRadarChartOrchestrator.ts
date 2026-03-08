import { scaleLinear } from "d3-scale";
import { useMemo, useRef, useState } from "react";

import type { ChartData } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import type { PaletteName } from "../../utils/paletteUtils";
import { useChartData } from "../core/useChartData";
import { useContainerSize } from "../core/useContainerSize";
import { useLegendHeight } from "../core/useLegendHeight";
import { usePrintContext } from "../core/usePrintContext";
import { useTooltipPayload } from "../core/useTooltipPayload";
import { useRadarHover } from "./useRadarHover";

export interface UseRadarChartOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  showLegend: boolean;
  maxChartSize: number;
  minChartSize: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  onClick?: (row: T[number], index: number) => void;
}

export function useRadarChartOrchestrator<T extends ChartData>({
  data,
  categoryKey,
  chartThemeName,
  customPalette,
  icons,
  showLegend,
  maxChartSize,
  minChartSize,
  height,
  width,
  fitLegendInHeight,
  onClick,
}: UseRadarChartOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  const isPrinting = usePrintContext();
  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    width,
    height,
  );
  const legendHeight = useLegendHeight(legendRef, showLegend);

  const shouldFitLegend = fitLegendInHeight ?? height !== undefined;

  const {
    catKey,
    allDataKeys,
    dataKeys,
    hiddenSeries,
    toggleSeries,
    chartConfig,
    colorMap,
    chartStyle,
    legendItems,
  } = useChartData({ data, categoryKey, chartThemeName, customPalette, icons });

  // Dimensions
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const availableHeight = (containerHeight || 300) - legendDeduction;
  const availableWidth = containerWidth || 300;

  const chartSize = Math.max(minChartSize, Math.min(maxChartSize, availableWidth, availableHeight));

  const svgWidth = chartSize;
  const svgHeight = chartSize;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const maxRadius = chartSize * 0.35;

  // Radial scale
  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of data) {
      for (const key of dataKeys) {
        const val = Number(row[key]) || 0;
        if (val > max) max = val;
      }
    }
    return max;
  }, [data, dataKeys]);

  const radialScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxValue || 1])
        .range([0, maxRadius]),
    [maxValue, maxRadius],
  );

  // Hover
  const hover = useRadarHover({ data, onClick });

  // Tooltip
  const tooltipPayload = useTooltipPayload(hover.hoveredIndex, data, dataKeys, catKey, chartConfig);

  // Container style
  const containerStyle = useMemo(
    () => buildContainerStyle(chartStyle, width, height),
    [chartStyle, width, height],
  );

  return {
    refs: { containerRef, legendRef },
    data: { catKey, allDataKeys, dataKeys, colorMap, chartConfig },
    dimensions: {
      containerWidth,
      chartSize,
      svgWidth,
      svgHeight,
      centerX,
      centerY,
      maxRadius,
      radialScale,
    },
    isPrinting,
    hover: {
      hoveredIndex: hover.hoveredIndex,
      mousePos: hover.mousePos,
      createMouseHandlers: hover.createMouseHandlers,
    },
    legend: {
      legendItems,
      hiddenSeries,
      isLegendExpanded,
      setIsLegendExpanded,
      handleLegendItemClick: toggleSeries,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
