"use client";

import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { Button } from "../../../../Button";
import { type LegendItem } from "../../../types";
import { defaultLegendClasses, names } from "./defaultLegend.styles";
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
      const styles = defaultLegendClasses;
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
        <div ref={ref} className={clsx(styles.root, names.root, className)} style={style}>
          {(xAxisLabel || yAxisLabel) && (
            <div className={clsx(styles.axisLabelContainer, names.axisLabelContainer)}>
              {xAxisLabel && (
                <span className={clsx(styles.axisLabel, names.axisLabel)}>
                  X-Axis:{" "}
                  <span className={clsx(styles.axisLabelText, names.axisLabelText)}>
                    {xAxisLabel}
                  </span>
                </span>
              )}
              {yAxisLabel && (
                <span className={clsx(styles.axisLabel, names.axisLabel)}>
                  Y-Axis:{" "}
                  <span className={clsx(styles.axisLabelText, names.axisLabelText)}>
                    {yAxisLabel}
                  </span>
                </span>
              )}
            </div>
          )}
          <div
            className={clsx(styles.list, names.list)}
            data-state={isExpanded ? "expanded" : showToggleButton ? "collapsed" : undefined}
          >
            {displayItems.map((item) => {
              const isHidden = hiddenSeries?.has(item.key);
              return (
                <div
                  key={item.key}
                  className={clsx(styles.item, names.item)}
                  data-clickable={onItemClick ? "" : undefined}
                  style={
                    {
                      "--_openui-default-legend-item-opacity": isHidden ? 0.3 : 1,
                    } as React.CSSProperties
                  }
                  onClick={onItemClick ? () => onItemClick(item.key) : undefined}
                >
                  {item.icon ? (
                    <span className={clsx(styles.icon, names.icon)}>
                      <item.icon />
                    </span>
                  ) : (
                    <div
                      className={clsx(styles.indicator, names.indicator)}
                      style={
                        {
                          "--_openui-default-legend-indicator-color": item.color,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div className={clsx(styles.labelContainer, names.labelContainer)}>
                    <span className={clsx(styles.label, names.label)}>{item.label}</span>
                    {item.percentage !== undefined && (
                      <span className={clsx(styles.percentage, names.percentage)}>
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
                className={clsx(styles.toggleButton, names.toggleButton)}
                onClick={handleToggleExpanded}
                iconRight={
                  isExpanded ? (
                    <ChevronUpIcon className={clsx(styles.toggleIcon, names.toggleIcon)} />
                  ) : (
                    <ChevronDownIcon className={clsx(styles.toggleIcon, names.toggleIcon)} />
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
