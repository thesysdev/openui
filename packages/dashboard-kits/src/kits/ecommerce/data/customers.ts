import { sum } from "../../../core/sample-data";
import { normalCdf } from "../../../core/stats";
import { LAST_YEAR } from "../calendar";
import { channelsFor, series } from "./store";

// Customers: the RFM segments and how customers move between them, order
// journeys, repeat rates, lifetime value and the lapse point, plus the customer
// flow (active customers, new, reactivated, and lapsed each day).

export const SEGMENTS = [
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

export function segmentMovement() {
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
export function orderJourney() {
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
export const BUYERS_PER_ORDER = 0.91;

/** Days between a customer's orders: a lognormal with this median and spread (our model). */
export const ORDER_GAP = {
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
export function repeatRate(offset: number) {
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
export function cohortLtv(k: number, months: number) {
  const lift = 1 + LTV_CURVE.liftPerCohort * k;
  let value = LTV_CURVE.first * (1 + LTV_CURVE.firstPerCohort * k);
  for (let m = 1; m < months; m++) value += LTV_CURVE.month1 * LTV_CURVE.decay ** (m - 1) * lift;
  return value;
}
/** Revenue per customer: the first month, then each month's addition decaying (our model). */
export const LTV_CURVE = {
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
export function lapsePoint() {
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
export function flowDaily(days: number, offset: number) {
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
export const PLATFORM_CLAIM = { meta: 1.38, google: 1.22, tiktok: 1.65 };
