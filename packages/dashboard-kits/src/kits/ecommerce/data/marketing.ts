import { dayOfWeek, random, RANGE_DAYS, sum } from "../../../core/sample-data";
import type { Range } from "../../../core/schemas";
import { PLATFORM_CLAIM } from "./customers";
import { cutLastDay, HISTORY, series, STOREFRONT, storefrontShareSoFar, type Field } from "./store";

// Marketing: each channel's spend and attributed revenue over the store's
// daily history, the attribution models and windows, and which paid channels
// clear break-even.

const MARKETING = [
  {
    key: "meta",
    label: "Meta Ads",
    type: "paid",
    spend: 3900,
    share: 0.33,
    newShare: 0.33,
    growth: 0.25,
  },
  {
    key: "google",
    label: "Google Ads",
    type: "paid",
    spend: 2500,
    share: 0.24,
    newShare: 0.24,
    growth: 0.12,
  },
  {
    key: "tiktok",
    label: "TikTok Ads",
    type: "paid",
    spend: 850,
    share: 0.09,
    newShare: 0.11,
    growth: 0.9,
  },
  {
    key: "email",
    label: "Email & SMS",
    type: "owned",
    spend: 160,
    share: 0.14,
    newShare: 0.04,
    growth: 0,
  },
  {
    key: "organic",
    label: "Organic search",
    type: "organic",
    spend: 0,
    share: 0.08,
    newShare: 0.12,
    growth: 0,
  },
  {
    key: "direct",
    label: "Direct",
    type: "organic",
    spend: 0,
    share: 0.08,
    newShare: 0.08,
    growth: 0,
  },
  {
    key: "affiliates",
    label: "Affiliates",
    type: "partner",
    spend: 0,
    share: 0.04,
    newShare: 0.08,
    growth: 0,
  },
] as const;
export const PAID = new Set(["meta", "google", "tiktok"]);

function marketingChannel(m: (typeof MARKETING)[number], days: number, offset: number) {
  const next = random(`mkt:${m.key}:${days}:${offset}`);
  const sales = series(STOREFRONT, "total", days, offset);
  const orders = series(STOREFRONT, "orders", days, offset);
  const newOrders = series(STOREFRONT, "newOrders", days, offset);
  // TikTok's spend has ramped up faster than the revenue it brings in.
  const decay = m.key === "tiktok" ? 1 - 0.28 * ((HISTORY - offset) / HISTORY) ** 3 : 1;
  const tilt = (i: number) => 1 + (m.growth - 0.3) * 0.6 * (i / days - 0.5);
  const cadence = (i: number) =>
    m.key === "email" ? ([2, 4].includes(dayOfWeek(offset + days - 1 - i)) ? 1.45 : 0.82) : 1;
  const revenueDaily = sales.map(
    (v, i) => v * m.share * decay * tilt(i) * cadence(i) * (0.78 + next() * 0.44),
  );
  const revenue = sum(revenueDaily);
  const spendDaily = sales.map((v, i) =>
    m.key === "affiliates"
      ? v * m.share * (0.074 + next() * 0.014)
      : m.spend *
        (1 + m.growth * ((HISTORY - offset - days + i) / HISTORY)) *
        (0.9 + next() * 0.2) *
        // Platforms spend through the day, so the last day is cut like sales.
        (i === days - 1 && cutLastDay ? storefrontShareSoFar() : 1),
  );
  return {
    revenue,
    revenueDaily,
    spend: sum(spendDaily),
    spendDaily,
    orders: sum(orders) * m.share * decay * (0.9 + next() * 0.2),
    newCustomers: sum(newOrders) * m.newShare * (0.9 + next() * 0.2),
  };
}

type Attribution = { model: AttributionModel; window: AttributionWindow };
export type AttributionModel = "last_click" | "first_click" | "linear" | "platform";
type AttributionWindow = "1d" | "7d" | "28d";
const LAST_CLICK: Attribution = { model: "last_click", window: "7d" };

