import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../../../Button";
import { IconButton } from "../../../../IconButton";
import { Separator } from "../../../../Separator";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";
import type { StackedLegendItem } from "../legend/types";
import {
  formatStackedValue,
  LEGEND_ITEM_LIMIT,
  resolveStackedLegendLayout,
  type StackedLegendLayout,
} from "./stackedLegendLayout";

const ITEM_HEIGHT = 36;
const ITEM_GAP = 2;

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

  const scrollBy = (dir: 1 | -1) =>
    listRef.current?.scrollBy({
      top: dir * (ITEM_HEIGHT + ITEM_GAP),
      behavior: "smooth",
    });

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
      className={clsx(`${CHART_CLASS_PREFIX}-stacked-legend-container`, className)}
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
        ...style,
      }}
    >
      {showScrollControls && (
        <div className={`${CHART_CLASS_PREFIX}-stacked-legend-header`}>
          {showTitle && (
            <div className={`${CHART_CLASS_PREFIX}-stacked-legend-header-title`}>
              {items.length} labels
            </div>
          )}
          <div className={`${CHART_CLASS_PREFIX}-stacked-legend-header-buttons`}>
            <IconButton
              className={`${CHART_CLASS_PREFIX}-stacked-legend-scroll-button`}
              onClick={() => scrollBy(-1)}
              aria-label="Scroll legend up"
              icon={<ChevronUp />}
              variant="secondary"
              size="extra-small"
              disabled={!showUpButton}
            />
            <IconButton
              className={`${CHART_CLASS_PREFIX}-stacked-legend-scroll-button`}
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

      <div ref={listRef} className={`${CHART_CLASS_PREFIX}-stacked-legend`}>
        {itemsToDisplay.map((item, index) => {
          const isHidden = hiddenKeys?.has(item.key);
          return (
            <React.Fragment key={item.key}>
              <div
                className={clsx(`${CHART_CLASS_PREFIX}-stacked-legend__item`, {
                  [`${CHART_CLASS_PREFIX}-stacked-legend__item--active`]: activeKey === item.key,
                })}
                style={{
                  opacity: isHidden ? 0.3 : 1,
                  cursor: onItemToggle ? "pointer" : undefined,
                }}
                onMouseEnter={() => onItemHover?.(item.key)}
                onMouseLeave={() => onItemHover?.(null)}
                onClick={onItemToggle ? () => onItemToggle(item.key) : undefined}
              >
                <div className={`${CHART_CLASS_PREFIX}-stacked-legend__item-label`}>
                  <div className={`${CHART_CLASS_PREFIX}-stacked-legend__item-color-container`}>
                    <div
                      className={`${CHART_CLASS_PREFIX}-stacked-legend__item-color`}
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <div className={`${CHART_CLASS_PREFIX}-stacked-legend__item-label-text`}>
                    {item.label}
                  </div>
                </div>
                <div className={`${CHART_CLASS_PREFIX}-stacked-legend__item-value`}>
                  {formatStackedValue(item.value, total, format)}
                </div>
              </div>
              {index !== itemsToDisplay.length - 1 && separator && (
                <Separator className={`${CHART_CLASS_PREFIX}-stacked-legend-separator`} />
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
          className={`${CHART_CLASS_PREFIX}-stacked-legend-show-more-button`}
        >
          {showAll ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
};
