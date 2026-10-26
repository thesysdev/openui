import type { z } from "zod/v4";
import {
  confidence,
  contributions,
  mixAndRate,
  periodChangeInsight,
  walk as walkOf,
  type RatioSegment,
  type Segment,
} from "../core/explain";
import { formatCurrency, formatNumber, formatPoints } from "../core/format";
import { metricKpis, type MetricDefinition } from "../core/metrics";
import {
  AS_OF,
  between,
  bucket,
  calendarEvents,
  changeText,
  dailySeries,
  dateLabel,
  dayLabels,
  dayOfWeek,
  downsample,
  mean,
  PAST_WINDOWS,
  periodLabel,
  random,
  RANGE_DAYS,
  round,
  sum,
  TODAY,
} from "../core/sample-data";
import type {
  ChartEvent,
  Compare,
  Driver,
  Goal,
  Insight,
  Item,
  Kpi,
  Range,
  ValueFormat,
  Why,
} from "../core/schemas";
import { normalCdf } from "../core/stats";
import { demandOn, LAST_YEAR, seasonOn, STORE_EVENTS, trackedSessions } from "./calendar";
import { definitionOf, METRICS, type MetricId } from "./metrics";
import { ecommerceTools } from "./tools";

// Sundial Goods: a demo direct-to-consumer brand. Everything derives from one
// daily history per sales channel, so the tools agree with each other: the
// sales breakdown's total equals the KPI strip's total sales, blended ROAS uses
// the same spend as the channel table, and so on.

type Tools = typeof ecommerceTools;
type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
type Channel = "online" | "app" | "amazon";

/**
 * A 90-day period and the one before it, plus the same days a year earlier
 * (for last-year comparisons and for customers lapsing 52 weeks after their
 * last order).
 */
const HISTORY = LAST_YEAR + 182;

const CHANNELS: Record<
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
const STOREFRONT: Channel[] = ["online", "app"];

type Field =
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

function channelsFor(channel: string): Channel[] {
  return channel === "all" ? (Object.keys(CHANNELS) as Channel[]) : [channel as Channel];
}

export type CustomerType = "all" | "new" | "returning";

/**
 * The data is as of 3:48 PM. The last day of every window counts only the
 * share of a day's orders each channel has usually taken by then (its hour
 * profile, see hourShares), so today is set against the same hours of each
 * comparison day rather than whole days.
 */
let cutLastDay = true;

/** Minutes of today gone by AS_OF (3:48 PM). */
const MINUTES_SO_FAR = 15 * 60 + 48;

/** The share of a day's orders a channel has usually taken by 3:48 PM, on today's kind of day. */
function shareSoFar(ch: Channel): number {
  // Fixed for the sample's today, and read by every series that ends today.
  return (shareSoFarCache[ch] ??= shareBy(ch, [0, 6].includes(dayOfWeek(0)), MINUTES_SO_FAR / 60));
}
const shareSoFarCache: Partial<Record<Channel, number>> = {};

/** The same for a set of channels, weighted by their orders. */
function shareSoFarFor(chs: Channel[]): number {
  const weights = chs.map((ch) => CHANNELS[ch].orders);
  return sum(chs.map((ch, k) => shareSoFar(ch) * weights[k]!)) / (sum(weights) || 1);
}

/** The online store and app together: what ad spend is cut by, as platforms spend through the day. */
const storefrontShareSoFar = () => shareSoFarFor(STOREFRONT);

