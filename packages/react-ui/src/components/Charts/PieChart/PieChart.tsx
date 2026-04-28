import clsx from "clsx";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { usePrintContext } from "../../../context/PrintContext.js";
import { useTheme } from "../../ThemeProvider/ThemeProvider.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../Charts.js";
import { useExportChartData, useTransformedKeys } from "../hooks/index.js";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend.js";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend.js";
import { LegendItem } from "../types/Legend.js";
import { getCategoricalChartConfig } from "../utils/dataUtils.js";
import { PaletteName, useChartPalette } from "../utils/PalletUtils.js";
import { PieChartData } from "./types/index.js";
import {
  calculateChartDimensions,
  calculateTwoLevelChartDimensions,
  createAnimationConfig,
  createEventHandlers,
  getHoverStyles,
  transformDataWithPercentages,
  useChartHover,
} from "./utils/PieChartUtils.js";

export interface PieChartProps<T extends PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  isAnimationActive?: boolean;
  appearance?: "circular" | "semiCircular";
  cornerRadius?: number;
  paddingAngle?: number;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  className?: string;
  maxChartSize?: number;
  minChartSize?: number;
  // Add height and width props
  height?: number | string;
  width?: number | string;
}

const STACKED_LEGEND_BREAKPOINT = 400;
const MIN_CHART_SIZE = 150;
const MAX_CHART_SIZE = 500;
const CORNER_RADIUS = 0;

