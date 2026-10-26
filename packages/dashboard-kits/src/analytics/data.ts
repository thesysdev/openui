import type { z } from "zod/v4";
import {
  confidence,
  contributions,
  mixAndRate,
  periodChangeInsight,
  walk as walkOf,
} from "../core/explain";
import {
  formatChange,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPoints,
} from "../core/format";
import { metricKpis, type MetricDefinition } from "../core/metrics";
import {
  AS_OF,
  between,
  bucket,
  calendarEvents,
  dailySeries,
  dateLabel,
  dayLabels,
  dayOfWeek,
  daysAgoOf,
  mean,
  PAST_WINDOWS,
  periodLabel,
  random,
  RANGE_DAYS,
  round,
  sum,
} from "../core/sample-data";
import type { ChartEvent, Driver, Insight, Item, Range, Why } from "../core/schemas";
import { deliveries, nOfM, runsOf } from "./alerts";
import { CHECKLIST_SHIPPED, dayFactor, iosDuplicates, PRODUCT_EVENTS } from "./calendar";
import { guardrailLight, liftOf, sampleRatio } from "./experiments";
import { METRICS, type MetricId } from "./metrics";
import { knee, MAX_REACH, MIN_REACH, score, tableFor } from "./moments";
import {
  addPopulations,
  cohortRetention,
  simulate,
  type Population,
  type ReturnCurve,
} from "./population";
import {
  addHistories,
  cohortNrr,
  pacing,
  quickRatio,
  retention,
  revenueHistory,
  SEAT_CUTS,
  type RevenueMonth,
} from "./revenue";
import { analyticsTools } from "./tools";
import {
  backTest,
  HEALTH_WEIGHTS,
  healthParts,
  healthScore,
  isAccountActive,
  isArrAtRisk,
  isExpansionReady,
  isSlipping,
  payingWorkspaces,
  workspaces,
  zoneOf,
  type HealthCategory,
} from "./workspaces";

// Relay: a demo team workspace app. One simulated population per platform and
// plan (see population.ts) drives every count of users, so daily, weekly, and
// monthly actives, lifecycle, activation, and retention agree by construction.

type Tools = typeof analyticsTools;
type Input<N extends Tools[number]["name"]> = z.output<
  Extract<Tools[number], { name: N }>["input"]
>;
type Platform = "web" | "ios" | "android";
type Plan = "free" | "team" | "business";
type Active = "core" | "any";
type Compare = Input<"get_usage_kpis">["compare"];

/**
 * Days simulated: 12 months and the same 12 months a year earlier for the
 * weekly review, and room for 28-day windows and cohorts.
 */
const HISTORY = 770;
/** Sessions a user starts on a day they are active (our rule). */
const SESSIONS_PER_ACTIVE_DAY = 1.6;
/** Sessions are only kept for 90 days, so they compare with the prior period whatever $compare says. */
const PRIOR_ONLY = "Against the prior period: sessions are kept 90 days";
/** This year's plan against the same weekdays last year (our numbers for Relay). */
const USAGE_PLAN = { actives: 1.22, signups: 1.15, activation: 30 };
/** Same weekdays 52 weeks earlier. */
const LAST_YEAR = 364;
/** What each comparison is called on charts, walks, and why-cards. */
const COMPARISON_LABEL: Record<Compare, string> = {
  previous_period: "Prior period",
  last_year: "Last year",
  plan: "Plan",
};
/** The comparison in a period label; the prior period goes unsaid. */
const AGAINST_TEXT: Record<Compare, string | undefined> = {
  previous_period: undefined,
  last_year: "same days last year",
  plan: "plan",
};
const SIGNUPS_PER_DAY = 520;

/**
 * Per platform and plan: share of signups, activation and retention
 * multipliers, median session in minutes, and the share of extra users who
 * only open and view (counted on any event, not on a core action).
 */
const PLATFORMS: Record<
  Platform,
  { signups: number; activation: number; retention: number; session: number; passive: number }
> = {
  web: { signups: 0.7, activation: 1.06, retention: 1, session: 7.7, passive: 0.12 },
  ios: { signups: 0.18, activation: 0.92, retention: 0.9, session: 3.4, passive: 0.22 },
  android: { signups: 0.12, activation: 0.74, retention: 0.74, session: 3.1, passive: 0.25 },
};
const PLANS: Record<
  Plan,
  { signups: number; activation: number; retention: number; label: string }
> = {
  free: { signups: 0.78, activation: 0.84, retention: 0.66, label: "Free" },
  team: { signups: 0.17, activation: 1.38, retention: 1.32, label: "Team" },
  business: { signups: 0.05, activation: 1.62, retention: 1.6, label: "Business" },
};

const PLATFORM_LABEL: Record<Platform, string> = { web: "Web", ios: "iOS", android: "Android" };

const platformsFor = (p: string) =>
  p === "all" ? (Object.keys(PLATFORMS) as Platform[]) : [p as Platform];
const plansFor = (p: string) => (p === "all" ? (Object.keys(PLANS) as Plan[]) : [p as Plan]);
const segments = (platform: string, plan: string) =>
  platformsFor(platform).flatMap((pf) => plansFor(plan).map((pl) => [pf, pl] as const));

/** Days ago for each simulated day, oldest first. */
const agoAt = (t: number) => HISTORY - 1 - t;

/** Share of a segment's signups who complete setup: a workspace and a first project. */
const setupShare = (pf: Platform, pl: Plan) =>
  Math.min(0.95, 0.72 * (PLATFORMS[pf].activation * PLANS[pl].activation) ** 0.2);
/**
 * Share of a segment's signups who reach the aha moment (invited 2 or more
 * teammates within 7 days); the onboarding checklist v2 lifted it 10%.
 */
const ahaShare = (pf: Platform, pl: Plan, ago: number) =>
  Math.min(
    0.85,
    0.2 * PLATFORMS[pf].activation * PLANS[pl].activation * (ago < CHECKLIST_SHIPPED ? 1.1 : 1),
  );

/** How often each group comes back, by engagement (platform × plan retention). */
function curves(pf: Platform, pl: Plan): { activated: ReturnCurve; notActivated: ReturnCurve } {
  const e = PLATFORMS[pf].retention * PLANS[pl].retention;
  return {
    activated: {
      yesterday: Math.min(0.95, 0.55 * e ** 0.3),
      decay: Math.min(0.97, 0.9 * e ** 0.05),
      floor: 0.003,
    },
    notActivated: { yesterday: Math.min(0.9, 0.22 * e ** 0.3), decay: 0.86, floor: 0.006 },
  };
}

const segmentSignups = (pf: Platform, pl: Plan) =>
  dailySeries(
    `signups:${pf}:${pl}`,
    HISTORY,
    SIGNUPS_PER_DAY * PLATFORMS[pf].signups * PLANS[pl].signups,
    {
      weekend: 0.55,
      growth: 0.18,
      noise: 0.2,
    },
  );
const DAY_FACTOR = Array.from({ length: HISTORY }, (_, t) => dayFactor(agoAt(t)));

/** A what-if: return chances by band (current, reactivated, resurrected) and activation, as multipliers. */
type Boost = { bands: [number, number, number]; activation: number };
/** A what-if starts this many days ago: the lifecycle card's "in 90 days". */
const BOOST_DAYS = 90;
const NO_BOOST: Boost = { bands: [1, 1, 1], activation: 1 };

const segmentCache = new Map<string, Population>();
function segmentPopulation(pf: Platform, pl: Plan, boost: Boost = NO_BOOST): Population {
  const key = `${pf}:${pl}:${boost.bands.join(",")}:${boost.activation}`;
  const cached = segmentCache.get(key);
  if (cached) return cached;
  const signups = segmentSignups(pf, pl);
  const { activated, notActivated } = curves(pf, pl);
  // A boost applies only over the last BOOST_DAYS days; before then the
  // population is the plain one (with no boost, the same either way).
  const from = HISTORY - BOOST_DAYS;
  const pop = simulate({
    signups,
    // The aha share is of all signups, as the population splits arrivals.
    activation: signups.map((_, t) =>
      Math.min(0.95, ahaShare(pf, pl, agoAt(t)) * (t >= from ? boost.activation : 1)),
    ),
    activated: { ...activated, bands: boost.bands },
    notActivated: { ...notActivated, bands: boost.bands },
    dayFactor: DAY_FACTOR,
    flowDays: 28,
    bandsFrom: from,
  });
  segmentCache.set(key, pop);
  return pop;
}

const populationCache = new Map<string, Population>();
/** The population for a platform and plan filter: its segments added together. */
function population(platform: string, plan: string): Population {
  const key = `${platform}:${plan}`;
  const cached = populationCache.get(key);
  if (cached) return cached;
  const pop = addPopulations(segments(platform, plan).map(([pf, pl]) => segmentPopulation(pf, pl)));
  populationCache.set(key, pop);
  return pop;
}

/** A field's values for `days` days ending `offset` days ago, oldest first. */
const take = (values: Float64Array, days: number, offset = 0) =>
  Array.from(values.subarray(HISTORY - offset - days, HISTORY - offset));

/** Distinct users a duplicate-event day adds to a window of this many days, per ghost user-day. */
const GHOST_OVERLAP: Record<number, number> = { 1: 1, 7: 0.6, 28: 0.45 };

/**
 * Users active on a core action, or on any event, in the 1, 7, or 28 days up
 * to each day. Any event adds the users who only open and view, and on the
 * days the iOS SDK sent duplicate app opens, iOS users who never came back.
 */
function actives(
  window: 1 | 7 | 28,
  platform: string,
  plan: string,
  active: Active,
  days: number,
  offset = 0,
): number[] {
  const field = window === 1 ? "dau" : window === 7 ? "wau" : "mau";
  if (active === "core") return take(population(platform, plan)[field], days, offset);
  const out = new Array(days).fill(0);
  for (const pf of platformsFor(platform)) {
    const pop = population(pf, plan);
    const core = take(pop[field], days, offset);
    // Ghost users: a third of iOS's dormant and at-risk users, on bug days.
    const ghostDays = take(pop.atRiskMau, days + window - 1, offset).map((v, k) =>
      pf === "ios" && iosDuplicates(offset + days + window - 2 - k) ? v * 0.35 : 0,
    );
    for (let i = 0; i < days; i++) {
      const ghosts = sum(ghostDays.slice(i, i + window)) * GHOST_OVERLAP[window]!;
      out[i] += core[i]! * (1 + PLATFORMS[pf].passive) + ghosts;
    }
  }
  return out;
}

const dau = (platform: string, plan: string, days: number, offset = 0) =>
  actives(1, platform, plan, "core", days, offset);
const signups = (platform: string, plan: string, days: number, offset = 0) =>
  take(population(platform, plan).signups, days, offset);

/** Monthly active users as a multiple of daily actives, over the last 28 days. */
const mauRatio = (platform: string, plan: string) =>
  mean(take(population(platform, plan).mau, 28)) / mean(dau(platform, plan, 28));

/** A per-platform and per-plan multiplier, weighted by signups. */
function factor(platform: string, plan: string, key: "activation" | "retention") {
  const segs = segments(platform, plan);
  const weights = segs.map(([pf, pl]) => PLATFORMS[pf].signups * PLANS[pl].signups);
  const values = segs.map(([pf, pl]) => PLATFORMS[pf][key] * PLANS[pl][key]);
  return sum(values.map((v, i) => v * weights[i]!)) / sum(weights);
}

/**
 * Setup, aha, and habit for signups over `days` days ending `offset` days ago.
 * Activation is aha ÷ setup; habit (a core action in 3 of the 4 weeks after
 * the aha moment) is 68% of those who reach aha (our model).
 */
function activationCounts(platform: string, plan: string, days: number, offset = 0) {
  let signed = 0;
  let setup = 0;
  let aha = 0;
  for (const [pf, pl] of segments(platform, plan)) {
    const daily = take(segmentPopulation(pf, pl).signups, days, offset);
    daily.forEach((n, i) => {
      const ago = offset + days - 1 - i;
      signed += n;
      setup += n * setupShare(pf, pl);
      aha += n * ahaShare(pf, pl, ago);
    });
  }
  return { signed, setup, aha, habit: aha * 0.68, rate: aha / (setup || 1) };
}

/** Activation (aha ÷ setup) for signups around a day: the 7 days ending then. */
const activationRate = (platform: string, plan: string, ago: number) =>
  activationCounts(platform, plan, 7, ago).rate;

/**
 * A weekly signup cohort's retention, week by week since signup, for the
 * platform and plan filter: each segment's cohort simulated from its signup
 * days to today, then added up by size.
 */
function cohort(platform: string, plan: string, startAgo: number) {
  const parts = segments(platform, plan).map(([pf, pl]) => {
    const all = segmentSignups(pf, pl);
    const start = HISTORY - 1 - startAgo;
    const retention = cohortRetention({
      signups: all.slice(start, start + 7),
      activation: all.slice(start, start + 7).map((_, d) => ahaShare(pf, pl, startAgo - d)),
      ...curves(pf, pl),
      dayFactor: DAY_FACTOR.slice(start),
    });
    return retention;
  });
  const size = sum(parts.map((p) => p.size));
  const unbounded = Array.from(
    { length: parts[0]!.unbounded.length },
    (_, w) => sum(parts.map((p) => p.unbounded[w]! * p.size)) / (size || 1),
  );
  const weeks = parts[0]!.all.length;
  const avg = (
    pick: (p: (typeof parts)[number]) => number[],
    weight: (p: (typeof parts)[number]) => number,
  ) =>
    Array.from(
      { length: weeks },
      (_, w) => sum(parts.map((p) => pick(p)[w]! * weight(p))) / (sum(parts.map(weight)) || 1),
    );
  const partials = parts.filter((p) => p.partial != null);
  return {
    size,
    unbounded,
    bracket: (from: number, to: number) =>
      sum(parts.map((p) => p.bracket(from, to) * p.size)) / (size || 1),
    ...(partials.length
      ? { partial: sum(partials.map((p) => p.partial! * p.size)) / (size || 1) }
      : {}),
    all: avg(
      (p) => p.all,
      (p) => p.size,
    ),
    activated: avg(
      (p) => p.activated,
      (p) => p.size,
    ),
    notActivated: avg(
      (p) => p.notActivated,
      (p) => p.size,
    ),
  };
}

/** Bracket retention's columns: week 0, week 1, weeks 2–3, weeks 4–7. */
const BRACKETS: [number, number][] = [
  [0, 0],
  [1, 1],
  [2, 3],
  [4, 7],
];
/** About 55% of signups who complete setup start a workspace rather than join one. */
const NEW_WORKSPACE_SHARE = 0.72 * 0.55;
const TEAM_SIZE = 5;
/**
 * One signup week's retention, 0–1, by week (or bracket) since it started, and
 * the week in progress so far for exact weeks. A workspace counts when 3+ of
 * its 5 members are active; a member is 80% as likely to be active as an
 * activated user (invitees engage less); members act independently within a
 * week; workspaces that miss a week come back later at the rate users do; and
 * only workspaces that reach a team count at all, so week 0 is team
 * activation (our rules).
 */
function retentionRow(
  platform: string,
  plan: string,
  startAgo: number,
  mode: "exact" | "unbounded" | "bracket",
  unit: "user" | "workspace",
  brackets = mode === "bracket" ? BRACKETS : undefined,
) {
  const c = cohort(platform, plan, startAgo);
  const users =
    brackets?.flatMap(([from, to]) => (to < c.all.length ? [c.bracket(from, to)] : [])) ??
    (mode === "unbounded" ? c.unbounded : c.all);
  const exactPartial = mode === "exact" && !brackets ? c.partial : undefined;
  if (unit === "user") return { size: c.size, values: users, partial: exactPartial };
  const memberChance = (w: number) => Math.min(1, (c.activated[w] ?? 0) * 0.8);
  const counts = activationCounts(platform, plan, 7, Math.max(0, startAgo - 6));
  const reach = teamReach(counts) / teamActive(memberChance(0));
  const exactTeam = (w: number) => reach * teamActive(memberChance(w));
  // Only workspaces that ever reached a team can come back as one.
  const reach0 = exactTeam(0);
  const comeback = (later: number, w: number) =>
    c.all[w]! < 1 ? (later - c.all[w]!) / (1 - c.all[w]!) : 0;
  const values = brackets
    ? users.map((v, k) => {
        const from = brackets[k]![0];
        return exactTeam(from) + (reach0 - exactTeam(from)) * comeback(v, from);
      })
    : mode === "unbounded"
      ? // Active in week w or later includes everyone active in week w + 1 or later.
        users
          .map((v, w) => exactTeam(w) + (reach0 - exactTeam(w)) * comeback(v, w))
          .reduceRight<number[]>((acc, v) => [Math.max(v, acc[0] ?? 0), ...acc], [])
      : users.map((_, w) => exactTeam(w));
  const last = c.all.length - 1;
  return {
    size: c.size * NEW_WORKSPACE_SHARE,
    values,
    partial:
      exactPartial == null
        ? undefined
        : reach * teamActive(memberChance(last) * (exactPartial / (c.all[last] || 1))),
  };
}

