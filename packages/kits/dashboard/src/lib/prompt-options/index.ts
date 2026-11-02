import { type PromptOptions } from "@openuidev/react-lang";
const DASHBOARD_EXAMPLE = `root = Dashboard([header, section])
header = DashboardHeader("Sales Dashboard", "Q1 2025 Overview")
section = Section([row1, row2])
row1 = CardRow([card1, card2, card3])
card1 = SmallCard("Total Revenue", "$1.2M", {direction: "up", value: 12.5})
card2 = SmallCard("Active Users", "2,847", {direction: "up", value: 8.1})
card3 = SmallCard("Churn Rate", "2.4%", {direction: "down", value: 0.3})
row2 = CardRow([chartCard])
chartCard = MediumCard([chartHeader, chart])
chartHeader = DashboardCardHeader("Revenue Trend", "Last 30 days")
chart = LineChart(["Jan", "Feb", "Mar"], [Series("Revenue", [120, 150, 180])])`;

const OVERVIEW_CARDS_EXAMPLE = `root = Dashboard([header, section])
header = DashboardHeader("Platform Overview")
section = Section([row1, row2])
row1 = CardRow([overview])
overview = SmallCard(IconText(Icon("dollar-sign"), "neutral"), [MetricIndicator("$48.2K", "Monthly recurring", {direction: "up", value: 12.5})])
row2 = CardRow([tableCard])
tableCard = LargeCard([tableHeader, table])
tableHeader = DashboardCardHeader("Top Products")
table = Table([productCol, unitsCol, revenueCol])
productCol = Col("Product", ["Widget Pro", "Widget Lite"])
unitsCol = Col("Units", [842, 1205], "number")
revenueCol = Col("Revenue", ["$12,400", "$9,800"], "number")`;

const FILTERED_DASHBOARD_EXAMPLE = `root = Dashboard([header, section])
header = DashboardHeader("Usage Analytics")
filter = FilterBar([regionFilter, productFilter])
regionFilter = FilterSelect("region", "Region", [{value: "all", label: "All Regions"}, {value: "na", label: "North America"}], "all")
productFilter = FilterSelect("product", "Product", [{value: "all", label: "All Products"}, {value: "saas", label: "SaaS"}], "all")
section = Section([row1], filter)
row1 = CardRow([pieCard, barCard])
pieCard = MediumCard([pieHeader, pie])
pieHeader = DashboardCardHeader("Distribution")
pie = PieChart(["API", "Web", "Mobile"], [45, 35, 20])
barCard = MediumCard([barHeader, bar])
barHeader = DashboardCardHeader("Monthly Usage")
bar = BarChart(["Jan", "Feb", "Mar"], [Series("Events", [1200, 1500, 1800])])`;

/**
 * Prompt options for the Dashboard library. Pass to
 * `openuiDashboardLibrary.prompt(openuiDashboardPromptOptions)` when a dashboard
 * prompt is needed. The explicit generator does not currently emit a dashboard
 * artifact.
 */
export const openuiDashboardExamples: string[] = [
  DASHBOARD_EXAMPLE,
  OVERVIEW_CARDS_EXAMPLE,
  FILTERED_DASHBOARD_EXAMPLE,
];

export const openuiDashboardAdditionalRules: string[] = [
  "Output MUST begin with `root = Dashboard([children])` on the first line.",
  "Arguments are POSITIONAL — do NOT use named args with colons.",
  "Dashboard children must be DashboardHeader and Section components.",
  "Each Section contains an array of CardRow components and an optional FilterBar.",
  "CardRow contains SmallCard, MediumCard, or LargeCard — do not mix SmallCard with Medium/LargeCard in the same row.",
  "SmallCard has three forms: SmallCard(title, metric, trend?) for KPIs; SmallCard(IconText(...), [MetricIndicator(...)]) for icon cards; SmallCard(lhs, rhs) for snippet rows.",
  "MediumCard and LargeCard accept DashboardCardHeader, charts, Table, and MetricIndicator as children.",
  "Use DashboardCardHeader for card-level titles. Use titleType 'number' for KPI-first cards.",
  'Use OverviewCardBlock for KPI metric grids with flat props: OverviewCardItem(title, subtitle?, icon?, imageSrc?, imageAlt?, value?, valueSubtext?, trend?). Arguments are positional, so pass "" for imageSrc and imageAlt when using an icon.',
  "Use Table with Col children for tabular data. Set Col type to 'number' for right-aligned numeric columns.",
  "Use FilterBar with FilterSelect/FilterMultiSelect for interactive filters.",
  "Use realistic, professional placeholder data.",
  "Icon takes a name string (e.g. 'dollar-sign', 'users'). Use common lucide icon names.",
];

export const openuiDashboardPromptOptions: PromptOptions = {
  preamble: "You are generating an openui-lang dashboard.",
  examples: openuiDashboardExamples,
  additionalRules: openuiDashboardAdditionalRules,
};
