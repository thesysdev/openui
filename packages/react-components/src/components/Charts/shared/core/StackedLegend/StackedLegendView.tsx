"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../../../Button";
import { IconButton } from "../../../../IconButton";
import { Separator } from "../../../../Separator";
import type { StackedLegendItem } from "../legend/types";
import { names, stackedLegendStyles } from "./stackedLegend.styles";
import {
  formatStackedValue,
  LEGEND_ITEM_LIMIT,
  resolveStackedLegendLayout,
  type StackedLegendLayout,
} from "./stackedLegendLayout";

/** Fallback scroll step: a row's height in stackedLegend.scss. */
const ITEM_HEIGHT = 32;

export interface StackedLegendViewProps {
  items: StackedLegendItem[];
  format?: "percentage" | "number";
  activeKey?: string | null;
  hiddenKeys?: Set<string>;
  onItemHover?: (key: string | null) => void;
  onItemToggle?: (key: string) => void;
  layout?: StackedLegendLayout;
  containerWidth?: number;
  showTitle?: boolean;
  separator?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StackedLegendView = ({
  items,
  format = "percentage",
  activeKey,
  hiddenKeys,
  onItemHover,
  onItemToggle,
  layout = "auto",
  containerWidth,
  separator = false,
  showTitle = true,
  className,
  style,
}: StackedLegendViewProps) => {
  const styles = stackedLegendStyles;
  const listRef = useRef<HTMLDivElement>(null);
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const { isShowMore, isScrollable } = resolveStackedLegendLayout(
    layout,
    containerWidth,
    items.length,
  );

  useEffect(() => {
    if (isShowMore) {
      setShowUpButton(false);
      setShowDownButton(false);
      return;
    }
    const el = listRef.current;
    const checkScroll = () => {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      setIsOverflowing(scrollHeight > clientHeight);
      setShowUpButton(scrollTop > 0);
      setShowDownButton(scrollTop < scrollHeight - clientHeight - 1);
    };
    checkScroll();
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [isShowMore, items.length]);

  // One row per click, measured so the step always matches the rendered rows.
  const scrollBy = (dir: 1 | -1) => {
    const list = listRef.current;
    const rowHeight = list?.firstElementChild?.getBoundingClientRect().height || ITEM_HEIGHT;
    list?.scrollBy({ top: dir * rowHeight, behavior: "smooth" });
  };

  // Re-normalize percentages over the VISIBLE set so visible rows match the
  // (re-normalized) wedges. Hidden rows are dimmed; their % over the visible
  // total is informational.
  const total = items
    .filter((it) => !hiddenKeys?.has(it.key))
    .reduce((sum, it) => sum + it.value, 0);
  const itemsToDisplay = isShowMore && !showAll ? items.slice(0, LEGEND_ITEM_LIMIT) : items;
  // Overflow alone decides the scroll affordance: the scrollbar is CSS-hidden,
  // so even a short (≤ LEGEND_ITEM_LIMIT) list that overflows its container
  // needs the buttons. (The show-more path is gated separately on `isShowMore`.)
  const showScrollControls = isScrollable && isOverflowing;

  return (
    <div
      className={clsx(styles.root, names.root, className)}
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
        ...style,
      }}
    >
      {showScrollControls && (
        <div className={clsx(styles.header, names.header)}>
          {showTitle && (
            <div className={clsx(styles.headerTitle, names.headerTitle)}>{items.length} labels</div>
          )}
          <div className={clsx(styles.headerButtons, names.headerButtons)}>
            <IconButton
              className={clsx(styles.scrollButton, names.scrollButton)}
              onClick={() => scrollBy(-1)}
              aria-label="Scroll legend up"
              icon={<ChevronUp />}
              variant="secondary"
              size="extra-small"
              disabled={!showUpButton}
            />
            <IconButton
              className={clsx(styles.scrollButton, names.scrollButton)}
              onClick={() => scrollBy(1)}
              aria-label="Scroll legend down"
              icon={<ChevronDown />}
              variant="secondary"
              size="extra-small"
              disabled={!showDownButton}
            />
          </div>
        </div>
      )}

      <div ref={listRef} className={clsx(styles.list, names.list)}>
        {itemsToDisplay.map((item, index) => {
          const isHidden = hiddenKeys?.has(item.key);
          return (
            <React.Fragment key={item.key}>
              <div
                className={clsx(styles.item, names.item)}
                data-state={activeKey === item.key ? "active" : undefined}
                data-clickable={onItemToggle ? "" : undefined}
                style={
                  {
                    "--_openui-stacked-legend-item-opacity": isHidden ? 0.3 : 1,
                  } as React.CSSProperties
                }
                onMouseEnter={() => onItemHover?.(item.key)}
                onMouseLeave={() => onItemHover?.(null)}
                onClick={onItemToggle ? () => onItemToggle(item.key) : undefined}
              >
                <div className={clsx(styles.label, names.label)}>
                  <div className={clsx(styles.colorContainer, names.colorContainer)}>
                    <div
                      className={clsx(styles.color, names.color)}
                      style={
                        { "--_openui-stacked-legend-item-color": item.color } as React.CSSProperties
                      }
                    />
                  </div>
                  <div className={clsx(styles.labelText, names.labelText)}>{item.label}</div>
                </div>
                <div className={clsx(styles.value, names.value)}>
                  {formatStackedValue(item.value, total, format)}
                </div>
              </div>
              {index !== itemsToDisplay.length - 1 && separator && (
                <Separator className={clsx(styles.separator, names.separator)} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {isShowMore && items.length > LEGEND_ITEM_LIMIT && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowAll((v) => !v)}
          className={clsx(styles.showMore, names.showMore)}
        >
          {showAll ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
};