/** Runs `fn` with every window's last day counted whole, for windows that end before today on purpose. */
function wholeDays<T>(fn: () => T): T {
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
function series(
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
const current = (chs: Channel[], field: Field, range: Range, type: CustomerType = "all") =>
  series(chs, field, RANGE_DAYS[range], 0, type);
const previous = (chs: Channel[], field: Field, range: Range, type: CustomerType = "all") =>
  series(chs, field, RANGE_DAYS[range], RANGE_DAYS[range], type);
const ratio = (a: number[], b: number[]) => a.map((v, i) => (b[i] ? v / b[i] : 0));

// ── Marketing ──────────────────────────────────────────────────────────────

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
const PAID = new Set(["meta", "google", "tiktok"]);

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
type AttributionModel = "last_click" | "first_click" | "linear" | "platform";
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

function marketing(range: Range, offset = 0, attribution: Attribution = LAST_CLICK) {
  return marketingOver(RANGE_DAYS[range], offset, attribution);
}

/**
 * Every marketing channel's spend and attributed results for `days` days
 * ending `offset` days ago, under an attribution model and window.
 */
function marketingOver(days: number, offset = 0, attribution: Attribution = LAST_CLICK) {
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
function aboveBreakEven(range: Range, breakEven: number): string {
  const above = marketing(range)
    .channels.filter((c) => PAID.has(c.m.key) && c.revenue / c.spend >= breakEven)
    .map((c) => c.m.label);
  if (above.length === 0) return "No paid channel is above it.";
  return `${above.join(" and ")} ${above.length === 1 ? "is" : "are"} above it.`;
}

/**
 * What a new customer's first order earns after the ad spend that won them:
 * first orders' net sales at the store and app's margin before marketing,
 * less ad spend, per new customer.
 */
function firstOrderProfit(days: number, offset: number) {
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
function cohortCac(year: number, month: number) {
  const start = Math.round((TODAY - Date.UTC(year, month - 1, 1)) / 86_400_000);
  const end = Math.max(0, Math.round((TODAY - Date.UTC(year, month, 0)) / 86_400_000));
  const days = start - end + 1;
  return wholeDays(
    () =>
      (sum(adSpendDaily(days, end).paid) + sum(adSpendDaily(days, end).other)) /
      sum(series(STOREFRONT, "newOrders", days, end)),
  );
}

// ── RFM segments and how customers move between them ───────────────────────

const SEGMENTS = [
  {
    name: "Champions",
    tone: "positive",
    revenueShare: 0.29,
    avgOrders: 5.8,
    avgSpend: 612,
    days: 12,
    action: "Early access and referral asks; skip discounts",
  },
  {
    name: "Loyal",
    tone: "positive",
    revenueShare: 0.24,
    avgOrders: 3.9,
    avgSpend: 371,
    days: 31,
    action: "Bundles and loyalty perks",
  },
  {
    name: "Promising",
    tone: "neutral",
    revenueShare: 0.09,
    avgOrders: 1.9,
    avgSpend: 168,
    days: 24,
    action: "Introduce a second category",
  },
  {
    name: "New",
    tone: "neutral",
    revenueShare: 0.1,
    avgOrders: 1.0,
    avgSpend: 96,
    days: 9,
    action: "Welcome series aimed at a 2nd order within 60 days",
  },
  {
    name: "Needs attention",
    tone: "warning",
    revenueShare: 0.09,
    avgOrders: 2.2,
    avgSpend: 187,
    days: 68,
    action: "Personalized recommendations",
  },
  {
    name: "At risk",
    tone: "warning",
    revenueShare: 0.11,
    avgOrders: 3.1,
    avgSpend: 298,
    days: 132,
    action: "Win-back offer and a short survey",
  },
  {
    name: "Almost lost",
    tone: "negative",
    revenueShare: 0.04,
    avgOrders: 1.6,
    avgSpend: 142,
    days: 210,
    action: "One last win-back attempt",
  },
  {
    name: "Dormant",
    tone: "negative",
    revenueShare: 0.04,
    avgOrders: 1.1,
    avgSpend: 88,
    days: 318,
    action: "Suppress from paid audiences",
  },
] as const;

/** Customers in each segment 90 days ago; "First order" are the customers new since. */
const SEGMENTS_BEFORE: Record<string, number> = {
  "First order": 10_400,
  Champions: 3_500,
  Loyal: 6_900,
  Promising: 5_600,
  New: 10_300,
  "Needs attention": 8_300,
  "At risk": 7_200,
  "Almost lost": 5_400,
  Dormant: 13_100,
};

/**
 * Where each segment's customers were 90 days later: most stay, some move up
 * a step, more slip down one. Dormant customers past 12 months lapse out.
 */
const SEGMENT_MOVES: Record<string, [string, number][]> = {
  "First order": [["New", 1]],
  Champions: [
    ["Champions", 0.78],
    ["Loyal", 0.16],
    ["At risk", 0.06],
  ],
  Loyal: [
    ["Champions", 0.12],
    ["Loyal", 0.66],
    ["Needs attention", 0.14],
    ["At risk", 0.08],
  ],
  Promising: [
    ["Loyal", 0.18],
    ["Promising", 0.52],
    ["Needs attention", 0.22],
    ["Almost lost", 0.08],
  ],
  New: [
    ["Promising", 0.28],
    ["New", 0.12],
    ["Needs attention", 0.18],
    ["Almost lost", 0.42],
  ],
  "Needs attention": [
    ["Loyal", 0.1],
    ["Needs attention", 0.38],
    ["At risk", 0.3],
    ["Almost lost", 0.22],
  ],
  "At risk": [
    ["Loyal", 0.09],
    ["At risk", 0.43],
    ["Almost lost", 0.2],
    ["Dormant", 0.28],
  ],
  "Almost lost": [
    ["Promising", 0.05],
    ["Almost lost", 0.3],
    ["Dormant", 0.65],
  ],
  Dormant: [
    ["Promising", 0.03],
    ["Dormant", 0.75],
    ["Lapsed", 0.22],
  ],
};

function segmentMovement() {
  const scale = activeCustomers() / SEGMENT_BASE;
  const flows: { from: string; to: string; customers: number }[] = [];
  const current = new Map<string, number>();
  for (const [from, moves] of Object.entries(SEGMENT_MOVES)) {
    for (const [to, share] of moves) {
      const customers = Math.round(SEGMENTS_BEFORE[from]! * scale * share);
      flows.push({ from, to, customers });
      current.set(to, (current.get(to) ?? 0) + customers);
    }
  }
  return { flows, current };
}

/**
 * Customers' 1st to 5th orders over the last 182 days against the 182 before:
 * first orders are the period's new customers; each later step continues at
 * the repeat rate, rising with every order as loyalty builds (our model);
 * the median gap before each order comes from the order-gap model.
 */
function orderJourney() {
  const steps = (offset: number) => {
    const firsts = sum(series(channelsFor("all"), "newOrders", 182, offset));
    const base = repeatRate(offset) / 100;
    const out = [firsts];
    for (const loyalty of ORDER_GAP.loyalty) out.push(out.at(-1)! * Math.min(0.9, base * loyalty));
    return out;
  };
  const now = steps(0);
  const then = steps(182);
  const labels = ["1st order", "2nd order", "3rd order", "4th order", "5th order or later"];
  return labels.map((label, k) => ({
    label,
    value: Math.round(now[k]!),
    previous: Math.round(then[k]!),
    ...(k ? { medianTime: `${ORDER_GAP.byOrder[k - 1]} days` } : {}),
  }));
}

/** Unique buyers per order within a period: some buy twice in it (our model). */
const BUYERS_PER_ORDER = 0.91;

/** Days between a customer's orders: a lognormal with this median and spread (our model). */
const ORDER_GAP = {
  median: 38,
  spread: 1.2,
  /** Median days before the 2nd, 3rd, 4th, and 5th order: loyal customers take longer between orders. */
  byOrder: [38, 52, 61, 66],
  /** How much likelier each later order is than the 2nd, as loyalty builds. */
  loyalty: [1, 1.6, 2, 2.2],
};

/**
 * Share of customers with 2+ orders in the year to `offset` days ago: the
 * share of orders that follow an earlier one, times the chance the second
 * order came before the year ended, from the order-gap model (our model).
 */
function repeatRate(offset: number) {
  const all = channelsFor("all");
  const followUp =
    1 - sum(series(all, "newOrders", 364, offset)) / sum(series(all, "orders", 364, offset));
  // A customer who first ordered d days before the year ended had d days to order again.
  let reach = 0;
  for (let d = 1; d <= 364; d++) {
    reach += normalCdf((Math.log(d) - Math.log(ORDER_GAP.median)) / ORDER_GAP.spread);
  }
  return followUp * (reach / 364) * 100;
}

/**
 * Expected revenue per customer by month `months` for the cohort acquired `k`
 * months after January 2026: the cohort grid's curve without its noise.
 */
function cohortLtv(k: number, months: number) {
  const lift = 1 + LTV_CURVE.liftPerCohort * k;
  let value = LTV_CURVE.first * (1 + LTV_CURVE.firstPerCohort * k);
  for (let m = 1; m < months; m++) value += LTV_CURVE.month1 * LTV_CURVE.decay ** (m - 1) * lift;
  return value;
}
/** Revenue per customer: the first month, then each month's addition decaying (our model). */
const LTV_CURVE = {
  first: 78,
  firstPerCohort: 0.01,
  month1: 13.5,
  decay: 0.82,
  liftPerCohort: 0.025,
};

/**
 * When a customer should count as lapsing: the day by which 80% of second
 * orders have happened. Gaps between orders follow a lognormal with the
 * order journey's 38-day median and a spread of 1.2 (our model).
 */
function lapsePoint() {
  const days = Math.round(ORDER_GAP.median * Math.exp(0.8416 * ORDER_GAP.spread));
  return {
    days,
    note: `80% of customers who order again do so within ${days} days of their first order; after that, treat them as at risk and start win-back.`,
  };
}

// ── Customer flow ──────────────────────────────────────────────────────────

/** Share of returning orders from customers with no order in the 52 weeks before. */
const REACTIVATED_SHARE = 0.11;
/**
 * Share of a day's orders that turn out to be the customer's last for a year,
 * so the customer lapses 52 weeks later (our model, tuned so the base grows a
 * little slower than orders).
 */
const LAST_ORDER_SHARE = 0.6;
/**
 * Customers with an order in the 52 weeks to `offset` days ago. Each order is
 * the start of a customer's run of orders (a first order) or follows one, so
 * the year's customers are its new customers, plus customers who first
 * ordered in the 90 days before it and came back within it (about half of
 * those who reorder), plus reactivated customers (our model).
 */
export function activeCustomers(offset = 0) {
  const all = channelsFor("all");
  const orders = sum(series(all, "orders", 364, offset));
  const firsts = sum(series(all, "newOrders", 364, offset));
  const followUp = 1 - firsts / orders;
  const carried = sum(series(all, "newOrders", 90, offset + 364)) * followUp * 0.5;
  const reactivated = (orders - firsts) * REACTIVATED_SHARE;
  return firsts + carried + reactivated;
}
/** The RFM segment counts below were sized for this many active customers; they scale with the real base. */
const SEGMENT_BASE = 61_400;

/** Daily new, reactivated, and lapsed customers for `days` days ending `offset` days ago. */
function flowDaily(days: number, offset: number) {
  const all = channelsFor("all");
  const firsts = series(all, "newOrders", days, offset);
  const returning = series(all, "orders", days, offset).map((o, i) => o - firsts[i]);
  const reactivated = returning.map((v) => v * REACTIVATED_SHARE);
  const lapsed = series(all, "orders", days, offset + LAST_YEAR).map((v) => v * LAST_ORDER_SHARE);
  return {
    newCustomers: firsts,
    reactivated,
    lapsed,
    net: firsts.map((v, i) => v + reactivated[i] - lapsed[i]),
  };
}

/**
 * How much each ad platform's own reporting claims against the store's
 * orders: view-through credit and longer click windows count the same order
 * on more than one platform.
 */
const PLATFORM_CLAIM = { meta: 1.38, google: 1.22, tiktok: 1.65 };

// ── Promotions ───────────────────────────────────────────────────────────────

/** Normal days' discounts, as a share of gross sales. */
const USUAL_DISCOUNT = 0.072;

/**
 * A promotion against what the same days would have done without it: the
 * baseline is each weekday's average over the four weeks before the sale,
 * moved to each charted day's season.
 * Shows the lift during, the dip after (demand pulled forward), and the
 * lift the deeper discount needed to break even on product margin.
 */
function promoImpact(id: Input<"get_promo_impact">["event"]) {
  // Every window here ends yesterday or earlier, so its days are whole.
  return wholeDays(() => measurePromo(id));
}

function measurePromo(id: Input<"get_promo_impact">["event"]) {
  const e = STORE_EVENTS.find((x) => x.id === id)!;
  const all = channelsFor("all");
  const during = e.from - e.to + 1;
  // Full days only: the window ends yesterday at the latest.
  const afterDays = Math.min(21, e.to - 1);
  // The chart runs from two weeks before the sale to three weeks after it.
  const start = e.from + 14;
  const end = e.to - afterDays;
  const n = start - end + 1;
  const sales = series(all, "total", n, end);
  const orders = series(all, "orders", n, end);
  const profit = contributionOf(profitDays(all, n, end));
  const baselineOf = (field: Field | "profit") => {
    const before =
      field === "profit"
        ? contributionOf(profitDays(all, 28, e.from + 1))
        : series(all, field, 28, e.from + 1);
    // 28 days ending the day before the sale: index i is (e.from + 28 − i) days ago.
    // Each day is taken out of its season and put into the charted day's, so a
    // sale late in November is measured against December's busier normal.
    const byWeekday = new Map<number, number[]>();
    before.forEach((v, i) => {
      const ago = e.from + 28 - i;
      const day = dayOfWeek(ago);
      byWeekday.set(day, [...(byWeekday.get(day) ?? []), v / seasonOn(ago)]);
    });
    return Array.from(
      { length: n },
      (_, i) => mean(byWeekday.get(dayOfWeek(start - i)) ?? [0]) * seasonOn(start - i),
    );
  };
  const base = {
    sales: baselineOf("total"),
    orders: baselineOf("orders"),
    profit: baselineOf("profit"),
  };
  const inSale = (i: number) => start - i <= e.from && start - i >= e.to;
  const afterSale = (i: number) => start - i < e.to;
  const gap = (actual: number[], baseline: number[], when: (i: number) => boolean) =>
    sum(actual.map((v, i) => (when(i) ? v - baseline[i] : 0)));
  const lift = gap(sales, base.sales, inSale);
  const dip = gap(sales, base.sales, afterSale);
  const profitNet = gap(profit, base.profit, (i) => inSale(i) || afterSale(i));
  const orderLift =
    sum(orders.filter((_, i) => inSale(i))) / sum(base.orders.filter((_, i) => inSale(i))) - 1;
  // Required lift on product margin: (1 + L)(m − d) = m, so L = d ÷ (m − d).
  const gross = sum(series(all, "gross", 28, e.from + 1));
  const margin = 1 - sum(series(all, "cogs", 28, e.from + 1)) / gross;
  const extra = (e.discountRate ?? USUAL_DISCOUNT) - USUAL_DISCOUNT;
  const needed = extra / (margin - extra);
  const signedMoney = (v: number) =>
    `${v >= 0 ? "+" : "−"}${formatCurrency(Math.round(Math.abs(v)))}`;
  // Dates outside this year carry the year, on the axis and in the event alike.
  const day = (ago: number) =>
    dateLabel(
      ago,
      new Date(TODAY - ago * 86_400_000).getUTCFullYear() !== new Date(TODAY).getUTCFullYear(),
    );
  const pctText = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(0)}%`;
  const range = (from: number, to: number) => `${dateLabel(from)}–${day(to)}`;
  const tile = (id: MetricId, value: string, hint: string) => ({
    label: METRICS[id].label,
    value,
    hint,
    definition: definitionOf(id),
  });
  return {
    event: e.label,
    detail: e.detail,
    labels: Array.from({ length: n }, (_, i) => day(start - i)),
    actual: sales.map(Math.round),
    baseline: base.sales.map(Math.round),
    events: [
      {
        label: e.label,
        start: day(e.from),
        end: day(e.to),
        detail: e.detail,
        kind: "promo" as const,
      },
    ],
    metrics: [
      tile(
        "promo_order_lift",
        pctText(orderLift),
        `${during} days, against the same weekdays before`,
      ),
      tile(
        "promo_required_lift",
        pctText(needed),
        `To cover ${Math.round(extra * 100)} extra points of discount`,
      ),
      tile("promo_sales_lift", signedMoney(lift), range(e.from, e.to)),
      tile("promo_dip", signedMoney(dip), `${afterDays} days after, ${range(e.to - 1, end)}`),
      tile("promo_net_profit", signedMoney(profitNet), "During and after, after marketing"),
    ],
    summary: `${e.label} lifted orders ${pctText(orderLift)} against the ${pctText(needed)} needed to cover the deeper discount. It added ${formatCurrency(Math.round(lift))} of sales during, and in the ${afterDays} days after sales ran ${formatCurrency(Math.round(Math.abs(dip)))} ${dip < 0 ? "below the baseline as the sale pulled demand forward" : "above the baseline"}, for ${signedMoney(lift + dip)} of sales and ${signedMoney(profitNet)} of contribution profit overall.`,
  };
}

// ── Returns ──────────────────────────────────────────────────────────────────

/** Share of returned orders the customer swapped for another size or color instead of a refund. */
const EXCHANGE_SHARE = { all: 0.31, apparel: 0.38, footwear: 0.46, accessories: 0.08, home: 0.05 };
/** Why customers send things back, by category, as shares of return requests. */
const RETURN_REASONS: Record<string, [string, number][]> = {
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
function exchangeMatrix(category: "footwear" | "apparel", exchanges: number) {
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

const ATTRIBUTION_LABEL: Record<AttributionModel, string> = {
  last_click: "last click",
  first_click: "first click",
  linear: "linear credit",
  platform: "platform reports",
};

// ── October: plan and targets ───────────────────────────────────────────────

/** October so far: the 1st to today, the 10th, of a 31-day month. */
const MONTH_DAYS = 31;
const MONTH_ELAPSED = 10;
/** The same weekdays last year for every day of October: 343 to 373 days ago. */
const MONTH_LAST_YEAR = LAST_YEAR - (MONTH_DAYS - MONTH_ELAPSED);

/** The plan for each whole day of October, from last year's same weekdays. */
function octoberPlan(
  chs: Channel[],
  metric: "total" | "orders" | "newOrders" | "sessions" | "profit" | "adSpend",
) {
  const days = wholeDays(() => {
    if (metric === "profit" || metric === "adSpend") {
      const plan = planned(profitDays(chs, MONTH_DAYS, MONTH_LAST_YEAR));
      return metric === "profit" ? contributionOf(plan) : plan.adSpend;
    }
    const growth = metric === "sessions" ? PLAN.sessions : PLAN.volume;
    return series(chs, metric, MONTH_DAYS, MONTH_LAST_YEAR).map((v) => v * growth);
  });
  return days;
}

/** The plan to date: October's first days, with today cut at the same hours as the actual. */
const planToDate = (plan: number[], share = storefrontShareSoFar()) =>
  sum(plan.slice(0, MONTH_ELAPSED - 1)) + plan[MONTH_ELAPSED - 1]! * share;

/** October to date, day by day, cut at the same hours today. */
function octoberActual(chs: Channel[], metric: Parameters<typeof octoberPlan>[1]) {
  if (metric === "profit") return contributionOf(profitDays(chs, MONTH_ELAPSED, 0));
  if (metric === "adSpend") return profitDays(chs, MONTH_ELAPSED, 0).adSpend;
  return series(chs, metric, MONTH_ELAPSED, 0);
}

const TARGETS = [
  { id: "total_sales", metric: "total", format: "currency" },
  { id: "contribution_profit", metric: "profit", format: "currency" },
  { id: "orders", metric: "orders", format: "number" },
  { id: "new_customers", metric: "newOrders", format: "number" },
  { id: "ad_spend", metric: "adSpend", format: "currency", budget: true },
] as const;

function monthTarget(chs: Channel[], t: (typeof TARGETS)[number]) {
  const plan = octoberPlan(chs, t.metric);
  const actualDays = octoberActual(chs, t.metric);
  const actual = sum(actualDays);
  // Today's plan cut by the same hours as the actual: ad spend by the
  // storefront's day, everything else by each channel's own.
  const toDate = planToDate(
    plan,
    t.metric === "adSpend" ? storefrontShareSoFar() : shareSoFarFor(chs),
  );
  // The rest of today, and the days after it.
  const remaining = sum(plan) - toDate;
  // Pace: each whole day's actual against its plan. The forecast carries the
  // average pace through the rest of the month, with an 80% range from how
  // much the daily pace moves.
  const paces = actualDays.slice(0, -1).map((v, i) => v / (plan[i] || 1));
  const pace = mean(paces);
  const sd = Math.sqrt(sum(paces.map((p) => (p - pace) ** 2)) / Math.max(1, paces.length - 1));
  const spread = (1.28 * sd) / Math.sqrt(paces.length);
  const ratio = actual / (toDate || 1);
  const budget = "budget" in t && t.budget;
  const status =
    ratio > 1.02
      ? budget
        ? "over"
        : "ahead"
      : ratio < 0.98
        ? budget
          ? "under"
          : "behind"
        : "on_pace";
  return {
    label: (METRICS[t.id] as MetricDefinition).label + (budget ? " budget" : ""),
    format: t.format,
    actual: Math.round(actual),
    toDate: Math.round(toDate),
    target: Math.round(sum(plan)),
    forecast: Math.round(actual + remaining * pace),
    forecastLow: Math.round(actual + remaining * (pace - spread)),
    forecastHigh: Math.round(actual + remaining * (pace + spread)),
    status,
    goodDirection: budget ? ("down" as const) : ("up" as const),
  };
}

/**
 * Each ad platform's October budget and how it is burning: the plan (last
 * year's same weekdays, +6%) as the budget, spend so far by day, and the
 * month-end forecast at the pace so far, the same rule as the ad budget
 * target. Spend follows the storefront's share of sales, as the target does,
 * so the platforms add up to it for any channel filter.
 */
function adBudgets(chs: Channel[]) {
  const planShare = wholeDays(() => storefrontShare(chs, MONTH_DAYS, MONTH_LAST_YEAR));
  const plans = wholeDays(() => adSpendDaily(MONTH_DAYS, MONTH_LAST_YEAR)).platforms;
  const share = storefrontShare(chs, MONTH_ELAPSED, 0);
  const elapsed = (MONTH_ELAPSED - 1 + storefrontShareSoFar()) / MONTH_DAYS;
  return adSpendDaily(MONTH_ELAPSED, 0).platforms.flatMap((p) => {
    const plan = plans
      .find((q) => q.key === p.key)!
      .daily.map((v, i) => v * PLAN.adSpend * planShare[i]!);
    const budget = sum(plan);
    if (budget <= 0) return [];
    let running = 0;
    const burn = p.daily.map((v, i) => (running += v * share[i]!));
    const spent = running;
    const pace = spent / (planToDate(plan) || 1);
    const projected = spent + (budget - planToDate(plan)) * pace;
    return [
      {
        name: p.label,
        budget: Math.round(budget),
        spent: Math.round(spent),
        burn: burn.map(Math.round),
        elapsed: round(elapsed * 100, 1),
        projected: Math.round(projected),
        pace: Math.round(pace * 100),
        status:
          pace > 1.02
            ? ("over" as const)
            : pace < 0.98
              ? ("under" as const)
              : ("on_track" as const),
      },
    ];
  });
}

// ── Orders by hour ─────────────────────────────────────────────────────────

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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Average orders per hour by weekday over the whole days of the range (ending
 * yesterday, so today's open hours don't skew it): each day's real orders per
 * channel, spread over the hours by that channel's profile.
 */
function ordersByHour(range: Range, channel: string) {
  const days = RANGE_DAYS[range];
  const chs = channelsFor(channel);
  const rows = WEEKDAYS.map(() => new Array<number>(24).fill(0));
  const seen = new Array<number>(7).fill(0);
  for (const ch of chs) {
    // Whole days: only today is cut to the hours gone, and today is left out.
    const orders = wholeDays(() => series([ch], "orders", days, 1));
    orders.forEach((n, i) => {
      const js = dayOfWeek(days - i);
      const row = (js + 6) % 7;
      if (ch === chs[0]) seen[row]! += 1;
      hourShares(ch, js === 0 || js === 6).forEach((s, h) => (rows[row]![h]! += n * s));
    });
  }
  const values = rows.map((r, w) => r.map((v) => round(v / (seen[w] || 1), 1)));
  let peak = { w: 0, h: 0 };
  values.forEach((r, w) => r.forEach((v, h) => v > values[peak.w]![peak.h]! && (peak = { w, h })));
  const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return {
    rows: values.map((v, w) => ({ label: WEEKDAYS[w]!, values: v })),
    columns: Array.from({ length: 24 }, (_, h) => hour(h)),
    peak: `${WEEKDAYS[peak.w]} ${hour(peak.h)}, ${formatNumber(values[peak.w]![peak.h]!)} orders an hour`,
    rule: `Average orders per hour, the ${days} whole days to yesterday, UTC · busiest ${WEEKDAYS[peak.w]} ${hour(peak.h)}`,
  };
}

// ── Live: the last hour ────────────────────────────────────────────────────

/** The hour's share of the day's traffic, for the last hour. */
const AFTERNOON_LIFT = 1.18;

/** Hours of today gone by AS_OF (3:48 PM): 15 whole hours and most of the 16th. */
const HOURS_SO_FAR = MINUTES_SO_FAR / 60;

/** The share of a day's orders that comes in before `hours` (fractional hours count part of the hour). */
function shareBy(ch: Channel, weekend: boolean, hours: number): number {
  const shares = hourShares(ch, weekend);
  const whole = Math.floor(hours);
  return sum(shares.slice(0, whole)) + (shares[whole] ?? 0) * (hours - whole);
}

/**
 * Today so far against yesterday at the same time, by hour, and where today
 * closes at this pace. Each channel's sales today are spread over the hours by
 * its profile and scaled so the hours add up to the sales so far; yesterday is
 * the whole day spread the same way. The projected close divides the sales so
 * far by the share a day usually has in by now; its 80% range comes from how
 * much the same weekday varied over the last 8 weeks, on the part of the day
 * still to come.
 */
function todaySoFar() {
  const front = STOREFRONT;
  const weekendOn = (ago: number) => [0, 6].includes(dayOfWeek(ago));
  const hourly = (ago: number, field: Field, upTo: number) => {
    const out = new Array<number>(24).fill(0);
    for (const ch of front) {
      const whole = wholeDays(() => series([ch], field, 1, ago))[0]!;
      const shares = hourShares(ch, weekendOn(ago));
      // Today: what has come in so far, spread over the hours gone.
      const scale = ago === 0 ? series([ch], field, 1, 0)[0]! / (shareSoFar(ch) || 1) : whole;
      for (let h = 0; h < 24; h++) {
        const part = h + 1 <= upTo ? 1 : h < upTo ? upTo - h : 0;
        out[h] += scale * shares[h]! * part;
      }
    }
    return out;
  };
  const today = hourly(0, "total", HOURS_SO_FAR);
  const yesterday = hourly(1, "total", 24);
  const salesNow = sum(today);
  const sameTime = (ago: number, field: Field) =>
    sum(
      front.map(
        (ch) =>
          wholeDays(() => series([ch], field, 1, ago))[0]! *
          shareBy(ch, weekendOn(ago), HOURS_SO_FAR),
      ),
    );
  // Each channel's sales so far over the share of its day usually in by now.
  const projected = sum(front.map((ch) => series([ch], "total", 1, 0)[0]! / (shareSoFar(ch) || 1)));
  const sharesNow = salesNow / (projected || 1);
  // The same weekday's whole days over the last 8 weeks, for the spread.
  const weekdays = Array.from({ length: 8 }, (_, w) =>
    sum(front.map((ch) => wholeDays(() => series([ch], "total", 1, 7 * (w + 1)))[0]!)),
  );
  const cv = Math.sqrt(sum(weekdays.map((v) => (v - mean(weekdays)) ** 2)) / 7) / mean(weekdays);
  const spread = 1.2816 * cv * projected * (1 - sharesNow);
  const ordersNow = series(front, "orders", 1, 0)[0]!;
  const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return {
    hours: Array.from({ length: 24 }, (_, h) => hourLabel(h)),
    // Only whole hours: the hour in progress would read as a drop.
    hourlyToday: today.slice(0, Math.floor(HOURS_SO_FAR)).map(Math.round),
    hourlyYesterday: yesterday.map(Math.round),
    todayMetrics: [
      metric("today_sales", salesNow, sameTime(1, "total"), formatCurrency, {
        hint: `Since midnight UTC, against yesterday by ${AS_OF.split(", ")[1]}`,
      }),
      metric("today_orders", ordersNow, sameTime(1, "orders"), formatNumber, {
        hint: "Online store and app",
      }),
      metric(
        "today_projected",
        projected,
        wholeDays(() => series(front, "total", 1, 1))[0]!,
        formatCurrency,
        {
          hint: `80% range ${formatCurrency(projected - spread)}–${formatCurrency(projected + spread)}`,
        },
      ),
    ],
  };
}

function liveView() {
  const front = STOREFRONT;
  const perMinute = (field: Field) =>
    (series(front, field, 1, 0)[0]! / MINUTES_SO_FAR) * AFTERNOON_LIFT;
  const next = random("live");
  // Twelve steps of five minutes from 2:50; the last, now, is 3 minutes in.
  const steps = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 3];
  const labels = steps.map((_, k) => {
    const minute = 50 + k * 5;
    return `${minute >= 60 ? 3 : 2}:${String(minute % 60).padStart(2, "0")}`;
  });
  const bucket = (field: Field) =>
    steps.map((m) => Math.round(perMinute(field) * m * (0.85 + next() * 0.3)));
  const sessions = bucket("sessions");
  const orders = bucket("orders");
  // The same five minutes a week ago, and every step as a rate per 5 minutes
  // so the step still in progress does not read as a drop.
  const weekRate = (series(front, "sessions", 1, 7)[0]! / MINUTES_SO_FAR) * AFTERNOON_LIFT;
  const per5 = (values: number[]) => values.map((v, k) => Math.round((v / steps[k]!) * 5));
  const sessionsWeekAgo = steps.map(() => Math.round(weekRate * 5 * (0.88 + next() * 0.24)));
  const aov = sum(series(front, "total", 1, 0)) / sum(series(front, "orders", 1, 0));
  const sales = orders.map((o) => Math.round(o * aov * (0.9 + next() * 0.2)));
  // The same hour a week ago, for the comparison: that day's hours to 3:48 PM
  // at the same afternoon rate as today, as the sessions chart compares them.
  const weekAgo = (field: Field) =>
    (series(front, field, 1, 7)[0]! / MINUTES_SO_FAR) * AFTERNOON_LIFT * 58;
  const hour = { sessions: sum(sessions), orders: sum(orders), sales: sum(sales) };
  const views = Math.round(hour.sessions * 0.57);
  const carts = Math.round(views * 0.22);
  const checkouts = Math.round(carts * 0.48);
  const products = productSales("7d", "all")
    .map((p) => ({ name: p.name, value: Math.round((p.units / 7 / 24) * (0.6 + next() * 0.8)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const tile = (
    id: MetricId,
    now: number,
    then: number,
    format: (v: number) => string,
    series: number[],
  ) =>
    metric(id, now, then, format, {
      series,
      hint: "Last 58 minutes, against the same time a week ago",
    });
  return {
    asOf: AS_OF,
    labels,
    sessions: per5(sessions),
    sessionsWeekAgo,
    visitorsNow: Math.round(perMinute("sessions") * 5 * 1.6),
    metrics: [
      tile("live_sessions", hour.sessions, weekAgo("sessions"), formatNumber, per5(sessions)),
      tile("live_orders", hour.orders, weekAgo("orders"), formatNumber, per5(orders)),
      tile("live_sales", hour.sales, weekAgo("total"), formatCurrency, per5(sales)),
      tile(
        "live_conversion",
        (hour.orders / hour.sessions) * 100,
        (weekAgo("orders") / weekAgo("sessions")) * 100,
        (v) => `${v.toFixed(2)}%`,
        orders.map((o, i) => (o / (sessions[i] || 1)) * 100),
      ),
    ],
    funnel: [
      { label: "Sessions", value: hour.sessions },
      { label: "Viewed a product", value: views },
      { label: "Added to cart", value: carts },
      { label: "Began checkout", value: checkouts },
      { label: "Purchased", value: hour.orders },
    ],
    products: products.map((p) => ({ name: p.name, value: p.value })) as Item[],
    ...todaySoFar(),
  };
}

// ── Ad creatives ─────────────────────────────────────────────────────────────

const CREATIVES = [
  {
    name: "Trail Runner 2: hill sprint",
    platform: "meta",
    format: "Video",
    weight: 0.3,
    roas: 1.25,
    hook: 0.34,
    hold: 0.42,
    ctr: 0.0142,
    frequency: 2.1,
    trend: 0.04,
  },
  {
    name: "Merino layering carousel",
    platform: "meta",
    format: "Carousel",
    weight: 0.24,
    roas: 1.15,
    hook: 0,
    hold: 0,
    ctr: 0.0118,
    frequency: 2.6,
    trend: -0.06,
  },
  {
    name: "Founder story",
    platform: "meta",
    format: "Video",
    weight: 0.26,
    roas: 0.8,
    hook: 0.22,
    hold: 0.31,
    ctr: 0.0081,
    frequency: 4.4,
    trend: -0.31,
  },
  {
    name: "Fall sale static",
    platform: "meta",
    format: "Static",
    weight: 0.2,
    roas: 0.75,
    hook: 0,
    hold: 0,
    ctr: 0.0072,
    frequency: 3.9,
    trend: -0.24,
  },
  {
    name: "Unboxing with a creator",
    platform: "tiktok",
    format: "Video",
    weight: 0.45,
    roas: 1.3,
    hook: 0.41,
    hold: 0.28,
    ctr: 0.0109,
    frequency: 1.8,
    trend: 0.02,
  },
  {
    name: "Trend sound: tote packing",
    platform: "tiktok",
    format: "Video",
    weight: 0.55,
    roas: 0.75,
    hook: 0.29,
    hold: 0.17,
    ctr: 0.0064,
    frequency: 3.6,
    trend: -0.28,
  },
  {
    name: "Search: brand terms",
    platform: "google",
    format: "Search",
    weight: 0.35,
    roas: 1.6,
    hook: 0,
    hold: 0,
    ctr: 0.081,
    frequency: 0,
    trend: 0.01,
  },
  {
    name: "Shopping: footwear",
    platform: "google",
    format: "Shopping",
    weight: 0.4,
    roas: 0.85,
    hook: 0,
    hold: 0,
    ctr: 0.0124,
    frequency: 0,
    trend: -0.03,
  },
  {
    name: "Performance Max",
    platform: "google",
    format: "Mixed",
    weight: 0.25,
    roas: 0.6,
    hook: 0,
    hold: 0,
    ctr: 0.0091,
    frequency: 0,
    trend: -0.09,
  },
] as const;

/**
 * Each ad's share of its platform: spend by weight, revenue by weight times
 * its relative ROAS, scaled so each platform's ads add up to the platform's
 * spend and store-attributed revenue.
 */
function creatives(range: Range, platform: string) {
  const days = RANGE_DAYS[range];
  const breakEven = breakEvenRoas(days);
  const channels = marketing(range).channels;
  return CREATIVES.filter((c) => platform === "all" || c.platform === platform).map((c) => {
    const ch = channels.find((x) => x.m.key === c.platform)!;
    const peers = CREATIVES.filter((x) => x.platform === c.platform);
    const spend = ch.spend * c.weight;
    const revenue = (ch.revenue * c.weight * c.roas) / sum(peers.map((x) => x.weight * x.roas));
    const roas = revenue / spend;
    const fatigued = c.frequency > 3.5 && c.trend < -0.2;
    return {
      name: c.name,
      platform: ch.m.label,
      format: c.format,
      spend: Math.round(spend),
      revenue: Math.round(revenue),
      roas: round(roas, 2),
      ctr: round(c.ctr, 4),
      ctrChange: round(c.trend * 100),
      ...(c.hook ? { hookRate: c.hook, holdRate: c.hold } : {}),
      ...(c.frequency ? { frequency: c.frequency } : {}),
      fatigue: fatigued
        ? ("Fatigued" as const)
        : c.trend < -0.05
          ? ("Watch" as const)
          : ("Fresh" as const),
      belowBreakEven: roas < breakEven,
    };
  });
}

// ── Recommended actions ──────────────────────────────────────────────────────

/**
 * What to do next, each computed from the same numbers the dashboards show,
 * with its expected effect. Approving one in the demo only writes to a log.
 */
function recommendedActions(range: Range) {
  const days = RANGE_DAYS[range];
  const breakEven = breakEvenRoas(days);
  const items = inventory();
  const runner = items.find((i) => i.sku === "FTW-TRL-01")!;
  const beanie = items.find((i) => i.sku === "ACC-BEA-03")!;
  const tiktok = marketing(range).channels.find((c) => c.m.key === "tiktok")!;
  const tiktokRoas = tiktok.revenue / tiktok.spend;
  // A dollar of ad spend returns ROAS ÷ break-even in profit before marketing.
  const cut = 0.3 * tiktok.spend;
  const saved = cut * (1 - tiktokRoas / breakEven);
  const atRisk = run.segments().find((s) => s.name === "At risk")!;
  const winBack = atRisk.customers * 0.04 * 82 * 0.46;
  const boot = productSales(range, "all").find((p) => p.sku === "FTW-DBT-03")!;
  const extraReturns = boot.revenue * (boot.returnRate - 0.11);
  const actions = [
    {
      id: "reorder-trail-runner",
      title: `Order ${formatNumber(runner.suggestedOrder ?? 0)} more ${runner.name}`,
      detail: `It sells ${runner.dailySales.toFixed(0)} a day and runs out in ${runner.daysOfCover.toFixed(0)} days, ${Math.ceil(runner.stockoutGapDays)} days before the open order lands.`,
      impact: runner.revenueAtRisk,
      impactText: `${formatCurrency(runner.revenueAtRisk)} of sales protected`,
      owner: "Merchandising",
      effort: "Low",
    },
    {
      id: "cut-tiktok",
      title: "Cut TikTok spend by 30%",
      detail: `Its ROAS is ${tiktokRoas.toFixed(2)}x against a ${breakEven.toFixed(2)}x break-even, so each dollar loses ${formatCurrency(1 - tiktokRoas / breakEven)} of profit. Keep the unboxing video; pause the trend-sound ad.`,
      impact: saved,
      impactText: `${formatCurrency(saved)} more contribution profit per ${days} days`,
      owner: "Marketing",
      effort: "Low",
    },
    {
      id: "pause-beanie-ads",
      title: `Pause ads for ${beanie.name} until stock lands`,
      detail: `It is out of stock, and ${formatCurrency(beanie.adSpendPerDay)} a day of ads still send shoppers to it. ${formatNumber(beanie.incoming ?? 0)} units land in ${beanie.incomingInDays} days.`,
      impact: beanie.adSpendPerDay * (beanie.incomingInDays ?? 0),
      impactText: `${formatCurrency(beanie.adSpendPerDay * (beanie.incomingInDays ?? 0))} of ad spend saved`,
      owner: "Marketing",
      effort: "Low",
    },
    {
      id: "win-back-at-risk",
      title: `Send a win-back offer to ${formatNumber(atRisk.customers)} at-risk customers`,
      detail: `They last ordered ${atRisk.daysSinceOrder} days ago on average, past the ${lapsePoint().days}-day lapse point. A 4% response at the usual order size and margin pays for a modest offer.`,
      impact: winBack,
      impactText: `${formatCurrency(winBack)} of contribution profit if 4% order`,
      owner: "Retention",
      effort: "Medium",
    },
    {
      id: "fit-note-desert-boot",
      title: `Add a fit note to ${boot.name}`,
      detail: `${Math.round(boot.returnRate * 100)}% of units come back, against 11% for footwear, mostly for size. Footwear exchanges show it runs small.`,
      impact: extraReturns / 2,
      impactText: `${formatCurrency(extraReturns / 2)} fewer refunds if half the extra returns stop`,
      owner: "Merchandising",
      effort: "Low",
    },
  ];
  return actions
    .sort((a, b) => b.impact - a.impact)
    .map(({ impact, ...a }) => ({ ...a, impact: Math.round(impact) }));
}

/** Handlers other handlers reuse. */
const run = {
  segments: () =>
    (
      ecommerceHandlers.get_customer_segments!({}) as {
        segments: { name: string; customers: number; daysSinceOrder: number }[];
      }
    ).segments,
};

// ── Sale command center: Black Friday Cyber Monday 2026 ─────────────────────

/** Black Friday 2026 is Nov 27, 48 days after today; Cyber Monday is Nov 30. */
const BFCM_2026 = { from: -48, to: -51 };

function salePlan() {
  const ly = STORE_EVENTS.find((e) => e.id === "bfcm-2025")!;
  const all = channelsFor("all");
  // Two weeks before Black Friday to two weeks after Cyber Monday, last year,
  // on the same weekdays (52 weeks earlier).
  const start = ly.from + 14;
  const end = ly.to - 14;
  const n = start - end + 1;
  const lastYear = wholeDays(() => series(all, "total", n, end));
  const plan = lastYear.map((v) => v * PLAN.volume);
  const day = (ago: number) => dateLabel(ago, true);
  const labels = Array.from({ length: n }, (_, i) => dateLabel(start - i - LAST_YEAR));
  const inSale = (i: number) => start - i <= ly.from && start - i >= ly.to;
  const saleSales = sum(plan.filter((_, i) => inSale(i)));
  const lyOrders = wholeDays(() => series(all, "orders", 4, ly.to));
  const saleOrders = sum(lyOrders) * PLAN.volume;
  const lyAds = wholeDays(() => sum(adSpendDaily(4, ly.to).paid));
  // Buying for the sale: normal reorders cover a normal pace, so the sale
  // needs its planned units over the four days minus four normal days, on
  // order a lead time and safety stock before Black Friday.
  const products = productSales("30d", "all");
  const units = sum(products.map((p) => p.units));
  const extra = inventory()
    .map((item) => {
      const p = products.find((x) => x.sku === item.sku)!;
      const planned = (p.units / units) * saleOrders * 1.62;
      return {
        name: item.name,
        key: item.sku,
        value: Math.round(Math.max(0, planned - 4 * item.dailySales)),
      };
    })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  const orderBy = dateLabel(BFCM_2026.from + LEAD_TIME + SAFETY_DAYS);
  const tile = (id: MetricId, value: string, hint: string) => ({
    label: (METRICS[id] as MetricDefinition).label,
    value,
    hint,
    definition: definitionOf(id),
  });
  return {
    event: "Black Friday Cyber Monday 2026",
    detail: `${day(BFCM_2026.from)} – ${day(BFCM_2026.to)}, ${-BFCM_2026.from} days from today`,
    daysToGo: -BFCM_2026.from,
    labels,
    lastYear: lastYear.map(Math.round),
    plan: plan.map(Math.round),
    events: [
      {
        label: "Black Friday to Cyber Monday",
        start: dateLabel(ly.from - LAST_YEAR),
        end: dateLabel(ly.to - LAST_YEAR),
        kind: "promo" as const,
        detail: "Planned at last year's same weekdays, plus 12%",
      },
    ],
    metrics: [
      tile("sale_sales", formatCurrency(saleSales), "Four days, last year's plus 12%"),
      tile("sale_orders", formatNumber(saleOrders), "Four days"),
      tile("sale_ad_budget", formatCurrency(lyAds * PLAN.adSpend), "Last year's spend plus 6%"),
      tile(
        "sale_extra_units",
        formatNumber(sum(extra.map((x) => x.value))),
        `Across ${extra.length} products; order by ${orderBy}`,
      ),
    ],
    orderBy,
    extraUnits: extra.slice(0, 8) as Item[],
  };
}

// ── Products and inventory ─────────────────────────────────────────────────

const PRODUCTS = [
  {
    sku: "APP-TEE-01",
    name: "Everyday Crew Tee",
    category: "apparel",
    price: 32,
    weight: 1.6,
    cart: 0.16,
    ret: 0.09,
    margin: 0.62,
  },
  {
    sku: "APP-SWT-02",
    name: "Merino Crew Sweater",
    category: "apparel",
    price: 98,
    weight: 0.9,
    cart: 0.11,
    ret: 0.12,
    margin: 0.57,
  },
  {
    sku: "APP-OVS-03",
    name: "Linen Overshirt",
    category: "apparel",
    price: 78,
    weight: 0.7,
    cart: 0.1,
    ret: 0.13,
    margin: 0.56,
  },
  {
    sku: "APP-HOO-04",
    name: "Organic Cotton Hoodie",
    category: "apparel",
    price: 88,
    weight: 1.0,
    cart: 0.12,
    ret: 0.1,
    margin: 0.58,
  },
  {
    sku: "APP-CHN-05",
    name: "Relaxed Chino",
    category: "apparel",
    price: 84,
    weight: 0.6,
    cart: 0.09,
    ret: 0.16,
    margin: 0.55,
  },
  {
    sku: "FTW-TRL-01",
    name: "Trail Runner 2",
    category: "footwear",
    price: 138,
    weight: 1.1,
    cart: 0.13,
    ret: 0.12,
    margin: 0.47,
  },
  {
    sku: "FTW-CNV-02",
    name: "Canvas Low",
    category: "footwear",
    price: 68,
    weight: 1.2,
    cart: 0.14,
    ret: 0.11,
    margin: 0.49,
  },
  {
    sku: "FTW-DBT-03",
    name: "Suede Desert Boot",
    category: "footwear",
    price: 168,
    weight: 0.45,
    cart: 0.08,
    ret: 0.19,
    margin: 0.45,
  },
  {
    sku: "FTW-SLD-04",
    name: "Weekend Slide",
    category: "footwear",
    price: 42,
    weight: 0.7,
    cart: 0.12,
    ret: 0.07,
    margin: 0.51,
  },
  {
    sku: "ACC-TOT-01",
    name: "Canvas Tote",
    category: "accessories",
    price: 38,
    weight: 1.0,
    cart: 0.17,
    ret: 0.02,
    margin: 0.67,
  },
  {
    sku: "ACC-WAL-02",
    name: "Leather Card Wallet",
    category: "accessories",
    price: 52,
    weight: 0.8,
    cart: 0.14,
    ret: 0.03,
    margin: 0.66,
  },
  {
    sku: "ACC-BEA-03",
    name: "Wool Beanie",
    category: "accessories",
    price: 28,
    weight: 0.9,
    cart: 0.18,
    ret: 0.02,
    margin: 0.64,
  },
  {
    sku: "ACC-CAP-04",
    name: "Sunday Cap",
    category: "accessories",
    price: 34,
    weight: 0.7,
    cart: 0.15,
    ret: 0.04,
    margin: 0.65,
  },
  {
    sku: "HOM-MUG-01",
    name: "Stoneware Mug Set",
    category: "home",
    price: 46,
    weight: 0.8,
    cart: 0.13,
    ret: 0.05,
    margin: 0.6,
  },
  {
    sku: "HOM-THR-02",
    name: "Linen Throw",
    category: "home",
    price: 112,
    weight: 0.55,
    cart: 0.09,
    ret: 0.04,
    margin: 0.61,
  },
  {
    sku: "HOM-CDL-03",
    name: "Soy Candle Trio",
    category: "home",
    price: 36,
    weight: 0.9,
    cart: 0.16,
    ret: 0.03,
    margin: 0.63,
  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Apparel",
  footwear: "Footwear",
  accessories: "Accessories",
  home: "Home",
};

/** The calendar's stockout for a product, if it has one. */
const stockoutOf = (name: string) =>
  STORE_EVENTS.find((e) => e.kind === "stockout" && e.label.startsWith(name));

function productSales(range: Range, channel: string, type: CustomerType = "all") {
  const chs = channelsFor(channel);
  const storefront = chs.filter((c) => STOREFRONT.includes(c));
  // New customers start with the cheaper products; returning ones trade up.
  const tilt = (price: number) =>
    type === "new" ? (40 / price) ** 0.35 : type === "returning" ? (price / 40) ** 0.2 : 1;
  const weights = PRODUCTS.map(
    (p) => p.weight * tilt(p.price) * between(`w:${p.sku}:${channel}`, 0.85, 1.15),
  );
  const totalWeight = sum(weights);
  const orderDays = current(chs, "orders", range, type);
  const units = sum(orderDays) * 1.62;
  const prevUnits = sum(previous(chs, "orders", range, type)) * 1.62;
  const discountRate =
    sum(current(chs, "discounts", range, type)) / sum(current(chs, "gross", range, type));
  const prevDiscountRate =
    sum(previous(chs, "discounts", range, type)) / sum(previous(chs, "gross", range, type));
  const storefrontShare = storefront.length
    ? sum(current(storefront, "orders", range, type)) / sum(current(chs, "orders", range, type))
    : 0;
  const views = storefront.length ? sum(current(storefront, "sessions", range, type)) * 0.565 : 0;
  // A sold-out product sells nothing on its days out (index d is days − 1 − d ago).
  const inStock = PRODUCTS.map((p) => {
    const out = stockoutOf(p.name);
    return orderDays.map((_, d) => {
      const ago = orderDays.length - 1 - d;
      return out && ago <= out.from && ago >= out.to ? 0 : 1;
    });
  });
  const raw = PRODUCTS.map((p, i) => {
    const u =
      (units *
        weights[i] *
        between(`s:${p.sku}:${range}:${channel}`, 0.88, 1.18) *
        (sum(orderDays.map((o, d) => o * inStock[i][d])) / sum(orderDays))) /
      totalWeight;
    const pu =
      (prevUnits * weights[i] * between(`p:${p.sku}:${range}:${channel}`, 0.9, 1.1)) / totalWeight;
    return {
      units: u,
      revenue: u * p.price * (1 - discountRate) * (1 - p.ret),
      prevRevenue: pu * p.price * (1 - prevDiscountRate) * (1 - p.ret),
    };
  });
  // Product revenue is net sales, so the products add up to the store's net sales.
  const scale = sum(current(chs, "net", range, type)) / sum(raw.map((r) => r.revenue));
  const prevScale = sum(previous(chs, "net", range, type)) / sum(raw.map((r) => r.prevRevenue));
  return PRODUCTS.map((p, i) => {
    const u = Math.round(raw[i].units * scale);
    const revenue = raw[i].revenue * scale;
    const prevRevenue = raw[i].prevRevenue * prevScale;
    const v = Math.round((views * weights[i] * between(`v:${p.sku}`, 0.85, 1.15)) / totalWeight);
    const addToCartRate = p.cart * between(`c:${p.sku}:${range}`, 0.9, 1.1);
    const purchases = (u * storefrontShare) / 1.15;
    const unitsDaily = orderDays.map(
      (o, d) =>
        ((o * 1.62 * weights[i] * scale * inStock[i][d]) / totalWeight) *
        between(`d:${p.sku}:${d}`, 0.75, 1.25),
    );
    return {
      ...p,
      units: u,
      trend: downsample(unitsDaily, 14).map((v) => round(v)),
      revenue: round(revenue, 2),
      change: round(((revenue - prevRevenue) / prevRevenue) * 100),
      ...(v > 0
        ? {
            views: v,
            addToCartRate: round(addToCartRate, 4),
            conversionRate: round(Math.min(purchases / v, addToCartRate * 0.55), 4),
          }
        : {}),
      returnRate: round(p.ret * between(`r:${p.sku}:${range}`, 0.9, 1.1), 4),
    };
  });
}

/** Days of cover each product has today; a few are deliberately tight. */
const STOCK_PLAN: Record<string, { cover?: number; incoming?: number; inDays?: number }> = {
  "FTW-TRL-01": { cover: 5.8, incoming: 1200, inDays: 9 },
  "ACC-BEA-03": { cover: 0, incoming: 800, inDays: 4 },
  "HOM-THR-02": { cover: 9.5 },
  "APP-SWT-02": { cover: 12, incoming: 600, inDays: 15 },
  "FTW-CNV-02": { cover: 17 },
};

let inventoryCache: ReturnType<typeof buildInventory> | undefined;
const inventory = () => (inventoryCache ??= buildInventory());

/** Days from placing a purchase order to stock on the shelf, and the safety stock on top. */
const LEAD_TIME = 14;
const SAFETY_DAYS = 7;

function buildInventory() {
  const sales = productSales("30d", "all");
  const net = sum(sales.map((p) => p.revenue));
  const adsPerDay = sum(adSpendDaily(30, 0).paid) / 30;
  return sales.map((p) => {
    const plan = STOCK_PLAN[p.sku] ?? {};
    // Velocity counts only the days the product was in stock, so a sold-out
    // product isn't mistaken for a slow one.
    const out = stockoutOf(p.name);
    const daysOut = out ? out.from - out.to + 1 : 0;
    const dailySales = p.units / (30 - daysOut);
    const unitRevenue = p.revenue / Math.max(1, p.units);
    const cover = plan.cover ?? between(`cover:${p.sku}`, 26, 75);
    const stock = Math.round(dailySales * cover);
    const reorderPoint = Math.round(dailySales * (LEAD_TIME + SAFETY_DAYS));
    const incoming = plan.incoming ?? 0;
    const suggested = Math.max(0, Math.ceil((dailySales * 45 - stock - incoming) / 50) * 50);
    // An open order counts toward cover: the next order is due when stock on
    // hand plus what's already ordered runs down to lead time plus safety.
    const orderIn = Math.floor((stock + incoming) / dailySales - LEAD_TIME - SAFETY_DAYS);
    // Days with nothing to sell: until the open order lands, or a new order would.
    const landsIn = plan.inDays ?? LEAD_TIME;
    const gap = Math.max(0, landsIn - stock / dailySales);
    return {
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitCost: p.price * (1 - p.margin),
      stock,
      reorderPoint,
      dailySales: round(dailySales),
      daysOfCover: round(stock / dailySales),
      ...(incoming ? { incoming, incomingInDays: plan.inDays } : {}),
      ...(suggested ? { suggestedOrder: suggested } : {}),
      replenishBy: orderIn > 0 ? dateLabel(-orderIn) : "Now",
      ...(orderIn < 0 ? { daysLate: -orderIn } : {}),
      stockoutGapDays: round(gap),
      revenueAtRisk: Math.round(gap * dailySales * unitRevenue),
      ...(daysOut ? { lostRevenue: Math.round(daysOut * dailySales * unitRevenue) } : {}),
      adSpendPerDay: Math.round((p.revenue / net) * adsPerDay),
    };
  });
}

/** Cover above this many days ties up cash: a candidate to discount rather than reorder. */
const SLOW_COVER = 60;

/**
 * Every SKU's stock health, most urgent first: ABC class by its share of the
 * last 30 days' revenue (A up to 80% cumulative, B to 95%, C the rest), days
 * of cover against the reorder point (lead time plus safety stock), a status,
 * and what to do about it. Plus a sentence on how concentrated revenue is.
 */
function inventoryCatalog(items: ReturnType<typeof inventory>) {
  const revenue = new Map(productSales("30d", "all").map((p) => [p.sku, p.revenue]));
  const ranked = [...items].sort((a, b) => (revenue.get(b.sku) ?? 0) - (revenue.get(a.sku) ?? 0));
  const total = sum(ranked.map((i) => revenue.get(i.sku) ?? 0)) || 1;
  let running = 0;
  const abc = new Map(
    ranked.map((i) => {
      const before = running / total;
      running += revenue.get(i.sku) ?? 0;
      return [i.sku, before < 0.8 ? "A" : before < 0.95 ? "B" : "C"] as const;
    }),
  );
  const rank = { "Out of stock": 0, "Reorder now": 1, "Slow mover": 2, Healthy: 3 } as const;
  const catalog = items
    .map((i) => {
      const status: keyof typeof rank =
        i.stock === 0
          ? "Out of stock"
          : i.stock < i.reorderPoint
            ? "Reorder now"
            : i.daysOfCover > SLOW_COVER
              ? "Slow mover"
              : "Healthy";
      return {
        name: i.name,
        sku: i.sku,
        category: CATEGORY_LABELS[i.category] ?? i.category,
        abc: abc.get(i.sku)!,
        revenue: Math.round(revenue.get(i.sku) ?? 0),
        stock: i.stock,
        dailySales: i.dailySales,
        daysOfCover: i.daysOfCover,
        reorderAt: LEAD_TIME + SAFETY_DAYS,
        status,
        action:
          status === "Out of stock"
            ? i.incoming
              ? `Expedite PO (${formatNumber(i.incoming)} units)`
              : "Order now"
            : status === "Reorder now"
              ? i.incoming
                ? `PO lands in ${i.incomingInDays} days`
                : `Order ${formatNumber(i.suggestedOrder ?? 0)}`
              : status === "Slow mover"
                ? `Discount: ${formatCurrency(i.stock * i.unitCost)} at cost`
                : "",
      };
    })
    .sort((a, b) => rank[a.status] - rank[b.status] || b.revenue - a.revenue);
  const aSkus = catalog.filter((c) => c.abc === "A");
  const aShort = aSkus.filter((c) => c.status === "Out of stock" || c.status === "Reorder now");
  return {
    catalog,
    concentration: `${aSkus.length} of ${catalog.length} products make 80% of the last 30 days' revenue${aShort.length ? `; ${aShort.length} of them ${aShort.length === 1 ? "is" : "are"} below the reorder point` : ""}.`,
  };
}

function stockStatus(sku: string): "In stock" | "Low stock" | "Out of stock" {
  const item = inventory().find((i) => i.sku === sku);
  if (!item || item.stock === 0) return "Out of stock";
  return item.stock < item.reorderPoint ? "Low stock" : "In stock";
}

// ── Purchase and checkout journeys (storefront and app) ───────────────────

const DEVICES = {
  desktop: {
    label: "Desktop",
    sessions: 0.37,
    orders: 0.48,
    view: 0.58,
    cart: 0.25,
    checkout: 0.52,
    ship: 0.86,
    pay: 0.86,
    prevPay: 0.86,
    aov: 1.12,
  },
  mobile: {
    label: "Mobile",
    sessions: 0.58,
    orders: 0.47,
    view: 0.56,
    cart: 0.21,
    checkout: 0.45,
    ship: 0.81,
    pay: 0.74,
    prevPay: 0.78,
    aov: 0.9,
  },
  tablet: {
    label: "Tablet",
    sessions: 0.05,
    orders: 0.05,
    view: 0.6,
    cart: 0.23,
    checkout: 0.5,
    ship: 0.84,
    pay: 0.8,
    prevPay: 0.8,
    aov: 1.02,
  },
};
type Device = keyof typeof DEVICES;

function journey(range: Range, device: string, period: "current" | "previous") {
  const get = period === "current" ? current : previous;
  const sessions = sum(get(STOREFRONT, "sessions", range));
  const orders = sum(get(STOREFRONT, "orders", range));
  const devices = (device === "all" ? Object.keys(DEVICES) : [device]) as Device[];
  const t = {
    sessions: 0,
    views: 0,
    carts: 0,
    checkouts: 0,
    shipping: 0,
    payment: 0,
    purchases: 0,
  };
  for (const d of devices) {
    const r = DEVICES[d];
    const cartRate = period === "current" ? r.cart : r.cart * 0.97;
    const s = sessions * r.sessions;
    const views = s * r.view;
    const carts = views * cartRate;
    const checkouts = carts * r.checkout;
    const shipping = checkouts * r.ship;
    t.sessions += s;
    t.views += views;
    t.carts += carts;
    t.checkouts += checkouts;
    t.shipping += shipping;
    t.payment += shipping * (period === "current" ? r.pay : r.prevPay);
    t.purchases += orders * r.orders;
  }
  return t;
}

// ── Tool handlers ──────────────────────────────────────────────────────────

const pct = (v: number) => `${v.toFixed(2)}%`;
const times = (v: number) => `${v.toFixed(2)}x`;

const CUSTOMERS = [
  "Maya Chen",
  "Liam Okafor",
  "Sofia Rossi",
  "Noah Patel",
  "Ava Müller",
  "Ethan Brooks",
  "Zara Ahmed",
  "Lucas Silva",
  "Emma Johansson",
  "Kai Nakamura",
  "Priya Nair",
  "Oliver Grant",
  "Hana Kobayashi",
  "Mateo García",
  "Chloe Martin",
  "Daniel Mensah",
  "Ingrid Larsen",
  "Arjun Mehta",
  "Grace O'Neill",
  "Tomás Novak",
  "Leila Haddad",
  "Ben Carter",
  "Yuki Tanaka",
  "Aisha Bello",
  "Felix Wagner",
  "Mia Rossi",
  "Samuel Adeyemi",
  "Clara Dubois",
  "Ravi Kumar",
  "Elena Popescu",
  "Jonas Berg",
  "Nora Fitzgerald",
];
const COUNTRIES = [
  { label: "United States", share: 0.58 },
  { label: "Canada", share: 0.12 },
  { label: "United Kingdom", share: 0.1 },
  { label: "Australia", share: 0.07 },
  { label: "Germany", share: 0.05 },
  { label: "Other", share: 0.08 },
];

function ledger(lines: [string, "base" | "add" | "subtract" | "total", number, number][]) {
  return lines.map(([label, kind, value, prev]) => ({
    label,
    kind,
    value: Math.round(value),
    previous: Math.round(prev),
  }));
}

// ── Profit and comparisons ─────────────────────────────────────────────────

/** The plan: the same weekdays last year, grown by these factors. */
const PLAN = { volume: 1.12, sessions: 1.08, adSpend: 1.06, otherMarketing: 1 };

const COMPARISON_LABEL: Record<Compare, string> = {
  previous_period: "Prior period",
  last_year: "Same days last year",
  plan: "Plan",
};
const AGAINST_TEXT: Record<Compare, string | undefined> = {
  previous_period: undefined,
  last_year: "same days last year",
  plan: "plan",
};

/** Daily values to set a period against: the period before it, the same weekdays last year, or the plan. */
function against(
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

type ProfitLine =
  "net" | "cogs" | "fulfillment" | "fees" | "returnCosts" | "adSpend" | "otherMarketing";
type ProfitDays = Record<ProfitLine, number[]>;

/**
 * Each day's profit lines for the channels, for `days` days ending `offset`
 * days ago. Fulfillment is net of the shipping customers paid. Marketing drives
 * the online store and app, so each of them carries its share of the spend by
 * sales; Amazon's selling costs are its fees.
 */
function profitDays(chs: Channel[], days: number, offset: number): ProfitDays {
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
function storefrontShare(chs: Channel[], days: number, offset: number): number[] {
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
function adSpendDaily(days: number, offset: number) {
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
function profitAgainst(chs: Channel[], range: Range, compare: Compare): ProfitDays {
  const days = RANGE_DAYS[range];
  if (compare === "previous_period") return profitDays(chs, days, days);
  const lastYear = profitDays(chs, days, LAST_YEAR);
  if (compare === "last_year") return lastYear;
  return planned(lastYear);
}

/** Last year's profit lines grown into the plan: sales lines by volume, marketing on its own. */
function planned(lastYear: ProfitDays): ProfitDays {
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

const beforeMarketingOf = (p: ProfitDays) =>
  p.net.map((v, i) => v - p.cogs[i] - p.fulfillment[i] - p.fees[i] - p.returnCosts[i]);
const contributionOf = (p: ProfitDays) =>
  beforeMarketingOf(p).map((v, i) => v - p.adSpend[i] - p.otherMarketing[i]);

/**
 * The ROAS at which ad spend uses up all the profit before marketing: store
 * and app total sales ÷ their profit before marketing, on the same basis as
 * blended ROAS.
 */
function breakEvenRoas(days: number, offset = 0) {
  const sales = sum(series(STOREFRONT, "total", days, offset));
  return sales / sum(beforeMarketingOf(profitDays(STOREFRONT, days, offset)));
}

function ncpa(range: Range, offset = 0) {
  const days = RANGE_DAYS[range];
  return marketing(range, offset).adSpend / sum(series(STOREFRONT, "newOrders", days, offset));
}

/** A KPI for a registered metric: its label, good direction, and definition come from METRICS. */
const metric = metricKpis(METRICS as Record<MetricId, MetricDefinition>);

/** A daily series against the same days of the previous period, bucketed by week for 90d. */
function trendOf(
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
const roundTo = (value: number, digits: number) => {
  const step = 10 ** (Math.floor(Math.log10(Math.abs(value))) - digits + 1);
  return Math.round(value / step) * step;
};

/** The store's calendar as chart events for the period, each with its kind. */
const eventsFor = (range: Range): ChartEvent[] => calendarEvents(range, STORE_EVENTS);

/** Ranked items with their share of the total and change against the previous period. */
function items(
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

function salesBy({ range, channel, dimension, customerType: type }: Input<"get_sales_by">) {
  const chs = channelsFor(channel);
  if (dimension === "channel") {
    const all = Object.keys(CHANNELS) as Channel[];
    const names = all.map((c) => CHANNELS[c].label);
    const totals = all.map((c) => sum(current([c], "total", range, type)));
    return {
      labels: names,
      totalSales: totals.map(Math.round),
      orders: all.map((c) => Math.round(sum(current([c], "orders", range, type)))),
      items: items(
        names,
        totals,
        all.map((c) => sum(previous([c], "total", range, type))),
        all,
      ),
    };
  }
  if (dimension === "category") {
    const products = productSales(range, channel, type);
    const categories = Object.keys(CATEGORY_LABELS);
    const totalRatio =
      sum(current(chs, "total", range, type)) / sum(current(chs, "net", range, type));
    const totals = categories.map(
      (c) => sum(products.filter((p) => p.category === c).map((p) => p.revenue)) * totalRatio,
    );
    const previousTotals = categories.map(
      (c) =>
        sum(products.filter((p) => p.category === c).map((p) => p.revenue / (1 + p.change / 100))) *
        totalRatio,
    );
    return {
      labels: categories.map((c) => CATEGORY_LABELS[c]),
      items: items(
        categories.map((c) => CATEGORY_LABELS[c]),
        totals,
        previousTotals,
        categories,
      ),
      totalSales: totals.map(Math.round),
      orders: categories.map((c) =>
        Math.round(sum(products.filter((p) => p.category === c).map((p) => p.units)) / 1.62),
      ),
    };
  }
  if (dimension === "device") {
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    // Devices are tracked on the store and app only: Amazon alone has no split,
    // rather than three parts of zero with no share between them.
    if (!storefront.length) return { labels: [], items: [], totalSales: [], orders: [] };
    const sales = sum(current(storefront, "total", range, type));
    const orders = sum(current(storefront, "orders", range, type));
    const devices = Object.values(DEVICES);
    const weight = sum(devices.map((d) => d.orders * d.aov));
    const prevSales = sum(previous(storefront, "total", range, type));
    const totals = devices.map((d) => (sales * d.orders * d.aov) / weight);
    return {
      labels: devices.map((d) => d.label),
      items: items(
        devices.map((d) => d.label),
        totals,
        devices.map((d, i) => ((prevSales * d.orders * d.aov) / weight) * (i === 1 ? 0.97 : 1.02)),
        Object.keys(DEVICES),
      ),
      totalSales: totals.map(Math.round),
      orders: devices.map((d) => Math.round(orders * d.orders)),
    };
  }
  const sales = sum(current(chs, "total", range, type));
  const orders = sum(current(chs, "orders", range, type));
  const shares = COUNTRIES.map(
    (c) => c.share * between(`country:${c.label}:${range}:${channel}`, 0.9, 1.1),
  );
  const total = sum(shares);
  const prevSales = sum(previous(chs, "total", range, type));
  return {
    labels: COUNTRIES.map((c) => c.label),
    items: items(
      COUNTRIES.map((c) => c.label),
      shares.map((s) => (sales * s) / total),
      shares.map((s, i) => ((prevSales * s) / total) * between(`cp:${i}:${range}`, 0.92, 1.06)),
    ),
    totalSales: shares.map((s) => Math.round((sales * s) / total)),
    orders: shares.map((s) => Math.round((orders * s) / total)),
  };
}

/**
 * The period's daily sales split by a breakdown's parts. Each part drifts by its
 * change over the period, days add up to the store's total, and each part's
 * days add up to its item value.
 */
function splitOverTime(range: Range, chs: Channel[], parts: Item[], type: CustomerType) {
  const days = RANGE_DAYS[range];
  const daily = current(chs, "total", range, type);
  const total = sum(parts.map((p) => p.value)) || 1;
  const raw = parts.map((p) => {
    const next = random(`split:${p.name}:${range}`);
    return daily.map(
      (_, i) =>
        (p.value / total) * (1 + ((p.change ?? 0) / 100) * (i / days - 0.5)) * (0.8 + next() * 0.4),
    );
  });
  const perDay = daily.map((v, i) => {
    const dayTotal = sum(raw.map((r) => r[i])) || 1;
    return raw.map((r) => (v * r[i]) / dayTotal);
  });
  const split = parts.map((p, k) => {
    const values = perDay.map((d) => d[k]);
    const scale = p.value / (sum(values) || 1);
    return values.map((v) => v * scale);
  });
  const { labels, values } = bucket(dayLabels(days), split, range);
  return {
    labels,
    series: parts.map((p, k) => ({ name: p.name, values: values[k].map(Math.round) })),
  };
}

// ── Why: explain_change ────────────────────────────────────────────────────

type WhyMetric = Input<"explain_change">["metric"];

const WHY_LABEL: Record<WhyMetric, string> = {
  total_sales: "Total sales",
  orders: "Orders",
  aov: "Average order value",
  conversion_rate: "Conversion rate",
  contribution_profit: "Contribution profit",
};
const WHY_FORMAT: Record<WhyMetric, ValueFormat> = {
  total_sales: "currency",
  orders: "number",
  aov: "currency",
  conversion_rate: "percent",
  contribution_profit: "currency",
};
const whyText = (metric: WhyMetric) =>
  metric === "orders"
    ? formatNumber
    : metric === "conversion_rate"
      ? (v: number) => `${v.toFixed(2)}%`
      : metric === "aov"
        ? formatCurrency
        : // Whole dollars below $1,000; above it the same text as the KPI tiles, so
          // $51,949.6 reads "$51.9K" here too (rounding first made it "$52.0K").
          (v: number) => formatCurrency(Math.abs(v) < 1_000 ? Math.round(v) : v);
const whySigned = (metric: WhyMetric) => (v: number) =>
  metric === "conversion_rate"
    ? formatPoints(v, 2)
    : `${v >= 0 ? "+" : "−"}${whyText(metric)(Math.abs(v))}`;

/** Daily values for the channels in some window: the current period, a past one, or the comparison. */
type DailyGetter = (chs: Channel[], field: Field) => number[];

/** A sales metric's value from daily fields; conversion rate counts the online store and app only. */
function metricFrom(
  metric: Exclude<WhyMetric, "contribution_profit">,
  chs: Channel[],
  get: DailyGetter,
) {
  const t = (f: Field, cs = chs) => sum(get(cs, f));
  if (metric === "total_sales") return t("total");
  if (metric === "orders") return t("orders");
  if (metric === "aov") return (t("gross") - t("discounts")) / t("orders");
  const front = chs.filter((c) => STOREFRONT.includes(c));
  return front.length ? (t("orders", front) / t("sessions", front)) * 100 : 0;
}

/** The metric over `days` days ending `offset` days ago. */
function metricAt(metric: WhyMetric, chs: Channel[], days: number, offset: number) {
  if (metric === "contribution_profit") return sum(contributionOf(profitDays(chs, days, offset)));
  return metricFrom(metric, chs, (cs, f) => series(cs, f, days, offset));
}

/** KPI labels whose usual range the explain metrics can compute. */
const USUAL_FOR: Record<string, WhyMetric> = {
  "Total sales": "total_sales",
  Orders: "orders",
  "Average order value": "aov",
  "Conversion rate": "conversion_rate",
};

/**
 * A metric's own usual range (our rule): its 10th to 90th percentile over up
 * to 13 earlier periods of the same length, and whether this period is inside.
 */
function usualRange(
  metric: WhyMetric,
  chs: Channel[],
  range: Range,
  format: (v: number) => string,
) {
  const days = RANGE_DAYS[range];
  const periods = Math.min(13, Math.floor((HISTORY - days) / days) - 1);
  const past = Array.from({ length: periods }, (_, k) =>
    metricAt(metric, chs, days, (k + 1) * days),
  ).sort((a, b) => a - b);
  const at = (q: number) => {
    const i = q * (past.length - 1);
    const lo = Math.floor(i);
    return past[lo]! + (past[Math.min(lo + 1, past.length - 1)]! - past[lo]!) * (i - lo);
  };
  const low = at(0.1);
  const high = at(0.9);
  const now = metricAt(metric, chs, days, 0);
  return {
    low: format(low),
    high: format(high),
    status: now < low ? ("below" as const) : now > high ? ("above" as const) : ("within" as const),
    periods,
  };
}

/** The change between each earlier window and the one before it. */
function pastChanges(metric: WhyMetric, chs: Channel[], range: Range): number[] {
  const days = RANGE_DAYS[range];
  return Array.from(
    { length: PAST_WINDOWS[range] },
    (_, k) =>
      metricAt(metric, chs, days, (k + 1) * days) - metricAt(metric, chs, days, (k + 2) * days),
  );
}

/** A segment's metric against the comparison, for metrics that add up. */
function additiveSegments(
  metric: "total_sales" | "orders",
  chs: Channel[],
  cur: DailyGetter,
  cmp: DailyGetter,
): Segment[] {
  return chs.map((c) => ({
    key: c,
    label: CHANNELS[c].label,
    current: metricFrom(metric, [c], cur),
    comparison: metricFrom(metric, [c], cmp),
  }));
}

/** New and returning customers' sales or orders, from each day's share of first orders. */
function customerSegments(
  metric: "total_sales" | "orders",
  chs: Channel[],
  cur: DailyGetter,
  cmp: DailyGetter,
): Segment[] {
  const split = (get: DailyGetter) => {
    const orders = get(chs, "orders");
    const firsts = get(chs, "newOrders");
    if (metric === "orders") return [sum(firsts), sum(orders) - sum(firsts)];
    const sales = get(chs, "total");
    const fromNew = sum(sales.map((v, i) => v * (firsts[i] / (orders[i] || 1)) * 0.94));
    return [fromNew, sum(sales) - fromNew];
  };
  const [nowNew, nowReturning] = split(cur);
  const [thenNew, thenReturning] = split(cmp);
  return [
    { key: "new", label: "New customers", current: nowNew, comparison: thenNew },
    {
      key: "returning",
      label: "Returning customers",
      current: nowReturning,
      comparison: thenReturning,
    },
  ];
}

/** Items from get_sales_by as segments; only for the prior period, the comparison those items carry. */
function itemSegments(items: Item[]): Segment[] {
  return items.map((item) => ({
    key: item.key ?? item.name,
    label: item.name,
    current: item.value,
    comparison: item.change != null ? item.value / (1 + item.change / 100) : item.value,
  }));
}

function ratioSegments(
  metric: "aov" | "conversion_rate",
  chs: Channel[],
  cur: DailyGetter,
  cmp: DailyGetter,
): RatioSegment[] {
  const parts = metric === "aov" ? chs : chs.filter((c) => STOREFRONT.includes(c));
  const pair = (c: Channel, get: DailyGetter) => {
    const t = (f: Field) => sum(get([c], f));
    return metric === "aov"
      ? { n: t("gross") - t("discounts"), d: t("orders") }
      : { n: t("orders") * 100, d: t("sessions") };
  };
  return parts.map((c) => {
    const now = pair(c, cur);
    const then = pair(c, cmp);
    return {
      key: c,
      label: CHANNELS[c].label,
      numerator: [now.n, then.n],
      denominator: [now.d, then.d],
    };
  });
}

/**
 * How much of a conversion rate change is the tracking change: the change in
 * the rate as recorded, minus the change with every day's sessions restored
 * to what a full count would have been.
 */
function trackingEffect(chs: Channel[], range: Range, compare: Compare): number {
  const front = chs.filter((c) => STOREFRONT.includes(c));
  if (!front.length) return 0;
  const days = RANGE_DAYS[range];
  const restored = (sessions: number[], offset: number) =>
    sessions.map((v, i) => v / trackedSessions(offset + days - 1 - i));
  const rate = (orders: number[], sessions: number[]) => (sum(orders) / sum(sessions)) * 100;
  const nowOrders = current(front, "orders", range);
  const nowSessions = current(front, "sessions", range);
  const thenOrders = against(front, "orders", range, compare);
  const thenSessions = against(front, "sessions", range, compare);
  // The prior period sits right before this one; last year and the plan come from last year.
  const thenOffset = compare === "previous_period" ? days : LAST_YEAR;
  const recorded = rate(nowOrders, nowSessions) - rate(thenOrders, thenSessions);
  const real =
    rate(nowOrders, restored(nowSessions, 0)) -
    rate(thenOrders, restored(thenSessions, thenOffset));
  return recorded - real;
}

/**
 * The profit change from the comparison to now as steps that add up to it
 * exactly: the extra (or lost) sales at the comparison's margin before
 * marketing, each cost's rate per dollar of net sales, then marketing spend.
 */
function profitWalkSteps(now: ProfitDays, then: ProfitDays) {
  const t = (p: ProfitDays) =>
    Object.fromEntries(Object.entries(p).map(([k, v]) => [k, sum(v)])) as Record<
      ProfitLine,
      number
    >;
  const a = t(now);
  const b = t(then);
  const before = (x: typeof a) => x.net - x.cogs - x.fulfillment - x.fees - x.returnCosts;
  const margin = before(b) / b.net;
  const share = (v: number) => `${(v * 100).toFixed(1)}%`;
  const rateStep = (label: string, line: ProfitLine) => ({
    label,
    delta: -(a[line] / a.net - b[line] / b.net) * a.net,
    current: `${share(a[line] / a.net)} of net sales`,
    comparison: `${share(b[line] / b.net)} of net sales`,
    detail: "The cost per dollar of net sales; a higher rate lowers profit",
  });
  return [
    {
      label: a.net >= b.net ? "More sales" : "Fewer sales",
      delta: (a.net - b.net) * margin,
      current: formatCurrency(a.net),
      comparison: formatCurrency(b.net),
      detail: `Net sales, at a ${share(margin)} margin before marketing`,
    },
    rateStep("Product margin", "cogs"),
    rateStep("Fulfillment rate", "fulfillment"),
    rateStep("Fee rate", "fees"),
    rateStep("Return cost rate", "returnCosts"),
    {
      label: "Ad spend",
      delta: -(a.adSpend - b.adSpend),
      current: formatCurrency(a.adSpend),
      comparison: formatCurrency(b.adSpend),
      detail: "More spend lowers profit",
    },
    {
      label: "Other marketing",
      delta: -(a.otherMarketing - b.otherMarketing),
      current: formatCurrency(a.otherMarketing),
      comparison: formatCurrency(b.otherMarketing),
      detail: "Email and SMS tools and affiliate commissions",
    },
  ];
}

const pctText = (share: number) => `${Math.round(Math.abs(share) * 100)}%`;

function driverOf(
  dimension: string,
  part: { label: string; delta: number; current: number; comparison: number },
  total: number,
  text: (v: number) => string,
  signed: (v: number) => string,
  detail?: string,
): Driver & { value: number } {
  return {
    dimension,
    name: part.label,
    delta: signed(part.delta),
    share: round(total === 0 ? 0 : part.delta / total, 3),
    current: text(part.current),
    comparison: text(part.comparison),
    tone: part.delta > 0 ? "good" : part.delta < 0 ? "bad" : "neutral",
    ...(detail ? { detail } : {}),
    value: part.delta,
  };
}

function explain({ metric, range, channel, compare }: Input<"explain_change">): Why {
  const chs = channelsFor(channel);
  const days = RANGE_DAYS[range];
  const label = WHY_LABEL[metric];
  const text = whyText(metric);
  const signed = whySigned(metric);
  const cur: DailyGetter = (cs, f) => current(cs, f, range);
  const cmp: DailyGetter = (cs, f) => against(cs, f, range, compare);
  const against_ =
    compare === "plan"
      ? "plan"
      : compare === "last_year"
        ? "the same days last year"
        : `the prior ${days} days`;

  // Conversion rate counts store and app sessions; Amazon has none, so there is
  // nothing to explain (the KPI tile shows "—", "Not tracked for Amazon").
  if (metric === "conversion_rate" && !chs.some((c) => STOREFRONT.includes(c))) {
    return {
      metric: label,
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      comparisonLabel: COMPARISON_LABEL[compare],
      value: "—",
      comparison: "—",
      delta: "",
      change: 0,
      tone: "neutral",
      confidence: { level: "Low", z: 0, note: "Not tracked for Amazon" },
      summary:
        "Conversion rate is not tracked for Amazon: the store sees no Amazon sessions. Pick the online store, the app, or all channels.",
      drivers: [],
      offsetting: [],
      walk: [],
      format: WHY_FORMAT[metric],
    };
  }

  let value: number;
  let comparison: number;
  let walkSteps: { label: string; delta: number }[];
  const candidates: (Driver & { value: number })[] = [];
  let dataQuality: string | undefined;

  if (metric === "contribution_profit") {
    const now = profitDays(chs, days, 0);
    const then = profitAgainst(chs, range, compare);
    value = sum(contributionOf(now));
    comparison = sum(contributionOf(then));
    const steps = profitWalkSteps(now, then);
    walkSteps = steps;
    const total = value - comparison;
    for (const step of steps) {
      candidates.push({
        dimension: "Profit line",
        name: step.label,
        delta: signed(step.delta),
        share: round(total === 0 ? 0 : step.delta / total, 3),
        current: step.current,
        comparison: step.comparison,
        tone: step.delta > 0 ? "good" : step.delta < 0 ? "bad" : "neutral",
        detail: step.detail,
        value: step.delta,
      });
    }
    for (const c of contributions(
      chs.map((ch) => ({
        key: ch,
        label: CHANNELS[ch].label,
        current: sum(contributionOf(profitDays([ch], days, 0))),
        comparison: sum(contributionOf(profitAgainst([ch], range, compare))),
      })),
    )) {
      candidates.push(driverOf("Sales channel", c, total, text, signed));
    }
    // Ad platforms: each one's spend against the comparison, shared out like the bridge.
    const share = storefrontShare(chs, days, 0);
    const thenOffset = compare === "previous_period" ? days : LAST_YEAR;
    const thenShare = storefrontShare(chs, days, thenOffset);
    const nowSpend = adSpendDaily(days, 0).platforms;
    const thenSpend = adSpendDaily(days, thenOffset).platforms;
    const grow = compare === "plan" ? PLAN.adSpend : 1;
    nowSpend.forEach((p, k) => {
      const spentNow = sum(p.daily.map((v, i) => v * share[i]));
      const spentThen = sum(thenSpend[k]!.daily.map((v, i) => v * thenShare[i])) * grow;
      if (spentNow === 0 && spentThen === 0) return;
      candidates.push(
        driverOf(
          "Ad platform",
          {
            label: p.label,
            delta: -(spentNow - spentThen),
            current: spentNow,
            comparison: spentThen,
          },
          total,
          formatCurrency,
          whySigned("total_sales"),
          "Spend: more spend lowers profit",
        ),
      );
    });
  } else if (metric === "total_sales" || metric === "orders") {
    const channels = additiveSegments(metric, chs, cur, cmp);
    value = sum(channels.map((c) => c.current));
    comparison = sum(channels.map((c) => c.comparison));
    const total = value - comparison;
    const byChannel = contributions(channels);
    walkSteps = byChannel.map((c) => ({ label: c.label, delta: c.delta }));
    byChannel.forEach((c) => candidates.push(driverOf("Sales channel", c, total, text, signed)));
    contributions(customerSegments(metric, chs, cur, cmp)).forEach((c) =>
      candidates.push(driverOf("Customer type", c, total, text, signed)),
    );
    if (compare === "previous_period" && metric === "total_sales") {
      // get_sales_by carries the prior period, so categories and devices can be compared.
      const scaled = (items: Item[]) => {
        const segs = itemSegments(items);
        const k = total / (sum(segs.map((g) => g.current - g.comparison)) || 1);
        return contributions(segs).map((g) => ({ ...g, delta: g.delta * k }));
      };
      scaled(salesBy({ range, channel, dimension: "category", customerType: "all" }).items).forEach(
        (c) => candidates.push(driverOf("Category", c, total, text, signed)),
      );
    }
  } else {
    const split = mixAndRate(ratioSegments(metric, chs, cur, cmp));
    value = metric === "aov" ? split.current : metricFrom(metric, chs, cur);
    comparison = metric === "aov" ? split.comparison : metricFrom(metric, chs, cmp);
    const total = value - comparison;
    const tracking = metric === "conversion_rate" ? trackingEffect(chs, range, compare) : 0;
    walkSteps = [
      { label: "Channel mix", delta: split.mix },
      ...(Math.abs(tracking) >= 0.01
        ? [
            { label: "Tracking change", delta: tracking },
            { label: "Within channels", delta: split.rate - tracking },
          ]
        : [{ label: "Within channels", delta: split.rate }]),
    ];
    for (const part of split.parts) {
      const weight = metric === "aov" ? "orders" : "sessions";
      candidates.push(
        driverOf(
          "Within channel",
          {
            label: part.label,
            delta: part.rate,
            current: part.ratio[0],
            comparison: part.ratio[1],
          },
          total,
          text,
          signed,
        ),
        driverOf(
          "Channel mix",
          {
            label: part.label,
            delta: part.mix,
            current: part.weight[0] * 100,
            comparison: part.weight[1] * 100,
          },
          total,
          (v) => `${v.toFixed(0)}% of ${weight}`,
          signed,
        ),
      );
    }
    if (Math.abs(tracking) >= 0.01) {
      const event = STORE_EVENTS.find((e) => e.id === "tracking-change")!;
      dataQuality = `${signed(tracking)} of the change is the ${event.label.toLowerCase()} on ${dateLabel(event.from)}, which stopped counting about 7% of sessions. ${Math.abs(total - tracking) < 0.005 ? "Without it, conversion has not changed." : `Without it, the change is ${signed(total - tracking)}.`}`;
      candidates.push({
        dimension: "Data",
        name: event.label,
        delta: signed(tracking),
        share: round(total === 0 ? 0 : tracking / total, 3),
        current: "Sessions counted: 93%",
        comparison: "Sessions counted: 100%",
        tone: "neutral",
        detail: event.detail,
        value: tracking,
      });
    }
  }

  const total = value - comparison;
  const change = comparison === 0 ? 0 : (total / Math.abs(comparison)) * 100;
  const sure = confidence(total, pastChanges(metric, chs, range), comparison, {
    centre: compare === "previous_period",
  });
  // The biggest movers in the total's direction, then those against it; at most
  // two per dimension so one view does not crowd out the others.
  const pick = (sameSign: boolean, limit: number) => {
    const perDimension = new Map<string, number>();
    return candidates
      .filter((c) => Math.abs(c.share) >= 0.05 && c.value * total > 0 === sameSign)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .filter((c) => {
        const n = perDimension.get(c.dimension) ?? 0;
        perDimension.set(c.dimension, n + 1);
        return n < 2;
      })
      .slice(0, limit)
      .map(({ value: _v, ...driver }) => driver);
  };
  const explained = sure.level !== "Low";
  const drivers = explained ? pick(true, 4) : [];
  const offsetting = explained ? pick(false, 3) : [];
  const direction =
    compare === "plan" ? (total >= 0 ? "above" : "below") : total >= 0 ? "up on" : "down on";
  const size =
    metric === "conversion_rate" ? `${Math.abs(total).toFixed(2)} pts` : text(Math.abs(total));
  const verb = metric === "orders" ? "are" : "is";
  const head = `${label} ${verb} ${size} (${Math.abs(change).toFixed(1)}%) ${direction} ${against_}.`;
  // A tracking change is the explanation when there is one; name it once.
  const top = dataQuality ? undefined : drivers[0];
  const why = !explained
    ? ` ${sure.note}, so no single cause stands out.`
    : top
      ? ` The biggest driver is ${top.name} (${top.dimension.toLowerCase()}): ${top.delta}, ${pctText(top.share)} of the change.`
      : "";
  return {
    metric: label,
    periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
    comparisonLabel: COMPARISON_LABEL[compare],
    value: text(value),
    comparison: text(comparison),
    delta: signed(total),
    change: round(change),
    tone: Math.abs(change) < 0.05 ? "neutral" : total > 0 ? "good" : "bad",
    confidence: sure,
    summary: `${head}${why}${dataQuality ? ` ${dataQuality}` : ""}`,
    drivers,
    offsetting,
    walk: walkOf(
      { label: COMPARISON_LABEL[compare], value: comparison },
      walkSteps,
      { label: "This period", value },
      Math.abs(value - comparison) * 0.005,
    ).map((step) => ({ ...step, value: round(step.value, metric === "conversion_rate" ? 3 : 2) })),
    format: WHY_FORMAT[metric],
    ...(dataQuality ? { dataQuality } : {}),
  };
}

export const ecommerceHandlers: Record<string, (args: any) => unknown> = {
  get_store_kpis({ range, channel, compare }: Input<"get_store_kpis">) {
    const chs = channelsFor(channel);
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    const prior = (s: Channel[], f: Field, r: Range) => against(s, f, r, compare);
    const sales = current(chs, "total", range);
    const orders = current(chs, "orders", range);
    const discounts = current(chs, "discounts", range);
    const aovDaily = ratio(
      current(chs, "gross", range).map((g, i) => g - discounts[i]),
      orders,
    );
    const priorDiscounts = prior(chs, "discounts", range);
    const priorAovDaily = ratio(
      prior(chs, "gross", range).map((g, i) => g - priorDiscounts[i]),
      prior(chs, "orders", range),
    );
    const aov = (s: Channel[], get: typeof current) =>
      (sum(get(s, "gross", range)) - sum(get(s, "discounts", range))) /
      sum(get(s, "orders", range));
    const returning = (get: typeof current) =>
      (1 - sum(get(chs, "newOrders", range)) / sum(get(chs, "orders", range))) * 100;
    const profitNow = contributionOf(profitDays(chs, RANGE_DAYS[range], 0));
    const profitThen = contributionOf(profitAgainst(chs, range, compare));
    const hero = metric("contribution_profit", sum(profitNow), sum(profitThen), formatCurrency, {
      series: profitNow,
      hint: "What is left after products, delivery, fees, returns, and marketing",
    });
    const heroTrend = {
      ...trendOf(range, profitNow, profitThen, "currency", eventsFor(range)),
      comparisonLabel: COMPARISON_LABEL[compare],
      // The lead: the same sentence explain_change writes for this metric and comparison.
      summary: explain({ metric: "contribution_profit", range, channel, compare }).summary,
    };
    const metrics: Kpi[] = [
      metric("total_sales", sum(sales), sum(prior(chs, "total", range)), formatCurrency, {
        series: sales,
        previousSeries: prior(chs, "total", range),
        range,
        chart: "currency",
        total: true,
      }),
      metric("orders", sum(orders), sum(prior(chs, "orders", range)), formatNumber, {
        series: orders,
        previousSeries: prior(chs, "orders", range),
        range,
        chart: "number",
        total: true,
      }),
      metric("aov", aov(chs, current), aov(chs, prior), formatCurrency, {
        series: aovDaily,
        previousSeries: priorAovDaily,
        range,
        chart: "currency",
      }),
    ];
    if (storefront.length) {
      const sessions = current(storefront, "sessions", range);
      const conv = (get: typeof current) =>
        (sum(get(storefront, "orders", range)) / sum(get(storefront, "sessions", range))) * 100;
      metrics.push(
        metric("conversion_rate", conv(current), conv(prior), pct, {
          series: ratio(current(storefront, "orders", range), sessions).map((v) => v * 100),
          previousSeries: ratio(
            prior(storefront, "orders", range),
            prior(storefront, "sessions", range),
          ).map((v) => v * 100),
          hint: "DTC benchmark 1.5–3.5%",
          range,
          chart: "percent",
          band: { label: "DTC benchmark 1.5–3.5%", from: 1.5, to: 3.5 },
        }),
        metric("sessions", sum(sessions), sum(prior(storefront, "sessions", range)), formatNumber, {
          series: sessions,
          previousSeries: prior(storefront, "sessions", range),
          hint: "Online store and app",
          range,
          chart: "number",
          total: true,
        }),
      );
    } else {
      metrics.push(
        {
          label: "Conversion rate",
          value: "—",
          hint: "Not tracked for Amazon",
          definition: definitionOf("conversion_rate"),
        },
        {
          label: "Sessions",
          value: "—",
          hint: "Not tracked for Amazon",
          definition: definitionOf("sessions"),
        },
      );
    }
    metrics.push(
      metric(
        "returning_customer_rate",
        returning(current),
        returning(prior),
        (v) => `${v.toFixed(1)}%`,
        {
          series: ratio(current(chs, "newOrders", range), orders).map((v) => (1 - v) * 100),
          previousSeries: ratio(prior(chs, "newOrders", range), prior(chs, "orders", range)).map(
            (v) => (1 - v) * 100,
          ),
          hint: "Benchmark 20–40%",
          range,
          chart: "percent",
          band: { label: "Benchmark 20–40%", from: 20, to: 40 },
        },
      ),
    );
    // Each KPI's usual range: the same-length periods before this one.
    const usual = (metric: WhyMetric, k: Kpi, format: (v: number) => string): Kpi => ({
      ...k,
      usual: usualRange(metric, chs, range, format),
    });
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      hero: usual("contribution_profit", hero, formatCurrency),
      heroTrend,
      metrics: metrics
        .map((k) => {
          const metric = USUAL_FOR[k.label];
          return metric && k.trend ? usual(metric, k, whyText(metric)) : k;
        })
        .map((k) =>
          k.trend ? { ...k, trend: { ...k.trend, comparisonLabel: COMPARISON_LABEL[compare] } } : k,
        ),
      rules: [
        `Compared with ${compare === "previous_period" ? `the prior ${RANGE_DAYS[range]} days` : AGAINST_TEXT[compare]}`,
        channel === "all" ? "All channels" : CHANNELS[channel as Channel].label,
        `US dollars, days in UTC; today until ${AS_OF.split(", ")[1]}, against the same hours before`,
        "Total sales include shipping and taxes; net sales and profit do not",
        "Revenue from store orders, not ad-platform claims",
      ],
    };
  },

  explain_change: explain,

  get_annotations({ range }: Input<"get_annotations">) {
    return { events: eventsFor(range) };
  },

  get_promo_impact({ event }: Input<"get_promo_impact">) {
    return promoImpact(event);
  },

  get_reconciliation({ range }: Input<"get_reconciliation">) {
    const days = RANGE_DAYS[range];
    const platforms = marketing(range)
      .channels.filter((c) => PAID.has(c.m.key))
      .map((c) => {
        const claimed =
          c.revenue *
          PLATFORM_CLAIM[c.m.key as keyof typeof PLATFORM_CLAIM] *
          between(`claim:${c.m.key}:${range}`, 0.95, 1.05);
        return {
          platform: c.m.label,
          spend: Math.round(c.spend),
          storeRevenue: Math.round(c.revenue),
          claimedRevenue: Math.round(claimed),
          storeRoas: round(c.revenue / c.spend, 2),
          claimedRoas: round(claimed / c.spend, 2),
        };
      });
    const store = sum(platforms.map((p) => p.storeRevenue));
    const claimed = sum(platforms.map((p) => p.claimedRevenue));
    const storefrontSales = sum(series(STOREFRONT, "total", days));
    return {
      periodLabel: periodLabel(range),
      platforms,
      storeTotal: store,
      claimedTotal: claimed,
      storefrontSales: Math.round(storefrontSales),
      summary: `Meta, Google, and TikTok claim ${formatCurrency(claimed)} of sales for their ads; the store's own orders credit them with ${formatCurrency(store)}, so together they claim ${(claimed / store).toFixed(2)}× what they drove${claimed > storefrontSales ? ", more than every store and app sale in the period" : ""}. ROAS on this dashboard uses the store's numbers.`,
    };
  },

  get_sales_over_time({
    range,
    channel,
    customerType: type,
    compare,
  }: Input<"get_sales_over_time">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const { labels, values } = bucket(
      dayLabels(days),
      [
        current(chs, "total", range, type),
        against(chs, "total", range, compare, type),
        current(chs, "orders", range, type),
      ],
      range,
    );
    return {
      labels,
      totalSales: values[0].map(Math.round),
      comparison: values[1].map(Math.round),
      comparisonLabel: COMPARISON_LABEL[compare],
      orders: values[2].map(Math.round),
      events: eventsFor(range),
    };
  },

  get_sales_breakdown({ range, channel, customerType: type }: Input<"get_sales_breakdown">) {
    const chs = channelsFor(channel);
    const s = (f: Field) => sum(current(chs, f, range, type));
    const p = (f: Field) => sum(previous(chs, f, range, type));
    return {
      lines: ledger([
        ["Gross sales", "base", s("gross"), p("gross")],
        ["Discounts", "subtract", s("discounts"), p("discounts")],
        ["Returns", "subtract", s("returns"), p("returns")],
        ["Net sales", "total", s("net"), p("net")],
        ["Shipping charges", "add", s("shipping"), p("shipping")],
        ["Taxes", "add", s("taxes"), p("taxes")],
        ["Total sales", "total", s("total"), p("total")],
      ]),
    };
  },

  get_sales_by(args: Input<"get_sales_by">) {
    const breakdown = salesBy(args);
    const parts =
      args.dimension === "channel"
        ? (Object.keys(CHANNELS) as Channel[])
        : args.dimension === "device"
          ? channelsFor(args.channel).filter((c) => STOREFRONT.includes(c))
          : channelsFor(args.channel);
    return {
      ...breakdown,
      overTime: breakdown.items.length
        ? splitOverTime(args.range, parts, breakdown.items, args.customerType)
        : { labels: [], series: [] },
    };
  },

  get_marketing_performance({ range, model, window }: Input<"get_marketing_performance">) {
    const days = RANGE_DAYS[range];
    const attribution = { model, window };
    const cur = marketing(range, 0, attribution);
    const prev = marketing(range, days, attribution);
    const storefrontSales = (offset: number) => sum(series(STOREFRONT, "total", days, offset));
    const allSales = (offset: number) => sum(series(channelsFor("all"), "total", days, offset));
    const newOrders = (offset: number) => sum(series(STOREFRONT, "newOrders", days, offset));
    const dailySpend = cur.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const totalRevenue = sum(cur.channels.map((c) => c.revenue));
    const prevDailySpend = prev.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const dailyRoas = (offset: number, spend: number[]) =>
      series(STOREFRONT, "total", days, offset).map((v, i) => v / (spend[i] || 1));
    const dailyMer = (offset: number, spend: number[], other: number) =>
      series(channelsFor("all"), "total", days, offset).map(
        (v, i) => v / ((spend[i] || 1) + other / days),
      );
    const firstSales = (offset: number) => sum(series(STOREFRONT, "total", days, offset, "new"));
    const dailyCpa = (offset: number, spend: number[]) =>
      series(STOREFRONT, "newOrders", days, offset).map((v, i) => spend[i] / (v || 1));
    return {
      periodLabel: periodLabel(range),
      rules: [
        `Compared with the prior ${days} days`,
        "Ad spend as billed by Meta, Google, and TikTok",
        model === "platform"
          ? `Channel revenue as each platform reports it (${window} window); it adds up to more than the store sold`
          : `Channel revenue by ${ATTRIBUTION_LABEL[model]} with a ${window} window, from store orders`,
        `Break-even ROAS ${breakEvenRoas(days).toFixed(2)}x, from profit before marketing`,
      ],
      hero: metric(
        "blended_roas",
        storefrontSales(0) / cur.adSpend,
        storefrontSales(days) / prev.adSpend,
        times,
        {
          series: dailyRoas(0, dailySpend),
          hint: "Store and app revenue ÷ ad spend on Meta, Google, and TikTok",
        },
      ),
      heroTrend: {
        ...trendOf(
          range,
          dailyRoas(0, dailySpend),
          dailyRoas(days, prevDailySpend),
          "ratio",
          eventsFor(range),
          true,
        ),
        // Below this, ad spend costs more than the profit it brings in.
        target: {
          label: `Break-even ${breakEvenRoas(days).toFixed(1)}x`,
          value: round(breakEvenRoas(days), 2),
        },
      },
      metrics: [
        metric("ad_spend", cur.adSpend, prev.adSpend, formatCurrency, {
          series: dailySpend,
          previousSeries: prevDailySpend,
          hint: "Meta, Google, and TikTok",
          range,
          chart: "currency",
          total: true,
        }),
        metric(
          "mer",
          allSales(0) / (cur.adSpend + cur.otherMarketing),
          allSales(days) / (prev.adSpend + prev.otherMarketing),
          times,
          {
            series: dailyMer(0, dailySpend, cur.otherMarketing),
            previousSeries: dailyMer(days, prevDailySpend, prev.otherMarketing),
            hint: "Total sales ÷ all marketing spend · healthy DTC 3–5x",
            range,
            chart: "ratio",
            band: { label: "Healthy DTC 3–5x", from: 3, to: 5 },
          },
        ),
        metric(
          "new_customer_cpa",
          cur.adSpend / newOrders(0),
          prev.adSpend / newOrders(days),
          formatCurrency,
          {
            series: dailyCpa(0, dailySpend),
            previousSeries: dailyCpa(days, prevDailySpend),
            hint: "Ad spend ÷ new-customer orders",
            range,
            chart: "currency",
          },
        ),
        metric("new_customers_storefront", newOrders(0), newOrders(days), formatNumber, {
          series: series(STOREFRONT, "newOrders", days),
          previousSeries: series(STOREFRONT, "newOrders", days, days),
          hint: "First-time buyers in the store and app",
          range,
          chart: "number",
          total: true,
        }),
        metric("amer", firstSales(0) / cur.adSpend, firstSales(days) / prev.adSpend, times, {
          series: series(STOREFRONT, "total", days, 0, "new").map(
            (v, i) => v / (dailySpend[i] || 1),
          ),
          previousSeries: series(STOREFRONT, "total", days, days, "new").map(
            (v, i) => v / (prevDailySpend[i] || 1),
          ),
          hint: "What new customers' first orders return per ad dollar",
          range,
          chart: "ratio",
        }),
        metric(
          "first_order_profit",
          firstOrderProfit(days, 0),
          firstOrderProfit(days, days),
          formatCurrency,
          {
            // Each day reads the 7 days up to it: one day's new customers are too few.
            series: Array.from({ length: days }, (_, i) => firstOrderProfit(7, days - 1 - i)),
            previousSeries: Array.from({ length: days }, (_, i) =>
              firstOrderProfit(7, 2 * days - 1 - i),
            ),
            hint: "Per new customer, after ad spend",
            range,
            chart: "currency",
          },
        ),
      ],
      channels: cur.channels.map((c, i) => {
        const p = prev.channels[i];
        const hasRoas = c.spend > 0;
        return {
          channel: c.m.label,
          type: c.m.type,
          spend: Math.round(c.spend),
          revenue: Math.round(c.revenue),
          ...(hasRoas
            ? {
                roas: round(c.revenue / c.spend, 2),
                cpa: round(c.spend / c.orders, 2),
                roasChange: round(
                  ((c.revenue / c.spend - p.revenue / p.spend) / (p.revenue / p.spend)) * 100,
                ),
              }
            : {}),
          orders: Math.round(c.orders),
          newCustomers: Math.round(c.newCustomers),
          share: round(c.revenue / totalRevenue, 4),
          trend: downsample(c.revenueDaily, 14).map(Math.round),
        };
      }),
      targetRoas: round(breakEvenRoas(days), 2),
    };
  },

  get_profit_bridge({ range, channel, compare }: Input<"get_profit_bridge">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const totals = (p: ProfitDays) => {
      const t = Object.fromEntries(
        Object.entries(p).map(([line, values]) => [line, sum(values)]),
      ) as Record<ProfitLine, number>;
      const gross = t.net - t.cogs;
      const beforeMarketing = gross - t.fulfillment - t.fees - t.returnCosts;
      return {
        ...t,
        gross,
        beforeMarketing,
        contribution: beforeMarketing - t.adSpend - t.otherMarketing,
      };
    };
    const c = totals(profitDays(chs, days, 0));
    const p = totals(profitAgainst(chs, range, compare));
    const share = (v: number) => `${((v / c.net) * 100).toFixed(1)}%`;
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      comparisonLabel: COMPARISON_LABEL[compare],
      lines: ledger([
        ["Net sales", "base", c.net, p.net],
        ["Cost of goods", "subtract", c.cogs, p.cogs],
        ["Gross profit", "total", c.gross, p.gross],
        ["Fulfillment", "subtract", c.fulfillment, p.fulfillment],
        ["Fees", "subtract", c.fees, p.fees],
        ["Return costs", "subtract", c.returnCosts, p.returnCosts],
        ["Profit before marketing", "total", c.beforeMarketing, p.beforeMarketing],
        ["Ad spend", "subtract", c.adSpend, p.adSpend],
        ["Other marketing", "subtract", c.otherMarketing, p.otherMarketing],
        ["Contribution profit", "total", c.contribution, p.contribution],
      ]),
      grossMargin: share(c.gross),
      contributionMargin: share(c.contribution),
      breakEvenRoas: round(breakEvenRoas(days), 2),
      profitPerOrder: formatCurrency(c.contribution / sum(current(chs, "orders", range))),
      // Every sales channel side by side, whatever the channel filter.
      byChannel: (Object.keys(CHANNELS) as Channel[]).map((ch) => {
        const t = totals(profitDays([ch], days, 0));
        const before = totals(profitAgainst([ch], range, compare));
        return {
          name: CHANNELS[ch].label,
          net: Math.round(t.net),
          productCost: Math.round(t.cogs),
          feesAndFulfillment: Math.round(t.fulfillment + t.fees + t.returnCosts),
          marketing: Math.round(t.adSpend + t.otherMarketing),
          contribution: Math.round(t.contribution),
          margin: round(t.contribution / (t.net || 1), 4),
          marginBefore: round(before.contribution / (before.net || 1), 4),
        };
      }),
    };
  },

  get_purchase_journey({ range, device }: Input<"get_purchase_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Session start", "sessions"),
        step("Viewed a product", "views", "41s"),
        step("Added to cart", "carts", "3m 12s"),
        step("Began checkout", "checkouts", "5m 48s"),
        step("Purchased", "purchases", "4m 25s"),
      ],
      conversionRate: `${((c.purchases / c.sessions) * 100).toFixed(2)}%`,
    };
  },

  get_checkout_journey({ range, device }: Input<"get_checkout_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Began checkout", "checkouts"),
        step("Added shipping info", "shipping", "1m 05s"),
        step("Added payment info", "payment", "1m 40s"),
        step("Purchased", "purchases", "38s"),
      ],
      checkoutCompletion: `${((c.purchases / c.checkouts) * 100).toFixed(1)}%`,
    };
  },

  get_customer_kpis({ range }: Input<"get_customer_kpis">) {
    const all = channelsFor("all");
    const days = RANGE_DAYS[range];
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const returning = (get: typeof current) =>
      (1 - sum(get(all, "newOrders", range)) / sum(get(all, "orders", range))) * 100;
    // 12-month LTV from the cohort curve: September's cohort (projected),
    // against the cohort the comparison period acquired; and the cohorts so far.
    const back = Math.max(1, Math.round(days / 30));
    const ltv = cohortLtv(8, 12);
    const ltvBefore = cohortLtv(8 - back, 12);
    const all90 = profitDays(all, 90, 0);
    const grossMargin = 1 - sum(all90.cogs) / sum(all90.net);
    const ratioNow = (ltv * grossMargin) / ncpa(range);
    const ratioPrev = (ltvBefore * grossMargin) / ncpa(range, days);
    // Repeat purchase at each of the last 7 month ends: a trailing year each,
    // as far back as the history reaches.
    const monthEnds = Array.from({ length: 7 }, (_, i) => (6 - i) * 30);
    return {
      periodLabel: periodLabel(range),
      hero: metric(
        "new_customers",
        sum(newOrders),
        sum(previous(all, "newOrders", range)),
        formatNumber,
        {
          series: newOrders,
          hint: "First order ever placed in the period, all channels",
        },
      ),
      heroTrend: trendOf(range, newOrders, previous(all, "newOrders", range), "number", [
        ...eventsFor(range),
      ]),
      metrics: [
        metric(
          "customers",
          sum(orders) * BUYERS_PER_ORDER,
          sum(previous(all, "orders", range)) * BUYERS_PER_ORDER,
          formatNumber,
          {
            series: orders.map((o) => o * BUYERS_PER_ORDER),
            previousSeries: previous(all, "orders", range).map((o) => o * BUYERS_PER_ORDER),
            hint: "Unique buyers in the period, all channels",
            range,
            chart: "number",
            total: true,
          },
        ),
        metric(
          "returning_customer_rate",
          returning(current),
          returning(previous),
          (v) => `${v.toFixed(1)}%`,
          {
            series: ratio(newOrders, orders).map((v) => (1 - v) * 100),
            previousSeries: ratio(
              previous(all, "newOrders", range),
              previous(all, "orders", range),
            ).map((v) => (1 - v) * 100),
            hint: "Share of orders from returning customers",
            range,
            chart: "percent",
          },
        ),
        metric("repeat_purchase_rate", repeatRate(0), repeatRate(days), (v) => `${v.toFixed(1)}%`, {
          series: monthEnds.map(repeatRate),
          hint: "Customers with 2+ orders in the last 12 months",
        }),
        // The gap between orders is a property of the store in our model, so it holds.
        metric(
          "time_between_orders",
          ORDER_GAP.median,
          ORDER_GAP.median,
          (v) => `${Math.round(v)} days`,
          { hint: "Median days from one order to the next" },
        ),
        metric("ltv_12m", ltv, ltvBefore, formatCurrency, {
          series: Array.from({ length: 9 }, (_, k) => cohortLtv(k, 12)),
          hint: "Revenue per customer in their first 12 months, from the cohort curve",
        }),
        metric("ltv_cac", ratioNow, ratioPrev, times, {
          hint: "Gross-margin LTV ÷ new customer CPA · healthy ≥ 3x",
        }),
      ],
    };
  },

  get_customer_flow({ range }: Input<"get_customer_flow">) {
    const days = RANGE_DAYS[range];
    const now = flowDaily(days, 0);
    const then = flowDaily(days, days);
    const { labels, values } = bucket(
      dayLabels(days),
      [now.newCustomers, now.reactivated, now.lapsed, now.net],
      range,
    );
    const signedCount = (v: number) => `${v >= 0 ? "+" : "−"}${formatNumber(Math.abs(v))}`;
    const daily = (key: keyof typeof now, sign = 1) => ({
      series: now[key].map((v) => v * sign),
      previousSeries: then[key].map((v) => v * sign),
      range,
      chart: "number" as const,
      total: true,
    });
    return {
      periodLabel: periodLabel(range),
      labels,
      newCustomers: values[0].map(Math.round),
      reactivated: values[1].map(Math.round),
      lapsed: values[2].map((v) => -Math.round(v)),
      net: values[3].map(Math.round),
      metrics: [
        metric("net_active_customers", sum(now.net), sum(then.net), signedCount, daily("net")),
        metric(
          "active_customers",
          activeCustomers(),
          activeCustomers() - sum(now.net),
          formatNumber,
          {
            // Each day's base: today's, less the net change still to come.
            series: now.net.map((_, i) => activeCustomers() - sum(now.net.slice(i + 1))),
            hint: "At the start of the period it was the comparison value",
          },
        ),
        metric(
          "new_customers",
          sum(now.newCustomers),
          sum(then.newCustomers),
          formatNumber,
          daily("newCustomers"),
        ),
        metric(
          "reactivated_customers",
          sum(now.reactivated),
          sum(then.reactivated),
          formatNumber,
          daily("reactivated"),
        ),
        metric(
          "lapsed_customers",
          sum(now.lapsed),
          sum(then.lapsed),
          formatNumber,
          daily("lapsed"),
        ),
      ],
    };
  },

  get_new_vs_returning({ range }: Input<"get_new_vs_returning">) {
    const all = channelsFor("all");
    const sales = current(all, "total", range);
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const newSales = sales.map((s, i) => s * (newOrders[i] / orders[i]) * 0.94);
    const { labels, values } = bucket(
      dayLabels(RANGE_DAYS[range]),
      [
        newSales,
        sales.map((s, i) => s - newSales[i]),
        newOrders,
        orders.map((o, i) => (o - newOrders[i]) * 0.9),
      ],
      range,
    );
    return {
      labels,
      newCustomerSales: values[0].map(Math.round),
      returningCustomerSales: values[1].map(Math.round),
      newCustomers: values[2].map(Math.round),
      returningCustomers: values[3].map(Math.round),
    };
  },

  get_order_journey() {
    return { steps: orderJourney() };
  },

  get_customer_cohorts({ metric, months }: Input<"get_customer_cohorts">) {
    // Calendar month k of 2026 (January is 0), as days and days ago of its last day.
    const monthDays = (k: number) => {
      const start = Math.round((TODAY - Date.UTC(2026, k, 1)) / 86_400_000);
      const end = Math.max(0, Math.round((TODAY - Date.UTC(2026, k + 1, 0)) / 86_400_000));
      return { days: start - end + 1, offset: end };
    };
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    // Cumulative revenue per customer turns into contribution at the margin before marketing.
    const recent = profitDays(channelsFor("all"), 90, 0);
    const margin = sum(beforeMarketingOf(recent)) / sum(recent.net);
    const cohorts = names.map((name, k) => {
      const next = random(`cohort:${metric}:${name}`);
      const periods = names.length - k;
      // Young cohorts get up to three months forecast from the same decay (our rule).
      const predicted = Math.min(3, k);
      const lift = 1 + (metric === "ltv" ? LTV_CURVE.liftPerCohort : 0.025) * k;
      let value =
        metric === "ltv"
          ? LTV_CURVE.first * (1 + LTV_CURVE.firstPerCohort * k) * (0.97 + next() * 0.06)
          : 3.8 * lift;
      const values = [round(value, metric === "ltv" ? 0 : 1)];
      for (let m = 1; m < periods + predicted; m++) {
        const noise = m < periods ? 0.9 + next() * 0.2 : 1;
        value +=
          metric === "ltv"
            ? LTV_CURVE.month1 * LTV_CURVE.decay ** (m - 1) * lift * noise
            : 8.2 * 0.72 ** (m - 1) * lift * noise;
        values.push(round(value, metric === "ltv" ? 0 : 1));
      }
      const cac = cohortCac(2026, k + 1);
      const payback = values.findIndex((v) => v * margin >= cac);
      return {
        cohort: `${name} 2026`,
        // New customers in that calendar month, all channels.
        size: Math.round(
          sum(series(channelsFor("all"), "newOrders", monthDays(k).days, monthDays(k).offset)),
        ),
        values,
        ...(predicted ? { predicted } : {}),
        ...(metric === "ltv" && payback >= 0 ? { payback } : {}),
      };
    });
    const shown = cohorts.slice(-months);
    return {
      periodLabels: Array.from({ length: shown[0].values.length }, (_, i) => `Month ${i}`),
      cohorts: shown,
      format: metric === "ltv" ? ("currency" as const) : ("percent" as const),
    };
  },

  get_customer_segments() {
    const { current, flows } = segmentMovement();
    const total = sum(SEGMENTS.map((seg) => current.get(seg.name) ?? 0));
    return {
      totalCustomers: total,
      segments: SEGMENTS.map((seg) => {
        const customers = current.get(seg.name) ?? 0;
        return {
          name: seg.name,
          tone: seg.tone,
          customers,
          customerShare: round(customers / total, 4),
          revenueShare: seg.revenueShare,
          avgOrders: seg.avgOrders,
          avgSpend: seg.avgSpend,
          daysSinceOrder: seg.days,
          action: seg.action,
        };
      }),
      movement: flows,
      lapsePoint: lapsePoint(),
    };
  },

  get_product_performance({
    range,
    channel,
    category,
    limit,
    customerType,
  }: Input<"get_product_performance">) {
    return {
      products: productSales(range, channel, customerType)
        .filter((p) => category === "all" || p.category === category)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map(({ weight: _w, cart: _c, ret: _r, price: _p, ...p }) => {
          // Sell-through: what sold in the period against what was available to sell.
          const stock = inventory().find((i) => i.sku === p.sku)?.stock ?? 0;
          return {
            ...p,
            category: CATEGORY_LABELS[p.category],
            stockStatus: stockStatus(p.sku),
            sellThrough: round(p.units / (p.units + stock), 4),
          };
        }),
    };
  },

  get_inventory_health({ category }: Input<"get_inventory_health">) {
    const all = inventory().filter((i) => category === "all" || i.category === category);
    const low = all.filter((i) => i.stock < i.reorderPoint);
    const covers = all.map((i) => i.daysOfCover).sort((a, b) => a - b);
    return {
      metrics: [
        {
          label: "Inventory value",
          definition: definitionOf("inventory_value"),
          value: formatCurrency(sum(all.map((i) => i.stock * i.unitCost))),
          hint: "Units on hand at cost",
        },
        {
          label: "Below reorder point",
          definition: definitionOf("below_reorder_point"),
          value: `${low.length} of ${all.length} SKUs`,
          hint: "Under 21 days of cover",
        },
        {
          label: "Out of stock",
          definition: definitionOf("out_of_stock"),
          value: ((n) => `${n} SKU${n === 1 ? "" : "s"}`)(all.filter((i) => i.stock === 0).length),
          hint: "Losing sales today",
        },
        {
          label: "Median days of cover",
          definition: definitionOf("median_days_of_cover"),
          value: `${Math.round(covers[Math.floor(covers.length / 2)] ?? 0)} days`,
          hint: "At the last 30 days' sales rate",
        },
        {
          label: "Revenue at risk",
          definition: definitionOf("revenue_at_risk"),
          value: formatCurrency(sum(low.map((i) => i.revenueAtRisk + (i.lostRevenue ?? 0)))),
          hint: "Sales lost to stockouts, so far and before orders land",
        },
        {
          label: "Ads on low stock",
          definition: definitionOf("ads_on_low_stock"),
          value: `${formatCurrency(sum(low.map((i) => i.adSpendPerDay)))}/day`,
          hint: "Ad spend still sending shoppers to them",
        },
      ],
      items: low
        .sort((a, b) => a.daysOfCover - b.daysOfCover)
        .map(({ category: _c, unitCost: _u, ...item }) => item),
      ...inventoryCatalog(all),
    };
  },

  get_returns({ range, category }: Input<"get_returns">) {
    const all = channelsFor("all");
    const products = productSales(range, "all").filter(
      (p) => category === "all" || p.category === category,
    );
    // A category's sales are the store's shared out by its products' sales, and
    // its returns by its products' returns, so return-prone categories show it.
    const store = productSales(range, "all");
    const weight = (list: typeof products, returned: boolean) =>
      sum(list.map((p) => p.revenue * (returned ? p.returnRate : 1)));
    const shareOf = (field: Field) => {
      const returned = field !== "gross";
      return weight(products, returned) / weight(store, returned);
    };
    const t = (field: Field, get = current) => sum(get(all, field, range)) * shareOf(field);
    const daily = (field: Field, get = current) =>
      get(all, field, range).map((v) => v * shareOf(field));
    const gross = t("gross");
    const refunds = t("returns");
    const exchangeShare = EXCHANGE_SHARE[category];
    const requested = refunds / (1 - exchangeShare);
    const exchanged = requested - refunds;
    const costs = t("returnCosts");
    // Orders sent back: refunds and exchanges at the period's average order value.
    const returnedOrdersOf = (get: typeof current) =>
      t("returns", get) /
      (1 - exchangeShare) /
      (sum(get(all, "gross", range)) / sum(get(all, "orders", range)));
    const returnedOrders = returnedOrdersOf(current);
    const prev = { gross: t("gross", previous), refunds: t("returns", previous) };
    const reasons = RETURN_REASONS[category === "all" ? "apparel" : category]!;
    const sized =
      category === "footwear" || category === "apparel"
        ? category
        : category === "all"
          ? "footwear"
          : undefined;
    return {
      periodLabel: periodLabel(range),
      lines: ledger([
        ["Gross sales", "base", gross, prev.gross],
        ["Sent back", "subtract", requested, prev.refunds / (1 - exchangeShare)],
        ["Kept as exchanges", "add", exchanged, prev.refunds / (1 - exchangeShare) - prev.refunds],
        ["Gross sales kept", "total", gross - refunds, prev.gross - prev.refunds],
      ]),
      metrics: [
        metric(
          "return_rate",
          (refunds / gross) * 100,
          (prev.refunds / prev.gross) * 100,
          (v) => `${v.toFixed(1)}%`,
          {
            series: daily("returns").map((r, i) => (r / (daily("gross")[i] || 1)) * 100),
          },
        ),
        // The exchange share is a property of the category in our model, so it holds.
        metric(
          "exchange_share",
          exchangeShare * 100,
          exchangeShare * 100,
          (v) => `${v.toFixed(0)}%`,
        ),
        metric("refunds", refunds, prev.refunds, formatCurrency, { series: daily("returns") }),
        metric(
          "cost_per_return",
          costs / returnedOrders,
          t("returnCosts", previous) / returnedOrdersOf(previous),
          formatCurrency,
        ),
      ],
      reasons: items(
        reasons.map(([name]) => name),
        reasons.map(([, s]) => s * requested),
        // The period before: its own returns, with each reason's share a little
        // different (fit problems vary with what sold).
        (() => {
          const before = prev.refunds / (1 - exchangeShare);
          const shares = reasons.map(
            ([name, s]) => s * between(`reason:${category}:${name}:${range}`, 0.85, 1.15),
          );
          const total = sum(shares);
          return shares.map((s) => (s / total) * before);
        })(),
      ),
      ...(sized
        ? {
            exchanges: {
              category: CATEGORY_LABELS[sized],
              ...exchangeMatrix(sized, exchanged / 80),
            },
          }
        : {}),
      products: [...products]
        .sort((a, b) => b.returnRate - a.returnRate)
        .slice(0, 5)
        .map(
          (p) =>
            ({
              name: p.name,
              key: p.sku,
              value: round(p.returnRate * 100, 1),
              change: round((p.returnRate / p.ret - 1) * 100),
            }) as Item,
        ),
    };
  },

  get_targets({ channel }: Input<"get_targets">) {
    const chs = channelsFor(channel);
    return {
      periodLabel: `October to date: ${MONTH_ELAPSED} of ${MONTH_DAYS} days`,
      // A channel with no spend (Amazon) has no ad budget to track.
      targets: TARGETS.map((t) => monthTarget(chs, t)).filter((t) => t.target > 0),
      budgets: adBudgets(chs),
    };
  },

  get_orders_by_hour({ range, channel }: Input<"get_orders_by_hour">) {
    return ordersByHour(range, channel);
  },

  get_live_view() {
    return liveView();
  },

  get_creatives({ range, platform }: Input<"get_creatives">) {
    return {
      creatives: creatives(range, platform),
      breakEvenRoas: round(breakEvenRoas(RANGE_DAYS[range]), 2),
    };
  },

  get_actions({ range }: Input<"get_actions">) {
    return { actions: recommendedActions(range) };
  },

  get_sale_plan() {
    return salePlan();
  },

  get_sales_goal({ channel }: Input<"get_sales_goal">) {
    const elapsed = MONTH_ELAPSED;
    const days = MONTH_DAYS;
    const chs = channelsFor(channel);
    const daily = series(chs, "total", elapsed);
    let running = 0;
    const cumulative = daily.map((v) => Math.round((running += v)));
    // The same plan-shaped forecast the targets use, so the two agree.
    const sales = monthTarget(chs, TARGETS[0]);
    return {
      projected: sales.forecast,
      range: [sales.forecastLow, sales.forecastHigh],
      planToDate: sales.toDate,
      label: "October sales goal",
      // The plan for the month, the same one the targets use.
      goal: roundTo(sum(octoberPlan(channelsFor(channel), "total")), 3),
      format: "currency" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      asOf: AS_OF,
    };
  },

  get_fulfillment_sla({ range }: Input<"get_fulfillment_sla">) {
    const days = RANGE_DAYS[range];
    const orders = series(channelsFor("all"), "orders", days);
    const next = random(`sla:${range}`);
    let shipped = 0;
    let counted = 0;
    const items = orders.map((count, i) => {
      const daysAgo = days - 1 - i;
      if (daysAgo === 0) {
        return {
          label: "Today",
          status: "none" as const,
          value: "In progress",
          detail: `${formatNumber(count)} orders so far`,
        };
      }
      // The Fall sale's backlog took three days to clear; one carrier pickup was missed.
      const backlog = daysAgo >= 11 && daysAgo <= 13;
      const carrier = daysAgo === 5;
      const rate = backlog ? 87.5 + next() * 5 : carrier ? 91.4 : 96.4 + next() * 3;
      shipped += (rate / 100) * count;
      counted += count;
      return {
        label: dateLabel(daysAgo),
        status: rate >= 95 ? ("good" as const) : rate >= 90 ? ("warn" as const) : ("bad" as const),
        value: `${rate.toFixed(1)}% shipped in 48 hours`,
        detail: `${formatNumber(count)} orders${backlog ? " · Fall sale backlog" : carrier ? " · carrier pickup missed" : ""}`,
      };
    });
    return {
      days: items,
      summary: `${((shipped / counted) * 100).toFixed(1)}% shipped within 48 hours · target 95%`,
    };
  },

  get_recent_orders({ channel, limit }: Input<"get_recent_orders">) {
    const next = random(`orders:${channel}`);
    const first = Math.floor(next() * CUSTOMERS.length);
    const chs = channelsFor(channel);
    let minutesAgo = 0;
    return {
      orders: Array.from({ length: limit }, (_, i) => {
        const gap = 2 + Math.floor(next() * 14);
        const ch = chs[Math.floor(next() * chs.length)];
        const items = 1 + Math.floor(next() * next() * 4);
        // Back from AS_OF, the time of the newest order, a few minutes at a time.
        const placed = new Date(TODAY + (MINUTES_SO_FAR - minutesAgo) * 60_000);
        minutesAgo += gap;
        const roll = next();
        return {
          id: `#${48210 - i * 3}`,
          // Step through the names (7 is coprime with 30) so a page never repeats one.
          customer: CUSTOMERS[(first + i * 7) % CUSTOMERS.length],
          channel: CHANNELS[ch].label,
          items,
          total: formatCurrency(CHANNELS[ch].aov * (0.55 + items * 0.45) * (0.85 + next() * 0.3)),
          fulfillment:
            i < 4
              ? "Unfulfilled"
              : roll < 0.7
                ? "Fulfilled"
                : roll < 0.92
                  ? "Partially fulfilled"
                  : "Refunded",
          country: COUNTRIES[Math.min(COUNTRIES.length - 2, Math.floor(next() * next() * 5))].label,
          placedAt: placed.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          }),
        };
      }),
    };
  },

  get_store_insights({ range, channel, compare, excluding }: Input<"get_store_insights">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];
    const why = (metric: WhyMetric) => explain({ metric, range, channel, compare });
    // A list beside DriverCards leaves out the change those cards already explain.
    const shown = (metric: WhyMetric) => metric !== excluding;

    // Profit first: what moved it, from the explain engine.
    const profit = why("contribution_profit");
    if (shown("contribution_profit") && profit.confidence.level !== "Low" && profit.drivers[0]) {
      const top = profit.drivers[0];
      insights.push({
        tone: profit.tone === "good" ? "positive" : "negative",
        kind: profit.tone === "good" ? "top_driver" : "top_detractor",
        title: `Contribution profit ${profit.delta} against ${profit.comparisonLabel.toLowerCase()}, mostly ${top.name.toLowerCase()}`,
        detail: `${top.name}: ${top.current} against ${top.comparison} (${top.delta}). ${profit.confidence.note}.`,
        metric: profit.value,
      });
    }

    // A tracking change can make conversion look better than it is.
    if (shown("conversion_rate") && chs.some((c) => STOREFRONT.includes(c))) {
      const conversion = why("conversion_rate");
      if (conversion.dataQuality) {
        insights.push({
          tone: "info",
          kind: "data_quality",
          title: "Conversion rate looks better than it is",
          detail: conversion.dataQuality,
          metric: conversion.delta,
        });
      }
    }

    const sales = why("total_sales");
    if (shown("total_sales"))
      insights.push(
        periodChangeInsight(
          sales,
          "Total sales",
          `against ${compare === "previous_period" ? `the prior ${days} days` : sales.comparisonLabel.toLowerCase()}`,
        ),
      );

    const runner = inventory().find((i) => i.sku === "FTW-TRL-01")!;
    const bestseller = productSales(range, channel).sort((a, b) => b.revenue - a.revenue)[0];
    insights.push({
      tone: "negative",
      kind: "stock_risk",
      title: `${runner.name} sells out in about ${Math.round(runner.daysOfCover)} days`,
      detail: `${bestseller.sku === runner.sku ? "It is the top product by revenue. " : ""}${formatNumber(runner.incoming ?? 0)} units arrive in ${runner.incomingInDays} days, so expect a ${Math.max(0, (runner.incomingInDays ?? 0) - Math.round(runner.daysOfCover))}-day gap. Expedite the order or move ad spend to Canvas Low.`,
      metric: `${formatNumber(runner.stock)} left`,
    });

    const breakEven = breakEvenRoas(days);
    const tiktok = marketing(range).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokPrev = marketing(range, days).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokRoas = tiktok.revenue / tiktok.spend;
    if (tiktokRoas < breakEven) {
      insights.push({
        tone: "warning",
        kind: "below_break_even",
        title: `TikTok Ads ROAS ${tiktokRoas.toFixed(2)}x, below the ${breakEven.toFixed(1)}x break-even`,
        detail: `Spend changed ${changeText(tiktok.spend, tiktokPrev.spend)} while attributed revenue changed ${changeText(tiktok.revenue, tiktokPrev.revenue)}. ${aboveBreakEven(range, breakEven)}`,
        metric: formatCurrency(tiktok.spend),
      });
    }

    const goal = ecommerceHandlers.get_sales_goal!({ channel }) as Goal;
    const soFar = goal.cumulative.at(-1) ?? 0;
    // The goal card's own plan-shaped forecast and on-pace band (within 2% of
    // the goal), so the insight never contradicts the card beside it.
    const projected = goal.projected!;
    const [low, high] = goal.range!;
    insights.push({
      tone: projected >= goal.goal * 0.98 ? "positive" : "warning",
      kind: "pace_to_goal",
      title: `October on pace for ${formatCurrency(projected)} of the ${formatCurrency(goal.goal)} goal`,
      detail: `${formatCurrency(soFar)} so far in ${goal.cumulative.length} days, with a likely finish of ${formatCurrency(low)}–${formatCurrency(high)}; reaching the goal needs ${formatCurrency((goal.goal - soFar) / (goal.labels.length - goal.cumulative.length))} a day from here.`,
      metric: `${Math.round((projected / goal.goal) * 100)}%`,
    });

    if (chs.some((c) => STOREFRONT.includes(c))) {
      const mobile = DEVICES.mobile;
      const desktop = DEVICES.desktop;
      insights.push({
        tone: "warning",
        kind: "trend_change",
        title: "Mobile shoppers drop off at payment",
        detail: `${Math.round((1 - mobile.pay) * 100)}% of mobile checkouts stop before adding payment, against ${Math.round((1 - desktop.pay) * 100)}% on desktop, and ${Math.round((mobile.prevPay - mobile.pay) * 100)} points worse than the prior period. Check wallet payment options on mobile.`,
        metric: `${Math.round((1 - mobile.pay) * 100)}% drop`,
      });
    }

    if (days >= 30) {
      const daily = current(chs, "orders", range);
      const saleOrders = mean([12, 13, 14].map((d) => daily[days - 1 - d]));
      insights.push({
        tone: "info",
        kind: "trend_change",
        title: "Fall sale lifted orders for three days, then a dip",
        detail: `Sep 26–28 averaged ${formatNumber(saleOrders)} orders a day, ${changeText(saleOrders, mean(daily))} on the period average, at a 21% discount rate against 7% normally. Orders ran below normal for about two weeks after, as sales pulled demand forward.`,
        metric: changeText(saleOrders, mean(daily)),
      });
    }

    const returns = productSales(range, channel).sort((a, b) => b.returnRate - a.returnRate)[0];
    insights.push({
      tone: "warning",
      title: `${returns.name} returns ${Math.round(returns.returnRate * 100)}% of units`,
      detail: `The highest return rate in the catalog, against ${Math.round((sum(current(chs, "returns", range)) / sum(current(chs, "gross", range))) * 100)}% for the store. Returns are mostly sizing; add a fit note to the product page.`,
      metric: `${Math.round(returns.returnRate * 100)}%`,
    });

    const spend = marketing(range).channels.filter((c) => PAID.has(c.m.key));
    const biggest = spend.reduce((a, b) => (b.spend > a.spend ? b : a));
    const biggestShare = biggest.spend / sum(spend.map((c) => c.spend));
    if (biggestShare > 0.5) {
      insights.push({
        tone: "info",
        kind: "concentration_risk",
        title: `${biggest.m.label} is ${Math.round(biggestShare * 100)}% of ad spend`,
        detail: `One platform carries most of the paid budget, so a change in its costs or tracking moves the whole store's profit. Google and TikTok carry the rest.`,
        metric: formatCurrency(biggest.spend),
      });
    }
    return { insights: insights.slice(0, 8) };
  },
};
