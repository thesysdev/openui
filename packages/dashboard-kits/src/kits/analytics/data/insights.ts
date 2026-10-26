// Insights: why-cards for explain_change (walks, drivers, ghost users) and the
// before/after impact of each launch or rollback.

import { confidence, contributions, mixAndRate, walk as walkOf } from "../../../core/explain";
import { formatNumber, formatPoints } from "../../../core/format";
import {
  dateLabel,
  mean,
  PAST_WINDOWS,
  periodLabel,
  RANGE_DAYS,
  round,
  sum,
} from "../../../core/sample-data";
import type { Driver, Why } from "../../../core/schemas";
import { PRODUCT_EVENTS } from "../calendar";
import {
  activationCounts,
  actives,
  dau,
  PLANS,
  plansFor,
  PLATFORM_LABEL,
  PLATFORMS,
  platformsFor,
  population,
  segments,
  signups,
  take,
} from "./activity";
import {
  type Active,
  type Input,
  type Plan,
  type Platform,
  AGAINST_TEXT,
  COMPARISON_LABEL,
  LAST_YEAR,
  USAGE_PLAN,
} from "./shared";

export type WhyMetric = Input<"explain_change">["metric"];
const WHY_LABEL: Record<WhyMetric, string> = {
  wau: "Weekly active users",
  dau: "Daily active users",
  signups: "New signups",
  activation: "Activation",
  stickiness: "DAU/MAU",
};
const isRate = (m: WhyMetric) => m === "activation" || m === "stickiness";

/** The metric over `days` days ending `offset` days ago: actives averaged, signups summed, rates as percents. */
function whyValue(
  metric: WhyMetric,
  platform: string,
  plan: string,
  active: Active,
  days: number,
  offset: number,
) {
  if (metric === "signups") return sum(signups(platform, plan, days, offset));
  if (metric === "activation") return activationCounts(platform, plan, days, offset).rate * 100;
  if (metric === "stickiness")
    return (
      (mean(actives(1, platform, plan, active, days, offset)) /
        mean(actives(28, platform, plan, active, days, offset))) *
      100
    );
  return mean(actives(metric === "wau" ? 7 : 1, platform, plan, active, days, offset));
}

/** Users counted only because the iOS SDK sent duplicate events, averaged over the window. */
function ghostUsers(
  metric: "wau" | "dau",
  platform: string,
  plan: string,
  days: number,
  offset: number,
) {
  const window = metric === "wau" ? 7 : 1;
  const withGhosts = actives(window, platform, plan, "any", days, offset);
  const without = platformsFor(platform).map((pf) =>
    take(population(pf, plan)[metric], days, offset).map((v) => v * (1 + PLATFORMS[pf].passive)),
  );
  return mean(withGhosts.map((v, i) => v - sum(without.map((w) => w[i]!))));
}

/**
 * What each launch or rollback changed: the 7 days before it against the 7
 * days after (the launch day left out), on the platforms it touched, for daily
 * actives, signups a day, and activation of the signups in each week.
 */
export function releaseImpact() {
  return PRODUCT_EVENTS.filter((e) => e.kind === "launch" && e.from > 7).map((e) => {
    const pfs = e.platforms ?? (Object.keys(PLATFORMS) as Platform[]);
    const before = e.from + 1;
    const after = e.from - 7;
    const daily = (get: (pf: Platform, offset: number) => number[], offset: number) =>
      sum(pfs.map((pf) => mean(get(pf, offset))));
    const activation = (offset: number) => {
      const counts = pfs.map((pf) => activationCounts(pf, "all", 7, offset));
      return sum(counts.map((c) => c.aha)) / (sum(counts.map((c) => c.setup)) || 1);
    };
    const users = [before, after].map((o) => daily((pf, off) => dau(pf, "all", 7, off), o));
    const joins = [before, after].map((o) => daily((pf, off) => signups(pf, "all", 7, off), o));
    const rates = [before, after].map((o) => activation(o) * 100);
    const pct = ([b, a]: number[]) => round(((a! - b!) / (b! || 1)) * 100, 1);
    return {
      label: e.label,
      date: dateLabel(e.from),
      platforms: e.platforms
        ? e.platforms.map((pf) => PLATFORM_LABEL[pf]).join(" and ")
        : "All platforms",
      detail: e.detail,
      metrics: [
        {
          name: "Daily active users",
          before: formatNumber(users[0]!),
          after: formatNumber(users[1]!),
          change: pct(users),
          unit: "percent" as const,
        },
        {
          name: "Activation",
          before: `${rates[0]!.toFixed(1)}%`,
          after: `${rates[1]!.toFixed(1)}%`,
          change: round(rates[1]! - rates[0]!, 1),
          unit: "points" as const,
        },
        {
          name: "Signups a day",
          before: formatNumber(joins[0]!),
          after: formatNumber(joins[1]!),
          change: pct(joins),
          unit: "percent" as const,
        },
      ],
    };
  });
}

