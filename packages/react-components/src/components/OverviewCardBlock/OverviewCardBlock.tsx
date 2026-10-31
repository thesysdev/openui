"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { CardBlockLayout, cardKeyDownHandler } from "../_shared/cards/CardBlockLayout";
import { MetricIndicatorInline, type MetricIndicatorInlineProps } from "../MetricIndicator";
import { names, overviewCardBlockStyles } from "./overviewCardBlock.styles";

export type OverviewCardBlockLayout = "grid" | "carousel";

export interface OverviewCardBlockItem {
  id?: string;
  /** Top slot content (typically an IconText / ImageText / Text). */
  top?: ReactNode;
  /** Bottom metric rendered with MetricIndicatorInline. */
  bottom?: Omit<MetricIndicatorInlineProps, "className">;
}

export interface OverviewCardBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  items: OverviewCardBlockItem[];
  layout?: OverviewCardBlockLayout;
  /** Collapses the grid / shrinks carousel cards on narrow containers. */
  responsive?: boolean;
  /** Overrides the gap between cards (px number or any CSS length). */
  gap?: number | string;
  /** Renders the cards as buttons and fires `onItemClick`. */
  clickable?: boolean;
  onItemClick?: (item: OverviewCardBlockItem, index: number) => void;
  className?: string;
}

const OverviewCardBlock = forwardRef<HTMLDivElement, OverviewCardBlockProps>((props, ref) => {
  const styles = overviewCardBlockStyles;
  const {
    items,
    layout = "grid",
    responsive = true,
    gap,
    clickable = false,
    onItemClick,
    className,
    ...rest
  } = props;

  const isClickable = clickable && Boolean(onItemClick);

  return (
    <CardBlockLayout
      ref={ref}
      size="small"
      cardType="overview-card"
      data-card-type="OverviewCard"
      items={items ?? []}
      layout={layout}
      responsive={responsive}
      maxPerRow={3}
      gap={gap}
      className={clsx(names.root, className)}
      itemKey={(item, index) => item.id ?? `overview-card-${index}`}
      renderItem={(item, index) => (
        <div
          className={clsx(
            styles.card,
            names.card,
            isClickable && [styles.clickable.true, names.clickable.true],
          )}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onClick={isClickable ? () => onItemClick?.(item, index) : undefined}
          onKeyDown={isClickable ? cardKeyDownHandler(() => onItemClick?.(item, index)) : undefined}
        >
          <div className={clsx(names.vertical, styles.vertical)}>
            <div className={clsx(names.topRow, styles.topRow)}>
              {item.top != null && <div className={clsx(names.top, styles.top)}>{item.top}</div>}
              {isClickable && (
                <div className={clsx(names.chevron, styles.chevron)} aria-hidden="true">
                  <ChevronRight size={14} className={clsx(names.chevronIcon, styles.chevronIcon)} />
                </div>
              )}
            </div>
            {item.bottom && (
              <div className={clsx(names.bottom, styles.bottom)}>
                <MetricIndicatorInline {...item.bottom} />
              </div>
            )}
          </div>
        </div>
      )}
      {...rest}
    />
  );
});

OverviewCardBlock.displayName = "OverviewCardBlock";

export { OverviewCardBlock };
