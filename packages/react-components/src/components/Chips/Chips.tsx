"use client";

import clsx from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { chipsStyles, names } from "./chips.styles";

export type ChipsSelectionType = "single" | "multiple";

export interface ChipsItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ChipsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onToggle"> {
  items: ChipsItem[];
  /** Currently selected item values. */
  selected?: string[];
  type?: ChipsSelectionType;
  /** Disables every chip (e.g. while streaming). */
  disabled?: boolean;
  onToggle?: (value: string) => void;
  className?: string;
}

const Chips = forwardRef<HTMLDivElement, ChipsProps>((props, ref) => {
  const {
    items,
    selected = [],
    type = "multiple",
    disabled = false,
    onToggle,
    className,
    ...rest
  } = props;

  const styles = chipsStyles;

  // Items without a value have no stable identity to select or toggle by.
  const renderableItems = (items ?? []).filter((item) => Boolean(item?.value));

  return (
    <div
      ref={ref}
      className={clsx(styles.root, names.root, className)}
      role="listbox"
      aria-multiselectable={type === "multiple"}
      {...rest}
    >
      {renderableItems.map((item) => {
        const isSelected = selected.includes(item.value);
        const isDisabled = disabled || item.disabled === true;

        return (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={isDisabled}
            className={clsx(styles.item, names.item)}
            onClick={() => onToggle?.(item.value)}
          >
            {item.icon ? <span className={clsx(styles.icon, names.icon)}>{item.icon}</span> : null}
            <span className={clsx(styles.text, names.text)}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
});

Chips.displayName = "Chips";

export { Chips };
