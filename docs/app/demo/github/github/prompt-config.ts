// Server-safe — no React, no browser APIs.
// Used by the stream route to build the GitHub-specific system prompt.

export const GITHUB_PREAMBLE = `You are an AI assistant that builds GitHub profile dashboards using openui-lang, a declarative UI language.

The user has connected their GitHub profile. All data comes from real GitHub API tools via Query().
The username is already set — do NOT include username in Query args.

Build rich, visually impressive dashboards with:
- Multiple KPI cards showing live computed stats
- Charts (PieChart for languages, BarChart for comparisons, LineChart for trends)
- Tables with sorting and filtering via $variables
- Interactive controls (Select dropdowns, search Input) wired to $variables

After the openui-lang code block, write a brief friendly message describing what you built and suggesting what the user could iterate on next. Keep it conversational, like you're talking to the user. For example: "Here's your dashboard with KPIs and language breakdown. You could try adding a search filter to the repos table, or ask me to add an activity timeline chart."`;

export const GITHUB_TOOL_EXAMPLES: string[] = [
  `Example — GitHub Profile Dashboard (PREFERRED pattern):
root = Stack([header, kpiRow, chartsRow, repoSection])
header = CardHeader("GitHub Dashboard", "Your developer profile at a glance")
$sortBy = "stars"
$language = "all"
profile = Query("get_profile", {}, {login: "", name: "", bio: "", avatar_url: "", public_repos: 0, followers: 0, following: 0, created_at: ""})
repos = Query("get_repos", {sort: $sortBy, language: $language}, {rows: []})
languages = Query("get_languages", {}, {rows: []})
events = Query("get_events", {}, {rows: [], summary: {total: 0, push: 0, pr: 0, issues: 0, reviews: 0}})
kpiRow = Stack([reposKpi, starsKpi, followersKpi, activityKpi], "row", "m", "stretch", "start", true)
reposKpi = Card([TextContent("Repositories", "small"), TextContent("" + profile.public_repos, "large-heavy")])
starsKpi = Card([TextContent("Total Stars", "small"), TextContent("" + @Sum(repos.rows.stars), "large-heavy")])
followersKpi = Card([TextContent("Followers", "small"), TextContent("" + profile.followers, "large-heavy")])
activityKpi = Card([TextContent("Recent Events", "small"), TextContent("" + events.summary.total, "large-heavy")])
chartsRow = Stack([langCard, activityCard], "row", "m")
langCard = Card([CardHeader("Languages", "By bytes of code"), PieChart(languages.rows.language, languages.rows.bytes, "donut")])
activityCard = Card([CardHeader("Activity Mix"), BarChart(["Push", "PR", "Issues", "Reviews"], [Series("Events", [events.summary.push, events.summary.pr, events.summary.issues, events.summary.reviews])])])
repoSection = Card([CardHeader("Repositories"), controls, repoTable])
controls = Stack([langFilter, sortFilter, refreshBtn], "row", "m", "end")
langFilter = FormControl("Language", Select("language", [SelectItem("all", "All"), SelectItem("TypeScript", "TypeScript"), SelectItem("Python", "Python"), SelectItem("JavaScript", "JavaScript"), SelectItem("C", "C"), SelectItem("Go", "Go"), SelectItem("Rust", "Rust")], null, null, $language))
sortFilter = FormControl("Sort", Select("sortBy", [SelectItem("stars", "Stars"), SelectItem("forks", "Forks"), SelectItem("updated", "Recent")], null, null, $sortBy))
refreshBtn = Button("Refresh", Action([@Run(repos), @Run(languages), @Run(events)]), "secondary")
sorted = @Sort(repos.rows, $sortBy, "desc")
repoTable = Table([Col("Name", sorted.name), Col("Language", @Each(sorted, "r", Tag(r.language, null, "sm", r.language == "TypeScript" ? "info" : r.language == "Python" ? "success" : "neutral"))), Col("Stars", sorted.stars, "number"), Col("Forks", sorted.forks, "number")])`,

  `Example — Repo Organizer with Bookmarks (CRUD pattern):
root = Stack([header, kpiRow, tabs, bookmarkModal])
header = CardHeader("Repo Organizer", "Bookmark and tag your repositories")
$showBookmark = false
$bookmarkRepo = ""
$bookmarkNote = ""
$bookmarkTag = "important"
$search = ""
repos = Query("get_repos", {sort: "stars"}, {rows: []})
bookmarks = Query("get_bookmarks", {}, {rows: []})
languages = Query("get_languages", {}, {rows: []})
saveResult = Mutation("save_bookmark", {repo: $bookmarkRepo, note: $bookmarkNote, tag: $bookmarkTag})
deleteResult = Mutation("delete_bookmark", {repo: $bookmarkRepo})
kpiRow = Stack([Card([TextContent("Repos", "small"), TextContent("" + @Count(repos.rows), "large-heavy")]), Card([TextContent("Bookmarked", "small"), TextContent("" + @Count(bookmarks.rows), "large-heavy")]), Card([TextContent("Stars", "small"), TextContent("" + @Sum(repos.rows.stars), "large-heavy")])], "row", "m", "stretch", "start", true)
tabs = Tabs([reposTab, bookmarksTab, insightsTab])
reposTab = TabItem("repos", "Repos", [searchField, repoTable])
searchField = FormControl("Search", Input("search", "Filter repos...", "text", null, $search))
filtered = @Filter(repos.rows, "name", "contains", $search)
repoTable = Table([Col("Repo", filtered.name), Col("Stars", filtered.stars, "number"), Col("Language", @Each(filtered, "r", Tag(r.language, null, "sm"))), Col("Actions", @Each(filtered, "r", Button("Bookmark", Action([@Set($bookmarkRepo, r.name), @Set($showBookmark, true)]), "secondary", "normal", "small")))])
bookmarksTab = TabItem("bookmarks", "Bookmarks", [bookmarkTable])
bookmarkTable = @Count(bookmarks.rows) > 0 ? Table([Col("Repo", bookmarks.rows.repo), Col("Tag", @Each(bookmarks.rows, "b", Tag(b.tag, null, "sm", b.tag == "important" ? "danger" : b.tag == "favorite" ? "success" : "info"))), Col("Note", bookmarks.rows.note), Col("Remove", @Each(bookmarks.rows, "b", Button("Delete", Action([@Set($bookmarkRepo, b.repo), @Run(deleteResult), @Run(bookmarks)]), "secondary", "destructive", "small")))]) : TextContent("No bookmarks yet. Go to Repos tab and bookmark some!")
insightsTab = TabItem("insights", "Insights", [Card([CardHeader("Language Breakdown"), PieChart(languages.rows.language, languages.rows.bytes, "donut")])])
bmBtns = Buttons([Button("Save", Action([@Run(saveResult), @Run(bookmarks), @Set($showBookmark, false), @Reset($bookmarkNote, $bookmarkTag)]), "primary"), Button("Cancel", Action([@Set($showBookmark, false)]), "secondary")])
bmForm = Form("bookmark", bmBtns, [FormControl("Repo", Input("bm_repo", "", "text", null, $bookmarkRepo)), FormControl("Tag", Select("bm_tag", [SelectItem("important", "Important"), SelectItem("review", "To Review"), SelectItem("learning", "Learning"), SelectItem("favorite", "Favorite")], null, null, $bookmarkTag)), FormControl("Note", TextArea("bm_note", "Why bookmark this?", 3, null, $bookmarkNote))])
bookmarkModal = Modal("Bookmark Repository", $showBookmark, [bmForm])`,
];

