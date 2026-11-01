// How generated dashboards use the shadcn library: examples and rules for the model that builds
// them. Plain strings, so the server imports them without the React components.

export const dashboardExamples: string[] = [
  `Example 1 — Comparing npm downloads, with a range filter:
root = Stack([header, range, kpis, trend, totals])
$months = "6"
dl = Query("get_npm_downloads", {packages: "react,vue,svelte", months: $months, interval: "week"}, {periods: [], packages: []})
header = CardHeader("Frontend frameworks", "Weekly npm downloads, live from the npm registry")
range = Select("range", [SelectItem("3", "Last 3 months"), SelectItem("6", "Last 6 months"), SelectItem("12", "Last 12 months")], null, null, $months)
kpis = Stack(@Each(dl.packages, "p", Metric(p.name, p.total, "compact", p.change_pct, "Downloads in range")), "row")
trend = Card([CardHeader("Downloads per week"), LineChart(dl.periods, @Each(dl.packages, "p", Series(p.name, p.downloads)))])
totals = Card([CardHeader("Totals"), Table([Col("Package", dl.packages.name), Col("Downloads", dl.packages.total, "compact"), Col("Weekly average", dl.packages.average, "compact"), Col("Last week vs previous", dl.packages.change_pct, "percent")])])`,

  `Example 2 — A GitHub repository's health, two cards side by side:
root = Stack([header, kpis, activity, recent])
repo = Query("get_github_repo", {repo: "vercel/next.js"}, {stars: 0, forks: 0, open_issues: 0, pushed_at: ""})
commits = Query("get_github_commit_activity", {repo: "vercel/next.js", weeks: 26}, {weeks: [], commits: [], total: 0, average: 0})
rel = Query("get_github_releases", {repo: "vercel/next.js", limit: 8}, {releases: [], per_month: []})
header = CardHeader("vercel/next.js", "Repository health, live from GitHub")
kpis = Stack([Metric("Stars", repo.stars, "compact"), Metric("Forks", repo.forks, "compact"), Metric("Open issues and PRs", repo.open_issues), Metric("Last push", repo.pushed_at, "date")], "row")
activity = Stack([commitsCard, releasesCard], "row")
commitsCard = Card([CardHeader("Commits per week", "" + commits.average + " a week on average"), AreaChart(commits.weeks, [Series("Commits", commits.commits)])])
releasesCard = Card([CardHeader("Releases per month"), BarChart(rel.per_month.month, [Series("Releases", rel.per_month.count)])])
recent = Card([CardHeader("Latest releases"), Table([Col("Release", rel.releases.name), Col("Published", rel.releases.published, "date"), Col("Type", @Each(rel.releases, "r", Tag(r.prerelease ? "Prerelease" : "Stable", r.prerelease ? "outline" : "success")))])])`,

  `Example 3 — Security advisories, with severity badges in a table:
root = Stack([header, kpis, Stack([bySeverity, latest], "row"), list])
vulns = Query("osv_vulnerabilities", {package: "lodash"}, {total: 0, severities: [], counts: [], vulnerabilities: []})
header = CardHeader("lodash security", "Known advisories from OSV.dev")
kpis = Stack([Metric("Advisories", vulns.total), Metric("Critical", vulns.counts[0]), Metric("High", vulns.counts[1]), Metric("Moderate", vulns.counts[2])], "row")
bySeverity = Card([CardHeader("By severity"), PieChart(vulns.severities, vulns.counts)])
latest = Card([CardHeader("Most recent"), TextContent(vulns.vulnerabilities[0].summary), TagBlock([Tag("Fixed in " + vulns.vulnerabilities[0].fixed_in, "success")])])
list = Card([CardHeader("All advisories"), Table([Col("Advisory", vulns.vulnerabilities.id), Col("Severity", @Each(vulns.vulnerabilities, "v", Tag(v.severity, v.severity == "Critical" || v.severity == "High" ? "destructive" : v.severity == "Moderate" ? "warning" : "secondary"))), Col("Summary", vulns.vulnerabilities.summary), Col("Fixed in", vulns.vulnerabilities.fixed_in), Col("Published", vulns.vulnerabilities.published, "date")])])`,
];

export const dashboardRules: string[] = [
  "Every dashboard is root = Stack([...]): a CardHeader naming it first, then filters, a row of Metric tiles, then Cards.",
  'Put Metric tiles in a Stack row: Stack([Metric(...), Metric(...)], "row"). Two to four per row.',
  'Wrap each chart and table in a Card that starts with a CardHeader. Put two Cards side by side with Stack([cardA, cardB], "row").',
  "Pass raw numbers and ISO dates from Query results; Metric and Col format them (compact, percent, date). Don't build number strings yourself.",
  "Filters are Selects bound to $variables, placed under the header. Every Query the filter is about must pass the $variable in its arguments.",
  "Chart labels and every Series' values must have the same length: take both from the same Query result.",
  "Use @Each to build one Series, Metric, or Tag per item of a Query result.",
];
