/**
 * Hardcoded openui-lang DSL for the default dashboard.
 *
 * Covers all four data sources: Stripe, PostHog, GitHub, and Google Calendar.
 * Query() components fetch live data at runtime via the MCP toolProvider —
 * no LLM call is needed for this initial view.
 */

export const DEFAULT_DASHBOARD = `\
root = Stack([header, kpiRow, mainRow1, mainRow2])
header = CardHeader("Dashboard", "Live data from Stripe, PostHog, GitHub, and Google Calendar")

bal = Query("get_stripe_balance", {}, {available: [{amount: 0, currency: "usd"}], pending: [{amount: 0, currency: "usd"}]})
subs = Query("get_stripe_subscriptions", {limit: 20}, {data: []})
charges = Query("get_stripe_charges", {limit: 10}, {data: []})
trends = Query("get_product_trends", {event: "$pageview", math: "dau", dateFrom: "-30d"}, {results: []})
repos = Query("get_my_repos", {perPage: 5}, {repos: []})
activity = Query("get_recent_activity", {}, {rows: [], summary: {total: 0, push: 0, pr: 0, issues: 0, reviews: 0}})
calEvents = Query("get_calendar_events", {maxResults: 20}, {events: {items: []}})

kpiRow = Stack([balCard, subsCard, activityCard, repoCountCard], "row", "m", "stretch", "start", true)
balCard = Card([TextContent("Stripe Balance", "small"), TextContent("$" + @Round(bal.available[0].amount / 100, 2), "large-heavy")])
subsCard = Card([TextContent("Active Subscriptions", "small"), TextContent("" + subs.data.length, "large-heavy")])
activityCard = Card([TextContent("GitHub Events", "small"), TextContent("" + activity.summary.total, "large-heavy")])
repoCountCard = Card([TextContent("Active Repos", "small"), TextContent("" + repos.repos.length, "large-heavy")])

mainRow1 = Stack([dauCard, leaderboardCard], "row", "m", "stretch")
dauCard = Card([CardHeader("Daily Active Users from PostHog", "Last 30 days"), AreaChart(trends.results[0].labels, [Series("DAU", trends.results[0].data)], "natural")])
$sortField = "stars"
sortStars = SelectItem("stars", "Stars")
sortForks = SelectItem("forks", "Forks")
sortIssues = SelectItem("open_issues", "Open Issues")
sortControl = FormControl("Sort by", Select("sortField", [sortStars, sortForks, sortIssues], null, null, $sortField))
sorted = @Sort(repos.repos, $sortField, "desc")
leaderboardCard = Card([CardHeader("🏆 Repository Leaderboard from GitHub", "Sorted by stars, forks, or issues"), sortControl, Table([Col("Repository", sorted.name), Col("Language", @Each(sorted, "r", Tag(r.language, null, "sm"))), Col("⭐ Stars", sorted.stars, "number"), Col("🍴 Forks", sorted.forks, "number"), Col("Open Issues", sorted.open_issues, "number"), Col("Open", @Each(sorted, "r", Button("›", null, "tertiary", null, "extra-small")))])])

mainRow2 = Stack([chargesCard, calendarCard], "row", "m", "stretch")
chargesCard = Card([CardHeader("Charges by Status from Stripe"), PieChart(charges.data.status, charges.data.amount, "donut")])
calendarCard = Card([CardHeader("Upcoming Events from Google Calendar"), CalendarView(calEvents.events.items)])
`;
