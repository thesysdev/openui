import {
  definitionOf as define,
  glossary as glossaryOf,
  type MetricDefinition,
} from "../core/metrics";
import type { Definition } from "../core/schemas";

// Every metric the analytics tools return, defined once (see core/metrics.ts).
// The basis carries the active rule, so every number says how it counted.
// The prompt's glossary keeps the user-level metrics; account metrics carry
// their definitions on each KPI.

const PERIOD = "Selected period, against the period before";
const CORE =
  "Core action (created or edited a task, doc, or board, or commented) · UTC · bots and internal users left out";
const ANY = "Any tracked event, opens and views included · UTC · bots and internal users left out";
const SIGNUPS = "Users who signed up in the period";

export const METRICS = {
  wau: {
    label: "Weekly active users",
    formula: "Users with a core action in the 7 days up to each day, averaged over the period",
    window: PERIOD,
    basis: CORE,
  },
  wau_any: {
    label: "Weekly active users",
    formula: "Users with any event in the 7 days up to each day, averaged over the period",
    window: PERIOD,
    basis: ANY,
    glossary: false,
  },
  dau: {
    label: "Daily active users",
    formula: "Users with a core action on the day, averaged over the period",
    window: PERIOD,
    basis: CORE,
  },
  dau_any: {
    label: "Daily active users",
    formula: "Users with any event on the day, averaged over the period",
    window: PERIOD,
    basis: ANY,
    glossary: false,
  },
  mau: {
    label: "Monthly active users",
    formula: "Users with a core action in the 28 days up to each day, averaged over the period",
    window: PERIOD,
    basis: CORE,
  },
  mau_any: {
    label: "Monthly active users",
    formula: "Users with any event in the 28 days up to each day, averaged over the period",
    window: PERIOD,
    basis: ANY,
    glossary: false,
  },
  stickiness: {
    label: "DAU/MAU",
    formula: "Daily active users ÷ monthly active users (stickiness)",
    window: PERIOD,
    basis: "Same active rule as the actives; SaaS average 15%, good 20%, great 30%",
  },
  signups: {
    label: "New signups",
    formula: "Accounts created",
    window: PERIOD,
    basis: "Web, iOS, and Android; teammates who join by invite count",
    glossary: false,
  },
  activation: {
    label: "Activation",
    formula: "Users who reached the aha moment within 7 days of setup ÷ users who completed setup",
    window: PERIOD,
    basis: `${SIGNUPS}; setup = a workspace and a first project; aha = invited 2 or more teammates`,
  },
  setup_rate: {
    label: "Setup",
    formula: "Users who created a workspace and a first project ÷ signups",
    window: PERIOD,
    basis: SIGNUPS,
    glossary: false,
  },
  sessions_per_user: {
    label: "Sessions per user",
    formula: "Sessions ÷ weekly active users, per week",
    window: PERIOD,
    basis: "A session ends after 30 minutes without an event",
    glossary: false,
  },
  median_session: {
    label: "Median session",
    formula: "Median time from a session's first event to its last",
    window: PERIOD,
    basis: "A session ends after 30 minutes without an event",
    glossary: false,
  },
  quick_ratio: {
    label: "Quick ratio",
    formula: "(New + resurrecting users) ÷ dormant users, for the latest week",
    window: "Latest whole week",
    basis: CORE,
  },
  active_workspaces: {
    label: "Active workspaces",
    formula: "Paying workspaces that meet the account-active rule in the latest week",
    window: "Latest week, against 4 weeks before",
    basis: "Rules: any (1+ member), team (3+ members), or seats (half the seats active)",
    glossary: false,
  },
  team_activation: {
    label: "Team activation",
    formula:
      "New workspaces where 3 or more members did a core action in their first 14 days ÷ new workspaces",
    window: "Last 30 days",
    basis: "Workspaces created in the period",
    glossary: false,
  },
  expansion_ready: {
    label: "Expansion ready",
    formula: "Workspaces with more than 80% of seats active and a renewal within 90 days",
    window: "Today",
    basis: "Our rule",
    glossary: false,
  },
  paying_workspaces: {
    label: "Paying workspaces",
    formula: "Workspaces on the Team or Business plan",
    window: "Today",
    basis: "Billing records",
    glossary: false,
  },
  healthy_share: {
    label: "Healthy",
    formula: "Paying workspaces with a health score of 70 or more ÷ all paying workspaces",
    window: "Today",
    basis: "Health score from engagement, seats, feature breadth, support, and trend",
    glossary: false,
  },
  arr_at_risk: {
    label: "ARR at risk",
    formula:
      "Annual recurring revenue of workspaces scoring under 40, or with active seats down 30% or more on their prior 90 days (each counted once)",
    window: "Today",
    basis: "Our rule",
    goodDirection: "down",
    glossary: false,
  },
  mrr: {
    label: "MRR",
    formula: "Monthly recurring revenue: each paying workspace's seats × price per seat, summed",
    window: "End of the latest whole month, against its start",
    basis: "Billing records; annual plans counted at a twelfth",
    glossary: false,
  },
  arpa: {
    label: "ARPA",
    formula: "MRR ÷ paying workspaces: average revenue per account, monthly",
    window: "End of the latest whole month, against the month before",
    basis: "Billing records; today's paying workspaces",
    glossary: false,
  },
  revenue_churn: {
    label: "Revenue churn",
    formula: "MRR lost to cancellations and seat cuts in the month ÷ MRR at its start",
    window: "The latest whole month, against the month before",
    basis: "Billing records",
    goodDirection: "down",
    glossary: false,
  },
  ltv: {
    label: "Lifetime value",
    formula: "ARPA ÷ monthly revenue churn: revenue a paying workspace brings over its life",
    window: "The latest whole month, against the month before",
    basis: "Billing records; revenue, before costs",
    glossary: false,
  },
  nrr: {
    label: "Net revenue retention",
    formula: "MRR today from workspaces paying 12 months ago ÷ their MRR then",
    window: "Trailing 12 months, against the 12 months to a month before",
    basis: "Billing records",
  },
  grr: {
    label: "Gross revenue retention",
    formula: "Like net revenue retention without expansion, so never above 100%",
    window: "Trailing 12 months, against the 12 months to a month before",
    basis: "Billing records",
    glossary: false,
  },
  revenue_quick_ratio: {
    label: "Revenue quick ratio",
    formula: "(New + expansion + reactivation MRR) ÷ (contraction + churned MRR)",
    window: "Latest whole month, against the month before",
    basis: "Billing records; above 4 is efficient growth",
    glossary: false,
  },
  free_to_paid: {
    label: "Free to paid",
    formula: "New workspaces that start paying within 90 days ÷ new workspaces",
    window: "Workspaces created in the period's 90 days before, against the period before",
    basis: "Freemium self-serve: good 3–5%, great 6–8% (Lenny Rachitsky and Kyle Poyar)",
  },
  pqls: {
    label: "Product-qualified",
    formula: "Workspaces with 3+ active members that hit a Free plan limit",
    window: PERIOD,
    basis: "Our rule",
    glossary: false,
  },
  trial_conversion: {
    label: "Trial to paid",
    formula: "Business trials that converted ÷ Business trials that ended",
    window: PERIOD,
    basis: "14-day trials from Team; free trial: good 8–12%, great 15–25%",
    glossary: false,
  },
  expanded_90d: {
    label: "Expanded in 90 days",
    formula: "New paying workspaces that added seats within 90 days ÷ new paying workspaces",
    window: PERIOD,
    basis: "Billing records",
    glossary: false,
  },
  credit_pacing: {
    label: "Credit pacing",
    formula: "AI credits used ÷ credits a straight line through each commit says by now",
    window: "Each commit's term so far",
    basis: "Business workspaces with an annual AI credit commit; on track 80–110% (our rule)",
    glossary: false,
  },
  commits_under: {
    label: "Under-pacing",
    formula: "Credit commits used at under 80% of a straight line through their term",
    window: "Each commit's term so far",
    basis: "Our rule; unused credits at renewal are value the customer paid for and did not get",
    goodDirection: "down",
    glossary: false,
  },
  commits_over: {
    label: "Over-pacing",
    formula: "Credit commits used at over 110% of a straight line through their term",
    window: "Each commit's term so far",
    basis: "Our rule; an overage or upgrade conversation before renewal",
    goodDirection: "neutral",
    glossary: false,
  },
  seat_utilization: {
    label: "Seat utilization",
    formula: "Seats with a core action in the last 28 days ÷ paid seats",
    window: "Today",
    basis: "Team and Business workspaces",
    glossary: false,
  },
} satisfies Record<string, MetricDefinition>;

export type MetricId = keyof typeof METRICS;

/** The definition a KPI carries, without its label. */
export const definitionOf = (id: MetricId): Definition => define(METRICS[id]);

/** The analytics glossary for the system prompt. */
export const glossary = () => glossaryOf(METRICS);