/**
 * How much more (or less) credit each channel gets than under last click with
 * a 7-day window. First click favours the channels that find new shoppers
 * (Meta, TikTok); last click favours the ones that close (Google, email,
 * direct); linear sits between. A shorter window cuts the channels whose
 * buyers take longer to come back.
 */
const MODEL_WEIGHT: Record<"first_click", Record<string, number>> = {
  first_click: {
    meta: 1.35,
    google: 0.85,
    tiktok: 1.5,
    email: 0.6,
    organic: 1.05,
    direct: 0.7,
    affiliates: 1.1,
  },
};
const WINDOW_WEIGHT: Record<AttributionWindow, Record<string, number>> = {
  "1d": {
    meta: 0.8,
    google: 0.95,
    tiktok: 0.75,
    email: 1.1,
    organic: 1,
    direct: 1.1,
    affiliates: 0.95,
  },
  "7d": {},
  "28d": {
    meta: 1.15,
    google: 1.05,
    tiktok: 1.2,
    email: 0.95,
    organic: 1,
    direct: 0.9,
    affiliates: 1.05,
  },
};
const creditWeight = (key: string, { model, window }: Attribution) => {
  const first = MODEL_WEIGHT.first_click[key] ?? 1;
  const byModel = model === "first_click" ? first : model === "linear" ? (1 + first) / 2 : 1;
  return byModel * (WINDOW_WEIGHT[window][key] ?? 1);
};

export function marketing(range: Range, offset = 0, attribution: Attribution = LAST_CLICK) {
  return marketingOver(RANGE_DAYS[range], offset, attribution);
}

/**
 * Every marketing channel's spend and attributed results for `days` days
 * ending `offset` days ago, under an attribution model and window.
 */
export function marketingOver(days: number, offset = 0, attribution: Attribution = LAST_CLICK) {
  const raw = MARKETING.map((m) => {
    const c = marketingChannel(m, days, offset);
    const w = creditWeight(m.key, attribution);
    return {
      m,
      ...c,
      revenue: c.revenue * w,
      revenueDaily: c.revenueDaily.map((v) => v * w),
      orders: c.orders * w,
      newCustomers: c.newCustomers * w,
    };
  });
  // Attribution reconciles to the store: channel revenue, orders, and new
  // customers add up to the storefront totals for the period.
  const scale = (key: "revenue" | "orders" | "newCustomers", field: Field) =>
    sum(series(STOREFRONT, field, days, offset)) / sum(raw.map((c) => c[key]));
  const revenueScale = scale("revenue", "total");
  const orderScale = scale("orders", "orders");
  const newScale = scale("newCustomers", "newOrders");
  // Platform attribution is what each ad platform reports for itself: it
  // doesn't reconcile, so paid channels claim more than the store sold.
  const claim = (key: string) =>
    attribution.model === "platform"
      ? (PLATFORM_CLAIM[key as keyof typeof PLATFORM_CLAIM] ?? 1)
      : 1;
  const channels = raw.map((c) => ({
    ...c,
    revenue: c.revenue * revenueScale * claim(c.m.key),
    revenueDaily: c.revenueDaily.map((v) => v * revenueScale * claim(c.m.key)),
    orders: c.orders * orderScale * claim(c.m.key),
    newCustomers: c.newCustomers * newScale * claim(c.m.key),
  }));
  const adSpend = sum(channels.filter((c) => PAID.has(c.m.key)).map((c) => c.spend));
  const otherMarketing = sum(channels.filter((c) => !PAID.has(c.m.key)).map((c) => c.spend));
  return { channels, adSpend, otherMarketing };
}

/** "Meta Ads and Google Ads are above it." for the paid channels that beat break-even. */
export function aboveBreakEven(range: Range, breakEven: number): string {
  const above = marketing(range)
    .channels.filter((c) => PAID.has(c.m.key) && c.revenue / c.spend >= breakEven)
    .map((c) => c.m.label);
  if (above.length === 0) return "No paid channel is above it.";
  return `${above.join(" and ")} ${above.length === 1 ? "is" : "are"} above it.`;
}
