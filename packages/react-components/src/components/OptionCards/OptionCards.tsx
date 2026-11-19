"use client";

import clsx from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { getRowConfiguration } from "../_shared/cards/smallCardBlockUtils";
import { names, optionCardsStyles } from "./optionCards.styles";

export type OptionCardsSelectionType = "single" | "multiple";

export interface OptionCardsItem {
  value: string;
  /** Inline markdown supported. */
  title: string;
  /** Inline markdown supported. */
  subtitle?: string;
  topContent?: ReactNode;
  /** Controls the top slot sizing: a small icon tile or a larger image tile. */
  topContentVariant?: "icon" | "image";
  disabled?: boolean;
}

export interface OptionCardsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onToggle"> {
  items: OptionCardsItem[];
  /** Currently selected item values. */
  selected?: string[];
  type?: OptionCardsSelectionType;
  /** Disables every card (e.g. while streaming). */
  disabled?: boolean;
  onToggle?: (value: string) => void;
  className?: string;
}

const OptionCards = forwardRef<HTMLDivElement, OptionCardsProps>((props, ref) => {
  const styles = optionCardsStyles;
  const {
    items,
    selected = [],
    type = "single",
    disabled = false,
    onToggle,
    className,
    ...rest
  } = props;

  // Items without a value have no stable identity to select or toggle by.
  const renderableItems = (items ?? []).filter((item) => Boolean(item?.value));
  const rowConfiguration = getRowConfiguration(renderableItems.length, 3);
  let cardIndex = 0;

  return (
    <div
      ref={ref}
      className={clsx(styles.root, names.root, className)}
      role={type === "single" ? "radiogroup" : "group"}
      {...rest}
    >
      <div className={clsx(names.grid, styles.grid)}>
        {rowConfiguration.map((itemsInRow, rowIndex) => {
          const rowItems = renderableItems.slice(cardIndex, cardIndex + itemsInRow);
          cardIndex += itemsInRow;

          return (
            <div
              key={`option-cards-row-${rowIndex}`}
              className={clsx(names.row, styles.row)}
              data-columns={itemsInRow}
            >
              {rowItems.map((item, columnIndex) => {
                const isSelected = selected.includes(item.value);
                const isDisabled = disabled || item.disabled === true;
                const hasTopContent = item.topContent != null;
                const topVariant = item.topContentVariant ?? "icon";

                return (
                  <div
                    key={item.value}
                    className={clsx(names.item, styles.item)}
                    data-span={
                      renderableItems.length % 2 === 1 &&
                      rowIndex === rowConfiguration.length - 1 &&
                      columnIndex === rowItems.length - 1
                        ? "full"
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      role={type === "single" ? "radio" : "checkbox"}
                      aria-checked={isSelected}
                      disabled={isDisabled}
                      className={clsx(names.card, styles.card)}
                      onClick={() => onToggle?.(item.value)}
                    >
                      <div className={clsx(names.content, styles.content)}>
                        {hasTopContent ? (
                          <div
                            className={clsx(
                              names.top,
                              styles.top,
                              names.topContentVariant[topVariant],
                              styles.topContentVariant[topVariant],
                            )}
                          >
                            {item.topContent}
                          </div>
                        ) : null}
                        <div className={clsx(names.text, styles.text)}>
                          <div className={clsx(names.title, styles.title)}>
                            <InlineMarkdownRenderer content={item.title} />
                          </div>
                          {item.subtitle ? (
                            <div className={clsx(names.subtitle, styles.subtitle)}>
                              <InlineMarkdownRenderer content={item.subtitle} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

OptionCards.displayName = "OptionCards";

export { OptionCards };
