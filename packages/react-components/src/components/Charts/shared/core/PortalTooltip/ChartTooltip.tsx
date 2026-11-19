"use client";

import { flip, offset, type Placement, shift, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../../ThemeProvider";
import { springPresets, useTranslate } from "../spring";
import { names, portalTooltipStyles } from "./portalTooltip.styles";
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
  const styles = portalTooltipStyles;
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
      className={clsx(styles.portal, names.portal, portalThemeClassName)}
      // The spring writes the positioning transform; appearance remains class-overridable.
      data-positioned={isPositioned ? "" : undefined}
      style={{ "--_openui-chart-tooltip-position": strategy } as React.CSSProperties}
    >
      <div className={clsx(styles.root, names.root, className)}>
        <div className={clsx(styles.label, names.label)}>{label}</div>
        <div className={clsx(styles.separator, names.separator)} />
        <div className={clsx(styles.content, names.content)}>
          {displayItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={clsx(styles.item, names.item)}
              data-layout={isTwoItemsLayout ? "two-items" : "multiple"}
            >
              <div
                className={clsx(styles.indicator, names.indicator)}
                data-layout={isTwoItemsLayout ? "two-items" : "multiple"}
                style={
                  {
                    "--_openui-chart-tooltip-indicator-color": item.color,
                  } as React.CSSProperties
                }
              />
              <div
                className={clsx(styles.valueWrapper, names.valueWrapper)}
                data-layout={isTwoItemsLayout ? "two-items" : "multiple"}
              >
                <div className={clsx(styles.contentLabel, names.contentLabel)}>
                  <span className={clsx(styles.labelText, names.labelText)}>{item.name}</span>
                </div>
                <span className={clsx(styles.value, names.value)}>
                  {typeof item.value === "number" ? tooltipNumberFormatter(item.value) : item.value}
                </span>
              </div>
              <div
                className={clsx(styles.separator, names.separator)}
                data-last={index === displayItems.length - 1 ? "" : undefined}
              />
            </div>
          ))}
        </div>
        {isGreaterThanTen && <div className={clsx(styles.separator, names.separator)} />}
        {isGreaterThanTen && (
          <div className={clsx(styles.viewMore, names.viewMore)}>
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
