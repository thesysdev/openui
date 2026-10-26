import type { KitDefinition } from "../core/kit";
import { glossary } from "./metrics";
import { analyticsTools } from "./tools";

const ACTIVE_FILTER = `activeFilter = FilterSelect("active", "Active means", [{value: "core", label: "Core action"}, {value: "any", label: "Any event"}], $active)`;
const FILTERS = `filters = FilterBar([rangeFilter, platformFilter, planFilter])
rangeFilter = FilterSelect("range", "Period", [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}, {value: "mtd", label: "Month to date"}], $range)
platformFilter = FilterSelect("platform", "Platform", [{value: "all", label: "All platforms"}, {value: "web", label: "Web"}, {value: "ios", label: "iOS"}, {value: "android", label: "Android"}], $platform)
planFilter = FilterSelect("plan", "Plan", [{value: "all", label: "All plans"}, {value: "free", label: "Free"}, {value: "team", label: "Team"}, {value: "business", label: "Business"}], $plan)`;
const COMPARE_FILTER = `compareFilter = FilterSelect("compare", "Compare with", [{value: "previous_period", label: "Previous period"}, {value: "last_year", label: "Last year"}, {value: "plan", label: "Plan"}], $compare)`;
const KPI_DEFAULTS = `{periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}`;
const SOURCES_DEFAULTS = `{labels: [], signups: [], activationRate: [], items: [], activation: []}`;

const PRODUCT_HEALTH = `root = Dashboard([header, section])
header = DashboardHeader("Product health", kpis.periodLabel)
$range = "30d"
$platform = "all"
$plan = "all"
$active = "core"
$compare = "previous_period"
section = Section([heroRow, kpiRow, usersRow, lifecycleRow], filters)
filters = FilterBar([rangeFilter, compareFilter, platformFilter, planFilter, activeFilter])
${FILTERS.split("\n").slice(1).join("\n")}
${COMPARE_FILTER}
${ACTIVE_FILTER}
kpis = Query("get_usage_kpis", {range: $range, platform: $platform, plan: $plan, active: $active, compare: $compare}, ${KPI_DEFAULTS})
insights = Query("get_product_insights", {range: $range, platform: $platform, plan: $plan, compare: $compare}, {insights: []})
heroRow = CardRow([heroCard, insightCard])
heroCard = LargeCard([hero, statusChips])
$metric = ""
hero = HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)
status = Query("get_data_status", {range: $range, platform: $platform}, {items: [], summary: ""})
statusChips = DataStatus(status.items)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("What changed", "Most important first")
insightList = InsightList(insights.insights, 3)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip, kpiRules])
kpiStrip = KpiStrip(kpis.metrics, $metric)
kpiRules = RuleChips(kpis.rules)
active = Query("get_active_users", {range: $range, platform: $platform, plan: $plan, active: $active}, {labels: [], dau: [], wau: [], mau: [], events: [], rule: ""})
sticky = Query("get_stickiness", {platform: $platform, plan: $plan, window: 7}, {window: 7, buckets: [], powerUserShare: "—"})
usersRow = CardRow([activeCard, stickyCard])
activeCard = LargeCard([activeHeader, activeChart])
activeHeader = DashboardCardHeader("Active users", active.rule)
activeChart = TrendChart(active.labels, [{name: "MAU", values: active.mau}, {name: "WAU", values: active.wau}, {name: "DAU", values: active.dau}], "number", "line", active.events, true)
stickyCard = MediumCard([stickyHeader, stickyChart])
stickyHeader = DashboardCardHeader(sticky.powerUserShare, "Power users: active 5+ of the last 7 days", "number")
stickyChart = PowerUserCurve(sticky.buckets, sticky.window, sticky.powerUserShare)
life = Query("get_lifecycle", {platform: $platform, plan: $plan, weeks: 12}, {labels: [], newUsers: [], returning: [], resurrecting: [], dormant: [], quickRatio: "—", rule: ""})
goal = Query("get_signup_goal", {platform: $platform}, {label: "", goal: 0, labels: [], cumulative: []})
lifecycleRow = CardRow([lifeCard, goalCard])
lifeCard = LargeCard([lifeHeader, lifeChart])
lifeHeader = DashboardCardHeader("Lifecycle", "Weekly new, returning, resurrecting, and dormant users; active = core action")
lifeChart = LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio)
goalCard = MediumCard([goalHeader, goalPace])
goalHeader = DashboardCardHeader("Monthly goal", "October signups against the pace needed to reach the goal")
goalPace = GoalPace(goal)`;

