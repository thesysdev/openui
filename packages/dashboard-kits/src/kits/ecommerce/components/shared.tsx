"use client";

// Shared by the e-commerce components: the tool result types their props
// reuse, the change label, the product monogram, and the stock tones.

import { z } from "zod/v4";
import { SERIES_COLORS as SLOTS } from "../../../components/charts/utils/constants";
import { changeTone, formatChange } from "../../../core/format";
import type {
  inventoryItemSchema,
  marketingChannelSchema,
  productSchema,
  segmentSchema,
} from "../tools";

export type MarketingChannel = z.infer<typeof marketingChannelSchema>;
export type CustomerSegment = z.infer<typeof segmentSchema>;
export type Product = z.infer<typeof productSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Props reuse the tool schemas, so a Query result plugs in without reshaping:
// MoneyBreakdown(breakdown.lines), ChannelPerformance(mkt.channels, mkt.targetRoas).

export function Change({
  value,
  goodDirection = "up",
}: {
  value?: number;
  goodDirection?: "up" | "down";
}) {
  if (value == null) return null;
  return (
    <span className={`kit-text-${changeTone(value, goodDirection)} kit-num`}>
      {formatChange(value)}
    </span>
  );
}

export const STOCK_TONE = {
  "In stock": "positive",
  "Low stock": "warning",
  "Out of stock": "negative",
} as const;
const CATEGORY_SLOT: Record<string, number> = { Apparel: 0, Footwear: 1, Accessories: 2, Home: 3 };

export function Monogram({ name, category }: { name: string; category: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className="kit-monogram"
      style={{ ["--kit-mono" as string]: SLOTS[CATEGORY_SLOT[category] ?? 6] }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
