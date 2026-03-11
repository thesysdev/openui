import clsx from "clsx";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { useTheme } from "../../ThemeProvider";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useExportChartData,
  useMaxLabelHeight,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import {
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  LineInBarShape,
  SideBarTooltip,
  XAxisTick,
  XAxisTickProps,
  YAxisTick,
} from "../shared";

import { ScrollButtonsHorizontal } from "../shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { XAxisTickVariant } from "../types";
import { type LegendItem } from "../types/Legend";
import { useChartPalette, type PaletteName } from "../utils/PalletUtils";

import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import {
  findNearestSnapPosition,
  getBarStackInfo,
  getRadiusArray,
} from "../utils/BarCharts/BarChartsUtils";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { BarChartData, BarChartVariant } from "./types";
import {
  BAR_WIDTH,
  getPadding,
  getSnapPositions,
  getWidthOfData,
  getWidthOfGroup,
} from "./utils/BarChartUtils";

// this a technic to get the type of the onClick event of the bar chart
// we need to do this because the onClick event type is not exported by recharts
type BarChartOnClick = React.ComponentProps<typeof RechartsBarChart>["onClick"];
type BarClickData = Parameters<NonNullable<BarChartOnClick>>[0];
export interface BarChartProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: BarChartVariant;
  tickVariant?: XAxisTickVariant;
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
}

const BAR_GAP = 10; // Gap between bars
const BAR_CATEGORY_GAP = "20%"; // Gap between categories
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

const BarChartComponent = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "grouped",
  tickVariant = "multiLine",
  grid = true,
  icons = {},
  radius,
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
}: BarChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const widthOfGroup = getWidthOfGroup(data, categoryKey as string, variant);

  const maxLabelHeight = useMaxLabelHeight(data, categoryKey as string, tickVariant, widthOfGroup);

  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // need this to calculate the padding for the chart container, because the y-axis is rendered in a separate chart
  const effectiveContainerWidth = useMemo(() => {
    const dynamicYAxisWidth = showYAxis ? yAxisWidth : 0;
    return Math.max(0, effectiveWidth - dynamicYAxisWidth);
  }, [effectiveWidth, showYAxis, yAxisWidth]);

  const padding = useMemo(() => {
    return getPadding(data, categoryKey as string, effectiveContainerWidth, variant);
  }, [data, categoryKey, effectiveContainerWidth, variant]);

  const dataWidth = useMemo(() => {
    return getWidthOfData(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Calculate snap positions for proper group alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // self note:
  // Use provided height or calculated height based on container width
  // if height is provided, it will be used to set the height of the chart
  // if height is not provided, it will be calculated based on the container width (effectiveWidth)
  // getChartHeight(effectiveWidth) this function is not used here, request of the designer, we will use fix height
  // 296 is the height of the chart by default, given by designer
  // we want to chart to scale with width but height will be fixed

  const chartHeight = useMemo(() => {
    return height ?? 296 + maxLabelHeight;
  }, [height, maxLabelHeight]);

  // Check scroll boundaries
  const updateScrollState = useCallback(() => {
    if (mainContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mainContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for floating point precision
    }
  }, []);

  const scrollLeft = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollLeft;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "left");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  const scrollRight = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollLeft;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "right");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  // Update scroll state when container width or data width changes
  useEffect(() => {
    updateScrollState();
  }, [effectiveWidth, dataWidth, updateScrollState]);

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
    data,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
  });

  const id = useId();

  const yAxis = useMemo(() => {
    if (!showYAxis) {
      return null;
    }
    return (
      <div className="openui-bar-chart-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsBarChart
          key={`y-axis-bar-chart-${id}`}
          width={yAxisWidth}
          height={chartHeight}
          data={data}
          stackOffset="sign"
          margin={{
            top: 20,
            bottom: maxLabelHeight + CHART_CONTAINER_BOTTOM_MARGIN, // this is required for to give space for x-axis
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
                key={`yaxis-bar-chart-${key}`}
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
  }, [showYAxis, chartHeight, data, dataKeys, variant, id, maxLabelHeight, yAxisWidth]);

  // Handle mouse events for group hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const handleXAxisTickMouseEnter = useCallback((tickProps: XAxisTickProps) => {
    if (typeof tickProps.payload?.value === "string") {
      setHoveredCategory(tickProps.payload.value);
    }
  }, []);

  const handleXAxisTickMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const { mode, theme: userTheme } = useTheme();

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

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

  const onBarsClick = useCallback(
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

  const barElements = useMemo(() => {
    return dataKeys.map((key) => {
      const transformedKey = transformedKeys[key];
      const color = `var(--color-${transformedKey})`;

      return (
        <Bar
          key={`main-${key}`}
          dataKey={key}
          fill={color}
          stackId={variant === "stacked" ? "a" : undefined}
          isAnimationActive={isAnimationActive}
          maxBarSize={BAR_WIDTH}
          barSize={BAR_WIDTH}
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
          className={clsx("openui-bar-chart-container", className)}
          data-openui-chart={exportData}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          <div className="openui-bar-chart-container-inner" ref={chartContainerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="openui-bar-chart-main-container" ref={mainContainerRef}>
              <ChartContainer
                config={chartConfig}
                style={{ width: dataWidth, minWidth: "100%", height: chartHeight }}
                rechartsProps={{
                  width: "100%",
                  height: "100%",
                  minHeight: 1,
                  minWidth: 1,
                  initialDimension: { width: 1, height: 1 },
                }}
              >
                <RechartsBarChart
                  stackOffset="sign"
                  accessibilityLayer
                  key={`bar-chart-${id}`}
                  data={data}
                  margin={{
                    top: 20,
                    bottom: CHART_CONTAINER_BOTTOM_MARGIN,
                  }}
                  onClick={onBarsClick}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  barGap={BAR_GAP}
                  barCategoryGap={BAR_CATEGORY_GAP}
                >
                  {grid && cartesianGrid()}
                  <XAxis
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    textAnchor={"middle"}
                    interval={0}
                    height={maxLabelHeight}
                    tick={
                      <XAxisTick
                        variant={tickVariant}
                        widthOfGroup={widthOfGroup}
                        labelHeight={maxLabelHeight}
                        onMouseEnter={handleXAxisTickMouseEnter}
                        onMouseLeave={handleXAxisTickMouseLeave}
                      />
                    }
                    orientation="bottom"
                    // gives the padding on the 2 sides see the function for reference
                    padding={padding}
                  />
                  {/* Y-axis is rendered in the separate synchronized chart */}

                  <ChartTooltip
                    // cursor={<SimpleCursor />}
                    cursor={{
                      fill: "var(--openui-highlight)",
                      stroke: "var(--openui-stroke-default)",
                      opacity: 1,
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltipContent parentRef={mainContainerRef} />}
                    offset={15}
                  />

                  {barElements}
                </RechartsBarChart>
              </ChartContainer>
            </div>
            {isSideBarTooltipOpen && <SideBarTooltip height={chartHeight} />}
          </div>
          {/* if the data width is greater than the effective width, then show the scroll buttons */}
          <ScrollButtonsHorizontal
            dataWidth={dataWidth}
            effectiveWidth={effectiveWidth}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            isSideBarTooltipOpen={isSideBarTooltipOpen}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
          />
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
export const BarChart = React.memo(BarChartComponent) as typeof BarChartComponent;
