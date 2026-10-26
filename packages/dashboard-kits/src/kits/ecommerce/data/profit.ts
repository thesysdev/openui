import { metricKpis, type MetricDefinition } from "../../../core/metrics";
import {
  AS_OF,
  bucket,
  calendarEvents,
  dayLabels,
  RANGE_DAYS,
  round,
  sum,
  TODAY,
} from "../../../core/sample-data";
import type { ChartEvent, Compare, Item, Range, ValueFormat } from "../../../core/schemas";
import { LAST_YEAR, STORE_EVENTS } from "../calendar";
import { METRICS, type MetricId } from "../metrics";
import { marketing, marketingOver, PAID } from "./marketing";
import {
  series,
  STOREFRONT,
  wholeDays,
  type Channel,
  type CustomerType,
  type Field,
} from "./store";

// Profit and comparisons: each day's profit lines, ad spend, break-even ROAS,
// what a period is set against (the period before, last year, or the plan), and
// the KPI, trend, and ranked-item helpers the handlers build answers from.

/** The plan: the same weekdays last year, grown by these factors. */
export const PLAN = { volume: 1.12, sessions: 1.08, adSpend: 1.06, otherMarketing: 1 };

export const COMPARISON_LABEL: Record<Compare, string> = {
  previous_period: "Prior period",
  last_year: "Same days last year",
  plan: "Plan",
};
export const AGAINST_TEXT: Record<Compare, string | undefined> = {
  previous_period: undefined,
  last_year: "same days last year",
  plan: "plan",
};

/** Daily values to set a period against: the period before it, the same weekdays last year, or the plan. */
export function against(
  chs: Channel[],
  field: Field,
  range: Range,
  compare: Compare,
  type: CustomerType = "all",
): number[] {
  const days = RANGE_DAYS[range];
  if (compare === "previous_period") return series(chs, field, days, days, type);
  const lastYear = series(chs, field, days, LAST_YEAR, type);
  if (compare === "last_year") return lastYear;
  const growth = field === "sessions" ? PLAN.sessions : PLAN.volume;
  return lastYear.map((v) => v * growth);
}

export type ProfitLine =
  "net" | "cogs" | "fulfillment" | "fees" | "returnCosts" | "adSpend" | "otherMarketing";
export type ProfitDays = Record<ProfitLine, number[]>;

/**
 * Each day's profit lines for the channels, for `days` days ending `offset`
 * days ago. Fulfillment is net of the shipping customers paid. Marketing drives
 * the online store and app, so each of them carries its share of the spend by
 * sales; Amazon's selling costs are its fees.
 */
export function profitDays(chs: Channel[], days: number, offset: number): ProfitDays {
  const field = (f: Field) => series(chs, f, days, offset);
  const share = storefrontShare(chs, days, offset);
  const spend = adSpendDaily(days, offset);
  const shipping = field("shipping");
  return {
    net: field("net"),
    cogs: field("cogs"),
    fulfillment: field("fulfillment").map((v, i) => v - shipping[i]),
    fees: field("fees"),
    returnCosts: field("returnCosts"),
    adSpend: spend.paid.map((v, i) => v * share[i]),
    otherMarketing: spend.other.map((v, i) => v * share[i]),
  };
}

/** Each day's share of online store and app sales that the channels made; marketing is shared out by it. */
export function storefrontShare(chs: Channel[], days: number, offset: number): number[] {
  const storefront = series(STOREFRONT, "total", days, offset);
  const own = series(
    chs.filter((c) => STOREFRONT.includes(c)),
    "total",
    days,
    offset,
  );
  return storefront.map((v, i) => (v ? own[i] / v : 0));
}

/** Daily spend on paid ads and on other marketing, and each paid platform's own. */
export function adSpendDaily(days: number, offset: number) {
  const { channels } = marketingOver(days, offset);
  const daily = (list: typeof channels) =>
    Array.from({ length: days }, (_, i) => sum(list.map((c) => c.spendDaily[i])));
  const paid = channels.filter((c) => PAID.has(c.m.key));
  return {
    paid: daily(paid),
    other: daily(channels.filter((c) => !PAID.has(c.m.key))),
    platforms: paid.map((c) => ({ key: c.m.key, label: c.m.label, daily: c.spendDaily })),
  };
}

/** The comparison's profit lines; the plan grows last year's sales lines and its marketing separately. */
export function profitAgainst(chs: Channel[], range: Range, compare: Compare): ProfitDays {
  const days = RANGE_DAYS[range];
  if (compare === "previous_period") return profitDays(chs, days, days);
  const lastYear = profitDays(chs, days, LAST_YEAR);
  if (compare === "last_year") return lastYear;
  return planned(lastYear);
}

