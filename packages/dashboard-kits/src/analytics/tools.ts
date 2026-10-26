import { z } from "zod/v4";
import { defineTool } from "../core/kit";
import {
  actionSchema,
  bandSchema,
  cohortRowSchema,
  eventSchema,
  funnelStepSchema,
  goalSchema,
  insightSchema,
  itemSchema,
  kpiOutput,
  rangeSchema,
  seriesSchema,
  trackerItemSchema,
  walkStepSchema,
  whySchema,
} from "../core/schemas";

// Data contract for Relay, a team workspace app (boards, tasks, docs) with
// Free, Team, and Business plans on web, iOS, and Android. Metric names follow
// PostHog, Amplitude, and Mixpanel.

const platform = z
  .enum(["all", "web", "ios", "android"])
  .default("all")
  .describe("Client platform")
  .meta({ filter: "$platform" });
const plan = z
  .enum(["all", "free", "team", "business"])
  .default("all")
  .describe("The workspace's plan")
  .meta({ filter: "$plan" });
const active = z
  .enum(["core", "any"])
  .default("core")
  .describe(
    "What counts as active: a core action (create, edit, comment) or any event, opens included",
  )
  .meta({ filter: "$active" });
const compare = z
  .enum(["previous_period", "last_year", "plan"])
  .default("previous_period")
  .meta({ filter: "$compare" });
const rule = z
  .string()
  .describe('How users were counted, e.g. "Active = core action · rolling 7 days · UTC"');

export const featureSchema = z
  .object({
    name: z.string(),
    breadth: z
      .number()
      .describe("Percent of the period's active users who used the feature, 0–100"),
    frequency: z.number().describe("Average days per week the feature is used, among its users"),
    users: z.number(),
    retentionGap: z
      .number()
      .describe(
        "Week-4 retention of users who used it in their first 14 days minus those who didn't, points",
      ),
    adjustedGap: z.number().describe("The same gap among activated users only, points"),
    change: z
      .number()
      .describe("Change in breadth, in percentage points, against the previous period"),
  })
  .meta({ opaque: "Feature" });

export const trackedEventSchema = z
  .object({
    name: z.string(),
    count: z.number(),
    users: z.number(),
    perUser: z.number(),
    change: z.number().describe("Percent change in count against the previous period"),
  })
  .meta({ opaque: "TrackedEvent" });

export const pathSchema = z
  .object({
    steps: z.array(z.string()).describe("Events in order after the start event"),
    users: z.number(),
    share: z.number().describe("Share of users who started, 0–1"),
    outcome: z.enum(["activated", "in progress", "dropped"]),
  })
  .meta({ opaque: "UserPath" });

export const paywallSchema = z
  .object({
    name: z.string(),
    hits: z.number().describe("Workspaces hitting the limit per week"),
    upgradeRate: z.number().describe("Percent that upgrade within 14 days of hitting it"),
  })
  .meta({ opaque: "Paywall" });

export const commitSchema = z
  .object({
    name: z.string(),
    committed: z.number().describe("AI credits committed for the year"),
    used: z.number(),
    elapsed: z.number().describe("Percent of the term gone"),
    pace: z.number().describe("Used ÷ a straight line's share by now, percent; on track 80–110"),
    projected: z.number().describe("Credits used by renewal at this pace"),
    status: z.enum(["under", "on_track", "over"]),
    renewalInDays: z.number(),
    value: z.number().describe("The commit in dollars"),
    burn: z.array(z.number()).describe("Cumulative credits used by month of the term"),
  })
  .meta({ opaque: "Commit" });

const reviewPanel = z.object({
  labels: z.array(z.string()),
  current: z.array(z.number()),
  yearAgo: z.array(z.number()),
  plan: z.array(z.number()).optional(),
});

export const reviewMetricSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    format: z.enum(["number", "percent", "currency"]),
    value: z.string().describe("The latest whole week"),
    vsPlan: z.string(),
    vsLastYear: z.string(),
    status: z.enum(["ok", "exception"]),
    good: z.boolean().describe("Whether the exception is good news"),
    flag: z.string().describe("Why it is an exception: off plan, or outside its usual range"),
    cause: z.string().describe('A known cause, or "Cause unknown" for the owner to find'),
    owner: z.string(),
    weeks: reviewPanel,
    months: reviewPanel,
  })
  .meta({ opaque: "ReviewMetric" });

