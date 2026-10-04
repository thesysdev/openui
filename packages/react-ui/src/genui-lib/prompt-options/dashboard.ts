import type { PromptOptions } from "@openuidev/react-lang";

// Dashboard PR layout guidance and generalized endpoint examples. These are
// prompt data only, so this module is safe to import on the server.

export const dashboardExamples: string[] = [
  `Static dashboard — sample data, no tools:

root = Dashboard([header, section])
header = DashboardHeader("Sales Dashboard", "Sample data — Q1 overview")
section = Section([row1, row2, row3])
row1 = CardRow([card1, card2, card3])
card1 = SmallCard("Total Revenue", "$1.2M", Trend("up", 12.5))
card2 = SmallCard("Active Users", "2,847", Trend("up", 8.1))
card3 = SmallCard("Churn Rate", "2.4%", Trend("down", 0.3))
row2 = CardRow([chartCard])
chartCard = MediumCard([chartHeader, chart])
chartHeader = DashboardCardHeader("Revenue Trend", "Last 30 days")
chart = LineChart(["Jan", "Feb", "Mar"], [Series("Revenue", [120, 150, 180])])
row3 = CardRow([tableCard])
tableCard = LargeCard([tableHeader, table])
tableHeader = DashboardCardHeader("Top Products")
table = Table([Col("Product", ["Widget Pro", "Widget Lite"]), Col("Units", [842, 1205], "number"), Col("Revenue (USD)", [12400, 9800], "number")])`,

  `### Example A — direct tool binds only (the common case: NO script)
Provided tools: \`get_summary({period}) → {revenue, orders, aov}\` and \`get_trend({period}) → {days: [], revenue: []}\`.
Every widget is served by ONE tool's output, so both Queries bind tools directly — introducing a script here would be wrong:

    root = Dashboard([header, section])
    header = DashboardHeader("Sales Overview", "Live data")
    $period = "30d"
    filterBar = FilterBar([periodFilter])
    periodFilter = FilterSelect("period", "Period", [FilterOption("7d", "7 days"), FilterOption("30d", "30 days")], $period)
    section = Section([kpiRow, trendRow], filterBar)
    summary = Query("get_summary", {period: $period}, {revenue: 0, orders: 0, aov: 0})
    trend = Query("get_trend", {period: $period}, {days: [], revenue: []})
    kpiRow = CardRow([revCard, ordCard, aovCard])
    revCard = SmallCard("Revenue", "$" + @Round(summary.revenue, 0))
    ordCard = SmallCard("Orders", "" + summary.orders)
    aovCard = SmallCard("Avg Order Value", "$" + @Round(summary.aov, 2))
    trendRow = CardRow([trendCard])
    trendCard = MediumCard([trendHeader, trendChart])
    trendHeader = DashboardCardHeader("Revenue Trend", "For the selected period")
    trendChart = LineChart(trend.days, [Series("Revenue", trend.revenue)], "natural")

Note: every live value is a Query binding or derived from one; numeric defaults are zero and collections are empty, while known titles and labels render immediately; BOTH Queries read {period: $period} so the filter re-fetches both.`,

  `### Example B — a script demand (fan-out across a per-entity tool)
Provided tools: \`list_regions({}) → {regions: [{id, name}]}\` and \`region_stats({region_id, period}) → {sales, returns}\`.
The chart needs sales across ALL regions but region_stats accepts ONE region per call — that is FAN-OUT AGGREGATION, so the program Queries a NEW name that is not a tool:

    root = Dashboard([header, section])
    header = DashboardHeader("Regional Sales")
    $period = "30d"
    filterBar = FilterBar([periodFilter])
    periodFilter = FilterSelect("period", "Period", [FilterOption("7d", "7 days"), FilterOption("30d", "30 days")], $period)
    section = Section([chartRow], filterBar)
    regionSales = Query("sales_by_region", {period: $period}, {names: [], sales: []})
    chartRow = CardRow([chartCard])
    chartCard = MediumCard([chartHeader, chart])
    chartHeader = DashboardCardHeader("Sales by Region", "All regions, selected period")
    chart = BarChart(regionSales.names, [Series("Sales", regionSales.sales)])

Note: \`sales_by_region\` is NOT a provided tool — it is a script demand. The system generates its body separately (it will call list_regions once, then region_stats per region). You only: pick the snake_case name (distinct from every tool name), pass ONLY $bindings as its args ({period: $period} — never another Query's result), and declare type-correct defaults shaped exactly how you bind them (names → chart labels, sales → series values). Keep these arrays empty until real data arrives.`,

  `### Example C — a full dashboard mixing every data pattern (multiple tools, direct binds + derived metric + join script)
Provided tools: \`get_traffic({period, region}) → {requests, uniques, days: [], daily: []}\`, \`get_errors({period, region}) → {count, ratePct, byService: [{service, errors}]}\`, \`list_services({}) → {services: [{id, name, owner}]}\`, \`service_latency({service_id, period}) → {p95Ms}\`.
Traffic and errors each fit one tool (direct binds); the error-rate KPI derives inline from those two Queries; only the latency table (name+owner from list_services joined with per-service p95 — ROW-LEVEL JOIN + FAN-OUT) needs a script. That reasoning stays in your head — the output is ONLY statements:

    root = Dashboard([header, section])
    header = DashboardHeader("Platform Health", "Traffic, errors, and latency")
    $period = "7d"
    $region = "all"
    filterBar = FilterBar([periodFilter, regionFilter])
    periodFilter = FilterSelect("period", "Period", [FilterOption("24h", "24 hours"), FilterOption("7d", "7 days"), FilterOption("30d", "30 days")], $period)
    regionFilter = FilterSelect("region", "Region", [FilterOption("all", "All regions"), FilterOption("us", "US"), FilterOption("eu", "EU")], $region)
    section = Section([kpiRow, chartRow, tableRow], filterBar)
    traffic = Query("get_traffic", {period: $period, region: $region}, {requests: 0, uniques: 0, days: [], daily: []})
    errors = Query("get_errors", {period: $period, region: $region}, {count: 0, ratePct: 0, byService: []})
    latencyTable = Query("service_latency_table", {period: $period}, {names: [], owners: [], p95s: []})
    kpiRow = CardRow([reqCard, uniqCard, rateCard])
    reqCard = SmallCard("Requests", "" + traffic.requests)
    uniqCard = SmallCard("Unique Users", "" + traffic.uniques)
    rateCard = SmallCard("Error Rate", "" + @Round(errors.count / @Max([traffic.requests, 1]) * 100, 2) + "%")
    chartRow = CardRow([trafficCard, errCard])
    trafficCard = MediumCard([trafficHeader, trafficChart])
    trafficHeader = DashboardCardHeader("Daily Traffic", "Requests per day")
    trafficChart = AreaChart(traffic.days, [Series("Requests", traffic.daily)], "natural")
    errCard = MediumCard([errHeader, errChart])
    errHeader = DashboardCardHeader("Errors by Service", "For the selected period")
    errChart = BarChart(errors.byService.service, [Series("Errors", errors.byService.errors)])
    tableRow = CardRow([latCard])
    latCard = LargeCard([latHeader, latTable])
    latHeader = DashboardCardHeader("Service Latency", "p95 by service with owner")
    latTable = Table([Col("Service", latencyTable.names), Col("Owner", latencyTable.owners), Col("p95 (ms)", latencyTable.p95s, "number")])

Note the split: \`traffic\`/\`errors\` bind tools DIRECTLY; the error-rate KPI is INLINE arithmetic across two Queries (no script); ONLY \`service_latency_table\` is a script (join + fan-out — list_services once, then service_latency per service). \`errors.byService.service\` plucks a field from every row for the chart axis. Every Query reads the filters that should affect it; the table's script takes {period: $period} only ($region does not apply to latency).`,

  `### Example D — one widget combining several per-entity tool calls (FIXED entity set): ONE self-fetching script
Provided tools: \`city_weather({lat, lon}) → {tempC, windKmh, humidityPct}\` and \`city_air({lat, lon}) → {aqi}\` — each serves ONE coordinate per call. A comparison table over three fixed cities needs BOTH tools per city — fan-out + join, so the table binds ONE script and nothing else:

    root = Dashboard([header, section])
    header = DashboardHeader("City Conditions", "Live weather and air quality")
    section = Section([tableRow])
    conditions = Query("city_conditions", {}, {cities: [], temps: [], winds: [], humidities: [], aqis: []})
    tableRow = CardRow([tableCard])
    tableCard = LargeCard([tableHeader, condTable])
    tableHeader = DashboardCardHeader("Three Cities", "Weather joined with air quality")
    condTable = Table([Col("City", conditions.cities), Col("Temp (C)", conditions.temps, "number"), Col("Wind (km/h)", conditions.winds, "number"), Col("Humidity (%)", conditions.humidities, "number"), Col("European AQI", conditions.aqis, "number")])

The script's body (generated separately) calls city_weather and city_air for each of the three cities and returns the joined arrays. Widgets over the SAME entity set all bind this script — a per-city KPI card reads \`conditions.temps[0]\`, not its own extra per-city Query: one entity set, one data source, one frontend round-trip.
WRONG alternative — six direct Queries (city_weather + city_air per city) whose results are passed into the script's args: the script must fetch its OWN data. Query results in script args mean six frontend round-trips plus a script that re-runs every time one of them resolves, and six program statements that no widget binds. Use direct Queries only for values a widget binds DIRECTLY.`,
];

