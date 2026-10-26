// Relay's users as one population, day by day. Every user sits in a bucket by
// how many days ago they were last active; each day some return, with a
// chance that falls the longer they have been away, and new signups arrive
// active. Daily, weekly, and monthly actives, the seven lifecycle states,
// weekly growth accounting, and signup-cohort retention are all read off the
// same buckets, so they agree by construction:
//
//   DAU = new + current + reactivated + resurrected
//   WAU = DAU + at-risk WAU        MAU = WAU + at-risk MAU
//
// Activated users (they reached the aha moment) return far more often than
// the rest, which is what makes activation worth measuring.

/** Buckets kept per user group; anyone away longer shares the last bucket. */
const LONGEST = 120;
/**
 * Users away 120 days or more have churned: they come back at this share of
 * the floor. Without it the lapsed pool grows forever and actives grow with
 * every user ever, not with signups.
 */
export const LOST = 0.1;

export interface ReturnCurve {
  /** Chance of being active today for someone active yesterday, on a weekday. */
  yesterday: number;
  /** How the chance shrinks for each further day away. */
  decay: number;
  /** The chance for someone long gone (resurrection). */
  floor: number;
  /**
   * Multipliers on the chance by how long someone has been away: up to 6
   * days, 7–27, and 28 or more. Used to test which rate moves actives most.
   */
  bands?: [current: number, reactivated: number, resurrected: number];
}

export interface PopulationInput {
  /** New signups each day, oldest first. They are active on their signup day. */
  signups: number[];
  /** Share of each day's signups who activate (reach the aha moment). */
  activation: number[];
  activated: ReturnCurve;
  notActivated: ReturnCurve;
  /** Each day's multiplier on every return chance: weekends, holidays. */
  dayFactor: number[];
  /** Days of warm-up before the first returned day, at the first day's signups: Relay's age before the history starts (4 years by default). */
  warmup?: number;
  /** Follow users over this many final days: where each state's users are at the end (see `flow`). */
  flowDays?: number;
  /**
   * The first day the curves' `bands` apply (a what-if starting then); before
   * it, and through the warm-up, return chances are the plain ones. Default 0.
   */
  bandsFrom?: number;
}

/** States for a flow, by days since a user was last active: within 7, 8–28, 29–90, or longer. */
export const FLOW_STATES = ["Weekly active", "At risk", "Dormant", "Lapsed"] as const;
/** Where users who signed up during a flow come from. */
export const FLOW_NEW = "Signed up";

/** A flow state's share of a "days away" vector (v[g] = last active g days before tomorrow). */
function flowState(g: number): number {
  return g <= 7 ? 0 : g <= 28 ? 1 : g <= 90 ? 2 : 3;
}

export interface Population {
  days: number;
  signups: Float64Array;
  /** Active today, by why they count. */
  newUsers: Float64Array;
  current: Float64Array;
  reactivated: Float64Array;
  resurrected: Float64Array;
  /** Not active today, by how long since they were. */
  atRiskWau: Float64Array;
  atRiskMau: Float64Array;
  dormant: Float64Array;
  dau: Float64Array;
  wau: Float64Array;
  mau: Float64Array;
  /** Of DAU, users who activated. */
  dauActivated: Float64Array;
  /**
   * Users active in the previous week (weeks end on the last day) who came back
   * for the first time this week, counted on the day they came back. A week's
   * sum is its returning users in growth accounting.
   */
  returning: Float64Array;
  /**
   * With `flowDays`: users by their state when the flow starts (or "Signed
   * up" during it) and their state on the last day. Every user is counted once.
   */
  flow?: { from: string; to: string; value: number }[];
}

export const chanceAfter = (curve: ReturnCurve, daysAway: number) =>
  Math.max(curve.floor, curve.yesterday * curve.decay ** (daysAway - 1)) *
  (curve.bands ? curve.bands[daysAway <= 6 ? 0 : daysAway <= 27 ? 1 : 2] : 1);

/**
 * Advances one group of users by a day. `v[g]` holds users last active g days
 * ago (g ≥ 1); some come back, everyone else ages a day, and today's actives
 * become yesterday's.
 */
function advance(
  v: Float64Array,
  curve: ReturnCurve,
  arrivals: number,
  factor: number,
): { back: Float64Array; active: number } {
  const back = new Float64Array(LONGEST + 1);
  let active = arrivals;
  for (let g = 1; g <= LONGEST; g++) {
    const lost = g === LONGEST ? LOST : 1;
    back[g] = v[g]! * Math.min(0.97, chanceAfter(curve, g) * factor * lost);
    active += back[g]!;
  }
  // Everyone not back ages a day; the oldest bucket keeps its own.
  const aged = new Float64Array(LONGEST + 1);
  for (let g = 1; g <= LONGEST; g++) {
    const left = v[g]! - back[g]!;
    aged[Math.min(LONGEST, g + 1)] += left;
  }
  aged[1] = active;
  v.set(aged);
  return { back, active };
}

