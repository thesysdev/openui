import clsx from "clsx";
import React, { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useExportChartData, useTransformedKeys } from "../hooks";
import { ActiveDot, CustomTooltipContent, DefaultLegend } from "../shared";
import { LegendItem } from "../types";
import { useChartPalette } from "../utils/PalletUtils";
import { ensureChartData, get2dChartConfig, getDataKeys, getLegendItems } from "../utils/dataUtils";
import { AxisLabel } from "./components/AxisLabel";
import { RadarChartData } from "./types";

const MIN_CHART_SIZE = 150;
const MAX_CHART_SIZE = 296;

export interface RadarChartProps<T extends RadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  customPalette?: string[];
  variant?: "line" | "area";
  grid?: boolean;
  legend?: boolean;
  strokeWidth?: number;
  areaOpacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  height?: number;
  width?: number;
}

const RadarChartComponent = <T extends RadarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "line",
  grid = true,
  legend = true,
  strokeWidth = 2,
  areaOpacity = 0.2,
  icons = {},
  isAnimationActive = false,
  height,
  width,
}: RadarChartProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;
  const chartData = useMemo(() => ensureChartData<T[number]>(data), [data]);

  const dataKeys = useMemo(() => {
    return getDataKeys(chartData, categoryKey as string);
  }, [chartData, categoryKey]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "radarChartPalette",
    dataLength: dataKeys.length,
  });

  // Create Config
  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const exportData = useExportChartData({
    type: "radar",
    data: chartData,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
  });

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });

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

    // Read initial dimensions synchronously before first paint to avoid size jump
    const rect = wrapper.getBoundingClientRect();
    setWrapperRect({ width: rect.width, height: rect.height });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const chartSize = useMemo(() => {
    const effectiveWidth = wrapperRect.width;
    const effectiveHeight = wrapperRect.height;
    let charts = Math.min(effectiveWidth, effectiveHeight);
    charts = Math.min(charts, MAX_CHART_SIZE);
    return Math.max(MIN_CHART_SIZE, charts);
  }, [wrapperRect]);

  const chartSizeStyle = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);
  const rechartsProps: Omit<React.ComponentProps<typeof ResponsiveContainer>, "children"> = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: 1,
      minHeight: 1,
      initialDimension: { width: 1, height: 1 },
    }),
    [],
  );

  const radars = useMemo(() => {
    return dataKeys.map((key) => {
      const transformedKey = transformedKeys[key];
      const color = `var(--color-${transformedKey})`;
      if (variant === "line") {
        return (
          <Radar
            key={key}
            dataKey={key}
            fill={color}
            fillOpacity={0}
            stroke={color}
            strokeWidth={strokeWidth}
            isAnimationActive={isAnimationActive}
            activeDot={<ActiveDot />}
          />
        );
      } else {
        return (
          <Radar
            key={key}
            dataKey={key}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            fillOpacity={areaOpacity}
            isAnimationActive={isAnimationActive}
            activeDot={<ActiveDot />}
          />
        );
      }
    });
  }, [dataKeys, transformedKeys, variant, strokeWidth, areaOpacity, isAnimationActive]);

  const wrapperClassName = useMemo(
    () =>
      clsx("openui-radar-chart-container-wrapper", {
        "layout-column": true,
      }),
    [],
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

    if (dimensions.width === undefined) {
      delete dimensions.width;
    }

    if (dimensions.height === undefined) {
      delete dimensions.height;
    }

    return dimensions;
  }, [width, height]);

  return (
    <SideBarTooltipProvider
      isSideBarTooltipOpen={false}
      setIsSideBarTooltipOpen={() => {}}
      data={undefined}
      setData={() => {}}
    >
      <div
        ref={wrapperRef}
        className={wrapperClassName}
        style={wrapperStyle}
        data-openui-chart={exportData}
      >
        <div className="openui-radar-chart-container">
          <div className="openui-radar-chart-container-inner">
            <div style={chartSizeStyle}>
              <ChartContainer
                config={chartConfig}
                className="openui-radar-chart"
                rechartsProps={rechartsProps}
              >
                <RechartsRadarChart
                  data={chartData}
                  margin={{
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10,
                  }}
                >
                  {grid && <PolarGrid className="openui-chart-polar-grid" stroke="currentColor" />}
                  <PolarAngleAxis
                    dataKey={categoryKey as string}
                    tick={<AxisLabel portalContainerRef={wrapperRef} />}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<CustomTooltipContent parentRef={wrapperRef} />}
                  />
                  {/* rendering the radars here */}
                  {radars}
                </RechartsRadarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
        {legend && (
          <DefaultLegend
            items={legendItems}
            containerWidth={wrapperRect.width}
            isExpanded={isLegendExpanded}
            setIsExpanded={setIsLegendExpanded}
            style={{ paddingTop: 0 }}
          />
        )}
      </div>
    </SideBarTooltipProvider>
  );
};

export const RadarChart = memo(RadarChartComponent);

RadarChart.displayName = "RadarChart";