const RETENTION_AND_LIFECYCLE = `root = Dashboard([header, section])
header = DashboardHeader("Retention and lifecycle", curves.flattened)
$platform = "all"
$plan = "all"
$mode = "exact"
$unit = "user"
section = Section([curveRow, cohortRow, stateRow, flowRow], filters)
filters = FilterBar([platformFilter, planFilter, modeFilter, unitFilter])
${FILTERS.split("\n").slice(2).join("\n")}
modeFilter = FilterSelect("mode", "Retention", [{value: "exact", label: "Active that week"}, {value: "unbounded", label: "That week or later"}, {value: "bracket", label: "Brackets"}], $mode)
unitFilter = FilterSelect("unit", "Count", [{value: "user", label: "Users"}, {value: "workspace", label: "Workspaces"}], $unit)
curves = Query("get_retention_curves", {platform: $platform, weeks: 8, mode: $mode, unit: $unit}, {labels: [], all: [], free: [], team: [], business: [], flattened: "", rule: ""})
sticky = Query("get_stickiness", {platform: $platform, plan: $plan, window: 28}, {window: 28, buckets: [], powerUserShare: "—"})
curveRow = CardRow([curveCard, stickyCard])
curveCard = LargeCard([curveHeader, curveChart])
curveHeader = DashboardCardHeader("Retention by plan", curves.rule)
curveChart = TrendChart(curves.labels, [{name: "Business", values: curves.business}, {name: "Team", values: curves.team}, {name: "Free", values: curves.free}, {name: "All", values: curves.all, emphasis: "muted"}], "percent", "line")
stickyCard = MediumCard([stickyHeader, stickyChart])
stickyHeader = DashboardCardHeader(sticky.powerUserShare, "Power users: active 20+ of the last 28 days", "number")
stickyChart = PowerUserCurve(sticky.buckets, sticky.window, sticky.powerUserShare)
cohorts = Query("get_retention_cohorts", {platform: $platform, plan: $plan, weeks: 8, mode: $mode, unit: $unit}, {periodLabels: [], cohorts: [], format: "percent", rule: ""})
cohortRow = CardRow([cohortCard])
cohortCard = LargeCard([cohortHeader, cohortGrid])
cohortHeader = DashboardCardHeader("Weekly cohorts", cohorts.rule)
cohortGrid = CohortGrid(cohorts.cohorts, cohorts.periodLabels, cohorts.format, "Cohort size")
states = Query("get_lifecycle", {platform: $platform, plan: $plan, view: "states"}, {labels: [], newUsers: [], dormant: 0, current: [], cameBack: [], atRiskWau: [], rates: [], sensitivity: [], flow: [], rule: ""})
stateRow = CardRow([stateCard, rateCard])
stateCard = LargeCard([stateHeader, stateChart])
stateHeader = DashboardCardHeader("Daily lifecycle states", "Active users by why they count; users away 1–6 days below the line")
stateChart = ColumnChart(states.labels, [{name: "Current", values: states.current}, {name: "New", values: states.newUsers}, {name: "Came back", values: states.cameBack}, {name: "At risk this week", values: states.atRiskWau}], "number", true)
rateCard = MediumCard([rateHeader, rateList])
rateHeader = DashboardCardHeader("Which rate moves actives", "Extra daily actives in 90 days if a state's return rate rose 2%")
rateList = BarList(states.sensitivity, "number", 4)
flowRow = CardRow([flowCard])
flowCard = LargeCard([flowHeader, flowChart])
flowHeader = DashboardCardHeader("Where users moved", "Each user's state 28 days ago, or signed up since, against today; dormant is 29–90 days away, lapsed longer")
flowChart = LifecycleFlow(states.flow)`;

