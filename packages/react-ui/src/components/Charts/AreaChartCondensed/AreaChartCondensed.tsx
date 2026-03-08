import clsx from "clsx";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { AreaChartData, AreaChartVariant } from "../AreaChart/types";
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
  ActiveDot,
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  SideBarTooltip,
  SVGXAxisTick,
  SVGXAxisTickVariant,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem } from "../types";
import { getLineType } from "../utils/AreaAndLine/common";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";

// this a technic to get the type of the onClick event of the area chart
// we need to do this because the onClick event type is not exported by recharts
type AreaChartOnClick = React.ComponentProps<typeof RechartsAreaChart>["onClick"];
type AreaClickData = Parameters<NonNullable<AreaChartOnClick>>[0];

export interface AreaChartCondensedProps<T extends AreaChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: AreaChartVariant;
  tickVariant?: SVGXAxisTickVariant;
  grid?: boolean;
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

const CHART_HEIGHT = 296;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

const AreaChartCondensedComponent = <T extends AreaChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant: areaChartVariant = "natural",
  tickVariant = "singleLine",
  grid = true,
  icons = {},
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height = CHART_HEIGHT,
  width,
}: AreaChartCondensedProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const variant = getLineType(areaChartVariant);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

  const maxLabelWidth = useMaxLabelWidth(data, categoryKey as string);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState<number>(0);

  const widthOfData = useMemo(() => {
    if (data.length === 0) {
      return 0;
    }
    // Use passed width if available, otherwise use observed chartContainerWidth
    const chartWidth = width ?? chartContainerWidth;
    return chartWidth / data.length;
  }, [width, chartContainerWidth, data]);

  const { angle: calculatedAngle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    tickVariant === "angled",
    // if the max label width is less than 100px, then we use the width of the data to calculate the angle, gives better results for small datasets
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
    themePaletteName: "areaChartPalette",
    dataLength: dataKeys.length,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const id = useId();

  const exportData = useExportChartData({
    type: "area",
    data,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
  });
  const gradientID = useMemo(() => `area-chart-condensed-gradient-${id}`, [id]);

  const chartMargin = useMemo(
    () => ({
      top: 10,
      right: 10,
      bottom: CHART_CONTAINER_BOTTOM_MARGIN,
      left: showYAxis ? 10 : 0,
    }),
    [showYAxis],
  );

  const onAreaClick = useCallback(
    (data: AreaClickData) => {
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // Observe container width for legend
  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !containerRef.current || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          setContainerWidth(entry.contentRect.width);
        }
        if (entry.target === chartContainerRef.current) {
          setChartContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(chartContainerRef.current);

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
      <div className="openui-area-chart-condensed-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsAreaChart
          key={`y-axis-area-chart-condensed-${id}`}
          width={yAxisWidth}
          height={effectiveHeight}
          data={data}
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
          {/* Invisible areas to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Area
                key={`yaxis-area-chart-condensed-${key}`}
                dataKey={key}
                fill="transparent"
                stroke="transparent"
                stackId="a"
                isAnimationActive={false}
              />
            );
          })}
        </RechartsAreaChart>
      </div>
    );
  }, [
    showYAxis,
    effectiveHeight,
    data,
    dataKeys,
    id,
    yAxisWidth,
    chartMargin,
    xAxisHeight,
    setLabelWidth,
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
          className={clsx("openui-area-chart-condensed-container", className)}
          data-openui-chart={exportData}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          {yAxisLabel && (
            <div className="openui-area-chart-condensed-y-axis-label">{yAxisLabel}</div>
          )}
          <div className="openui-area-chart-condensed-container-inner" ref={containerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="openui-area-chart-condensed" ref={chartContainerRef}>
              <ChartContainer
                config={chartConfig}
                style={{ width: "100%", height: effectiveHeight }}
                rechartsProps={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <RechartsAreaChart
                  accessibilityLayer
                  key={`area-chart-condensed-${id}`}
                  data={data}
                  margin={chartMargin}
                  onClick={onAreaClick}
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
                    content={<CustomTooltipContent parentRef={containerRef} />}
                    offset={10}
                  />

                  {dataKeys.map((key) => {
                    const transformedKey = transformedKeys[key];
                    const color = `var(--color-${transformedKey})`;
                    return (
                      <defs key={`gradient-${transformedKey}`}>
                        <linearGradient
                          id={`${gradientID}-${transformedKey}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    );
                  })}

                  {dataKeys.map((key) => {
                    const transformedKey = transformedKeys[key];
                    const color = `var(--color-${transformedKey})`;
                    return (
                      <Area
                        key={`area-${key}`}
                        dataKey={key}
                        type={variant}
                        stroke={color}
                        fill={`url(#${gradientID}-${transformedKey})`}
                        fillOpacity={1}
                        stackId="a"
                        activeDot={<ActiveDot key={`active-dot-${key}-${id}`} />}
                        dot={false}
                        isAnimationActive={isAnimationActive}
                        // strokeWidth={2}
                      />
                    );
                  })}
                </RechartsAreaChart>
              </ChartContainer>
            </div>
            {isSideBarTooltipOpen && <SideBarTooltip height={effectiveHeight} />}
          </div>
          {xAxisLabel && (
            <div className="openui-area-chart-condensed-x-axis-label">{xAxisLabel}</div>
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
export const AreaChartCondensed = React.memo(
  AreaChartCondensedComponent,
) as typeof AreaChartCondensedComponent;
