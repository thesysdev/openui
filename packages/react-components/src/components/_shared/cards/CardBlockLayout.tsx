"use client";

import clsx from "clsx";
import {
  forwardRef,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cardBlockLayoutStyles, names } from "./cardBlockLayout.styles";
import { getRowConfiguration, useCarouselMask } from "./smallCardBlockUtils";

export type CardBlockLayoutVariant = "grid" | "carousel";
export type CardBlockSize = "small" | "medium";

export interface CardBlockLayoutProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Card sizing preset. */
  size: CardBlockSize;
  /** Card family, exposed as `data-card-type`. */
  cardType: keyof typeof names.cardType;
  items: T[];
  layout?: CardBlockLayoutVariant;
  responsive?: boolean;
  maxPerRow: 2 | 3;
  /** Overrides the CSS gap variable (numbers are treated as px). */
  gap?: number | string;
  /** Renders one card; the layout wraps it in the item/carousel-item cell. */
  renderItem: (item: T, index: number) => ReactNode;
  itemKey?: (item: T, index: number) => string;
}

/** Shared grid/carousel scaffolding for the small and medium card blocks. */
function CardBlockLayoutInner<T>(
  props: CardBlockLayoutProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const styles = cardBlockLayoutStyles;
  const {
    size,
    cardType,
    items,
    layout = "grid",
    responsive = true,
    maxPerRow,
    gap,
    renderItem,
    itemKey,
    className,
    style,
    ...rest
  } = props;
  const { scrollRef, maskLeft, maskRight } = useCarouselMask();
  const safeItems = items ?? [];

  const count = safeItems.length;

  const gapStyle = gap
    ? ({
        "--_openui-card-block-layout-gap-input": typeof gap === "number" ? `${gap}px` : gap,
      } as CSSProperties)
    : undefined;

  const renderCell = (item: T, index: number) => (
    <div
      key={itemKey?.(item, index) ?? `${cardType}-${index}`}
      className={
        layout === "carousel"
          ? clsx(names.carouselItem, styles.carouselItem)
          : clsx(names.item, styles.item)
      }
      data-span={count % 2 === 1 && index === count - 1 ? "full" : undefined}
    >
      {renderItem(item, index)}
    </div>
  );

  let rowStartIndex = 0;

  return (
    <div
      ref={ref}
      className={clsx(
        names.root,
        styles.root,
        names.size[size],
        styles.size[size],
        names.layout[layout],
        styles.layout[layout],
        names.cardType[cardType],
        styles.cardType[cardType],
        responsive && [names.responsive.true, styles.responsive.true],
        className,
      )}
      data-card-type={cardType}
      data-layout={layout}
      data-count={count}
      style={{ ...gapStyle, ...style }}
      {...rest}
    >
      {layout === "carousel" ? (
        <div
          ref={scrollRef}
          className={clsx(names.carousel, styles.carousel)}
          data-mask={maskLeft ? (maskRight ? "both" : "left") : maskRight ? "right" : "none"}
        >
          <div className={clsx(names.track, styles.track)}>
            {safeItems.map((item, index) => renderCell(item, index))}
          </div>
        </div>
      ) : (
        <div className={clsx(names.grid, styles.grid)}>
          {getRowConfiguration(count, maxPerRow).map((itemsInRow, rowIndex) => {
            const currentRowStartIndex = rowStartIndex;
            rowStartIndex += itemsInRow;

            return (
              <div
                key={`${cardType}-row-${rowIndex}`}
                className={clsx(names.row, styles.row)}
                data-columns={itemsInRow}
              >
                {safeItems
                  .slice(currentRowStartIndex, currentRowStartIndex + itemsInRow)
                  .map((item, columnIndex) => renderCell(item, currentRowStartIndex + columnIndex))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const CardBlockLayout = forwardRef(CardBlockLayoutInner) as <T>(
  props: CardBlockLayoutProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactNode;

/** Enter/Space keyboard activation for card-like `role="button"` divs. */
export function cardKeyDownHandler(onActivate: () => void) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate();
  };
}
