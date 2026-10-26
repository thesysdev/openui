import {
  definitionOf as define,
  glossary as glossaryOf,
  type MetricDefinition,
} from "../../core/metrics";
import type { Definition } from "../../core/schemas";

// Every metric the e-commerce tools return, defined once (see core/metrics.ts).

const PERIOD = "Selected period, against the period before";
const YEAR = "Last 12 months, against the 12 before";
const TODAY = "Today";
const STORE = "Store orders, all selected channels";
const STOREFRONT = "Online store and app; Amazon does not report sessions";
const PAID_ADS =
  "Meta, Google, and TikTok spend; revenue from store orders, not ad-platform claims";

export const METRICS = {
  live_sessions: {
    label: "Sessions",
    formula: "Visits to the online store and app",
    window: "Last 58 minutes",
    basis: STOREFRONT,
    glossary: false,
  },
  today_sales: {
    label: "Sales today",
    formula: "Total sales from online store and app orders since midnight",
    window: "Today so far, against yesterday at the same time",
    basis: "Store orders",
    glossary: false,
  },
  today_orders: {
    label: "Orders today",
    formula: "Orders placed in the online store and app since midnight",
    window: "Today so far, against yesterday at the same time",
    basis: "Store orders",
    glossary: false,
  },
  today_projected: {
    label: "Projected close",
    formula: "Sales so far ÷ the share of a day's sales usually in by this hour",
    window: "Today, against yesterday's whole day",
    basis: "Store orders; the range is how much the same weekday has varied",
    glossary: false,
  },
  live_orders: {
    label: "Orders",
    formula: "Orders placed in the online store and app",
    window: "Last 58 minutes",
    basis: "Store orders",
    glossary: false,
  },
  live_sales: {
    label: "Sales",
    formula: "Total sales from those orders",
    window: "Last 58 minutes",
    basis: "Store orders",
    glossary: false,
  },
  live_conversion: {
    label: "Conversion",
    formula: "Orders ÷ sessions",
    window: "Last 58 minutes",
    basis: STOREFRONT,
    glossary: false,
  },
  sale_sales: {
    label: "Planned sales",
    formula: "Last year's Black Friday to Cyber Monday total sales × 1.12",
    window: "Nov 27 – Nov 30, 2026",
    basis: "Last year's same weekdays",
    glossary: false,
  },
  sale_orders: {
    label: "Planned orders",
    formula: "Last year's orders over the same four days × 1.12",
    window: "Nov 27 – Nov 30, 2026",
    basis: "Last year's same weekdays",
    glossary: false,
  },
  sale_ad_budget: {
    label: "Ad budget",
    formula: "Last year's ad spend over the four days × 1.06",
    window: "Nov 27 – Nov 30, 2026",
    basis: "Meta, Google, and TikTok",
    glossary: false,
  },
  sale_extra_units: {
    label: "Extra units to buy",
    formula: "Planned units over the four days − four normal days of sales, per product",
    window: "Nov 27 – Nov 30, 2026",
    basis:
      "Planned units: each product's share of the last 30 days × planned orders × 1.62 units an order; order 21 days ahead (14-day lead time, 7 safety)",
    glossary: false,
  },
  promo_order_lift: {
    glossary: false,
    label: "Order lift",
    formula: "Orders during the promotion ÷ baseline orders − 1",
    window: "The promotion's days",
    basis: "Baseline: each weekday's average over the 4 weeks before the promotion",
  },
  promo_required_lift: {
    glossary: false,
    label: "Lift needed",
    formula: "Extra discount ÷ (product margin − extra discount)",
    window: "The promotion's days",
    basis:
      "Extra discount is the promotion's rate minus the usual 7.2%; product margin before discounts",
  },
  promo_sales_lift: {
    glossary: false,
    label: "Sales lift",
    formula: "Total sales during the promotion − baseline",
    window: "The promotion's days",
    basis: "Baseline: each weekday's average over the 4 weeks before",
  },
  promo_dip: {
    glossary: false,
    label: "Sales after",
    formula: "Total sales in the days after − baseline",
    window: "Up to 21 days after the promotion",
    basis: "Negative when the promotion pulled demand forward",
  },
  promo_net_profit: {
    glossary: false,
    label: "Net profit effect",
    formula: "Contribution profit during and after the promotion − baseline",
    window: "The promotion and up to 21 days after",
    basis: "All channels",
  },
  contribution_profit: {
    label: "Contribution profit",
    formula:
      "Net sales − cost of goods − fulfillment (net of shipping charged) − fees − return costs − ad spend − other marketing",
    window: PERIOD,
    basis:
      "Marketing is shared between the online store and app by their sales; Amazon's selling costs are its fees",
  },
  profit_before_marketing: {
    label: "Profit before marketing",
    formula:
      "Net sales − cost of goods − fulfillment (net of shipping charged) − fees − return costs",
    window: PERIOD,
    basis: STORE,
  },
  break_even_roas: {
    label: "Break-even ROAS",
    formula: "Store and app total sales ÷ their profit before marketing",
    window: PERIOD,
    basis: "Blended ROAS below this spends more on ads than the sales bring in as profit",
  },
  total_sales: {
    label: "Total sales",
    formula: "Net sales + shipping charges + taxes",
    window: PERIOD,
    basis: STORE,
  },
  net_sales: {
    label: "Net sales",
    formula: "Gross sales − discounts − returns",
    window: PERIOD,
    basis: STORE,
  },
  orders: { label: "Orders", formula: "Orders placed", window: PERIOD, basis: STORE },
  aov: {
    label: "Average order value",
    formula: "(Gross sales − discounts) ÷ orders",
    window: PERIOD,
    basis: STORE,
  },
  conversion_rate: {
    label: "Conversion rate",
    formula: "Orders ÷ sessions",
    window: PERIOD,
    basis: STOREFRONT,
  },
  sessions: {
    glossary: false,
    label: "Sessions",
    formula: "Visits to the online store and app",
    window: PERIOD,
    basis: STOREFRONT,
  },
  returning_customer_rate: {
    label: "Returning customer rate",
    formula: "Orders from returning customers ÷ all orders",
    window: PERIOD,
    basis: STORE,
  },
  blended_roas: {
    label: "Blended ROAS",
    formula: "Store and app total sales ÷ ad spend",
    window: PERIOD,
    basis: PAID_ADS,
  },
  ad_spend: {
    label: "Ad spend",
    formula: "Spend on Meta, Google, and TikTok",
    window: PERIOD,
    basis: "As billed by each ad platform",
    goodDirection: "neutral",
  },
  mer: {
    label: "MER",
    formula: "Total sales, all channels ÷ all marketing spend (ads, email and SMS, affiliates)",
    window: PERIOD,
    basis: STORE,
  },
  new_customer_cpa: {
    label: "New customer CPA",
    formula: "Ad spend ÷ first orders in the store and app",
    window: PERIOD,
    basis: PAID_ADS,
    goodDirection: "down",
  },
  new_customers_storefront: {
    label: "New customers",
    formula: "Customers placing their first order in the store or app",
    window: PERIOD,
    basis: "Online store and app",
  },
  amer: {
    label: "aMER",
    formula: "Total sales from first orders in the store and app ÷ ad spend (acquisition MER)",
    window: PERIOD,
    basis: PAID_ADS,
  },
  first_order_profit: {
    label: "First-order profit",
    formula:
      "(Profit before marketing on first orders in the store and app − ad spend) ÷ new customers there",
    window: PERIOD,
    basis: "Negative means each new customer costs money until they order again",
  },
  net_active_customers: {
    label: "Net active customers",
    formula: "New customers + reactivated customers − lapsed customers",
    window: PERIOD,
    basis: "Active = ordered in the last 52 weeks; all channels",
  },
  active_customers: {
    glossary: false,
    label: "Active customers",
    formula: "Customers with an order in the last 52 weeks",
    window: "Today",
    basis: "All channels",
  },
  reactivated_customers: {
    glossary: false,
    label: "Reactivated",
    formula: "Customers ordering again after 52 weeks or more without an order",
    window: PERIOD,
    basis: "All channels",
  },
  lapsed_customers: {
    glossary: false,
    label: "Lapsed",
    formula: "Customers whose last order is now 52 weeks old",
    window: PERIOD,
    basis: "All channels",
    goodDirection: "down",
  },
  new_customers: {
    label: "New customers",
    formula: "Customers placing their first order",
    window: PERIOD,
    basis: "All channels",
  },
  customers: {
    label: "Customers",
    formula: "Unique customers who placed an order",
    window: PERIOD,
    basis: "All channels",
  },
  repeat_purchase_rate: {
    label: "Repeat purchase rate",
    formula: "Customers with 2 or more orders ÷ all customers",
    window: YEAR,
    basis: "All channels",
  },
  time_between_orders: {
    label: "Time between orders",
    formula: "Median days from one order to the customer's next",
    window: YEAR,
    basis: "All channels",
    goodDirection: "down",
  },
  ltv_12m: {
    label: "12-month LTV",
    formula: "Revenue per customer in the 12 months after their first order",
    window: YEAR,
    basis: "Customers whose first order was 12–24 months ago",
  },
  ltv_cac: {
    label: "LTV:CAC",
    formula: "(12-month LTV × gross margin) ÷ new customer CPA",
    window: YEAR,
    basis: "Gross margin over the last 90 days, all channels",
  },
  return_rate: {
    label: "Return rate",
    formula: "Refunds ÷ gross sales",
    window: PERIOD,
    basis: "Exchanges are not refunds, so they are left out",
    goodDirection: "down",
  },
  exchange_share: {
    label: "Kept as exchanges",
    formula: "Returns swapped for another size or color ÷ all returns",
    window: PERIOD,
    basis: "Store return requests",
  },
  refunds: {
    label: "Refunds",
    formula: "Money paid back for returned items",
    window: PERIOD,
    basis: "The Returns line of the sales breakdown",
    goodDirection: "down",
    glossary: false,
  },
  cost_per_return: {
    label: "Cost per return",
    formula: "Return labels and handling ÷ returned orders",
    window: PERIOD,
    basis: "Counted in contribution profit as return costs",
    goodDirection: "down",
  },
  inventory_value: {
    glossary: false,
    label: "Inventory value",
    formula: "Units on hand × unit cost",
    window: TODAY,
    basis: "All warehouses",
    goodDirection: "neutral",
  },
  below_reorder_point: {
    glossary: false,
    label: "Below reorder point",
    formula:
      "SKUs with less than 21 days of sales on hand (14-day lead time + 7 days of safety stock)",
    window: TODAY,
    basis: "Daily sales averaged over the last 30 days",
    goodDirection: "down",
  },
  out_of_stock: {
    glossary: false,
    label: "Out of stock",
    formula: "SKUs with no units on hand",
    window: TODAY,
    basis: "All warehouses",
    goodDirection: "down",
  },
  revenue_at_risk: {
    label: "Revenue at risk",
    formula:
      "For products below their reorder point: net sales lost while out of stock so far, plus days with nothing to sell before stock lands × units per in-stock day × net sales per unit",
    window: TODAY,
    basis: "Open purchase orders, or a 14-day lead time for an order placed today",
  },
  ads_on_low_stock: {
    label: "Ads on low stock",
    formula: "Each low-stock product's share of net sales × daily ad spend",
    window: "Last 30 days",
    basis: "Ad spend still sending shoppers to products about to run out",
    goodDirection: "down",
    glossary: false,
  },
  median_days_of_cover: {
    glossary: false,
    label: "Median days of cover",
    formula: "Median across SKUs of units on hand ÷ average daily units sold",
    window: TODAY,
    basis: "Daily sales averaged over the last 30 days",
  },
} satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof METRICS;

/** The definition a KPI carries, without its label. */
export const definitionOf = (id: MetricId): Definition => define(METRICS[id]);

/** The e-commerce glossary for the system prompt. */
export const glossary = () => glossaryOf(METRICS);
