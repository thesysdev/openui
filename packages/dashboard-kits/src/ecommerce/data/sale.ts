import { formatCurrency, formatNumber } from "../../core/format";
import type { MetricDefinition } from "../../core/metrics";
import { dateLabel, sum } from "../../core/sample-data";
import type { Item } from "../../core/schemas";
import { LAST_YEAR, STORE_EVENTS } from "../calendar";
import { type MetricId, METRICS, definitionOf } from "../metrics";
import { LEAD_TIME, SAFETY_DAYS, inventory, productSales } from "./products";
import { PLAN, adSpendDaily } from "./profit";
import { channelsFor, series, wholeDays } from "./store";

// Sale command center: the Black Friday Cyber Monday 2026 plan, from last
// year's same days, and the stock it needs.

/** Black Friday 2026 is Nov 27, 48 days after today; Cyber Monday is Nov 30. */
const BFCM_2026 = { from: -48, to: -51 };

export function salePlan() {
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
