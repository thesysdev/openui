import { z } from "zod/v4";
import { color, fg } from "./style";

// Every attribute is checked here; nothing can load a resource or run code.
export const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

export const opacity = (value: unknown) => (n(value) === undefined ? undefined : Math.min(1, Math.max(0, value as number)));

export const POINTS = /^[\d\s,.eE+-]*$/;

export const ok = (value: unknown, pattern: RegExp) => (typeof value === "string" && value.length < 20000 && pattern.test(value) ? value : undefined);

export const paint = { fill: color.optional(), stroke: color.optional(), strokeWidth: z.number().optional(), opacity: z.number().optional() };

export type Paint = { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number };

/** Filled shapes default to the text color; with only a stroke they stay unfilled. */
export const paintAttrs = (p: Paint, filled: boolean) => ({
  fill: p.fill !== undefined ? (fg(p.fill) ?? "none") : filled && p.stroke === undefined ? "currentColor" : "none",
  stroke: p.stroke !== undefined ? fg(p.stroke) : filled ? undefined : "currentColor",
  strokeWidth: n(p.strokeWidth) ?? (filled ? undefined : 2),
  opacity: opacity(p.opacity),
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});
