import { periodChangeInsight } from "../../core/explain";
import { formatCurrency, formatNumber } from "../../core/format";
import {
  AS_OF,
  RANGE_DAYS,
  TODAY,
  between,
  bucket,
  changeText,
  dateLabel,
  dayLabels,
  downsample,
  mean,
  periodLabel,
  random,
  round,
  sum,
} from "../../core/sample-data";
import type { Goal, Insight, Item, Kpi, Range } from "../../core/schemas";
import { definitionOf } from "../metrics";
import { creatives } from "./creatives";
import {
  BUYERS_PER_ORDER,
  LTV_CURVE,
  ORDER_GAP,
  PLATFORM_CLAIM,
  SEGMENTS,
  activeCustomers,
  cohortLtv,
  flowDaily,
  lapsePoint,
  orderJourney,
  repeatRate,
  segmentMovement,
} from "./customers";
import { USUAL_FOR, type WhyMetric, explain, usualRange, whyText } from "./explain";
import { COUNTRIES, CUSTOMERS, ledger, pct, times } from "./helpers";
import { DEVICES, journey } from "./journeys";
import { liveView, ordersByHour } from "./live";
import { PAID, aboveBreakEven, marketing } from "./marketing";
import {
  CATEGORY_LABELS,
  inventory,
  inventoryCatalog,
  productSales,
  stockStatus,
} from "./products";
import {
  AGAINST_TEXT,
  COMPARISON_LABEL,
  type ProfitDays,
  type ProfitLine,
  against,
  beforeMarketingOf,
  breakEvenRoas,
  cohortCac,
  contributionOf,
  eventsFor,
  firstOrderProfit,
  items,
  metric,
  ncpa,
  profitAgainst,
  profitDays,
  roundTo,
  trendOf,
} from "./profit";
import { promoImpact } from "./promotions";
import { ATTRIBUTION_LABEL, EXCHANGE_SHARE, RETURN_REASONS, exchangeMatrix } from "./returns";
import { salePlan } from "./sale";
import { salesBy, splitOverTime } from "./sales";
import {
  CHANNELS,
  type Channel,
  type Field,
  type Input,
  MINUTES_SO_FAR,
  STOREFRONT,
  channelsFor,
  current,
  previous,
  ratio,
  series,
} from "./store";
import { MONTH_DAYS, MONTH_ELAPSED, TARGETS, adBudgets, monthTarget, octoberPlan } from "./targets";

// The tool handlers: `ecommerceHandlers` maps each e-commerce tool to the
// function that answers it from the simulation. The recommended actions live
// here too, since they reuse a handler (the customer segments) and the map in
// turn serves them.

/**
 * What to do next, each computed from the same numbers the dashboards show,
 * with its expected effect. Approving one in the demo only writes to a log.
 */
function recommendedActions(range: Range) {
  const days = RANGE_DAYS[range];
  const breakEven = breakEvenRoas(days);
  const items = inventory();
  const runner = items.find((i) => i.sku === "FTW-TRL-01")!;
  const beanie = items.find((i) => i.sku === "ACC-BEA-03")!;
  const tiktok = marketing(range).channels.find((c) => c.m.key === "tiktok")!;
  const tiktokRoas = tiktok.revenue / tiktok.spend;
  // A dollar of ad spend returns ROAS ÷ break-even in profit before marketing.
  const cut = 0.3 * tiktok.spend;
  const saved = cut * (1 - tiktokRoas / breakEven);
  const atRisk = run.segments().find((s) => s.name === "At risk")!;
  const winBack = atRisk.customers * 0.04 * 82 * 0.46;
  const boot = productSales(range, "all").find((p) => p.sku === "FTW-DBT-03")!;
  const extraReturns = boot.revenue * (boot.returnRate - 0.11);
  const actions = [
    {
      id: "reorder-trail-runner",
      title: `Order ${formatNumber(runner.suggestedOrder ?? 0)} more ${runner.name}`,
      detail: `It sells ${runner.dailySales.toFixed(0)} a day and runs out in ${runner.daysOfCover.toFixed(0)} days, ${Math.ceil(runner.stockoutGapDays)} days before the open order lands.`,
      impact: runner.revenueAtRisk,
      impactText: `${formatCurrency(runner.revenueAtRisk)} of sales protected`,
      owner: "Merchandising",
      effort: "Low",
    },
    {
      id: "cut-tiktok",
      title: "Cut TikTok spend by 30%",
      detail: `Its ROAS is ${tiktokRoas.toFixed(2)}x against a ${breakEven.toFixed(2)}x break-even, so each dollar loses ${formatCurrency(1 - tiktokRoas / breakEven)} of profit. Keep the unboxing video; pause the trend-sound ad.`,
      impact: saved,
      impactText: `${formatCurrency(saved)} more contribution profit per ${days} days`,
      owner: "Marketing",
      effort: "Low",
    },
    {
      id: "pause-beanie-ads",
      title: `Pause ads for ${beanie.name} until stock lands`,
      detail: `It is out of stock, and ${formatCurrency(beanie.adSpendPerDay)} a day of ads still send shoppers to it. ${formatNumber(beanie.incoming ?? 0)} units land in ${beanie.incomingInDays} days.`,
      impact: beanie.adSpendPerDay * (beanie.incomingInDays ?? 0),
      impactText: `${formatCurrency(beanie.adSpendPerDay * (beanie.incomingInDays ?? 0))} of ad spend saved`,
      owner: "Marketing",
      effort: "Low",
    },
    {
      id: "win-back-at-risk",
      title: `Send a win-back offer to ${formatNumber(atRisk.customers)} at-risk customers`,
      detail: `They last ordered ${atRisk.daysSinceOrder} days ago on average, past the ${lapsePoint().days}-day lapse point. A 4% response at the usual order size and margin pays for a modest offer.`,
      impact: winBack,
      impactText: `${formatCurrency(winBack)} of contribution profit if 4% order`,
      owner: "Retention",
      effort: "Medium",
    },
    {
      id: "fit-note-desert-boot",
      title: `Add a fit note to ${boot.name}`,
      detail: `${Math.round(boot.returnRate * 100)}% of units come back, against 11% for footwear, mostly for size. Footwear exchanges show it runs small.`,
      impact: extraReturns / 2,
      impactText: `${formatCurrency(extraReturns / 2)} fewer refunds if half the extra returns stop`,
      owner: "Merchandising",
      effort: "Low",
    },
  ];
  return actions
    .sort((a, b) => b.impact - a.impact)
    .map(({ impact, ...a }) => ({ ...a, impact: Math.round(impact) }));
}

