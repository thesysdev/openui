import clsx from "clsx";
import {
  forwardRef,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { getRowConfiguration, useCarouselMask } from "./smallCardBlockUtils";

export type CardBlockLayoutVariant = "grid" | "carousel";
export type CardBlockSize = "small" | "medium";

export interface CardBlockLayoutProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Picks the `openui-small-card-block` / `openui-medium-card-block` class family. */
  size: CardBlockSize;
  /** Appended as `openui-<size>-card-block--<cardType>` and exposed as `data-card-type`. */
  cardType: string;
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
  const base = `openui-${size}-card-block`;
  const count = safeItems.length;

  const gapStyle = gap
    ? ({
        [`--openui-${size}-card-gap`]: typeof gap === "number" ? `${gap}px` : gap,
      } as CSSProperties)
    : undefined;

  const renderCell = (item: T, index: number) => (
    <div
      key={itemKey?.(item, index) ?? `${cardType}-${index}`}
      className={layout === "carousel" ? `${base}__carousel-item` : `${base}__item`}
    >
      {renderItem(item, index)}
    </div>
  );

  let rowStartIndex = 0;

  return (
    <div
      ref={ref}
      className={clsx(base, `${base}--${cardType}`, `${base}--${layout}`, className)}
      data-card-type={cardType}
      data-layout={layout}
      data-count={count}
      style={{ ...gapStyle, ...style }}
      {...rest}
    >
      {layout === "carousel" ? (
        <div
          ref={scrollRef}
          className={clsx(
            `${base}__carousel`,
            responsive && `${base}__carousel--responsive`,
            maskLeft && `${base}__carousel--mask-left`,
            maskRight && `${base}__carousel--mask-right`,
          )}
        >
          <div className={`${base}__carousel-track`}>
            {safeItems.map((item, index) => renderCell(item, index))}
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            `${base}__grid`,
            responsive && `${base}__grid--responsive`,
            responsive && count % 2 === 1 && `${base}__grid--odd-count`,
          )}
        >
          {getRowConfiguration(count, maxPerRow).map((itemsInRow, rowIndex) => {
            const currentRowStartIndex = rowStartIndex;
            rowStartIndex += itemsInRow;

            return (
              <div
                key={`${cardType}-row-${rowIndex}`}
                className={clsx(`${base}__row`, `${base}__row--${itemsInRow}`)}
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
