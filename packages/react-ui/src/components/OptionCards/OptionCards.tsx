import clsx from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";
import { getRowConfiguration } from "../_shared/cards/smallCardBlockUtils";
import { SelectionCheck } from "./SelectionCheck";

export type OptionCardsSelectionType = "single" | "multiple";

export interface OptionCardsItem {
  value: string;
  /** Inline markdown supported. */
  title: string;
  /** A string (inline markdown supported) or composed nodes. */
  subtitle?: ReactNode;
  /** Icon, Avatar, Emoji or Image shown above the title. */
  leading?: ReactNode;
  /** Controls the leading slot sizing: a round icon tile or a larger image tile. */
  leadingVariant?: "icon" | "image";
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
      className={clsx("openui-option-cards", className)}
      role={type === "single" ? "radiogroup" : "group"}
      {...rest}
    >
      <div
        className={clsx(
          "openui-option-cards__grid",
          "openui-option-cards__grid--responsive",
          renderableItems.length % 2 === 1 && "openui-option-cards__grid--odd-count",
        )}
      >
        {rowConfiguration.map((itemsInRow, rowIndex) => {
          const rowItems = renderableItems.slice(cardIndex, cardIndex + itemsInRow);
          cardIndex += itemsInRow;

          return (
            <div
              key={`option-cards-row-${rowIndex}`}
              className={clsx(
                "openui-option-cards__row",
                `openui-option-cards__row--${itemsInRow}`,
              )}
            >
              {rowItems.map((item) => {
                const isSelected = selected.includes(item.value);
                const isDisabled = disabled || item.disabled === true;
                const hasLeading = item.leading != null;
                const leadingVariant = item.leadingVariant ?? "icon";

                return (
                  <div key={item.value} className="openui-option-cards__item">
                    <button
                      type="button"
                      role={type === "single" ? "radio" : "checkbox"}
                      aria-checked={isSelected}
                      disabled={isDisabled}
                      className={clsx(
                        "openui-option-card",
                        isSelected && "openui-option-card--selected",
                        isDisabled && "openui-option-card--disabled",
                      )}
                      onClick={() => onToggle?.(item.value)}
                    >
                      <SelectionCheck checked={isSelected} className="openui-option-card__check" />
                      <div className="openui-option-card__content">
                        {hasLeading ? (
                          <div
                            className={clsx(
                              "openui-option-card__leading",
                              `openui-option-card__leading--${leadingVariant}`,
                            )}
                          >
                            {item.leading}
                          </div>
                        ) : null}
                        <div className="openui-option-card__text">
                          <div className="openui-option-card__title">
                            <InlineMarkdownRenderer content={item.title} />
                          </div>
                          {item.subtitle ? (
                            <div className="openui-option-card__subtitle">
                              {typeof item.subtitle === "string" ? (
                                <InlineMarkdownRenderer content={item.subtitle} />
                              ) : (
                                item.subtitle
                              )}
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
