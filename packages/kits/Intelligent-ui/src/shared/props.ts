/**
 * The model's prop values as CSS, shared by the components and the library. Colours are a token
 * ("ink", "muted", "info", "chart1", ...) or a CSS colour; spacing counts 4px steps; a length is px
 * or a CSS length; a radius is "sm" to "xl", "full" or px. Anything a model writes is checked first.
 */
import type { CSSProperties } from "react";
import { tokens } from "./tokens";

/** A token or a CSS color. */
export type Color = string;
/** A px number or a CSS length such as "50%". */
export type Length = number | string;
/** "sm", "md", "lg", "xl", "full", or px. */
export type Radius = "sm" | "md" | "lg" | "xl" | "full" | number;
/** Cross-axis alignment of a flex layout. */
export type Align = "start" | "center" | "end" | "stretch";
/** Main-axis distribution of a flex layout. */
export type Justify = "start" | "center" | "end" | "between";

// Safety
// A model-written style value could otherwise load a resource: `background: url(...)`.
const UNSAFE_CSS = /(url|image|image-set|cross-fade|element|expression|paint|var|attr|env)\s*\(|@import|[\\;{}<>]/i;
const isSafeCss = (value: string) => !UNSAFE_CSS.test(value);

// Values to CSS
const STATUS = ["info", "success", "warning", "danger", "purple", "pink"] as const;
const FOREGROUND: Record<string, string> = {
  ink: tokens.ink,
  muted: tokens.muted,
  faint: tokens.faint,
  canvas: tokens.canvas,
  surface: tokens.surface,
  ...Object.fromEntries(STATUS.map((s) => [s, tokens[s]])),
  chart1: tokens.chart1,
  chart2: tokens.chart2,
  chart3: tokens.chart3,
  chart4: tokens.chart4,
  chart5: tokens.chart5,
  chart6: tokens.chart6,
};
const BACKGROUND: Record<string, string> = {
  ...FOREGROUND,
  surface: tokens.surface,
  "surface-strong": tokens.surfaceStrong,
  border: tokens.border,
  ...Object.fromEntries(STATUS.map((s) => [s, tokens[`${s}Soft`]])),
};

const cssValue = (value: unknown) => (typeof value === "string" && value.trim() && isSafeCss(value) ? value.trim() : undefined);

/** Text, icon and stroke colors: a token or a CSS color. */
export const fg = (value: unknown) => (typeof value === "string" ? (FOREGROUND[value] ?? cssValue(value)) : undefined);
/** Backgrounds: status tokens become their soft tints. */
export const bg = (value: unknown) => (typeof value === "string" ? (BACKGROUND[value] ?? cssValue(value)) : undefined);

/** Whether a background is one of the kit's tokens, which follow the theme, rather than a raw colour. */
export const isColorToken = (value: string) => value in BACKGROUND;

/** Spacing in 4px steps. */
export const space = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? `${Math.max(0, value) * 4}px` : undefined);

export function size(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, value)}px`;
  if (typeof value !== "string") return undefined;
  if (/^\d+(\.\d+)?$/.test(value.trim())) return `${value.trim()}px`;
  return /^\d+(\.\d+)?(px|%|em|rem|vh|vw|fr)$|^auto$/.test(value.trim()) ? value.trim() : undefined;
}

const RADIUS: Record<string, string> = {
  sm: tokens.radiusSm,
  md: tokens.radiusMd,
  lg: tokens.radiusLg,
  xl: tokens.radiusXl,
  full: "999px",
};
export const radius = (value: unknown) => (typeof value === "string" ? RADIUS[value] : size(value));

// Layout
const FLEX: Record<string, string> = { start: "flex-start", end: "flex-end", center: "center", stretch: "stretch", between: "space-between" };

export type FlexProps = { gap?: number; align?: string; justify?: string; wrap?: boolean };

export const flexStyle = (p: FlexProps, column = false): CSSProperties => ({
  gap: space(p.gap),
  alignItems: p.align ? FLEX[p.align] : undefined,
  justifyContent: p.justify ? FLEX[p.justify] : undefined,
  flexWrap: p.wrap ? "wrap" : undefined,
  // A centered column centers its wrapped lines too.
  textAlign: column && (p.align === "center" || p.align === "end") ? p.align : undefined,
});
