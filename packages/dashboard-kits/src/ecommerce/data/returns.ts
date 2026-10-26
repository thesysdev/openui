import { random, sum } from "../../core/sample-data";
import type { AttributionModel } from "./marketing";

// Returns: exchange shares, return reasons by category, the size exchange
// matrix, and the attribution models' labels.

/** Share of returned orders the customer swapped for another size or color instead of a refund. */
export const EXCHANGE_SHARE = {
  all: 0.31,
  apparel: 0.38,
  footwear: 0.46,
  accessories: 0.08,
  home: 0.05,
};
/** Why customers send things back, by category, as shares of return requests. */
export const RETURN_REASONS: Record<string, [string, number][]> = {
  apparel: [
    ["Too small", 0.29],
    ["Too large", 0.21],
    ["Changed mind", 0.17],
    ["Not as pictured", 0.14],
    ["Damaged", 0.05],
    ["Arrived late", 0.05],
    ["Other", 0.09],
  ],
  footwear: [
    ["Too small", 0.41],
    ["Too large", 0.16],
    ["Not as pictured", 0.12],
    ["Changed mind", 0.11],
    ["Damaged", 0.07],
    ["Arrived late", 0.05],
    ["Other", 0.08],
  ],
  accessories: [
    ["Changed mind", 0.34],
    ["Not as pictured", 0.22],
    ["Damaged", 0.19],
    ["Arrived late", 0.12],
    ["Other", 0.13],
  ],
  home: [
    ["Damaged", 0.38],
    ["Changed mind", 0.23],
    ["Not as pictured", 0.2],
    ["Arrived late", 0.1],
    ["Other", 0.09],
  ],
};
const SIZES = {
  footwear: ["7", "8", "9", "10", "11", "12"],
  apparel: ["XS", "S", "M", "L", "XL", "XXL"],
};

/**
 * Size exchanges as ordered size (rows) against exchanged-for size (columns).
 * Most go one size up: the footwear line runs small.
 */
export function exchangeMatrix(category: "footwear" | "apparel", exchanges: number) {
  const sizes = SIZES[category];
  const up = category === "footwear" ? 0.64 : 0.5;
  const popularity = [0.08, 0.17, 0.27, 0.25, 0.16, 0.07];
  const next = random(`exchange:${category}`);
  const raw = sizes.map((_, r) =>
    sizes.map((_, c) => {
      const step = c - r;
      const weight =
        step === 1
          ? up
          : step === -1
            ? 0.78 - up
            : step === 2
              ? 0.08
              : step === -2
                ? 0.04
                : step === 0
                  ? 0.1
                  : 0;
      return popularity[r]! * weight * (0.85 + next() * 0.3);
    }),
  );
  const scale = exchanges / sum(raw.flat());
  return { sizes, counts: raw.map((row) => row.map((v) => Math.round(v * scale))) };
}

export const ATTRIBUTION_LABEL: Record<AttributionModel, string> = {
  last_click: "last click",
  first_click: "first click",
  linear: "linear credit",
  platform: "platform reports",
};