export function simulate(input: PopulationInput): Population {
  const days = input.signups.length;
  const warmup = input.warmup ?? 1460;
  const out = {
    days,
    signups: Float64Array.from(input.signups),
    newUsers: new Float64Array(days),
    current: new Float64Array(days),
    reactivated: new Float64Array(days),
    resurrected: new Float64Array(days),
    atRiskWau: new Float64Array(days),
    atRiskMau: new Float64Array(days),
    dormant: new Float64Array(days),
    dau: new Float64Array(days),
    wau: new Float64Array(days),
    mau: new Float64Array(days),
    dauActivated: new Float64Array(days),
    returning: new Float64Array(days),
  };
  const groups = [
    {
      v: new Float64Array(LONGEST + 1),
      curve: input.activated,
      share: (t: number) => input.activation[t]!,
      // Last week's actives not yet back this week, by days away.
      tag: new Float64Array(LONGEST + 1),
    },
    {
      v: new Float64Array(LONGEST + 1),
      curve: input.notActivated,
      share: (t: number) => 1 - input.activation[t]!,
      tag: new Float64Array(LONGEST + 1),
    },
  ];
  // Flow: each group's users split by their state when the flow starts, plus
  // one vector for signups during it, each followed on its own to the end.
  const flowStart = input.flowDays ? days - 1 - input.flowDays : -1;
  const flows = groups.map(() => [] as Float64Array[]);
  // Weeks end on the last day, so the latest week is a whole one.
  const weekEnds = (t: number) => (days - 1 - t) % 7 === 0;
  // Warm up at the first day's signups, on a plain week, so day one starts
  // from a settled population rather than an empty one.
  const bandsFrom = input.bandsFrom ?? 0;
  const plain = groups.map((g) => (bandsFrom > 0 ? { ...g.curve, bands: undefined } : g.curve));
  for (let w = 0; w < warmup; w++) {
    const factor = input.dayFactor[w % 7]!;
    groups.forEach((g, k) => advance(g.v, plain[k]!, input.signups[0]! * g.share(0), factor));
  }
  for (let t = 0; t < days; t++) {
    const factor = input.dayFactor[t]!;
    for (const [k, g] of groups.entries()) {
      const curve = t >= bandsFrom ? g.curve : plain[k]!;
      // Last week's actives back for the first time this week leave the tag.
      const firstBack = advance(g.tag, curve, 0, factor);
      out.returning[t] += firstBack.active;
      g.tag[1] = 0;
      const arrivals = input.signups[t]! * g.share(t);
      if (t > flowStart && flowStart >= 0) {
        flows[k]!.forEach((f, s) =>
          advance(f, curve, s === FLOW_STATES.length ? arrivals : 0, factor),
        );
      }
      // Classify before ageing: who is away how long, and who comes back.
      const before = Float64Array.from(g.v);
      const { back, active } = advance(g.v, curve, arrivals, factor);
      out.newUsers[t] += arrivals;
      for (let gap = 1; gap <= LONGEST; gap++) {
        const came = back[gap]!;
        const away = before[gap]! - came;
        if (gap <= 6) {
          out.current[t] += came;
          out.atRiskWau[t] += away;
        } else if (gap <= 27) {
          out.reactivated[t] += came;
          out.atRiskMau[t] += away;
        } else {
          out.resurrected[t] += came;
          out.dormant[t] += away;
        }
      }
      if (k === 0) out.dauActivated[t] = active;
      if (t === flowStart) {
        flows[k] = [
          ...FLOW_STATES.map((_, s) =>
            g.v.map((v, gap) => (gap > 0 && flowState(gap) === s ? v : 0)),
          ),
          new Float64Array(LONGEST + 1),
        ];
      }
      if (weekEnds(t)) {
        g.tag.fill(0);
        g.tag.set(g.v.subarray(1, 8), 1);
      }
    }
    out.dau[t] = out.newUsers[t]! + out.current[t]! + out.reactivated[t]! + out.resurrected[t]!;
    out.wau[t] = out.dau[t]! + out.atRiskWau[t]!;
    out.mau[t] = out.wau[t]! + out.atRiskMau[t]!;
  }
  if (flowStart < 0) return out;
  const flow = new Map<string, number>();
  for (const vectors of flows) {
    vectors.forEach((f, s) => {
      const from = s < FLOW_STATES.length ? FLOW_STATES[s]! : FLOW_NEW;
      for (let gap = 1; gap <= LONGEST; gap++) {
        const key = `${from}\u0000${FLOW_STATES[flowState(gap)]}`;
        flow.set(key, (flow.get(key) ?? 0) + f[gap]!);
      }
    });
  }
  return {
    ...out,
    flow: [...flow].map(([key, value]) => {
      const [from, to] = key.split("\u0000") as [string, string];
      return { from, to, value };
    }),
  };
}

