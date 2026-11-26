/*
 * Short example Dashboard programs for the prompt. Each answers a different kind of request with
 * a different shape, so no one layout reads as the template: a change to explain, a target to
 * track, and work to prioritise. All three open with the answer, then what explains it, then
 * detail, and each card near the top says something the others don't. They also show what a model most often
 * gets wrong: root first, raw numbers with a Format, previous values beside current ones, and a
 * filter whose $variable changes the data.
 */

/**
 * A target to track, with written-in data keyed by a period filter, so the filter changes every
 * number it should. The headline number carries its target, the main chart draws the target line
 * and the projected month dashed, and the two cards under it split the total two different ways.
 */
const FILTERED_EXAMPLE = `root = Dashboard([filters, lead, regions])
$quarter = "q4"
filters = FilterBar([PeriodPicker($quarter, [{value: "q3", label: "Q3"}, {value: "q4", label: "Q4 to date"}])])
lead = Section("", [Kpis([Kpi("Revenue", d[$quarter].revenue, "currency-compact", d[$quarter].previous, "up", "Target 1.2M", Progress(1200000)), Kpi("Projected quarter end", d[$quarter].projected, "currency-compact", null, "up", "At the pace so far"), Kpi("Months on target", d[$quarter].hit, "number", null, "up", "Of 3", States(d[$quarter].states))]), Row([Card("Monthly revenue against target", [TimeSeries(d[$quarter].months, [Series("Revenue", d[$quarter].monthly)], "bar", "currency-compact", false, [Reference("Monthly target", 400000)], "up", null, null, d[$quarter].projectedFrom)], "full", "USD")])])
regions = Section("Regions", [Row([Card("Revenue by region", [SegmentedBar(["North", "South", "West"], d[$quarter].byRegion, "currency-compact")], "half", "USD"), Card("Regions against their targets", [Goal("North", d[$quarter].byRegion[0], 520000, "currency-compact"), Goal("South", d[$quarter].byRegion[1], 400000, "currency-compact"), Goal("West", d[$quarter].byRegion[2], 280000, "currency-compact")], "half", "USD")], 240)])
d = {"q3": {revenue: 1184000, previous: 1092000, projected: 1184000, hit: 2, states: ["good", "bad", "good"], months: ["Jul", "Aug", "Sep"], monthly: [402000, 371000, 411000], projectedFrom: null, byRegion: [518000, 389000, 277000]}, "q4": {revenue: 843000, previous: 771000, projected: 1238000, hit: 2, states: ["good", "good", null], months: ["Oct", "Nov", "Dec"], monthly: [418000, 425000, 395000], projectedFrom: "Dec", byRegion: [371000, 268000, 204000]}}`;

/**
 * Work to prioritise, with no filters. The lead numbers carry a limit and a direction, the
 * scatter shows a count against a time so the queue that is both large and slow stands out, and
 * the table compares rows on several measures with bars, changes, trends and a status.
 */
const BREAKDOWN_EXAMPLE = `root = Dashboard([lead, queues, agents])
lead = Section("", [Kpis([Kpi("Open tickets", 184, "number", 212, "down"), Kpi("First reply", 5.4, {type: "number", suffix: " h"}, 6.1, "down", "Median · limit 4 h", Progress(4)), Kpi("Satisfaction", 94.2, "percent", 92.8, "up", null, Trend([91.8, 92.1, 92.6, 92.4, 93.0, 92.8, 93.5, 94.2]))])])
queues = Section("Queues", [Row([Card("Backlog and reply time", [Scatter(["Enterprise", "Billing", "Onboarding", "General"], [22, 58, 31, 73], [9.4, 6.1, 4.8, 2.2], "Open tickets", "Median hours to first reply", "number", {type: "number", suffix: " h"}, null, null, [Reference("Limit", 4)])], "half", "One dot per queue"), Card("Tickets by product area", [Bars(["Billing", "Login", "Reports", "Integrations", "Mobile app"], [Series("Tickets", [58, 44, 37, 29, 16], [64, 51, 30, 33, 34])], "number")], "half", "Open · this week and last")])])
agents = Section("Agents", [Row([Card("Agents this week", [Table([Column("Agent", ["Priya", "Marco", "Aiko", "Sam"], "primary"), Column("Resolved", [31, 27, 22, 16], "bar", "number"), Column("Change", [4, -2, 3, -6], "delta", "number"), Column("Satisfaction", [97.1, 94.8, 93.2, 90.4], "number", "percent"), Column("Last 6 weeks", [[24, 26, 25, 29, 27, 31], [30, 28, 31, 27, 29, 27], [17, 18, 20, 19, 19, 22], [23, 22, 21, 20, 22, 16]], "sparkline"), Column("Status", ["On track", "On track", "On track", "Behind"], "badge", null, {"On track": "good", "Behind": "warning"})])], "full")])])`;

