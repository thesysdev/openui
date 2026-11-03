import type { ToolSpec } from "@openuidev/lang-core";

/**
 * Fake sales data the model reads through Query() and changes through Mutation().
 * Everything runs in the browser and resets on reload, so no backend or database is needed.
 */

type Region = "all" | "na" | "emea" | "apac";
type Period = "30d" | "90d" | "12m";

const REGION_SHARE: Record<Region, number> = { all: 1, na: 0.46, emea: 0.34, apac: 0.2 };

const PERIOD_SERIES: Record<Period, { labels: string[]; revenue: number[] }> = {
  "30d": { labels: ["Week 1", "Week 2", "Week 3", "Week 4"], revenue: [96, 104, 99, 118] },
  "90d": { labels: ["Aug", "Sep", "Oct"], revenue: [362, 388, 417] },
  "12m": {
    labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    revenue: [298, 341, 276, 284, 309, 322, 335, 347, 351, 362, 388, 417],
  },
};

const CATEGORIES = [
  { category: "Software", share: 0.42 },
  { category: "Services", share: 0.27 },
  { category: "Hardware", share: 0.19 },
  { category: "Support", share: 0.12 },
];

type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  customer: string;
  region: Exclude<Region, "all">;
  amount: number;
  status: OrderStatus;
  date: string;
}

const orders: Order[] = [
  {
    id: "ORD-1042",
    customer: "Acme Corp",
    region: "na",
    amount: 12400,
    status: "pending",
    date: "2026-10-30",
  },
  {
    id: "ORD-1041",
    customer: "Globex",
    region: "emea",
    amount: 9800,
    status: "shipped",
    date: "2026-10-29",
  },
  {
    id: "ORD-1040",
    customer: "Initech",
    region: "na",
    amount: 7600,
    status: "delivered",
    date: "2026-10-28",
  },
  {
    id: "ORD-1039",
    customer: "Umbrella",
    region: "apac",
    amount: 15200,
    status: "pending",
    date: "2026-10-27",
  },
  {
    id: "ORD-1038",
    customer: "Hooli",
    region: "na",
    amount: 4300,
    status: "cancelled",
    date: "2026-10-26",
  },
  {
    id: "ORD-1037",
    customer: "Stark Industries",
    region: "emea",
    amount: 21900,
    status: "delivered",
    date: "2026-10-25",
  },
  {
    id: "ORD-1036",
    customer: "Wayne Enterprises",
    region: "na",
    amount: 18700,
    status: "shipped",
    date: "2026-10-24",
  },
  {
    id: "ORD-1035",
    customer: "Soylent",
    region: "apac",
    amount: 6100,
    status: "pending",
    date: "2026-10-23",
  },
  {
    id: "ORD-1034",
    customer: "Tyrell",
    region: "emea",
    amount: 11250,
    status: "delivered",
    date: "2026-10-22",
  },
  {
    id: "ORD-1033",
    customer: "Cyberdyne",
    region: "apac",
    amount: 8900,
    status: "shipped",
    date: "2026-10-21",
  },
];

const asRegion = (value: unknown): Region =>
  typeof value === "string" && value in REGION_SHARE ? (value as Region) : "all";
const asPeriod = (value: unknown): Period =>
  typeof value === "string" && value in PERIOD_SERIES ? (value as Period) : "30d";
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

/** Revenue in thousands of USD, scaled to the region's share. */
function revenueSeries(region: Region, period: Period) {
  const { labels, revenue } = PERIOD_SERIES[period];
  return labels.map((label, i) => {
    const value = round(revenue[i]! * REGION_SHARE[region], 1);
    return { label, revenue: value, orders: Math.round(value * 3.1) };
  });
}

