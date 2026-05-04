import clsx from "clsx";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { useTheme } from "../../ThemeProvider";
import { BarChartData, BarChartVariant } from "../BarChart/types";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { DEFAULT_X_AXIS_HEIGHT, X_AXIS_PADDING } from "../constants";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useAutoAngleCalculation,
  useExportChartData,
  useMaxLabelWidth,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import {
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  LineInBarShape,
  SideBarTooltip,
  SVGXAxisTick,
  SVGXAxisTickVariant,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem } from "../types";
import { getBarStackInfo, getRadiusArray } from "../utils/BarCharts/BarChartsUtils";
import {
  ensureChartData,
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";

// this a technic to get the type of the onClick event of the bar chart
// we need to do this because the onClick event type is not exported by recharts
type BarChartOnClick = React.ComponentProps<typeof RechartsBarChart>["onClick"];
type BarClickData = Parameters<NonNullable<BarChartOnClick>>[0];

export interface BarChartCondensedProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: BarChartVariant;
  tickVariant?: SVGXAxisTickVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
  /** Maximum bar width in pixels. Prevents bars from becoming too wide. Default: 12 */
  maxBarWidth?: number;
}

// Default maximum bar width - prevents bars from becoming too wide with sparse data
const DEFAULT_MAX_BAR_WIDTH = 12;

// Layout constants
const BAR_GAP = 10;
const BAR_CATEGORY_GAP = "20%";
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;
const CHART_HEIGHT = 296;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

