import clsx from "clsx";
import { uniqueId } from "lodash-es";
import { ComponentProps, createContext, forwardRef, useContext, useId, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { useTheme } from "../ThemeProvider";

/**
 * @module Charts
 * A collection of chart components built on top of Recharts with enhanced styling and theming capabilities.
 */

/**
 * Available themes for chart customization
 * @constant
 * @type {Record<'light' | 'dark', string>}
 */
const THEMES = { light: "", dark: ".dark" } as const;

/**
 * Configuration type for chart elements
 */
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    transformed?: string;
  } & (
    | { color?: string; secondaryColor?: string; theme?: never }
    | {
        color?: never;
        theme: Record<
          keyof typeof THEMES,
          | string
          | {
              color: string;
              secondaryColor?: string;
            }
        >;
      }
  );
};

/**
 * Data structure for chart export (e.g., to PPTX)
 */
export type ExportChartData = {
  type: "line" | "bar" | "area" | "pie" | "radar" | "scatter";
  data: {
    name: string;
    labels?: string[];
    values?: number[];
    x?: number[];
    y?: number[];
  }[];
  options?: {
    chartColors?: string[];
    showLegend?: boolean;
    legendPos?: "b" | "t" | "l" | "r";
    title?: string;
    showTitle?: boolean;
    catAxisTitle?: string;
    showCatAxisTitle?: boolean;
    valAxisTitle?: string;
    showValAxisTitle?: boolean;
    lineSize?: number;
    barDir?: "bar" | "col";
    barGrouping?: "stacked" | "clustered" | "percent" | "standard";
  };
};

/**
 * Context props for chart configuration
 */
type ChartContextProps = {
  config: ChartConfig;
  id: string;
};

const ChartContext = createContext<ChartContextProps | null>(null);

/**
 * Hook to access chart context
 * @throws Error if used outside of ChartContainer
 */
function useChart() {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

/**
 * Component that generates theme-specific styles for chart elements
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
    ${prefix} [data-chart=${id}] {
    ${colorConfig
      .map(([_, itemConfig]) => {
        const transformedKey = itemConfig.transformed;
        const themeValue = itemConfig.theme?.[theme as keyof typeof itemConfig.theme];
        const color =
          typeof themeValue === "string" ? themeValue : themeValue?.color || itemConfig.color;
        const secondaryColor =
          typeof themeValue === "object"
            ? themeValue?.secondaryColor
            : "secondaryColor" in itemConfig
              ? itemConfig.secondaryColor
              : undefined;

        return [
          color ? `  --color-${transformedKey}: ${color};` : null,
          secondaryColor ? `  --color-${transformedKey}-secondary: ${secondaryColor};` : null,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n")}
    }
    `,
          )
          .join("\n"),
      }}
    />
  );
};

/**
 * Container component for charts that provides configuration context and styling
 */
const ChartContainer = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
    rechartsProps?: Omit<
      React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>,
      "children"
    >;
  }
>(({ id, className, children, config, rechartsProps, style, ...props }, ref) => {
  const uniqueId = useId();
  const chartId = `openui-chart-${id || uniqueId.replace(/:/g, "")}`;
  const { theme } = useTheme();

  return (
    <ChartContext.Provider value={{ config, id: chartId }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={clsx("openui-chart-container", className)}
        style={
          {
            //TODO: remove this once we have a proper theme for charts
            "--openui-foreground": theme.foreground,
            "--openui-text-neutral-primary": theme.textNeutralPrimary,
            width: "100%",
            height: "100%",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          width={rechartsProps?.width ?? "100%"}
          height={rechartsProps?.height ?? "100%"}
          minWidth={rechartsProps?.minWidth ?? 1}
          minHeight={rechartsProps?.minHeight ?? 1}
          initialDimension={rechartsProps?.initialDimension ?? { width: 1, height: 1 }}
          id={rechartsProps?.id ?? chartId}
          {...rechartsProps}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

/**
 * Re-exported Tooltip component from Recharts
 */
const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Custom tooltip content component with enhanced styling and formatting
 */
type ChartTooltipContentProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    showPercentage?: boolean;
  };

function ChartTooltipContentRender(
  {
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
    showPercentage = false,
  }: ChartTooltipContentProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { config } = useChart();

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={clsx("openui-chart-tooltip-label-heavy", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={clsx("openui-chart-tooltip-label", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div ref={ref} className={clsx("openui-chart-tooltip", className)}>
      {!nestLabel && tooltipLabel}
      <div className="openui-chart-tooltip-content">
        {payload.map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = (color ?? item.payload.fill) || item.color;

          return (
            <div
              key={item.dataKey}
              className={clsx(
                "openui-chart-tooltip-content-item",
                indicator === "dot" && "openui-chart-tooltip-content-item--dot",
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={clsx(
                          "openui-chart-tooltip-content-indicator",
                          `openui-chart-tooltip-content-indicator--${indicator}`,
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={clsx(
                      "openui-chart-tooltip-content-value-wrapper",
                      nestLabel
                        ? "openui-chart-tooltip-content-value-wrapper--nested"
                        : "openui-chart-tooltip-content-value-wrapper--standard",
                    )}
                  >
                    <div className="openui-chart-tooltip-content-label">
                      {nestLabel && tooltipLabel}
                      <span>{itemConfig?.label || item.name}</span>
                    </div>
                    {item.value !== undefined && (
                      <span
                        className={clsx(
                          "openui-chart-tooltip-content-value",
                          showPercentage && "percentage",
                        )}
                      >
                        {item.value.toLocaleString()}
                        {showPercentage ? "%" : ""}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartTooltipContent = forwardRef(ChartTooltipContentRender);
ChartTooltipContent.displayName = "ChartTooltip";

// this is not used any more, in the new chart, we are using the default legend which is rendered outside the charts container,
// older charts are still using this legend.

/**
 * Re-exported Legend component from Recharts
 */
const ChartLegend = RechartsPrimitive.Legend;

/**
 * Custom legend content component with enhanced styling
 */
const ChartLegendContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();

  const payloadWithKeys = useMemo(
    () =>
      payload?.map((item) => ({
        ...item,
        uniqueKey: uniqueId(`chart-legend-${item.dataKey || item.value || ""}-`),
      })),
    [payload],
  );

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={clsx("openui-chart-legend", `openui-chart-legend--${verticalAlign}`, className)}
    >
      {payloadWithKeys?.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div key={item.uniqueKey} className="openui-chart-legend-item">
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="openui-chart-legend-item-indicator"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="openui-chart-legend-item-label">{itemConfig?.label}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

/**
 * Helper function to extract configuration for a chart element from a payload
 */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  getPayloadConfigFromPayload,
  useChart,
};
