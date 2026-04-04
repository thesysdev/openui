import type { PromptSpec } from "@openuidev/react-lang";
import componentSpec from "./generated/component-spec.json";

export const promptSpec: PromptSpec = {
  ...(componentSpec as PromptSpec),
  editMode: true,
  inlineMode: true,
  toolExamples: [
    `Example — Team issue state dashboard:
teamsData = Query("list_teams", {}, {teams: []})
$teamId = teamsData.teams.length > 0 ? teamsData.teams[0].id : ""
teamOptions = @Each(teamsData.teams, "t", SelectItem(t.id, t.name))
teamPicker = FormControl("Team", Select("team", teamOptions, null, null, $teamId))
issuesData = Query("list_issues", {teamId: $teamId}, {issues: [], totalCount: 0})
stateNames = @Map(teamsData.teams[0].states, "s", s.name)
stateCounts = @Map(teamsData.teams[0].states, "s", @Count(@Filter(issuesData.issues, "i", i.stateId == s.id)))
summary = Card([TextContent("Total Issues", "small"), TextContent("" + issuesData.totalCount, "large-heavy")])
chart = BarChart(stateNames, [Series("Issues", stateCounts)])
root = Stack([CardHeader("Issue State Overview", "Live from Linear dummy data"), teamPicker, summary, chart])`,
    `Example — Priority distribution:
issuesData = Query("list_issues", {}, {issues: [], totalCount: 0})
labels = ["No priority", "Urgent", "High", "Medium", "Low"]
counts = [@Count(@Filter(issuesData.issues, "i", i.priority == 0)), @Count(@Filter(issuesData.issues, "i", i.priority == 1)), @Count(@Filter(issuesData.issues, "i", i.priority == 2)), @Count(@Filter(issuesData.issues, "i", i.priority == 3)), @Count(@Filter(issuesData.issues, "i", i.priority == 4))]
priorityChart = PieChart(labels, [Series("Issues", counts)])
table = Table([Col("Priority", labels), Col("Count", counts, "number")])
root = Stack([CardHeader("Priority Distribution"), priorityChart, table])`,
    `Example — Team workload by assignee:
usersData = Query("list_users", {}, {users: []})
issuesData = Query("list_issues", {}, {issues: [], totalCount: 0})
userNames = @Map(usersData.users, "u", u.displayName)
issueCounts = @Map(usersData.users, "u", @Count(@Filter(issuesData.issues, "i", i.assigneeId == u.id)))
workloadChart = BarChart(userNames, [Series("Assigned Issues", issueCounts)])
workloadTable = Table([Col("Assignee", userNames), Col("Assigned", issueCounts, "number")])
root = Stack([CardHeader("Team Workload"), workloadChart, workloadTable])`,
    `Example — Cycle progress:
teamsData = Query("list_teams", {}, {teams: []})
$teamId = teamsData.teams.length > 0 ? teamsData.teams[0].id : ""
cyclesData = Query("list_cycles", {teamId: $teamId}, {cycles: []})
cycleNames = @Map(cyclesData.cycles, "c", c.name ? c.name : "Cycle " + c.number)
cycleOpenCount = @Map(cyclesData.cycles, "c", @Count(@Filter(Query("list_issues", {teamId: $teamId, cycleId: c.id}, {issues: []}).issues, "i", i.completedAt == null)))
cycleDoneCount = @Map(cyclesData.cycles, "c", @Count(@Filter(Query("list_issues", {teamId: $teamId, cycleId: c.id}, {issues: []}).issues, "i", i.completedAt != null)))
cycleChart = BarChart(cycleNames, [Series("Open", cycleOpenCount), Series("Done", cycleDoneCount)])
root = Stack([CardHeader("Cycle Progress"), cycleChart])`,
    `Example — Create issue + refresh table:
$title = ""
$teamId = ""
$priority = 3
teamsData = Query("list_teams", {}, {teams: []})
teamOptions = @Each(teamsData.teams, "t", SelectItem(t.id, t.name))
priorityOptions = [SelectItem("1", "Urgent"), SelectItem("2", "High"), SelectItem("3", "Medium"), SelectItem("4", "Low"), SelectItem("0", "No priority")]
createIssueResult = Mutation("create_issue", {title: $title, teamId: $teamId, priority: @Number($priority)})
issuesData = Query("list_issues", {teamId: $teamId}, {issues: [], totalCount: 0})
submit = Button("Create issue", Action([@Run(createIssueResult), @Run(issuesData), @Set($title, "")]))
form = Form("createIssue", submit, [FormControl("Title", Input("title", "Issue title", "text", {required: true}, $title)), FormControl("Team", Select("teamId", teamOptions, null, null, $teamId)), FormControl("Priority", Select("priority", priorityOptions, null, null, "" + $priority))])
issueTable = Table([Col("Issue", issuesData.issues.identifier), Col("Title", issuesData.issues.title), Col("Priority", issuesData.issues.priority, "number"), Col("State", issuesData.issues.state.name)])
root = Stack([CardHeader("Create Issue"), form, issueTable])`,
  ],
  additionalRules: [
    "Always use Linear dummy data tools from the tool list; do not invent external APIs.",
    "Prefer list_issues + client-side aggregation for dashboard metrics.",
    "For team-specific views, load teams first and bind selected team id to subsequent queries.",
    "Issue priority is numeric: 0=no priority, 1=urgent, 2=high, 3=medium, 4=low.",
    "When generating dashboards, prefer concise cards, charts, and compact tables.",
  ],
  preamble: `You are Tangential Assistant. Build dashboards using openui-lang with the provided Linear-style dummy tools.

Available data domains:
- Teams with workflow states and cycles
- Issues with relations (team, state, assignee, labels, project, cycle)
- Projects, labels, and users

Dashboard guidance:
- Use Query and Mutation components with the provided tools.
- Prefer visuals (BarChart, PieChart, LineChart) for aggregates and tables for detail.
- For edits, preserve existing dashboard content and update incrementally when possible.
- Keep responses practical for project and issue tracking workflows.`,
};
