import { flip, offset, type Placement, shift, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../../ThemeProvider";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";
import { springPresets, useTranslate } from "../spring";
import { tooltipNumberFormatter } from "./utils";

export interface TooltipItem {
  name: string;
  /** Numbers go through the compact tooltip formatter; strings render as-is
   * (e.g. the heatmap's "No value" for empty cells). */
  value: number | string;
  color: string;
}

interface ChartTooltipProps {
  label: string;
  items: TooltipItem[];
  viewportPosition: { x: number; y: number };
  className?: string;
  /**
   * Floating UI placement of the panel relative to `viewportPosition`.
   * Defaults to `'right-start'` — the behavior every other chart relies on.
   * SegmentedBar passes `'top'` to float the panel above the hovered segment.
   */
  placement?: Placement;
}

function ChartTooltipRender({
  label,
  items,
  viewportPosition,
  className,
  placement = "right-start",
}: ChartTooltipProps) {
  const { portalThemeClassName } = useTheme();

  const virtualEl = useMemo(
    () => ({
      getBoundingClientRect: () => ({
        x: viewportPosition.x,
        y: viewportPosition.y,
        width: 0,
        height: 0,
        top: viewportPosition.y,
        left: viewportPosition.x,
        right: viewportPosition.x,
        bottom: viewportPosition.y,
      }),
    }),
    [viewportPosition.x, viewportPosition.y],
  );

  // Floating UI still does the smart positioning (offset / flip / shift); we just
  // spring the panel toward its computed (x, y) instead of snapping there.
  const { x, y, strategy, refs, isPositioned } = useFloating({
    placement,
    middleware: [offset(20), flip(), shift({ padding: 8 })],
    elements: { reference: virtualEl },
  });

  const follow = useTranslate(springPresets.tooltip);
  const seeded = useRef(false);

  // Conditionally mounted (only while hovering), so plain useLayoutEffect is safe
  // — this never renders on the server. Jump into place on first position, then
  // soft-follow. (Mounts/unmounts per hover; the lag is within a hover session.)
  // `follow` is a ref-backed stable handle (see useTranslate) — listing it
  // satisfies exhaustive-deps without ever re-running the effect for it.
  useLayoutEffect(() => {
    if (!isPositioned) return;
    if (seeded.current) {
      follow.to(x, y);
    } else {
      follow.jump(x, y);
      seeded.current = true;
    }
  }, [x, y, isPositioned, follow]);

  // Compose Floating UI's ref (it measures the panel) with the spring's ref (it
  // writes the transform). Both objects are stable (Floating UI memoizes
  // `refs`; `follow` is ref-backed), so this callback identity is stable too.
  const setFloatingRef = useCallback(
    (el: HTMLDivElement | null) => {
      refs.setFloating(el);
      follow.bind(el);
    },
    [refs, follow],
  );

  const isGreaterThanTen = items.length > 10;
  const remainingItems = isGreaterThanTen ? items.length - 5 : 0;
  const displayItems = isGreaterThanTen ? items.slice(0, 5) : items;
  const isTwoItemsLayout = items.length <= 2;

  return createPortal(
    <div
      ref={setFloatingRef}
      className={clsx(`${CHART_CLASS_PREFIX}-portal-tooltip`, portalThemeClassName)}
      // position/top/left from Floating UI; transform is spring-driven; fade in
      // once positioned so it never flashes at the origin.
      style={{
        position: strategy,
        top: 0,
        left: 0,
        opacity: isPositioned ? 1 : 0,
        transition: "opacity 0.12s ease",
      }}
    >
      <div className={clsx(`${CHART_CLASS_PREFIX}-chart-tooltip`, className)}>
        <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-label`}>{label}</div>
        <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-item-separator`} />
        <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content`}>
          {displayItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={clsx(
                `${CHART_CLASS_PREFIX}-chart-tooltip-content-item`,
                !isTwoItemsLayout && `${CHART_CLASS_PREFIX}-chart-tooltip-content-item--dot`,
              )}
            >
              <div
                className={clsx(
                  `${CHART_CLASS_PREFIX}-chart-tooltip-content-indicator`,
                  `${CHART_CLASS_PREFIX}-chart-tooltip-content-indicator--dot`,
                  isTwoItemsLayout &&
                    `${CHART_CLASS_PREFIX}-chart-tooltip-content-indicator--two-items`,
                )}
                style={
                  {
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties
                }
              />
              <div
                className={clsx(
                  `${CHART_CLASS_PREFIX}-chart-tooltip-content-value-wrapper`,
                  isTwoItemsLayout &&
                    `${CHART_CLASS_PREFIX}-chart-tooltip-content-value-wrapper--vertical`,
                  `${CHART_CLASS_PREFIX}-chart-tooltip-content-value-wrapper--standard`,
                )}
              >
                <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-label`}>
                  <span>{item.name}</span>
                </div>
                <span className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-value`}>
                  {typeof item.value === "number" ? tooltipNumberFormatter(item.value) : item.value}
                </span>
              </div>
              <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-item-separator`} />
            </div>
          ))}
        </div>
        {isGreaterThanTen && (
          <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-item-separator`} />
        )}
        {isGreaterThanTen && (
          <div className={`${CHART_CLASS_PREFIX}-chart-tooltip-content-view-more`}>
            Click to view all {remainingItems}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export const ChartTooltip = memo(ChartTooltipRender);
ChartTooltip.displayName = "ChartTooltip";