const PieChartComponent = <T extends PieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  customPalette,
  variant = "pie",
  format = "number",
  legend = true,
  legendVariant = "stacked",
  isAnimationActive = true,
  appearance = "circular",
  cornerRadius,
  paddingAngle = 0,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  maxChartSize = MAX_CHART_SIZE,
  minChartSize = MIN_CHART_SIZE,
  height,
  width,
}: PieChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
  const { theme: userTheme } = useTheme();

  // Determine layout mode based on container width
  const isRowLayout =
    legend && legendVariant === "stacked" && wrapperRect.width >= STACKED_LEGEND_BREAKPOINT;

  // Sort data by value (highest to lowest) for pie chart rendering
  const sortedProcessedData = useMemo(
    () => [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [data, dataKey],
  );

  const categories = useMemo(
    () => sortedProcessedData.map((item) => String(item[categoryKey])),
    [sortedProcessedData, categoryKey],
  );
  const transformedKeys = useTransformedKeys(categories);

  // Memoize string conversions to avoid repeated calls
  const categoryKeyString = useMemo(() => String(categoryKey), [categoryKey]);
  const dataKeyString = useMemo(() => String(dataKey), [dataKey]);
  const formatKey = useMemo(
    () => (format === "percentage" ? "percentage" : dataKeyString),
    [format, dataKeyString],
  );

  // Use provided dimensions or observed dimensions from the wrapper
  const effectiveWidth = wrapperRect.width;
  const effectiveHeight = wrapperRect.height;

  // Calculate chart dimensions based on the smaller dimension of the container
  const chartSize = useMemo(() => {
    // Compute the available width for the chart. In row layout, chart and legend are side-by-side.
    // Subtract the 20px gap defined in CSS to avoid over-estimating available width.
    const containerWidth = isRowLayout ? Math.max(0, (effectiveWidth - 20) / 2) : effectiveWidth;

    // If wrapper height isn't explicitly provided (or is very small), it will be driven by the
    // chart's own content, creating a feedback loop that pins the size to the minimum.
    // Prefer width in that case to size the chart sensibly.
    const heightIsUsable = effectiveHeight >= minChartSize;

    let size = heightIsUsable ? Math.min(containerWidth, effectiveHeight) : containerWidth;
    size = Math.min(size, maxChartSize);
    return Math.max(minChartSize, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const isSemiCircular = appearance === "semiCircular";
  const chartViewportHeight = useMemo(
    () => (isSemiCircular ? Math.max(1, Math.ceil(chartSize / 2)) : chartSize),
    [chartSize, isSemiCircular],
  );
  const chartSizeStyle = useMemo(
    () => ({ width: chartSize, height: chartViewportHeight }),
    [chartSize, chartViewportHeight],
  );
  const rechartsProps = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: 1,
      minHeight: 1,
      initialDimension: { width: 1, height: 1 },
    }),
    [],
  );

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "pieChartPalette",
    dataLength: sortedProcessedData.length,
  });

  const exportData = useExportChartData({
    type: "pie",
    data: sortedProcessedData,
    categoryKey: categoryKey as string,
    dataKeys: [dataKey as string],
    colors,
    legend,
  });

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformDataWithPercentages(sortedProcessedData as T, dataKey),
    [sortedProcessedData, dataKey],
  );

  const chartConfig = useMemo(
    () => getCategoricalChartConfig(sortedProcessedData as T, categoryKey, colors, transformedKeys),
    [sortedProcessedData, categoryKey, colors, transformedKeys],
  );

  const animationConfig = useMemo(
    () => createAnimationConfig({ isAnimationActive }),
    [isAnimationActive],
  );

  const eventHandlers = useMemo(
    () => createEventHandlers(onMouseEnter, onMouseLeave, onClick),
    [onMouseEnter, onMouseLeave, onClick],
  );

  const sectorStyle = useMemo(() => {
    let cornerRadiusValue: number = CORNER_RADIUS;

    if (typeof cornerRadius === "number") {
      cornerRadiusValue = cornerRadius;
    } else {
      const cornerRadiusTheme = userTheme.radius2xs;
      if (cornerRadiusTheme) {
        cornerRadiusValue =
          typeof cornerRadiusTheme === "string" ? parseInt(cornerRadiusTheme) : cornerRadiusTheme;
      }
    }

    return {
      cornerRadius: cornerRadiusValue,
      paddingAngle: variant === "donut" ? 0.5 : paddingAngle,
    };
  }, [cornerRadius, variant, paddingAngle, userTheme.radius2xs]);

  const legendItems = useMemo(
    () =>
      sortedProcessedData.map((item, index) => ({
        key: String(item[categoryKey]),
        label: String(item[categoryKey]),
        value: Number(item[dataKey]),
        color: colors[index] || "#000000",
      })),
    [sortedProcessedData, categoryKey, dataKey, colors],
  );

  const defaultLegendItems = useMemo((): LegendItem[] => {
    return legendItems.map(({ key, label, color }) => ({ key, label, color }));
  }, [legendItems]);

  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      if (legendVariant !== "stacked") return;
      if (index !== null) {
        const item = sortedProcessedData[index];
        if (item) {
          const categoryValue = String(item[categoryKey]);
          setHoveredLegendKey(categoryValue);
          const transformedIndex = transformedData.findIndex(
            (d) => String((d as any)[categoryKey]) === categoryValue,
          );
          if (transformedIndex !== -1) {
            handleMouseEnter(transformedData[transformedIndex], transformedIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [
      sortedProcessedData,
      categoryKey,
      transformedData,
      handleMouseEnter,
      handleMouseLeave,
      legendVariant,
    ],
  );

  const handleChartMouseEnter = useCallback(
    (entry: any, index: number) => {
      handleMouseEnter(entry, index);
      if (legend && legendVariant === "stacked") {
        setHoveredLegendKey(String(entry[categoryKey]));
      }
      eventHandlers.onMouseEnter?.(entry, index);
    },
    [handleMouseEnter, categoryKey, legend, legendVariant, eventHandlers.onMouseEnter],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    if (legend && legendVariant === "stacked") {
      setHoveredLegendKey(null);
    }
    eventHandlers.onMouseLeave?.();
  }, [handleMouseLeave, legend, legendVariant, eventHandlers.onMouseLeave]);

  const dimensions = useMemo(() => {
    if (variant === "donut") {
      return calculateTwoLevelChartDimensions(chartSize);
    }
    if (isSemiCircular) {
      return { ...calculateChartDimensions(chartSize, variant), middleRadius: 0 };
    }
    return { outerRadius: "90%", innerRadius: 0, middleRadius: 0 };
  }, [variant, chartSize, isSemiCircular]);

  const startAngle = useMemo(() => (appearance === "semiCircular" ? 180 : 0), [appearance]);
  const endAngle = useMemo(() => (appearance === "semiCircular" ? 0 : 360), [appearance]);

  const commonPieProps = useMemo(
    () => ({
      data: transformedData,
      dataKey: formatKey,
      nameKey: categoryKeyString,
      labelLine: false,
      label: false,
      ...animationConfig,
      ...eventHandlers,
      ...sectorStyle,
      startAngle,
      endAngle,
      cx: "50%",
      cy: isSemiCircular ? chartViewportHeight : "50%",
      onMouseEnter: handleChartMouseEnter,
      onMouseLeave: handleChartMouseLeave,
    }),
    [
      transformedData,
      formatKey,
      categoryKeyString,
      animationConfig,
      eventHandlers,
      sectorStyle,
      startAngle,
      endAngle,
      isSemiCircular,
      chartViewportHeight,
      handleChartMouseEnter,
      handleChartMouseLeave,
    ],
  );

  // Use ResizeObserver for subsequent size changes
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWrapperRect({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(wrapper);

    // Read initial dimensions synchronously before first paint to avoid size jump
    const rect = wrapper.getBoundingClientRect();
    setWrapperRect({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, []);

  const renderPieCharts = useCallback(() => {
    if (variant === "donut") {
      return [
        <Pie
          key="inner-pie"
          {...commonPieProps}
          innerRadius={dimensions.innerRadius}
          outerRadius={dimensions.middleRadius}
        >
          {transformedData.map((entry, index: number) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
            const config = chartConfig[transformedKey];
            const hoverStyles = getHoverStyles(index, activeIndex);
            const fill = config?.color || colors[index];
            return (
              <Cell
                key={`inner-cell-${index}`}
                fill={fill}
                {...hoverStyles}
                stroke="none"
                className="openui-pie-chart__inner-cell"
              />
            );
          })}
        </Pie>,
        <Pie
          key="outer-pie"
          {...commonPieProps}
          innerRadius={dimensions.middleRadius}
          outerRadius={dimensions.outerRadius}
        >
          {transformedData.map((entry, index: number) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
            const config = chartConfig[transformedKey];
            const hoverStyles = getHoverStyles(index, activeIndex);
            const fill = config?.color || colors[index];
            return <Cell key={`outer-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
          })}
        </Pie>,
      ];
    }
    return (
      <Pie
        {...commonPieProps}
        outerRadius={dimensions.outerRadius}
        innerRadius={dimensions.innerRadius}
        activeIndex={activeIndex ?? undefined}
      >
        {transformedData.map((entry, index: number) => {
          const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
          const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
          const config = chartConfig[transformedKey];
          const hoverStyles = getHoverStyles(index, activeIndex);
          const fill = config?.color || colors[index];
          return <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
        })}
      </Pie>
    );
  }, [
    variant,
    commonPieProps,
    dimensions,
    transformedData,
    categoryKey,
    chartConfig,
    activeIndex,
    colors,
    transformedKeys,
  ]);

  const renderLegend = useCallback(() => {
    if (!legend) return null;
    if (legendVariant === "stacked") {
      return (
        <div className="openui-pie-chart-legend-container">
          <StackedLegend
            items={legendItems}
            onItemHover={setHoveredLegendKey}
            activeKey={hoveredLegendKey}
            onLegendItemHover={handleLegendItemHover}
            containerWidth={isRowLayout ? undefined : wrapperRect.width}
          />
        </div>
      );
    }
    return (
      <DefaultLegend
        items={defaultLegendItems}
        containerWidth={wrapperRect.width}
        isExpanded={isLegendExpanded}
        setIsExpanded={setIsLegendExpanded}
      />
    );
  }, [
    legend,
    legendVariant,
    legendItems,
    hoveredLegendKey,
    handleLegendItemHover,
    wrapperRect.width,
    isRowLayout,
    defaultLegendItems,
    isLegendExpanded,
  ]);

  const wrapperClassName = useMemo(
    () =>
      clsx("openui-pie-chart-container-wrapper", className, {
        "layout-row": isRowLayout,
        "layout-column": !isRowLayout,
        "legend-default": legend && legendVariant === "default",
        "legend-stacked": legend && legendVariant === "stacked",
      }),
    [className, legend, legendVariant, isRowLayout],
  );

  const wrapperStyle = useMemo(() => {
    const formatDimension = (value: number | string | undefined) => {
      if (typeof value === "number") {
        return `${value}px`;
      }
      return value;
    };
    const dimensions = {
      width: formatDimension(width),
      height: formatDimension(height),
    };

    return dimensions;
  }, [width, height]);

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={wrapperStyle}
      data-openui-chart={exportData}
    >
      <div className="openui-pie-chart-container">
        <div className="openui-pie-chart-container-inner">
          <div style={chartSizeStyle}>
            <ChartContainer
              config={chartConfig}
              className="openui-pie-chart"
              rechartsProps={rechartsProps}
            >
              <RechartsPieChart>
                <ChartTooltip
                  content={<ChartTooltipContent showPercentage={format === "percentage"} />}
                />
                {renderPieCharts()}
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};

export const PieChart = memo(PieChartComponent);

PieChart.displayName = "PieChart";
