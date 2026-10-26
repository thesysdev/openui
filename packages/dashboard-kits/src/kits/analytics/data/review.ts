// The weekly review (6-12): this week, the last 6 and 12 weeks, against plan and last year.

import { formatChange, formatCurrency, formatNumber, formatPoints } from "../../../core/format";
import { dateLabel, dayOfWeek, daysAgoOf, mean, round, sum } from "../../../core/sample-data";
import { PRODUCT_EVENTS } from "../calendar";
import type { RevenueMonth } from "../revenue";
import { MRR_PLAN, mrrHistory } from "./accounts";
import { activationCounts, population } from "./activity";
import { HISTORY, LAST_YEAR, USAGE_PLAN } from "./shared";

interface ReviewMetric {
  key: "wau" | "signups" | "activation" | "stickiness" | "mrr";
  label: string;
  format: "number" | "percent" | "currency";
  owner: string;
  /** Plan against last year: a multiple, or a fixed value for rates. */
  plan?: { times?: number; value?: number };
  /** The value for days `from` to `to` ago (inclusive), as a week or month reads it. */
  over: (from: number, to: number) => number;
  /** A plan miss this large flags an exception: percent, or points for rates. */
  tolerance: number;
}

/** MRR on a day, read between month ends. */
function mrrOn(history: RevenueMonth[], ago: number) {
  // history's last month is September 2026; month m ends on its last day.
  const lastIndex = history.length - 1;
  for (let k = lastIndex; k >= 0; k--) {
    const monthsBack = lastIndex - k;
    const start = daysAgoOf(2026, 9 - monthsBack, 1);
    const end = daysAgoOf(2026, 10 - monthsBack, 0);
    if (ago <= start && ago >= end) {
      const m = history[k]!;
      const progress = (start - ago + 1) / (start - end + 1);
      return m.start + (m.end - m.start) * progress;
    }
  }
  // After the last whole month: carry September's end forward.
  return history[lastIndex]!.end;
}

function reviewMetrics(): ReviewMetric[] {
  const pop = population("all", "all");
  const at = (values: Float64Array, ago: number) => values[HISTORY - 1 - ago]!;
  const span = (from: number, to: number) =>
    Array.from({ length: from - to + 1 }, (_, i) => from - i);
  const history = mrrHistory(["team", "business"]);
  return [
    {
      key: "wau",
      label: "Weekly active users",
      format: "number",
      owner: "Product",
      plan: { times: USAGE_PLAN.actives },
      over: (from, to) => mean(span(from, to).map((d) => at(pop.wau, d))),
      tolerance: 5,
    },
    {
      key: "signups",
      label: "New signups",
      format: "number",
      owner: "Growth",
      plan: { times: USAGE_PLAN.signups },
      over: (from, to) => sum(span(from, to).map((d) => at(pop.signups, d))),
      tolerance: 4,
    },
    {
      key: "activation",
      label: "Activation",
      format: "percent",
      owner: "Growth",
      plan: { value: USAGE_PLAN.activation },
      over: (from, to) => activationCounts("all", "all", from - to + 1, to).rate * 100,
      tolerance: 2,
    },
    {
      key: "stickiness",
      label: "DAU/MAU",
      format: "percent",
      owner: "Product",
      // Average DAU ÷ average MAU, as the KPI tile and explain_change read it.
      over: (from, to) =>
        (mean(span(from, to).map((d) => at(pop.dau, d))) /
          mean(span(from, to).map((d) => at(pop.mau, d)))) *
        100,
      tolerance: 2,
    },
    {
      key: "mrr",
      label: "MRR",
      format: "currency",
      owner: "Finance",
      plan: { times: MRR_PLAN },
      over: (_from, to) => mrrOn(history, to),
      tolerance: 3,
    },
  ];
}

