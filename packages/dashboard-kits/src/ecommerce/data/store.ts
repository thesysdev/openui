import type { z } from "zod/v4";
import { RANGE_DAYS, dailySeries, dayOfWeek, random, sum } from "../../core/sample-data";
import type { Range } from "../../core/schemas";
import { LAST_YEAR, demandOn, trackedSessions } from "../calendar";
import { ecommerceTools } from "../tools";

// Sundial Goods: a demo direct-to-consumer brand. Everything derives from one
// daily history per sales channel, so the tools agree with each other: the
// sales breakdown's total equals the KPI strip's total sales, blended ROAS uses
// the same spend as the channel table, and so on.
//
// This module holds that core: the channels, each one's daily history, the
// series every other module reads, and the hour profiles that cut today to the
// hours gone by 3:48 PM.

type Tools = typeof ecommerceTools;
export type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
export type Channel = "online" | "app" | "amazon";

/**
 * A 90-day period and the one before it, plus the same days a year earlier
 * (for last-year comparisons and for customers lapsing 52 weeks after their
 * last order).
 */
export const HISTORY = LAST_YEAR + 182;

export const CHANNELS: Record<
  Channel,
  {
    label: string;
    orders: number;
    aov: number;
    newShare: number;
    conversion: number;
    returnRate: number;
    /** Cost of goods as a share of gross sales less returns (returned stock is resold). */
    costRate: number;
    /** Pick, pack, and postage per order; Amazon's is the FBA fee. */
    fulfillment: number;
  }
> = {
  online: {
    label: "Online store",
    orders: 230,
    aov: 86,
    newShare: 0.68,
    conversion: 0.025,
    returnRate: 0.068,
    costRate: 0.38,
    fulfillment: 7.2,
  },
  app: {
    label: "Mobile app",
    orders: 125,
    aov: 74,
    newShare: 0.45,
    conversion: 0.038,
    returnRate: 0.058,
    costRate: 0.38,
    fulfillment: 7.2,
  },
  amazon: {
    label: "Amazon",
    orders: 92,
    aov: 61,
    newShare: 0.74,
    conversion: 0,
    returnRate: 0.047,
    costRate: 0.4,
    fulfillment: 5.4,
  },
};
export const STOREFRONT: Channel[] = ["online", "app"];

export type Field =
  | "orders"
  | "gross"
  | "discounts"
  | "returns"
  | "net"
  | "shipping"
  | "taxes"
  | "total"
  | "newOrders"
  | "sessions"
  | "cogs"
  | "fulfillment"
  | "fees"
  | "returnCosts";
type Daily = Record<Field, number[]>;

const histories = new Map<Channel, Daily>();

function history(channel: Channel): Daily {
  const cached = histories.get(channel);
  if (cached) return cached;
  const c = CHANNELS[channel];
  const base = dailySeries(`orders:${channel}`, HISTORY, c.orders, {
    weekend: 0.93,
    growth: 0.16,
    noise: 0.22,
  });
  const next = random(`daily:${channel}`);
  const daily = {} as Daily;
  const push = (field: Field, value: number) => (daily[field] ??= []).push(value);
  for (let i = 0; i < HISTORY; i++) {
    const ago = HISTORY - 1 - i;
    const demand = demandOn(ago);
    const sale = demand.discountRate != null;
    const orders = Math.round(base[i] * demand.lift);
    const gross = orders * c.aov * 1.08 * (0.95 + next() * 0.1);
    const discounts = gross * (demand.discountRate ?? 0.066 + next() * 0.012);
    const returns = gross * c.returnRate * (0.85 + next() * 0.3);
    const net = gross - discounts - returns;
    const shipping = orders * 0.52 * 6.9;
    const taxes = (net + shipping) * 0.068;
    const total = net + shipping + taxes;
    push("orders", orders);
    push("gross", gross);
    push("discounts", discounts);
    push("returns", returns);
    push("net", net);
    push("shipping", shipping);
    push("taxes", taxes);
    push("total", total);
    push("newOrders", orders * c.newShare * (0.92 + next() * 0.16) * (sale ? 1.12 : 1));
    push(
      "sessions",
      c.conversion
        ? (orders /
            (c.conversion *
              (1 + (0.05 * i) / HISTORY) *
              (sale ? 1.18 : 1) *
              (0.93 + next() * 0.14))) *
            trackedSessions(ago)
        : 0,
    );
    push("cogs", (gross - returns) * c.costRate);
    push("fulfillment", orders * c.fulfillment);
    push("fees", channel === "amazon" ? total * 0.15 : total * 0.029 + orders * 0.3);
    // A return label and an hour of handling for each returned order.
    push("returnCosts", (returns / (c.aov * 1.08)) * 11);
  }
  histories.set(channel, daily);
  return daily;
}

export function channelsFor(channel: string): Channel[] {
  return channel === "all" ? (Object.keys(CHANNELS) as Channel[]) : [channel as Channel];
}

export type CustomerType = "all" | "new" | "returning";