const retentionRule = (mode: "exact" | "unbounded" | "bracket", unit: "user" | "workspace") => {
  const what = {
    exact: "active in the week",
    unbounded: "active that week or any later one",
    bracket: "active at least once in the bracket",
  }[mode];
  return unit === "workspace"
    ? `Workspaces with 3+ members ${what} · new workspaces by week created`
    : ruleFor("core", what);
};

/** A curve has flattened when it falls under 1 point a week over its last 3 weeks (our rule). */
export function flattening(curve: number[]): string {
  const n = curve.length;
  if (n < 4) return "too young to tell";
  const drop = (curve[n - 4]! - curve[n - 1]!) / 3;
  if (drop >= 1) return `still falling ${drop.toFixed(1)} pts a week`;
  let from = n - 1;
  while (from > 1 && curve[from - 1]! - curve[from]! < 1) from--;
  return `flattened at ${Math.round(curve[n - 1]!)}% from week ${from}`;
}

/** Months of MRR history: a year of retention needs two, and the weekly review a third. */
const REVENUE_MONTHS = 36;
/** Monthly MRR movements for the plans, oldest first, ending on today's workspace MRR. */
const mrrHistory = (plans: readonly ("team" | "business")[]) =>
  addHistories(
    plans.map((p) =>
      revenueHistory(
        p,
        sum(
          payingWorkspaces()
            .filter((w) => w.plan.toLowerCase() === p)
            .map((w) => w.mrr),
        ),
        REVENUE_MONTHS,
      ),
    ),
  );
/** What a new paying workspace starts on: about 7 Team seats at $20. */
const NEW_WORKSPACE_MRR = 150;
/** MRR plan against the same month last year. */
const MRR_PLAN = 1.5;
/** Bottom-up SaaS net revenue retention: good about 100%, great about 120%. */
const NRR_BAND = {
  label: "Bottom-up SaaS: good 100%, great 120% (Lenny Rachitsky)",
  from: 100,
  to: 120,
};

/** Team activation: new workspaces with 3+ members active in 14 days (our model of it). */
const teamReach = (c: { aha: number; signed: number }) => Math.min(0.8, (c.aha / c.signed) * 1.45);
/** Chance at least 3 of a 5-member team are active, each with chance p. */
function teamActive(p: number) {
  let atLeast = 0;
  for (let k = 3; k <= TEAM_SIZE; k++) {
    const ways = [1, 5, 10, 10, 5, 1][k]!;
    atLeast += ways * p ** k * (1 - p) ** (TEAM_SIZE - k);
  }
  return atLeast;
}

/** Percent active in each week since signup for the cohort that signed up `weeks + 1` weeks ago. */
const retentionCurve = (platform: string, plan: string, weeks: number) =>
  cohort(platform, plan, (weeks + 1) * 7 - 1)
    .all.slice(0, weeks + 1)
    .map((v) => round(v * 100, 1));

// ── Activation moments ──────────────────────────────────────────────────────

/**
 * Early behaviours a new user might do, as the chance of doing one at least
 * `k` times within `w` days of signup, for users who reach the aha moment and
 * for the rest. The aha moment itself (2+ invites in 7 days) is in the list,
 * so the search has a right answer to find.
 */
const BEHAVIOURS: {
  id: string;
  rule: (k: number, w: number) => string;
  did: (k: number, w: number) => { activated: number; rest: number };
}[] = [
  {
    id: "invites",
    rule: (k, w) => `Invited ${k}+ teammate${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => {
      const late = w === 3 ? 0.7 : 1;
      const more = 0.55 ** Math.max(0, k - 2);
      return {
        activated: k <= 2 ? late : late * more,
        rest:
          k === 1 ? (w === 3 ? 0.18 : w === 7 ? 0.3 : 0.38) : w === 14 ? 0.08 * 0.4 ** (k - 2) : 0,
      };
    },
  },
  {
    id: "tasks",
    rule: (k, w) => `Created ${k}+ tasks in ${w} days`,
    did: (k, w) => ({
      activated: Math.exp(-(k - 1) / ((12 * w) / 7)),
      rest: 0.85 * Math.exp(-(k - 1) / ((4 * w) / 7)),
    }),
  },
  {
    id: "comments",
    rule: (k, w) => `Commented ${k}+ times in ${w} days`,
    did: (k, w) => ({
      activated: 0.9 * Math.exp(-(k - 1) / ((5 * w) / 7)),
      rest: 0.5 * Math.exp(-(k - 1) / ((1.5 * w) / 7)),
    }),
  },
  {
    id: "templates",
    rule: (k, w) => `Used ${k}+ template${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: 0.45 * (w / 7) ** 0.3 * 0.3 ** (k - 1),
      rest: 0.35 * (w / 7) ** 0.3 * 0.3 ** (k - 1),
    }),
  },
  {
    id: "integrations",
    rule: (k, w) => `Connected ${k}+ integration${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: 0.12 * (w / 7) ** 0.5 * 0.2 ** (k - 1),
      rest: 0.02 * (w / 7) ** 0.5 * 0.2 ** (k - 1),
    }),
  },
  {
    id: "mobile",
    rule: (k, w) => `Opened the mobile app on ${k}+ day${k === 1 ? "" : "s"} in ${w} days`,
    did: (k, w) => ({
      activated: Math.min(1, 0.5 * (w / 7) ** 0.4) * 0.7 ** (k - 1),
      rest: Math.min(1, 0.3 * (w / 7) ** 0.4) * 0.6 ** (k - 1),
    }),
  },
];
const WINDOWS = [3, 7, 14];
const COUNTS = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * Scores every behaviour × count × window on the users who signed up 5 to 9
 * weeks ago (old enough for week 4), keeps each behaviour's best count and
 * window, and returns the five that best tell retained users apart.
 */
function activationMoments(platform: string, plan: string) {
  const startAgo = 9 * 7 - 1;
  const counts = activationCounts(platform, plan, 28, 5 * 7);
  const n = counts.signed;
  const share = counts.aha / counts.signed;
  const check = cohort(platform, plan, 5 * 7 - 1);
  const retained = { activated: check.activated[4]!, rest: check.notActivated[4]! };
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const candidates = BEHAVIOURS.flatMap((b) =>
    WINDOWS.map((w) => {
      const scored = COUNTS.map((k) => {
        const did = b.did(k, w);
        const table = tableFor(
          n,
          share,
          { activated: clamp(did.activated), rest: clamp(did.rest) },
          retained,
        );
        return { k, ...score(table) };
      });
      const byCount = scored.map((s) => s.precision);
      const usable = scored.filter((s) => s.reach >= MIN_REACH && s.reach <= MAX_REACH);
      const best = usable.sort((x, y) => y.phi - x.phi)[0];
      return (
        best && {
          behaviour: b.id,
          rule: b.rule(best.k, w),
          count: best.k,
          window: w,
          ...best,
          byCount,
        }
      );
    }),
  ).filter((c): c is NonNullable<typeof c> => !!c);
  // One per behaviour, at its best window, so the list compares behaviours.
  const top = [...candidates]
    .sort((x, y) => y.phi - x.phi)
    .filter((c, i, all) => all.findIndex((x) => x.behaviour === c.behaviour) === i)
    .slice(0, 5);
  const baseline = share * retained.activated + (1 - share) * retained.rest;
  return {
    cohort: `${formatNumber(n)} users who signed up ${dateLabel(startAgo)} – ${dateLabel(5 * 7)}`,
    users: Math.round(n),
    baseline: `${(baseline * 100).toFixed(0)}%`,
    candidates: top.map((c) => ({
      rule: c.rule,
      behaviour: c.behaviour,
      count: c.count,
      window: c.window,
      reach: round(c.reach, 3),
      precision: round(c.precision, 3),
      recall: round(c.recall, 3),
      phi: round(c.phi, 3),
      retentionByCount: c.byCount.map((v) => round(v * 100, 1)),
      knee: knee(c.byCount),
    })),
    note: "Correlation, not cause: confirm the moment with an experiment before building onboarding around it.",
  };
}

/**
 * Weekly health for the last 12 weeks, a straight line between the known
 * scores (weeks ago, score), oldest known first.
 */
function scoreHistory(known: [number, number][]): number[] {
  return Array.from({ length: 12 }, (_, k) => {
    const weeksAgo = 11 - k;
    const after = known.findIndex(([at]) => at <= weeksAgo);
    const [a, b] = after <= 0 ? [known[0]!, known[1]!] : [known[after - 1]!, known[after]!];
    return Math.round(a[1] + ((b[1] - a[1]) * (a[0] - weeksAgo)) / (a[0] - b[0] || 1));
  });
}

// ── Experiments ─────────────────────────────────────────────────────────────

interface ExperimentSpec {
  name: string;
  hypothesis: string;
  metric: string;
  daysRunning: number;
  /** Finished experiments carry what was done. */
  done?: { status: "won" | "lost"; decision: string };
  planned: number[];
  arms: { name: string; users: number; conversions: number }[];
  guardrails: {
    name: string;
    lift: number;
    low: number;
    high: number;
    allowed: number;
    higherIsBad: boolean;
  }[];
}

const EXPERIMENTS: ExperimentSpec[] = [
  {
    name: "Onboarding checklist v2",
    hypothesis: "A four-step checklist that ends with inviting a teammate raises activation.",
    metric: "Activation: aha within 7 days of setup",
    daysRunning: 28,
    done: { status: "won", decision: "Shipped to everyone on Sep 22." },
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 12410, conversions: 3872 },
      { name: "Checklist v2", users: 12388, conversions: 4286 },
    ],
    guardrails: [
      {
        name: "Week-2 retention",
        lift: 0.012,
        low: -0.004,
        high: 0.028,
        allowed: 0.01,
        higherIsBad: false,
      },
      {
        name: "Support tickets per 1K users",
        lift: -0.03,
        low: -0.09,
        high: 0.03,
        allowed: 0.05,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Mobile quick-capture widget",
    hypothesis: "A home-screen widget for adding tasks makes mobile users return more often.",
    metric: "Mobile weekly active rate",
    daysRunning: 21,
    done: {
      status: "lost",
      decision: "Rolled back: widget users added tasks but opened the app less.",
    },
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 6020, conversions: 3148 },
      { name: "Widget", users: 5987, conversions: 2999 },
    ],
    guardrails: [
      {
        name: "App crash rate",
        lift: 0.01,
        low: -0.04,
        high: 0.06,
        allowed: 0.1,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "AI summaries on by default",
    hypothesis:
      "Showing AI summaries without opt-in, with or without a daily digest email, improves week-2 retention.",
    metric: "Week-2 retention",
    daysRunning: 24,
    planned: [1 / 3, 1 / 3, 1 / 3],
    arms: [
      { name: "Control", users: 9104, conversions: 3733 },
      { name: "On by default", users: 9087, conversions: 3671 },
      { name: "On + digest email", users: 9122, conversions: 3840 },
    ],
    guardrails: [
      {
        name: "Email unsubscribes (digest arm)",
        lift: 0.18,
        low: 0.05,
        high: 0.31,
        allowed: 0.1,
        higherIsBad: true,
      },
      {
        name: "AI cost per active user",
        lift: 0.06,
        low: 0.03,
        high: 0.09,
        allowed: 0.15,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Annual plan as default on upgrade",
    hypothesis:
      "Preselecting annual billing on the upgrade page raises paid conversion without hurting it.",
    metric: "Upgrade to paid within 14 days",
    daysRunning: 12,
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 4120, conversions: 128 },
      { name: "Annual default", users: 4096, conversions: 136 },
    ],
    guardrails: [
      {
        name: "Refund requests",
        lift: 0.04,
        low: -0.2,
        high: 0.28,
        allowed: 0.25,
        higherIsBad: true,
      },
    ],
  },
  {
    name: "Pricing page redesign",
    hypothesis: "A simpler pricing page with a plan comparison table lifts trial starts.",
    metric: "Trial started from the pricing page",
    daysRunning: 9,
    planned: [0.5, 0.5],
    arms: [
      { name: "Control", users: 10840, conversions: 477 },
      { name: "Redesign", users: 10008, conversions: 490 },
    ],
    guardrails: [
      {
        name: "Page load, 75th percentile",
        lift: 0.02,
        low: -0.01,
        high: 0.05,
        allowed: 0.1,
        higherIsBad: true,
      },
    ],
  },
];

/**
 * An experiment's scorecard, all from its counts: each arm's rate, lift, and
 * interval; whether traffic split as planned; guardrail lights; whether it is
 * too early or ready to decide; and a recommendation (our rule): fix the
 * split first, ship a clear winner with green guardrails, don't ship a clear
 * loser, extend when unclear and under two weeks, otherwise discuss.
 */
function scorecard(e: ExperimentSpec) {
  const [control, ...treatments] = e.arms;
  const lifts = treatments.map((t) => liftOf(control!, t));
  const srm = sampleRatio(
    e.arms.map((a) => a.users),
    e.planned,
  );
  const total = sum(e.arms.map((a) => a.users));
  const guardrails = e.guardrails.map((g) => ({
    name: g.name,
    change: round(g.lift * 100, 1),
    ciLow: round(g.low * 100, 1),
    ciHigh: round(g.high * 100, 1),
    // Signed in the bad direction: −1% for a metric that should not fall.
    allowed: round((g.higherIsBad ? 1 : -1) * g.allowed * 100, 1),
    light: guardrailLight(g, g.allowed, g.higherIsBad),
  }));
  const best = lifts.reduce((a, b) => (b.lift > a.lift ? b : a));
  const significant = best.p < 0.05;
  const red = guardrails.some((g) => g.light === "red");
  const recommendation = e.done
    ? ("done" as const)
    : !srm.ok
      ? ("fix_split" as const)
      : significant && best.low > 0 && !red
        ? ("ship" as const)
        : significant && best.high < 0
          ? ("dont_ship" as const)
          : red
            ? ("discuss" as const)
            : e.daysRunning < 14
              ? ("extend" as const)
              : ("discuss" as const);
  const split = e.arms.map((a) => Math.round((a.users / total) * 100)).join("/");
  const decision = {
    done: e.done?.decision ?? "",
    fix_split: `Don't read this yet: traffic split ${split} against a planned ${e.planned.map((p) => Math.round(p * 100)).join("/")} (p < 0.001). Check how users are assigned.`,
    ship: "Ship it: a clear lift with every guardrail inside its limit.",
    dont_ship: "Don't ship: a clear drop.",
    discuss: red
      ? `Discuss before shipping: ${guardrails.find((g) => g.light === "red")!.name} is past its limit.`
      : "Discuss: no clear winner after two weeks.",
    extend: `Keep running: no clear result after ${e.daysRunning} days.`,
  }[recommendation];
  return {
    name: e.name,
    hypothesis: e.hypothesis,
    metric: e.metric,
    status: e.done
      ? e.done.status
      : significant && best.lift > 0 && !red && srm.ok
        ? ("won" as const)
        : ("running" as const),
    daysRunning: e.daysRunning,
    variants: e.arms.map((a, k) => {
      const l = k === 0 ? undefined : lifts[k - 1]!;
      return {
        name: a.name,
        users: a.users,
        conversion: round((a.conversions / a.users) * 100, 2),
        ...(l
          ? {
              lift: round(l.lift * 100, 1),
              ciLow: round(l.low * 100, 1),
              ciHigh: round(l.high * 100, 1),
              significance: round(1 - l.p, 3),
            }
          : {}),
      };
    }),
    split: {
      observed: split,
      planned: e.planned.map((p) => Math.round(p * 100)).join("/"),
      p: round(srm.p, 4),
      ok: srm.ok,
    },
    guardrails,
    tooEarly: e.daysRunning < 1,
    ready: e.daysRunning >= 7 && srm.ok,
    recommendation,
    decision,
  };
}

// ── Actions and alerts ──────────────────────────────────────────────────────

/**
 * What to do next, from the data, biggest expected effect first. Effects are
 * estimates with their assumption in the text: a save rate for outreach, a
 * take rate for upgrade offers, the observed retention gap for a feature.
 */
