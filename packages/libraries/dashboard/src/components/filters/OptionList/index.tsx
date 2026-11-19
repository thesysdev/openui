"use client";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/* ---------- Menu primitives shared by the dropdown filters ---------- */

export const Check = () => (
  <svg className="openui-dashboard-menu-check" viewBox="0 0 12 12" aria-hidden>
    <path
      d="M2.5 6.4 5 8.8l4.5-5.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Arrow keys walk the menu's options, wrapping at the ends. */
export function menuNav(event: ReactKeyboardEvent) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const items = [
    ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="option"]'),
  ];
  if (!items.length) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
}