/**
 * The data is as of 3:48 PM. The last day of every window counts only the
 * share of a day's orders each channel has usually taken by then (its hour
 * profile, see hourShares), so today is set against the same hours of each
 * comparison day rather than whole days.
 */
export let cutLastDay = true;

/** Minutes of today gone by AS_OF (3:48 PM). */
export const MINUTES_SO_FAR = 15 * 60 + 48;

/** The share of a day's orders a channel has usually taken by 3:48 PM, on today's kind of day. */
export function shareSoFar(ch: Channel): number {
  // Fixed for the sample's today, and read by every series that ends today.
  return (shareSoFarCache[ch] ??= shareBy(ch, [0, 6].includes(dayOfWeek(0)), MINUTES_SO_FAR / 60));
}
const shareSoFarCache: Partial<Record<Channel, number>> = {};

/** The same for a set of channels, weighted by their orders. */
export function shareSoFarFor(chs: Channel[]): number {
  const weights = chs.map((ch) => CHANNELS[ch].orders);
  return sum(chs.map((ch, k) => shareSoFar(ch) * weights[k]!)) / (sum(weights) || 1);
}

/** The online store and app together: what ad spend is cut by, as platforms spend through the day. */
export const storefrontShareSoFar = () => shareSoFarFor(STOREFRONT);

/** Runs `fn` with every window's last day counted whole, for windows that end before today on purpose. */
export function wholeDays<T>(fn: () => T): T {
  const was = cutLastDay;
  cutLastDay = false;
  try {
    return fn();
  } finally {
    cutLastDay = was;
  }
}

/** New customers' orders are 6% smaller than the average order, so returning customers' are larger. */
const NEW_ORDER_SIZE = 0.94;
/** Fields that follow the number of orders rather than the money in them. */
const PER_ORDER = new Set<Field>(["orders", "fulfillment"]);

/**
 * Daily values summed across channels, for the `days` days ending `offset`
 * days ago. With a customer type, each channel's day is split by its share of
 * first orders: counts by that share, money by that share times the smaller
 * first order. Sessions are not split; the store can't tell who is visiting.
 */
export function series(
  channels: Channel[],
  field: Field,
  days: number,
  offset = 0,
  type: CustomerType = "all",
): number[] {
  const out = new Array(days).fill(0);
  for (const ch of channels) {
    const h = history(ch);
    const values = h[field];
    const before = days > 0 ? out[days - 1] : 0;
    for (let i = 0; i < days; i++) {
      const d = HISTORY - offset - days + i;
      if (type === "all" || field === "sessions") {
        out[i] += values[d];
        continue;
      }
      const firsts = h.newOrders[d] / (h.orders[d] || 1);
      const share =
        field === "newOrders" ? 1 : PER_ORDER.has(field) ? firsts : firsts * NEW_ORDER_SIZE;
      const part = type === "new" ? share : field === "newOrders" ? 0 : 1 - share;
      out[i] += values[d] * part;
    }
    // Today's channel counts only the hours gone.
    if (days > 0 && cutLastDay) out[days - 1] = before + (out[days - 1] - before) * shareSoFar(ch);
  }
  return out;
}
export const current = (chs: Channel[], field: Field, range: Range, type: CustomerType = "all") =>
  series(chs, field, RANGE_DAYS[range], 0, type);
export const previous = (chs: Channel[], field: Field, range: Range, type: CustomerType = "all") =>
  series(chs, field, RANGE_DAYS[range], RANGE_DAYS[range], type);
export const ratio = (a: number[], b: number[]) => a.map((v, i) => (b[i] ? v / b[i] : 0));

// ── Hour profiles ───────────────────────────────────────────────────────────

function bump(h: number, at: number, width: number) {
  return Math.exp(-((h - at) ** 2) / (2 * width ** 2));
}

/**
 * The share of a day's orders in each hour, by channel and weekday or weekend
 * (our model, in UTC like every day here): the store sells at lunch and most
 * in the evening, the app before work, at lunch, and late; Amazon through the
 * day. Weekends start later.
 */
export function hourShares(ch: Channel, weekend: boolean): number[] {
  const morning = weekend ? 11 : ch === "app" ? 8 : 9;
  const weight = (h: number) =>
    ch === "amazon"
      ? 0.2 + bump(h, 14, 4)
      : ch === "app"
        ? 0.1 + 0.8 * bump(h, morning, 1.4) + 0.7 * bump(h, 12.5, 1.3) + 1.6 * bump(h, 21, 1.6)
        : 0.15 + 0.5 * bump(h, morning, 1.6) + bump(h, 12.5, 2.2) + 1.4 * bump(h, 20, 2);
  const raw = Array.from({ length: 24 }, (_, h) => weight(h));
  const total = sum(raw);
  return raw.map((v) => v / total);
}

/** The share of a day's orders that comes in before `hours` (fractional hours count part of the hour). */
export function shareBy(ch: Channel, weekend: boolean, hours: number): number {
  const shares = hourShares(ch, weekend);
  const whole = Math.floor(hours);
  return sum(shares.slice(0, whole)) + (shares[whole] ?? 0) * (hours - whole);
}