function recommendedActions() {
  const list = payingWorkspaces();
  const slipping = list.filter(isSlipping);
  const slippingArr = sum(slipping.map((w) => w.mrr * 12));
  const ready = list.filter(isExpansionReady);
  const extraSeats = sum(ready.map((w) => Math.ceil(w.seats * 0.2)));
  const seatPrice = (w: (typeof list)[number]) => w.mrr / w.seats;
  const expansionArr = sum(ready.map((w) => Math.ceil(w.seats * 0.2) * seatPrice(w) * 12)) * 0.3;
  const features = analyticsHandlers.get_feature_engagement!({
    range: "30d",
    platform: "all",
    plan: "all",
  }) as { features: { name: string; breadth: number; adjustedGap: number; users: number }[] };
  const automations = features.features.find((f) => f.name === "Automations")!;
  const signed = activationCounts("all", "all", 30).signed;
  // A tenth of a month's signups more trying it, if its gap among activated users holds.
  const kept = signed * 0.1 * (automations.adjustedGap / 100);
  const pricing = scorecard(EXPERIMENTS.find((e) => e.name === "Pricing page redesign")!);
  const digest = scorecard(EXPERIMENTS.find((e) => e.name === "AI summaries on by default")!);
  const unsubscribes = digest.guardrails.find((g) => g.light === "red");
  // Android users who set up in the last 14 days but have not reached the aha moment.
  const android = activationCounts("android", "all", 14);
  const stuck = Math.round(android.setup - android.aha);
  const androidRate = (android.aha / android.setup) * 100;
  const webCounts = activationCounts("web", "all", 14);
  const webRate = (webCounts.aha / webCounts.setup) * 100;
  const gained = android.setup * (30 / 14) * ((webRate - androidRate) / 100) * 0.5;
  const actions = [
    {
      id: "android-audience",
      kind: "audience" as const,
      title: `Save ${formatNumber(stuck)} Android users stuck before the aha moment as a flag audience`,
      detail: `They set up in the last 14 days but have not invited 2 teammates. Android activates ${androidRate.toFixed(0)}% of users who set up, against ${webRate.toFixed(0)}% on web. The audience lets Growth target an invite prompt at them.`,
      // Ranked as ARR: a fifth of the extra activated users end up on a $20 seat.
      impact: gained * 0.2 * 20 * 12,
      impactText: `About ${formatNumber(gained)} more Android users activated a month if the prompt closes half the gap to web`,
      owner: "Growth",
      effort: "Low",
      effect: `Would save the flag audience android-setup-no-aha (${formatNumber(stuck)} users, refreshed daily)`,
    },
    {
      id: "save-slipping",
      kind: "task" as const,
      title: `Reach out to the admins of ${slipping.length} slipping workspaces`,
      detail: `No core action for over twice their usual gap; together ${formatCurrency(slippingArr)} ARR. Customer success calls the largest ten, the rest get the re-engagement email.`,
      impact: slippingArr * 0.2,
      impactText: `${formatCurrency(slippingArr * 0.2)} ARR kept if one in five stays`,
      owner: "Customer success",
      effort: "Medium",
      effect: `Would open ${slipping.length} customer success tasks, largest ARR first`,
    },
    {
      id: "offer-seats",
      kind: "task" as const,
      title: `Offer seat upgrades to ${ready.length} workspaces ready to expand`,
      detail: `Over 80% of their seats are active and they renew within 90 days. A 20% seat bump is ${formatNumber(extraSeats)} seats.`,
      impact: expansionArr,
      impactText: `${formatCurrency(expansionArr)} new ARR if three in ten accept`,
      owner: "Account management",
      effort: "Low",
      effect: `Would open ${ready.length} expansion tasks for account managers`,
    },
    {
      id: "promote-automations",
      kind: "experiment" as const,
      title: "Start an experiment: suggest an automation in onboarding",
      detail: `Automations reach ${automations.breadth.toFixed(0)}% of monthly users, but activated users who try one early are ${automations.adjustedGap.toFixed(0)} points likelier to be around in week 4. A gap, not proof: run it as an experiment.`,
      // Ranked as ARR: about a fifth of kept users end up on a $20 seat.
      impact: kept * 0.2 * 20 * 12,
      impactText: `About ${formatNumber(kept)} more users kept a month, if the gap holds`,
      owner: "Growth",
      effort: "Medium",
      effect:
        "Would draft the experiment Automation suggestion in onboarding: 50/50 on new signups, week-4 retention as the metric, support tickets as the guardrail",
    },
    ...(unsubscribes
      ? [
          {
            id: "hold-digest",
            kind: "change" as const,
            title: "Drop the digest email arm of the AI summaries test",
            detail: `${unsubscribes.name} rose ${unsubscribes.change}% against a ${unsubscribes.allowed}% limit, and the arm's retention lift is not clear yet.`,
            impact: 0,
            impactText: "Protects the email list while the test finishes",
            owner: "Product",
            effort: "Low",
            effect:
              "Would stop new users entering the digest email arm; the other arms keep running",
          },
        ]
      : []),
    ...(!pricing.split.ok
      ? [
          {
            id: "fix-pricing-split",
            kind: "change" as const,
            title: "Pause the Pricing page redesign and check assignment",
            detail: `Traffic split ${pricing.split.observed} against a planned ${pricing.split.planned}, so its lift can't be trusted. Restart once assignment is fixed.`,
            impact: 0,
            impactText: "Avoids a decision on broken data",
            owner: "Data",
            effort: "Low",
            effect:
              "Would pause the Pricing page redesign and open a Data task to check assignment",
          },
        ]
      : []),
  ];
  return actions.sort((a, b) => b.impact - a.impact);
}

export const ALERT_METRICS = {
  dau: { label: "Daily active users", format: "number" as const },
  signups: { label: "New signups", format: "number" as const },
  activation: { label: "Activation", format: "percent" as const },
};

/**
 * An alert back-tested on the last 30 or 90 days: each day against its usual
 * level, the mean of the same weekday over the 4 weeks before (our rule),
 * below when it falls more than `drop` percent under it. The rule is on when
 * `need` of the last `of` days were below, consecutive days on are one alert,
 * and with quiet weekends an alert starting at the weekend waits for Monday
 * (alerts.ts). Holidays and tracking changes are called out so a noisy rule is
 * easy to spot.
 */
function alertPreview(
  metric: keyof typeof ALERT_METRICS,
  drop: number,
  confirm: "1of1" | "2of3" | "3of5",
  quiet: boolean,
  days: number,
) {
  const span = days + 28;
  const values =
    metric === "dau"
      ? dau("all", "all", span)
      : metric === "signups"
        ? signups("all", "all", span)
        : Array.from({ length: span }, (_, i) => activationRate("all", "all", span - 1 - i) * 100);
  const actual = values.slice(28);
  const usual = actual.map((_, i) => mean([1, 2, 3, 4].map((w) => values[28 + i - 7 * w]!)));
  const line = usual.map((u) => u * (1 - drop / 100));
  const labels = dayLabels(days);
  const below = actual.map((v, i) => v < line[i]!);
  const [need, of] = { "1of1": [1, 1], "2of3": [2, 3], "3of5": [3, 5] }[confirm];
  const sent = deliveries(runsOf(nOfM(below, need!, of!)), (i) => dayOfWeek(days - 1 - i), quiet);
  const { label, format } = ALERT_METRICS[metric];
  const digits = format === "percent" ? 1 : 0;
  // A holiday or data problem that overlaps the alert, and could move this metric.
  const causeOf = ([first, last]: [number, number]) =>
    PRODUCT_EVENTS.find(
      (e) =>
        e.kind !== "launch" &&
        !e.anyEventOnly &&
        days - 1 - last <= e.from &&
        days - 1 - first >= e.to,
    );
  const events = sent.map(({ run, day, held }) => {
    const [first, last] = run;
    let worst = first;
    for (let i = first; i <= last; i++)
      if (actual[i]! / usual[i]! < actual[worst]! / usual[worst]!) worst = i;
    const why = causeOf(run);
    const when = held
      ? day < days
        ? ` · held to Monday ${labels[day]}`
        : " · held to Monday"
      : "";
    return {
      label: last > first ? `Alert · ${last - first + 1} days` : "Alert",
      start: labels[first]!,
      end: labels[last]!,
      detail: `${label} lowest on ${labels[worst]}: ${round(actual[worst]!, digits)} against a usual ${round(usual[worst]!, digits)}${why ? ` · ${why.label}` : ""}${when}`,
      kind:
        why?.kind === "holiday" || why?.kind === "measurement" ? why.kind : ("incident" as const),
    };
  });
  const noisy = events.filter((e) => e.kind !== "incident").length;
  const held = sent.filter((d) => d.held).length;
  const times = (n: number) => (n === 1 ? "once" : `${n} times`);
  const causes = [
    ...new Set(sent.flatMap(({ run }) => (causeOf(run) ? [causeOf(run)!.label] : []))),
  ];
  const daysBelow = below.filter(Boolean).length;
  // Each back-test day for a Tracker: alerting (confirmed), below but not confirmed, or clear.
  const fmt = (v: number) => (format === "percent" ? `${v.toFixed(1)}%` : formatNumber(v));
  const alerting = nOfM(below, need!, of!);
  const days_ = labels.map((day, i) => ({
    label: day,
    status: alerting[i] ? ("bad" as const) : below[i] ? ("warn" as const) : ("good" as const),
    value: `${fmt(actual[i]!)} against a usual ${fmt(usual[i]!)}`,
    detail: alerting[i] ? "Alerting" : below[i] ? "Below the line, not confirmed" : "Clear",
  }));
  const rule = `Fires ${of === 1 ? "on any day" : `when ${need} of ${of} days are`} more than ${drop}% under the same weekday's usual${quiet ? "; weekend alerts wait for Monday" : ""}`;
  return {
    labels,
    actual: actual.map((v) => round(v, digits)),
    threshold: line.map((v) => round(v, digits)),
    format,
    events,
    days: days_,
    fired: sent.length,
    rule,
    summary: sent.length
      ? `Would have fired ${times(sent.length)} in ${days} days (${daysBelow} days below the line)${held ? `, ${held} held to Monday` : ""}.${noisy ? ` ${noisy === events.length ? (events.length === 1 ? "It came" : "All came") : `${noisy} came`} during ${causes.join(" and ")}, not a real drop.` : ""}${sent.length > days / 15 ? " Too noisy: confirm over more days or raise the drop." : ""}`
      : `Would not have fired in ${days} days${daysBelow ? ` (${daysBelow} days below the line, never enough to confirm)` : ""}. A smaller drop catches more.`,
  };
}

// ── Monetisation and usage commits ──────────────────────────────────────────

/**
 * Free plan limits: weekly hits and the share of workspaces that upgrade
 * within 14 days of hitting one. Automations converts best but few reach it;
 * version history and AI summaries annoy many and convert few.
 */
const PAYWALLS = [
  { name: "Members: 5 on Free", hits: 1940, rate: 3.1 },
  { name: "AI summaries: 20 a month", hits: 1510, rate: 1.1 },
  { name: "Version history: 7 days", hits: 1260, rate: 0.6 },
  { name: "Timeline view", hits: 880, rate: 2.6 },
  { name: "Integrations: 2 apps", hits: 640, rate: 1.4 },
  { name: "Automations: 3 rules", hits: 410, rate: 4.8 },
  { name: "Guest access", hits: 230, rate: 3.4 },
  { name: "Storage: 2 GB", hits: 150, rate: 0.9 },
  { name: "Dashboards", hits: 120, rate: 1.7 },
];
/** Of team-active workspaces, the share that hit a Free limit (product-qualified), then the shares that pay and expand. */
const MONETISATION = { pql: 0.55, paidOfPql: 0.28, expandedOfPaid: 0.21 };
/** Business trials: the share of new paying workspaces that start one, extend it, and convert once it ends. */
const TRIALS = { startShare: 0.35, extendShare: 0.07, conversion: 0.15 };
const TRIAL_DAYS = 14;
const FREE_TO_PAID_BAND = {
  label: "Freemium self-serve: good 3–5%, great 6–8% (Lenny Rachitsky, Kyle Poyar)",
  from: 3,
  to: 8,
};

function monetisation(range: Range) {
  const days = RANGE_DAYS[range];
  // Each window's own conversion varies a little, as real weeks do.
  const funnelFor = (offset: number, span = days) => {
    const counts = activationCounts("all", "all", span, offset);
    const created = counts.setup * 0.55;
    const team = created * teamReach(counts);
    const pql = team * MONETISATION.pql;
    const paid = pql * MONETISATION.paidOfPql * between(`paid:${offset}:${span}`, 0.93, 1.07);
    const expanded =
      paid * MONETISATION.expandedOfPaid * between(`expanded:${offset}:${span}`, 0.92, 1.08);
    return { created, team, pql, paid, expanded };
  };
  // Business trials: a share of new paying Team workspaces start one, for 14
  // days. Trials that reached day 14 within the window (started 14 days
  // earlier) either extend or end converted or expired; those started in the
  // 14 days to the window's end are still running (our rules). Measuring
  // outcomes by when trials end keeps every count real for a 7-day window.
  const trialsFor = (offset: number, span = days) => {
    const due = funnelFor(offset + TRIAL_DAYS, span).paid * TRIALS.startShare;
    const trialing = funnelFor(offset, TRIAL_DAYS).paid * TRIALS.startShare;
    const extended = due * TRIALS.extendShare;
    const ended = due - extended;
    const converted = ended * TRIALS.conversion * between(`trial:${offset}:${span}`, 0.9, 1.1);
    return { due, trialing, extended, converted, expired: ended - converted, ended };
  };
  const now = funnelFor(0);
  const then = funnelFor(days);
  const trials = trialsFor(0);
  // The weeks covering the period (at least 4, so there is a trend), each a
  // 28-day window ending that week.
  const count = Math.max(4, Math.ceil(days / 7));
  const weeks = Array.from({ length: count }, (_, k) => (count - 1 - k) * 7);
  // Free to paid for workspaces created in the 28 days before each week's 90-day wait.
  const freeToPaidAt = (ago: number) => {
    const f = funnelFor(ago + 90, 28);
    return (f.paid / f.created) * 100;
  };
  const freeToPaid = weeks.map(freeToPaidAt);
  const steps = [
    { label: "New workspaces", value: now.created, previous: then.created },
    { label: "Team active: 3+ members", value: now.team, previous: then.team },
    { label: "Product-qualified: hit a Free limit", value: now.pql, previous: then.pql },
    { label: "Paying within 90 days", value: now.paid, previous: then.paid },
    { label: "Expanded within 90 days", value: now.expanded, previous: then.expanded },
  ].map((s) => ({ ...s, value: Math.round(s.value), previous: Math.round(s.previous) }));
  const pct = (v: number) => `${v.toFixed(1)}%`;
  const trialRate = (t: ReturnType<typeof trialsFor>) => (t.converted / t.ended) * 100;
  return {
    metrics: [
      metric("free_to_paid", freeToPaid[count - 1]!, freeToPaidAt(Math.round(days / 7) * 7), pct, {
        series: freeToPaid,
        hint: FREE_TO_PAID_BAND.label,
      }),
      metric("pqls", now.pql, then.pql, formatNumber, {
        series: weeks.map((ago) => funnelFor(ago, 28).pql),
      }),
      metric("trial_conversion", trialRate(trials), trialRate(trialsFor(days)), pct, {
        series: weeks.map((ago) => trialRate(trialsFor(ago, 28))),
        hint: "Free trial: good 8–12%, great 15–25%",
      }),
      metric(
        "expanded_90d",
        (now.expanded / now.paid) * 100,
        (then.expanded / then.paid) * 100,
        pct,
        {
          series: weeks.map((ago) => {
            const f = funnelFor(ago, 28);
            return (f.expanded / f.paid) * 100;
          }),
        },
      ),
    ],
    funnel: steps,
    trials: [
      { name: "Converted", value: Math.round(trials.converted) },
      { name: "Expired", value: Math.round(trials.expired) },
      { name: "Still in trial", value: Math.round(trials.trialing) },
      { name: "Extended", value: Math.round(trials.extended) },
    ],
    paywalls: PAYWALLS.map((p) => ({
      name: p.name,
      hits: Math.round(p.hits * between(`pw:${p.name}:${range}`, 0.94, 1.06)),
      upgradeRate: round(p.rate * between(`pr:${p.name}:${range}`, 0.95, 1.05), 1),
    })),
    labels: weeks.map((ago) => dateLabel(ago + 6)),
    freeToPaid: freeToPaid.map((v) => round(v, 2)),
    band: FREE_TO_PAID_BAND,
  };
}