/**
 * A change to explain, with live data from a tool that only takes a query string: the date
 * filter's $variable becomes the query's date bounds, for a preset key and for a custom
 * "from..to" range alike, and the period before is loaded for every previous value. A tool that
 * takes the range itself gets the $variable as an argument. After the headline numbers comes
 * where the change sits, biggest fall first, before the trend. The tool names and the SQL stand
 * in for the host's own.
 */
const LIVE_EXAMPLE = `root = Dashboard([filters, lead, change, trend])
$range = "30d"
start = days[$range] ? "(current_date - " + days[$range] + ")" : "split_part('" + $range + "', '..', 1)::date"
end = days[$range] ? "current_date" : "split_part('" + $range + "', '..', 2)::date"
during = "day >= " + start + " AND day <= " + end
before = "day >= " + start + " - CAST(" + end + " - " + start + " AS INTEGER) - 1 AND day < " + start
totals = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + during}, {rows: []})
earlier = Query("run_sql", {query: "SELECT sum(revenue) AS revenue, sum(orders) AS orders FROM daily_sales WHERE " + before}, {rows: []})
byCategory = Query("run_sql", {query: "SELECT category, sum(CASE WHEN " + during + " THEN revenue ELSE 0 END) AS revenue, sum(CASE WHEN " + during + " THEN revenue ELSE 0 END) - sum(CASE WHEN " + before + " THEN revenue ELSE 0 END) AS change, sum(CASE WHEN " + during + " THEN orders ELSE 0 END) AS orders FROM category_sales GROUP BY category ORDER BY change"}, {rows: []})
byChannel = Query("sales_by_channel", {range: $range}, {rows: []})
byDay = Query("run_sql", {query: "SELECT day, revenue FROM daily_sales WHERE " + during + " ORDER BY day"}, {rows: []})
byDayBefore = Query("run_sql", {query: "SELECT revenue FROM daily_sales WHERE " + before + " ORDER BY day"}, {rows: []})
now = @First(totals.rows)
prev = @First(earlier.rows)
filters = FilterBar([DateRangeFilter($range, [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}]), CompareToggle("Previous period", true)])
lead = Section("", [Kpis([Kpi("Revenue", now.revenue, "currency-compact", prev.revenue), Kpi("Orders", now.orders, "number", prev.orders), Kpi("Average order", now.revenue / now.orders, "currency-precise", prev.revenue / prev.orders)])])
change = Section("Change by category and channel", [Row([Card("Categories", [Table([Column("Category", byCategory.rows.category, "primary"), Column("Revenue", byCategory.rows.revenue, "bar", "currency-compact"), Column("Change", byCategory.rows.change, "delta", "currency-compact"), Column("Orders", byCategory.rows.orders, "number", "number")], 8)], "two-thirds", "Biggest fall first · USD"), Card("Channels", [Leaderboard(byChannel.rows.channel, byChannel.rows.revenue, "currency-compact", byChannel.rows.previous)], "third", "USD")])])
trend = Section("Daily revenue", [Row([Card("Revenue by day", [TimeSeries(byDay.rows.day, [Series("Revenue", byDay.rows.revenue, byDayBefore.rows.revenue)], "area", "currency-compact")], "full", "USD")])])
days = {"7d": 7, "30d": 30, "90d": 90}`;

/**
 * One list, live data first. The prompt builder appends `examples` and `toolExamples` alike, and
 * OpenUI Cloud forwards only `examples`, so a second list would not reach the model there.
 */
export const examples: string[] = [LIVE_EXAMPLE, FILTERED_EXAMPLE, BREAKDOWN_EXAMPLE];