const FEATURES_AND_EXPERIMENTS = `root = Dashboard([header, section])
header = DashboardHeader("Features and experiments", "Experiments ready to decide, and which features go with users staying")
$range = "30d"
$platform = "all"
$plan = "all"
$status = "running"
section = Section([experimentRow, releaseRow, valueRow, matrixRow, rhythmRow, eventsRow], filters)
filters = FilterBar([rangeFilter, platformFilter, planFilter, statusFilter])
${FILTERS.split("\n").slice(1).join("\n")}
statusFilter = FilterSelect("status", "Experiments", [{value: "running", label: "Running"}, {value: "completed", label: "Completed"}, {value: "all", label: "All experiments"}], $status)
experiments = Query("get_experiments", {status: $status}, {experiments: []})
experimentRow = CardRow([experimentCard])
experimentCard = LargeCard([experimentHeader, experimentList])
experimentHeader = DashboardCardHeader("Experiments", "Lift with its 95% interval, the traffic split check, guardrails, and the decision")
experimentList = ExperimentResults(experiments.experiments)
releases = Query("get_release_impact", {}, {releases: []})
releaseRow = CardRow([releaseCard])
releaseCard = LargeCard([releaseHeader, releaseList])
releaseHeader = DashboardCardHeader("What each release changed", "Shipped and rolled-back features, the week before against the week after")
releaseList = ReleaseImpact(releases.releases)
features = Query("get_feature_engagement", {range: $range, platform: $platform, plan: $plan}, {features: []})
valueRow = CardRow([valueCard])
valueCard = LargeCard([valueHeader, value])
valueHeader = DashboardCardHeader("Feature value", "Which features go with users staying: protect, promote, keep ungated, or review")
value = FeatureValue(features.features)
matrixRow = CardRow([matrixCard, adoptionCard])
matrixCard = LargeCard([matrixHeader, matrix])
matrixHeader = DashboardCardHeader("How features are used", "How many use each feature against how often, sized by users; lines mark the medians")
matrix = EngagementMatrix(features.features)
adoptionCard = MediumCard([adoptionHeader, adoption])
adoptionHeader = DashboardCardHeader("Feature adoption", "Share of the period's active users, with change")
adoption = FeatureAdoption(features.features, 8)
heat = Query("get_activity_heatmap", {range: $range, platform: $platform, plan: $plan}, {hourLabels: [], days: []})
rhythmRow = CardRow([heatCard])
heatCard = LargeCard([heatHeader, heatmap])
heatHeader = DashboardCardHeader("When people work", "Average events per hour by weekday, UTC")
heatmap = ActivityHeatmap(heat.days, heat.hourLabels)
top = Query("get_top_events", {range: $range, platform: $platform, limit: 8}, {events: []})
eventsRow = CardRow([eventsCard])
eventsCard = LargeCard([eventsHeader, eventsTable])
eventsHeader = DashboardCardHeader("Top events", "Volume, reach, and change against the prior period")
eventsTable = EventTable(top.events)`;

