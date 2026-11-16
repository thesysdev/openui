/** Content on a model-chosen raw colour, which doesn't follow the theme. */
import type { CSSProperties } from "react";
import { isColorToken } from "./props";

/**
 * Text color for a model-chosen CSS color background (hex or rgb). Raw colors
 * do not follow the theme, so text on them is set dark or light to stay legible.
 */
function contrastOn(background: unknown): string | undefined {
  if (typeof background !== "string" || isColorToken(background)) return undefined;
  let rgb: number[] | null = null;
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(background.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else {
    const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(background.trim());
    if (m) rgb = [m[1], m[2], m[3]].map(Number);
  }
  if (!rgb) return undefined;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36 ? "#0d0d0d" : "#ffffff";
}

/** A selected tile's tick, drawn in the color that sits on ink: white on dark ink, dark on light. */
const tick = (stroke: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='${stroke}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6.2l2.3 2.3 4.7-5'/%3E%3C/svg%3E")`;

/** The selected tile's tick on the page's ink: white on light mode's dark ink, dark on dark mode's. */
export const checkIcon = (mode: "light" | "dark") => tick(mode === "dark" ? "%23171717" : "white");

/**
 * Style for content on a raw-color background: text tokens switch to the readable color. What sits on
 * ink (a solid button's label, a selected tile's tick) switches with it, or it would keep the page
 * theme's color and vanish: dark on dark in dark mode.
 */
export function onColor(background: unknown): CSSProperties {
  const ink = contrastOn(background);
  if (!ink) return {};
  const darkInk = ink !== "#ffffff";
  return {
    color: ink,
    "--openui-intelligent-ink": ink,
    "--openui-intelligent-muted": `color-mix(in srgb, ${ink} 72%, transparent)`,
    "--openui-intelligent-faint": `color-mix(in srgb, ${ink} 55%, transparent)`,
    // react-components' parts inside (a field, a chart) read these, so they switch too.
    "--openui-text-neutral-primary": ink,
    "--openui-text-neutral-secondary": `color-mix(in srgb, ${ink} 72%, transparent)`,
    "--openui-intelligent-on-ink": darkInk ? "#ffffff" : "#0d0d0d",
    "--_openui-intelligent-pressable-check-icon": tick(darkInk ? "white" : "%230d0d0d"),
  } as CSSProperties;
}
