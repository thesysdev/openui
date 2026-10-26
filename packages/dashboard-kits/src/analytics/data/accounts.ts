// Revenue and paying workspaces: MRR history, NRR band, new and paying
// workspaces by month, unit economics, and workspace health history and spread.

import { formatCurrency } from "../../core/format";
import { sum } from "../../core/sample-data";
import { addHistories, revenueHistory, type RevenueMonth } from "../revenue";
import { payingWorkspaces } from "../workspaces";
import { metric } from "./shared";

/** Months of MRR history: a year of retention needs two, and the weekly review a third. */
export const REVENUE_MONTHS = 36;
/** Monthly MRR movements for the plans, oldest first, ending on today's workspace MRR. */
export const mrrHistory = (plans: readonly ("team" | "business")[]) =>
  addHistories(
    plans.map((p) =>
      revenueHistory(
        p,
        sum(
          payingWorkspaces()
            .filter((w) => w.plan.toLowerCase() === p)
            .map((w) => w.mrr),
        ),
        REVENUE_MONTHS,
      ),
    ),
  );
/** What a new paying workspace starts on: about 7 Team seats at $20. */
const NEW_WORKSPACE_MRR = 150;
/** MRR plan against the same month last year. */
export const MRR_PLAN = 1.5;
/** Bottom-up SaaS net revenue retention: good about 100%, great about 120%. */
export const NRR_BAND = {
  label: "Bottom-up SaaS: good 100%, great 120% (Lenny Rachitsky)",
  from: 100,
  to: 120,
};

/**
 * Weekly health for the last 12 weeks, a straight line between the known
 * scores (weeks ago, score), oldest known first.
 */
export function scoreHistory(known: [number, number][]): number[] {
  return Array.from({ length: 12 }, (_, k) => {
    const weeksAgo = 11 - k;
    const after = known.findIndex(([at]) => at <= weeksAgo);
    const [a, b] = after <= 0 ? [known[0]!, known[1]!] : [known[after - 1]!, known[after]!];
    return Math.round(a[1] + ((b[1] - a[1]) * (a[0] - weeksAgo)) / (a[0] - b[0] || 1));
  });
}

/**
 * How many workspaces score in each band of 10, stacked by zone so each
 * column carries its zone's status color (under 40 at risk, 40–69 watch).
 */
export function healthDistribution(scores: number[]) {
  const counts = Array.from(
    { length: 10 },
    (_, b) => scores.filter((s) => Math.min(9, Math.floor(s / 10)) === b).length,
  );
  const zone = (lo: number, hi: number) => counts.map((c, b) => (b >= lo && b < hi ? c : 0));
  return {
    labels: counts.map((_, b) => (b === 9 ? "90–100" : `${b * 10}–${b * 10 + 9}`)),
    series: [
      { name: "At risk", values: zone(0, 4), tone: "bad" as const },
      { name: "Watch", values: zone(4, 7), tone: "warn" as const },
      { name: "Healthy", values: zone(7, 10), tone: "good" as const },
    ],
  };
}

/** A plan's paying workspaces, their average MRR, and the MRR a new one starts on. */
function workspaceSizes(p: "team" | "business") {
  const inPlan = payingWorkspaces().filter((w) => w.plan.toLowerCase() === p);
  const average = sum(inPlan.map((w) => w.mrr)) / Math.max(1, inPlan.length);
  return { inPlan, average, newSize: p === "team" ? NEW_WORKSPACE_MRR : average };
}

/** New paying workspaces in each of the last `months` whole months, oldest first, plan by plan. */
export function newWorkspacesByMonth(
  plans: readonly ("team" | "business")[],
  months: number,
): number[] {
  const out = new Array<number>(months).fill(0);
  for (const p of plans) {
    const { newSize } = workspaceSizes(p);
    mrrHistory([p])
      .slice(-months)
      .forEach((m, k) => (out[k] += m.new / newSize));
  }
  return out.map(Math.round);
}

/**
 * Paying workspaces at the end of each of the last `months` whole months,
 * oldest first: today's count walked back month by month, less each month's
 * new workspaces and plus its cancellations, plan by plan. New Team
 * workspaces start small; new and cancelled Business ones are the size of a
 * typical Business account.
 */
export function payingByMonth(plans: readonly ("team" | "business")[], months: number): number[] {
  const out = new Array<number>(months).fill(0);
  for (const p of plans) {
    const { inPlan, average, newSize } = workspaceSizes(p);
    const history = mrrHistory([p]).slice(-months);
    let count = inPlan.length;
    for (let k = months - 1; k >= 0; k--) {
      out[k] += count;
      count += history[k]!.churn / average - history[k]!.new / newSize;
    }
  }
  return out.map(Math.round);
}

/**
 * ARPA, monthly revenue churn, and lifetime value (ARPA ÷ churn) for the
 * latest whole month against the one before, each month's MRR over that
 * month's paying workspaces.
 */
export function unitEconomics(
  plans: readonly ("team" | "business")[],
  last: RevenueMonth,
  before: RevenueMonth,
  year: RevenueMonth[],
) {
  const counts = payingByMonth(plans, year.length);
  const countOf = (m: RevenueMonth) => counts[year.indexOf(m)] ?? counts.at(-1)!;
  const churn = (m: RevenueMonth) => (m.churn + m.contraction) / (m.start || 1);
  const arpa = (m: RevenueMonth) => m.end / (countOf(m) || 1);
  const ltv = (m: RevenueMonth) => arpa(m) / (churn(m) || 1);
  return [
    metric("arpa", arpa(last), arpa(before), formatCurrency, { series: year.map(arpa) }),
    metric("revenue_churn", churn(last) * 100, churn(before) * 100, (v) => `${v.toFixed(2)}%`, {
      series: year.map((m) => churn(m) * 100),
    }),
    metric("ltv", ltv(last), ltv(before), formatCurrency, {
      series: year.map(ltv),
      hint: "Revenue, before costs",
    }),
  ];
}