/** Credits a seat commits to a year, and what a credit costs. */
const CREDITS_PER_SEAT = 1_000;
const CREDIT_PRICE = 0.02;

/** Every Business workspace's AI credit commit, built once. */
let commitCache: ReturnType<typeof buildCommits> | undefined;
const allCommits = () => (commitCache ??= buildCommits());

function usageCommits() {
  const commits = allCommits().filter((c) => c.elapsed >= 8);
  return commitSummary(commits);
}

function buildCommits() {
  // About two thirds of Business workspaces commit to AI credits; the named ones all do.
  const business = payingWorkspaces().filter(
    (w) =>
      w.plan === "Business" &&
      (w.id.startsWith("named") || between(`commit:${w.name}`, 0, 1) < 0.66),
  );
  const shares = business.map((w) => w.active28 / w.seats).sort((a, b) => a - b);
  const typical = shares[Math.floor(shares.length / 2)]!;
  const commits = business.map((w) => {
    const committed = w.seats * CREDITS_PER_SEAT;
    const elapsed = (365 - w.renewalInDays) / 365;
    // AI use follows how much of the workspace is active against a typical
    // Business workspace, with its own noise.
    const pace =
      // Credit use strays half as far from typical as seat activity does.
      Math.max(0.3, Math.min(1.7, 0.5 + 0.5 * (w.active28 / w.seats / typical))) *
      between(`credits:${w.name}`, 0.9, 1.1) *
      (w.name === "Brightline Health" ? 0.62 : 1);
    const used = committed * elapsed * pace;
    const p = pacing(used, committed, elapsed);
    // A month ago the workspace ran at a slightly different pace.
    const paceBefore = pace * between(`credits-before:${w.name}`, 0.92, 1.08);
    const elapsedBefore = Math.max(0, elapsed - 30 / 365);
    const before = pacing(committed * elapsedBefore * paceBefore, committed, elapsedBefore);
    const months = Math.max(1, Math.round(elapsed * 12));
    // Use bends toward the recent pace: steeper lately if it sped up.
    const bend = pace / paceBefore;
    return {
      name: w.name,
      committed: Math.round(committed),
      used: Math.round(used),
      elapsed: round(elapsed * 100, 0),
      pace: round(p.pace * 100, 0),
      projected: Math.round(p.projected),
      status: p.status,
      renewalInDays: w.renewalInDays,
      value: Math.round(committed * CREDIT_PRICE),
      burn: Array.from({ length: months }, (_, m) => Math.round(used * ((m + 1) / months) ** bend)),
      statusBefore: before.status,
      expectedBefore: committed * elapsedBefore,
      usedBefore: committed * elapsedBefore * paceBefore,
    };
  });
  return commits;
}

function commitSummary(commits: ReturnType<typeof buildCommits>) {
  const under = commits.filter((c) => c.status === "under");
  const over = commits.filter((c) => c.status === "over");
  const unused = (c: (typeof commits)[number]) =>
    Math.max(0, c.committed - c.projected) * CREDIT_PRICE;
  const extra = (c: (typeof commits)[number]) =>
    Math.max(0, c.projected - c.committed) * CREDIT_PRICE;
  const shelfware = sum(under.map(unused));
  const overage = sum(over.map(extra));
  const totalUsed = sum(commits.map((c) => c.used));
  const expected = sum(commits.map((c) => (c.committed * c.elapsed) / 100));
  const paceBefore =
    (sum(commits.map((c) => c.usedBefore)) / sum(commits.map((c) => c.expectedBefore))) * 100;
  const countBefore = (status: string) => commits.filter((c) => c.statusBefore === status).length;
  return {
    metrics: [
      metric("credit_pacing", (totalUsed / expected) * 100, paceBefore, (v) => `${v.toFixed(0)}%`, {
        hint: `${commits.length} Business commits`,
      }),
      metric("commits_under", under.length, countBefore("under"), formatNumber, {
        hint: `${formatCurrency(shelfware)} of credits likely unused at renewal`,
      }),
      metric("commits_over", over.length, countBefore("over"), formatNumber, {
        hint: `${formatCurrency(overage)} of overage or upgrade by renewal`,
      }),
    ],
    // Under-pacing renewing soonest first, two weeks out or more so customer
    // success can still help,
    // then the largest overages (an upgrade conversation), then the largest on track.
    commits: [
      ...under
        .filter((c) => c.renewalInDays >= 14)
        .sort((a, b) => a.renewalInDays - b.renewalInDays)
        .slice(0, 6),
      ...[...over].sort((a, b) => extra(b) - extra(a)).slice(0, 3),
      ...commits
        .filter((c) => c.status === "on_track")
        .sort((a, b) => b.value - a.value)
        .slice(0, 3),
    ].map(({ statusBefore: _s, expectedBefore: _e, usedBefore: _u, ...c }) => c),
  };
}

// ── Weekly review (6-12) ────────────────────────────────────────────────────

interface ReviewMetric {
  key: "wau" | "signups" | "activation" | "stickiness" | "mrr";
  label: string;
  format: "number" | "percent" | "currency";
  owner: string;
  /** Plan against last year: a multiple, or a fixed value for rates. */
  plan?: { times?: number; value?: number };
  /** The value for days `from` to `to` ago (inclusive), as a week or month reads it. */
  over: (from: number, to: number) => number;
  /** A plan miss this large flags an exception: percent, or points for rates. */
  tolerance: number;
}

/** MRR on a day, read between month ends. */
function mrrOn(history: RevenueMonth[], ago: number) {
  // history's last month is September 2026; month m ends on its last day.
  const lastIndex = history.length - 1;
  for (let k = lastIndex; k >= 0; k--) {
    const monthsBack = lastIndex - k;
    const start = daysAgoOf(2026, 9 - monthsBack, 1);
    const end = daysAgoOf(2026, 10 - monthsBack, 0);
    if (ago <= start && ago >= end) {
      const m = history[k]!;
      const progress = (start - ago + 1) / (start - end + 1);
      return m.start + (m.end - m.start) * progress;
    }
  }
  // After the last whole month: carry September's end forward.
  return history[lastIndex]!.end;
}

function reviewMetrics(): ReviewMetric[] {
  const pop = population("all", "all");
  const at = (values: Float64Array, ago: number) => values[HISTORY - 1 - ago]!;
  const span = (from: number, to: number) =>
    Array.from({ length: from - to + 1 }, (_, i) => from - i);
  const history = mrrHistory(["team", "business"]);
  return [
    {
      key: "wau",
      label: "Weekly active users",
      format: "number",
      owner: "Product",
      plan: { times: USAGE_PLAN.actives },
      over: (from, to) => mean(span(from, to).map((d) => at(pop.wau, d))),
      tolerance: 5,
    },
    {
      key: "signups",
      label: "New signups",
      format: "number",
      owner: "Growth",
      plan: { times: USAGE_PLAN.signups },
      over: (from, to) => sum(span(from, to).map((d) => at(pop.signups, d))),
      tolerance: 4,
    },
    {
      key: "activation",
      label: "Activation",
      format: "percent",
      owner: "Growth",
      plan: { value: USAGE_PLAN.activation },
      over: (from, to) => activationCounts("all", "all", from - to + 1, to).rate * 100,
      tolerance: 2,
    },
    {
      key: "stickiness",
      label: "DAU/MAU",
      format: "percent",
      owner: "Product",
      // Average DAU ÷ average MAU, as the KPI tile and explain_change read it.
      over: (from, to) =>
        (mean(span(from, to).map((d) => at(pop.dau, d))) /
          mean(span(from, to).map((d) => at(pop.mau, d)))) *
        100,
      tolerance: 2,
    },
    {
      key: "mrr",
      label: "MRR",
      format: "currency",
      owner: "Finance",
      plan: { times: MRR_PLAN },
      over: (_from, to) => mrrOn(history, to),
      tolerance: 3,
    },
  ];
}

function weeklyReview() {
  // The last 6 whole weeks, Monday to Sunday, and the last 12 whole months.
  const lastSunday = ((dayOfWeek(0) + 6) % 7) + 1;
  const weeks = Array.from({ length: 6 }, (_, k) => {
    const to = lastSunday + (5 - k) * 7;
    return { from: to + 6, to, label: dateLabel(to + 6) };
  });
  const months = Array.from({ length: 12 }, (_, k) => {
    const back = 11 - k;
    const from = daysAgoOf(2026, 9 - back, 1);
    const to = daysAgoOf(2026, 10 - back, 0);
    const label = new Date(Date.UTC(2026, 8 - back, 1)).toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    return { from, to, label };
  });
  const latestWeek = weeks[5]!;
  const pct = (a: number, b: number) => ((a - b) / Math.abs(b || 1)) * 100;
  return {
    period: `Week of ${latestWeek.label}, against plan and the same week last year`,
    rows: reviewMetrics().map((m) => {
      const read = (spans: { from: number; to: number }[], back = 0) =>
        spans.map((p) => m.over(p.from + back, p.to + back));
      const panel = (spans: { from: number; to: number; label: string }[]) => {
        const current = read(spans);
        const yearAgo = read(spans, LAST_YEAR);
        const plan = m.plan
          ? m.plan.value != null
            ? spans.map(() => m.plan!.value!)
            : yearAgo.map((v) => v * m.plan!.times!)
          : undefined;
        const digits = m.format === "percent" ? 2 : 0;
        const r = (values: number[]) => values.map((v) => round(v, digits));
        return {
          labels: spans.map((p) => p.label),
          current: r(current),
          yearAgo: r(yearAgo),
          ...(plan ? { plan: r(plan) } : {}),
        };
      };
      const w = panel(weeks);
      const latest = w.current[5]!;
      const planned = w.plan?.[5];
      const lastYear = w.yearAgo[5]!;
      const rate = m.format === "percent";
      // Off plan by more than the metric's tolerance, or outside its usual
      // range: the mean ± 2 SD of the 8 weeks before (our rules).
      const before = Array.from({ length: 8 }, (_, k) => {
        const to = latestWeek.to + (k + 1) * 7;
        return m.over(to + 6, to);
      });
      const avg = mean(before);
      const sd = Math.sqrt(mean(before.map((v) => (v - avg) ** 2)));
      const miss = planned == null ? 0 : rate ? latest - planned : pct(latest, planned);
      const offPlan = planned != null && Math.abs(miss) > m.tolerance;
      const unusual = Math.abs(latest - avg) > 2 * sd && sd > 0;
      const fmt = (v: number) =>
        m.format === "currency"
          ? formatCurrency(v)
          : m.format === "percent"
            ? `${v.toFixed(1)}%`
            : formatNumber(v);
      const cause = reviewCause(m.key, latestWeek);
      return {
        key: m.key,
        label: m.label,
        format: m.format,
        value: fmt(latest),
        vsPlan:
          planned == null
            ? "No plan"
            : rate
              ? `${formatPoints(latest - planned)} vs plan`
              : `${formatChange(pct(latest, planned))} vs plan`,
        vsLastYear: rate
          ? `${formatPoints(latest - lastYear)} vs last year`
          : `${formatChange(pct(latest, lastYear))} vs last year`,
        status: offPlan || unusual ? ("exception" as const) : ("ok" as const),
        // Every review metric is better higher: ahead of plan or above its range is good news.
        good: offPlan ? miss > 0 : latest > avg,
        flag: offPlan
          ? `${rate ? `${Math.abs(miss).toFixed(1)} pts` : `${Math.abs(miss).toFixed(1)}%`} ${miss < 0 ? "behind" : "ahead of"} plan`
          : unusual
            ? `Outside its usual range (${fmt(avg - 2 * sd)}–${fmt(avg + 2 * sd)})`
            : "",
        cause: offPlan || unusual ? (cause ?? "Cause unknown") : "",
        owner: m.owner,
        weeks: w,
        months: panel(months),
      };
    }),
  };
}

/**
 * A known cause for a metric's latest week, matched to what can move it:
 * holidays and data problems move activity; the onboarding launch moves
 * activation (in the 2 weeks before the week too, as a launch takes a while
 * to show); nothing on the calendar moves signups; September's seat cuts
 * moved MRR.
 */
function reviewCause(key: ReviewMetric["key"], week: { from: number; to: number }) {
  if (key === "mrr") return "Business workspaces cut seats at renewal in September";
  if (key === "signups") return undefined;
  const kinds = key === "activation" ? ["launch"] : ["holiday", "measurement"];
  const lead = key === "activation" ? 14 : 0;
  const event = PRODUCT_EVENTS.find(
    (e) =>
      kinds.includes(e.kind) &&
      !e.anyEventOnly &&
      !e.platforms &&
      week.to <= e.from &&
      week.from + lead >= e.to,
  );
  return event ? `${event.label}: ${event.detail}` : undefined;
}

// ── Why: explain_change ────────────────────────────────────────────────────

type WhyMetric = Input<"explain_change">["metric"];
const WHY_LABEL: Record<WhyMetric, string> = {
  wau: "Weekly active users",
  dau: "Daily active users",
  signups: "New signups",
  activation: "Activation",
  stickiness: "DAU/MAU",
};
const isRate = (m: WhyMetric) => m === "activation" || m === "stickiness";

/** The metric over `days` days ending `offset` days ago: actives averaged, signups summed, rates as percents. */
function whyValue(
  metric: WhyMetric,
  platform: string,
  plan: string,
  active: Active,
  days: number,
  offset: number,
) {
  if (metric === "signups") return sum(signups(platform, plan, days, offset));
  if (metric === "activation") return activationCounts(platform, plan, days, offset).rate * 100;
  if (metric === "stickiness")
    return (
      (mean(actives(1, platform, plan, active, days, offset)) /
        mean(actives(28, platform, plan, active, days, offset))) *
      100
    );
  return mean(actives(metric === "wau" ? 7 : 1, platform, plan, active, days, offset));
}

/** Users counted only because the iOS SDK sent duplicate events, averaged over the window. */
function ghostUsers(
  metric: "wau" | "dau",
  platform: string,
  plan: string,
  days: number,
  offset: number,
) {
  const window = metric === "wau" ? 7 : 1;
  const withGhosts = actives(window, platform, plan, "any", days, offset);
  const without = platformsFor(platform).map((pf) =>
    take(population(pf, plan)[metric], days, offset).map((v) => v * (1 + PLATFORMS[pf].passive)),
  );
  return mean(withGhosts.map((v, i) => v - sum(without.map((w) => w[i]!))));
}

/**
 * Activation counts as new workspaces: about 55% of signups who set up start a
 * new workspace (the rest join one); team activation is 3+ members active in
 * its first 14 days.
 */
function workspaceCounts(c: ReturnType<typeof activationCounts>) {
  const created = c.setup * 0.55;
  const project = created * 0.88;
  const active = created * Math.min(0.8, (c.aha / c.signed) * 1.45);
  return {
    signed: created,
    setup: project,
    aha: active,
    habit: active * 0.74,
    rate: active / created,
  };
}

/**
 * Every platform side by side, whatever the platform filter, against the
 * period before. Users: its share of daily actives over the period, and
 * activation for its signups. Workspaces: its share of new workspaces, by the
 * platform they were created on, and their team activation.
 */
function byPlatform(plan: string, days: number, unit: "user" | "workspace" = "user") {
  const pfs = Object.keys(PLATFORMS) as Platform[];
  const counts = (pf: Platform, o: number) =>
    unit === "workspace"
      ? workspaceCounts(activationCounts(pf, plan, days, o))
      : activationCounts(pf, plan, days, o);
  const users = pfs.map((pf) =>
    [0, days].map((o) =>
      unit === "workspace" ? counts(pf, o).signed : mean(dau(pf, plan, days, o)),
    ),
  );
  const total = sum(users.map(([now]) => now!)) || 1;
  const change = (now: number, then: number) => round(((now - then) / (then || 1)) * 100, 1);
  return {
    platformRule:
      unit === "workspace"
        ? "Each platform's share of new workspaces, by where they were created, and their team activation, against the prior period"
        : "Each platform's share of daily actives, and activation for its signups, against the prior period",
    platformUsers: pfs.map((pf, k) => ({
      name: PLATFORM_LABEL[pf],
      key: pf,
      value: Math.round(users[k]![0]!),
      share: round(users[k]![0]! / total, 4),
      change: change(users[k]![0]!, users[k]![1]!),
    })),
    platformActivation: pfs.map((pf) => {
      const [now, then] = [0, days].map((o) => counts(pf, o).rate * 100);
      return {
        name: PLATFORM_LABEL[pf],
        key: pf,
        value: round(now!, 1),
        change: change(now!, then!),
      };
    }),
  };
}

