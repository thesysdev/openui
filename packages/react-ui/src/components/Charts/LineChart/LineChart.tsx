import clsx from "clsx";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useExportChartData,
  useMaxLabelHeight,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import {
  ActiveDot,
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  ScrollButtonsHorizontal,
  SideBarTooltip,
  XAxisTick,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem, XAxisTickVariant } from "../types";
import {
  findNearestSnapPosition,
  getSnapPositions,
  getWidthOfData,
  getWidthOfGroup,
} from "../utils/AreaAndLine/AreaAndLineUtils";
import { getLineType } from "../utils/AreaAndLine/common";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { LineChartData, LineChartVariant } from "./types";

type LineChartOnClick = React.ComponentProps<typeof RechartsLineChart>["onClick"];
type LineClickData = Parameters<NonNullable<LineChartOnClick>>[0];

export interface LineChartProps<T extends LineChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: LineChartVariant;
  tickVariant?: XAxisTickVariant;
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

const X_AXIS_PADDING = 36;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

export const LineChart = <T extends LineChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant: lineChartVariant = "natural",
  tickVariant = "multiLine",
  grid = true,
  icons = {},
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
  strokeWidth = 2,
}: LineChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const variant = getLineType(lineChartVariant);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

  const widthOfGroup = useMemo(() => {
    return getWidthOfGroup(data);
  }, [data]);

  const maxLabelHeight = useMaxLabelHeight(data, categoryKey as string, tickVariant, widthOfGroup);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "lineChartPalette",
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
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  const effectiveContainerWidth = useMemo(() => {
    const dynamicYAxisWidth = showYAxis ? yAxisWidth : 0;
    return Math.max(0, effectiveWidth - dynamicYAxisWidth - 40); // -40 because we are giving 20px padding in xAxis on each side
  }, [effectiveWidth, showYAxis, yAxisWidth]);

  const dataWidth = useMemo(() => {
    return getWidthOfData(data, effectiveContainerWidth);
  }, [data, effectiveContainerWidth]);

  // Calculate snap positions for proper scrolling alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(data);
  }, [data]);

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

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const exportData = useExportChartData({
    type: "line",
    data,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
    extraOptions: {
      lineSize: strokeWidth,
    },
  });

  const id = useId();

  const onLineClick = useCallback(
    (data: LineClickData) => {
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

  const yAxis = useMemo(() => {
    if (!showYAxis) {
      return null;
    }
    return (
      <div className="openui-line-chart-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsLineChart
          key={`y-axis-chart-${id}`}
          width={yAxisWidth}
          height={chartHeight}
          data={data}
          margin={{
            top: 20,
            bottom: maxLabelHeight + CHART_CONTAINER_BOTTOM_MARGIN, // this is required for to give space for x-axis
            left: 0,
            right: 0,
          }}
          onClick={onLineClick}
        >
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tick={<YAxisTick setLabelWidth={setLabelWidth} />}
          />
          {/* Invisible lines to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Line
                key={`y-axis-${key}`}
                dataKey={key}
                type={variant}
                stroke="transparent"
                strokeWidth={0}
                dot={false}
                activeDot={false}
                isAnimationActive={isAnimationActive}
              />
            );
          })}
        </RechartsLineChart>
      </div>
    );
  }, [
    showYAxis,
    id,
    chartHeight,
    data,
    onLineClick,
    dataKeys,
    variant,
    isAnimationActive,
    maxLabelHeight,
    yAxisWidth,
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
          className={clsx("openui-line-chart-container", className)}
          data-openui-chart={exportData}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          <div className="openui-line-chart-container-inner" ref={chartContainerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="openui-line-chart-main-container" ref={mainContainerRef}>
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
                <RechartsLineChart
                  accessibilityLayer
                  key={`line-chart-${id}`}
                  data={data}
                  margin={{
                    top: 20,
                    bottom: CHART_CONTAINER_BOTTOM_MARGIN,
                  }}
                  onClick={onLineClick}
                >
                  {grid && cartesianGrid()}
                  <XAxis
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    height={maxLabelHeight}
                    textAnchor="middle"
                    interval={0}
                    tick={
                      <XAxisTick
                        variant={tickVariant}
                        widthOfGroup={widthOfGroup}
                        labelHeight={maxLabelHeight}
                      />
                    }
                    orientation="bottom"
                    padding={{
                      left: X_AXIS_PADDING,
                      right: X_AXIS_PADDING,
                    }}
                  />

                  <ChartTooltip
                    content={<CustomTooltipContent parentRef={mainContainerRef} />}
                    offset={15}
                  />

                  {dataKeys.map((key) => {
                    const transformedKey = transformedKeys[key];
                    const color = `var(--color-${transformedKey})`;
                    return (
                      <Line
                        key={`main-${key}`}
                        dataKey={key}
                        type={variant}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        dot={false}
                        activeDot={<ActiveDot key={`active-dot-${key}-${id}`} />}
                        isAnimationActive={isAnimationActive}
                      />
                    );
                  })}
                </RechartsLineChart>
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