const MONETISATION = `root = Dashboard([header, section])
header = DashboardHeader("Monetisation", "From free to paid: product-qualified workspaces, Free plan limits, trials, and AI credit commits")
$range = "90d"
section = Section([kpiRow, funnelRow, paywallRow, commitRow], filters)
filters = FilterBar([rangeFilter])
rangeFilter = FilterSelect("range", "Period", [{value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}], $range)
money = Query("get_monetization", {range: $range}, {metrics: [], funnel: [], trials: [], paywalls: [], labels: [], freeToPaid: [], band: {label: "", from: 0, to: 0}})
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(money.metrics)
funnelRow = CardRow([funnelCard, trendCard])
funnelCard = LargeCard([funnelHeader, funnelChart])
funnelHeader = DashboardCardHeader("Free to paid", "New workspaces through team activation and a Free limit to paying and expanding")
funnelChart = ConversionFunnel(money.funnel)
trendCard = MediumCard([trendHeader, trendChart])
trendHeader = DashboardCardHeader("Free to paid by week", money.band.label)
trendChart = TrendChart(money.labels, [{name: "Free to paid", values: money.freeToPaid}], "percent", "line", [], false, money.band)
paywallRow = CardRow([paywallCard, trialCard])
paywallCard = LargeCard([paywallHeader, paywalls])
paywallHeader = DashboardCardHeader("Free plan limits", "How many hit each limit a week, and how many upgrade within 14 days")
paywalls = PaywallMatrix(money.paywalls)
trialCard = MediumCard([trialHeader, trials])
trialHeader = DashboardCardHeader("Business trials", "How 14-day trials from Team ended")
trials = BarList(money.trials, "number", 4)
commits = Query("get_usage_commits", {}, {metrics: [], commits: []})
commitRow = CardRow([commitCard])
commitCard = LargeCard([commitHeader, commitStrip, commitTable])
commitHeader = DashboardCardHeader("AI credit commits", "Use against a straight line through each term; under-pacing renewals first")
commitStrip = KpiStrip(commits.metrics)
commitTable = CommitPacing(commits.commits)`;

const WEEKLY_REVIEW = `root = Dashboard([header, section])
header = DashboardHeader("Weekly review", review.period)
section = Section([reviewRow, decideRow, experimentRow])
review = Query("get_weekly_review", {}, {period: "", rows: []})
reviewRow = CardRow([reviewCard])
reviewCard = LargeCard([reviewHeader, reviewList])
reviewHeader = DashboardCardHeader("6-12", "Each metric's last 6 weeks and 12 months against last year and plan; every exception gets a cause or an owner")
reviewList = WeeklyReview(review.rows)
actions = Query("get_actions", {}, {actions: []})
insights = Query("get_product_insights", {range: "7d", platform: "all", plan: "all"}, {insights: []})
decideRow = CardRow([actionCard, insightCard])
actionCard = LargeCard([actionHeader, actionList])
actionHeader = DashboardCardHeader("Decisions this week", "Approve or dismiss; the demo only logs what it would do")
actionList = ActionCards(actions.actions)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("What changed", "Most important first")
insightList = InsightList(insights.insights, 4)
experiments = Query("get_experiments", {status: "running"}, {experiments: []})
experimentRow = CardRow([experimentCard])
experimentCard = LargeCard([experimentHeader, experimentList])
experimentHeader = DashboardCardHeader("Running experiments", "Each with its recommendation")
experimentList = ExperimentResults(experiments.experiments)`;

const ALERT_CHECK = `root = Dashboard([header, section])
header = DashboardHeader("Alert check", alert.rule)
$alertMetric = "dau"
$drop = "15"
$confirm = "1of1"
$quiet = "none"
$window = "90"
section = Section([alertRow], filters)
filters = FilterBar([metricFilter, dropFilter, confirmFilter, quietFilter, windowFilter])
metricFilter = FilterSelect("alertMetric", "Metric", [{value: "dau", label: "Daily active users"}, {value: "signups", label: "New signups"}, {value: "activation", label: "Activation"}], $alertMetric)
dropFilter = FilterSelect("drop", "Below usual by", [{value: "5", label: "5%"}, {value: "10", label: "10%"}, {value: "15", label: "15%"}, {value: "25", label: "25%"}], $drop)
confirmFilter = FilterSelect("confirm", "Confirm over", [{value: "1of1", label: "1 day"}, {value: "2of3", label: "2 of 3 days"}, {value: "3of5", label: "3 of 5 days"}], $confirm)
quietFilter = FilterSelect("quiet", "Quiet hours", [{value: "none", label: "Send at once"}, {value: "weekends", label: "Hold weekends to Monday"}], $quiet)
windowFilter = FilterSelect("window", "Back-test", [{value: "30", label: "Last 30 days"}, {value: "90", label: "Last 90 days"}], $window)
alert = Query("preview_alert", {metric: $alertMetric, drop: $drop, confirm: $confirm, quiet: $quiet, window: $window}, {labels: [], actual: [], threshold: [], format: "number", events: [], days: [], fired: 0, rule: "", summary: ""})
alertRow = CardRow([alertCard])
alertCard = LargeCard([alertHeader, alertChart, alertDays])
alertDays = Tracker(alert.days)
alertHeader = DashboardCardHeader("Back-test", alert.summary)
alertChart = TrendChart(alert.labels, [{name: "Actual", values: alert.actual, emphasis: "primary"}, {name: "Alert line", values: alert.threshold, emphasis: "muted"}], alert.format, "line", alert.events)`;

