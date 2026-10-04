"use client";

import { useCallback, useState, type KeyboardEvent, type MouseEvent } from "react";

/**
 * Props the hook hands to each accordion row. This is the EXACT attribute set
 * the three home sections (Cloud / FeatureGrid / Steps) emit by hand today, so
 * spreading it onto a row produces byte-identical DOM:
 *   data-open: `true` when open, `undefined` (attribute absent) when closed.
 */
export interface AccordionToggleProps {
  "data-open": true | undefined;
  role: "button";
  tabIndex: 0;
  "aria-expanded": boolean;
  onClick: (event: MouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export interface UseSingleOpenAccordion {
  /** Index of the currently open row, or null when all are collapsed. */
  openIndex: number | null;
  /** Whether the row at `index` is currently open. */
  isOpen: (index: number) => boolean;
  /** Attribute bag to spread onto the row element at `index`. */
  getToggleProps: (index: number) => AccordionToggleProps;
}

/**
 * Single-open accordion behavior shared by the MOBILE-only expand/collapse rows
 * in CloudSection, FeatureGridSection, and StepsSection. All rows are collapsed
 * by default; opening one collapses any other; tapping the open row collapses it.
 *
 * The hook owns NO markup, NO classes, and NO CSS — every accordion style lives
 * per-section in each *.module.css. It only centralizes the identical JS the
 * three sections used to hand-roll. Desktop is unaffected: the desktop grids
 * never read [data-open], and getToggleProps emits the same attributes already
 * on the DOM today.
 */
export function useSingleOpenAccordion(): UseSingleOpenAccordion {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const isOpen = useCallback((index: number) => openIndex === index, [openIndex]);

  const getToggleProps = useCallback(
    (index: number): AccordionToggleProps => {
      const open = openIndex === index;
      const toggle = () => setOpenIndex(open ? null : index);
      return {
        "data-open": open || undefined,
        role: "button",
        tabIndex: 0,
        "aria-expanded": open,
        onClick: (event: MouseEvent) => {
          // Embedded links keep their own navigation and must not collapse the row.
          if (
            event.target instanceof Element &&
            event.target.closest("a, button, input, select, textarea")
          ) {
            return;
          }
          toggle();
        },
        onKeyDown: (event: KeyboardEvent) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        },
      };
    },
    [openIndex],
  );

  return { openIndex, isOpen, getToggleProps };
}