export interface CohortInput {
  /** Signups on each day of the cohort's week. */
  signups: number[];
  activation: number[];
  activated: ReturnCurve;
  notActivated: ReturnCurve;
  /** Return multipliers for every day from the cohort's first day to today. */
  dayFactor: number[];
}

export interface CohortRetention {
  size: number;
  /** Share of the cohort active at least once in each week since its first, 0–1; only whole weeks. */
  all: number[];
  /** Share active in that week or any later one up to today (unbounded retention). */
  unbounded: number[];
  /** Share active at least once in weeks `from` to `to` (bracket retention); only whole weeks. */
  bracket: (from: number, to: number) => number;
  /** Share active so far in the week still in progress, if the cohort has one. */
  partial?: number;
  activated: number[];
  notActivated: number[];
}

/**
 * Retention for one weekly signup cohort: the share active at least once in
 * week 0, 1, 2, … since the cohort's first day. Read at each week's end as
 * those last active within it. A week still in progress is left out.
 */
export function cohortRetention(input: CohortInput): CohortRetention {
  const span = input.dayFactor.length;
  const groups = [
    {
      v: new Float64Array(LONGEST + 1),
      curve: input.activated,
      share: (d: number) => input.activation[d]!,
      size: 0,
    },
    {
      v: new Float64Array(LONGEST + 1),
      curve: input.notActivated,
      share: (d: number) => 1 - input.activation[d]!,
      size: 0,
    },
  ];
  const weeks: [number, number][] = [];
  // At each week's end, users last active within d days, for d = 0…LONGEST.
  const within: Float64Array[] = [];
  const snapshot = () => {
    const out = new Float64Array(LONGEST + 1);
    for (let d = 1; d <= LONGEST; d++) {
      out[d] = out[d - 1]! + groups.reduce((t, g) => t + g.v[d]!, 0);
    }
    return out;
  };
  for (let t = 0; t < span; t++) {
    for (const g of groups) {
      const arrivals = t < input.signups.length ? input.signups[t]! * g.share(t) : 0;
      g.size += arrivals;
      advance(g.v, g.curve, arrivals, input.dayFactor[t]!);
    }
    if ((t + 1) % 7 === 0) {
      // Last active within the past 7 days: buckets 1 to 7 after ageing.
      weeks.push(groups.map((g) => g.v.slice(1, 8).reduce((a, b) => a + b, 0)) as [number, number]);
      within.push(snapshot());
    }
  }
  // The days after the last whole week: active since that week began.
  const extra = span % 7;
  const partialActive = extra ? snapshot()[extra]! : undefined;
  const [a, n] = groups;
  // At the end, bucket g holds users last active g − 1 days before the last
  // day: active on or after week w's first day means g ≤ span − 7w.
  const unbounded = weeks.map((_, w) =>
    groups.reduce(
      (t, g) => t + g.v.slice(1, Math.min(LONGEST, span - 7 * w) + 1).reduce((x, y) => x + y, 0),
      0,
    ),
  );
  const size = a!.size + n!.size || 1;
  return {
    size: a!.size + n!.size,
    all: weeks.map(([x, y]) => (x + y) / size),
    unbounded: unbounded.map((u) => u / size),
    // At the end of week `to`, active on or after week `from`'s first day.
    bracket: (from, to) =>
      to < within.length ? within[to]![Math.min(LONGEST, 7 * (to - from + 1))]! / size : NaN,
    ...(partialActive != null ? { partial: partialActive / size } : {}),
    activated: weeks.map(([x]) => x / (a!.size || 1)),
    notActivated: weeks.map(([, y]) => y / (n!.size || 1)),
  };
}

/** Adds populations together, field by field: every field is a count, so sums keep the identities. */
export function addPopulations(list: Population[]): Population {
  const [first, ...rest] = list;
  const out = { ...first! } as Population;
  for (const key of Object.keys(first!) as (keyof Population)[]) {
    if (key === "days") continue;
    if (key === "flow") {
      const merged = new Map<string, { from: string; to: string; value: number }>();
      for (const link of list.flatMap((p) => p.flow ?? [])) {
        const at = merged.get(`${link.from}>${link.to}`);
        if (at) at.value += link.value;
        else merged.set(`${link.from}>${link.to}`, { ...link });
      }
      out.flow = [...merged.values()];
      continue;
    }
    const sum = Float64Array.from(first![key] as Float64Array);
    for (const p of rest) (p[key] as Float64Array).forEach((v, i) => (sum[i] += v));
    (out as unknown as Record<string, unknown>)[key] = sum;
  }
  return out;
}