const BarChartCondensedComponent = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "grouped",
  tickVariant = "singleLine",
  grid = true,
  icons = {},
  radius,
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height = CHART_HEIGHT,
  width,
  maxBarWidth = DEFAULT_MAX_BAR_WIDTH,
}: BarChartCondensedProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;
  const chartData = useMemo(() => ensureChartData<T[number]>(data), [data]);

  const dataKeys = useMemo(() => {
    return getDataKeys(chartData, categoryKey as string);
  }, [chartData, categoryKey]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(chartData, dataKeys);

  const maxLabelWidth = useMaxLabelWidth(chartData, categoryKey as string);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState<number>(0);

  const widthOfData = useMemo(() => {
    if (chartData.length === 0) {
      return 0;
    }
    // Use passed width if available, otherwise use observed chartContainerWidth
    const chartWidth = width ?? chartContainerWidth;
    return chartWidth / chartData.length;
  }, [chartContainerWidth, chartData, width]);

  const { angle: calculatedAngle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    tickVariant === "angled",
    maxLabelWidth < 100 ? widthOfData : undefined,
  );

  const isAngled = useMemo(() => {
    return calculatedAngle !== 0;
  }, [calculatedAngle]);

  const effectiveHeight = useMemo(() => {
    if (tickVariant === "angled") {
      return xAxisHeight + height;
    }
    return height + DEFAULT_X_AXIS_HEIGHT;
  }, [height, xAxisHeight, tickVariant]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "barChartPalette",
    dataLength: dataKeys.length,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const id = useId();

  const exportData = useExportChartData({
    type: "bar",
    data: chartData,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
  });

  const chartMargin = useMemo(
    () => ({
      top: 10,
      right: 10,
      bottom: CHART_CONTAINER_BOTTOM_MARGIN,
      left: showYAxis ? 10 : 0,
    }),
    [showYAxis],
  );

  const { mode, theme: userTheme } = useTheme();

  const calculatedRadius = useMemo(() => {
    let radiusValue: number = BAR_RADIUS;

    if (typeof radius === "number") {
      radiusValue = radius;
    } else {
      const radiusTheme = userTheme.radius2xs;
      if (radiusTheme) {
        radiusValue = typeof radiusTheme === "string" ? parseInt(radiusTheme) : radiusTheme;
      }
    }

    return radiusValue;
  }, [userTheme.radius2xs, radius]);

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // Calculate explicit chart width when width prop is provided
  // This allows Recharts to calculate bar dimensions on first render
  const explicitChartWidth = useMemo(() => {
    if (!width) return undefined;
    // Subtract Y-axis width and margins to get the actual chart area width
    const yAxisSpace = showYAxis ? yAxisWidth : 0;
    return width - yAxisSpace - chartMargin.left - chartMargin.right;
  }, [width, showYAxis, yAxisWidth, chartMargin.left, chartMargin.right]);

  // Calculate optimal bar width based on available space
  // Only applies maximum constraint - Recharts handles thin bars automatically
  const calculatedBarWidth = useMemo(() => {
    // Use explicitChartWidth if available, otherwise fall back to chartContainerWidth
    const availableWidth = explicitChartWidth ?? chartContainerWidth;

    // If no width available, return undefined and let Recharts auto-size
    if (!availableWidth || availableWidth === 0 || chartData.length === 0) {
      return undefined;
    }

    // Calculate space per category (Recharts handles gaps automatically via barGap and barCategoryGap props)
    const spacePerCategory = availableWidth / chartData.length;

    // For grouped charts, multiple bars share the category space
    const barsPerCategory = variant === "stacked" ? 1 : dataKeys.length;

    // Simple division - let Recharts apply gaps via barGap and barCategoryGap props
    const barWidth = spacePerCategory / barsPerCategory;

    // Only apply maximum constraint, let Recharts handle thin bars automatically
    return Math.min(maxBarWidth, barWidth);
  }, [explicitChartWidth, chartContainerWidth, chartData.length, dataKeys.length, variant, maxBarWidth]);

  // Handle mouse events for bar hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const onBarClick = useCallback(
    (data: BarClickData) => {
      if (data?.activePayload?.length && data.activePayload.length > 10) {
        setIsSideBarTooltipOpen(true);
        setSideBarTooltipData({
          title: data.activeLabel as string,
          values: data.activePayload.map((payload) => ({
            value: payload.value as number,
            label: payload.name || payload.dataKey,
            color: getColorForDataKey(payload.dataKey, dataKeys, colors),
          })),
        });
      }
    },
    [dataKeys, colors],
  );

  // Observe container width for legend
  useEffect(() => {
    // Always set up ResizeObserver for chartContainerRef to get accurate bar width calculations
    if (!chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        if (entry.target === containerRef.current && !width) {
          // Only observe containerRef if width is not provided
          setContainerWidth(entry.contentRect.width);
        }
        if (entry.target === chartContainerRef.current) {
          setChartContainerWidth(entry.contentRect.width);
        }
      }
    });

    // Always observe chartContainerRef
    resizeObserver.observe(chartContainerRef.current);

    // Only observe containerRef if width is not provided
    if (!width && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  useEffect(() => {
    setIsLegendExpanded(false);
  }, [dataKeys]);

  // Memoize legend items creation
  const legendItems: LegendItem[] = useMemo(() => {
    if (!legend) {
      return [];
    }
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons, legend]);

  const yAxis = useMemo(() => {
    if (!showYAxis) {
      return null;
    }
    return (
      <div className="openui-bar-chart-condensed-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsBarChart
          key={`y-axis-bar-chart-condensed-${id}`}
          width={yAxisWidth}
          height={effectiveHeight}
          data={chartData}
          stackOffset="sign"
          margin={{
            top: chartMargin.top,
            bottom: xAxisHeight + chartMargin.bottom, // this is required to give space for x-axis
            left: 0,
            right: 0,
          }}
        >
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tick={<YAxisTick setLabelWidth={setLabelWidth} />}
          />
          {/* Invisible bars to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Bar
                key={`yaxis-bar-chart-condensed-${key}`}
                dataKey={key}
                fill="transparent"
                stackId={variant === "stacked" ? "a" : undefined}
                isAnimationActive={false}
                maxBarSize={0}
              />
            );
          })}
        </RechartsBarChart>
      </div>
    );
  }, [
    showYAxis,
    effectiveHeight,
    chartData,
    dataKeys,
    variant,
    id,
    yAxisWidth,
    chartMargin,
    xAxisHeight,
    setLabelWidth,
  ]);

  const barElements = useMemo(() => {
    return dataKeys.map((key) => {
      const transformedKey = transformedKeys[key];
      const color = `var(--color-${transformedKey})`;

      return (
        <Bar
          key={`bar-${key}`}
          dataKey={key}
          fill={color}
          stackId={variant === "stacked" ? "a" : undefined}
          isAnimationActive={isAnimationActive}
          maxBarSize={calculatedBarWidth}
          barSize={calculatedBarWidth}
          shape={(props: any) => {
            const { payload, value, dataKey } = props;

            const { isNegative, isFirstInStack, isLastInStack, hasNegativeValueInStack } =
              getBarStackInfo(variant, value, dataKey, payload, dataKeys);

            const customRadius = getRadiusArray(
              variant,
              calculatedRadius,
              "vertical",
              isFirstInStack,
              isLastInStack,
              isNegative,
            );

            return (
              <LineInBarShape
                {...props}
                radius={customRadius}
                internalLineColor={barInternalLineColor}
                internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                isHovered={hoveredCategory !== null}
                hoveredCategory={hoveredCategory}
                categoryKey={categoryKey as string}
                variant={variant}
                hasNegativeValueInStack={hasNegativeValueInStack}
              />
            );
          }}
        />
      );
    });
  }, [
    dataKeys,
    transformedKeys,
    variant,
    calculatedRadius,
    isAnimationActive,
    barInternalLineColor,
    hoveredCategory,
    categoryKey,
    calculatedBarWidth,
  ]);

  return (
    <LabelTooltipProvider>
      <SideBarTooltipProvider
        isSideBarTooltipOpen={isSideBarTooltipOpen}
        setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
        data={sideBarTooltipData}
        setData={setSideBarTooltipData}
      >
        <div
          className={clsx("openui-bar-chart-condensed-container", className)}
          data-openui-chart={exportData}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          {yAxisLabel && (
            <div className="openui-bar-chart-condensed-y-axis-label">{yAxisLabel}</div>
          )}
          <div className="openui-bar-chart-condensed-container-inner" ref={containerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="openui-bar-chart-condensed" ref={chartContainerRef}>
              <ChartContainer
                config={chartConfig}
                style={{
                  width: explicitChartWidth ? `${explicitChartWidth}px` : "100%",
                  height: effectiveHeight,
                }}
                rechartsProps={{
                  width: explicitChartWidth ?? "100%",
                  height: effectiveHeight,
                }}
              >
                <RechartsBarChart
                  stackOffset="sign"
                  accessibilityLayer
                  key={`bar-chart-condensed-${id}`}
                  data={chartData}
                  margin={chartMargin}
                  barGap={BAR_GAP}
                  barCategoryGap={BAR_CATEGORY_GAP}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  onClick={onBarClick}
                  width={explicitChartWidth}
                  height={effectiveHeight}
                >
                  {grid && cartesianGrid()}

                  <XAxis
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    textAnchor={isAngled ? "end" : "middle"}
                    interval="preserveStartEnd"
                    minTickGap={5}
                    height={xAxisHeight}
                    tick={<SVGXAxisTick />}
                    angle={calculatedAngle}
                    orientation="bottom"
                    padding={{
                      left: X_AXIS_PADDING,
                      right: X_AXIS_PADDING,
                    }}
                  />
                  {/* Y-axis is rendered in the separate synchronized chart */}

                  <ChartTooltip
                    cursor={{
                      fill: "var(--openui-highlight)",
                      stroke: "var(--openui-stroke-default)",
                      opacity: 1,
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltipContent parentRef={containerRef} />}
                    offset={10}
                  />

                  {barElements}
                </RechartsBarChart>
              </ChartContainer>
            </div>
            {isSideBarTooltipOpen && <SideBarTooltip height={effectiveHeight} />}
          </div>
          {xAxisLabel && (
            <div className="openui-bar-chart-condensed-x-axis-label">{xAxisLabel}</div>
          )}
          {legend && (
            <DefaultLegend
              items={legendItems}
              containerWidth={effectiveWidth}
              isExpanded={isLegendExpanded}
              setIsExpanded={setIsLegendExpanded}
            />
          )}
        </div>
      </SideBarTooltipProvider>
    </LabelTooltipProvider>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const BarChartCondensed = React.memo(
  BarChartCondensedComponent,
) as typeof BarChartCondensedComponent;