/**
 * How many workspaces score in each band of 10, stacked by zone so each
 * column carries its zone's status color (under 40 at risk, 40–69 watch).
 */
function healthDistribution(scores: number[]) {
  const counts = Array.from(
    { length: 10 },
    (_, b) => scores.filter((s) => Math.min(9, Math.floor(s / 10)) === b).length,
  );
  const zone = (lo: number, hi: number) => counts.map((c, b) => (b >= lo && b < hi ? c : 0));
  return {
    labels: counts.map((_, b) => (b === 9 ? "90–100" : `${b * 10}–${b * 10 + 9}`)),
    series: [
      { name: "At risk", values: zone(0, 4), tone: "bad" as const },
      { name: "Watch", values: zone(4, 7), tone: "warn" as const },
      { name: "Healthy", values: zone(7, 10), tone: "good" as const },
    ],
  };
}

/** A plan's paying workspaces, their average MRR, and the MRR a new one starts on. */
function workspaceSizes(p: "team" | "business") {
  const inPlan = payingWorkspaces().filter((w) => w.plan.toLowerCase() === p);
  const average = sum(inPlan.map((w) => w.mrr)) / Math.max(1, inPlan.length);
  return { inPlan, average, newSize: p === "team" ? NEW_WORKSPACE_MRR : average };
}

/** New paying workspaces in each of the last `months` whole months, oldest first, plan by plan. */
function newWorkspacesByMonth(plans: readonly ("team" | "business")[], months: number): number[] {
  const out = new Array<number>(months).fill(0);
  for (const p of plans) {
    const { newSize } = workspaceSizes(p);
    mrrHistory([p])
      .slice(-months)
      .forEach((m, k) => (out[k] += m.new / newSize));
  }
  return out.map(Math.round);
}

/**
 * Paying workspaces at the end of each of the last `months` whole months,
 * oldest first: today's count walked back month by month, less each month's
 * new workspaces and plus its cancellations, plan by plan. New Team
 * workspaces start small; new and cancelled Business ones are the size of a
 * typical Business account.
 */
function payingByMonth(plans: readonly ("team" | "business")[], months: number): number[] {
  const out = new Array<number>(months).fill(0);
  for (const p of plans) {
    const { inPlan, average, newSize } = workspaceSizes(p);
    const history = mrrHistory([p]).slice(-months);
    let count = inPlan.length;
    for (let k = months - 1; k >= 0; k--) {
      out[k] += count;
      count += history[k]!.churn / average - history[k]!.new / newSize;
    }
  }
  return out.map(Math.round);
}

/**
 * ARPA, monthly revenue churn, and lifetime value (ARPA ÷ churn) for the
 * latest whole month against the one before, each month's MRR over that
 * month's paying workspaces.
 */
function unitEconomics(
  plans: readonly ("team" | "business")[],
  last: RevenueMonth,
  before: RevenueMonth,
  year: RevenueMonth[],
) {
  const counts = payingByMonth(plans, year.length);
  const countOf = (m: RevenueMonth) => counts[year.indexOf(m)] ?? counts.at(-1)!;
  const churn = (m: RevenueMonth) => (m.churn + m.contraction) / (m.start || 1);
  const arpa = (m: RevenueMonth) => m.end / (countOf(m) || 1);
  const ltv = (m: RevenueMonth) => arpa(m) / (churn(m) || 1);
  return [
    metric("arpa", arpa(last), arpa(before), formatCurrency, { series: year.map(arpa) }),
    metric("revenue_churn", churn(last) * 100, churn(before) * 100, (v) => `${v.toFixed(2)}%`, {
      series: year.map((m) => churn(m) * 100),
    }),
    metric("ltv", ltv(last), ltv(before), formatCurrency, {
      series: year.map(ltv),
      hint: "Revenue, before costs",
    }),
  ];
}

/**
 * What each launch or rollback changed: the 7 days before it against the 7
 * days after (the launch day left out), on the platforms it touched, for daily
 * actives, signups a day, and activation of the signups in each week.
 */
function releaseImpact() {
  return PRODUCT_EVENTS.filter((e) => e.kind === "launch" && e.from > 7).map((e) => {
    const pfs = e.platforms ?? (Object.keys(PLATFORMS) as Platform[]);
    const before = e.from + 1;
    const after = e.from - 7;
    const daily = (get: (pf: Platform, offset: number) => number[], offset: number) =>
      sum(pfs.map((pf) => mean(get(pf, offset))));
    const activation = (offset: number) => {
      const counts = pfs.map((pf) => activationCounts(pf, "all", 7, offset));
      return sum(counts.map((c) => c.aha)) / (sum(counts.map((c) => c.setup)) || 1);
    };
    const users = [before, after].map((o) => daily((pf, off) => dau(pf, "all", 7, off), o));
    const joins = [before, after].map((o) => daily((pf, off) => signups(pf, "all", 7, off), o));
    const rates = [before, after].map((o) => activation(o) * 100);
    const pct = ([b, a]: number[]) => round(((a! - b!) / (b! || 1)) * 100, 1);
    return {
      label: e.label,
      date: dateLabel(e.from),
      platforms: e.platforms
        ? e.platforms.map((pf) => PLATFORM_LABEL[pf]).join(" and ")
        : "All platforms",
      detail: e.detail,
      metrics: [
        {
          name: "Daily active users",
          before: formatNumber(users[0]!),
          after: formatNumber(users[1]!),
          change: pct(users),
          unit: "percent" as const,
        },
        {
          name: "Activation",
          before: `${rates[0]!.toFixed(1)}%`,
          after: `${rates[1]!.toFixed(1)}%`,
          change: round(rates[1]! - rates[0]!, 1),
          unit: "points" as const,
        },
        {
          name: "Signups a day",
          before: formatNumber(joins[0]!),
          after: formatNumber(joins[1]!),
          change: pct(joins),
          unit: "percent" as const,
        },
      ],
    };
  });
}