export const experimentSchema = z
  .object({
    name: z.string(),
    hypothesis: z.string(),
    metric: z.string(),
    status: z.enum(["running", "won", "lost", "inconclusive"]),
    daysRunning: z.number(),
    variants: z.array(
      z.object({
        name: z.string(),
        users: z.number().describe("Exposed users"),
        conversion: z.number().describe("Metric value for the variant, percent"),
        lift: z.number().optional().describe("Relative lift against control, percent"),
        ciLow: z.number().optional().describe("95% interval of the lift, low, percent"),
        ciHigh: z.number().optional().describe("95% interval of the lift, high, percent"),
        significance: z.number().optional().describe("1 − p-value, 0–1"),
      }),
    ),
    split: z.object({
      observed: z.string(),
      planned: z.string(),
      p: z.number(),
      ok: z.boolean().describe("False is a sample ratio mismatch: don't read the result"),
    }),
    guardrails: z.array(
      z.object({
        name: z.string(),
        change: z.number(),
        ciLow: z.number(),
        ciHigh: z.number(),
        allowed: z
          .number()
          .describe("Worst acceptable change, percent, signed in the bad direction"),
        light: z.enum(["grey", "yellow", "red"]),
      }),
    ),
    tooEarly: z.boolean(),
    ready: z.boolean().describe("7+ full days and traffic split as planned"),
    recommendation: z.enum(["ship", "extend", "discuss", "dont_ship", "fix_split", "done"]),
    decision: z.string(),
  })
  .meta({ opaque: "Experiment" });

export const accountSchema = z
  .object({
    name: z.string(),
    plan: z.enum(["Team", "Business"]),
    seats: z.number(),
    activeSeats: z.number().describe("Seats active in the last 7 days"),
    healthScore: z
      .number()
      .describe("0–100, weighted from engagement, seats, breadth, support, and trend"),
    zone: z.enum(["Healthy", "Watch", "At risk"]),
    change: z.number().describe("Change in health score over 30 days, in points"),
    weekChange: z.number().describe("Change over 7 days; a drop of 15+ means review now"),
    reviewNow: z.boolean(),
    mrr: z.number(),
    arr: z.number(),
    renewalInDays: z.number(),
    lastActiveDays: z.number().describe("Days since anyone in the workspace did a core action"),
    reason: z.string().describe("Why it is on this list, from its own numbers"),
    breakdown: z.array(z.object({ category: z.string(), score: z.number(), weight: z.number() })),
    history: z.array(z.number()).describe("Health score each week, the last 12 weeks"),
  })
  .meta({ opaque: "Account" });

