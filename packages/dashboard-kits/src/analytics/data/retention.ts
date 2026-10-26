// Signup cohorts and retention: cohort curves, retention rows and rules, team
// activation of new workspaces, and how a curve flattens.

import { round, sum } from "../../core/sample-data";
import { cohortRetention } from "../population";
import {
  activationCounts,
  ahaShare,
  curves,
  DAY_FACTOR,
  segments,
  segmentSignups,
} from "./activity";
import { HISTORY, ruleFor } from "./shared";

/**
 * A weekly signup cohort's retention, week by week since signup, for the
 * platform and plan filter: each segment's cohort simulated from its signup
 * days to today, then added up by size.
 */
export function cohort(platform: string, plan: string, startAgo: number) {
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
export const BRACKETS: [number, number][] = [
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
export function retentionRow(
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

export const retentionRule = (
  mode: "exact" | "unbounded" | "bracket",
  unit: "user" | "workspace",
) => {
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

/** Team activation: new workspaces with 3+ members active in 14 days (our model of it). */
export const teamReach = (c: { aha: number; signed: number }) =>
  Math.min(0.8, (c.aha / c.signed) * 1.45);
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
export const retentionCurve = (platform: string, plan: string, weeks: number) =>
  cohort(platform, plan, (weeks + 1) * 7 - 1)
    .all.slice(0, weeks + 1)
    .map((v) => round(v * 100, 1));
