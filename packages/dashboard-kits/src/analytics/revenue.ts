import { random } from "../core/sample-data";

// Monthly recurring revenue and where it moved. Each month's MRR changes by
// five movements, each a share of the MRR it started with:
//
//   end = start + new + expansion + reactivation − contraction − churn
//
// Retention looks only at customers already paying a year ago (our rule:
// every customer's MRR moves at the month's rates, new or old):
//   NRR = Π (1 + expansion − contraction − churn) over the last 12 months
//   GRR = Π (1 − contraction − churn), so it can never pass 100%
//   quick ratio = (new + expansion + reactivation) ÷ (contraction + churn)
//
// The history is anchored to today's MRR from the workspaces and worked
// backwards, so the latest month always ends on the number the account list
// adds up to.

export type RevenuePlan = "team" | "business";

interface Rates {
  new: number;
  expansion: number;
  reactivation: number;
  contraction: number;
  churn: number;
}

/** Typical monthly rates: Business expands more and churns less than Team. */
const RATES: Record<RevenuePlan, Rates> = {
  team: { new: 0.031, expansion: 0.013, reactivation: 0.002, contraction: 0.004, churn: 0.009 },
  business: { new: 0.019, expansion: 0.021, reactivation: 0.001, contraction: 0.005, churn: 0.003 },
};

/**
 * The latest month's story: Business seat cuts at renewal after two customer
 * reorganisations, so contraction roughly triples for September.
 */
export const SEAT_CUTS = { monthsAgo: 0, plan: "business" as RevenuePlan, contraction: 3 };

export interface RevenueMonth {
  start: number;
  new: number;
  expansion: number;
  reactivation: number;
  contraction: number;
  churn: number;
  end: number;
}

/** `months` months of history for one plan, oldest first, ending at `endMrr`. */
export function revenueHistory(plan: RevenuePlan, endMrr: number, months: number): RevenueMonth[] {
  const next = random(`revenue:${plan}`);
  const rates = Array.from({ length: months }, (_, k) => {
    const monthsAgo = months - 1 - k;
    const base = RATES[plan];
    const jitter = () => 0.8 + 0.4 * next();
    const r: Rates = {
      new: base.new * jitter(),
      expansion: base.expansion * jitter(),
      reactivation: base.reactivation * jitter(),
      contraction: base.contraction * jitter(),
      churn: base.churn * jitter(),
    };
    if (plan === SEAT_CUTS.plan && monthsAgo === SEAT_CUTS.monthsAgo) {
      r.contraction *= SEAT_CUTS.contraction;
    }
    return r;
  });
  const out: RevenueMonth[] = [];
  let end = endMrr;
  for (let k = months - 1; k >= 0; k--) {
    const r = rates[k]!;
    const start = end / (1 + r.new + r.expansion + r.reactivation - r.contraction - r.churn);
    out.unshift({
      start,
      new: start * r.new,
      expansion: start * r.expansion,
      reactivation: start * r.reactivation,
      contraction: start * r.contraction,
      churn: start * r.churn,
      end,
    });
    end = start;
  }
  return out;
}

/** Plans added month by month. */
export function addHistories(histories: RevenueMonth[][]): RevenueMonth[] {
  return histories[0]!.map((_, k) => {
    const keys = [
      "start",
      "new",
      "expansion",
      "reactivation",
      "contraction",
      "churn",
      "end",
    ] as const;
    return Object.fromEntries(
      keys.map((key) => [key, histories.reduce((a, h) => a + h[k]![key], 0)]),
    ) as unknown as RevenueMonth;
  });
}

/** NRR and GRR over the 12 months ending at `last` (an index into the history). */
export function retention(history: RevenueMonth[], last: number) {
  let nrr = 1;
  let grr = 1;
  for (let k = last - 11; k <= last; k++) {
    const m = history[k]!;
    nrr *= 1 + (m.expansion - m.contraction - m.churn) / m.start;
    grr *= 1 - (m.contraction + m.churn) / m.start;
  }
  return { nrr, grr };
}

export const quickRatio = (m: RevenueMonth) =>
  (m.new + m.expansion + m.reactivation) / (m.contraction + m.churn);

/** New teams add seats early: expansion runs this much higher in a customer's first 3 months. */
export const EARLY_EXPANSION = 1.8;

/**
 * Net revenue retention for each monthly cohort of new customers: their MRR
 * in each month since they started ÷ their starting MRR. Each month moves the
 * cohort at that month's expansion, contraction, and churn rates, with
 * expansion higher in its first 3 months (our rules). Values can pass 100%.
 */
export function cohortNrr(history: RevenueMonth[], cohorts: number): number[][] {
  const first = history.length - cohorts;
  return Array.from({ length: cohorts }, (_, k) => {
    const start = first + k;
    const out = [1];
    let level = 1;
    for (let m = start + 1; m < history.length; m++) {
      const month = history[m]!;
      const early = m - start <= 3 ? EARLY_EXPANSION : 1;
      level *= 1 + (month.expansion * early - month.contraction - month.churn) / month.start;
      out.push(level);
    }
    return out;
  });
}

// ── Usage commits ───────────────────────────────────────────────────────────
//
// Business workspaces can commit to a year of AI credits up front. Pacing
// compares what they used with what a straight line through the term says
// they should have by now (our rule: on track between 80% and 110%):
//
//   pacing    = used ÷ (committed × share of the term gone)
//   projected = used ÷ share of the term gone   (what they will use by renewal)

export type PaceStatus = "under" | "on_track" | "over";

export function pacing(used: number, committed: number, elapsed: number) {
  const pace = elapsed > 0 ? used / (committed * elapsed) : 0;
  const status: PaceStatus = pace < 0.8 ? "under" : pace > 1.1 ? "over" : "on_track";
  return { pace, projected: elapsed > 0 ? used / elapsed : 0, status };
}
