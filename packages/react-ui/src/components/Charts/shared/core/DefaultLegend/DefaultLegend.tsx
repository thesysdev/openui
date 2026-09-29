import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { Button } from "../../../../Button";
import { type LegendItem } from "../../../types";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";
import { useDefaultLegend } from "./hooks/useDefaultLegend";

interface DefaultLegendProps {
  items: LegendItem[];
  className?: string;
  yAxisLabel?: React.ReactNode;
  xAxisLabel?: React.ReactNode;
  containerWidth?: number;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  style?: React.CSSProperties;
  onItemClick?: (key: string) => void;
  hiddenSeries?: Set<string>;
}

const DefaultLegend = memo(
  React.forwardRef<HTMLDivElement, DefaultLegendProps>(
    (
      {
        items,
        className,
        yAxisLabel,
        xAxisLabel,
        containerWidth,
        isExpanded,
        setIsExpanded,
        style,
        onItemClick,
        hiddenSeries,
      },
      ref,
    ) => {
      const [buttonWidth, setButtonWidth] = useState(0);
      const { displayItems, hasMoreItems, toggleButtonText } = useDefaultLegend({
        items,
        containerWidth,
        buttonWidth,
        isExpanded,
      });

      const buttonRef = useCallback(
        (node: HTMLButtonElement | null) => {
          if (node) {
            if (node.clientWidth !== buttonWidth) {
              setButtonWidth(node.clientWidth);
            }
          }
        },
        [buttonWidth],
      );

      const handleToggleExpanded = () => {
        setIsExpanded(!isExpanded);
      };

      const showToggleButton = hasMoreItems;

      return (
        <div
          ref={ref}
          className={clsx(
            `${CHART_CLASS_PREFIX}-chart-legend-container ${CHART_CLASS_PREFIX}-chart-legend--bottom`,
            className,
          )}
          style={style}
        >
          {(xAxisLabel || yAxisLabel) && (
            <div className={`${CHART_CLASS_PREFIX}-chart-legend-axis-label-container`}>
              {xAxisLabel && (
                <span className={`${CHART_CLASS_PREFIX}-chart-legend-axis-label`}>
                  X-Axis:{" "}
                  <span className={`${CHART_CLASS_PREFIX}-chart-legend-axis-label-text`}>
                    {xAxisLabel}
                  </span>
                </span>
              )}
              {yAxisLabel && (
                <span className={`${CHART_CLASS_PREFIX}-chart-legend-axis-label`}>
                  Y-Axis:{" "}
                  <span className={`${CHART_CLASS_PREFIX}-chart-legend-axis-label-text`}>
                    {yAxisLabel}
                  </span>
                </span>
              )}
            </div>
          )}
          <div
            className={clsx(`${CHART_CLASS_PREFIX}-chart-legend`, {
              [`${CHART_CLASS_PREFIX}-chart-legend--expanded`]: isExpanded,
              [`${CHART_CLASS_PREFIX}-chart-legend--collapsed`]: !isExpanded && showToggleButton,
            })}
          >
            {displayItems.map((item) => {
              const isHidden = hiddenSeries?.has(item.key);
              return (
                <div
                  key={item.key}
                  className={`${CHART_CLASS_PREFIX}-chart-legend-item`}
                  style={{
                    cursor: onItemClick ? "pointer" : undefined,
                    opacity: isHidden ? 0.3 : 1,
                  }}
                  onClick={onItemClick ? () => onItemClick(item.key) : undefined}
                >
                  {item.icon ? (
                    <item.icon />
                  ) : (
                    <div
                      className={`${CHART_CLASS_PREFIX}-chart-legend-item-indicator`}
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <div className={`${CHART_CLASS_PREFIX}-chart-legend-item-label-container`}>
                    <span className={`${CHART_CLASS_PREFIX}-chart-legend-item-label`}>
                      {item.label}
                    </span>
                    {item.percentage !== undefined && (
                      <span className={`${CHART_CLASS_PREFIX}-chart-legend-item-percentage`}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {showToggleButton && (
              <Button
                variant="tertiary"
                size="small"
                ref={buttonRef}
                className={`${CHART_CLASS_PREFIX}-chart-legend-toggle-button`}
                onClick={handleToggleExpanded}
                iconRight={
                  isExpanded ? (
                    <ChevronUpIcon
                      className={`${CHART_CLASS_PREFIX}-chart-legend-toggle-button-icon`}
                    />
                  ) : (
                    <ChevronDownIcon
                      className={`${CHART_CLASS_PREFIX}-chart-legend-toggle-button-icon`}
                    />
                  )
                }
              >
                {toggleButtonText}
              </Button>
            )}
          </div>
        </div>
      );
    },
  ),
);

DefaultLegend.displayName = "DefaultLegend";
export { DefaultLegend };
export type { DefaultLegendProps };
