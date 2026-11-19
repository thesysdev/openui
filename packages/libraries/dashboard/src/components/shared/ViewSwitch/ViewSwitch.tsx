"use client";

import { useContext, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { CardSlotContext } from "../../../shared/cardSlot";

export type ViewSwitchProps<T extends string> = {
  label: string;
  /** A short muted word before the switch, e.g. "Show" or "Rates", as filters prefix their label. */
  prefix?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Single-choice pills behave as a radio group: one Tab stop (the chosen
 * option), arrow keys and Home/End move the choice and focus with it.
 */
export function radioKeys<T extends string>(
  event: ReactKeyboardEvent,
  list: { value: T }[],
  current: T | undefined,
  choose: (value: T) => void,
) {
  const step = (
    { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>
  )[event.key];
  if (!step && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  if (!list.length) return;
  const index = Math.max(
    0,
    list.findIndex((option) => option.value === current),
  );
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? list.length - 1
        : (index + (step ?? 0) + list.length) % list.length;
  choose(list[next]!.value);
  event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
}

/**
 * A small segmented switch inside a chart, for two ways of reading the same numbers
 * (a funnel's step-to-step rates or its rates from the start; a cohort's percent or its people).
 * The kit's segmented control at the small size; arrow keys move the choice.
 */
export function ViewSwitch<T extends string>({
  label,
  prefix,
  options,
  value,
  onChange,
}: ViewSwitchProps<T>) {
  const slot = useContext(CardSlotContext);
  const segmented = (
    <div
      className="openui-dashboard-segmented openui-dashboard-segmented-sm"
      role="radiogroup"
      aria-label={label}
      onKeyDown={(event) => radioKeys(event, options, value, onChange)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
  const control = prefix ? (
    <div className="openui-dashboard-view-switch">
      <span className="openui-dashboard-view-label" aria-hidden>
        {prefix}
      </span>
      {segmented}
    </div>
  ) : (
    segmented
  );
  // In a Card, the switch goes to the header's top right, with any filters the card has;
  // anywhere else it takes the chart's own top row.
  return slot ? (
    createPortal(control, slot)
  ) : (
    <div className="openui-dashboard-chart-top">{control}</div>
  );
}