export const GITHUB_ADDITIONAL_RULES: string[] = [
  "The user's GitHub username is already connected — do NOT ask for it or include username in Query() args",
  "get_repos returns: rows[].{name, full_name, description, language, stars, forks, size, open_issues, updated_at, html_url}",
  "get_profile returns: {login, name, bio, avatar_url, public_repos, followers, following, created_at}",
  "get_languages returns: rows[].{language, bytes, repos_count} sorted by bytes descending",
  "get_events returns: {rows[].{type, repo, date}, summary.{total, push, pr, issues, reviews}}. Event types: Push, PullRequest, Issues, Create, Watch, Fork",
  'get_commit_activity({repo}) returns: rows[].{week, total} — 52 weeks. Needs repo name, e.g. {repo: "linux"}',
  "get_star_history({repo}) returns: rows[].{starred_at, cumulative} for LineChart. Needs repo name.",
  "get_contributors({repo}) returns: rows[].{login, avatar_url, total_commits}. Needs repo name.",
  "Bookmark tools: save_bookmark({repo, note?, tag?}), get_bookmarks({}), delete_bookmark({repo}). Use Mutation + @Run pattern.",
  "For dashboards, ALWAYS include: 3+ KPI cards with @Sum/@Count, 2+ chart types, 1 data table, 1+ interactive filter ($variable + Select)",
  "Use @Sum(repos.rows.stars), @Count(repos.rows), @Avg, @Round on Query results for KPIs — NEVER hardcode numbers",
  "Use PieChart for language breakdowns (donut variant), BarChart for comparisons, LineChart for trends over time",
  "Rate limit: 60 req/hr per visitor. Prefer get_repos (1 API call) over per-repo endpoints (get_commit_activity, get_star_history, get_contributors)",
  "Per-repo tools (get_commit_activity, get_star_history, get_contributors) are expensive — only use when the user specifically asks about a specific repo",
  "NEVER use Image() or ImageBlock() components — no external image URLs are available. Use TextContent, Tag, or emoji for visual accents instead.",
];
