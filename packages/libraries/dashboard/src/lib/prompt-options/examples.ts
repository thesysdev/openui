/*
 * Short example Dashboard programs for the prompt. Each answers a different kind of request with a
 * different shape, so no one layout reads as the template: a change to explain, a target to track
 * and work to prioritise. Each opens with the answer, then what explains it, then detail, and
 * shows root first, raw numbers with a Format, previous values beside current ones, and a filter
 * whose $variable changes the data.
 */

/**
 * A change to explain, with live data from a tool that takes a query string: the period filter's
 * $variable becomes the query's date bounds, and the period before loads every previous value.
 * The tool name and the SQL stand in for the host's own.
 */
const LIVE_EXAMPLE = `root = Dashboard([filters, lead, change, trend])
$range = "30d"
during = "day > current_date - " + days[$range]
before = "day > current_date - " + days[$range] * 2 + " AND day <= current_date - " + days[$range]
totals = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + during}, {rows: []})
earlier = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + before}, {rows: []})
byCategory = Query("run_sql", {query: "SELECT category, sum(CASE WHEN " + during + " THEN revenue ELSE 0 END) AS revenue, sum(CASE WHEN " + during + " THEN revenue ELSE 0 END) - sum(CASE WHEN " + before + " THEN revenue ELSE 0 END) AS change FROM daily_sales GROUP BY category ORDER BY change"}, {rows: []})
byDay = Query("run_sql", {query: "SELECT day, revenue FROM daily_sales WHERE " + during + " ORDER BY day"}, {rows: []})
now = @First(totals.rows)
prev = @First(earlier.rows)
filters = FilterBar([PeriodPicker($range, [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}])])
lead = Section("", [Kpis([Kpi("Revenue", now.revenue, "currency-compact", prev.revenue), Kpi("Orders", now.orders, "number", prev.orders), Kpi("Average order", now.revenue / now.orders, "currency-precise", prev.revenue / prev.orders)])])
change = Section("Change by category", [Row([Card("Categories, biggest fall first", [Table([Column("Category", byCategory.rows.category, "primary"), Column("Revenue", byCategory.rows.revenue, "bar", "currency-compact"), Column("Change", byCategory.rows.change, "delta", "currency-compact")], 8)], "full", "USD")])])
trend = Section("Daily revenue", [Row([Card("Revenue by day", [TimeSeries(byDay.rows.day, [Series("Revenue", byDay.rows.revenue)], "area", "currency-compact")], "full", "USD")])])
days = {"7d": 7, "30d": 30, "90d": 90}`;

/**
 * A target to track, with written-in data keyed by a period filter. The headline number carries
 * its target, the chart draws the target line and the projected month dashed, and the card under
 * it splits the total another way.
 */
const FILTERED_EXAMPLE = `root = Dashboard([filters, lead, regions])
$quarter = "q4"
filters = FilterBar([PeriodPicker($quarter, [{value: "q3", label: "Q3"}, {value: "q4", label: "Q4 to date"}])])
lead = Section("", [Kpis([Kpi("Revenue", d[$quarter].revenue, "currency-compact", d[$quarter].previous, "up", "Target 1.2M", Progress(1200000)), Kpi("Projected quarter end", d[$quarter].projected, "currency-compact", null, "up", "At the pace so far")]), Row([Card("Monthly revenue against target", [TimeSeries(d[$quarter].months, [Series("Revenue", d[$quarter].monthly)], "bar", "currency-compact", false, [Reference("Monthly target", 400000)], "up", null, null, d[$quarter].projectedFrom)], "full", "USD")])])
regions = Section("Regions", [Row([Card("Revenue by region", [SegmentedBar(["North", "South", "West"], d[$quarter].byRegion, "currency-compact")], "full", "USD")])])
d = {"q3": {revenue: 1184000, previous: 1092000, projected: 1184000, months: ["Jul", "Aug", "Sep"], monthly: [402000, 371000, 411000], projectedFrom: null, byRegion: [518000, 389000, 277000]}, "q4": {revenue: 843000, previous: 771000, projected: 1238000, months: ["Oct", "Nov", "Dec"], monthly: [418000, 425000, 395000], projectedFrom: "Dec", byRegion: [371000, 268000, 204000]}}`;

/**
 * Work to prioritise, with no filters. The lead numbers carry a limit and a direction, the scatter
 * shows a count against a time so the queue that is both large and slow stands out, and the table
 * compares rows on several measures with bars, changes and a status.
 */
const BREAKDOWN_EXAMPLE = `root = Dashboard([lead, queues])
lead = Section("", [Kpis([Kpi("Open tickets", 184, "number", 212, "down"), Kpi("First reply", 5.4, {type: "number", suffix: " h"}, 6.1, "down", "Median · limit 4 h", Progress(4))])])
queues = Section("Queues", [Row([Card("Backlog and reply time", [Scatter(["Enterprise", "Billing", "Onboarding", "General"], [22, 58, 31, 73], [9.4, 6.1, 4.8, 2.2], "Open tickets", "Median hours to first reply", "number", {type: "number", suffix: " h"}, null, null, [Reference("Limit", 4)])], "half", "One dot per queue"), Card("Agents this week", [Table([Column("Agent", ["Priya", "Marco", "Sam"], "primary"), Column("Resolved", [31, 27, 16], "bar", "number"), Column("Change", [4, -2, -6], "delta", "number"), Column("Status", ["On track", "On track", "Behind"], "badge", null, {"On track": "good", "Behind": "warning"})])], "half")])])`;

/**
 * One list, live data first. The prompt builder appends `examples` and `toolExamples` alike, and
 * OpenUI Cloud forwards only `examples`, so a second list would not reach the model there.
 */
export const examples: string[] = [LIVE_EXAMPLE, FILTERED_EXAMPLE, BREAKDOWN_EXAMPLE];