const ACTIVATION = `root = Dashboard([header, section])
header = DashboardHeader("Activation", "From signup to setup, the aha moment, and habit")
$range = "30d"
$platform = "all"
$plan = "all"
$unit = "user"
section = Section([funnelRow, platformRow, momentRow, pathRow], filters)
filters = FilterBar([rangeFilter, platformFilter, planFilter, unitFilter])
${FILTERS.split("\n").slice(1).join("\n")}
unitFilter = FilterSelect("unit", "Count", [{value: "user", label: "Users"}, {value: "workspace", label: "Workspaces"}], $unit)
funnel = Query("get_activation_funnel", {range: $range, platform: $platform, plan: $plan, unit: $unit}, {steps: [], activationRate: "—", validity: {activated: "", notActivated: "", ratio: 0, pass: false, note: ""}, platformUsers: [], platformActivation: [], platformRule: ""})
sources = Query("get_signups_by_source", {range: $range, platform: $platform}, ${SOURCES_DEFAULTS})
funnelRow = CardRow([funnelCard, sourceCard])
funnelCard = LargeCard([funnelHeader, funnelChart, validityNote])
funnelHeader = DashboardCardHeader(funnel.activationRate, "Activated: reached the aha moment within 7 days of setup", "number")
funnelChart = ConversionFunnel(funnel.steps)
validityNote = TextContent(funnel.validity.note, "small")
sourceCard = MediumCard([sourceHeader, sourceShare, sourceList])
sourceHeader = DashboardCardHeader("Signups by source", "Share of new signups, then how many of each activated")
sourceShare = ShareBar(sources.items, "number")
sourceList = BarList(sources.activation, "percent", 6, "Activated")
platformRow = CardRow([platformCard])
platformCard = LargeCard([platformHeader, platformShare, platformActivation])
platformHeader = DashboardCardHeader("Platform mix", funnel.platformRule)
platformShare = ShareBar(funnel.platformUsers, "number", $platform)
platformActivation = BarList(funnel.platformActivation, "percent", 3, "Activation by platform")
moments = Query("find_activation_moment", {platform: $platform, plan: $plan}, {cohort: "", users: 0, baseline: "", candidates: [], note: ""})
momentRow = CardRow([momentCard])
momentCard = LargeCard([momentHeader, momentList])
momentHeader = DashboardCardHeader("The aha moment", "Early behaviours ranked by how well they tell users still active in week 4 from the rest")
momentList = ActivationMoments(moments)
paths = Query("get_user_paths", {range: $range, platform: $platform}, {start: "", totalUsers: 0, paths: []})
pathRow = CardRow([pathCard])
pathCard = LargeCard([pathHeader, pathList])
pathHeader = DashboardCardHeader("First-session paths", "What new users do right after signing up, and how it ends")
pathList = UserPaths(paths.start, paths.totalUsers, paths.paths)`;

const WHY_DEFAULTS = `{metric: "", periodLabel: "", comparisonLabel: "", value: "—", comparison: "—", delta: "", change: 0, tone: "neutral", confidence: {level: "Low", z: 0, note: ""}, summary: "", drivers: [], offsetting: [], walk: [], format: "number"}`;