export function weeklyReview() {
  // The last 6 whole weeks, Monday to Sunday, and the last 12 whole months.
  const lastSunday = ((dayOfWeek(0) + 6) % 7) + 1;
  const weeks = Array.from({ length: 6 }, (_, k) => {
    const to = lastSunday + (5 - k) * 7;
    return { from: to + 6, to, label: dateLabel(to + 6) };
  });
  const months = Array.from({ length: 12 }, (_, k) => {
    const back = 11 - k;
    const from = daysAgoOf(2026, 9 - back, 1);
    const to = daysAgoOf(2026, 10 - back, 0);
    const label = new Date(Date.UTC(2026, 8 - back, 1)).toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    return { from, to, label };
  });
  const latestWeek = weeks[5]!;
  const pct = (a: number, b: number) => ((a - b) / Math.abs(b || 1)) * 100;
  return {
    period: `Week of ${latestWeek.label}, against plan and the same week last year`,
    rows: reviewMetrics().map((m) => {
      const read = (spans: { from: number; to: number }[], back = 0) =>
        spans.map((p) => m.over(p.from + back, p.to + back));
      const panel = (spans: { from: number; to: number; label: string }[]) => {
        const current = read(spans);
        const yearAgo = read(spans, LAST_YEAR);
        const plan = m.plan
          ? m.plan.value != null
            ? spans.map(() => m.plan!.value!)
            : yearAgo.map((v) => v * m.plan!.times!)
          : undefined;
        const digits = m.format === "percent" ? 2 : 0;
        const r = (values: number[]) => values.map((v) => round(v, digits));
        return {
          labels: spans.map((p) => p.label),
          current: r(current),
          yearAgo: r(yearAgo),
          ...(plan ? { plan: r(plan) } : {}),
        };
      };
      const w = panel(weeks);
      const latest = w.current[5]!;
      const planned = w.plan?.[5];
      const lastYear = w.yearAgo[5]!;
      const rate = m.format === "percent";
      // Off plan by more than the metric's tolerance, or outside its usual
      // range: the mean ± 2 SD of the 8 weeks before (our rules).
      const before = Array.from({ length: 8 }, (_, k) => {
        const to = latestWeek.to + (k + 1) * 7;
        return m.over(to + 6, to);
      });
      const avg = mean(before);
      const sd = Math.sqrt(mean(before.map((v) => (v - avg) ** 2)));
      const miss = planned == null ? 0 : rate ? latest - planned : pct(latest, planned);
      const offPlan = planned != null && Math.abs(miss) > m.tolerance;
      const unusual = Math.abs(latest - avg) > 2 * sd && sd > 0;
      const fmt = (v: number) =>
        m.format === "currency"
          ? formatCurrency(v)
          : m.format === "percent"
            ? `${v.toFixed(1)}%`
            : formatNumber(v);
      const cause = reviewCause(m.key, latestWeek);
      return {
        key: m.key,
        label: m.label,
        format: m.format,
        value: fmt(latest),
        vsPlan:
          planned == null
            ? "No plan"
            : rate
              ? `${formatPoints(latest - planned)} vs plan`
              : `${formatChange(pct(latest, planned))} vs plan`,
        vsLastYear: rate
          ? `${formatPoints(latest - lastYear)} vs last year`
          : `${formatChange(pct(latest, lastYear))} vs last year`,
        status: offPlan || unusual ? ("exception" as const) : ("ok" as const),
        // Every review metric is better higher: ahead of plan or above its range is good news.
        good: offPlan ? miss > 0 : latest > avg,
        flag: offPlan
          ? `${rate ? `${Math.abs(miss).toFixed(1)} pts` : `${Math.abs(miss).toFixed(1)}%`} ${miss < 0 ? "behind" : "ahead of"} plan`
          : unusual
            ? `Outside its usual range (${fmt(avg - 2 * sd)}–${fmt(avg + 2 * sd)})`
            : "",
        cause: offPlan || unusual ? (cause ?? "Cause unknown") : "",
        owner: m.owner,
        weeks: w,
        months: panel(months),
      };
    }),
  };
}

/**
 * A known cause for a metric's latest week, matched to what can move it:
 * holidays and data problems move activity; the onboarding launch moves
 * activation (in the 2 weeks before the week too, as a launch takes a while
 * to show); nothing on the calendar moves signups; September's seat cuts
 * moved MRR.
 */
function reviewCause(key: ReviewMetric["key"], week: { from: number; to: number }) {
  if (key === "mrr") return "Business workspaces cut seats at renewal in September";
  if (key === "signups") return undefined;
  const kinds = key === "activation" ? ["launch"] : ["holiday", "measurement"];
  const lead = key === "activation" ? 14 : 0;
  const event = PRODUCT_EVENTS.find(
    (e) =>
      kinds.includes(e.kind) &&
      !e.anyEventOnly &&
      !e.platforms &&
      week.to <= e.from &&
      week.from + lead >= e.to,
  );
  return event ? `${event.label}: ${event.detail}` : undefined;
}