/** Last year's profit lines grown into the plan: sales lines by volume, marketing on its own. */
export function planned(lastYear: ProfitDays): ProfitDays {
  const grow = (line: ProfitLine) => {
    const k =
      line === "adSpend"
        ? PLAN.adSpend
        : line === "otherMarketing"
          ? PLAN.otherMarketing
          : PLAN.volume;
    return lastYear[line].map((v) => v * k);
  };
  return Object.fromEntries(
    (Object.keys(lastYear) as ProfitLine[]).map((line) => [line, grow(line)]),
  ) as ProfitDays;
}

export const beforeMarketingOf = (p: ProfitDays) =>
  p.net.map((v, i) => v - p.cogs[i] - p.fulfillment[i] - p.fees[i] - p.returnCosts[i]);
export const contributionOf = (p: ProfitDays) =>
  beforeMarketingOf(p).map((v, i) => v - p.adSpend[i] - p.otherMarketing[i]);

/**
 * The ROAS at which ad spend uses up all the profit before marketing: store
 * and app total sales ÷ their profit before marketing, on the same basis as
 * blended ROAS.
 */
export function breakEvenRoas(days: number, offset = 0) {
  const sales = sum(series(STOREFRONT, "total", days, offset));
  return sales / sum(beforeMarketingOf(profitDays(STOREFRONT, days, offset)));
}

export function ncpa(range: Range, offset = 0) {
  const days = RANGE_DAYS[range];
  return marketing(range, offset).adSpend / sum(series(STOREFRONT, "newOrders", days, offset));
}

/** A KPI for a registered metric: its label, good direction, and definition come from METRICS. */
export const metric = metricKpis(METRICS as Record<MetricId, MetricDefinition>);

/** A daily series against the same days of the previous period, bucketed by week for 90d. */
export function trendOf(
  range: Range,
  cur: number[],
  prev: number[],
  format: ValueFormat,
  events: (ChartEvent | undefined)[] = [],
  average = false,
) {
  const { labels, values } = bucket(dayLabels(RANGE_DAYS[range]), [cur, prev], range, average);
  return {
    labels,
    current: values[0].map((v) => round(v, 2)),
    previous: values[1].map((v) => round(v, 2)),
    format,
    events: events.filter((e): e is ChartEvent => !!e),
    asOf: AS_OF,
    partial: true,
  };
}

/** A number rounded to a few significant digits, as goals are set. */
export const roundTo = (value: number, digits: number) => {
  const step = 10 ** (Math.floor(Math.log10(Math.abs(value))) - digits + 1);
  return Math.round(value / step) * step;
};

/** The store's calendar as chart events for the period, each with its kind. */
export const eventsFor = (range: Range): ChartEvent[] => calendarEvents(range, STORE_EVENTS);

/** Ranked items with their share of the total and change against the previous period. */
export function items(
  names: string[],
  values: number[],
  previousValues: number[],
  keys?: string[],
): Item[] {
  const total = sum(values) || 1;
  return names.map((name, i) => ({
    name,
    ...(keys ? { key: keys[i] } : {}),
    value: Math.round(values[i]),
    share: round(values[i] / total, 4),
    change: previousValues[i]
      ? round(((values[i] - previousValues[i]) / previousValues[i]) * 100)
      : 0,
  }));
}

/**
 * What a new customer's first order earns after the ad spend that won them:
 * first orders' net sales at the store and app's margin before marketing,
 * less ad spend, per new customer.
 */
export function firstOrderProfit(days: number, offset: number) {
  const p = profitDays(STOREFRONT, days, offset);
  const margin = sum(beforeMarketingOf(p)) / sum(p.net);
  const firstNet = sum(series(STOREFRONT, "net", days, offset, "new"));
  const firsts = sum(series(STOREFRONT, "newOrders", days, offset));
  return (firstNet * margin - sum(p.adSpend)) / firsts;
}

/**
 * What a customer acquired in a calendar month cost, fully loaded: that
 * month's ad spend and other marketing over first orders in the online store
 * and app, where the marketing sends shoppers.
 */
export function cohortCac(year: number, month: number) {
  const start = Math.round((TODAY - Date.UTC(year, month - 1, 1)) / 86_400_000);
  const end = Math.max(0, Math.round((TODAY - Date.UTC(year, month, 0)) / 86_400_000));
  const days = start - end + 1;
  return wholeDays(
    () =>
      (sum(adSpendDaily(days, end).paid) + sum(adSpendDaily(days, end).other)) /
      sum(series(STOREFRONT, "newOrders", days, end)),
  );
}