export function explainAnalytics({
  metric,
  range,
  platform,
  plan,
  active,
  compare,
}: Input<"explain_change">): Why {
  const days = RANGE_DAYS[range];
  const label = WHY_LABEL[metric];
  const rate = isRate(metric);
  const text = (v: number) => (rate ? `${v.toFixed(1)}%` : formatNumber(v));
  const signed = (v: number) =>
    rate ? formatPoints(v, 1) : `${v >= 0 ? "+" : "−"}${formatNumber(Math.abs(v))}`;
  // The comparison window: the prior period, or last year's same weekdays,
  // which the plan grows by its rates as get_usage_kpis does. Activation's
  // plan is a flat rate, shared across segments in proportion to last year's
  // rates; DAU/MAU's plan is last year's, as both sides grow alike.
  const thenOffset = compare === "previous_period" ? days : LAST_YEAR;
  const planScale =
    compare !== "plan" || metric === "stickiness"
      ? 1
      : metric === "activation"
        ? USAGE_PLAN.activation /
          (whyValue(metric, platform, plan, active, days, LAST_YEAR) || USAGE_PLAN.activation)
        : metric === "signups"
          ? USAGE_PLAN.signups
          : USAGE_PLAN.actives;
  const valueThen = (pf: string, pl: string) =>
    whyValue(metric, pf, pl, active, days, thenOffset) * planScale;
  const value = whyValue(metric, platform, plan, active, days, 0);
  const comparison = valueThen(platform, plan);
  const total = value - comparison;
  const candidates: (Driver & { value: number })[] = [];
  const driver = (
    dimension: string,
    part: { label: string; delta: number; current: number; comparison: number },
    detail?: string,
  ) => ({
    dimension,
    name: part.label,
    delta: signed(part.delta),
    share: round(total === 0 ? 0 : part.delta / total, 3),
    current: text(part.current),
    comparison: text(part.comparison),
    tone:
      part.delta > 0 ? ("good" as const) : part.delta < 0 ? ("bad" as const) : ("neutral" as const),
    ...(detail ? { detail } : {}),
    value: part.delta,
  });

  // Data first: a tracking problem in either window explains its share before any product reason.
  let dataQuality: string | undefined;
  let tracking = 0;
  if (active === "any" && (metric === "wau" || metric === "dau")) {
    tracking =
      ghostUsers(metric, platform, plan, days, 0) -
      ghostUsers(metric, platform, plan, days, thenOffset) * planScale;
    if (Math.abs(tracking) >= Math.abs(total) * 0.05 && Math.abs(tracking) >= 1) {
      const bug = PRODUCT_EVENTS.find((e) => e.id === "ios-duplicate-events")!;
      dataQuality = `${signed(tracking)} of the change is the ${bug.label} on ${dateLabel(bug.from)}–${dateLabel(bug.to)}, which counted iOS users who never opened the app. Core-action numbers are unaffected.`;
      candidates.push({
        ...driver(
          "Data",
          { label: bug.label, delta: tracking, current: tracking, comparison: 0 },
          bug.detail,
        ),
        current: "Counted",
        comparison: "Not counted",
      });
    }
  }

  let walkSteps: { label: string; delta: number }[];
  if (rate) {
    // Rates split into mix (which platforms and plans the users come from) and rate (each one's own).
    const split = mixAndRate(
      segments(platform, plan).map(([pf, pl]) => {
        const pair = (offset: number, scale = 1) => {
          if (metric === "activation") {
            const c = activationCounts(pf, pl, days, offset);
            return { n: c.aha * 100 * scale, d: c.setup };
          }
          return {
            n: mean(actives(1, pf, pl, active, days, offset)) * 100,
            d: mean(actives(28, pf, pl, active, days, offset)),
          };
        };
        const now = pair(0);
        const then = pair(thenOffset, planScale);
        return {
          key: `${pf}:${pl}`,
          label: `${PLATFORM_LABEL[pf]} ${PLANS[pl].label}`,
          numerator: [now.n, then.n],
          denominator: [now.d, then.d],
        };
      }),
    );
    walkSteps = [
      { label: "Mix of users", delta: split.mix },
      { label: "Within each group", delta: split.rate },
    ];
    for (const p of split.parts) {
      candidates.push(
        driver("Within group", {
          label: p.label,
          delta: p.rate,
          current: p.ratio[0],
          comparison: p.ratio[1],
        }),
        driver("Mix", {
          label: p.label,
          delta: p.mix,
          current: p.weight[0] * 100,
          comparison: p.weight[1] * 100,
        }),
      );
    }
  } else {
    const parts = (dimension: "platform" | "plan") =>
      contributions(
        (dimension === "platform" ? platformsFor(platform) : plansFor(plan)).map((key) => {
          const [pf, pl] = dimension === "platform" ? [key, plan] : [platform, key];
          return {
            key,
            label:
              dimension === "platform" ? PLATFORM_LABEL[key as Platform] : PLANS[key as Plan].label,
            current: whyValue(metric, pf, pl, active, days, 0),
            comparison: valueThen(pf, pl),
          };
        }),
      );
    const byPlatform = parts("platform");
    walkSteps = [
      ...(tracking ? [{ label: "Tracking", delta: tracking }] : []),
      ...byPlatform.map((p) => ({
        label: p.label,
        delta: p.delta - (tracking && p.key === "ios" ? tracking : 0),
      })),
    ];
    // A dimension with one member (a single platform or plan picked) explains nothing.
    if (byPlatform.length > 1) byPlatform.forEach((p) => candidates.push(driver("Platform", p)));
    if (plan === "all") parts("plan").forEach((p) => candidates.push(driver("Plan", p)));
  }

  const past = Array.from(
    { length: PAST_WINDOWS[range] },
    (_, k) =>
      whyValue(metric, platform, plan, active, days, (k + 1) * days) -
      whyValue(metric, platform, plan, active, days, (k + 2) * days),
  );
  const sure = confidence(total, past, comparison, { centre: compare === "previous_period" });
  const explained = sure.level !== "Low";
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
      .map(({ value: _v, ...d }) => d);
  };
  const drivers = explained ? pick(true, 4) : [];
  const offsetting = explained ? pick(false, 3) : [];
  const change = comparison === 0 ? 0 : (total / Math.abs(comparison)) * 100;
  // A holiday in the prior period makes this one look better than it is; one
  // in this period, against last year's ordinary weeks, makes it look worse.
  const holidays = PRODUCT_EVENTS.filter((e) => e.kind === "holiday");
  const holidayThen =
    compare === "previous_period"
      ? holidays.find((e) => e.to >= days && e.from < days * 2)
      : undefined;
  const holidayNow =
    compare === "previous_period" ? undefined : holidays.find((e) => e.from < days);
  // A launch inside this period is evidence worth naming, not a proven cause.
  const launch = PRODUCT_EVENTS.find((e) => e.kind === "launch" && e.from < days);
  const size = rate ? `${Math.abs(total).toFixed(1)} pts` : formatNumber(Math.abs(total));
  const top = dataQuality ? undefined : drivers[0];
  const move = `${size} (${Math.abs(change).toFixed(1)}%)`;
  const head =
    compare === "plan"
      ? `${move} ${total >= 0 ? "above" : "below"} plan`
      : `${total >= 0 ? "up" : "down"} ${move} ${compare === "last_year" ? "on the same days last year" : `on the prior ${days} days`}`;
  const summary = [
    `${label} ${metric === "signups" ? "are" : "is"} ${head}.`,
    !explained
      ? `${sure.note}, so no single cause stands out.`
      : top
        ? `The biggest driver is ${top.name} (${top.dimension.toLowerCase()}): ${top.delta}, ${Math.round(Math.abs(top.share) * 100)}% of the change.`
        : "",
    dataQuality ?? "",
    holidayThen
      ? `The prior period includes the ${holidayThen.label}, which lowers the comparison.`
      : "",
    holidayNow ? `This period includes the ${holidayNow.label}, which lowers it.` : "",
    launch && explained && (metric === "activation" || metric === "wau")
      ? `${launch.label} shipped on ${dateLabel(launch.from)}, inside this period.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
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
    summary,
    drivers,
    offsetting,
    walk: walkOf(
      { label: COMPARISON_LABEL[compare], value: comparison },
      walkSteps,
      { label: "This period", value },
      Math.abs(total) * 0.005,
    ).map((s) => ({ ...s, value: round(s.value, rate ? 2 : 0) })),
    format: rate ? "percent" : "number",
    ...(dataQuality ? { dataQuality } : {}),
  };
}