export const analyticsTools = [
  defineTool({
    name: "get_usage_kpis",
    description:
      "Usage KPIs: weekly active users as the hero with events marked, plus DAU, MAU, DAU/MAU, signups, activation, sessions per user, and median session, each with its trend, and how users were counted. Feeds HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric), KpiStrip(kpis.metrics, $metric), and RuleChips(kpis.rules).",
    input: z.object({ range: rangeSchema, platform, plan, active, compare }),
    output: z.object(kpiOutput),
  }),
  defineTool({
    name: "get_monetization",
    description:
      'Free to paid: KPIs, the workspace funnel (new, team active, product-qualified, paying, expanded), Business trial outcomes, Free plan limits by weekly hits and upgrade rate, and free-to-paid for each week of the period against its benchmark band. ConversionFunnel(money.funnel), PaywallMatrix(money.paywalls), BarList(money.trials, "number"), TrendChart(money.labels, [{name: "Free to paid", values: money.freeToPaid}], "percent", "line", [], false, money.band).',
    input: z.object({ range: rangeSchema }),
    output: z.object({
      metrics: kpiOutput.metrics,
      funnel: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      trials: z.array(itemSchema.meta({ opaque: "Item" })),
      paywalls: z.array(paywallSchema),
      labels: z.array(z.string()),
      freeToPaid: z.array(z.number()),
      band: bandSchema,
    }),
  }),
  defineTool({
    name: "get_usage_commits",
    description:
      "Business AI credit commits: pacing KPIs and each commit's use against a straight line through its term, under-pacing first. Feeds CommitPacing(commits.commits).",
    input: z.object({}),
    output: z.object({ metrics: kpiOutput.metrics, commits: z.array(commitSchema) }),
  }),
  defineTool({
    name: "get_weekly_review",
    description:
      "The weekly business review: for weekly actives, signups, activation, DAU/MAU, and MRR, the last 6 weeks and 12 months against last year and plan, with exceptions flagged and a cause or an owner to find it. Feeds WeeklyReview(review.rows).",
    input: z.object({}),
    output: z.object({ period: z.string(), rows: z.array(reviewMetricSchema) }),
  }),
  defineTool({
    name: "get_actions",
    description:
      "What to do next from the data, biggest effect first, with why, estimated effect, owner, and effort. Feeds ActionCards(actions.actions).",
    input: z.object({}),
    output: z.object({ actions: z.array(actionSchema) }),
  }),
  defineTool({
    name: "preview_alert",
    description:
      "Back-tests an alert on the last 30 or 90 days: below when the metric falls more than drop percent under the same weekday's 4-week mean, firing when confirm days of the window are below, optionally holding weekend alerts to Monday. A line TrendChart of actual (primary) and threshold (muted) with alert.events; Tracker(alert.days) for each day.",
    input: z.object({
      metric: z.enum(["dau", "signups", "activation"]).default("dau"),
      drop: z.coerce.number().default(15),
      confirm: z
        .enum(["1of1", "2of3", "3of5"])
        .default("1of1")
        .describe("Fire when N of the last M days are below"),
      quiet: z.enum(["none", "weekends"]).default("none").describe("weekends: hold to Monday"),
      window: z.enum(["30", "90"]).default("90"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      actual: z.array(z.number()),
      threshold: z.array(z.number()),
      format: z.enum(["number", "percent"]),
      events: z.array(eventSchema.meta({ opaque: "ChartEvent" })),
      days: z.array(trackerItemSchema),
      fired: z.number(),
      rule: z.string(),
      summary: z.string(),
    }),
  }),
  defineTool({
    name: "get_annotations",
    description:
      "Launches, holidays, and tracking changes in the period. Pass to TrendChart's events.",
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({ events: z.array(eventSchema.meta({ opaque: "ChartEvent" })) }),
  }),
  defineTool({
    name: "get_data_status",
    description:
      "Whether the numbers can be trusted for the period: data complete through, restated days, filtered bot and internal events, the identified share, and any tracking breaks. Feeds DataStatus(status.items).",
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({
      items: z.array(
        z
          .object({
            label: z.string(),
            value: z.string(),
            tone: z.enum(["good", "warn", "info"]),
            detail: z.string().optional(),
          })
          .meta({ opaque: "StatusItem" }),
      ),
      summary: z.string(),
    }),
  }),
  defineTool({
    name: "get_signup_goal",
    description:
      "Progress toward this month's signup goal: the goal, the running total of signups for each day so far, and a label for every day of the month. Feeds GoalPace(goal) directly.",
    input: z.object({ platform }),
    output: goalSchema,
  }),
  defineTool({
    name: "get_active_users",
    description:
      "Daily active users with rolling 7-day (WAU) and 28-day (MAU) active users: daily for 7d and 30d, weekly averages for 90d, with events to mark and the active rule for the card subtitle.",
    input: z.object({ range: rangeSchema, platform, plan, active }),
    output: z.object({
      labels: z.array(z.string()),
      dau: z.array(z.number()),
      wau: z.array(z.number()),
      mau: z.array(z.number()),
      events: z.array(eventSchema.meta({ opaque: "ChartEvent" })),
      rule,
    }),
  }),
  defineTool({
    name: "get_lifecycle",
    description:
      'Lifecycle. view "weekly": growth accounting with the quick ratio, for LifecycleChart. view "states": the daily states for 28 days (stack them in a ColumnChart; at risk is negative), each state\'s return rate, and the sensitivity: extra daily actives today if that rate had risen 2% for the last 90 days.',
    input: z.object({
      platform,
      plan,
      weeks: z.number().int().min(4).max(16).default(12),
      view: z.enum(["weekly", "states"]).default("weekly"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      newUsers: z.array(z.number()),
      returning: z.array(z.number()).optional(),
      resurrecting: z.array(z.number()).optional(),
      dormant: z
        .union([z.array(z.number()), z.number()])
        .describe(
          "weekly: last week's actives who did not return, as negatives; states: dormant users today",
        ),
      quickRatio: z
        .string()
        .optional()
        .describe("(new + resurrecting) ÷ dormant for the latest week"),
      current: z.array(z.number()).optional(),
      reactivated: z.array(z.number()).optional(),
      resurrected: z.array(z.number()).optional(),
      cameBack: z.array(z.number()).optional().describe("Reactivated + resurrected"),
      atRiskWau: z.array(z.number()).optional().describe("Negative: away 1–6 days"),
      rates: z
        .array(itemSchema.meta({ opaque: "Item" }))
        .optional()
        .describe("Each state's daily return rate, percent"),
      sensitivity: z
        .array(itemSchema)
        .optional()
        .describe("Extra daily actives today if that rate had risen 2% for the last 90 days"),
      flow: z
        .array(
          z
            .object({ from: z.string(), to: z.string(), users: z.number() })
            .meta({ opaque: "LifecycleMove" }),
        )
        .optional()
        .describe("states: LifecycleFlow(states.flow)"),
      rule,
    }),
  }),
  defineTool({
    name: "get_activation_funnel",
    description:
      "Activation for users who signed up in the period: signed up, set up (a workspace and a first project), aha (invited 2+ teammates within 7 days), and habit (active 3 of the next 4 weeks), against the prior period; activation = aha ÷ setup; and the validity check, whether activated users keep at least 2× as well by week 4. Feeds ConversionFunnel(funnel.steps).",
    input: z.object({
      range: rangeSchema,
      platform,
      plan,
      unit: z
        .enum(["user", "workspace"])
        .default("user")
        .describe("Users, or new workspaces (team activation: 3+ members active in 14 days)"),
    }),
    output: z.object({
      steps: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      activationRate: z.string(),
      validity: z.object({
        activated: z.string(),
        notActivated: z.string(),
        ratio: z.number(),
        pass: z.boolean(),
        note: z.string(),
      }),
      platformUsers: z.array(itemSchema.meta({ opaque: "Item" })),
      platformActivation: z.array(itemSchema.meta({ opaque: "Item" })),
      platformRule: z.string().describe("What the platform items count, for the unit"),
    }),
  }),
  defineTool({
    name: "explain_change",
    description:
      "Why a metric moved against the comparison: confidence (Low means within the normal range, so no drivers), a summary that names tracking problems and holidays first, the drivers by platform and plan (rates split into mix and rate), and a walk from the comparison to now. Feeds DriverCards(why) and VarianceWalk(why.walk, why.comparisonLabel, why.format).",
    input: z.object({
      metric: z.enum(["wau", "dau", "signups", "activation", "stickiness"]).default("wau"),
      range: rangeSchema,
      platform,
      plan,
      active,
      compare,
    }),
    output: whySchema,
  }),
  defineTool({
    name: "find_activation_moment",
    description:
      "Find the aha moment: early behaviours (invites, tasks, comments, templates, integrations, mobile), each at the count and window (3, 7, or 14 days) that best tells users still active in week 4 from the rest, ranked by phi, with reach, precision, recall, retention by count, and the knee where more stops helping. Feeds ActivationMoments(moments).",
    input: z.object({ platform, plan }),
    output: z.object({
      cohort: z.string(),
      users: z.number(),
      baseline: z.string().describe("Week-4 retention of the whole cohort"),
      candidates: z.array(
        z
          .object({
            rule: z.string(),
            behaviour: z.string(),
            count: z.number(),
            window: z.number(),
            reach: z.number(),
            precision: z.number().describe("Week-4 retention of those who did it, 0–1"),
            recall: z.number(),
            phi: z.number(),
            retentionByCount: z.array(z.number()).describe("Percent retained, for 1 to 10 times"),
            knee: z.number(),
          })
          .meta({ opaque: "Moment" }),
      ),
      note: z.string(),
    }),
  }),
  defineTool({
    name: "get_retention_cohorts",
    description:
      "Weekly cohorts with the percent active in each following week; the week in progress is hatched. Feeds CohortGrid(cohorts.cohorts, cohorts.periodLabels, cohorts.format).",
    input: z.object({
      platform,
      plan,
      weeks: z.number().int().min(4).max(10).default(8),
      mode: z
        .enum(["exact", "unbounded", "bracket"])
        .default("exact")
        .describe(
          "exact: active in that week; unbounded: that week or later; bracket: weeks 0, 1, 2–3, 4–7",
        ),
      unit: z
        .enum(["user", "workspace"])
        .default("user")
        .describe("Users by signup week, or new workspaces with 3+ members active"),
    }),
    output: z.object({
      periodLabels: z.array(z.string()),
      cohorts: z.array(cohortRowSchema),
      format: z.enum(["percent", "currency"]),
      rule,
    }),
  }),
  defineTool({
    name: "get_retention_curves",
    description:
      'Average weekly retention curves for all and per plan, with curves.flattened saying where each flattened. TrendChart(curves.labels, [{name: "Business", values: curves.business}, {name: "Team", values: curves.team}, {name: "Free", values: curves.free}, {name: "All", values: curves.all, emphasis: "muted"}], "percent", "line").',
    input: z.object({
      platform,
      weeks: z.number().int().min(4).max(12).default(8),
      mode: z
        .enum(["exact", "unbounded", "bracket"])
        .default("exact")
        .describe("As get_retention_cohorts; pass the same mode as the cohorts"),
      unit: z.enum(["user", "workspace"]).default("user"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      all: z.array(z.number()),
      free: z.array(z.number()),
      team: z.array(z.number()),
      business: z.array(z.number()),
      flattened: z.string(),
      rule,
    }),
  }),
  defineTool({
    name: "get_stickiness",
    description:
      "Power user curve: how many active users were active on 1, 2, … N days of the last 7 or 28 days, and the share who are power users. Feeds PowerUserCurve directly.",
    input: z.object({ platform, plan, window: z.union([z.literal(7), z.literal(28)]).default(7) }),
    output: z.object({
      window: z.number(),
      buckets: z.array(z.object({ days: z.number(), users: z.number() })),
      powerUserShare: z.string(),
    }),
  }),
  defineTool({
    name: "get_feature_engagement",
    description:
      "Per feature over the period: breadth (percent of active users), frequency (days per week), change in breadth, and the week-4 retention gap of early users. Feeds EngagementMatrix, FeatureValue, and FeatureAdoption directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({ features: z.array(featureSchema) }),
  }),
  defineTool({
    name: "get_activity_heatmap",
    description: "Average events per hour for each weekday (UTC). Feeds ActivityHeatmap directly.",
    input: z.object({ range: rangeSchema, platform, plan }),
    output: z.object({
      hourLabels: z.array(z.string()),
      days: z.array(z.object({ day: z.string(), values: z.array(z.number()) })),
    }),
  }),
  defineTool({
    name: "get_top_events",
    description:
      "Most frequent tracked events with unique users, events per user, and change. Feeds EventTable(top.events) directly.",
    input: z.object({
      range: rangeSchema,
      platform,
      limit: z.number().int().min(1).max(10).default(8),
    }),
    output: z.object({ events: z.array(trackedEventSchema) }),
  }),
  defineTool({
    name: "get_user_paths",
    description:
      "The most common event sequences in a new user's first session after signup_completed, with how each ended. Feeds UserPaths directly.",
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({ start: z.string(), totalUsers: z.number(), paths: z.array(pathSchema) }),
  }),
  defineTool({
    name: "get_signups_by_source",
    description:
      'Signups by acquisition source with each source\'s week-1 activation rate (percent). items feeds BarList and ShareBar with signups; activation feeds BarList with activation rates (format "percent").',
    input: z.object({ range: rangeSchema, platform }),
    output: z.object({
      labels: z.array(z.string()),
      signups: z.array(z.number()),
      activationRate: z.array(z.number()),
      items: z.array(itemSchema.meta({ opaque: "Item" })),
      activation: z.array(itemSchema.meta({ opaque: "Item" })),
    }),
  }),
  defineTool({
    name: "get_experiments",
    description:
      "A/B tests scored from their counts: lift and 95% interval, the traffic split check, guardrails, and a recommendation. Feeds ExperimentResults directly.",
    input: z.object({ status: z.enum(["all", "running", "completed"]).default("all") }),
    output: z.object({ experiments: z.array(experimentSchema) }),
  }),
  defineTool({
    name: "get_release_impact",
    description:
      "Each launch or rollback's week before against the week after, on its platforms: ReleaseImpact(releases.releases).",
    input: z.object({}),
    output: z.object({
      releases: z.array(
        z
          .object({
            label: z.string(),
            date: z.string(),
            platforms: z.string(),
            detail: z.string(),
            metrics: z.array(
              z.object({
                name: z.string(),
                before: z.string(),
                after: z.string(),
                change: z.number(),
                unit: z.enum(["percent", "points"]),
              }),
            ),
          })
          .meta({ opaque: "Release" }),
      ),
    }),
  }),
  defineTool({
    name: "get_account_health",
    description:
      "Paying workspaces: KPIs (paying workspaces, healthy share, ARR at risk, seat utilization), workspaces with health and why each is listed, the score distribution, and the back-test (churn by score 90 days ago). Lists: risk (lowest health), slipping (no core action for over twice the usual gap), expansion (80%+ of seats active, renewing within 90 days), power, or mrr. Feeds KpiStrip(accounts.metrics) and AccountHealth(accounts.accounts).",
    input: z.object({
      plan: z.enum(["all", "team", "business"]).default("all"),
      list: z.enum(["risk", "slipping", "expansion", "power", "mrr"]).default("risk"),
      limit: z.number().int().min(1).max(10).default(8),
    }),
    output: z.object({
      metrics: kpiOutput.metrics,
      accounts: z.array(accountSchema),
      distribution: z
        .object({
          labels: z.array(z.string()),
          series: z.array(seriesSchema.meta({ opaque: "Series" })),
        })
        .describe("Health score bands by zone, for a stacked ColumnChart"),
      backTest: z
        .array(itemSchema)
        .describe(
          "Percent of workspaces that cancelled in the last 90 days, by health band 90 days ago",
        ),
    }),
  }),
  defineTool({
    name: "get_account_activity",
    description:
      'Workspaces as the unit: weekly active workspaces for the last 12 weeks under an account-active rule (any: 1+ member; team: 3+ members; seats: half the seats), the seat funnel (paid, claimed, active in 28 days), and KPIs. ColumnChart(activity.labels, [{name: "Active workspaces", values: activity.active}], "number"), ConversionFunnel(activity.seats), KpiStrip(activity.metrics).',
    input: z.object({
      plan: z.enum(["all", "team", "business"]).default("all"),
      accountActive: z.enum(["any", "team", "seats"]).default("team"),
    }),
    output: z.object({
      labels: z.array(z.string()),
      active: z.array(z.number()),
      seats: z.array(funnelStepSchema.meta({ opaque: "FunnelStep" })),
      metrics: kpiOutput.metrics,
      rule: z.string(),
    }),
  }),
  defineTool({
    name: "get_revenue_retention",
    description:
      'MRR for 12 whole months: KPIs (MRR, NRR, GRR, quick ratio, ARPA, churn, LTV), the latest month\'s walk, and movements by month (losses negative). VarianceWalk(revenue.walk, revenue.comparisonLabel, "currency"), ColumnChart(revenue.labels, revenue.movements, "currency", true), NRR by start month: CohortGrid(revenue.cohorts, revenue.cohortLabels, "percent", "Workspaces"), and TrendChart(revenue.labels, [{name: "NRR", values: revenue.nrr}], "percent", "line", [], false, revenue.nrrBand).',
    input: z.object({ plan: z.enum(["all", "team", "business"]).default("all") }),
    output: z.object({
      metrics: kpiOutput.metrics,
      walk: z.array(walkStepSchema),
      comparisonLabel: z.string(),
      labels: z.array(z.string()),
      cohorts: z.array(cohortRowSchema),
      cohortLabels: z.array(z.string()),
      nrr: z.array(z.number()).describe("Trailing 12-month NRR at each month's end, percent"),
      nrrBand: bandSchema,
      movements: z
        .array(seriesSchema)
        .describe("MRR movements by month; contraction and churn are negative"),
      note: z.string(),
    }),
  }),
  defineTool({
    name: "get_product_insights",
    description:
      "Notable changes detected across activation, retention, engagement, experiments, and accounts, most important first. Feeds InsightList directly.",
    input: z.object({
      range: rangeSchema,
      platform,
      plan,
      compare,
      excluding: z
        .enum(["wau", "dau", "signups", "activation", "stickiness"])
        .optional()
        .describe("explain_change's metric beside it: leaves out that metric's period change"),
    }),
    output: z.object({ insights: z.array(insightSchema) }),
  }),
];