const WHAT_CHANGED = `root = Dashboard([header, section])
header = DashboardHeader("What changed and why", why.periodLabel)
$why = "wau"
$range = "30d"
$platform = "all"
$plan = "all"
$active = "core"
$compare = "previous_period"
section = Section([whyRow, walkRow], filters)
filters = FilterBar([metricFilter, rangeFilter, compareFilter, platformFilter, planFilter, activeFilter])
metricFilter = FilterSelect("why", "Metric", [{value: "wau", label: "Weekly active users"}, {value: "dau", label: "Daily active users"}, {value: "signups", label: "New signups"}, {value: "activation", label: "Activation"}, {value: "stickiness", label: "DAU/MAU"}], $why)
${FILTERS.split("\n").slice(1).join("\n")}
${COMPARE_FILTER}
${ACTIVE_FILTER}
why = Query("explain_change", {metric: $why, range: $range, platform: $platform, plan: $plan, active: $active, compare: $compare}, ${WHY_DEFAULTS})
insights = Query("get_product_insights", {range: $range, platform: $platform, plan: $plan, compare: $compare, excluding: $why}, {insights: []})
whyRow = CardRow([whyCard, insightCard])
whyCard = LargeCard([whyHeader, drivers])
whyHeader = DashboardCardHeader(why.value, why.metric, "number")
drivers = DriverCards(why)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("Across the product", "Other findings, most important first")
insightList = InsightList(insights.insights, 4)
walkRow = CardRow([walkCard])
walkCard = LargeCard([walkHeader, walkChart])
walkHeader = DashboardCardHeader("From the comparison to this period", "Each change that lifted (blue) or lowered (red) the metric, data problems first")
walkChart = VarianceWalk(why.walk, why.comparisonLabel, why.format)`;

const ACCOUNTS_AND_REVENUE = `root = Dashboard([header, section])
header = DashboardHeader("Accounts and revenue", "Paying workspaces: where revenue moved, who is active, who is slipping, and who is ready to grow")
$accountPlan = "all"
$accountActive = "team"
$list = "risk"
section = Section([revenueRow, nrrRow, activityRow, listRow, backRow], filters)
filters = FilterBar([accountPlanFilter, accountActiveFilter, listFilter])
accountPlanFilter = FilterSelect("accountPlan", "Account plan", [{value: "all", label: "Team and Business"}, {value: "team", label: "Team"}, {value: "business", label: "Business"}], $accountPlan)
accountActiveFilter = FilterSelect("accountActive", "Active workspace", [{value: "team", label: "3+ members"}, {value: "any", label: "Anyone"}, {value: "seats", label: "Half the seats"}], $accountActive)
listFilter = FilterSelect("list", "List", [{value: "risk", label: "Lowest health"}, {value: "slipping", label: "Slipping away"}, {value: "expansion", label: "Ready to expand"}, {value: "power", label: "Power workspaces"}, {value: "mrr", label: "Largest"}], $list)
revenue = Query("get_revenue_retention", {plan: $accountPlan}, {metrics: [], walk: [], comparisonLabel: "", labels: [], cohorts: [], cohortLabels: [], nrr: [], nrrBand: {label: "", from: 0, to: 0}, movements: [], note: ""})
nrrRow = CardRow([nrrCohortCard, nrrTrendCard])
nrrCohortCard = LargeCard([nrrCohortHeader, nrrCohorts])
nrrCohortHeader = DashboardCardHeader("Net revenue retention by start month", "Each month's new workspaces: MRR now ÷ their starting MRR")
nrrCohorts = CohortGrid(revenue.cohorts, revenue.cohortLabels, "percent", "Workspaces")
nrrTrendCard = MediumCard([nrrTrendHeader, nrrTrend])
nrrTrendHeader = DashboardCardHeader("Net revenue retention", revenue.nrrBand.label)
nrrTrend = TrendChart(revenue.labels, [{name: "NRR", values: revenue.nrr}], "percent", "line", [], false, revenue.nrrBand)
revenueRow = CardRow([walkCard, movementCard])
walkCard = LargeCard([walkHeader, revenueStrip, revenueWalk])
walkHeader = DashboardCardHeader("Recurring revenue", revenue.note)
revenueStrip = KpiStrip(revenue.metrics)
revenueWalk = VarianceWalk(revenue.walk, revenue.comparisonLabel, "currency")
movementCard = MediumCard([movementHeader, movementChart])
movementHeader = DashboardCardHeader("MRR gained and lost", "New, expansion, and reactivation above zero; contraction and churn below, by month")
movementChart = ColumnChart(revenue.labels, revenue.movements, "currency", true)
activity = Query("get_account_activity", {plan: $accountPlan, accountActive: $accountActive}, {labels: [], active: [], seats: [], metrics: [], rule: ""})
activityRow = CardRow([activityCard, seatCard])
activityCard = LargeCard([activityHeader, activityStrip, activityChart])
activityHeader = DashboardCardHeader("Active workspaces", activity.rule)
activityStrip = KpiStrip(activity.metrics)
activityChart = ColumnChart(activity.labels, [{name: "Active workspaces", values: activity.active}], "number", false, "Workspaces")
seatCard = MediumCard([seatHeader, seatFunnel])
seatHeader = DashboardCardHeader("Seats", "Paid, claimed, and active in the last 28 days")
seatFunnel = ConversionFunnel(activity.seats)
accounts = Query("get_account_health", {plan: $accountPlan, list: $list, limit: 10}, {metrics: [], accounts: [], distribution: {labels: [], series: []}, backTest: []})
listRow = CardRow([listCard])
listCard = LargeCard([listHeader, listStrip, listTable])
listHeader = DashboardCardHeader("Workspaces", "Each with why it is on the list; open a row for its health breakdown")
listStrip = KpiStrip(accounts.metrics)
listTable = AccountHealth(accounts.accounts)
backRow = CardRow([distCard, backCard])
distCard = LargeCard([distHeader, distChart])
distHeader = DashboardCardHeader("Health across every paying workspace", "Workspaces by health score: under 40 at risk, 40–69 watch, 70 and up healthy")
distChart = ColumnChart(accounts.distribution.labels, accounts.distribution.series, "number", true)
backCard = MediumCard([backHeader, backChart])
backHeader = DashboardCardHeader("Does the health score work?", "Workspaces that cancelled in the last 90 days, by their health score 90 days ago")
backChart = BarList(accounts.backTest, "percent", 3, "Cancelled within 90 days")`;

