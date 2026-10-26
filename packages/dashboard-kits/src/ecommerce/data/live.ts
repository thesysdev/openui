import { formatCurrency, formatNumber } from "../../core/format";
import { AS_OF, dayOfWeek, mean, random, RANGE_DAYS, round, sum } from "../../core/sample-data";
import type { Item, Range } from "../../core/schemas";
import type { MetricId } from "../metrics";
import { productSales } from "./products";
import { metric } from "./profit";
import {
  channelsFor,
  hourShares,
  MINUTES_SO_FAR,
  series,
  shareBy,
  shareSoFar,
  STOREFRONT,
  wholeDays,
  type Field,
} from "./store";

// Orders by hour (the weekday by hour grid over whole days) and the live view:
// today so far against yesterday at the same time, the projected close, and
// the last hour in five-minute steps.

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Average orders per hour by weekday over the whole days of the range (ending
 * yesterday, so today's open hours don't skew it): each day's real orders per
 * channel, spread over the hours by that channel's profile.
 */
export function ordersByHour(range: Range, channel: string) {
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

export function liveView() {
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
