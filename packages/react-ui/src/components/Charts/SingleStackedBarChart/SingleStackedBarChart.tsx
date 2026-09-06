import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrintContext } from "../../../context/PrintContext";
import { Separator } from "../../Separator";
import { useExportChartData } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { FloatingUIPortal } from "../shared/PortalTooltip";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend";
import { LegendItem, StackedLegendItem } from "../types";
import { normalizeChartData } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { ToolTip } from "./components";
import { SingleStackedBarData } from "./types";

export interface SingleStackedBarProps<T extends SingleStackedBarData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export const SingleStackedBar = <T extends SingleStackedBarData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  customPalette,
  legend = true,
  legendVariant = "default",
  className,
  style,
  animated = true,
}: SingleStackedBarProps<T>) => {
  // Guard against nullish `data` while generative UI is streaming.
  data = normalizeChartData(data);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);
  // Calculate percentages
  const segments = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const total = data.reduce((acc, item) => acc + Number(item[dataKey]), 0);

    return data.map((item, index) => ({
      value: Number(item[dataKey]),
      category: String(item[categoryKey]),
      index,
      percentage: total > 0 ? (Number(item[dataKey]) / total) * 100 : 0,
    }));
  }, [data, dataKey, categoryKey]);

  // Get theme colors for each segment
  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "barChartPalette",
    dataLength: Math.max(segments.length, 1),
  });

  // Create legend items
  const legendItems = useMemo((): LegendItem[] => {
    return segments.map((segment, index) => ({
      key: `${segment.category}-${index}`,
      label: segment.category,
      color: colors[index % colors.length] || "",
      percentage: segment.percentage,
    }));
  }, [segments, colors]);

  // Create stacked legend items with values
  const stackedLegendItems = useMemo(
    (): StackedLegendItem[] =>
      segments.map((segment, index) => ({
        key: `${segment.category}-${index}`,
        label: segment.category,
        value: segment.value,
        color: colors[index % colors.length] || "",
      })),
    [segments, colors],
  );

  const printContext = usePrintContext();
  animated = printContext ? false : animated;

  const exportData = useExportChartData({
    type: "bar",
    data,
    categoryKey: categoryKey as string,
    dataKeys: [dataKey as string],
    colors,
    legend,
    extraOptions: {
      barDir: "bar",
      barGrouping: "stacked",
    },
  });

  // Handle legend item hover with tooltip positioning
  const handleLegendItemHover = useCallback(
    (hoverIndex: number | null) => {
      setActiveIndex(hoverIndex);
      if (hoverIndex !== null) {
        const segment = segments[hoverIndex];
        if (segment) {
          const legendKey = `${segment.category}-${hoverIndex}`;
          setHoveredLegendKey(legendKey);
        }
        // Try to position tooltip above the hovered segment
        const segmentEl = wrapperRef.current?.querySelectorAll(
          ".openui-single-stacked-bar-chart-segment",
        )?.[hoverIndex] as HTMLDivElement | undefined;
        if (segmentEl) {
          const rect = segmentEl.getBoundingClientRect();
          const containerRect = wrapperRef.current?.getBoundingClientRect();
          if (containerRect) {
            const relativeX = rect.left + rect.width / 2 - containerRect.left;
            const relativeY = rect.top - containerRect.top;
            setTooltipPosition({ x: relativeX, y: relativeY });
          } else {
            setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
          }
        }
      } else {
        setHoveredLegendKey(null);
        setTooltipPosition(null);
      }
    },
    [segments],
  );

  // Segmented progress bar
  return (
    <div
      ref={wrapperRef}
      className={clsx("openui-single-stacked-bar-chart-container", className, {
        "openui-single-stacked-bar-chart-container-gap": legend && legendVariant === "default",
      })}
      style={style}
      data-openui-chart={exportData}
    >
      <div className="openui-single-stacked-bar-chart">
        {segments.map((segment, index) => {
          const isActive = activeIndex === null || activeIndex === index;
          return (
            <div
              key={`segment-${index}`}
              className={clsx("openui-single-stacked-bar-chart-segment", {
                "openui-single-stacked-bar-chart-animated": animated,
              })}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: colors[index % colors.length],
                opacity: isActive ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                setActiveIndex(index);
                const legendKey = `${segment.category}-${index}`;
                setHoveredLegendKey(legendKey);
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const containerRect = wrapperRef.current?.getBoundingClientRect();
                if (containerRect) {
                  // Position relative to container so FloatingUIPortal aligns correctly
                  const relativeX = rect.left + rect.width / 2 - containerRect.left;
                  const relativeY = rect.top - containerRect.top;
                  setTooltipPosition({ x: relativeX, y: relativeY });
                } else {
                  setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
                }
              }}
              onMouseLeave={() => {
                setActiveIndex(null);
                setHoveredLegendKey(null);
              }}
            >
              <div className="openui-single-stacked-bar-chart-segment-line" />
            </div>
          );
        })}
      </div>
      {activeIndex !== null && tooltipPosition && (
        <FloatingUIPortal position={tooltipPosition} placement="top" offsetDistance={10}>
          <ToolTip
            label={legendItems[activeIndex]?.label ?? ""}
            color={stackedLegendItems[activeIndex]?.color ?? "#000000"}
            value={stackedLegendItems[activeIndex]?.value ?? 0}
            percentage={segments[activeIndex]?.percentage ?? 0}
          />
        </FloatingUIPortal>
      )}

      {legend && legendVariant === "default" && <Separator />}

      {legend && legendVariant === "default" && (
        <DefaultLegend
          items={legendItems}
          isExpanded={isLegendExpanded}
          setIsExpanded={setIsLegendExpanded}
          containerWidth={containerWidth}
          style={{ paddingTop: 0 }}
        />
      )}
      {legend && legendVariant === "stacked" && (
        <StackedLegend
          items={stackedLegendItems}
          containerWidth={containerWidth}
          onItemHover={setHoveredLegendKey}
          activeKey={hoveredLegendKey}
          onLegendItemHover={handleLegendItemHover}
          separator
          showTitle={false}
          layout="showMore"
          className="openui-single-stacked-bar-chart-stacked-legend"
        />
      )}
    </div>
  );
};