export const toolImplementations: Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
> = {
  async get_kpis(args) {
    const region = asRegion(args.region);
    const rows = revenueSeries(region, asPeriod(args.period));
    const revenue = round(
      rows.reduce((sum, row) => sum + row.revenue, 0),
      1,
    );
    const orderCount = rows.reduce((sum, row) => sum + row.orders, 0);
    return {
      revenue,
      orders: orderCount,
      customers: Math.round(orderCount * 0.62),
      churn_rate: round(2.1 + (1 - REGION_SHARE[region]) * 0.9, 1),
      revenue_change: 8.4,
      orders_change: 5.2,
      customers_change: 3.7,
      churn_change: -0.3,
    };
  },
  async get_revenue_series(args) {
    return { rows: revenueSeries(asRegion(args.region), asPeriod(args.period)) };
  },
  async get_sales_by_category(args) {
    const region = asRegion(args.region);
    const total = revenueSeries(region, asPeriod(args.period)).reduce((s, r) => s + r.revenue, 0);
    return {
      rows: CATEGORIES.map(({ category, share }) => ({
        category,
        revenue: round(total * share, 1),
      })),
    };
  },
  async get_orders(args) {
    const region = asRegion(args.region);
    const status = typeof args.status === "string" ? args.status : "all";
    return {
      rows: orders.filter(
        (order) =>
          (region === "all" || order.region === region) &&
          (status === "all" || order.status === status),
      ),
    };
  },
  async update_order_status(args) {
    const order = orders.find((o) => o.id === args.id);
    if (!order) throw new Error(`No order ${String(args.id)}`);
    order.status = args.status as OrderStatus;
    return { id: order.id, status: order.status };
  },
};

const regionInput = {
  type: "string",
  enum: ["all", "na", "emea", "apac"],
  description: "all, na (North America), emea or apac",
};
const periodInput = {
  type: "string",
  enum: ["30d", "90d", "12m"],
  description: "30d (four weeks), 90d (three months) or 12m (twelve months)",
};
const rowsOf = (properties: Record<string, unknown>) => ({
  type: "object",
  properties: { rows: { type: "array", items: { type: "object", properties } } },
});

export const toolSpecs: ToolSpec[] = [
  {
    name: "get_kpis",
    description:
      "Headline sales numbers for a region and period. Revenue is in thousands of USD; *_change values are percent changes.",
    inputSchema: { type: "object", properties: { region: regionInput, period: periodInput } },
    outputSchema: {
      type: "object",
      properties: {
        revenue: { type: "number" },
        orders: { type: "integer" },
        customers: { type: "integer" },
        churn_rate: { type: "number" },
        revenue_change: { type: "number" },
        orders_change: { type: "number" },
        customers_change: { type: "number" },
        churn_change: { type: "number" },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_revenue_series",
    description: "Revenue (thousands of USD) and order count per week or month, for trend charts.",
    inputSchema: { type: "object", properties: { region: regionInput, period: periodInput } },
    outputSchema: rowsOf({
      label: { type: "string" },
      revenue: { type: "number" },
      orders: { type: "integer" },
    }),
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_sales_by_category",
    description: "Revenue (thousands of USD) per product category, for pie or bar charts.",
    inputSchema: { type: "object", properties: { region: regionInput, period: periodInput } },
    outputSchema: rowsOf({ category: { type: "string" }, revenue: { type: "number" } }),
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_orders",
    description: "Recent orders, newest first. Amounts are in USD.",
    inputSchema: {
      type: "object",
      properties: {
        region: regionInput,
        status: {
          type: "string",
          enum: ["all", "pending", "shipped", "delivered", "cancelled"],
        },
      },
    },
    outputSchema: rowsOf({
      id: { type: "string" },
      customer: { type: "string" },
      region: { type: "string" },
      amount: { type: "number" },
      status: { type: "string" },
      date: { type: "string" },
    }),
    annotations: { readOnlyHint: true },
  },
  {
    name: "update_order_status",
    description: "Change one order's status. Run get_orders again afterwards to show the change.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: ["pending", "shipped", "delivered", "cancelled"] },
      },
      required: ["id", "status"],
    },
    outputSchema: {
      type: "object",
      properties: { id: { type: "string" }, status: { type: "string" } },
    },
    annotations: { destructiveHint: false },
  },
];
