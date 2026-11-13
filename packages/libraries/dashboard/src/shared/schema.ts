import { z } from "zod/v4";

/** How much of a Row a card takes, on a 12-column grid. Narrow screens stack. */
export const WIDTHS = ["quarter", "third", "half", "two-thirds", "three-quarters", "full"] as const;
export const widthSchema = z.enum(WIDTHS);
export type Width = z.infer<typeof widthSchema>;

export const widthClass = (width: Width | undefined | null, fallback: Width) =>
  `openui-dashboard-w-${width ?? fallback}`;

/** Which direction of change is good news for a metric (drives delta colour). */
export const goodWhenSchema = z.enum(["up", "down", "neutral"]);

export const toneSchema = z.enum(["good", "bad", "warning", "info", "neutral"]);
export type Tone = z.infer<typeof toneSchema>;

/** One period's status; null is no data. A union, so a signature brackets it: ("good" | "warning" | "bad" | null)[]. */
export const stateSchema = z.union([z.enum(["good", "warning", "bad"]), z.literal(null)]);

/** A list of numbers, where gaps (not yet observed, not applicable) are null. */
export const numbersSchema = z.array(z.number().nullable());
