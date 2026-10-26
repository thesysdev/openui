import { z } from "zod/v4";
import { defineTool } from "../../core/kit";
import {
  actionSchema,
  cohortRowSchema,
  compareSchema,
  eventSchema,
  funnelStepSchema,
  goalSchema,
  heatRowSchema,
  insightSchema,
  itemSchema,
  kpiOutput,
  ledgerLineSchema,
  rangeSchema,
  seriesSchema,
  targetProgressSchema,
  trackerItemSchema,
  whySchema,
} from "../../core/schemas";

// Data contract for Sundial Goods, a direct-to-consumer brand selling apparel,
// footwear, accessories, and home goods through its online store, mobile app,
// and Amazon. Metric names follow Shopify, GA4, and Triple Whale.

const channel = z
  .enum(["all", "online", "app", "amazon"])
  .default("all")
  .describe("Sales channel: online store, mobile app, or Amazon")
  .meta({ filter: "$channel" });
const category = z
  .enum(["all", "apparel", "footwear", "accessories", "home"])
  .default("all")
  .describe("Product category")
  .meta({ filter: "$category" });
const customerType = z
  .enum(["all", "new", "returning"])
  .default("all")
  .describe("Orders from first-time customers, from returning ones, or both")
  .meta({ filter: "$customer" });
const whyMetric = z.enum([
  "contribution_profit",
  "total_sales",
  "orders",
  "aov",
  "conversion_rate",
]);
const device = z
  .enum(["all", "desktop", "mobile", "tablet"])
  .default("all")
  .describe("Shopper device (storefront and app only)")
  .meta({ filter: "$device" });

export const marketingChannelSchema = z
  .object({
    channel: z.string(),
    type: z.enum(["paid", "owned", "organic", "partner"]),
    spend: z.number().describe("Ad spend, platform cost, or commissions"),
    revenue: z.number().describe("Attributed order revenue"),
    roas: z.number().optional().describe("Revenue ÷ spend; missing for organic channels"),
    cpa: z.number().optional().describe("Spend ÷ attributed orders"),
    orders: z.number(),
    newCustomers: z.number(),
    share: z.number().describe("Share of attributed revenue, 0–1"),
    roasChange: z
      .number()
      .optional()
      .describe("Percent change in ROAS against the previous period"),
    trend: z
      .array(z.number())
      .optional()
      .describe("Attributed revenue over the period, for a sparkline"),
  })
  .meta({ opaque: "MarketingChannel" });

export const segmentSchema = z
  .object({
    name: z.string(),
    tone: z.enum(["positive", "neutral", "warning", "negative"]),
    customers: z.number(),
    customerShare: z.number().describe("Share of customers, 0–1"),
    revenueShare: z.number().describe("Share of 12-month revenue, 0–1"),
    avgOrders: z.number(),
    avgSpend: z.number().describe("Average 12-month spend per customer"),
    daysSinceOrder: z.number().describe("Median days since the last order"),
    action: z.string().describe("Recommended next step for the segment"),
  })
  .meta({ opaque: "Segment" });

export const productSchema = z
  .object({
    name: z.string(),
    sku: z.string(),
    category: z.string(),
    revenue: z.number().describe("Net sales from the product: after discounts and returns"),
    units: z.number(),
    change: z.number().describe("Percent change in revenue against the previous period"),
    views: z.number().optional().describe("Product page views (storefront and app)"),
    addToCartRate: z.number().optional().describe("Add-to-carts ÷ views, 0–1"),
    conversionRate: z.number().optional().describe("Purchases ÷ views, 0–1"),
    returnRate: z.number().describe("Units returned ÷ units sold, 0–1"),
    margin: z.number().describe("Gross margin after cost of goods, 0–1"),
    stockStatus: z.enum(["In stock", "Low stock", "Out of stock"]),
    sellThrough: z.number().describe("Units sold ÷ (units sold + units on hand), 0–1"),
    trend: z.array(z.number()).optional().describe("Units sold over the period, for a sparkline"),
  })
  .meta({ opaque: "Product" });

