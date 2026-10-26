import { formatCurrency } from "../../../core/format";
import { TODAY, dateLabel, dayOfWeek, mean, sum } from "../../../core/sample-data";
import { STORE_EVENTS, seasonOn } from "../calendar";
import { type MetricId, METRICS, definitionOf } from "../metrics";
import { contributionOf, profitDays } from "./profit";
import { type Field, type Input, channelsFor, series, wholeDays } from "./store";

// Promotions: each promotion against what the same days would have done
// without it (the lift during, the dip after, and the break-even lift).

/** Normal days' discounts, as a share of gross sales. */
const USUAL_DISCOUNT = 0.072;

/**
 * A promotion against what the same days would have done without it: the
 * baseline is each weekday's average over the four weeks before the sale,
 * moved to each charted day's season.
 * Shows the lift during, the dip after (demand pulled forward), and the
 * lift the deeper discount needed to break even on product margin.
 */
export function promoImpact(id: Input<"get_promo_impact">["event"]) {
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