export const dashboardAdditionalRules: string[] = [
  "Output the dashboard root first: root = Dashboard([header, section]). Use forward references so the shell appears before data resolves. Output only OpenUI statements, without planning notes or code fences.",
  "Use DashboardHeader and Section as Dashboard children. A Section owns CardRow children and its optional FilterBar. Prefer one Section unless the dashboard covers distinct topics.",
  "Never nest CardRow inside CardRow or Section inside Section. Do not mix SmallCard with MediumCard or LargeCard in one row. Use at most three KPI cards per row; use tables for four or more comparable entities.",
  "Use DashboardCardHeader for card titles. Use its number title type for a leading KPI. Keep chart and table numeric data as numbers; format displayed metrics separately.",
  "Use only the component signatures, builtins, and exact tool names supplied for this request. The tool names in the examples are placeholders, not additional available tools.",
  'For live dashboards, bind tool-provided values through Query and never invent data. Defaults must match the result shape and field types. Give display strings meaningful defaults instead of empty strings: use names, labels, units, or context already known from the request, and an honest fallback such as "Awaiting data" when unknown. Keep known titles and labels independent of Query results. Numeric defaults remain zero and collections remain empty; IDs, URLs, dates, and enums must obey their field contracts. A Query variable is the result itself, not a data/status wrapper.',
  'For a static dashboard with no tools, illustrative data is allowed only when the DashboardHeader subtitle explicitly says "Sample data". Do not describe illustrative data as live or real-time.',
  "Every Query must feed a rendered widget. Every visible filter must feed the arguments of every Query it affects. Use shared $bindings and exact tool argument names.",
  "Prefer a direct Query when one tool already provides the needed output. Prefer inline arithmetic and supported @builtins for simple totals, rates, differences, and derived metrics, including across two Queries. Guard division against zero.",
  "Use a computed script binding for row-level joins, fan-out over fixed or dynamic entity sets, grouping, reshaping, or calculations requiring loops or schedules. Never hide a required computation by dropping the metric or substituting a constant.",
  "A fan-out script fetches its own data from tools. Pass user inputs and filter bindings as its arguments, not results from other Queries. Widgets over the same entity set should share that result rather than repeat per-entity fetches.",
  "For a script, choose a descriptive snake_case name distinct from tool names and declare meaningful, type-correct defaults matching the widgets, following the defaults rules above. Do not emit JavaScript implementations. Numeric chart/column fields stay numeric.",
  "Plan data sources, result shapes, and filter dependencies before emitting root-first. Keep layout and known titles independent of Query results so the shell renders progressively.",
  "Use Action([@Run(result)]) to trigger a Mutation from a Button; defining a Mutation alone does not execute it. Use the exact available tool or computed script binding and show its result.",
  'Use FilterSelect/FilterMultiSelect for controls that drive Query arguments. Bind the fourth argument to the declared $variable, for example: $termYears = "30" and termControl = FilterSelect("termYears", "Loan term", [FilterOption("15", "15 years"), FilterOption("30", "30 years")], $termYears).',
  "The ordinary Select component stores form fields and does not bind its defaultValue to reactive state. Do not use it for calculator inputs or runtime query filters.",
  'Button actions for Calculate/Apply/Reset must be Action([...]). With result = Query("loan_schedule", {termYears: $termYears}, {payment: 0}), use Button("Calculate", Action([@Run(result)]), "primary") and Button("Reset", Action([@Reset($termYears), @Run(result)]), "secondary"). Never pass a bare array of action steps.',
  "Use string defaults for FilterSelect bindings because option values are strings. The calculation script converts numeric arguments to numbers. Keep one canonical reactive variable per input, or use explicit draft variables when calculation must wait for Apply.",
  "Arguments are positional. Use Trend(direction, value) for trends and FilterOption(value, label) for filter options; do not use raw object literals in those component slots.",
  "SmallCard has three forms: SmallCard(title, metric, Trend(...)) for KPIs; SmallCard(IconText(Icon(...), variant), [MetricIndicator(...)]) for icon cards; SmallCard({title, subtitle?, icon?}, {value, subtext?}) for snippet rows.",
  'Use OverviewCardBlock with OverviewCardItem children: OverviewCardItem(title, value?, valueSubtext?, trend?, subtitle?, icon?). For example: OverviewCardItem("MRR", "$48.2K", "USD", Trend("up", 12.5)).',
  'Table is column-oriented: Table([Col("Product", names), Col("Revenue", revenues, "number")]). Each column contains its own array with the same row count. Never put a rows array in a second Table argument.',
  'Icon takes a lucide name string and optional category, for example Icon("dollar-sign", "finance"). Include a category for a meaningful fallback when the exact icon is unavailable.',
  "Only include controls with a real purpose. Do not add a Refresh button unless the user asks for manual refresh; Queries run when their inputs change.",
];

export const dashboardPromptOptions: PromptOptions = {
  preamble: "You are generating an OpenUI Lang dashboard.",
  examples: dashboardExamples,
  additionalRules: dashboardAdditionalRules,
};