/** Handlers other handlers reuse. */
const run = {
  segments: () =>
    (
      ecommerceHandlers.get_customer_segments!({}) as {
        segments: { name: string; customers: number; daysSinceOrder: number }[];
      }
    ).segments,
};

export const ecommerceHandlers: Record<string, (args: any) => unknown> = {
  get_store_kpis({ range, channel, compare }: Input<"get_store_kpis">) {
    const chs = channelsFor(channel);
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    const prior = (s: Channel[], f: Field, r: Range) => against(s, f, r, compare);
    const sales = current(chs, "total", range);
    const orders = current(chs, "orders", range);
    const discounts = current(chs, "discounts", range);
    const aovDaily = ratio(
      current(chs, "gross", range).map((g, i) => g - discounts[i]),
      orders,
    );
    const priorDiscounts = prior(chs, "discounts", range);
    const priorAovDaily = ratio(
      prior(chs, "gross", range).map((g, i) => g - priorDiscounts[i]),
      prior(chs, "orders", range),
    );
    const aov = (s: Channel[], get: typeof current) =>
      (sum(get(s, "gross", range)) - sum(get(s, "discounts", range))) /
      sum(get(s, "orders", range));
    const returning = (get: typeof current) =>
      (1 - sum(get(chs, "newOrders", range)) / sum(get(chs, "orders", range))) * 100;
    const profitNow = contributionOf(profitDays(chs, RANGE_DAYS[range], 0));
    const profitThen = contributionOf(profitAgainst(chs, range, compare));
    const hero = metric("contribution_profit", sum(profitNow), sum(profitThen), formatCurrency, {
      series: profitNow,
      hint: "What is left after products, delivery, fees, returns, and marketing",
    });
    const heroTrend = {
      ...trendOf(range, profitNow, profitThen, "currency", eventsFor(range)),
      comparisonLabel: COMPARISON_LABEL[compare],
      // The lead: the same sentence explain_change writes for this metric and comparison.
      summary: explain({ metric: "contribution_profit", range, channel, compare }).summary,
    };
    const metrics: Kpi[] = [
      metric("total_sales", sum(sales), sum(prior(chs, "total", range)), formatCurrency, {
        series: sales,
        previousSeries: prior(chs, "total", range),
        range,
        chart: "currency",
        total: true,
      }),
      metric("orders", sum(orders), sum(prior(chs, "orders", range)), formatNumber, {
        series: orders,
        previousSeries: prior(chs, "orders", range),
        range,
        chart: "number",
        total: true,
      }),
      metric("aov", aov(chs, current), aov(chs, prior), formatCurrency, {
        series: aovDaily,
        previousSeries: priorAovDaily,
        range,
        chart: "currency",
      }),
    ];
    if (storefront.length) {
      const sessions = current(storefront, "sessions", range);
      const conv = (get: typeof current) =>
        (sum(get(storefront, "orders", range)) / sum(get(storefront, "sessions", range))) * 100;
      metrics.push(
        metric("conversion_rate", conv(current), conv(prior), pct, {
          series: ratio(current(storefront, "orders", range), sessions).map((v) => v * 100),
          previousSeries: ratio(
            prior(storefront, "orders", range),
            prior(storefront, "sessions", range),
          ).map((v) => v * 100),
          hint: "DTC benchmark 1.5–3.5%",
          range,
          chart: "percent",
          band: { label: "DTC benchmark 1.5–3.5%", from: 1.5, to: 3.5 },
        }),
        metric("sessions", sum(sessions), sum(prior(storefront, "sessions", range)), formatNumber, {
          series: sessions,
          previousSeries: prior(storefront, "sessions", range),
          hint: "Online store and app",
          range,
          chart: "number",
          total: true,
        }),
      );
    } else {
      metrics.push(
        {
          label: "Conversion rate",
          value: "—",
          hint: "Not tracked for Amazon",
          definition: definitionOf("conversion_rate"),
        },
        {
          label: "Sessions",
          value: "—",
          hint: "Not tracked for Amazon",
          definition: definitionOf("sessions"),
        },
      );
    }
    metrics.push(
      metric(
        "returning_customer_rate",
        returning(current),
        returning(prior),
        (v) => `${v.toFixed(1)}%`,
        {
          series: ratio(current(chs, "newOrders", range), orders).map((v) => (1 - v) * 100),
          previousSeries: ratio(prior(chs, "newOrders", range), prior(chs, "orders", range)).map(
            (v) => (1 - v) * 100,
          ),
          hint: "Benchmark 20–40%",
          range,
          chart: "percent",
          band: { label: "Benchmark 20–40%", from: 20, to: 40 },
        },
      ),
    );
    // Each KPI's usual range: the same-length periods before this one.
    const usual = (metric: WhyMetric, k: Kpi, format: (v: number) => string): Kpi => ({
      ...k,
      usual: usualRange(metric, chs, range, format),
    });
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      hero: usual("contribution_profit", hero, formatCurrency),
      heroTrend,
      metrics: metrics
        .map((k) => {
          const metric = USUAL_FOR[k.label];
          return metric && k.trend ? usual(metric, k, whyText(metric)) : k;
        })
        .map((k) =>
          k.trend ? { ...k, trend: { ...k.trend, comparisonLabel: COMPARISON_LABEL[compare] } } : k,
        ),
      rules: [
        `Compared with ${compare === "previous_period" ? `the prior ${RANGE_DAYS[range]} days` : AGAINST_TEXT[compare]}`,
        channel === "all" ? "All channels" : CHANNELS[channel as Channel].label,
        `US dollars, days in UTC; today until ${AS_OF.split(", ")[1]}, against the same hours before`,
        "Total sales include shipping and taxes; net sales and profit do not",
        "Revenue from store orders, not ad-platform claims",
      ],
    };
  },

  explain_change: explain,

  get_annotations({ range }: Input<"get_annotations">) {
    return { events: eventsFor(range) };
  },

  get_promo_impact({ event }: Input<"get_promo_impact">) {
    return promoImpact(event);
  },

  get_reconciliation({ range }: Input<"get_reconciliation">) {
    const days = RANGE_DAYS[range];
    const platforms = marketing(range)
      .channels.filter((c) => PAID.has(c.m.key))
      .map((c) => {
        const claimed =
          c.revenue *
          PLATFORM_CLAIM[c.m.key as keyof typeof PLATFORM_CLAIM] *
          between(`claim:${c.m.key}:${range}`, 0.95, 1.05);
        return {
          platform: c.m.label,
          spend: Math.round(c.spend),
          storeRevenue: Math.round(c.revenue),
          claimedRevenue: Math.round(claimed),
          storeRoas: round(c.revenue / c.spend, 2),
          claimedRoas: round(claimed / c.spend, 2),
        };
      });
    const store = sum(platforms.map((p) => p.storeRevenue));
    const claimed = sum(platforms.map((p) => p.claimedRevenue));
    const storefrontSales = sum(series(STOREFRONT, "total", days));
    return {
      periodLabel: periodLabel(range),
      platforms,
      storeTotal: store,
      claimedTotal: claimed,
      storefrontSales: Math.round(storefrontSales),
      summary: `Meta, Google, and TikTok claim ${formatCurrency(claimed)} of sales for their ads; the store's own orders credit them with ${formatCurrency(store)}, so together they claim ${(claimed / store).toFixed(2)}× what they drove${claimed > storefrontSales ? ", more than every store and app sale in the period" : ""}. ROAS on this dashboard uses the store's numbers.`,
    };
  },

  get_sales_over_time({
    range,
    channel,
    customerType: type,
    compare,
  }: Input<"get_sales_over_time">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const { labels, values } = bucket(
      dayLabels(days),
      [
        current(chs, "total", range, type),
        against(chs, "total", range, compare, type),
        current(chs, "orders", range, type),
      ],
      range,
    );
    return {
      labels,
      totalSales: values[0].map(Math.round),
      comparison: values[1].map(Math.round),
      comparisonLabel: COMPARISON_LABEL[compare],
      orders: values[2].map(Math.round),
      events: eventsFor(range),
    };
  },

  get_sales_breakdown({ range, channel, customerType: type }: Input<"get_sales_breakdown">) {
    const chs = channelsFor(channel);
    const s = (f: Field) => sum(current(chs, f, range, type));
    const p = (f: Field) => sum(previous(chs, f, range, type));
    return {
      lines: ledger([
        ["Gross sales", "base", s("gross"), p("gross")],
        ["Discounts", "subtract", s("discounts"), p("discounts")],
        ["Returns", "subtract", s("returns"), p("returns")],
        ["Net sales", "total", s("net"), p("net")],
        ["Shipping charges", "add", s("shipping"), p("shipping")],
        ["Taxes", "add", s("taxes"), p("taxes")],
        ["Total sales", "total", s("total"), p("total")],
      ]),
    };
  },

  get_sales_by(args: Input<"get_sales_by">) {
    const breakdown = salesBy(args);
    const parts =
      args.dimension === "channel"
        ? (Object.keys(CHANNELS) as Channel[])
        : args.dimension === "device"
          ? channelsFor(args.channel).filter((c) => STOREFRONT.includes(c))
          : channelsFor(args.channel);
    return {
      ...breakdown,
      overTime: breakdown.items.length
        ? splitOverTime(args.range, parts, breakdown.items, args.customerType)
        : { labels: [], series: [] },
    };
  },

  get_marketing_performance({ range, model, window }: Input<"get_marketing_performance">) {
    const days = RANGE_DAYS[range];
    const attribution = { model, window };
    const cur = marketing(range, 0, attribution);
    const prev = marketing(range, days, attribution);
    const storefrontSales = (offset: number) => sum(series(STOREFRONT, "total", days, offset));
    const allSales = (offset: number) => sum(series(channelsFor("all"), "total", days, offset));
    const newOrders = (offset: number) => sum(series(STOREFRONT, "newOrders", days, offset));
    const dailySpend = cur.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const totalRevenue = sum(cur.channels.map((c) => c.revenue));
    const prevDailySpend = prev.channels
      .filter((c) => PAID.has(c.m.key))
      .reduce((acc, c) => acc.map((v, i) => v + c.spendDaily[i]), new Array(days).fill(0));
    const dailyRoas = (offset: number, spend: number[]) =>
      series(STOREFRONT, "total", days, offset).map((v, i) => v / (spend[i] || 1));
    const dailyMer = (offset: number, spend: number[], other: number) =>
      series(channelsFor("all"), "total", days, offset).map(
        (v, i) => v / ((spend[i] || 1) + other / days),
      );
    const firstSales = (offset: number) => sum(series(STOREFRONT, "total", days, offset, "new"));
    const dailyCpa = (offset: number, spend: number[]) =>
      series(STOREFRONT, "newOrders", days, offset).map((v, i) => spend[i] / (v || 1));
    return {
      periodLabel: periodLabel(range),
      rules: [
        `Compared with the prior ${days} days`,
        "Ad spend as billed by Meta, Google, and TikTok",
        model === "platform"
          ? `Channel revenue as each platform reports it (${window} window); it adds up to more than the store sold`
          : `Channel revenue by ${ATTRIBUTION_LABEL[model]} with a ${window} window, from store orders`,
        `Break-even ROAS ${breakEvenRoas(days).toFixed(2)}x, from profit before marketing`,
      ],
      hero: metric(
        "blended_roas",
        storefrontSales(0) / cur.adSpend,
        storefrontSales(days) / prev.adSpend,
        times,
        {
          series: dailyRoas(0, dailySpend),
          hint: "Store and app revenue ÷ ad spend on Meta, Google, and TikTok",
        },
      ),
      heroTrend: {
        ...trendOf(
          range,
          dailyRoas(0, dailySpend),
          dailyRoas(days, prevDailySpend),
          "ratio",
          eventsFor(range),
          true,
        ),
        // Below this, ad spend costs more than the profit it brings in.
        target: {
          label: `Break-even ${breakEvenRoas(days).toFixed(1)}x`,
          value: round(breakEvenRoas(days), 2),
        },
      },
      metrics: [
        metric("ad_spend", cur.adSpend, prev.adSpend, formatCurrency, {
          series: dailySpend,
          previousSeries: prevDailySpend,
          hint: "Meta, Google, and TikTok",
          range,
          chart: "currency",
          total: true,
        }),
        metric(
          "mer",
          allSales(0) / (cur.adSpend + cur.otherMarketing),
          allSales(days) / (prev.adSpend + prev.otherMarketing),
          times,
          {
            series: dailyMer(0, dailySpend, cur.otherMarketing),
            previousSeries: dailyMer(days, prevDailySpend, prev.otherMarketing),
            hint: "Total sales ÷ all marketing spend · healthy DTC 3–5x",
            range,
            chart: "ratio",
            band: { label: "Healthy DTC 3–5x", from: 3, to: 5 },
          },
        ),
        metric(
          "new_customer_cpa",
          cur.adSpend / newOrders(0),
          prev.adSpend / newOrders(days),
          formatCurrency,
          {
            series: dailyCpa(0, dailySpend),
            previousSeries: dailyCpa(days, prevDailySpend),
            hint: "Ad spend ÷ new-customer orders",
            range,
            chart: "currency",
          },
        ),
        metric("new_customers_storefront", newOrders(0), newOrders(days), formatNumber, {
          series: series(STOREFRONT, "newOrders", days),
          previousSeries: series(STOREFRONT, "newOrders", days, days),
          hint: "First-time buyers in the store and app",
          range,
          chart: "number",
          total: true,
        }),
        metric("amer", firstSales(0) / cur.adSpend, firstSales(days) / prev.adSpend, times, {
          series: series(STOREFRONT, "total", days, 0, "new").map(
            (v, i) => v / (dailySpend[i] || 1),
          ),
          previousSeries: series(STOREFRONT, "total", days, days, "new").map(
            (v, i) => v / (prevDailySpend[i] || 1),
          ),
          hint: "What new customers' first orders return per ad dollar",
          range,
          chart: "ratio",
        }),
        metric(
          "first_order_profit",
          firstOrderProfit(days, 0),
          firstOrderProfit(days, days),
          formatCurrency,
          {
            // Each day reads the 7 days up to it: one day's new customers are too few.
            series: Array.from({ length: days }, (_, i) => firstOrderProfit(7, days - 1 - i)),
            previousSeries: Array.from({ length: days }, (_, i) =>
              firstOrderProfit(7, 2 * days - 1 - i),
            ),
            hint: "Per new customer, after ad spend",
            range,
            chart: "currency",
          },
        ),
      ],
      channels: cur.channels.map((c, i) => {
        const p = prev.channels[i];
        const hasRoas = c.spend > 0;
        return {
          channel: c.m.label,
          type: c.m.type,
          spend: Math.round(c.spend),
          revenue: Math.round(c.revenue),
          ...(hasRoas
            ? {
                roas: round(c.revenue / c.spend, 2),
                cpa: round(c.spend / c.orders, 2),
                roasChange: round(
                  ((c.revenue / c.spend - p.revenue / p.spend) / (p.revenue / p.spend)) * 100,
                ),
              }
            : {}),
          orders: Math.round(c.orders),
          newCustomers: Math.round(c.newCustomers),
          share: round(c.revenue / totalRevenue, 4),
          trend: downsample(c.revenueDaily, 14).map(Math.round),
        };
      }),
      targetRoas: round(breakEvenRoas(days), 2),
    };
  },

  get_profit_bridge({ range, channel, compare }: Input<"get_profit_bridge">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const totals = (p: ProfitDays) => {
      const t = Object.fromEntries(
        Object.entries(p).map(([line, values]) => [line, sum(values)]),
      ) as Record<ProfitLine, number>;
      const gross = t.net - t.cogs;
      const beforeMarketing = gross - t.fulfillment - t.fees - t.returnCosts;
      return {
        ...t,
        gross,
        beforeMarketing,
        contribution: beforeMarketing - t.adSpend - t.otherMarketing,
      };
    };
    const c = totals(profitDays(chs, days, 0));
    const p = totals(profitAgainst(chs, range, compare));
    const share = (v: number) => `${((v / c.net) * 100).toFixed(1)}%`;
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      comparisonLabel: COMPARISON_LABEL[compare],
      lines: ledger([
        ["Net sales", "base", c.net, p.net],
        ["Cost of goods", "subtract", c.cogs, p.cogs],
        ["Gross profit", "total", c.gross, p.gross],
        ["Fulfillment", "subtract", c.fulfillment, p.fulfillment],
        ["Fees", "subtract", c.fees, p.fees],
        ["Return costs", "subtract", c.returnCosts, p.returnCosts],
        ["Profit before marketing", "total", c.beforeMarketing, p.beforeMarketing],
        ["Ad spend", "subtract", c.adSpend, p.adSpend],
        ["Other marketing", "subtract", c.otherMarketing, p.otherMarketing],
        ["Contribution profit", "total", c.contribution, p.contribution],
      ]),
      grossMargin: share(c.gross),
      contributionMargin: share(c.contribution),
      breakEvenRoas: round(breakEvenRoas(days), 2),
      profitPerOrder: formatCurrency(c.contribution / sum(current(chs, "orders", range))),
      // Every sales channel side by side, whatever the channel filter.
      byChannel: (Object.keys(CHANNELS) as Channel[]).map((ch) => {
        const t = totals(profitDays([ch], days, 0));
        const before = totals(profitAgainst([ch], range, compare));
        return {
          name: CHANNELS[ch].label,
          net: Math.round(t.net),
          productCost: Math.round(t.cogs),
          feesAndFulfillment: Math.round(t.fulfillment + t.fees + t.returnCosts),
          marketing: Math.round(t.adSpend + t.otherMarketing),
          contribution: Math.round(t.contribution),
          margin: round(t.contribution / (t.net || 1), 4),
          marginBefore: round(before.contribution / (before.net || 1), 4),
        };
      }),
    };
  },

  get_purchase_journey({ range, device }: Input<"get_purchase_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Session start", "sessions"),
        step("Viewed a product", "views", "41s"),
        step("Added to cart", "carts", "3m 12s"),
        step("Began checkout", "checkouts", "5m 48s"),
        step("Purchased", "purchases", "4m 25s"),
      ],
      conversionRate: `${((c.purchases / c.sessions) * 100).toFixed(2)}%`,
    };
  },

  get_checkout_journey({ range, device }: Input<"get_checkout_journey">) {
    const c = journey(range, device, "current");
    const p = journey(range, device, "previous");
    const step = (label: string, key: keyof typeof c, medianTime?: string) => ({
      label,
      value: Math.round(c[key]),
      previous: Math.round(p[key]),
      ...(medianTime ? { medianTime } : {}),
    });
    return {
      steps: [
        step("Began checkout", "checkouts"),
        step("Added shipping info", "shipping", "1m 05s"),
        step("Added payment info", "payment", "1m 40s"),
        step("Purchased", "purchases", "38s"),
      ],
      checkoutCompletion: `${((c.purchases / c.checkouts) * 100).toFixed(1)}%`,
    };
  },

  get_customer_kpis({ range }: Input<"get_customer_kpis">) {
    const all = channelsFor("all");
    const days = RANGE_DAYS[range];
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const returning = (get: typeof current) =>
      (1 - sum(get(all, "newOrders", range)) / sum(get(all, "orders", range))) * 100;
    // 12-month LTV from the cohort curve: September's cohort (projected),
    // against the cohort the comparison period acquired; and the cohorts so far.
    const back = Math.max(1, Math.round(days / 30));
    const ltv = cohortLtv(8, 12);
    const ltvBefore = cohortLtv(8 - back, 12);
    const all90 = profitDays(all, 90, 0);
    const grossMargin = 1 - sum(all90.cogs) / sum(all90.net);
    const ratioNow = (ltv * grossMargin) / ncpa(range);
    const ratioPrev = (ltvBefore * grossMargin) / ncpa(range, days);
    // Repeat purchase at each of the last 7 month ends: a trailing year each,
    // as far back as the history reaches.
    const monthEnds = Array.from({ length: 7 }, (_, i) => (6 - i) * 30);
    return {
      periodLabel: periodLabel(range),
      hero: metric(
        "new_customers",
        sum(newOrders),
        sum(previous(all, "newOrders", range)),
        formatNumber,
        {
          series: newOrders,
          hint: "First order ever placed in the period, all channels",
        },
      ),
      heroTrend: trendOf(range, newOrders, previous(all, "newOrders", range), "number", [
        ...eventsFor(range),
      ]),
      metrics: [
        metric(
          "customers",
          sum(orders) * BUYERS_PER_ORDER,
          sum(previous(all, "orders", range)) * BUYERS_PER_ORDER,
          formatNumber,
          {
            series: orders.map((o) => o * BUYERS_PER_ORDER),
            previousSeries: previous(all, "orders", range).map((o) => o * BUYERS_PER_ORDER),
            hint: "Unique buyers in the period, all channels",
            range,
            chart: "number",
            total: true,
          },
        ),
        metric(
          "returning_customer_rate",
          returning(current),
          returning(previous),
          (v) => `${v.toFixed(1)}%`,
          {
            series: ratio(newOrders, orders).map((v) => (1 - v) * 100),
            previousSeries: ratio(
              previous(all, "newOrders", range),
              previous(all, "orders", range),
            ).map((v) => (1 - v) * 100),
            hint: "Share of orders from returning customers",
            range,
            chart: "percent",
          },
        ),
        metric("repeat_purchase_rate", repeatRate(0), repeatRate(days), (v) => `${v.toFixed(1)}%`, {
          series: monthEnds.map(repeatRate),
          hint: "Customers with 2+ orders in the last 12 months",
        }),
        // The gap between orders is a property of the store in our model, so it holds.
        metric(
          "time_between_orders",
          ORDER_GAP.median,
          ORDER_GAP.median,
          (v) => `${Math.round(v)} days`,
          { hint: "Median days from one order to the next" },
        ),
        metric("ltv_12m", ltv, ltvBefore, formatCurrency, {
          series: Array.from({ length: 9 }, (_, k) => cohortLtv(k, 12)),
          hint: "Revenue per customer in their first 12 months, from the cohort curve",
        }),
        metric("ltv_cac", ratioNow, ratioPrev, times, {
          hint: "Gross-margin LTV ÷ new customer CPA · healthy ≥ 3x",
        }),
      ],
    };
  },

  get_customer_flow({ range }: Input<"get_customer_flow">) {
    const days = RANGE_DAYS[range];
    const now = flowDaily(days, 0);
    const then = flowDaily(days, days);
    const { labels, values } = bucket(
      dayLabels(days),
      [now.newCustomers, now.reactivated, now.lapsed, now.net],
      range,
    );
    const signedCount = (v: number) => `${v >= 0 ? "+" : "−"}${formatNumber(Math.abs(v))}`;
    const daily = (key: keyof typeof now, sign = 1) => ({
      series: now[key].map((v) => v * sign),
      previousSeries: then[key].map((v) => v * sign),
      range,
      chart: "number" as const,
      total: true,
    });
    return {
      periodLabel: periodLabel(range),
      labels,
      newCustomers: values[0].map(Math.round),
      reactivated: values[1].map(Math.round),
      lapsed: values[2].map((v) => -Math.round(v)),
      net: values[3].map(Math.round),
      metrics: [
        metric("net_active_customers", sum(now.net), sum(then.net), signedCount, daily("net")),
        metric(
          "active_customers",
          activeCustomers(),
          activeCustomers() - sum(now.net),
          formatNumber,
          {
            // Each day's base: today's, less the net change still to come.
            series: now.net.map((_, i) => activeCustomers() - sum(now.net.slice(i + 1))),
            hint: "At the start of the period it was the comparison value",
          },
        ),
        metric(
          "new_customers",
          sum(now.newCustomers),
          sum(then.newCustomers),
          formatNumber,
          daily("newCustomers"),
        ),
        metric(
          "reactivated_customers",
          sum(now.reactivated),
          sum(then.reactivated),
          formatNumber,
          daily("reactivated"),
        ),
        metric(
          "lapsed_customers",
          sum(now.lapsed),
          sum(then.lapsed),
          formatNumber,
          daily("lapsed"),
        ),
      ],
    };
  },

  get_new_vs_returning({ range }: Input<"get_new_vs_returning">) {
    const all = channelsFor("all");
    const sales = current(all, "total", range);
    const orders = current(all, "orders", range);
    const newOrders = current(all, "newOrders", range);
    const newSales = sales.map((s, i) => s * (newOrders[i] / orders[i]) * 0.94);
    const { labels, values } = bucket(
      dayLabels(RANGE_DAYS[range]),
      [
        newSales,
        sales.map((s, i) => s - newSales[i]),
        newOrders,
        orders.map((o, i) => (o - newOrders[i]) * 0.9),
      ],
      range,
    );
    return {
      labels,
      newCustomerSales: values[0].map(Math.round),
      returningCustomerSales: values[1].map(Math.round),
      newCustomers: values[2].map(Math.round),
      returningCustomers: values[3].map(Math.round),
    };
  },

  get_order_journey() {
    return { steps: orderJourney() };
  },

  get_customer_cohorts({ metric, months }: Input<"get_customer_cohorts">) {
    // Calendar month k of 2026 (January is 0), as days and days ago of its last day.
    const monthDays = (k: number) => {
      const start = Math.round((TODAY - Date.UTC(2026, k, 1)) / 86_400_000);
      const end = Math.max(0, Math.round((TODAY - Date.UTC(2026, k + 1, 0)) / 86_400_000));
      return { days: start - end + 1, offset: end };
    };
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    // Cumulative revenue per customer turns into contribution at the margin before marketing.
    const recent = profitDays(channelsFor("all"), 90, 0);
    const margin = sum(beforeMarketingOf(recent)) / sum(recent.net);
    const cohorts = names.map((name, k) => {
      const next = random(`cohort:${metric}:${name}`);
      const periods = names.length - k;
      // Young cohorts get up to three months forecast from the same decay (our rule).
      const predicted = Math.min(3, k);
      const lift = 1 + (metric === "ltv" ? LTV_CURVE.liftPerCohort : 0.025) * k;
      let value =
        metric === "ltv"
          ? LTV_CURVE.first * (1 + LTV_CURVE.firstPerCohort * k) * (0.97 + next() * 0.06)
          : 3.8 * lift;
      const values = [round(value, metric === "ltv" ? 0 : 1)];
      for (let m = 1; m < periods + predicted; m++) {
        const noise = m < periods ? 0.9 + next() * 0.2 : 1;
        value +=
          metric === "ltv"
            ? LTV_CURVE.month1 * LTV_CURVE.decay ** (m - 1) * lift * noise
            : 8.2 * 0.72 ** (m - 1) * lift * noise;
        values.push(round(value, metric === "ltv" ? 0 : 1));
      }
      const cac = cohortCac(2026, k + 1);
      const payback = values.findIndex((v) => v * margin >= cac);
      return {
        cohort: `${name} 2026`,
        // New customers in that calendar month, all channels.
        size: Math.round(
          sum(series(channelsFor("all"), "newOrders", monthDays(k).days, monthDays(k).offset)),
        ),
        values,
        ...(predicted ? { predicted } : {}),
        ...(metric === "ltv" && payback >= 0 ? { payback } : {}),
      };
    });
    const shown = cohorts.slice(-months);
    return {
      periodLabels: Array.from({ length: shown[0].values.length }, (_, i) => `Month ${i}`),
      cohorts: shown,
      format: metric === "ltv" ? ("currency" as const) : ("percent" as const),
    };
  },

  get_customer_segments() {
    const { current, flows } = segmentMovement();
    const total = sum(SEGMENTS.map((seg) => current.get(seg.name) ?? 0));
    return {
      totalCustomers: total,
      segments: SEGMENTS.map((seg) => {
        const customers = current.get(seg.name) ?? 0;
        return {
          name: seg.name,
          tone: seg.tone,
          customers,
          customerShare: round(customers / total, 4),
          revenueShare: seg.revenueShare,
          avgOrders: seg.avgOrders,
          avgSpend: seg.avgSpend,
          daysSinceOrder: seg.days,
          action: seg.action,
        };
      }),
      movement: flows,
      lapsePoint: lapsePoint(),
    };
  },

  get_product_performance({
    range,
    channel,
    category,
    limit,
    customerType,
  }: Input<"get_product_performance">) {
    return {
      products: productSales(range, channel, customerType)
        .filter((p) => category === "all" || p.category === category)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map(({ weight: _w, cart: _c, ret: _r, price: _p, ...p }) => {
          // Sell-through: what sold in the period against what was available to sell.
          const stock = inventory().find((i) => i.sku === p.sku)?.stock ?? 0;
          return {
            ...p,
            category: CATEGORY_LABELS[p.category],
            stockStatus: stockStatus(p.sku),
            sellThrough: round(p.units / (p.units + stock), 4),
          };
        }),
    };
  },

  get_inventory_health({ category }: Input<"get_inventory_health">) {
    const all = inventory().filter((i) => category === "all" || i.category === category);
    const low = all.filter((i) => i.stock < i.reorderPoint);
    const covers = all.map((i) => i.daysOfCover).sort((a, b) => a - b);
    return {
      metrics: [
        {
          label: "Inventory value",
          definition: definitionOf("inventory_value"),
          value: formatCurrency(sum(all.map((i) => i.stock * i.unitCost))),
          hint: "Units on hand at cost",
        },
        {
          label: "Below reorder point",
          definition: definitionOf("below_reorder_point"),
          value: `${low.length} of ${all.length} SKUs`,
          hint: "Under 21 days of cover",
        },
        {
          label: "Out of stock",
          definition: definitionOf("out_of_stock"),
          value: ((n) => `${n} SKU${n === 1 ? "" : "s"}`)(all.filter((i) => i.stock === 0).length),
          hint: "Losing sales today",
        },
        {
          label: "Median days of cover",
          definition: definitionOf("median_days_of_cover"),
          value: `${Math.round(covers[Math.floor(covers.length / 2)] ?? 0)} days`,
          hint: "At the last 30 days' sales rate",
        },
        {
          label: "Revenue at risk",
          definition: definitionOf("revenue_at_risk"),
          value: formatCurrency(sum(low.map((i) => i.revenueAtRisk + (i.lostRevenue ?? 0)))),
          hint: "Sales lost to stockouts, so far and before orders land",
        },
        {
          label: "Ads on low stock",
          definition: definitionOf("ads_on_low_stock"),
          value: `${formatCurrency(sum(low.map((i) => i.adSpendPerDay)))}/day`,
          hint: "Ad spend still sending shoppers to them",
        },
      ],
      items: low
        .sort((a, b) => a.daysOfCover - b.daysOfCover)
        .map(({ category: _c, unitCost: _u, ...item }) => item),
      ...inventoryCatalog(all),
    };
  },

  get_returns({ range, category }: Input<"get_returns">) {
    const all = channelsFor("all");
    const products = productSales(range, "all").filter(
      (p) => category === "all" || p.category === category,
    );
    // A category's sales are the store's shared out by its products' sales, and
    // its returns by its products' returns, so return-prone categories show it.
    const store = productSales(range, "all");
    const weight = (list: typeof products, returned: boolean) =>
      sum(list.map((p) => p.revenue * (returned ? p.returnRate : 1)));
    const shareOf = (field: Field) => {
      const returned = field !== "gross";
      return weight(products, returned) / weight(store, returned);
    };
    const t = (field: Field, get = current) => sum(get(all, field, range)) * shareOf(field);
    const daily = (field: Field, get = current) =>
      get(all, field, range).map((v) => v * shareOf(field));
    const gross = t("gross");
    const refunds = t("returns");
    const exchangeShare = EXCHANGE_SHARE[category];
    const requested = refunds / (1 - exchangeShare);
    const exchanged = requested - refunds;
    const costs = t("returnCosts");
    // Orders sent back: refunds and exchanges at the period's average order value.
    const returnedOrdersOf = (get: typeof current) =>
      t("returns", get) /
      (1 - exchangeShare) /
      (sum(get(all, "gross", range)) / sum(get(all, "orders", range)));
    const returnedOrders = returnedOrdersOf(current);
    const prev = { gross: t("gross", previous), refunds: t("returns", previous) };
    const reasons = RETURN_REASONS[category === "all" ? "apparel" : category]!;
    const sized =
      category === "footwear" || category === "apparel"
        ? category
        : category === "all"
          ? "footwear"
          : undefined;
    return {
      periodLabel: periodLabel(range),
      lines: ledger([
        ["Gross sales", "base", gross, prev.gross],
        ["Sent back", "subtract", requested, prev.refunds / (1 - exchangeShare)],
        ["Kept as exchanges", "add", exchanged, prev.refunds / (1 - exchangeShare) - prev.refunds],
        ["Gross sales kept", "total", gross - refunds, prev.gross - prev.refunds],
      ]),
      metrics: [
        metric(
          "return_rate",
          (refunds / gross) * 100,
          (prev.refunds / prev.gross) * 100,
          (v) => `${v.toFixed(1)}%`,
          {
            series: daily("returns").map((r, i) => (r / (daily("gross")[i] || 1)) * 100),
          },
        ),
        // The exchange share is a property of the category in our model, so it holds.
        metric(
          "exchange_share",
          exchangeShare * 100,
          exchangeShare * 100,
          (v) => `${v.toFixed(0)}%`,
        ),
        metric("refunds", refunds, prev.refunds, formatCurrency, { series: daily("returns") }),
        metric(
          "cost_per_return",
          costs / returnedOrders,
          t("returnCosts", previous) / returnedOrdersOf(previous),
          formatCurrency,
        ),
      ],
      reasons: items(
        reasons.map(([name]) => name),
        reasons.map(([, s]) => s * requested),
        // The period before: its own returns, with each reason's share a little
        // different (fit problems vary with what sold).
        (() => {
          const before = prev.refunds / (1 - exchangeShare);
          const shares = reasons.map(
            ([name, s]) => s * between(`reason:${category}:${name}:${range}`, 0.85, 1.15),
          );
          const total = sum(shares);
          return shares.map((s) => (s / total) * before);
        })(),
      ),
      ...(sized
        ? {
            exchanges: {
              category: CATEGORY_LABELS[sized],
              ...exchangeMatrix(sized, exchanged / 80),
            },
          }
        : {}),
      products: [...products]
        .sort((a, b) => b.returnRate - a.returnRate)
        .slice(0, 5)
        .map(
          (p) =>
            ({
              name: p.name,
              key: p.sku,
              value: round(p.returnRate * 100, 1),
              change: round((p.returnRate / p.ret - 1) * 100),
            }) as Item,
        ),
    };
  },

  get_targets({ channel }: Input<"get_targets">) {
    const chs = channelsFor(channel);
    return {
      periodLabel: `October to date: ${MONTH_ELAPSED} of ${MONTH_DAYS} days`,
      // A channel with no spend (Amazon) has no ad budget to track.
      targets: TARGETS.map((t) => monthTarget(chs, t)).filter((t) => t.target > 0),
      budgets: adBudgets(chs),
    };
  },

  get_orders_by_hour({ range, channel }: Input<"get_orders_by_hour">) {
    return ordersByHour(range, channel);
  },

  get_live_view() {
    return liveView();
  },

  get_creatives({ range, platform }: Input<"get_creatives">) {
    return {
      creatives: creatives(range, platform),
      breakEvenRoas: round(breakEvenRoas(RANGE_DAYS[range]), 2),
    };
  },

  get_actions({ range }: Input<"get_actions">) {
    return { actions: recommendedActions(range) };
  },

  get_sale_plan() {
    return salePlan();
  },

  get_sales_goal({ channel }: Input<"get_sales_goal">) {
    const elapsed = MONTH_ELAPSED;
    const days = MONTH_DAYS;
    const chs = channelsFor(channel);
    const daily = series(chs, "total", elapsed);
    let running = 0;
    const cumulative = daily.map((v) => Math.round((running += v)));
    // The same plan-shaped forecast the targets use, so the two agree.
    const sales = monthTarget(chs, TARGETS[0]);
    return {
      projected: sales.forecast,
      range: [sales.forecastLow, sales.forecastHigh],
      planToDate: sales.toDate,
      label: "October sales goal",
      // The plan for the month, the same one the targets use.
      goal: roundTo(sum(octoberPlan(channelsFor(channel), "total")), 3),
      format: "currency" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      asOf: AS_OF,
    };
  },

  get_fulfillment_sla({ range }: Input<"get_fulfillment_sla">) {
    const days = RANGE_DAYS[range];
    const orders = series(channelsFor("all"), "orders", days);
    const next = random(`sla:${range}`);
    let shipped = 0;
    let counted = 0;
    const items = orders.map((count, i) => {
      const daysAgo = days - 1 - i;
      if (daysAgo === 0) {
        return {
          label: "Today",
          status: "none" as const,
          value: "In progress",
          detail: `${formatNumber(count)} orders so far`,
        };
      }
      // The Fall sale's backlog took three days to clear; one carrier pickup was missed.
      const backlog = daysAgo >= 11 && daysAgo <= 13;
      const carrier = daysAgo === 5;
      const rate = backlog ? 87.5 + next() * 5 : carrier ? 91.4 : 96.4 + next() * 3;
      shipped += (rate / 100) * count;
      counted += count;
      return {
        label: dateLabel(daysAgo),
        status: rate >= 95 ? ("good" as const) : rate >= 90 ? ("warn" as const) : ("bad" as const),
        value: `${rate.toFixed(1)}% shipped in 48 hours`,
        detail: `${formatNumber(count)} orders${backlog ? " · Fall sale backlog" : carrier ? " · carrier pickup missed" : ""}`,
      };
    });
    return {
      days: items,
      summary: `${((shipped / counted) * 100).toFixed(1)}% shipped within 48 hours · target 95%`,
    };
  },

  get_recent_orders({ channel, limit }: Input<"get_recent_orders">) {
    const next = random(`orders:${channel}`);
    const first = Math.floor(next() * CUSTOMERS.length);
    const chs = channelsFor(channel);
    let minutesAgo = 0;
    return {
      orders: Array.from({ length: limit }, (_, i) => {
        const gap = 2 + Math.floor(next() * 14);
        const ch = chs[Math.floor(next() * chs.length)];
        const items = 1 + Math.floor(next() * next() * 4);
        // Back from AS_OF, the time of the newest order, a few minutes at a time.
        const placed = new Date(TODAY + (MINUTES_SO_FAR - minutesAgo) * 60_000);
        minutesAgo += gap;
        const roll = next();
        return {
          id: `#${48210 - i * 3}`,
          // Step through the names (7 is coprime with 30) so a page never repeats one.
          customer: CUSTOMERS[(first + i * 7) % CUSTOMERS.length],
          channel: CHANNELS[ch].label,
          items,
          total: formatCurrency(CHANNELS[ch].aov * (0.55 + items * 0.45) * (0.85 + next() * 0.3)),
          fulfillment:
            i < 4
              ? "Unfulfilled"
              : roll < 0.7
                ? "Fulfilled"
                : roll < 0.92
                  ? "Partially fulfilled"
                  : "Refunded",
          country: COUNTRIES[Math.min(COUNTRIES.length - 2, Math.floor(next() * next() * 5))].label,
          placedAt: placed.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          }),
        };
      }),
    };
  },

  get_store_insights({ range, channel, compare, excluding }: Input<"get_store_insights">) {
    const chs = channelsFor(channel);
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];
    const why = (metric: WhyMetric) => explain({ metric, range, channel, compare });
    // A list beside DriverCards leaves out the change those cards already explain.
    const shown = (metric: WhyMetric) => metric !== excluding;

    // Profit first: what moved it, from the explain engine.
    const profit = why("contribution_profit");
    if (shown("contribution_profit") && profit.confidence.level !== "Low" && profit.drivers[0]) {
      const top = profit.drivers[0];
      insights.push({
        tone: profit.tone === "good" ? "positive" : "negative",
        kind: profit.tone === "good" ? "top_driver" : "top_detractor",
        title: `Contribution profit ${profit.delta} against ${profit.comparisonLabel.toLowerCase()}, mostly ${top.name.toLowerCase()}`,
        detail: `${top.name}: ${top.current} against ${top.comparison} (${top.delta}). ${profit.confidence.note}.`,
        metric: profit.value,
      });
    }

    // A tracking change can make conversion look better than it is.
    if (shown("conversion_rate") && chs.some((c) => STOREFRONT.includes(c))) {
      const conversion = why("conversion_rate");
      if (conversion.dataQuality) {
        insights.push({
          tone: "info",
          kind: "data_quality",
          title: "Conversion rate looks better than it is",
          detail: conversion.dataQuality,
          metric: conversion.delta,
        });
      }
    }

    const sales = why("total_sales");
    if (shown("total_sales"))
      insights.push(
        periodChangeInsight(
          sales,
          "Total sales",
          `against ${compare === "previous_period" ? `the prior ${days} days` : sales.comparisonLabel.toLowerCase()}`,
        ),
      );

    const runner = inventory().find((i) => i.sku === "FTW-TRL-01")!;
    const bestseller = productSales(range, channel).sort((a, b) => b.revenue - a.revenue)[0];
    insights.push({
      tone: "negative",
      kind: "stock_risk",
      title: `${runner.name} sells out in about ${Math.round(runner.daysOfCover)} days`,
      detail: `${bestseller.sku === runner.sku ? "It is the top product by revenue. " : ""}${formatNumber(runner.incoming ?? 0)} units arrive in ${runner.incomingInDays} days, so expect a ${Math.max(0, (runner.incomingInDays ?? 0) - Math.round(runner.daysOfCover))}-day gap. Expedite the order or move ad spend to Canvas Low.`,
      metric: `${formatNumber(runner.stock)} left`,
    });

    const breakEven = breakEvenRoas(days);
    const tiktok = marketing(range).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokPrev = marketing(range, days).channels.find((c) => c.m.key === "tiktok")!;
    const tiktokRoas = tiktok.revenue / tiktok.spend;
    if (tiktokRoas < breakEven) {
      insights.push({
        tone: "warning",
        kind: "below_break_even",
        title: `TikTok Ads ROAS ${tiktokRoas.toFixed(2)}x, below the ${breakEven.toFixed(1)}x break-even`,
        detail: `Spend changed ${changeText(tiktok.spend, tiktokPrev.spend)} while attributed revenue changed ${changeText(tiktok.revenue, tiktokPrev.revenue)}. ${aboveBreakEven(range, breakEven)}`,
        metric: formatCurrency(tiktok.spend),
      });
    }

    const goal = ecommerceHandlers.get_sales_goal!({ channel }) as Goal;
    const soFar = goal.cumulative.at(-1) ?? 0;
    // The goal card's own plan-shaped forecast and on-pace band (within 2% of
    // the goal), so the insight never contradicts the card beside it.
    const projected = goal.projected!;
    const [low, high] = goal.range!;
    insights.push({
      tone: projected >= goal.goal * 0.98 ? "positive" : "warning",
      kind: "pace_to_goal",
      title: `October on pace for ${formatCurrency(projected)} of the ${formatCurrency(goal.goal)} goal`,
      detail: `${formatCurrency(soFar)} so far in ${goal.cumulative.length} days, with a likely finish of ${formatCurrency(low)}–${formatCurrency(high)}; reaching the goal needs ${formatCurrency((goal.goal - soFar) / (goal.labels.length - goal.cumulative.length))} a day from here.`,
      metric: `${Math.round((projected / goal.goal) * 100)}%`,
    });

    if (chs.some((c) => STOREFRONT.includes(c))) {
      const mobile = DEVICES.mobile;
      const desktop = DEVICES.desktop;
      insights.push({
        tone: "warning",
        kind: "trend_change",
        title: "Mobile shoppers drop off at payment",
        detail: `${Math.round((1 - mobile.pay) * 100)}% of mobile checkouts stop before adding payment, against ${Math.round((1 - desktop.pay) * 100)}% on desktop, and ${Math.round((mobile.prevPay - mobile.pay) * 100)} points worse than the prior period. Check wallet payment options on mobile.`,
        metric: `${Math.round((1 - mobile.pay) * 100)}% drop`,
      });
    }

    if (days >= 30) {
      const daily = current(chs, "orders", range);
      const saleOrders = mean([12, 13, 14].map((d) => daily[days - 1 - d]));
      insights.push({
        tone: "info",
        kind: "trend_change",
        title: "Fall sale lifted orders for three days, then a dip",
        detail: `Sep 26–28 averaged ${formatNumber(saleOrders)} orders a day, ${changeText(saleOrders, mean(daily))} on the period average, at a 21% discount rate against 7% normally. Orders ran below normal for about two weeks after, as sales pulled demand forward.`,
        metric: changeText(saleOrders, mean(daily)),
      });
    }

    const returns = productSales(range, channel).sort((a, b) => b.returnRate - a.returnRate)[0];
    insights.push({
      tone: "warning",
      title: `${returns.name} returns ${Math.round(returns.returnRate * 100)}% of units`,
      detail: `The highest return rate in the catalog, against ${Math.round((sum(current(chs, "returns", range)) / sum(current(chs, "gross", range))) * 100)}% for the store. Returns are mostly sizing; add a fit note to the product page.`,
      metric: `${Math.round(returns.returnRate * 100)}%`,
    });

    const spend = marketing(range).channels.filter((c) => PAID.has(c.m.key));
    const biggest = spend.reduce((a, b) => (b.spend > a.spend ? b : a));
    const biggestShare = biggest.spend / sum(spend.map((c) => c.spend));
    if (biggestShare > 0.5) {
      insights.push({
        tone: "info",
        kind: "concentration_risk",
        title: `${biggest.m.label} is ${Math.round(biggestShare * 100)}% of ad spend`,
        detail: `One platform carries most of the paid budget, so a change in its costs or tracking moves the whole store's profit. Google and TikTok carry the rest.`,
        metric: formatCurrency(biggest.spend),
      });
    }
    return { insights: insights.slice(0, 8) };
  },
};
