/*
 * Short example Dashboard programs for the prompt. They show the things a model most often gets
 * wrong: root first, the story order (a lead Section with one Kpis strip, then Rows of Cards),
 * raw numbers with a Format, previous values beside current ones, and a filter whose $variable
 * changes the data.
 */

/** Written-in data keyed by a period filter, so the filter changes every number it should. */
const FILTERED_EXAMPLE = `root = Dashboard([filters, lead, trends])
$period = "30d"
filters = FilterBar([PeriodPicker($period, [{value: "7d", label: "7D"}, {value: "30d", label: "30D"}]), CompareToggle("Previous period", true)])
lead = Section("", [Kpis([Kpi("Revenue", k[$period].rev, "currency-compact", k[$period].revPrev), Kpi("Orders", k[$period].orders, "number", k[$period].ordersPrev), Kpi("Average order", k[$period].aov, "currency-precise", k[$period].aovPrev)])])
trends = Section("Trends", [Row([Card("Revenue", [TimeSeries(t[$period].labels, [Series("Revenue", t[$period].values, t[$period].previous)], "area", "currency-compact")], "two-thirds", "USD"), Card("Revenue by channel", [Donut(["Online", "Retail", "Wholesale"], [228000, 131000, 53600], "currency-compact", "Total")], "third", "USD")])])
k = {"7d": {rev: 96400, revPrev: 91200, orders: 1284, ordersPrev: 1190, aov: 75.08, aovPrev: 76.64}, "30d": {rev: 412600, revPrev: 398200, orders: 5460, ordersPrev: 5310, aov: 75.57, aovPrev: 74.99}}
t = {"7d": {labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [12100, 13400, 12800, 14200, 15100, 15600, 13200], previous: [11800, 12600, 12900, 13100, 14000, 14600, 12200]}, "30d": {labels: ["Oct 5", "Oct 12", "Oct 19", "Oct 26"], values: [99000, 101000, 102400, 110200], previous: [97200, 99800, 98600, 102600]}}`;

/** No filters: a breakdown, a ranking where lower is better, and a detail table. */
const BREAKDOWN_EXAMPLE = `root = Dashboard([lead, breakdown, detail])
lead = Section("", [Kpis([Kpi("Open tickets", 184, "number", 212, "down"), Kpi("Resolved this week", 96, "number", 88), Kpi("Satisfaction", 94.2, "percent", 92.8)])])
breakdown = Section("Where tickets come from", [Row([Card("Tickets by product area", [Bars(["Billing", "Login", "Reports", "Integrations", "Mobile app"], [Series("Tickets", [58, 44, 37, 29, 16], [64, 51, 30, 33, 34])], "number")], "half", "Open · this week vs last"), Card("Slowest queues", [Leaderboard(["Enterprise", "Billing", "Onboarding", "General"], [9.4, 6.1, 4.8, 2.2], {type: "number", suffix: " h"}, [8.2, 6.9, 5.5, 2.4], "down")], "half", "Median hours to first reply")])])
detail = Section("Detail", [Row([Card("Agents", [Table([Column("Agent", ["Priya", "Marco", "Aiko", "Sam"], "primary"), Column("Resolved", [31, 27, 22, 16], "number", "number"), Column("Satisfaction", [97.1, 94.8, 93.2, 90.4], "number", "percent"), Column("Status", ["On track", "On track", "On track", "Behind"], "badge", null, {"On track": "good", "Behind": "warning"})])], "full")])])`;

/**
 * Live data from a tool that only takes a query string: the date filter's $variable becomes
 * the query's date bounds, for a preset key and for a custom "from..to" range alike, and the
 * period before is loaded for the Kpis' previous. A tool that takes the range itself gets the
 * $variable as an argument. The tool names and the SQL stand in for the host's own.
 */
const LIVE_EXAMPLE = `root = Dashboard([filters, lead, trends, detail])
$range = "30d"
$q = ""
start = days[$range] ? "(current_date - " + days[$range] + ")" : "split_part('" + $range + "', '..', 1)::date"
end = days[$range] ? "current_date" : "split_part('" + $range + "', '..', 2)::date"
during = "day >= " + start + " AND day <= " + end
before = "day >= " + start + " - (" + end + " - " + start + ") - 1 AND day < " + start
totals = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + during}, {rows: []})
earlier = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + before}, {rows: []})
byDay = Query("run_sql", {query: "SELECT day, revenue FROM daily_sales WHERE " + during + " ORDER BY day"}, {rows: []})
byChannel = Query("sales_by_channel", {range: $range}, {rows: []})
now = @First(totals.rows)
prev = @First(earlier.rows)
filters = FilterBar([DateRangeFilter($range, [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}]), CompareToggle("Previous period", true), SearchFilter($q, "Search channels…")])
lead = Section("", [Kpis([Kpi("Revenue", now.revenue, "currency-compact", prev.revenue), Kpi("Orders", now.orders, "number", prev.orders)])])
trends = Section("Trends", [Row([Card("Revenue by day", [TimeSeries(byDay.rows.day, [Series("Revenue", byDay.rows.revenue)], "area", "currency-compact")], "full", "USD")])])
detail = Section("Detail", [Row([Card("Channels", [Table([Column("Channel", byChannel.rows.channel, "primary"), Column("Revenue", byChannel.rows.revenue, "number", "currency"), Column("Orders", byChannel.rows.orders, "number", "number")], 10, false, $q)], "full")])])
days = {"7d": 7, "30d": 30, "90d": 90}`;

/**
 * One list, live data first. The prompt builder appends `examples` and `toolExamples` alike, and
 * OpenUI Cloud forwards only `examples`, so a second list would not reach the model there.
 */
export const examples: string[] = [LIVE_EXAMPLE, FILTERED_EXAMPLE, BREAKDOWN_EXAMPLE];
