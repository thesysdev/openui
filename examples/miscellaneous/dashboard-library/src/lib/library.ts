// Entry for `openui generate`: the CLI reads `library` and `promptOptions` from this file.
import {
  openuiDashboardAdditionalRules,
  openuiDashboardPromptOptions,
} from "@openuidev/dashboard-kit/lib";
import type { PromptOptions } from "@openuidev/react-lang";
import { toolSpecs } from "./tools";

export { openuiDashboardLibrary as library } from "@openuidev/dashboard-kit/lib";

const TOOL_EXAMPLE = `root = Dashboard([header, section])
$region = "all"
$period = "30d"
$orderId = ""
header = DashboardHeader("Sales Overview", "Live from the sales tools")
filters = FilterBar([regionFilter, periodFilter])
regionFilter = FilterSelect("region", "Region", [{value: "all", label: "All Regions"}, {value: "na", label: "North America"}, {value: "emea", label: "EMEA"}, {value: "apac", label: "APAC"}], $region)
periodFilter = FilterSelect("period", "Period", [{value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}, {value: "12m", label: "Last 12 months"}], $period)
kpis = Query("get_kpis", {region: $region, period: $period}, {revenue: 0, orders: 0, customers: 0, churn_rate: 0, revenue_change: 0, orders_change: 0, customers_change: 0, churn_change: 0})
series = Query("get_revenue_series", {region: $region, period: $period}, {rows: []})
categories = Query("get_sales_by_category", {region: $region, period: $period}, {rows: []})
orders = Query("get_orders", {region: $region, status: "all"}, {rows: []})
ship = Mutation("update_order_status", {id: $orderId, status: "shipped"})
section = Section([kpiRow, chartRow, tableRow], filters)
kpiRow = CardRow([revenueCard, ordersCard, churnCard])
revenueCard = SmallCard("Revenue", "$" + kpis.revenue + "K", {direction: kpis.revenue_change < 0 ? "down" : "up", value: @Abs(kpis.revenue_change)})
ordersCard = SmallCard("Orders", "" + kpis.orders, {direction: kpis.orders_change < 0 ? "down" : "up", value: @Abs(kpis.orders_change)})
churnCard = SmallCard("Churn Rate", kpis.churn_rate + "%", {direction: kpis.churn_change < 0 ? "down" : "up", value: @Abs(kpis.churn_change)})
chartRow = CardRow([trendCard, mixCard])
trendCard = MediumCard([DashboardCardHeader("Revenue Trend", "Thousands of USD"), LineChart(series.rows.label, [Series("Revenue", series.rows.revenue)])])
mixCard = MediumCard([DashboardCardHeader("Revenue by Category"), PieChart(categories.rows.category, categories.rows.revenue, "donut")])
tableRow = CardRow([ordersTableCard])
ordersTableCard = LargeCard([DashboardCardHeader("Recent Orders"), Table([Col("Order", orders.rows.id), Col("Customer", orders.rows.customer), Col("Amount", orders.rows.amount, "number"), Col("Status", orders.rows.status), Col("", @Each(orders.rows, "o", Button("Mark shipped", Action([@Set($orderId, o.id), @Run(ship), @Run(orders)]), "secondary", "normal", "small")), "action")])])`;

// Kit rules written for a model that has no tools and always answers with a bare program.
// Inline mode and the tools below replace them.
const REPLACED_RULES = ["Output MUST begin with", "Button and IconButton only send"];

const EXAMPLE_RULES = [
  "The sales tools hold the data: get_kpis, get_revenue_series, get_sales_by_category and get_orders read it, and update_order_status changes an order. Read every number from a Query; never write numbers into the program.",
  "Pass the filter $variables into each Query's arguments, e.g. {region: $region, period: $period}, so changing a filter fetches new data. Use FilterSelect for region and period, with the option values the tools accept.",
  "A Button can change data: Action([@Set($orderId, o.id), @Run(ship), @Run(orders)]) runs a Mutation and then refreshes the Query that shows it. A Button without an action sends its label back to you as a chat message.",
  "Put the program in one ```openui-lang fence and add one or two short sentences outside it. The program opens in a side panel and the sentences show in the chat. A new dashboard starts with `root = Dashboard([...])`. Answer questions that need no dashboard with text only.",
];

export const promptOptions: PromptOptions = {
  ...openuiDashboardPromptOptions,
  additionalRules: [
    ...openuiDashboardAdditionalRules.filter(
      (rule) => !REPLACED_RULES.some((start) => rule.startsWith(start)),
    ),
    ...EXAMPLE_RULES,
  ],
  tools: toolSpecs,
  toolExamples: [TOOL_EXAMPLE],
  toolCalls: true,
  bindings: true,
  builtinFunctions: true,
  editMode: true,
  inlineMode: true,
};