export const analyticsKit: KitDefinition = {
  id: "analytics",
  name: "Product analytics",
  tagline:
    "Active users, lifecycle, activation, retention cohorts, stickiness, feature engagement, experiments, and account health for a SaaS product.",
  preamble:
    "You build product analytics dashboards for the team behind Relay, a team workspace app with boards, tasks, and docs, sold on Free, Team, and Business plans and used on web, iOS, and Android. You are generating an openui-lang dashboard.",
  rules: [
    'Filters: $range ("7d" | "30d" | "90d" | "mtd", default "30d"), $platform ("all" | "web" | "ios" | "android"), $plan ("all" | "free" | "team" | "business"), $active ("core" | "any": what counts as active), $compare ("previous_period" | "last_year" | "plan"). Tool arguments of the same names take these values: pass $compare to every tool that takes compare, so all cards share one basis. Why questions → explain_change with DriverCards and VarianceWalk, its metric matching the question and the dashboard filters; never write a cause the tools did not return. get_lifecycle, get_retention_cohorts, get_retention_curves, and get_stickiness take no range. Only add filters that the dashboard\'s tools accept.',
    `Definitions: ${glossary()}. Breadth = percent of the period's active users using a feature; frequency = days per week they use it. Each KPI carries its definition.`,
    "Layout: rows of a LargeCard and a MediumCard. An overview opens with the hero beside a MediumCard that explains it (InsightList with a limit, or a funnel), then the KpiStrip row. An InsightList always takes a limit of 3 or 4.",
    'Use a KPI tool\'s periodLabel as the DashboardHeader subtitle: DashboardHeader("Product health", kpis.periodLabel). KPI query defaults: {periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}.',
    'Charts by question, preferring the specific one when the question matches it: change over time → TrendChart (DAU/WAU/MAU, retention curves by plan with "All users" muted); per-period counts → ColumnChart; ranked categories → BarList; part-to-whole → ShareBar; when users are active → ActivityHeatmap(heat.days, heat.hourLabels) from get_activity_heatmap; which features to promote or retire → FeatureValue(features.features) or EngagementMatrix(features.features) from get_feature_engagement; on pace for the month → GoalPace(goal) from get_signup_goal; how users moved between lifecycle states → LifecycleFlow(states.flow) from get_lifecycle with view "states"; days an alert would fire → Tracker(alert.days) from preview_alert. Do not use LineChart, AreaChart, BarChart, or PieChart.',
    "Match questions to tools: overview → get_usage_kpis, get_product_insights, get_active_users, get_lifecycle; activation → get_activation_funnel, find_activation_moment; retention → get_retention_cohorts, get_retention_curves; engagement → get_feature_engagement, get_stickiness; experiments → get_experiments; accounts → get_account_health; revenue → get_revenue_retention; free to paid → get_monetization, get_usage_commits; weekly review → get_weekly_review, get_actions; alerts → preview_alert.",
    'Give every card except the hero a DashboardCardHeader whose subtitle says what is measured and against what. When a card leads with one number, make it the title with titleType "number", e.g. DashboardCardHeader(sticky.powerUserShare, "Power users: active 5+ of the last 7 days", "number").',
  ],
  tools: analyticsTools,
  gallery: [
    {
      title: "Product health",
      description:
        "Weekly active users hero with the data status beside what changed, usage KPIs against the prior period, last year, or plan, DAU/WAU/MAU, the power user curve, weekly lifecycle with quick ratio, and the signup goal.",
      program: PRODUCT_HEALTH,
    },
    {
      title: "What changed and why",
      description:
        "Pick a metric and the active rule: the computed explanation with tracking problems and holidays named first, its drivers by platform and plan, the product's other findings, and the walk from the prior period, last year, or plan.",
      program: WHAT_CHANGED,
    },
    {
      title: "Activation",
      description:
        "The funnel from signup to setup, aha, and habit (for users or workspaces) with the 2× validity check, signups and activation by source, the candidate aha moments with the knee, and first-session paths.",
      program: ACTIVATION,
      example: false,
    },
    {
      title: "Retention and lifecycle",
      description:
        "Where retention flattens by plan, weekly cohorts as exact weeks, that week or later, or brackets, for users or workspaces, the daily lifecycle states and where users moved between them, which return rate moves actives most, and the power user curve.",
      program: RETENTION_AND_LIFECYCLE,
    },
    {
      title: "Accounts and revenue",
      description:
        "MRR walk and retention, net revenue retention by start month against its benchmark, then workspaces as the unit: active workspaces, the seat funnel, a list with reasons and health breakdowns, and whether the score predicts cancellations.",
      program: ACCOUNTS_AND_REVENUE,
      example: false,
    },
    {
      title: "Features and experiments",
      description:
        "Experiment scorecards, the feature value matrix, the engagement matrix and adoption, activity by weekday and hour, and top events.",
      program: FEATURES_AND_EXPERIMENTS,
      // Its tools' descriptions say how to feed each component.
      example: false,
    },
    {
      title: "Monetisation",
      description:
        "Free to paid against its benchmark, the product-qualified funnel, Free plan limits by hits and upgrade rate, Business trial outcomes, and AI credit commits with their burn-down.",
      program: MONETISATION,
      example: false,
    },
    {
      title: "Weekly review",
      description:
        "The weekly business review: each metric's last 6 weeks and 12 months against last year and plan with exceptions and owners, the decisions to make, what changed, and running experiments.",
      program: WEEKLY_REVIEW,
      example: false,
    },
    {
      title: "Alert check",
      description:
        "An alert rule back-tested on 30 or 90 days, with N-of-M confirmation and quiet weekends: the metric against its alert line, each alert marked, holidays and tracking changes called out, and every day as clear, below, or alerting.",
      program: ALERT_CHECK,
      example: false,
    },
  ],
  starters: [
    "How healthy is product usage this month against plan, and what changed?",
    "Are new users activating and sticking around? Where does retention flatten?",
    "Which experiments are ready to decide, and which features should we promote?",
    "How are free workspaces converting to paid, and which AI commits are off pace?",
    "When are users most active, which features should we promote or retire, and how are users moving between lifecycle states?",
  ],
};
