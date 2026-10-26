import {
  type RatioSegment,
  type Segment,
  confidence,
  contributions,
  mixAndRate,
  walk as walkOf,
} from "../../core/explain";
import { formatCurrency, formatNumber, formatPoints } from "../../core/format";
import {
  dateLabel,
  PAST_WINDOWS,
  periodLabel,
  RANGE_DAYS,
  round,
  sum,
} from "../../core/sample-data";
import type { Compare, Driver, Item, Range, ValueFormat, Why } from "../../core/schemas";
import { LAST_YEAR, STORE_EVENTS, trackedSessions } from "../calendar";
import {
  type ProfitDays,
  type ProfitLine,
  adSpendDaily,
  against,
  AGAINST_TEXT,
  COMPARISON_LABEL,
  contributionOf,
  PLAN,
  profitAgainst,
  profitDays,
  storefrontShare,
} from "./profit";
import { salesBy } from "./sales";
import {
  type Channel,
  type Field,
  type Input,
  CHANNELS,
  channelsFor,
  current,
  HISTORY,
  series,
  STOREFRONT,
} from "./store";

// Why a metric changed (explain_change): the usual range of changes, the
// drivers by segment, mix and rate, tracking effects, and the profit walk.

export type WhyMetric = Input<"explain_change">["metric"];

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
export const whyText = (metric: WhyMetric) =>
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
export const USUAL_FOR: Record<string, WhyMetric> = {
  "Total sales": "total_sales",
  Orders: "orders",
  "Average order value": "aov",
  "Conversion rate": "conversion_rate",
};

/**
 * A metric's own usual range (our rule): its 10th to 90th percentile over up
 * to 13 earlier periods of the same length, and whether this period is inside.
 */
export function usualRange(
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

export function explain({ metric, range, channel, compare }: Input<"explain_change">): Why {
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
