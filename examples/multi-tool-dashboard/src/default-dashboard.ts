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
$chargeLimit = "10"
charges = Query("get_stripe_charges", {limit: $chargeLimit}, {data: []})
$dateFrom = "-30d"
$dauMetric = "dau"
trends = Query("get_product_trends", {event: "$pageview", math: $dauMetric, dateFrom: $dateFrom}, {results: []})
repos = Query("get_my_repos", {perPage: 100}, {repos: []})
activity = Query("get_recent_activity", {}, {rows: [], summary: {total: 0, push: 0, pr: 0, issues: 0, reviews: 0}})
calEvents = Query("get_calendar_events", {maxResults: 20}, {events: {items: []}})

kpiRow = Stack([balCard, subsCard, activityCard, repoCountCard], "row", "m", "stretch", "start", true)
balCard = Card([TextContent("Stripe Balance", "small"), TextContent("$" + @Round(bal.available[0].amount / 100, 2), "large-heavy")])
subsCard = Card([TextContent("Active Subscriptions", "small"), TextContent("" + subs.data.length, "large-heavy")])
activityCard = Card([TextContent("GitHub Events", "small"), TextContent("" + activity.summary.total, "large-heavy")])
repoCountCard = Card([TextContent("Active Repos", "small"), TextContent("" + repos.repos.length, "large-heavy")])

mainRow1 = Stack([dauCard, leaderboardCard], "row", "m", "stretch")
r7 = SelectItem("-7d", "Last 7 days")
r14 = SelectItem("-14d", "Last 14 days")
r30 = SelectItem("-30d", "Last 30 days")
r90 = SelectItem("-90d", "Last 90 days")
mDau = SelectItem("dau", "DAU")
mTotal = SelectItem("total", "Total")
mWeekly = SelectItem("weekly_active", "Weekly Active")
dauFilters = Stack([FormControl("Date Range", Select("dateFrom", [r7, r14, r30, r90], null, null, $dateFrom)), FormControl("Metric", Select("dauMetric", [mDau, mTotal, mWeekly], null, null, $dauMetric))], "row", "s", "end")
dauCard = Card([CardHeader("Product Analytics from PostHog"), dauFilters, AreaChart(trends.results[0].labels, [Series("Users", trends.results[0].data)], "natural")])

$sortField = "stars"
sortStars = SelectItem("stars", "Stars")
sortForks = SelectItem("forks", "Forks")
sortIssues = SelectItem("open_issues", "Open Issues")
$repoSearch = ""
repoFilters = Stack([FormControl("Sort by", Select("sortField", [sortStars, sortForks, sortIssues], null, null, $sortField)), FormControl("Search", Input("repoSearch", "Filter repos...", "text", null, $repoSearch))], "row", "s", "end")
sorted = @Sort(repos.repos, $sortField, "desc")
filtered = $repoSearch != "" ? @Filter(sorted, "name", "contains", $repoSearch) : sorted
leaderboardCard = Card([CardHeader("🏆 Repository Leaderboard from GitHub"), repoFilters, Table([Col("Repository", filtered.name), Col("Language", @Each(filtered, "r", Tag(r.language, null, "sm"))), Col("⭐ Stars", filtered.stars, "number"), Col("🍴 Forks", filtered.forks, "number"), Col("Open Issues", filtered.open_issues, "number"), Col("Open", @Each(filtered, "r", TextContent("[↗](https://github.com/" + r.full_name + ")")))], 5)])

mainRow2 = Stack([chargesCard, calendarCard], "row", "m", "stretch")
cl5 = SelectItem("5", "Last 5")
cl10 = SelectItem("10", "Last 10")
cl25 = SelectItem("25", "Last 25")
chargeFilter = FormControl("Show", Select("chargeLimit", [cl5, cl10, cl25], null, null, $chargeLimit))
chargesCard = Card([CardHeader("Charges by Status from Stripe"), chargeFilter, PieChart(charges.data.status, charges.data.amount, "donut")])

calendarCard = Card([CardHeader("Upcoming Events from Google Calendar"), CalendarView(calEvents.events.items)])
`;
