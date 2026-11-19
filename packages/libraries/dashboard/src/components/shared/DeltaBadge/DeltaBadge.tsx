"use client";

import { computeDelta, deltaTone, padDecimals, type ValueFormat } from "../../../shared/format";

export type DeltaBadgeProps = {
  current: number | null | undefined;
  previous: number | null | undefined;
  format?: ValueFormat | null;
  // null means "not given" too: programs skip optional arguments with null.
  goodWhen?: GoodWhen | null;
  inline?: boolean;
  /** Pad the change to this many decimals, so a column of changes lines up (see deltaDecimals). */
  decimals?: number;
};

/* ---------- Delta badge ---------- */

export type GoodWhen = "up" | "down" | "neutral";

export function DeltaBadge({
  current,
  previous,
  format,
  goodWhen,
  inline = false,
  decimals = 0,
}: DeltaBadgeProps) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  const delta = computeDelta(current, previous, format);
  if (!delta) return null;
  delta.text = padDecimals(delta.text, decimals);
  const tone = deltaTone(delta.direction, goodWhen ?? "up");
  return (
    <span
      className={`openui-dashboard-delta openui-dashboard-delta-${tone}${inline ? " openui-dashboard-delta-inline" : ""}`}
    >
      {/* No arrows: the sign carries direction, the colour carries tone. */}
      {delta.text}
    </span>
  );
}
