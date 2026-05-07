import clsx from "clsx";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { useTheme } from "../../ThemeProvider";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useExportChartData, useTransformedKeys } from "../hooks";
import { useHorizontalBarLabelHeight } from "../hooks/useMaxLabelHeight";
import {
  CustomTooltipContent,
  DefaultLegend,
  SideBarTooltip,
  SVGXAxisTick,
  verticalCartesianGrid,
  YAxisTick,
} from "../shared";
import { ScrollButtonsVertical } from "../shared/ScrollButtonsVertical";

import { type LegendItem } from "../types/Legend";
import { useChartPalette, type PaletteName } from "../utils/PalletUtils";

import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import {
  findNearestSnapPosition,
  getBarStackInfo,
  getRadiusArray,
} from "../utils/BarCharts/BarChartsUtils";
import {
  ensureChartData,
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { numberTickFormatter } from "../utils/styleUtils";
import { CustomBarShape } from "./components/CustomBarShape";
import { useMaxCategoryLabelWidth } from "./hooks/useMaxCategoryLabelWidth";
import { HorizontalBarChartData, HorizontalBarChartVariant } from "./types";
import {
  BAR_GAP,
  BAR_HEIGHT,
  getHeightOfData,
  getPadding,
  getSnapPositions,
} from "./utils/HorizontalBarChartUtils";

// Type for onClick event
type HorizontalBarChartOnClick = React.ComponentProps<typeof RechartsBarChart>["onClick"];
type HorizontalBarClickData = Parameters<NonNullable<HorizontalBarChartOnClick>>[0];

export interface HorizontalBarChartProps<T extends HorizontalBarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: HorizontalBarChartVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showXAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const X_AXIS_HEIGHT = 40; // Height of X-axis chart when shown
const BAR_CATEGORY_GAP = "20%"; // Gap between categories
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;

const HorizontalBarChartComponent = <T extends HorizontalBarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "grouped",
  grid = true,
  icons = {},
  radius = BAR_RADIUS,
  isAnimationActive = false,
  showXAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
}: HorizontalBarChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;
  const chartData = useMemo(() => ensureChartData<T[number]>(data), [data]);

  const maxCategoryLabelWidth = useMaxCategoryLabelWidth(chartData, categoryKey as string);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

  // Calculate chart width for internal calculations (legend, xAxis, etc.)
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // Calculate label height for better group height calculation
  // Use chart width for label height calculation since labels span full width
  const labelHeight = useHorizontalBarLabelHeight(
    chartData,
    categoryKey as string,
    effectiveWidth,
  );

  const dataKeys = useMemo(() => {
    return getDataKeys(chartData, categoryKey as string);
  }, [chartData, categoryKey]);

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

  // Use provided height or observed height
  const effectiveHeight = useMemo(() => {
    return height ?? 296 + X_AXIS_HEIGHT;
  }, [height]);

  // Calculate effective container height (excluding X-axis)
  const effectiveContainerHeight = useMemo(() => {
    const xAxisHeight = showXAxis ? X_AXIS_HEIGHT : 0;
    return Math.max(0, effectiveHeight - xAxisHeight);
  }, [effectiveHeight, showXAxis]);

  const padding = useMemo(() => {
    return getPadding(
      chartData,
      categoryKey as string,
      effectiveContainerHeight,
      variant,
      labelHeight,
    );
  }, [chartData, categoryKey, effectiveContainerHeight, variant, labelHeight]);

  const dataHeight = useMemo(() => {
    return getHeightOfData(chartData, categoryKey as string, variant, labelHeight);
  }, [chartData, categoryKey, variant, labelHeight]);

  // Calculate snap positions for proper group alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(chartData, categoryKey as string, variant, labelHeight);
  }, [chartData, categoryKey, variant, labelHeight]);

  // Check scroll boundaries
  const updateScrollState = useCallback(() => {
    if (mainContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = mainContainerRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
    }
  }, []);

  const scrollUp = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollTop;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "up");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  const scrollDown = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollTop;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "down");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  useEffect(() => {
    // Set up ResizeObserver if height or width is not provided
    if (!chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!width) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height, width]);

  // Update scroll state when container dimensions or data height changes
  useEffect(() => {
    updateScrollState();
  }, [effectiveContainerHeight, dataHeight, containerWidth, updateScrollState]);

  useEffect(() => {
    setIsSideBarTooltipOpen(false);
    setIsLegendExpanded(false);
  }, [dataKeys]);

  // Add scroll event listener to update button states
  useEffect(() => {
    const mainContainer = mainContainerRef.current;
    if (!mainContainer) return;

    const handleScroll = () => {
      updateScrollState();
    };

    mainContainer.addEventListener("scroll", handleScroll);
    return () => {
      mainContainer.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollState]);

  // Memoize legend items creation
  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const exportData = useExportChartData({
    type: "bar",
    data: chartData,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
    extraOptions: {
      barDir: "bar",
    },
  });

  const id = useId();

  const xAxis = useMemo(() => {
    if (!showXAxis) {
      return null;
    }
    return (
      <div className="openui-horizontal-bar-chart-x-axis-container">
        {/* X-axis only chart - synchronized with main chart */}
        <ChartContainer
          config={chartConfig}
          style={{ width: "100%", height: X_AXIS_HEIGHT }}
          rechartsProps={{
            height: X_AXIS_HEIGHT,
          }}
        >
          <RechartsBarChart
            key={`x-axis-horizontal-bar-chart-${id}`}
            data={chartData}
            layout="vertical"
            margin={{
              top: 0,
              bottom: 0,
              left: 5,
              right: 2,
            }}
            stackOffset="sign"
          >
            <XAxis
              type="number"
              height={X_AXIS_HEIGHT}
              tickLine={false}
              axisLine={false}
              tickFormatter={numberTickFormatter}
              tick={<SVGXAxisTick />}
            />
            {/* Invisible bars to maintain scale synchronization */}
            {dataKeys.map((key) => {
              return (
                <Bar
                  key={`x-axis-horizontal-bar-chart-${key}`}
                  dataKey={key}
                  fill="transparent"
                  stackId={variant === "stacked" ? "a" : undefined}
                  isAnimationActive={false}
                  maxBarSize={0}
                />
              );
            })}
          </RechartsBarChart>
        </ChartContainer>
      </div>
    );
  }, [showXAxis, chartConfig, chartData, dataKeys, variant, id]);

  // Handle mouse events for group hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const { mode } = useTheme();

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  const onBarsClick = useCallback(
    (data: HorizontalBarClickData) => {
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

  const setLabelWidth = useCallback(() => {}, []);

  return (
    <LabelTooltipProvider>
      <SideBarTooltipProvider
        isSideBarTooltipOpen={isSideBarTooltipOpen}
        setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
        data={sideBarTooltipData}
        setData={setSideBarTooltipData}
      >
        <div
          className={clsx("openui-horizontal-bar-chart-container", className)}
          data-openui-chart={exportData}
        >
          <div
            className="openui-horizontal-bar-chart-container-inner-wrapper"
            style={{
              height: height ? `${height}px` : effectiveHeight,
            }}
          >
            <div className="openui-horizontal-bar-chart-container-inner" ref={chartContainerRef}>
              <div className="openui-horizontal-bar-chart-main-container" ref={mainContainerRef}>
                <ChartContainer
                  config={chartConfig}
                  style={{ height: dataHeight, minHeight: "100%", width: "100%" }}
                >
                  <RechartsBarChart
                    accessibilityLayer
                    key={`horizontal-bar-chart-${id}`}
                    data={chartData}
                    layout="vertical"
                    onClick={onBarsClick}
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    barGap={BAR_GAP}
                    barCategoryGap={BAR_CATEGORY_GAP}
                    margin={{
                      top: 0,
                      bottom: 0,
                      left: 2,
                      right: 2,
                    }}
                    stackOffset="sign"
                  >
                    {grid && verticalCartesianGrid()}
                    {/* this x axis is not visible but is needed for the chart to work */}
                    <XAxis type="number" tickLine={false} axisLine={false} hide />
                    <YAxis
                      type="category"
                      dataKey={categoryKey as string}
                      tickLine={false}
                      axisLine={false}
                      width={maxCategoryLabelWidth}
                      tick={<YAxisTick setLabelWidth={setLabelWidth} />}
                      interval={0}
                      // gives the padding on the 2 sides see the function for reference
                      padding={padding}
                      hide
                    />

                    <ChartTooltip
                      cursor={{
                        fill: "var(--openui-highlight)",
                        stroke: "var(--openui-stroke-default)",
                        opacity: 1,
                        strokeWidth: 1,
                      }}
                      content={<CustomTooltipContent parentRef={mainContainerRef} />}
                      offset={15}
                    />

                    {dataKeys.map((key, index) => {
                      const transformedKey = transformedKeys[key];
                      const color = `var(--color-${transformedKey})`;

                      return (
                        <Bar
                          key={`main-${key}`}
                          dataKey={key}
                          fill={color}
                          stackId={variant === "stacked" ? "a" : undefined}
                          isAnimationActive={isAnimationActive}
                          maxBarSize={BAR_HEIGHT}
                          barSize={BAR_HEIGHT}
                          shape={(props: any) => {
                            const { payload, value, dataKey } = props;

                            const { isNegative, isFirstInStack, isLastInStack } = getBarStackInfo(
                              variant,
                              value,
                              dataKey,
                              payload,
                              dataKeys,
                            );

                            const customRadius = getRadiusArray(
                              variant,
                              radius,
                              "horizontal",
                              isFirstInStack,
                              isLastInStack,
                              isNegative,
                            );

                            return (
                              <CustomBarShape
                                {...props}
                                radius={customRadius}
                                index={index}
                                categoryKey={categoryKey as string}
                                effectiveWidth={effectiveWidth}
                                labelHeight={labelHeight}
                                barInternalLineColor={barInternalLineColor}
                                internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                                hoveredCategory={hoveredCategory}
                                variant={variant}
                              />
                            );
                          }}
                        />
                      );
                    })}
                  </RechartsBarChart>
                </ChartContainer>
              </div>
              {/* X-axis of the chart */}
              {xAxis}
            </div>
            {/* if the data height is greater than the effective height, then show the scroll buttons */}
            <ScrollButtonsVertical
              dataHeight={dataHeight}
              effectiveHeight={effectiveContainerHeight}
              canScrollUp={canScrollUp}
              canScrollDown={canScrollDown}
              isSideBarTooltipOpen={isSideBarTooltipOpen}
              onScrollUp={scrollUp}
              onScrollDown={scrollDown}
            />
            {isSideBarTooltipOpen && <SideBarTooltip height={effectiveHeight} />}
          </div>
          {legend && (
            <DefaultLegend
              items={legendItems}
              yAxisLabel={yAxisLabel}
              xAxisLabel={xAxisLabel}
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
export const HorizontalBarChart = React.memo(
  HorizontalBarChartComponent,
) as typeof HorizontalBarChartComponent;