export const inventoryItemSchema = z
  .object({
    sku: z.string(),
    name: z.string(),
    stock: z.number(),
    reorderPoint: z
      .number()
      .describe("21 days of sales: 14-day lead time plus 7 days of safety stock"),
    dailySales: z
      .number()
      .describe("Units sold per in-stock day over the last 30 days (stockout-adjusted)"),
    daysOfCover: z.number(),
    incoming: z.number().optional().describe("Units on open purchase orders"),
    incomingInDays: z.number().optional().describe("Days until the open purchase order arrives"),
    suggestedOrder: z.number().optional().describe("Units to order now to cover 45 days"),
    replenishBy: z
      .string()
      .describe('The last day to place an order without dipping into safety stock, or "Now"'),
    daysLate: z.number().optional().describe("How many days past that day it is"),
    stockoutGapDays: z.number().describe("Days with nothing to sell before stock lands"),
    revenueAtRisk: z.number().describe("Net sales lost in that gap"),
    lostRevenue: z.number().optional().describe("Net sales already lost while out of stock"),
    adSpendPerDay: z.number().describe("Ad spend still sending shoppers to it, per day"),
  })
  .meta({ opaque: "InventoryItem" });

export const ecommerceTools = [
  defineTool({
    name: "get_store_kpis",
    description:
      "Store KPIs: contribution profit as the hero, against the comparison, plus total sales, orders, average order value, conversion rate, sessions, and returning customer rate, each with its trend. Feeds HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric) and KpiStrip(kpis.metrics, $metric).",
    input: z.object({ range: rangeSchema, channel, compare: compareSchema }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "explain_change",
    description:
      "Why a metric moved: its change, a confidence label (Low means within the normal range, so no drivers), a summary, the drivers for and against (by channel, customer type, category, profit line, or ad platform), a walk from the comparison to now, and any tracking change behind it. Feeds DriverCards(why) and VarianceWalk(why.walk, why.comparisonLabel, why.format).",
    input: z.object({
      metric: whyMetric.default("contribution_profit"),
      range: rangeSchema,
      channel,
      compare: compareSchema,
    }),
    output: whySchema,
  }),
  defineTool({
    name: "get_sales_over_time",
    description:
      'Total sales and orders over time against the comparison, day by day (weekly for 90d), with promotions to shade: TrendChart(sales.labels, [{name: "This period", values: sales.totalSales, emphasis: "primary"}, {name: sales.comparisonLabel, values: sales.comparison, emphasis: "muted"}], "currency", "area", sales.events).',
    input: z.object({ range: rangeSchema, channel, customerType, compare: compareSchema }),
    output: z.object({
      labels: z.array(z.string()),
      totalSales: z.array(z.number()),
      comparison: z
        .array(z.number())
        .describe("Total sales for the matching days of the comparison"),
      comparisonLabel: z.string(),
      orders: z.array(z.number()),
      events: z
        .array(eventSchema.meta({ opaque: "ChartEvent" }))
        .describe("Promotions to shade on the chart"),
    }),
  }),
  defineTool({
    name: "get_sales_breakdown",
    description:
      "Shopify-style total sales breakdown: gross sales, discounts, returns, net sales, shipping charges, taxes, and total sales. Feeds MoneyBreakdown directly.",
    input: z.object({ range: rangeSchema, channel, customerType }),
    output: z.object({ lines: z.array(ledgerLineSchema.meta({ opaque: "LedgerLine" })) }),
  }),
  defineTool({
    name: "get_sales_by",
    description:
      "Total sales and orders split by sales channel, product category, country, or device. items feeds BarList and ShareBar directly, with share and change; overTime splits the period's sales by the same parts for a stacked ColumnChart.",
    input: z.object({
      range: rangeSchema,
      channel,
      customerType,
      dimension: z.enum(["channel", "category", "country", "device"]).default("channel"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      totalSales: z.array(z.number()),
      orders: z.array(z.number()),
      items: z.array(itemSchema.meta({ opaque: "Item" })),
      overTime: z
        .object({
          labels: z.array(z.string()),
          series: z.array(seriesSchema.meta({ opaque: "Series" })),
        })
        .describe(
          'Sales over time split by the same parts, daily for 7d and 30d, weekly for 90d: ColumnChart(byCategory.overTime.labels, byCategory.overTime.series, "currency", true)',
        ),
    }),
  }),
  defineTool({
    name: "get_marketing_performance",
    description:
      "Marketing efficiency: blended ROAS against break-even as the hero, KPIs (ad spend, MER, new customer CPA, new customers, aMER, first-order profit), and per-channel spend, attributed revenue, ROAS, CPA, and new customers under an attribution model and window (blended ROAS and MER don't depend on them). Feeds HeroMetric, KpiStrip, RuleChips, and ChannelPerformance directly.",
    input: z.object({
      range: rangeSchema,
      model: z
        .enum(["last_click", "first_click", "linear", "platform"])
        .default("last_click")
        .describe(
          "Who gets credit for an order; platform is what each ad platform claims for itself",
        ),
      window: z.enum(["1d", "7d", "28d"]).default("7d").describe("Days after a click that count"),
    }),
    output: z.object({
      ...kpiOutput,
      channels: z.array(marketingChannelSchema),
      targetRoas: z.number().describe("The ROAS paid channels are expected to reach"),
    }),
  }),
  defineTool({
    name: "get_annotations",
    description:
      "What happened in the period, for any time chart: promotions, launches, stockouts, incidents, and tracking changes (kind measurement, which move metrics without being real). Pass to TrendChart's events.",
    input: z.object({ range: rangeSchema }),
    output: z.object({ events: z.array(eventSchema.meta({ opaque: "ChartEvent" })) }),
  }),
  defineTool({
    name: "get_promo_impact",
    description:
      'Did a promotion pay: daily sales against a baseline from the weeks before (adjusted for the season), the order lift against what covers the discount, the lift during, the dip after, the net profit effect, and a summary. TrendChart(promo.labels, [{name: "Actual", values: promo.actual, emphasis: "primary"}, {name: "Baseline", values: promo.baseline, emphasis: "muted"}], "currency", "area", promo.events) and KpiStrip(promo.metrics).',
    input: z.object({
      event: z
        .enum(["fall-sale", "fall-sale-2025", "bfcm-2025"])
        .default("fall-sale")
        .describe("This year's Fall sale, last year's, or Black Friday Cyber Monday 2025"),
    }),
    output: z.object({
      event: z.string(),
      detail: z.string(),
      labels: z.array(z.string()),
      actual: z.array(z.number()),
      baseline: z.array(z.number()),
      events: z.array(eventSchema.meta({ opaque: "ChartEvent" })),
      metrics: kpiOutput.metrics,
      summary: z.string(),
    }),
  }),
  defineTool({
    name: "get_reconciliation",
    description:
      "Can we trust the ad platforms' numbers: for Meta, Google, and TikTok, the revenue the store's orders credit them with against what each platform claims, with ROAS both ways and a summary. Feeds ReconciliationCard(recon).",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      periodLabel: z.string(),
      platforms: z.array(
        z
          .object({
            platform: z.string(),
            spend: z.number(),
            storeRevenue: z.number(),
            claimedRevenue: z.number(),
            storeRoas: z.number(),
            claimedRoas: z.number(),
          })
          .meta({ opaque: "PlatformClaim" }),
      ),
      storeTotal: z.number(),
      claimedTotal: z.number(),
      storefrontSales: z.number(),
      summary: z.string(),
    }),
  }),
  defineTool({
    name: "get_profit_bridge",
    description:
      "Did the store make money: net sales to gross profit, profit before marketing, and contribution profit, each step against the comparison, with margins, profit per order, and break-even ROAS. Feeds ProfitWaterfall(profit.lines, profit.comparisonLabel) or MoneyBreakdown(profit.lines); channels side by side: ChannelProfit(profit.byChannel).",
    input: z.object({ range: rangeSchema, channel, compare: compareSchema }),
    output: z.object({
      periodLabel: z.string(),
      comparisonLabel: z.string().describe('What each line is compared with, e.g. "Plan"'),
      lines: z.array(ledgerLineSchema.meta({ opaque: "LedgerLine" })),
      grossMargin: z.string(),
      contributionMargin: z.string(),
      profitPerOrder: z.string(),
      breakEvenRoas: z
        .number()
        .describe("Blended ROAS below which ad spend costs more than the profit it brings in"),
      byChannel: z.array(
        z
          .object({
            name: z.string(),
            net: z.number(),
            productCost: z.number(),
            feesAndFulfillment: z.number(),
            marketing: z.number(),
            contribution: z.number(),
            margin: z.number(),
            marginBefore: z.number(),
          })
          .meta({ opaque: "ChannelProfit" }),
      ),
    }),
  }),
  defineTool({
    name: "get_purchase_journey",
    description:
      "GA4-style purchase journey for the storefront and app: session start, product view, add to cart, begin checkout, purchase, with the previous period and median times. Feeds ConversionFunnel directly.",
    input: z.object({ range: rangeSchema, device }),
    output: z.object({
      steps: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      conversionRate: z.string(),
    }),
  }),
  defineTool({
    name: "get_checkout_journey",
    description:
      "GA4-style checkout journey: begin checkout, add shipping info, add payment info, purchase, with the previous period. Feeds ConversionFunnel directly.",
    input: z.object({ range: rangeSchema, device }),
    output: z.object({
      steps: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      checkoutCompletion: z.string(),
    }),
  }),
  defineTool({
    name: "get_customer_kpis",
    description:
      "Customer KPIs: new customers as the hero with its daily trend, plus customers, returning customer rate, 12-month repeat purchase rate, time between orders, 12-month LTV, and LTV:CAC. Feeds HeroMetric and KpiStrip directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "get_new_vs_returning",
    description:
      "Sales and customers from new versus returning customers over time: daily for 7d and 30d, weekly for 90d.",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      labels: z.array(z.string()),
      newCustomerSales: z.array(z.number()),
      returningCustomerSales: z.array(z.number()),
      newCustomers: z.array(z.number()),
      returningCustomers: z.array(z.number()),
    }),
  }),
  defineTool({
    name: "get_customer_flow",
    description:
      'Is the customer base growing: new and reactivated customers (back after 52 weeks) gained and lapsing ones (last order 52 weeks ago) lost, over time, with KPIs for net active customers and the base: ColumnChart(flow.labels, [{name: "New", values: flow.newCustomers}, {name: "Lapsed", values: flow.lapsed}, {name: "Reactivated", values: flow.reactivated}], "number", true, "Customers"); KpiStrip(flow.metrics).',
    input: z.object({ range: rangeSchema }),
    output: z.object({
      periodLabel: z.string(),
      labels: z.array(z.string()),
      newCustomers: z.array(z.number()),
      reactivated: z.array(z.number()),
      lapsed: z.array(z.number()).describe("Negative: customers lost, drawn below the line"),
      net: z.array(z.number()),
      metrics: kpiOutput.metrics,
    }),
  }),
  defineTool({
    name: "get_order_journey",
    description:
      "How customers progress from their 1st to 5th order over the last 6 months, with the median days between orders and the 6 months before for comparison. Feeds ConversionFunnel directly.",
    input: z.object({}),
    output: z.object({ steps: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })) }),
  }),
  defineTool({
    name: "get_customer_cohorts",
    description:
      "Monthly first-order cohorts by months since the first order: cumulative revenue per customer (LTV) or the cumulative share who ordered again (repeat rate). Feeds CohortGrid directly.",
    input: z.object({
      metric: z.enum(["ltv", "repeat_rate"]).default("ltv"),
      months: z
        .number()
        .int()
        .min(4)
        .max(9)
        .default(9)
        .describe("How many monthly cohorts to show"),
    }),
    output: z.object({
      periodLabels: z.array(z.string()),
      cohorts: z.array(cohortRowSchema),
      format: z.enum(["percent", "currency"]),
    }),
  }),
  defineTool({
    name: "get_customer_segments",
    description:
      "RFM customer segments over the last 12 months (Champions, Loyal, Promising, New, Needs attention, At risk, Almost lost, Dormant) with size, revenue share, and the recommended action (CustomerSegments), how customers moved between them over 90 days (SegmentFlow), and the lapse point after which a customer counts as at risk.",
    input: z.object({}),
    output: z.object({
      totalCustomers: z.number(),
      segments: z.array(segmentSchema),
      movement: z
        .array(
          z
            .object({ from: z.string(), to: z.string(), customers: z.number() })
            .meta({ opaque: "SegmentMove" }),
        )
        .describe(
          'Customers by segment 90 days ago (from, or "First order") and today (to, or "Lapsed"): SegmentFlow(segments.movement)',
        ),
      lapsePoint: z.object({ days: z.number(), note: z.string() }),
    }),
  }),
  defineTool({
    name: "get_product_performance",
    description:
      "Products ranked by revenue with units, change, page views, add-to-cart rate, view-to-purchase rate, return rate, margin, and stock status. Feeds ProductPerformance and ProductLeaderboard directly.",
    input: z.object({
      range: rangeSchema,
      channel,
      customerType,
      category,
      limit: z.number().int().min(1).max(16).default(8),
    }),
    output: z.object({ products: z.array(productSchema) }),
  }),
  defineTool({
    name: "get_inventory_health",
    description:
      "Inventory KPIs (revenue at risk, ads on low stock) and products to restock: velocity, days of cover, order-by date, open POs, any stockout gap and its cost, and the suggested order, for InventoryAlerts and KpiStrip; every product's health: InventoryHealth(stock.catalog), its concentration line as the card subtitle.",
    input: z.object({ category }),
    output: z.object({
      metrics: kpiOutput.metrics,
      items: z.array(inventoryItemSchema),
      catalog: z.array(
        z
          .object({
            name: z.string(),
            sku: z.string(),
            category: z.string(),
            abc: z.enum(["A", "B", "C"]),
            revenue: z.number(),
            stock: z.number(),
            dailySales: z.number(),
            daysOfCover: z.number(),
            reorderAt: z.number(),
            status: z.enum(["Out of stock", "Reorder now", "Slow mover", "Healthy"]),
            action: z.string(),
          })
          .meta({ opaque: "CatalogItem" }),
      ),
      concentration: z.string(),
    }),
  }),
  defineTool({
    name: "get_returns",
    description:
      "Returns and exchanges: a ledger from gross sales to sent back, kept as exchanges, and kept (MoneyBreakdown); return KPIs (KpiStrip); reasons (BarList); the size-exchange matrix (ExchangeMatrix(returns.exchanges)); and the most-returned products by return rate in percent (BarList).",
    input: z.object({ range: rangeSchema, category }),
    output: z.object({
      periodLabel: z.string(),
      lines: z.array(ledgerLineSchema.meta({ opaque: "LedgerLine" })),
      metrics: kpiOutput.metrics,
      reasons: z.array(itemSchema.meta({ opaque: "Item" })),
      exchanges: z
        .object({
          category: z.string(),
          sizes: z.array(z.string()),
          counts: z.array(z.array(z.number())).describe("counts[ordered][exchangedFor]"),
        })
        .optional()
        .meta({ opaque: "ExchangeMatrix" }),
      products: z.array(itemSchema.meta({ opaque: "Item" })),
    }),
  }),
  defineTool({
    name: "get_targets",
    description:
      "Are we on track this month: October to date for total sales, contribution profit, orders, new customers, and the ad budget, each against its target to date and for the month, with a forecast and its range. Feeds BulletList(targets.targets).",
    input: z.object({ channel }),
    output: z.object({
      periodLabel: z.string(),
      targets: z.array(targetProgressSchema),
      budgets: z
        .array(
          z
            .object({
              name: z.string(),
              budget: z.number(),
              spent: z.number(),
              burn: z.array(z.number()).describe("Cumulative spend at the end of each day so far"),
              elapsed: z.number().describe("Percent of the month gone"),
              projected: z.number().describe("Month-end spend at the pace so far"),
              pace: z.number().describe("Spend ÷ budget to date, percent"),
              status: z.enum(["under", "on_track", "over"]),
            })
            .meta({ opaque: "AdBudget" }),
        )
        .describe("Each ad platform's budget burn-down: AdBudgetPacing(targets.budgets)"),
    }),
  }),
  defineTool({
    name: "get_orders_by_hour",
    description:
      'When orders come in: average orders per hour by weekday, for timing campaigns and staffing. HeatGrid(hours.rows, hours.columns, "orders").',
    input: z.object({ range: rangeSchema, channel }),
    output: z.object({
      rows: z.array(heatRowSchema),
      columns: z.array(z.string()),
      peak: z.string().describe("The busiest hour"),
      rule: z.string(),
    }),
  }),
  defineTool({
    name: "get_live_view",
    description:
      'Live, store and app: today so far against yesterday at the same time (todayMetrics; hourlyToday and hourlyYesterday sales over hours for a ColumnChart), and the last hour per 5 minutes against a week ago, visitors now, KPIs, funnel, and most-carted products: TrendChart(live.labels, [{name: "Sessions", values: live.sessions, emphasis: "primary"}, {name: "Same time last week", values: live.sessionsWeekAgo, emphasis: "muted"}], "number", "area", [], true).',
    input: z.object({}),
    output: z.object({
      asOf: z.string(),
      labels: z.array(z.string()),
      sessions: z.array(z.number()),
      sessionsWeekAgo: z.array(z.number()),
      visitorsNow: z.number(),
      metrics: kpiOutput.metrics,
      funnel: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      products: z.array(itemSchema.meta({ opaque: "Item" })),
      hours: z.array(z.string()),
      hourlyToday: z.array(z.number()),
      hourlyYesterday: z.array(z.number()),
      todayMetrics: kpiOutput.metrics,
    }),
  }),
  defineTool({
    name: "get_creatives",
    description:
      "Ad creatives ranked by spend: platform, format, spend, store-attributed revenue and ROAS against break-even, CTR and its change, hook and hold rates for video, frequency, and fatigue. Feeds CreativeLeaderboard(ads.creatives, ads.breakEvenRoas).",
    input: z.object({
      range: rangeSchema,
      platform: z.enum(["all", "meta", "google", "tiktok"]).default("all"),
    }),
    output: z.object({
      creatives: z.array(
        z
          .object({
            name: z.string(),
            platform: z.string(),
            format: z.string(),
            spend: z.number(),
            revenue: z.number(),
            roas: z.number(),
            ctr: z.number(),
            ctrChange: z.number(),
            hookRate: z.number().optional().describe("3-second views ÷ impressions, 0–1"),
            holdRate: z.number().optional().describe("15-second views ÷ 3-second views, 0–1"),
            frequency: z.number().optional(),
            fatigue: z.enum(["Fresh", "Watch", "Fatigued"]),
            belowBreakEven: z.boolean(),
          })
          .meta({ opaque: "Creative" }),
      ),
      breakEvenRoas: z.number(),
    }),
  }),
  defineTool({
    name: "get_actions",
    description:
      "What to do next, biggest effect first: each recommended action with why (from the data), its expected effect, owner, and effort. Approving one in the demo only writes to a log. Feeds ActionCards(actions.actions).",
    input: z.object({ range: rangeSchema }),
    output: z.object({
      actions: z.array(actionSchema),
    }),
  }),
  defineTool({
    name: "get_sale_plan",
    description:
      'Black Friday Cyber Monday 2026: days to go, the daily plan against last year\'s same weekdays, plan KPIs, and the extra units each product needs and the order-by date. TrendChart(sale.labels, [{name: "Plan", values: sale.plan, emphasis: "primary"}, {name: "Last year", values: sale.lastYear, emphasis: "muted"}], "currency", "area", sale.events), KpiStrip(sale.metrics), BarList(sale.extraUnits, "number").',
    input: z.object({}),
    output: z.object({
      event: z.string(),
      detail: z.string(),
      daysToGo: z.number(),
      labels: z.array(z.string()),
      lastYear: z.array(z.number()),
      plan: z.array(z.number()),
      events: z.array(eventSchema.meta({ opaque: "ChartEvent" })),
      metrics: kpiOutput.metrics,
      orderBy: z.string().describe("The last day to order the extra units"),
      extraUnits: z
        .array(itemSchema.meta({ opaque: "Item" }))
        .describe("Units to buy for the sale, by product, most first"),
    }),
  }),
  defineTool({
    name: "get_sales_goal",
    description:
      "Progress toward this month's sales goal: the goal, the running total of sales for each day so far, and a label for every day of the month. Feeds GoalPace(goal) directly.",
    input: z.object({ channel }),
    output: goalSchema,
  }),
  defineTool({
    name: "get_fulfillment_sla",
    description:
      "Share of orders shipped within 48 hours on each day of the period against the 95% target, with today still in progress. Feeds Tracker(sla.days, sla.summary) directly.",
    input: z.object({ range: rangeSchema }),
    output: z.object({ days: z.array(trackerItemSchema), summary: z.string() }),
  }),
  defineTool({
    name: "get_recent_orders",
    description:
      'Latest orders, newest first. Pluck columns for Table: Col("Order", recent.orders.id).',
    input: z.object({ channel, limit: z.number().int().min(1).max(20).default(8) }),
    output: z.object({
      orders: z.array(
        z.object({
          id: z.string(),
          customer: z.string(),
          channel: z.string(),
          items: z.number(),
          total: z.string(),
          fulfillment: z.enum(["Unfulfilled", "Fulfilled", "Partially fulfilled", "Refunded"]),
          country: z.string(),
          placedAt: z.string(),
        }),
      ),
    }),
  }),
  defineTool({
    name: "get_store_insights",
    description:
      "What changed, most important first: what moved profit, tracking changes, the sales change and its driver, stockouts, channels below break-even, goal pace, checkout, promotions, returns, and ad-spend concentration. Feeds InsightList directly.",
    input: z.object({
      range: rangeSchema,
      channel,
      compare: compareSchema,
      excluding: whyMetric
        .optional()
        .describe("An explain_change metric shown beside the list: leaves out its change"),
    }),
    output: z.object({ insights: z.array(insightSchema) }),
  }),
];
