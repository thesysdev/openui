// The simulated population by platform and plan: segments, signups, daily,
// weekly, and monthly actives, activation counts, and the per-platform breakdown.

import { dailySeries, mean, round, sum } from "../../core/sample-data";
import { CHECKLIST_SHIPPED, dayFactor, iosDuplicates } from "../calendar";
import { addPopulations, simulate, type Population, type ReturnCurve } from "../population";
import { HISTORY, type Active, type Plan, type Platform } from "./shared";

const SIGNUPS_PER_DAY = 520;

/**
 * Per platform and plan: share of signups, activation and retention
 * multipliers, median session in minutes, and the share of extra users who
 * only open and view (counted on any event, not on a core action).
 */
export const PLATFORMS: Record<
  Platform,
  { signups: number; activation: number; retention: number; session: number; passive: number }
> = {
  web: { signups: 0.7, activation: 1.06, retention: 1, session: 7.7, passive: 0.12 },
  ios: { signups: 0.18, activation: 0.92, retention: 0.9, session: 3.4, passive: 0.22 },
  android: { signups: 0.12, activation: 0.74, retention: 0.74, session: 3.1, passive: 0.25 },
};
export const PLANS: Record<
  Plan,
  { signups: number; activation: number; retention: number; label: string }
> = {
  free: { signups: 0.78, activation: 0.84, retention: 0.66, label: "Free" },
  team: { signups: 0.17, activation: 1.38, retention: 1.32, label: "Team" },
  business: { signups: 0.05, activation: 1.62, retention: 1.6, label: "Business" },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

export const platformsFor = (p: string) =>
  p === "all" ? (Object.keys(PLATFORMS) as Platform[]) : [p as Platform];
export const plansFor = (p: string) => (p === "all" ? (Object.keys(PLANS) as Plan[]) : [p as Plan]);
export const segments = (platform: string, plan: string) =>
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
export const ahaShare = (pf: Platform, pl: Plan, ago: number) =>
  Math.min(
    0.85,
    0.2 * PLATFORMS[pf].activation * PLANS[pl].activation * (ago < CHECKLIST_SHIPPED ? 1.1 : 1),
  );

/** How often each group comes back, by engagement (platform × plan retention). */
export function curves(
  pf: Platform,
  pl: Plan,
): { activated: ReturnCurve; notActivated: ReturnCurve } {
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

export const segmentSignups = (pf: Platform, pl: Plan) =>
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
export const DAY_FACTOR = Array.from({ length: HISTORY }, (_, t) => dayFactor(agoAt(t)));

/** A what-if: return chances by band (current, reactivated, resurrected) and activation, as multipliers. */
export type Boost = { bands: [number, number, number]; activation: number };
/** A what-if starts this many days ago: the lifecycle card's "in 90 days". */
const BOOST_DAYS = 90;
const NO_BOOST: Boost = { bands: [1, 1, 1], activation: 1 };

const segmentCache = new Map<string, Population>();
export function segmentPopulation(pf: Platform, pl: Plan, boost: Boost = NO_BOOST): Population {
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
export function population(platform: string, plan: string): Population {
  const key = `${platform}:${plan}`;
  const cached = populationCache.get(key);
  if (cached) return cached;
  const pop = addPopulations(segments(platform, plan).map(([pf, pl]) => segmentPopulation(pf, pl)));
  populationCache.set(key, pop);
  return pop;
}

/** A field's values for `days` days ending `offset` days ago, oldest first. */
export const take = (values: Float64Array, days: number, offset = 0) =>
  Array.from(values.subarray(HISTORY - offset - days, HISTORY - offset));

/** Distinct users a duplicate-event day adds to a window of this many days, per ghost user-day. */
const GHOST_OVERLAP: Record<number, number> = { 1: 1, 7: 0.6, 28: 0.45 };

/**
 * Users active on a core action, or on any event, in the 1, 7, or 28 days up
 * to each day. Any event adds the users who only open and view, and on the
 * days the iOS SDK sent duplicate app opens, iOS users who never came back.
 */
export function actives(
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

export const dau = (platform: string, plan: string, days: number, offset = 0) =>
  actives(1, platform, plan, "core", days, offset);
export const signups = (platform: string, plan: string, days: number, offset = 0) =>
  take(population(platform, plan).signups, days, offset);

/** Monthly active users as a multiple of daily actives, over the last 28 days. */
export const mauRatio = (platform: string, plan: string) =>
  mean(take(population(platform, plan).mau, 28)) / mean(dau(platform, plan, 28));

/** A per-platform and per-plan multiplier, weighted by signups. */
export function factor(platform: string, plan: string, key: "activation" | "retention") {
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
export function activationCounts(platform: string, plan: string, days: number, offset = 0) {
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
export const activationRate = (platform: string, plan: string, ago: number) =>
  activationCounts(platform, plan, 7, ago).rate;

/**
 * Activation counts as new workspaces: about 55% of signups who set up start a
 * new workspace (the rest join one); team activation is 3+ members active in
 * its first 14 days.
 */
export function workspaceCounts(c: ReturnType<typeof activationCounts>) {
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
export function byPlatform(plan: string, days: number, unit: "user" | "workspace" = "user") {
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
