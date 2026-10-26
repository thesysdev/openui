import type { MetricDefinition } from "../../../core/metrics";
import { mean, round, sum } from "../../../core/sample-data";
import { LAST_YEAR } from "../calendar";
import { METRICS } from "../metrics";
import { adSpendDaily, contributionOf, PLAN, planned, profitDays, storefrontShare } from "./profit";
import { type Channel, series, shareSoFarFor, storefrontShareSoFar, wholeDays } from "./store";

// October: the month's plan from last year's same weekdays, the actual so far,
// the month's targets, and how each ad platform's budget is burning.

/** October so far: the 1st to today, the 10th, of a 31-day month. */
export const MONTH_DAYS = 31;
export const MONTH_ELAPSED = 10;
/** The same weekdays last year for every day of October: 343 to 373 days ago. */
const MONTH_LAST_YEAR = LAST_YEAR - (MONTH_DAYS - MONTH_ELAPSED);

/** The plan for each whole day of October, from last year's same weekdays. */
export function octoberPlan(
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

export const TARGETS = [
  { id: "total_sales", metric: "total", format: "currency" },
  { id: "contribution_profit", metric: "profit", format: "currency" },
  { id: "orders", metric: "orders", format: "number" },
  { id: "new_customers", metric: "newOrders", format: "number" },
  { id: "ad_spend", metric: "adSpend", format: "currency", budget: true },
] as const;

export function monthTarget(chs: Channel[], t: (typeof TARGETS)[number]) {
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
export function adBudgets(chs: Channel[]) {
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