function explainAnalytics({
  metric,
  range,
  platform,
  plan,
  active,
  compare,
}: Input<"explain_change">): Why {
  const days = RANGE_DAYS[range];
  const label = WHY_LABEL[metric];
  const rate = isRate(metric);
  const text = (v: number) => (rate ? `${v.toFixed(1)}%` : formatNumber(v));
  const signed = (v: number) =>
    rate ? formatPoints(v, 1) : `${v >= 0 ? "+" : "−"}${formatNumber(Math.abs(v))}`;
  // The comparison window: the prior period, or last year's same weekdays,
  // which the plan grows by its rates as get_usage_kpis does. Activation's
  // plan is a flat rate, shared across segments in proportion to last year's
  // rates; DAU/MAU's plan is last year's, as both sides grow alike.
  const thenOffset = compare === "previous_period" ? days : LAST_YEAR;
  const planScale =
    compare !== "plan" || metric === "stickiness"
      ? 1
      : metric === "activation"
        ? USAGE_PLAN.activation /
          (whyValue(metric, platform, plan, active, days, LAST_YEAR) || USAGE_PLAN.activation)
        : metric === "signups"
          ? USAGE_PLAN.signups
          : USAGE_PLAN.actives;
  const valueThen = (pf: string, pl: string) =>
    whyValue(metric, pf, pl, active, days, thenOffset) * planScale;
  const value = whyValue(metric, platform, plan, active, days, 0);
  const comparison = valueThen(platform, plan);
  const total = value - comparison;
  const candidates: (Driver & { value: number })[] = [];
  const driver = (
    dimension: string,
    part: { label: string; delta: number; current: number; comparison: number },
    detail?: string,
  ) => ({
    dimension,
    name: part.label,
    delta: signed(part.delta),
    share: round(total === 0 ? 0 : part.delta / total, 3),
    current: text(part.current),
    comparison: text(part.comparison),
    tone:
      part.delta > 0 ? ("good" as const) : part.delta < 0 ? ("bad" as const) : ("neutral" as const),
    ...(detail ? { detail } : {}),
    value: part.delta,
  });

  // Data first: a tracking problem in either window explains its share before any product reason.
  let dataQuality: string | undefined;
  let tracking = 0;
  if (active === "any" && (metric === "wau" || metric === "dau")) {
    tracking =
      ghostUsers(metric, platform, plan, days, 0) -
      ghostUsers(metric, platform, plan, days, thenOffset) * planScale;
    if (Math.abs(tracking) >= Math.abs(total) * 0.05 && Math.abs(tracking) >= 1) {
      const bug = PRODUCT_EVENTS.find((e) => e.id === "ios-duplicate-events")!;
      dataQuality = `${signed(tracking)} of the change is the ${bug.label} on ${dateLabel(bug.from)}–${dateLabel(bug.to)}, which counted iOS users who never opened the app. Core-action numbers are unaffected.`;
      candidates.push({
        ...driver(
          "Data",
          { label: bug.label, delta: tracking, current: tracking, comparison: 0 },
          bug.detail,
        ),
        current: "Counted",
        comparison: "Not counted",
      });
    }
  }

  let walkSteps: { label: string; delta: number }[];
  if (rate) {
    // Rates split into mix (which platforms and plans the users come from) and rate (each one's own).
    const split = mixAndRate(
      segments(platform, plan).map(([pf, pl]) => {
        const pair = (offset: number, scale = 1) => {
          if (metric === "activation") {
            const c = activationCounts(pf, pl, days, offset);
            return { n: c.aha * 100 * scale, d: c.setup };
          }
          return {
            n: mean(actives(1, pf, pl, active, days, offset)) * 100,
            d: mean(actives(28, pf, pl, active, days, offset)),
          };
        };
        const now = pair(0);
        const then = pair(thenOffset, planScale);
        return {
          key: `${pf}:${pl}`,
          label: `${PLATFORM_LABEL[pf]} ${PLANS[pl].label}`,
          numerator: [now.n, then.n],
          denominator: [now.d, then.d],
        };
      }),
    );
    walkSteps = [
      { label: "Mix of users", delta: split.mix },
      { label: "Within each group", delta: split.rate },
    ];
    for (const p of split.parts) {
      candidates.push(
        driver("Within group", {
          label: p.label,
          delta: p.rate,
          current: p.ratio[0],
          comparison: p.ratio[1],
        }),
        driver("Mix", {
          label: p.label,
          delta: p.mix,
          current: p.weight[0] * 100,
          comparison: p.weight[1] * 100,
        }),
      );
    }
  } else {
    const parts = (dimension: "platform" | "plan") =>
      contributions(
        (dimension === "platform" ? platformsFor(platform) : plansFor(plan)).map((key) => {
          const [pf, pl] = dimension === "platform" ? [key, plan] : [platform, key];
          return {
            key,
            label:
              dimension === "platform" ? PLATFORM_LABEL[key as Platform] : PLANS[key as Plan].label,
            current: whyValue(metric, pf, pl, active, days, 0),
            comparison: valueThen(pf, pl),
          };
        }),
      );
    const byPlatform = parts("platform");
    walkSteps = [
      ...(tracking ? [{ label: "Tracking", delta: tracking }] : []),
      ...byPlatform.map((p) => ({
        label: p.label,
        delta: p.delta - (tracking && p.key === "ios" ? tracking : 0),
      })),
    ];
    // A dimension with one member (a single platform or plan picked) explains nothing.
    if (byPlatform.length > 1) byPlatform.forEach((p) => candidates.push(driver("Platform", p)));
    if (plan === "all") parts("plan").forEach((p) => candidates.push(driver("Plan", p)));
  }

  const past = Array.from(
    { length: PAST_WINDOWS[range] },
    (_, k) =>
      whyValue(metric, platform, plan, active, days, (k + 1) * days) -
      whyValue(metric, platform, plan, active, days, (k + 2) * days),
  );
  const sure = confidence(total, past, comparison, { centre: compare === "previous_period" });
  const explained = sure.level !== "Low";
  const pick = (sameSign: boolean, limit: number) => {
    const perDimension = new Map<string, number>();
    return candidates
      .filter((c) => Math.abs(c.share) >= 0.05 && c.value * total > 0 === sameSign)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .filter((c) => {
        const n = perDimension.get(c.dimension) ?? 0;
        perDimension.set(c.dimension, n + 1);
        return n < 2;
      })
      .slice(0, limit)
      .map(({ value: _v, ...d }) => d);
  };
  const drivers = explained ? pick(true, 4) : [];
  const offsetting = explained ? pick(false, 3) : [];
  const change = comparison === 0 ? 0 : (total / Math.abs(comparison)) * 100;
  // A holiday in the prior period makes this one look better than it is; one
  // in this period, against last year's ordinary weeks, makes it look worse.
  const holidays = PRODUCT_EVENTS.filter((e) => e.kind === "holiday");
  const holidayThen =
    compare === "previous_period"
      ? holidays.find((e) => e.to >= days && e.from < days * 2)
      : undefined;
  const holidayNow =
    compare === "previous_period" ? undefined : holidays.find((e) => e.from < days);
  // A launch inside this period is evidence worth naming, not a proven cause.
  const launch = PRODUCT_EVENTS.find((e) => e.kind === "launch" && e.from < days);
  const size = rate ? `${Math.abs(total).toFixed(1)} pts` : formatNumber(Math.abs(total));
  const top = dataQuality ? undefined : drivers[0];
  const move = `${size} (${Math.abs(change).toFixed(1)}%)`;
  const head =
    compare === "plan"
      ? `${move} ${total >= 0 ? "above" : "below"} plan`
      : `${total >= 0 ? "up" : "down"} ${move} ${compare === "last_year" ? "on the same days last year" : `on the prior ${days} days`}`;
  const summary = [
    `${label} ${metric === "signups" ? "are" : "is"} ${head}.`,
    !explained
      ? `${sure.note}, so no single cause stands out.`
      : top
        ? `The biggest driver is ${top.name} (${top.dimension.toLowerCase()}): ${top.delta}, ${Math.round(Math.abs(top.share) * 100)}% of the change.`
        : "",
    dataQuality ?? "",
    holidayThen
      ? `The prior period includes the ${holidayThen.label}, which lowers the comparison.`
      : "",
    holidayNow ? `This period includes the ${holidayNow.label}, which lowers it.` : "",
    launch && explained && (metric === "activation" || metric === "wau")
      ? `${launch.label} shipped on ${dateLabel(launch.from)}, inside this period.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    metric: label,
    periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
    comparisonLabel: COMPARISON_LABEL[compare],
    value: text(value),
    comparison: text(comparison),
    delta: signed(total),
    change: round(change),
    tone: Math.abs(change) < 0.05 ? "neutral" : total > 0 ? "good" : "bad",
    confidence: sure,
    summary,
    drivers,
    offsetting,
    walk: walkOf(
      { label: COMPARISON_LABEL[compare], value: comparison },
      walkSteps,
      { label: "This period", value },
      Math.abs(total) * 0.005,
    ).map((s) => ({ ...s, value: round(s.value, rate ? 2 : 0) })),
    format: rate ? "percent" : "number",
    ...(dataQuality ? { dataQuality } : {}),
  };
}

/**
 * The seven daily lifecycle states (Duolingo's model, on our 28-day MAU) for
 * the last 28 days: active users above the line by why they count, inactive
 * ones below by how long they have been away; each state's daily return rate;
 * and which rate, raised 2% for the last 90 days, would add the most daily
 * actives (in the last week).
 */
function lifecycleStates(platform: string, plan: string) {
  const days = 28;
  const pop = population(platform, plan);
  const field = (values: Float64Array, sign = 1) =>
    take(values, days).map((v) => Math.round(v * sign));
  const rate = (came: Float64Array, from: Float64Array) =>
    sum(take(came, days)) / (sum(take(from, days, 1)) || 1);
  const lastWeek = (p: Population) => mean(take(p.dau, 7));
  const base = lastWeek(pop);
  const boosted = (boost: Boost) =>
    lastWeek(
      addPopulations(segments(platform, plan).map(([pf, pl]) => segmentPopulation(pf, pl, boost))),
    );
  const tests: [string, Boost][] = [
    ["Current users returning +2%", { bands: [1.02, 1, 1], activation: 1 }],
    ["Reactivation +2%", { bands: [1, 1.02, 1], activation: 1 }],
    ["Resurrection +2%", { bands: [1, 1, 1.02], activation: 1 }],
    ["New users activating +2%", { bands: [1, 1, 1], activation: 1.02 }],
  ];
  return {
    labels: dayLabels(days),
    newUsers: field(pop.newUsers),
    current: field(pop.current),
    reactivated: field(pop.reactivated),
    resurrected: field(pop.resurrected),
    // Reactivated and resurrected together, so a 4-series chart keeps at risk.
    cameBack: field(pop.reactivated).map((v, i) => v + field(pop.resurrected)[i]!),
    atRiskWau: field(pop.atRiskWau, -1),
    dormant: Math.round(pop.dormant[HISTORY - 1]!),
    rates: [
      { name: "Current: back within 6 days", value: round(rate(pop.current, pop.wau) * 100, 1) },
      {
        name: "Reactivated: back after 7–27 days",
        value: round(rate(pop.reactivated, pop.atRiskMau) * 100, 2),
      },
      {
        name: "Resurrected: back after 28+ days",
        value: round(rate(pop.resurrected, pop.dormant) * 100, 2),
      },
    ] as Item[],
    sensitivity: tests
      .map(([name, boost]) => ({ name, value: Math.round(boosted(boost) - base) }))
      .sort((a, b) => b.value - a.value) as Item[],
    // Where users were 28 days ago (or that they signed up since) and where
    // they are today. Users lapsed (away 90+ days) at both ends are left out:
    // years of past signups that would dwarf every move worth seeing.
    flow: (pop.flow ?? [])
      .filter((l) => !(l.from === "Lapsed" && l.to === "Lapsed"))
      .map((l) => ({ from: l.from, to: l.to, users: Math.round(l.value) }))
      .filter((l) => l.users > 0),
    rule: ruleFor("core", "daily states, last 28 days"),
  };
}

/** A KPI for a registered metric: label, direction, and definition from METRICS. */
const metric = metricKpis(METRICS as Record<MetricId, MetricDefinition>);

/** The calendar as chart events for the period, on the platform filtered to. */
const eventsFor = (range: Range, platform = "all"): ChartEvent[] =>
  calendarEvents(
    range,
    PRODUCT_EVENTS.filter(
      (e) => !e.platforms || platform === "all" || e.platforms.includes(platform as Platform),
    ),
  );

/** One line naming the active rule, for the card that shows the numbers. */
const ruleFor = (active: Active, window: string) =>
  `Active = ${active === "core" ? "core action" : "any event"} · ${window} · UTC`;

// gap: week-4 retention of users who used the feature in their first 14 days
// minus those who didn't, in points; adjusted: the same gap among activated
// users only, which strips out "engaged users use more of everything".
const FEATURES = [
  { name: "Boards", breadth: 91, frequency: 4.1, mobile: 1, gap: 18, adjusted: 2 },
  { name: "Tasks and comments", breadth: 74, frequency: 3.6, mobile: 1.05, gap: 22, adjusted: 9 },
  { name: "Timeline view", breadth: 46, frequency: 2.4, mobile: 0.5, gap: 9, adjusted: 3 },
  { name: "Docs", breadth: 38, frequency: 2.1, mobile: 0.7, gap: 12, adjusted: 5.5 },
  { name: "Templates", breadth: 33, frequency: 0.9, mobile: 0.6, gap: 6, adjusted: 1 },
  { name: "Mobile quick capture", breadth: 27, frequency: 2.2, mobile: 2.2, gap: 7, adjusted: 2 },
  { name: "AI summaries", breadth: 24, frequency: 1.3, mobile: 0.9, gap: 8, adjusted: 1.5 },
  { name: "Automations", breadth: 17, frequency: 4.3, mobile: 0.4, gap: 24, adjusted: 11 },
  { name: "Integrations", breadth: 13, frequency: 1.1, mobile: 0.3, gap: 19, adjusted: 8 },
  { name: "Dashboards", breadth: 12, frequency: 2.9, mobile: 0.5, gap: 14, adjusted: 6.5 },
  { name: "Guest access", breadth: 8, frequency: 1.4, mobile: 0.6, gap: 10, adjusted: 4 },
];

/**
 * How a feature's numbers scale from a 30-day window to `days` (our model).
 * Active users grow sublinearly with the window (7 days is about half of 30,
 * 90 days about 1.4×); a feature's breadth among them follows each user's
 * chance of using it at least once, 1 − (1 − monthly)^reach; and frequency
 * among its users falls as longer windows take in occasional users.
 */
function featureSpan(days: number) {
  const t = days / 30;
  return {
    actives: t < 1 ? t ** 0.45 : t ** 0.3,
    reach: t ** 0.3,
    frequency: t ** -0.08,
  };
}

const EVENTS = [
  { name: "board_viewed", perUser: 9.4, reach: 0.9 },
  { name: "task_updated", perUser: 6.1, reach: 0.78 },
  { name: "task_created", perUser: 3.2, reach: 0.66 },
  { name: "comment_added", perUser: 2.7, reach: 0.58 },
  { name: "automation_run", perUser: 1.9, reach: 0.17 },
  { name: "doc_edited", perUser: 1.4, reach: 0.34 },
  { name: "file_uploaded", perUser: 0.8, reach: 0.27 },
  { name: "ai_summary_generated", perUser: 0.6, reach: 0.21 },
  { name: "teammate_invited", perUser: 0.15, reach: 0.08 },
  { name: "integration_connected", perUser: 0.04, reach: 0.03 },
];

const SOURCES = [
  { label: "Organic search", share: 0.26, activation: 0.92 },
  { label: "Teammate invites", share: 0.24, activation: 1.68 },
  { label: "Direct", share: 0.17, activation: 1.0 },
  { label: "Paid search", share: 0.13, activation: 0.74 },
  { label: "Social", share: 0.11, activation: 0.58 },
  { label: "Partner marketplace", share: 0.09, activation: 1.12 },
];

/**
 * Share of the window's actives by days active, 1 to `window`. The shape
 * (light users, a weekday hump) is tilted so its mean days active is
 * window × DAU ÷ WAU or MAU over the last 7 days: every user-day in the curve
 * is a daily active, so it agrees with the DAU/MAU KPI.
 */
function stickinessShares(platform: string, plan: string, window: 7 | 28) {
  const engagement = factor(platform, plan, "retention");
  const pop = population(platform, plan);
  const target =
    (window * mean(take(pop.dau, 7))) / mean(take(pop[window === 7 ? "wau" : "mau"], 7));
  if (window === 7) {
    const base = [0.27, 0.16, 0.12, 0.1, 0.11, 0.11, 0.13];
    return tiltToMean(
      base.map((v, i) => v * engagement ** ((i - 3) / 3)),
      target,
    );
  }
  // A work tool's power users cluster near 20 of 28 days: every weekday.
  const raw = Array.from({ length: 28 }, (_, i) => {
    const d = i + 1;
    const light = 0.2 * Math.exp(-(d - 1) / 3);
    const work = 0.07 * engagement * Math.exp(-((d - 20) ** 2) / 8);
    const daily = d >= 26 ? 0.02 * engagement : 0;
    return light + work + daily + 0.008;
  });
  return tiltToMean(raw, target);
}

/** Weights (index i = i + 1 days) scaled by e^(θ·i) and normalised, θ found so the mean days is `target`. */
function tiltToMean(weights: number[], target: number): number[] {
  const tilted = (theta: number) => {
    const w = weights.map((v, i) => v * Math.exp(theta * i));
    const total = sum(w);
    return w.map((v) => v / total);
  };
  const meanDays = (shares: number[]) => sum(shares.map((v, i) => v * (i + 1)));
  let [low, high] = [-6, 6];
  for (let k = 0; k < 50; k++) {
    const mid = (low + high) / 2;
    if (meanDays(tilted(mid)) < target) low = mid;
    else high = mid;
  }
  return tilted((low + high) / 2);
}

export const analyticsHandlers: Record<string, (args: any) => unknown> = {
  get_usage_kpis({ range, platform, plan, active, compare }: Input<"get_usage_kpis">) {
    const days = RANGE_DAYS[range];
    // The plan is last year's same weekdays grown by the planned rates.
    const lastYear = compare !== "previous_period";
    const planned = compare === "plan";
    const then = lastYear ? LAST_YEAR : days;
    const grow = (values: number[], rate: number) =>
      planned ? values.map((v) => v * rate) : values;
    const against = compare === "previous_period" ? undefined : COMPARISON_LABEL[compare];
    const any = active === "any";
    const w = (window: 1 | 7 | 28, offset = 0) =>
      actives(window, platform, plan, active, days, offset);
    const wau = [w(7), grow(w(7, then), USAGE_PLAN.actives)];
    const daily = [w(1), grow(w(1, then), USAGE_PLAN.actives)];
    const monthly = [w(28), grow(w(28, then), USAGE_PLAN.actives)];
    const sign = [
      signups(platform, plan, days),
      grow(signups(platform, plan, days, then), USAGE_PLAN.signups),
    ];
    const act = [
      activationCounts(platform, plan, days),
      activationCounts(platform, plan, days, then),
    ];
    const actSeries = (offset: number) =>
      Array.from(
        { length: days },
        (_, i) => activationRate(platform, plan, offset + days - 1 - i) * 100,
      );
    const actThen = planned ? USAGE_PLAN.activation : act[1]!.rate * 100;
    const actThenSeries = planned
      ? new Array<number>(days).fill(USAGE_PLAN.activation)
      : actSeries(then);
    // Sessions: each active day is about 1.6 sessions, so sessions per user in
    // a week is active days ÷ weekly actives × 1.6; a session's length follows
    // the day's platform mix (our rules).
    const sessionsPerUser = (offset: number) => {
      const daily = dau(platform, plan, days + 6, offset);
      const weekly = w(7, offset);
      return weekly.map((v, i) => (sum(daily.slice(i, i + 7)) * SESSIONS_PER_ACTIVE_DAY) / v);
    };
    const medianSession = (offset: number) => {
      const byPlatform = platformsFor(platform).map((pf) => ({
        minutes: PLATFORMS[pf].session,
        dau: dau(pf, plan, days, offset),
      }));
      return Array.from(
        { length: days },
        (_, i) =>
          sum(byPlatform.map((p) => p.minutes * p.dau[i]!)) / sum(byPlatform.map((p) => p.dau[i]!)),
      );
    };
    const sessions = [sessionsPerUser(0), sessionsPerUser(days)];
    const lengths = [medianSession(0), medianSession(days)];
    const trend = bucket(dayLabels(days), wau, range, true);
    const pct = (v: number) => `${v.toFixed(1)}%`;
    const series = (pair: number[][]) => ({
      series: pair[0],
      previousSeries: pair[1],
      range,
      ...(against ? { comparisonLabel: against } : {}),
    });
    const stick = daily.map((d, k) => d.map((v, i) => (v / monthly[k]![i]!) * 100));
    const stickiness = (k: number) => (mean(daily[k]!) / mean(monthly[k]!)) * 100;
    return {
      periodLabel: periodLabel(range, AGAINST_TEXT[compare]),
      hero: metric(any ? "wau_any" : "wau", mean(wau[0]!), mean(wau[1]!), formatNumber, {
        series: wau[0],
        hint: ruleFor(active, "rolling 7 days"),
      }),
      heroTrend: {
        labels: trend.labels,
        current: trend.values[0]!.map(Math.round),
        previous: trend.values[1]!.map(Math.round),
        format: "number" as const,
        events: eventsFor(range, platform),
        asOf: AS_OF,
        partial: true,
        ...(against ? { comparisonLabel: against } : {}),
        // The lead: explain_change's sentence, on the same comparison.
        summary: explainAnalytics({ metric: "wau", range, platform, plan, active, compare })
          .summary,
      },
      metrics: [
        metric(any ? "dau_any" : "dau", mean(daily[0]!), mean(daily[1]!), formatNumber, {
          ...series(daily),
          chart: "number",
        }),
        metric(any ? "mau_any" : "mau", mean(monthly[0]!), mean(monthly[1]!), formatNumber, {
          ...series(monthly),
          chart: "number",
        }),
        // DAU/MAU as the glossary defines it: the period's average DAU ÷ its
        // average MAU, as explain_change reads it; the series is each day's.
        metric("stickiness", stickiness(0), stickiness(1), pct, {
          ...series(stick),
          hint: "SaaS average 15%, good 20%, great 30%",
          chart: "percent",
          band: { label: "Good to great 20–30%", from: 20, to: 30 },
        }),
        metric("signups", sum(sign[0]!), sum(sign[1]!), formatNumber, {
          ...series(sign),
          chart: "number",
          total: true,
        }),
        metric("activation", act[0]!.rate * 100, actThen, pct, {
          series: actSeries(0),
          previousSeries: actThenSeries,
          range,
          ...(against ? { comparisonLabel: against } : {}),
          hint: "Aha ÷ setup, within 7 days",
          chart: "percent",
        }),
        metric(
          "sessions_per_user",
          mean(sessions[0]!),
          mean(sessions[1]!),
          (v) => `${v.toFixed(1)} / week`,
          {
            series: sessions[0],
            previousSeries: sessions[1],
            range,
            chart: "number",
            ...(against ? { hint: PRIOR_ONLY } : {}),
          },
        ),
        metric("median_session", mean(lengths[0]!), mean(lengths[1]!), formatDuration, {
          series: lengths[0],
          previousSeries: lengths[1],
          range,
          chart: "duration",
          ...(against ? { hint: PRIOR_ONLY } : {}),
        }),
      ],
      rules: [
        ruleFor(active, "weekly actives over rolling 7 days"),
        planned
          ? `Plan: last year × ${USAGE_PLAN.actives} for actives, × ${USAGE_PLAN.signups} for signups, ${USAGE_PLAN.activation}% activation`
          : lastYear
            ? "Compared with the same weekdays last year"
            : `Compared with the prior ${days} days`,
        platform === "all" ? "Web, iOS, and Android" : PLATFORM_LABEL[platform as Platform],
        plan === "all" ? "All plans" : `${PLANS[plan as Plan].label} plan`,
      ],
    };
  },

  get_monetization({ range }: Input<"get_monetization">) {
    return monetisation(range);
  },

  get_usage_commits() {
    return usageCommits();
  },

  get_weekly_review() {
    return weeklyReview();
  },

  get_actions() {
    return { actions: recommendedActions() };
  },

  preview_alert({ metric, drop, confirm, quiet, window }: Input<"preview_alert">) {
    return alertPreview(metric, drop, confirm, quiet === "weekends", Number(window));
  },

  get_annotations({ range, platform }: Input<"get_annotations">) {
    return { events: eventsFor(range, platform) };
  },

  get_data_status({ range, platform }: Input<"get_data_status">) {
    const days = RANGE_DAYS[range];
    const inRange = (e: (typeof PRODUCT_EVENTS)[number]) =>
      e.to < days &&
      (!e.platforms || platform === "all" || e.platforms.includes(platform as Platform));
    const measurement = PRODUCT_EVENTS.filter((e) => e.kind === "measurement" && inRange(e));
    const restated = measurement.filter((e) => e.id === "oct-8-restatement");
    const breaks = measurement.filter((e) => e.id !== "oct-8-restatement");
    const events = sum(dau(platform, "all", days)) * 31;
    const items = [
      {
        label: "Complete through",
        value: AS_OF,
        tone: "good" as const,
        detail: "Events arrive within about 15 minutes; the last 15 minutes may still grow.",
      },
      ...restated.map((e) => ({
        label: "Restated",
        value: `${dateLabel(e.from)} +2.1%`,
        tone: "info" as const,
        detail: e.detail,
      })),
      {
        label: "Filtered",
        value: `${formatNumber(events * 0.034)} bot and internal events`,
        tone: "info" as const,
        detail:
          "3.4% of events came from bots, uptime checks, and 212 Relay staff accounts, and are left out of every number.",
      },
      {
        label: "Identified",
        value: "87% of users",
        tone: "good" as const,
        detail:
          "13% of events come from visitors who never signed in; they count toward any-event actives on web only.",
      },
      ...breaks.map((e) => ({
        label: "Tracking break",
        value: `${e.label}, ${dateLabel(e.from)}–${dateLabel(e.to)}`,
        tone: "warn" as const,
        detail: e.detail,
      })),
    ];
    return {
      items,
      summary: breaks.length
        ? `${breaks.length} tracking break in the period; core-action numbers are unaffected.`
        : "No tracking breaks in the period.",
    };
  },

  get_signup_goal({ platform }: Input<"get_signup_goal">) {
    // October so far: the 1st to today, the 10th, of a 31-day month.
    const elapsed = 10;
    const days = 31;
    let running = 0;
    const cumulative = signups(platform, "all", elapsed).map((v) => Math.round((running += v)));
    const projected = (running / elapsed) * days;
    const step = 10 ** (Math.floor(Math.log10(projected)) - 2);
    // The 80% range: the rest of the month moves as much as whole weeks have
    // over the last 8, independently week to week.
    const weeks = Array.from({ length: 8 }, (_, w) =>
      sum(signups(platform, "all", 7, elapsed + 7 * w)),
    );
    const cv = Math.sqrt(sum(weeks.map((v) => (v - mean(weeks)) ** 2)) / 7) / mean(weeks);
    const rest = projected - running;
    const spread = 1.2816 * cv * rest * Math.sqrt(7 / (days - elapsed));
    return {
      label: "October signup goal",
      goal: Math.round((projected * 0.97) / step) * step,
      format: "number" as const,
      labels: Array.from({ length: days }, (_, i) => dateLabel(elapsed - 1 - i)),
      cumulative,
      projected: Math.round(projected),
      range: [Math.round(projected - spread), Math.round(projected + spread)],
      asOf: AS_OF,
    };
  },

  get_active_users({ range, platform, plan, active }: Input<"get_active_users">) {
    const days = RANGE_DAYS[range];
    const { labels, values } = bucket(
      dayLabels(days),
      [1, 7, 28].map((w) => actives(w as 1 | 7 | 28, platform, plan, active, days)),
      range,
      true,
    );
    return {
      labels,
      dau: values[0]!.map(Math.round),
      wau: values[1]!.map(Math.round),
      mau: values[2]!.map(Math.round),
      events: eventsFor(range, platform),
      rule: ruleFor(active, "1, 7, and 28 days up to each day"),
    };
  },

  get_lifecycle({ platform, plan, weeks, view }: Input<"get_lifecycle">) {
    if (view === "states") return lifecycleStates(platform, plan);
    const pop = population(platform, plan);
    const out = {
      labels: [] as string[],
      newUsers: [] as number[],
      returning: [] as number[],
      resurrecting: [] as number[],
      dormant: [] as number[],
    };
    // Weeks end today. A week's actives are its new users, users also active
    // the week before (returning), and users back after a gap (resurrecting);
    // last week's actives who did not come back are dormant.
    for (let k = weeks - 1; k >= 0; k--) {
      const end = HISTORY - 1 - k * 7;
      const span = (values: Float64Array) => sum(Array.from(values.subarray(end - 6, end + 1)));
      const fresh = span(pop.signups);
      const returning = span(pop.returning);
      out.labels.push(`Wk of ${dateLabel(k * 7 + 6)}`);
      out.newUsers.push(Math.round(fresh));
      out.returning.push(Math.round(returning));
      out.resurrecting.push(Math.round(pop.wau[end]! - returning - fresh));
      out.dormant.push(-Math.round(pop.wau[end - 7]! - returning));
    }
    const last = weeks - 1;
    const quick =
      (out.newUsers[last]! + out.resurrecting[last]!) / Math.abs(out.dormant[last] || 1);
    return { ...out, quickRatio: quick.toFixed(2), rule: ruleFor("core", "weeks ending today") };
  },

  explain_change: explainAnalytics,

  get_release_impact() {
    return { releases: releaseImpact() };
  },

  find_activation_moment({ platform, plan }: Input<"find_activation_moment">) {
    return activationMoments(platform, plan);
  },

  get_activation_funnel({ range, platform, plan, unit }: Input<"get_activation_funnel">) {
    const days = RANGE_DAYS[range];
    const userCounts = [
      activationCounts(platform, plan, days),
      activationCounts(platform, plan, days, days),
    ];
    const [cur, prev] = unit === "workspace" ? userCounts.map(workspaceCounts) : userCounts;
    // Validity: the aha moment matters if activated users keep at least twice
    // as well. Read on the cohort that signed up five weeks ago.
    const check = cohort(platform, plan, 5 * 7 - 1);
    const a = check.activated[4]!;
    const n = check.notActivated[4]!;
    const steps: [string, keyof NonNullable<typeof cur>, string?][] =
      unit === "workspace"
        ? [
            ["New workspaces", "signed"],
            ["First project", "setup", "20m"],
            ["Team active: 3+ members in 14 days", "aha", "4 days"],
            ["Habit: active 3 of 4 weeks", "habit", "4 weeks"],
          ]
        : [
            ["Signed up", "signed"],
            ["Set up workspace and project", "setup", "14m"],
            ["Aha: invited 2+ teammates", "aha", "1.6 days"],
            ["Habit: active 3 of 4 weeks", "habit", "4 weeks"],
          ];
    return {
      steps: steps.map(([label, key, medianTime]) => ({
        label,
        value: Math.round(cur![key] as number),
        previous: Math.round(prev![key] as number),
        ...(medianTime ? { medianTime } : {}),
      })),
      activationRate: `${(cur!.rate * 100).toFixed(1)}%`,
      validity: {
        activated: `${(a * 100).toFixed(0)}%`,
        notActivated: `${(n * 100).toFixed(0)}%`,
        ratio: round(a / n, 1),
        pass: a / n >= 2,
        note: `Week-4 retention is ${(a * 100).toFixed(0)}% for activated users against ${(n * 100).toFixed(0)}% for the rest: ${(a / n).toFixed(1)}×, ${a / n >= 2 ? "so the aha moment predicts who stays" : "under the 2× bar, so look for a better aha moment"}.`,
      },
      ...byPlatform(plan, days, unit),
    };
  },

  get_retention_cohorts({ platform, plan, weeks, mode, unit }: Input<"get_retention_cohorts">) {
    const brackets = mode === "bracket" ? BRACKETS.filter(([, to]) => to < weeks) : undefined;
    // Calendar weeks from Monday, so this week is still in progress.
    const sinceMonday = (dayOfWeek(0) + 6) % 7;
    const cohorts = Array.from({ length: weeks }, (_, k) => {
      const startAgo = sinceMonday + (weeks - k) * 7;
      const row = retentionRow(platform, plan, startAgo, mode, unit, brackets);
      const shown = row.partial == null ? row.values : [...row.values, row.partial];
      return {
        cohort: `Wk of ${dateLabel(startAgo)}`,
        size: Math.round(row.size),
        values: shown.map((v) => round(v * 100, 1)),
        ...(row.partial == null ? {} : { partial: true }),
      };
    });
    return {
      periodLabels: brackets
        ? brackets.map(([from, to]) => (from === to ? `Week ${from}` : `Weeks ${from}–${to}`))
        : // The oldest cohort also has the week in progress.
          Array.from({ length: mode === "exact" ? weeks + 1 : weeks }, (_, i) => `Week ${i}`),
      cohorts,
      format: "percent" as const,
      rule: retentionRule(mode, unit),
    };
  },

  get_retention_curves({ platform, weeks, mode, unit }: Input<"get_retention_curves">) {
    // Brackets as the cohorts read them: only those the curve's weeks reach.
    const brackets = mode === "bracket" ? BRACKETS.filter(([, to]) => to <= weeks) : undefined;
    const curve = (plan: string) =>
      retentionRow(platform, plan, (weeks + 1) * 7 - 1, mode, unit, brackets)
        .values.slice(0, weeks + 1)
        .map((v) => round(v * 100, 1));
    const curves = {
      all: curve("all"),
      free: curve("free"),
      team: curve("team"),
      business: curve("business"),
    };
    const reads = (["business", "team", "free"] as const).map(
      (key) => `${PLANS[key].label} ${flattening(curves[key])}`,
    );
    const everyone = unit === "workspace" ? "All workspaces" : "All users";
    return {
      labels: brackets
        ? brackets.map(([from, to]) => (from === to ? `Week ${from}` : `Weeks ${from}–${to}`))
        : Array.from({ length: weeks + 1 }, (_, i) => `Week ${i}`),
      ...curves,
      // Unbounded counts later weeks, so a curve's last week always equals
      // exact retention, and brackets span several weeks: read flattening on
      // exact weeks only.
      flattened:
        mode === "exact"
          ? `${everyone} ${flattening(curves.all)}. ${reads.join("; ")}.`
          : mode === "bracket"
            ? "Brackets span several weeks each; read flattening on exact weeks."
            : "Unbounded counts any later week, so the newest weeks always drop; read flattening on exact weeks.",
      rule: retentionRule(mode, unit),
    };
  },

  get_stickiness({ platform, plan, window }: Input<"get_stickiness">) {
    const w = window as 7 | 28;
    const active = mean(take(population(platform, plan)[w === 7 ? "wau" : "mau"], 7));
    const shares = stickinessShares(platform, plan, w);
    const powerFrom = w === 7 ? 5 : 20;
    return {
      window: w,
      buckets: shares.map((s, i) => ({ days: i + 1, users: Math.round(active * s) })),
      powerUserShare: `${(sum(shares.slice(powerFrom - 1)) * 100).toFixed(1)}%`,
    };
  },

  get_feature_engagement({ range, platform, plan }: Input<"get_feature_engagement">) {
    const mobile = platform === "ios" || platform === "android";
    const span = featureSpan(RANGE_DAYS[range]);
    const active = mean(dau(platform, plan, 28)) * mauRatio(platform, plan) * span.actives;
    const engagement = factor(platform, plan, "retention");
    return {
      features: FEATURES.map((f) => {
        const monthly =
          Math.min(
            98,
            f.breadth *
              (mobile ? f.mobile : 1) *
              engagement ** 0.4 *
              between(`fb:${f.name}:${platform}:${plan}`, 0.94, 1.06),
          ) / 100;
        const breadth = Math.min(98, (1 - (1 - monthly) ** span.reach) * 100);
        return {
          name: f.name,
          breadth: round(breadth),
          frequency: round(
            Math.min(
              7,
              f.frequency *
                engagement ** 0.3 *
                between(`ff:${f.name}:${platform}`, 0.93, 1.07) *
                span.frequency,
            ),
          ),
          users: Math.round((active * breadth) / 100),
          retentionGap: round(f.gap * between(`fg:${f.name}:${platform}:${plan}`, 0.9, 1.1)),
          adjustedGap: round(f.adjusted * between(`fa:${f.name}:${platform}:${plan}`, 0.9, 1.1)),
          change: round(
            f.name === "AI summaries"
              ? 4.8
              : f.name === "Templates"
                ? -2.1
                : between(`fc:${f.name}:${range}`, -1.5, 3),
          ),
        };
      }).sort((a, b) => b.breadth - a.breadth),
    };
  },

  get_activity_heatmap({ range, platform, plan }: Input<"get_activity_heatmap">) {
    const avg = mean(dau(platform, plan, RANGE_DAYS[range]));
    const mobile = platform === "ios" || platform === "android";
    return {
      hourLabels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, d) => {
        const next = random(`heat:${day}:${range}:${platform}:${plan}`);
        const weekend = d >= 5;
        return {
          day,
          values: Array.from({ length: 24 }, (_, h) => {
            const work = Math.exp(-((h - 11) ** 2) / 14) + 0.85 * Math.exp(-((h - 15) ** 2) / 9);
            const evening = (mobile ? 0.55 : 0.2) * Math.exp(-((h - 21) ** 2) / 5);
            const commute = mobile ? 0.35 * Math.exp(-((h - 8) ** 2) / 1.5) : 0;
            const shape = (weekend ? 0.14 * work : work * (d === 4 ? 0.85 : 1)) + evening + commute;
            return Math.round(avg * 1.6 * (0.02 + shape) * (0.9 + next() * 0.2));
          }),
        };
      }),
    };
  },

  get_top_events({ range, platform, limit }: Input<"get_top_events">) {
    const days = RANGE_DAYS[range];
    const cur = sum(dau(platform, "all", days));
    const prev = sum(dau(platform, "all", days, days));
    return {
      events: EVENTS.map((e) => {
        const count = Math.round(
          cur * e.perUser * between(`ev:${e.name}:${range}:${platform}`, 0.92, 1.08),
        );
        const prevCount =
          prev * e.perUser * between(`evp:${e.name}:${range}:${platform}`, 0.92, 1.04);
        const users = Math.round(
          mean(dau(platform, "all", days)) * mauRatio(platform, "all") * e.reach,
        );
        return {
          name: e.name,
          count,
          users,
          perUser: round(count / users),
          change: round(((count - prevCount) / prevCount) * 100),
        };
      })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit),
    };
  },

  get_user_paths({ range, platform }: Input<"get_user_paths">) {
    const mobile = platform === "ios" || platform === "android";
    const total = Math.round(sum(signups(platform, "all", RANGE_DAYS[range])));
    const paths = [
      {
        steps: ["workspace_created", "template_applied", "project_created", "teammate_invited"],
        share: 0.22,
        outcome: "activated",
        m: 0.7,
      },
      {
        steps: ["workspace_created", "project_created", "task_created", "session_ended"],
        share: 0.18,
        outcome: "in progress",
        m: 1,
      },
      { steps: ["workspace_created", "session_ended"], share: 0.15, outcome: "dropped", m: 1.5 },
      {
        steps: ["import_started", "import_completed", "project_created", "teammate_invited"],
        share: 0.11,
        outcome: "activated",
        m: 0.4,
      },
      {
        steps: ["workspace_created", "template_browsed", "session_ended"],
        share: 0.09,
        outcome: "dropped",
        m: 1.3,
      },
      {
        steps: ["invite_accepted", "board_viewed", "comment_added"],
        share: 0.08,
        outcome: "activated",
        m: 1.2,
      },
      {
        steps: ["workspace_created", "project_created", "teammate_invited", "task_created"],
        share: 0.07,
        outcome: "activated",
        m: 0.8,
      },
      {
        steps: ["app_permissions_prompt", "session_ended"],
        share: 0.04,
        outcome: "dropped",
        m: mobile ? 3 : 0.2,
      },
    ] as const;
    const weights = paths.map((p) => p.share * (mobile ? p.m : 1));
    const scale = 0.94 / sum(weights);
    return {
      start: "signup_completed",
      totalUsers: total,
      paths: paths.map((p, i) => ({
        steps: [...p.steps],
        users: Math.round(total * weights[i] * scale),
        share: round(weights[i] * scale, 4),
        outcome: p.outcome,
      })),
    };
  },

  get_signups_by_source({ range, platform }: Input<"get_signups_by_source">) {
    const days = RANGE_DAYS[range];
    // Each period's mix varies a little; counts add up to the period's signups.
    const split = (total: number, offset: number) => {
      const weights = SOURCES.map(
        (s) => s.share * between(`src:${s.label}:${days}:${offset}`, 0.92, 1.08),
      );
      const all = sum(weights);
      const raw = weights.map((w) => (w / all) * total);
      const counts = raw.map(Math.floor);
      // Largest remainders take the rounding, so the sum is exact.
      const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
      const missing = Math.round(total) - sum(counts);
      for (let k = 0; k < missing; k++) counts[order[k]![1]]! += 1;
      return counts;
    };
    const counts = split(sum(signups(platform, "all", days)), 0);
    const before = split(sum(signups(platform, "all", days, days)), days);
    // Source rates are relative; scale them so the signup-weighted mean is the overall rate.
    const act = activationCounts(platform, "all", days).rate * 100;
    const relative = SOURCES.map((s) => s.activation);
    const mean = sum(relative.map((r, i) => r * counts[i]!)) / sum(counts);
    const rates = relative.map((r) => round(Math.min(85, (act * r) / mean)));
    const countTotal = sum(counts);
    return {
      labels: SOURCES.map((s) => s.label),
      signups: counts,
      activationRate: rates,
      items: SOURCES.map((s, i) => ({
        name: s.label,
        value: counts[i]!,
        share: round(counts[i]! / countTotal, 4),
        change: round(((counts[i]! - before[i]!) / before[i]!) * 100),
      })),
      activation: SOURCES.map((s, i) => ({ name: s.label, value: rates[i]! })),
    };
  },

  get_experiments({ status }: Input<"get_experiments">) {
    return {
      experiments: EXPERIMENTS.map(scorecard).filter(
        (e) =>
          status === "all" ||
          (status === "running" ? e.status === "running" : e.status !== "running"),
      ),
    };
  },

  get_account_health({ plan, list, limit }: Input<"get_account_health">) {
    const all = workspaces().filter((w) => plan === "all" || w.plan.toLowerCase() === plan);
    // Paying today: those that cancelled in the last 90 days stay only in the back-test.
    const paying = all.filter((w) => !w.churned);
    const scored = paying.map((w) => {
      const parts = healthParts(w);
      return { w, parts, score: healthScore(parts) };
    });
    const pick = {
      risk: () => [...scored].sort((a, b) => a.score - b.score),
      slipping: () => scored.filter((x) => isSlipping(x.w)).sort((a, b) => b.w.mrr - a.w.mrr),
      expansion: () =>
        scored.filter((x) => isExpansionReady(x.w)).sort((a, b) => b.w.mrr - a.w.mrr),
      power: () =>
        [...scored].sort((a, b) => b.w.breadth * b.w.active7 - a.w.breadth * a.w.active7),
      mrr: () => [...scored].sort((a, b) => b.w.mrr - a.w.mrr),
    }[list]();
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const reason = (x: (typeof scored)[number]) => {
      const { w } = x;
      if (list === "slipping")
        return `No core action for ${w.lastActiveDays} days; usual gap ${w.usualGap}`;
      if (list === "expansion")
        return `${pct(w.active28 / w.seats)} of seats active; renews in ${w.renewalInDays} days`;
      if (list === "power")
        return `${w.breadth} of 11 features; ${pct(w.active7 / w.seats)} of seats active this week`;
      if (list === "mrr") return `${formatCurrency(w.mrr * 12)} ARR; health ${x.score}`;
      const weakest = (Object.entries(x.parts) as [HealthCategory, number][]).sort(
        (a, b) => a[1] - b[1],
      )[0]!;
      return `Weakest: ${weakest[0]} ${Math.round(weakest[1])}; active seats ${w.active28 >= w.active28Before ? "up" : "down"} ${pct(Math.abs(w.active28 / w.active28Before - 1))} on 90 days ago`;
    };
    const seats = sum(paying.map((w) => w.seats));
    const active = sum(paying.map((w) => w.active28));
    const before = sum(paying.map((w) => w.active28Before));
    // Health is kept as of 90, 30, and 7 days ago and today; the seat rule is
    // read on today's 90-day comparison at every point (our rule).
    const scoreAt = [
      (w: (typeof paying)[number]) => w.score90Ago,
      (w: (typeof paying)[number]) => w.score30Ago,
      (w: (typeof paying)[number]) => w.scoreWeekAgo,
      (w: (typeof paying)[number]) => healthScore(healthParts(w)),
    ];
    const healthyAt = scoreAt.map(
      (score) => (paying.filter((w) => score(w) >= 70).length / Math.max(1, paying.length)) * 100,
    );
    const riskAt = scoreAt.map((score) =>
      sum(paying.filter((w) => isArrAtRisk(w, score(w))).map((w) => w.mrr * 12)),
    );
    const plansIn = plan === "all" ? (["team", "business"] as const) : ([plan] as const);
    const payingBefore = payingByMonth(plansIn, 2)[0]!;
    return {
      metrics: [
        metric("paying_workspaces", paying.length, payingBefore, formatNumber, {
          hint: "Team and Business",
        }),
        metric("healthy_share", healthyAt[3]!, healthyAt[1]!, (v) => `${Math.round(v)}%`, {
          series: healthyAt,
          hint: "Health score 70 or more",
        }),
        metric("arr_at_risk", riskAt[3]!, riskAt[1]!, formatCurrency, {
          series: riskAt,
          hint: "Scoring under 40, or active seats down 30%+",
        }),
        metric(
          "seat_utilization",
          (active / seats) * 100,
          (before / seats) * 100,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: "Seats active in the last 28 days",
          },
        ),
      ],
      accounts: pick.slice(0, limit).map((x) => {
        const { w, parts, score } = x;
        return {
          name: w.name,
          plan: w.plan,
          seats: w.seats,
          activeSeats: w.active7,
          healthScore: score,
          zone: zoneOf(score),
          change: score - w.score30Ago,
          weekChange: score - w.scoreWeekAgo,
          reviewNow: w.scoreWeekAgo - score >= 15,
          mrr: w.mrr,
          arr: w.mrr * 12,
          renewalInDays: w.renewalInDays,
          lastActiveDays: w.lastActiveDays,
          reason: reason(x),
          breakdown: (Object.entries(HEALTH_WEIGHTS) as [HealthCategory, number][]).flatMap(
            ([category, weight]) =>
              parts[category] != null
                ? [{ category, score: Math.round(parts[category]!), weight }]
                : [],
          ),
          history: scoreHistory([
            [13, w.score90Ago],
            [4, w.score30Ago],
            [1, w.scoreWeekAgo],
            [0, score],
          ]),
        };
      }),
      distribution: healthDistribution(scored.map((x) => x.score)),
      backTest: backTest(all).map((b) => ({
        name: `${b.label} (${formatNumber(b.workspaces)} workspaces)`,
        value: round(b.rate * 100, 1),
      })),
    };
  },

  get_revenue_retention({ plan }: Input<"get_revenue_retention">) {
    const plans = plan === "all" ? (["team", "business"] as const) : ([plan] as const);
    const months = REVENUE_MONTHS;
    const history = mrrHistory(plans);
    const newCounts = newWorkspacesByMonth(plans, 12);
    // Whole months up to the latest: September 2026 when today is Oct 10.
    const month = (monthsAgo: number, style: "short" | "long" = "short") =>
      new Date(Date.UTC(2026, 8 - monthsAgo, 1)).toLocaleDateString("en-US", {
        month: style,
        timeZone: "UTC",
      });
    const monthName = (monthsAgo: number, style: "short" | "long" = "short") => {
      const year = new Date(Date.UTC(2026, 8 - monthsAgo, 1)).getUTCFullYear();
      return style === "long"
        ? month(monthsAgo, "long")
        : `${month(monthsAgo)} '${String(year).slice(2)}`;
    };
    const lastDay = new Date(Date.UTC(2026, 9, 0)).getUTCDate();
    const last = history[months - 1]!;
    const before = history[months - 2]!;
    const now = retention(history, months - 1);
    const then = retention(history, months - 2);
    const percent = (v: number) => `${(v * 100).toFixed(1)}%`;
    const year = history.slice(-12);
    const trailing = year.map((_, k) => retention(history, months - 12 + k));
    const usualContraction = mean(history.slice(-7, -1).map((m) => m.contraction / m.start));
    const cut = last.contraction / last.start / usualContraction;
    const steps = [
      { label: "New", value: last.new },
      { label: "Expansion", value: last.expansion },
      { label: "Reactivation", value: last.reactivation },
      { label: "Contraction", value: last.contraction, minus: true },
      { label: "Churn", value: last.churn, minus: true },
    ];
    return {
      metrics: [
        metric("mrr", last.end, last.start, formatCurrency, {
          series: year.map((m) => m.end),
          hint: `${formatCurrency(last.end * 12)} ARR`,
        }),
        metric("nrr", now.nrr * 100, then.nrr * 100, (v) => `${v.toFixed(1)}%`, {
          series: trailing.map((r) => r.nrr * 100),
          hint: NRR_BAND.label,
        }),
        metric("grr", now.grr * 100, then.grr * 100, (v) => `${v.toFixed(1)}%`, {
          series: trailing.map((r) => r.grr * 100),
        }),
        metric(
          "revenue_quick_ratio",
          quickRatio(last),
          quickRatio(before),
          (v) => `${v.toFixed(1)}×`,
          {
            series: year.map(quickRatio),
          },
        ),
        ...unitEconomics(plans, last, before, year),
      ],
      walk: [
        { label: `${month(0)} 1`, value: Math.round(last.start), kind: "base" as const },
        ...steps.map((s) => ({
          label: s.label,
          value: Math.round(s.value),
          kind: s.minus ? ("subtract" as const) : ("add" as const),
        })),
        { label: `${month(0)} ${lastDay}`, value: Math.round(last.end), kind: "total" as const },
      ],
      comparisonLabel: `${monthName(0, "long")} 1`,
      labels: Array.from({ length: 12 }, (_, k) => monthName(11 - k)),
      cohorts: cohortNrr(history, 12).map((row, k) => ({
        cohort: monthName(11 - k),
        // New paying workspaces that month, each plan's new MRR over its starting size.
        size: newCounts[k]!,
        values: row.map((v) => round(v * 100, 1)),
      })),
      cohortLabels: Array.from({ length: 12 }, (_, m) => `Month ${m}`),
      nrr: trailing.map((r) => round(r.nrr * 100, 1)),
      nrrBand: NRR_BAND,
      // Each movement by month, losses negative, for a diverging stacked ColumnChart.
      movements: [
        { name: "New", values: year.map((m) => Math.round(m.new)) },
        { name: "Expansion", values: year.map((m) => Math.round(m.expansion)) },
        { name: "Reactivation", values: year.map((m) => Math.round(m.reactivation)) },
        { name: "Contraction", values: year.map((m) => -Math.round(m.contraction)) },
        { name: "Churn", values: year.map((m) => -Math.round(m.churn)) },
      ],
      note:
        plans.includes(SEAT_CUTS.plan) && cut > 1.5
          ? `Contraction was ${cut.toFixed(1)}× its usual share in ${monthName(0, "long")} (${formatCurrency(last.contraction)}): Business workspaces cut seats at renewal. Net revenue retention ${percent(now.nrr)}, ${now.nrr >= then.nrr ? "up" : "down"} from ${percent(then.nrr)}.`
          : `MRR ${last.end >= last.start ? "grew" : "fell"} ${formatCurrency(Math.abs(last.end - last.start))} in ${monthName(0, "long")}, mostly from ${last.new >= last.expansion ? "new workspaces" : "expansion"}. Net revenue retention ${percent(now.nrr)}.`,
    };
  },

  get_account_activity({ plan, accountActive }: Input<"get_account_activity">) {
    const all = payingWorkspaces().filter((w) => plan === "all" || w.plan.toLowerCase() === plan);
    const next = random(`account-activity:${plan}`);
    // Each workspace's members active each week drift from 12 weeks ago to now.
    const weeks = 12;
    const active = Array.from({ length: weeks }, (_, k) => {
      const t = k / (weeks - 1);
      return all.filter((w) => {
        const then = w.members * (w.active28Before / Math.max(1, w.active28));
        const members = Math.round(then + (w.members - then) * t + (next() - 0.5) * 2);
        return isAccountActive(w, accountActive, members);
      }).length;
    });
    const paid = sum(all.map((w) => w.seats));
    const claimed = sum(all.map((w) => w.claimed));
    const used = sum(all.map((w) => w.active28));
    const usedBefore = sum(all.map((w) => w.active28Before));
    const team = activationCounts("all", plan === "all" ? "all" : plan, 30);
    const ruleText = {
      any: "1 or more members",
      team: "3 or more members",
      seats: "half the seats",
    }[accountActive];
    return {
      labels: Array.from(
        { length: weeks },
        (_, k) => `Wk of ${dateLabel((weeks - 1 - k) * 7 + 6)}`,
      ),
      active,
      seats: [
        { label: "Paid seats", value: paid },
        { label: "Claimed", value: claimed },
        { label: "Active in 28 days", value: used, previous: usedBefore },
      ],
      metrics: [
        metric("active_workspaces", active[weeks - 1]!, active[weeks - 5]!, formatNumber, {
          series: active,
          hint: `Active = ${ruleText} with a core action that week`,
        }),
        metric(
          "seat_utilization",
          (used / paid) * 100,
          (usedBefore / paid) * 100,
          (v) => `${v.toFixed(0)}%`,
          {
            hint: "Seats active in the last 28 days",
          },
        ),
        metric(
          "team_activation",
          teamReach(team) * 100,
          teamReach(activationCounts("all", plan === "all" ? "all" : plan, 30, 30)) * 100,
          (v) => `${v.toFixed(1)}%`,
          {
            // Each of the last 12 weeks' new workspaces.
            series: Array.from(
              { length: weeks },
              (_, k) =>
                teamReach(
                  activationCounts("all", plan === "all" ? "all" : plan, 7, (weeks - 1 - k) * 7),
                ) * 100,
            ),
            hint: "New workspaces with 3+ members active in 14 days",
          },
        ),
        metric(
          "expansion_ready",
          all.filter(isExpansionReady).length,
          // A month ago: renewal 30 days further off, and seat activity a third
          // of the way back to where it was 90 days ago.
          all.filter(
            (w) =>
              (w.active28 + (w.active28Before - w.active28) / 3) / w.seats > 0.8 &&
              w.renewalInDays + 30 <= 90,
          ).length,
          formatNumber,
          {
            hint: "80%+ of seats active, renewing within 90 days",
          },
        ),
      ],
      rule: `Active workspace = ${ruleText} with a core action in the week`,
    };
  },

  get_product_insights({
    range,
    platform,
    plan,
    compare,
    excluding,
  }: Input<"get_product_insights">) {
    const days = RANGE_DAYS[range];
    const insights: Insight[] = [];
    const why = (metric: WhyMetric) =>
      explainAnalytics({ metric, range, platform, plan, active: "core", compare });
    const against =
      compare === "plan"
        ? "against plan"
        : compare === "last_year"
          ? "on the same days last year"
          : `on the prior ${days} days`;

    // Beside explain_change, its metric's period change is already the lead.
    if (excluding !== "wau") {
      const wau = why("wau");
      insights.push(periodChangeInsight(wau, "Weekly active users", against));
    }

    const activation = why("activation");
    if (excluding !== "activation" && activation.confidence.level !== "Low") {
      insights.push({
        tone: activation.tone === "bad" ? "negative" : "positive",
        kind: activation.tone === "bad" ? "top_detractor" : "top_driver",
        title: `Activation ${activation.change >= 0 ? "up" : "down"} ${activation.delta} ${against}`,
        detail: activation.summary.split(". ").slice(1).join(". "),
        metric: activation.value,
      });
    }

    const bug = PRODUCT_EVENTS.find((e) => e.id === "ios-duplicate-events")!;
    if (bug.to < days && (platform === "all" || platform === "ios")) {
      insights.push({
        tone: "info",
        kind: "data_quality",
        title: `Any-event counts are inflated ${dateLabel(bug.from)}–${dateLabel(bug.to)}`,
        detail: `${bug.detail}. Use core actions to compare those days.`,
        metric: "iOS",
      });
    }

    if (plan !== "free") {
      const dropped = payingWorkspaces()
        .filter((w) => plan === "all" || w.plan.toLowerCase() === plan)
        .map((w) => ({ w, score: healthScore(healthParts(w)) }))
        .sort((a, b) => a.score - a.w.scoreWeekAgo - (b.score - b.w.scoreWeekAgo))[0]!;
      const drop = dropped.w.scoreWeekAgo - dropped.score;
      // Only a workspace on the filtered plan, and only when one actually slipped.
      if (drop > 0)
        insights.push({
          tone: "negative",
          kind: "workspace_risk",
          title: `${dropped.w.name}'s health fell ${drop} points in 7 days`,
          detail: `${dropped.w.active7} of its ${dropped.w.seats} seats were active this week and no one has done a core action for ${dropped.w.lastActiveDays} days. ${formatCurrency(dropped.w.mrr * 12)} ARR, renewing in ${dropped.w.renewalInDays} days.`,
          metric: `−${drop} pts`,
        });
    }

    if (platform === "all" || platform === "android") {
      const web = retentionCurve("web", plan, 4)[4]!;
      const android = retentionCurve("android", plan, 4)[4]!;
      insights.push({
        tone: "warning",
        kind: "trend_change",
        title: "Android users churn fastest",
        detail: `Week-4 retention is ${android.toFixed(0)}% on Android against ${web.toFixed(0)}% on web. The notification permission prompt ends 1 in 8 first sessions on mobile.`,
        metric: `${android.toFixed(0)}%`,
      });
    }

    insights.push({
      tone: "warning",
      kind: "trend_change",
      title: "Mobile quick-capture widget lost its test",
      detail:
        "It lowered mobile weekly active rate by 4.2% (95% CI −7.4% to −1.0%) and was rolled back.",
      metric: "−4.2%",
    });
    // Read from the same engagement the feature cards show, so the figures agree.
    const automations = (
      analyticsHandlers.get_feature_engagement!({ range, platform, plan }) as {
        features: { name: string; breadth: number; frequency: number }[];
      }
    ).features.find((f) => f.name === "Automations");
    if (automations) {
      insights.push({
        tone: "info",
        title: "Automations is a power feature",
        detail: `Only ${automations.breadth.toFixed(0)}% of the period's active users try it, but they use it ${automations.frequency.toFixed(1)} days a week. Surfacing it in the Team plan trial could widen its reach.`,
        metric: `${automations.frequency.toFixed(1)} d/wk`,
      });
    }
    const holiday = PRODUCT_EVENTS.find((e) => e.kind === "holiday")!;
    if (holiday.to < days * 2) {
      insights.push({
        tone: "info",
        kind: "trend_change",
        title: `${holiday.label}: actives fell, then came back`,
        detail: `${holiday.detail}. Most of those users came back the following week as resurrecting.`,
        metric: "Holiday",
      });
    }
    return { insights: insights.slice(0, 7) };
  },
};
